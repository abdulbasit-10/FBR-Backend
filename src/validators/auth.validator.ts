import Joi from 'joi';

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[0-9]/, 'digit')
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain at least one {#name}',
  });

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(1).required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(10).required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(1).required(),
  newPassword: password.required(),
});
