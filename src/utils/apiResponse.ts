import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
}

/** Standardised success response helper */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = StatusCodes.OK,
  meta?: Record<string, unknown>,
): Response<ApiResponse<T>> => {
  const payload: ApiResponse<T> = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/** Standardised error response helper */
export const sendError = (
  res: Response,
  message = 'Error',
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  errors?: unknown,
): Response<ApiResponse<null>> => {
  const payload: ApiResponse<null> = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  return res.status(statusCode).json(payload);
};
