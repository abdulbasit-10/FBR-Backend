import { Vendor, VendorAttributes, VendorCreationAttributes } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

export interface VendorListParams extends PaginationParams {
  type?: string;
  registrationType?: string;
}

export const listVendors = async (
  companyId: number,
  params: VendorListParams,
): Promise<PaginatedResult<Vendor>> => {
  const { page, limit, offset } = normalisePagination(params);
  const search = buildSearchWhere(params.search, [
    'businessName',
    'ntnCnic',
    'strn',
    'vendorNo',
    'province',
    'email',
  ]);
  const where: Record<string, unknown> = { companyId, ...(search ?? {}) };
  if (params.type) where['vendorType'] = params.type;
  if (params.registrationType) where['registrationType'] = params.registrationType;
  const { rows, count } = await Vendor.findAndCountAll({
    where,
    order: [
      [params.sortBy ?? 'createdAt', (params.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getVendorByUuid = async (uuid: string, companyId: number): Promise<Vendor> => {
  const v = await Vendor.findOne({ where: { uuid, companyId } });
  if (!v) throw new NotFoundError('Vendor not found');
  return v;
};

export const createVendor = async (
  companyId: number,
  data: Omit<VendorCreationAttributes, 'companyId'>,
): Promise<Vendor> => {
  const last = await Vendor.findOne({
    where: { companyId },
    order: [['id', 'DESC']],
    attributes: ['vendorNo'],
    paranoid: false,
  });
  const lastNum = last?.vendorNo ? parseInt(last.vendorNo.replace('V-', ''), 10) || 0 : 0;
  const vendorNo = `V-${String(lastNum + 1).padStart(6, '0')}`;
  return Vendor.create({ ...data, companyId, vendorNo } as VendorCreationAttributes);
};

export const updateVendor = async (
  uuid: string,
  companyId: number,
  data: Partial<VendorAttributes>,
): Promise<Vendor> => {
  const v = await getVendorByUuid(uuid, companyId);
  await v.update(data);
  return v;
};

export const deleteVendor = async (uuid: string, companyId: number): Promise<void> => {
  const v = await getVendorByUuid(uuid, companyId);
  await v.destroy();
};
