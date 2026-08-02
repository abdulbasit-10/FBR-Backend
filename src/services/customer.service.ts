import { Customer, CustomerAttributes, CustomerCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

export interface CustomerListParams extends PaginationParams {
  type?: string;
  registrationType?: string;
}

export const listCustomers = async (
  companyId: number,
  params: CustomerListParams,
): Promise<PaginatedResult<Customer>> => {
  const { page, limit, offset } = normalisePagination(params);
  const search = buildSearchWhere(params.search, [
    'businessName',
    'ntnCnic',
    'strn',
    'customerNo',
    'province',
    'email',
  ]);
  const where: Record<string, unknown> = { companyId, ...(search ?? {}) };
  if (params.type) where['customerType'] = params.type;
  if (params.registrationType) where['registrationType'] = params.registrationType;
  const { rows, count } = await Customer.findAndCountAll({
    where,
    order: [
      [params.sortBy ?? 'createdAt', (params.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getCustomer = async (id: number, companyId: number): Promise<Customer> => {
  const c = await Customer.findOne({ where: { id, companyId } });
  if (!c) throw new NotFoundError('Customer not found');
  return c;
};

export const getCustomerByUuid = async (uuid: string, companyId: number): Promise<Customer> => {
  const c = await Customer.findOne({ where: { uuid, companyId } });
  if (!c) throw new NotFoundError('Customer not found');
  return c;
};

export const createCustomer = async (
  companyId: number,
  data: Omit<CustomerCreationAttributes, 'companyId'>,
): Promise<Customer> => {
  const last = await Customer.findOne({
    where: { companyId },
    order: [['id', 'DESC']],
    attributes: ['customerNo'],
    paranoid: false,
  });
  const lastNum = last?.customerNo ? parseInt(last.customerNo.replace('C-', ''), 10) || 0 : 0;
  const customerNo = `C-${String(lastNum + 1).padStart(6, '0')}`;
  return Customer.create({ ...data, companyId, customerNo } as CustomerCreationAttributes);
};

export const updateCustomer = async (
  uuid: string,
  companyId: number,
  data: Partial<CustomerAttributes>,
): Promise<Customer> => {
  const c = await getCustomerByUuid(uuid, companyId);
  await c.update(data);
  return c;
};

export const deleteCustomer = async (uuid: string, companyId: number): Promise<void> => {
  const c = await getCustomerByUuid(uuid, companyId);
  await c.destroy();
};
