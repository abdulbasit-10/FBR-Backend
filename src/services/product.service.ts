import { Product, ProductAttributes, ProductCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

export const listProducts = async (
  companyId: number,
  params: PaginationParams,
): Promise<PaginatedResult<Product>> => {
  const { page, limit, offset } = normalisePagination(params);
  const search = buildSearchWhere(params.search, ['name', 'hsCode', 'uom', 'saleType']);
  const where = { companyId, ...(search ?? {}) };
  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [
      [params.sortBy ?? 'createdAt', (params.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getProduct = async (id: number, companyId: number): Promise<Product> => {
  const p = await Product.findOne({ where: { id, companyId } });
  if (!p) throw new NotFoundError('Product not found');
  return p;
};

export const getProductByUuid = async (uuid: string, companyId: number): Promise<Product> => {
  const p = await Product.findOne({ where: { uuid, companyId } });
  if (!p) throw new NotFoundError('Product not found');
  return p;
};

export const createProduct = async (
  companyId: number,
  data: Omit<ProductCreationAttributes, 'companyId'>,
): Promise<Product> => {
  return Product.create({ ...data, companyId } as ProductCreationAttributes);
};

export const updateProduct = async (
  uuid: string,
  companyId: number,
  data: Partial<ProductAttributes>,
): Promise<Product> => {
  const p = await getProductByUuid(uuid, companyId);
  await p.update(data);
  return p;
};

export const deleteProduct = async (uuid: string, companyId: number): Promise<void> => {
  const p = await getProductByUuid(uuid, companyId);
  await p.destroy();
};
