import Joi from 'joi';

/** Pagination + basic search + sort — reusable across list endpoints */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  search: Joi.string().trim().allow('').max(200).optional(),
  sortBy: Joi.string().max(60).optional(),
  sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const dateRangeSchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref('from')).optional(),
});
