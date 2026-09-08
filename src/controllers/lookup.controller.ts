import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/AppError';
import * as lookup from '../services/lookup.service';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const provinces = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listProvinces()),
);
export const docTypes = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listDocTypes()),
);
export const hsCodes = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const data = q ? await lookup.searchHsCodes(q) : await lookup.listHsCodes();
  return sendSuccess(res, data);
});
export const uoms = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listUoms()),
);
export const transactionTypes = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listTransactionTypes()),
);
export const sros = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listSros()),
);
export const rates = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await lookup.listRates()),
);

/** GET /lookup/registration-type?registrationNo=... — proxies FBR Get_Reg_Type */
export const registrationType = asyncHandler(async (req: Request, res: Response) => {
  const registrationNo = (req.query.registrationNo as string | undefined)?.trim();
  if (!registrationNo) throw new BadRequestError('registrationNo is required');
  const data = await lookup.getRegistrationTypeForCompany(companyIdOf(req), registrationNo);
  return sendSuccess(res, data);
});

/** GET /lookup/active-taxpayer-status?regno=...&date=... — proxies FBR STATL (§5.11) */
export const activeTaxpayerStatus = asyncHandler(async (req: Request, res: Response) => {
  const regno = (req.query.regno as string | undefined)?.trim();
  if (!regno) throw new BadRequestError('regno is required');
  const date = (req.query.date as string | undefined)?.trim() || new Date().toISOString().slice(0, 10);
  const data = await lookup.getActiveTaxpayerStatusForCompany(companyIdOf(req), regno, date);
  return sendSuccess(res, data);
});

/** GET /lookup/verify-registration?regno=...&date=... — combined Get_Reg_Type + STATL check */
export const verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
  const regno = (req.query.regno as string | undefined)?.trim();
  if (!regno) throw new BadRequestError('regno is required');
  const date = (req.query.date as string | undefined)?.trim() || undefined;
  const data = await lookup.verifyRegistration(companyIdOf(req), regno, date);
  return sendSuccess(res, data);
});

/** POST /lookup/sync — trigger a full reference sync from FBR */
export const syncAll = asyncHandler(async (req: Request, res: Response) => {
  const counts = await lookup.syncAll(companyIdOf(req));
  return sendSuccess(res, counts, 'Reference data synced');
});

/** POST /lookup/sync/:kind — sync one dataset */
export const syncOne = asyncHandler(async (req: Request, res: Response) => {
  const kind = req.params.kind as string;
  const token = await lookup.resolveCompanyToken(companyIdOf(req));
  let count = 0;
  switch (kind) {
    case 'provinces':
      count = await lookup.syncProvinces(token);
      break;
    case 'doc-types':
      count = await lookup.syncDocTypes(token);
      break;
    case 'hs-codes':
      count = await lookup.syncHsCodes(token);
      break;
    case 'uoms':
      count = await lookup.syncUoms(token);
      break;
    case 'transaction-types':
      count = await lookup.syncTransactionTypes(token);
      break;
    case 'sros':
      count = await lookup.syncSros(token);
      break;
    case 'rates':
      count = await lookup.syncRates(
        req.body?.transTypeId,
        req.body?.originationSupplier,
        req.body?.date,
        token,
      );
      break;
    default:
      throw new BadRequestError(`Unknown sync kind: ${kind}`);
  }
  return sendSuccess(res, { kind, count }, `${kind} synced`);
});

/** GET /lookup/sro-schedules?rateId=&date=&originationSupplier= — proxies FBR SroSchedule (§5.7) */
export const sroSchedules = asyncHandler(async (req: Request, res: Response) => {
  const rateId = Number(req.query.rateId);
  if (!Number.isFinite(rateId)) throw new BadRequestError('rateId is required');
  const date = (req.query.date as string | undefined)?.trim() || undefined;
  const originationSupplier = req.query.originationSupplier
    ? Number(req.query.originationSupplier)
    : undefined;
  const data = await lookup.getSroSchedulesForCompany(companyIdOf(req), rateId, date, originationSupplier);
  return sendSuccess(res, data);
});
