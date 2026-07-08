import { NextFunction, Request, Response } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global Express error handler.
 * Must have 4 arguments so Express recognises it as an error middleware.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  // Known operational errors
  if (err instanceof AppError) {
    logger.warn(`[AppError] ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
      details: err.details,
    });
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // Sequelize unique constraint (e.g. duplicate email)
  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields ?? {});
    return sendError(
      res,
      `Duplicate value for: ${fields.join(', ')}`,
      StatusCodes.CONFLICT,
      err.errors.map((e) => ({ field: e.path, message: e.message })),
    );
  }

  // Sequelize validation
  if (err instanceof SequelizeValidationError) {
    return sendError(
      res,
      'Validation failed',
      StatusCodes.UNPROCESSABLE_ENTITY,
      err.errors.map((e) => ({ field: e.path, message: e.message })),
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', StatusCodes.UNAUTHORIZED);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', StatusCodes.UNAUTHORIZED);
  }

  // Unknown / programmer error — do not leak details in production
  logger.error(`[UnhandledError] ${err.message}`, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return sendError(
    res,
    config.env === 'production' ? ReasonPhrases.INTERNAL_SERVER_ERROR : err.message,
    StatusCodes.INTERNAL_SERVER_ERROR,
    config.env === 'production' ? undefined : { stack: err.stack },
  );
};

/** 404 handler for unmatched routes */
export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, StatusCodes.NOT_FOUND);
};
