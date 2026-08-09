import Joi from 'joi';

const itemSchema = Joi.object({
  productId: Joi.number().integer().positive().allow(null).optional(),
  productDescription: Joi.string().trim().min(1).max(500).required(),
  uom: Joi.string().trim().max(100).required(),
  quantity: Joi.number().required(),
  unitCost: Joi.number().min(0).default(0),
  reason: Joi.string().max(255).allow(null, '').optional(),
});

export const createAdjustmentSchema = Joi.object({
  docDate: Joi.date().iso().required(),
  postingDate: Joi.date().iso().allow(null, '').optional(),
  reason: Joi.string().max(255).allow(null, '').optional(),
  source: Joi.string().valid('Manual', 'API', 'Import').default('Manual'),
  notes: Joi.string().max(2000).allow(null, '').optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

export const adjustmentListQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
  status: Joi.string().valid('draft', 'posted', 'cancelled').optional(),
  source: Joi.string().valid('Manual', 'API', 'Import').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  search: Joi.string().max(200).allow('').optional(),
  sortBy: Joi.string().max(60).optional(),
  sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
});
