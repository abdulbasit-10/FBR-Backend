import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';
import { ValidationError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

/**
 * Joi validation middleware.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), controller.login)
 *   router.get('/users', validate(listSchema, 'query'), controller.list)
 *
 * On success it REPLACES `req[source]` with the coerced/stripped value.
 * On failure it forwards a ValidationError to the global error handler.
 */
export const validate =
  (schema: ObjectSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/["]/g, ''),
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[source] = value;
    next();
  };
