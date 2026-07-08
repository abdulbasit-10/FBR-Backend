import { Op, WhereOptions } from 'sequelize';
import { Company, CompanyAttributes, CompanyCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

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
  return Company.create(data);
};

export const updateCompany = async (
  id: number,
  data: Partial<CompanyAttributes>,
): Promise<Company> => {
  const company = await getCompanyById(id);
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
