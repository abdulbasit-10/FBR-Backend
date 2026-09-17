import { QueryTypes } from 'sequelize';
import { sequelize } from '../models';
import { NotFoundError } from '../utils/AppError';

/**
 * Generates a standalone SQL dump (INSERT statements only) containing everything
 * that belongs to one company — for handing a client their full data on offboarding.
 * SuperAdmin-only, enforced at the route level.
 */

// Tables with a direct company_id column.
const DIRECT_TABLES = [
    'companies', // filtered by id instead of company_id (it IS the company row)
    'users',
    'fbr_tokens',
    'customers',
    'vendors',
    'products',
    'invoices',
    'purchases',
    'inventory_adjustments',
    'api_logs',
    'settings',
    'notifications',
    'support_tickets',
];

// Child tables scoped via a parent's company_id (no company_id column of their own).
const CHILD_TABLES: { table: string; parentTable: string; fk: string }[] = [
    { table: 'invoice_items', parentTable: 'invoices', fk: 'invoice_id' },
    { table: 'invoice_logs', parentTable: 'invoices', fk: 'invoice_id' },
    { table: 'purchase_items', parentTable: 'purchases', fk: 'purchase_id' },
    { table: 'inventory_adjustment_items', parentTable: 'inventory_adjustments', fk: 'adjustment_id' },
];

const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const escaped = str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\0/g, '');
    return `'${escaped}'`;
};

const dumpRows = (
    tableName: string,
    rows: Record<string, unknown>[],
): string => {
    if (rows.length === 0) return `-- ${tableName}: 0 rows\n`;
    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `\`${c}\``).join(', ');
    const lines = rows.map((row) => {
        const values = columns.map((c) => escapeValue(row[c])).join(', ');
        return `INSERT INTO \`${tableName}\` (${colList}) VALUES (${values});`;
    });
    return `-- ${tableName}: ${rows.length} row(s)\n${lines.join('\n')}\n`;
};

export const exportCompanyDataSql = async (companyId: number): Promise<{ fileName: string; sql: string }> => {
    const [company] = await sequelize.query('SELECT * FROM `companies` WHERE `id` = :companyId', {
        replacements: { companyId },
        type: QueryTypes.SELECT,
        raw: true,
    }) as Record<string, unknown>[];
    if (!company) throw new NotFoundError('Company not found');

    const parts: string[] = [
        `-- Company data export`,
        `-- Company: ${String(company.business_name ?? company.name)} (id=${companyId})`,
        `-- Generated: ${new Date().toISOString()}`,
        `-- This file contains only this company's own data across every table it owns.`,
        `SET FOREIGN_KEY_CHECKS=0;`,
        '',
    ];

    for (const table of DIRECT_TABLES) {
        const whereCol = table === 'companies' ? 'id' : 'company_id';
        const rows = (await sequelize.query(
            `SELECT * FROM \`${table}\` WHERE \`${whereCol}\` = :companyId`,
            { replacements: { companyId }, type: QueryTypes.SELECT, raw: true },
        )) as Record<string, unknown>[];
        parts.push(dumpRows(table, rows));
    }

    for (const { table, parentTable, fk } of CHILD_TABLES) {
        const rows = (await sequelize.query(
            `SELECT child.* FROM \`${table}\` child
       INNER JOIN \`${parentTable}\` parent ON child.\`${fk}\` = parent.\`id\`
       WHERE parent.\`company_id\` = :companyId`,
            { replacements: { companyId }, type: QueryTypes.SELECT, raw: true },
        )) as Record<string, unknown>[];
        parts.push(dumpRows(table, rows));
    }

    parts.push('SET FOREIGN_KEY_CHECKS=1;');

    const safeName = String(company.business_name ?? company.name ?? 'company')
        .replace(/[^a-z0-9]+/gi, '_')
        .toLowerCase();
    const fileName = `${safeName}_export_${new Date().toISOString().slice(0, 10)}.sql`;

    return { fileName, sql: parts.join('\n') };
};
