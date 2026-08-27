import Joi from 'joi';
import { HS_CODE_PATTERN } from '../constants/fbr';

const hsCodeField = Joi.string()
  .trim()
  .pattern(HS_CODE_PATTERN, 'HS code in NNNN.NNNN format');

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  itemType: Joi.string().trim().max(50).allow(null, '').optional(),
  itemCategory: Joi.string().trim().max(100).allow(null, '').optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  hsCode: hsCodeField.required(),
  uom: Joi.string().trim().max(100).required(),
  saleType: Joi.string().trim().max(150).required(),
  rate: Joi.string().trim().max(50).required(),
  rateId: Joi.string().trim().max(50).allow(null, '').optional(),
  rateValue: Joi.number().min(0).precision(2).default(0),
  taxDescription: Joi.string().trim().max(255).allow(null, '').optional(),
  sroScheduleNo: Joi.string().trim().max(100).allow(null, '').optional(),
  sroItemSerialNo: Joi.string().trim().max(50).allow(null, '').optional(),
  unitPrice: Joi.number().min(0).precision(4).default(0),
  assessedUnitCost: Joi.number().min(0).precision(4).allow(null).optional(),
  salesPrice: Joi.number().min(0).precision(4).allow(null).optional(),
  fixedNotifiedValueOrRetailPrice: Joi.number().min(0).precision(4).default(0),
  printUom: Joi.string().trim().max(50).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  isActive: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  itemType: Joi.string().trim().max(50).allow(null, '').optional(),
  itemCategory: Joi.string().trim().max(100).allow(null, '').optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
  hsCode: hsCodeField.optional(),
  uom: Joi.string().trim().max(100).optional(),
  saleType: Joi.string().trim().max(150).optional(),
  rate: Joi.string().trim().max(50).optional(),
  rateId: Joi.string().trim().max(50).allow(null, '').optional(),
  rateValue: Joi.number().min(0).precision(2).optional(),
  taxDescription: Joi.string().trim().max(255).allow(null, '').optional(),
  sroScheduleNo: Joi.string().trim().max(100).allow(null, '').optional(),
  sroItemSerialNo: Joi.string().trim().max(50).allow(null, '').optional(),
  unitPrice: Joi.number().min(0).precision(4).optional(),
  assessedUnitCost: Joi.number().min(0).precision(4).allow(null).optional(),
  salesPrice: Joi.number().min(0).precision(4).allow(null).optional(),
  fixedNotifiedValueOrRetailPrice: Joi.number().min(0).precision(4).optional(),
  printUom: Joi.string().trim().max(50).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
