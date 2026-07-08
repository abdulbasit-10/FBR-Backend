import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  roleId: Joi.number().integer().positive().required(),
  companyId: Joi.number().integer().positive().allow(null).optional(),
  isActive: Joi.boolean().default(true),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().trim().max(30).allow(null, '').optional(),
  roleId: Joi.number().integer().positive().optional(),
  companyId: Joi.number().integer().positive().allow(null).optional(),
  isActive: Joi.boolean().optional(),
});

export const resetUserPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(128).required(),
});

export const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(255).allow(null, '').optional(),
  permissionIds: Joi.array().items(Joi.number().integer().positive()).default([]),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().trim().max(255).allow(null, '').optional(),
  permissionIds: Joi.array().items(Joi.number().integer().positive()).optional(),
});
