import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  hsCode: Joi.string().trim().max(20).required(),
  uom: Joi.string().trim().max(100).required(),
  saleType: Joi.string().trim().max(150).required(),
  rate: Joi.string().trim().max(50).required(),
  rateValue: Joi.number().min(0).precision(2).default(0),
  sroScheduleNo: Joi.string().trim().max(100).allow(null, '').optional(),
  sroItemSerialNo: Joi.string().trim().max(50).allow(null, '').optional(),
  unitPrice: Joi.number().min(0).precision(4).default(0),
  fixedNotifiedValueOrRetailPrice: Joi.number().min(0).precision(4).default(0),
  isActive: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  hsCode: Joi.string().trim().max(20).optional(),
  uom: Joi.string().trim().max(100).optional(),
  saleType: Joi.string().trim().max(150).optional(),
  rate: Joi.string().trim().max(50).optional(),
  rateValue: Joi.number().min(0).precision(2).optional(),
  sroScheduleNo: Joi.string().trim().max(100).allow(null, '').optional(),
  sroItemSerialNo: Joi.string().trim().max(50).allow(null, '').optional(),
  unitPrice: Joi.number().min(0).precision(4).optional(),
  fixedNotifiedValueOrRetailPrice: Joi.number().min(0).precision(4).optional(),
  isActive: Joi.boolean().optional(),
});
