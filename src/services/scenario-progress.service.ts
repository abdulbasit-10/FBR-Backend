import { Op } from 'sequelize';
import { Company, Invoice } from '../models';
import { NotFoundError } from '../utils/AppError';
import { applicableScenarios, FBR_SCENARIO_DESCRIPTIONS } from '../constants/fbrScenarios';

export type ScenarioStatus = 'Successful' | 'Attempted' | 'Not Started';

export interface ScenarioProgressRow {
    scenarioId: string;
    description: string;
    status: ScenarioStatus;
    attempts: number;
    lastAttemptAt: string | null;
}

export interface ScenarioProgressResult {
    businessActivity: string | null;
    sector: string | null;
    environment: string;
    completed: number;
    total: number;
    productionReady: boolean;
    rows: ScenarioProgressRow[];
}

/**
 * FBR sandbox certification checklist: per the "Sandbox to Production" FAQ, a company
 * must post at least one SUCCESSFUL sandbox invoice for every scenario ID applicable to
 * its declared Business Activity + Sector before FBR will issue a Production Token.
 */
export const getScenarioProgress = async (companyId: number): Promise<ScenarioProgressResult> => {
    const company = await Company.findByPk(companyId);
    if (!company) throw new NotFoundError('Company not found');

    const scenarioIds = applicableScenarios(company.businessActivity, company.sector) ?? [];

    const invoices = scenarioIds.length
        ? await Invoice.findAll({
            where: {
                companyId,
                environment: 'sandbox',
                scenarioId: { [Op.in]: scenarioIds },
            },
            attributes: ['scenarioId', 'status', 'createdAt'],
        })
        : [];

    const byScenario = new Map<string, { successful: boolean; attempts: number; lastAt: Date | null }>();
    for (const id of scenarioIds) byScenario.set(id, { successful: false, attempts: 0, lastAt: null });
    for (const inv of invoices) {
        const entry = byScenario.get(inv.scenarioId as string);
        if (!entry) continue;
        entry.attempts += 1;
        if (inv.status === 'posted') entry.successful = true;
        if (!entry.lastAt || inv.createdAt > entry.lastAt) entry.lastAt = inv.createdAt;
    }

    const rows: ScenarioProgressRow[] = scenarioIds.map((id) => {
        const e = byScenario.get(id)!;
        return {
            scenarioId: id,
            description: FBR_SCENARIO_DESCRIPTIONS[id] ?? '',
            status: e.successful ? 'Successful' : e.attempts > 0 ? 'Attempted' : 'Not Started',
            attempts: e.attempts,
            lastAttemptAt: e.lastAt ? e.lastAt.toISOString() : null,
        };
    });

    const completed = rows.filter((r) => r.status === 'Successful').length;

    return {
        businessActivity: company.businessActivity,
        sector: company.sector,
        environment: company.fbrEnvironment,
        completed,
        total: rows.length,
        productionReady: rows.length > 0 && completed === rows.length,
        rows,
    };
};
