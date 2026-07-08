import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';
import * as settingService from '../services/setting.service';

const scope = (req: Request): number | null => {
  if (!req.user) throw new UnauthorizedError();
  if (req.user.roleName === 'SuperAdmin') {
    return (req.body?.companyId ?? req.query?.companyId)
      ? Number(req.body?.companyId ?? req.query?.companyId)
      : null;
  }
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  if (!companyId) throw new ForbiddenError('companyId required');
  const rows = await settingService.listCompanySettings(companyId);
  return sendSuccess(res, rows);
});

export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  const row = await settingService.upsertSetting({ ...req.body, companyId });
  return sendSuccess(res, row, 'Setting saved');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  await settingService.deleteSetting(req.params.uuid, companyId);
  return sendSuccess(res, null, 'Setting deleted');
});
