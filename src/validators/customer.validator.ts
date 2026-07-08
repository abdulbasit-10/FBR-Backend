import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).required(),
  ntnCnic: Joi.string()
    .pattern(/^\d{7}$|^\d{13}$/, 'NTN (7 digits) or CNIC (13 digits)')
    .allow(null, '')
    .optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').required(),
  province: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().min(2).max(500).required(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  isActive: Joi.boolean().default(true),
}).custom((value, helpers) => {
  if (value.registrationType === 'Registered' && !value.ntnCnic) {
    return helpers.error('any.custom', { message: 'ntnCnic is required for Registered buyers' });
  }
  return value;
});

export const updateCustomerSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).optional(),
  ntnCnic: Joi.string()
    .pattern(/^\d{7}$|^\d{13}$/, 'NTN (7 digits) or CNIC (13 digits)')
    .allow(null, '')
    .optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').optional(),
  province: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().min(2).max(500).optional(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
