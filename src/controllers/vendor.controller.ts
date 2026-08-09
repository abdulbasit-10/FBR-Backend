import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as vendorService from '../services/vendor.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await vendorService.listVendors(companyIdOf(req), req.query);
  return sendSuccess(res, result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.getVendorByUuid(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, vendor);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.createVendor(companyIdOf(req), req.body);
  return sendSuccess(res, vendor, 'Vendor created', StatusCodes.CREATED);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const vendor = await vendorService.updateVendor(req.params.uuid, companyIdOf(req), req.body);
  return sendSuccess(res, vendor, 'Vendor updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await vendorService.deleteVendor(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, null, 'Vendor deleted');
});
