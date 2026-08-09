import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as purchaseService from '../services/purchase.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const requireUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return { companyId: req.user.companyId, userId: req.user.id };
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const result = await purchaseService.listPurchases(companyId, req.query);
  return sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const purchase = await purchaseService.getPurchaseByUuid(req.params.uuid, companyId);
  return sendSuccess(res, purchase);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const purchase = await purchaseService.createPurchase(companyId, userId, req.body);
  return sendSuccess(res, purchase, 'Purchase created', StatusCodes.CREATED);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const purchase = await purchaseService.updatePurchase(req.params.uuid, companyId, req.body);
  return sendSuccess(res, purchase, 'Purchase updated');
});

export const post = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const purchase = await purchaseService.postPurchase(req.params.uuid, companyId);
  return sendSuccess(res, purchase, 'Purchase posted');
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const purchase = await purchaseService.cancelPurchase(req.params.uuid, companyId);
  return sendSuccess(res, purchase, 'Purchase cancelled');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  await purchaseService.deletePurchase(req.params.uuid, companyId);
  return sendSuccess(res, null, 'Purchase deleted');
});
