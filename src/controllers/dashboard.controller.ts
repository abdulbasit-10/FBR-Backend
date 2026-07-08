import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as dashboardService from '../services/dashboard.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

/** GET /dashboard */
export const get = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  const data = await dashboardService.getDashboard(req.user.companyId);
  return sendSuccess(res, data);
});
