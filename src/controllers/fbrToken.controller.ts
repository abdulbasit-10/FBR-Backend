import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { BadRequestError, UnauthorizedError } from '../utils/AppError';
import * as fbrTokens from '../services/fbr-token.service';

// These routes are SuperAdmin-only (enforced by requireRole('SuperAdmin') in the
// router), so the caller's own companyId is always null — the target company
// must always be named explicitly.
const requireCompany = (req: Request): { companyId: number; userId: number } => {
  if (!req.user) throw new UnauthorizedError();
  const requestedCompanyId = req.body?.companyId ?? req.query?.companyId;
  const companyId = requestedCompanyId ? Number(requestedCompanyId) : null;
  if (!companyId) throw new BadRequestError('companyId is required');
  return { companyId, userId: req.user.id };
};

/** GET /fbr-tokens */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireCompany(req);
  const rows = await fbrTokens.listTokensForCompany(companyId);
  return sendSuccess(
    res,
    rows.map((t) => ({
      id: t.id,
      uuid: t.uuid,
      companyId: t.companyId,
      environment: t.environment,
      issuedAt: t.issuedAt,
      expiresAt: t.expiresAt,
      isActive: t.isActive,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
    })),
  );
});

/** POST /fbr-tokens */
export const upsert = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireCompany(req);
  const row = await fbrTokens.upsertToken({
    companyId,
    environment: req.body.environment,
    token: req.body.token,
    expiresAt: req.body.expiresAt ?? null,
    createdBy: userId,
  });
  return sendSuccess(
    res,
    {
      id: row.id,
      uuid: row.uuid,
      environment: row.environment,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      isActive: row.isActive,
    },
    'FBR token saved',
    StatusCodes.CREATED,
  );
});

/** DELETE /fbr-tokens/:uuid */
export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireCompany(req);
  await fbrTokens.deactivateToken(req.params.uuid, companyId);
  return sendSuccess(res, null, 'FBR token deactivated');
});
