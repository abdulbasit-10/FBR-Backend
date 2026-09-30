import { Op, WhereOptions } from 'sequelize';
import { Company, CompanyAttributes, CompanyCreationAttributes, FbrToken, User } from '../models';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

/**
 * A company can only be placed into (or kept in) Production/Both once it has a
 * saved, active production FBR token — otherwise invoice posting would fail at
 * the worst possible time. `companyId` is null when creating a brand-new
 * company, which by definition can never have a token yet, so Production is
 * always rejected at that point.
 */
const assertProductionTokenExists = async (
  companyId: number | null,
  fbrEnvironment: string | undefined,
): Promise<void> => {
  if (fbrEnvironment !== 'production' && fbrEnvironment !== 'both') return;
  const hasToken =
    companyId !== null &&
    (await FbrToken.count({ where: { companyId, environment: 'production', isActive: true } })) > 0;
  if (!hasToken) {
    throw new BadRequestError(
      'Cannot set FBR environment to Production until a valid, active production FBR token has been saved for this company.',
    );
  }
};

export const listCompanies = async (
  params: PaginationParams,
): Promise<PaginatedResult<Company>> => {
  const { page, limit, offset } = normalisePagination(params);
  const search = buildSearchWhere(params.search, ['name', 'businessName', 'ntn', 'province']);
  const { rows, count } = await Company.findAndCountAll({
    where: search,
    order: [
      [params.sortBy ?? 'createdAt', (params.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getCompanyById = async (id: number): Promise<Company> => {
  const company = await Company.findByPk(id);
  if (!company) throw new NotFoundError('Company not found');
  return company;
};

export const getCompanyByUuid = async (uuid: string): Promise<Company> => {
  const company = await Company.findOne({ where: { uuid } });
  if (!company) throw new NotFoundError('Company not found');
  return company;
};

export const createCompany = async (data: CompanyCreationAttributes): Promise<Company> => {
  await assertProductionTokenExists(null, data.fbrEnvironment);
  return Company.create(data);
};

export const updateCompany = async (
  id: number,
  data: Partial<CompanyAttributes>,
): Promise<Company> => {
  const company = await getCompanyById(id);
  // Only re-validate when the caller is actually touching fbrEnvironment — otherwise
  // an unrelated edit (e.g. address) would wrongly get blocked if a token later expired.
  if (data.fbrEnvironment !== undefined) {
    await assertProductionTokenExists(id, data.fbrEnvironment);
  }
  await company.update(data);
  return company;
};

export const deleteCompany = async (id: number): Promise<void> => {
  const company = await getCompanyById(id);
  await company.destroy();
};

/** Scoped fetch: assert caller can access this company. */
export const assertCompanyAccessible = async (
  companyId: number,
  callerCompanyId: number | null,
  isSuperAdmin: boolean,
): Promise<Company> => {
  const company = await getCompanyById(companyId);
  if (!isSuperAdmin && callerCompanyId !== company.id) {
    throw new NotFoundError('Company not found');
  }
  return company;
};

/** Scoped fetch by UUID: assert caller can access this company. */
export const assertCompanyAccessibleByUuid = async (
  uuid: string,
  callerCompanyId: number | null,
  isSuperAdmin: boolean,
): Promise<Company> => {
  const company = await getCompanyByUuid(uuid);
  if (!isSuperAdmin && callerCompanyId !== company.id) {
    throw new NotFoundError('Company not found');
  }
  return company;
};

/** Helper used elsewhere to constrain queries to caller's company. */
export const companyScope = (
  callerCompanyId: number | null,
  isSuperAdmin: boolean,
  requestedCompanyId?: number,
): WhereOptions => {
  if (isSuperAdmin) {
    return requestedCompanyId ? { company_id: requestedCompanyId } : {};
  }
  return { company_id: callerCompanyId ?? -1 };
};

/** Utility to detect duplicate NTN before create */
export const existsByNtn = async (ntn: string): Promise<boolean> => {
  const found = await Company.findOne({ where: { ntn: { [Op.eq]: ntn } } as WhereOptions });
  return !!found;
};

/** Platform-wide overview for the SuperAdmin dashboard. */
export const getPlatformStats = async () => {
  const [
    totalCompanies,
    activeCompanies,
    sandboxCompanies,
    productionCompanies,
    totalUsers,
    activeUsers,
    recentCompanies,
  ] = await Promise.all([
    Company.count(),
    Company.count({ where: { isActive: true } }),
    Company.count({ where: { fbrEnvironment: 'sandbox' } }),
    Company.count({ where: { fbrEnvironment: { [Op.in]: ['production', 'both'] } } }),
    User.count({ where: { companyId: { [Op.ne]: null as unknown as number } } }),
    User.count({ where: { companyId: { [Op.ne]: null as unknown as number }, isActive: true } }),
    Company.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'uuid', 'name', 'businessName', 'fbrEnvironment', 'isActive', 'createdAt'],
    }),
  ]);

  return {
    companies: {
      total: totalCompanies,
      active: activeCompanies,
      inactive: totalCompanies - activeCompanies,
      sandbox: sandboxCompanies,
      production: productionCompanies,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },
    recentCompanies,
  };
};
