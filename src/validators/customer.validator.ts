import Joi from 'joi';
import { NTN_CNIC_PATTERN } from '../constants/fbr';

const ntnCnicField = Joi.string()
  .trim()
  .pattern(NTN_CNIC_PATTERN, 'NTN (7 digits) or CNIC (13 digits)');

export const createCustomerSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).required(),
  ntnCnic: Joi.when('registrationType', {
    is: 'Registered',
    then: ntnCnicField.required(),
    otherwise: ntnCnicField.allow(null, '').optional(),
  }),
  registrationType: Joi.string().valid('Registered', 'Unregistered').required(),
  customerType: Joi.string().valid('Individual', 'Company').default('Individual'),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
  province: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().min(2).max(500).required(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  contact: Joi.string().trim().max(50).allow(null, '').optional(),
  contactPerson: Joi.string().trim().max(255).allow(null, '').optional(),
  whatsapp: Joi.string().trim().max(30).allow(null, '').optional(),
  website: Joi.string().trim().max(255).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  isActive: Joi.boolean().default(true),
});

export const updateCustomerSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).optional(),
  ntnCnic: ntnCnicField.allow(null, '').optional(),
  registrationType: Joi.string().valid('Registered', 'Unregistered').optional(),
  customerType: Joi.string().valid('Individual', 'Company').optional(),
  strn: Joi.string().trim().max(20).allow(null, '').optional(),
  province: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().min(2).max(500).optional(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().email().lowercase().trim().allow(null, '').optional(),
  contact: Joi.string().trim().max(50).allow(null, '').optional(),
  contactPerson: Joi.string().trim().max(255).allow(null, '').optional(),
  whatsapp: Joi.string().trim().max(30).allow(null, '').optional(),
  website: Joi.string().trim().max(255).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
