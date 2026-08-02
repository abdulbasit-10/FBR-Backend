import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).required(),
  ntnCnic: Joi.string().trim().max(20).allow(null, '').optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').required(),
  customerType: Joi.string().valid('Individual', 'Company').default('Individual'),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
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
  ntnCnic: Joi.string().trim().max(20).allow(null, '').optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').optional(),
  customerType: Joi.string().valid('Individual', 'Company').optional(),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
  province: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().min(2).max(500).optional(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
