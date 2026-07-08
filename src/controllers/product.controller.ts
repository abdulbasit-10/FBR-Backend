import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as productService from '../services/product.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(companyIdOf(req), req.query);
  return sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const p = await productService.getProductByUuid(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, p);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const p = await productService.createProduct(companyIdOf(req), req.body);
  return sendSuccess(res, p, 'Product created', StatusCodes.CREATED);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const p = await productService.updateProduct(req.params.uuid, companyIdOf(req), req.body);
  return sendSuccess(res, p, 'Product updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, null, 'Product deleted');
});
