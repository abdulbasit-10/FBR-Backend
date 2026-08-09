import Joi from 'joi';

export const createTicketSchema = Joi.object({
  title: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().max(5000).allow(null, '').optional(),
  category: Joi.string().max(100).allow(null, '').optional(),
  priority: Joi.string().valid('Low', 'Normal', 'High', 'Urgent').default('Normal'),
});

export const updateTicketSchema = Joi.object({
  title: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().max(5000).allow(null, '').optional(),
  category: Joi.string().max(100).allow(null, '').optional(),
  priority: Joi.string().valid('Low', 'Normal', 'High', 'Urgent').optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').optional(),
});
