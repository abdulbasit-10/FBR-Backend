import { Op, WhereOptions } from 'sequelize';
import { ApiLog } from '../models';
import { NotFoundError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

interface ApiLogFilters extends PaginationParams {
  direction?: 'inbound' | 'outbound';
  companyId?: number | null;
  invoiceId?: number;
  minStatus?: number; // e.g. 400 for error-only
  from?: Date | string;
  to?: Date | string;
}

export const listApiLogs = async (f: ApiLogFilters): Promise<PaginatedResult<ApiLog>> => {
  const { page, limit, offset } = normalisePagination(f);
  const where: WhereOptions = {};
  const w = where as Record<string, unknown>;
  if (f.direction) w.direction = f.direction;
  if (f.companyId !== undefined) w.companyId = f.companyId;
  if (f.invoiceId) w.invoiceId = f.invoiceId;
  if (f.minStatus) w.responseStatus = { [Op.gte]: f.minStatus };
  if (f.from || f.to) {
    const range: Record<symbol, unknown> = {};
    if (f.from) range[Op.gte] = new Date(f.from);
    if (f.to) range[Op.lte] = new Date(f.to);
    w.createdAt = range;
  }

  const { rows, count } = await ApiLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getApiLog = async (uuid: string): Promise<ApiLog> => {
  const log = await ApiLog.findOne({ where: { uuid } });
  if (!log) throw new NotFoundError('Log entry not found');
  return log;
};

/** Convenience for the error-logs UI: only 4xx/5xx entries. */
export const listErrorLogs = (f: Omit<ApiLogFilters, 'minStatus'>) =>
  listApiLogs({ ...f, minStatus: 400 });
