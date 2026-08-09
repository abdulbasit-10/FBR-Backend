import Joi from 'joi';

export const createVendorSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).required(),
  ntnCnic: Joi.string().trim().max(20).allow(null, '').optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').required(),
  vendorType: Joi.string().valid('Individual', 'Company').default('Company'),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
  province: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().min(2).max(500).required(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  isActive: Joi.boolean().default(true),
});

export const updateVendorSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).optional(),
  ntnCnic: Joi.string().trim().max(20).allow(null, '').optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').optional(),
  vendorType: Joi.string().valid('Individual', 'Company').optional(),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
  province: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().min(2).max(500).optional(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
