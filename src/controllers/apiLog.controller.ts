import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as apiLogService from '../services/api-log.service';
import { UnauthorizedError } from '../utils/AppError';

const scope = (req: Request): number | null | undefined => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.roleName === 'SuperAdmin' ? undefined : req.user.companyId;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  const result = await apiLogService.listApiLogs({ ...req.query, companyId });
  return sendSuccess(res, result);
});

export const errors = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  const result = await apiLogService.listErrorLogs({ ...req.query, companyId });
  return sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const log = await apiLogService.getApiLog(req.params.uuid);
  return sendSuccess(res, log);
});
