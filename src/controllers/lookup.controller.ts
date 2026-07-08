import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { BadRequestError } from '../utils/AppError';
import * as lookup from '../services/lookup.service';

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
  const data = await lookup.getRegistrationType(registrationNo);
  return sendSuccess(res, data);
});

/** POST /lookup/sync — trigger a full reference sync from FBR */
export const syncAll = asyncHandler(async (_req: Request, res: Response) => {
  const counts = await lookup.syncAll();
  return sendSuccess(res, counts, 'Reference data synced');
});

/** POST /lookup/sync/:kind — sync one dataset */
export const syncOne = asyncHandler(async (req: Request, res: Response) => {
  const kind = req.params.kind as string;
  let count = 0;
  switch (kind) {
    case 'provinces':
      count = await lookup.syncProvinces();
      break;
    case 'doc-types':
      count = await lookup.syncDocTypes();
      break;
    case 'hs-codes':
      count = await lookup.syncHsCodes();
      break;
    case 'uoms':
      count = await lookup.syncUoms();
      break;
    case 'transaction-types':
      count = await lookup.syncTransactionTypes();
      break;
    case 'sros':
      count = await lookup.syncSros();
      break;
    case 'rates':
      count = await lookup.syncRates(
        req.body?.transTypeId,
        req.body?.originationSupplier,
        req.body?.date,
      );
      break;
    default:
      throw new BadRequestError(`Unknown sync kind: ${kind}`);
  }
  return sendSuccess(res, { kind, count }, `${kind} synced`);
});
