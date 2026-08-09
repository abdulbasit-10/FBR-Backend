import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as svc from '../services/ledger.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const itemLedger = asyncHandler(async (req: Request, res: Response) => {
  const rows = await svc.getItemLedger(companyIdOf(req), req.query);
  return sendSuccess(res, rows);
});
