import Joi from 'joi';
import { FBR_BUSINESS_ACTIVITIES, FBR_SECTORS } from '../constants/fbrScenarios';

export const createCompanySchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  businessName: Joi.string().trim().min(2).max(255).required(),
  ntn: Joi.string()
    .pattern(/^\d{7}$|^\d{13}$/, 'NTN (7 digits) or CNIC (13 digits)')
    .required(),
  address: Joi.string().trim().min(2).max(500).required(),
  province: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  salesTaxRegNo: Joi.string().trim().max(50).allow(null, '').optional(),
  businessActivity: Joi.string().valid(...FBR_BUSINESS_ACTIVITIES).allow(null, '').optional(),
  sector: Joi.string().valid(...FBR_SECTORS).allow(null, '').optional(),
  fbrEnvironment: Joi.string().valid('sandbox', 'production', 'both').default('sandbox'),
  isActive: Joi.boolean().default(true),
});

export const updateCompanySchema = createCompanySchema.fork(
  Object.keys(createCompanySchema.describe().keys),
  (s) => s.optional(),
);
