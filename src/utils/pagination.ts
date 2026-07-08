import { Op, WhereOptions } from 'sequelize';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  rows: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Build Sequelize LIKE search over multiple string columns */
export const buildSearchWhere = (
  search: string | undefined,
  fields: string[],
): WhereOptions | undefined => {
  if (!search || !fields.length) return undefined;
  const term = `%${search.trim()}%`;
  return { [Op.or]: fields.map((f) => ({ [f]: { [Op.like]: term } })) } as WhereOptions;
};

/** Normalise page/limit with sensible defaults */
export const normalisePagination = (
  p: PaginationParams,
): { page: number; limit: number; offset: number } => {
  const page = Math.max(1, p.page ?? 1);
  const limit = Math.min(200, Math.max(1, p.limit ?? 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const paginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
