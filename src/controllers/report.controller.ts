import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as reportService from '../services/report.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const daily = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await reportService.dailyReport(companyIdOf(req), req.query as { from?: string; to?: string }),
  ),
);

export const monthly = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await reportService.monthlyReport(
      companyIdOf(req),
      req.query as { from?: string; to?: string },
    ),
  ),
);

export const tax = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await reportService.taxReport(companyIdOf(req), req.query as { from?: string; to?: string }),
  ),
);

export const sales = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(
    res,
    await reportService.salesReport(
      companyIdOf(req),
      req.query as { from?: string; to?: string; groupBy?: 'customer' | 'product' },
    ),
  ),
);
