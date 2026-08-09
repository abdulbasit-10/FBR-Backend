import Joi from 'joi';

const itemSchema = Joi.object({
  productId: Joi.number().integer().positive().allow(null).optional(),
  hsCode: Joi.string().trim().max(20).allow(null, '').optional(),
  productDescription: Joi.string().trim().min(1).max(500).required(),
  uom: Joi.string().trim().max(100).required(),
  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).default(0),
  assessedPerUnit: Joi.number().min(0).optional(),
  retailPrice: Joi.number().min(0).optional(),
  discountPercent: Joi.number().min(0).max(100).default(0),
  taxPercent: Joi.number().min(0).max(100).default(0),
});

export const createPurchaseSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
  purchaseType: Joi.string().valid('Purchase Invoice', 'Purchase Return').default('Purchase Invoice'),
  originalPurchaseUuid: Joi.string().uuid().allow(null, '').optional(),
  vendorInvoiceNo: Joi.string().trim().max(100).allow(null, '').optional(),
  docDate: Joi.date().iso().required(),
  postingDate: Joi.date().iso().allow(null, '').optional(),
  poDate: Joi.date().iso().allow(null, '').optional(),
  poNumber: Joi.string().trim().max(100).allow(null, '').optional(),
  advanceTax: Joi.number().min(0).default(0),
  source: Joi.string().valid('Manual', 'API', 'Import').default('Manual'),
  notes: Joi.string().max(2000).allow(null, '').optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

export const updatePurchaseSchema = Joi.object({
  vendorInvoiceNo: Joi.string().trim().max(100).allow(null, '').optional(),
  docDate: Joi.date().iso().optional(),
  postingDate: Joi.date().iso().allow(null, '').optional(),
  poDate: Joi.date().iso().allow(null, '').optional(),
  poNumber: Joi.string().trim().max(100).allow(null, '').optional(),
  notes: Joi.string().max(2000).allow(null, '').optional(),
});

export const purchaseListQuery = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
  status: Joi.string().valid('draft', 'posted', 'cancelled').optional(),
  purchaseType: Joi.string().valid('Purchase Invoice', 'Purchase Return').optional(),
  vendorId: Joi.number().integer().positive().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  search: Joi.string().max(200).allow('').optional(),
  sortBy: Joi.string().max(60).optional(),
  sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional(),
});
