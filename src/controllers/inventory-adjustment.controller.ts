import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as svc from '../services/inventory-adjustment.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const requireUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return { companyId: req.user.companyId, userId: req.user.id };
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.listAdjustments(companyId, req.query));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.getAdjustmentByUuid(req.params.uuid, companyId));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const adj = await svc.createAdjustment(companyId, userId, req.body);
  return sendSuccess(res, adj, 'Adjustment created', StatusCodes.CREATED);
});

export const post = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.postAdjustment(req.params.uuid, companyId), 'Adjustment posted');
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.cancelAdjustment(req.params.uuid, companyId), 'Adjustment cancelled');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  await svc.deleteAdjustment(req.params.uuid, companyId);
  return sendSuccess(res, null, 'Adjustment deleted');
});
