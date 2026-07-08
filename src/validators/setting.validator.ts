import Joi from 'joi';

export const upsertSettingSchema = Joi.object({
  key: Joi.string().trim().min(1).max(100).required(),
  value: Joi.any().required(),
  scope: Joi.string().valid('global', 'company', 'user').default('company'),
  description: Joi.string().trim().max(255).allow(null, '').optional(),
});

export const upsertFbrTokenSchema = Joi.object({
  environment: Joi.string().valid('sandbox', 'production').required(),
  token: Joi.string().trim().min(10).required(),
  expiresAt: Joi.date().iso().allow(null).optional(),
});
