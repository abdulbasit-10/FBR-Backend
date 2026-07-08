import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as customerService from '../services/customer.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const companyIdOf = (req: Request): number => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return req.user.companyId;
};

/** GET /customers */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(companyIdOf(req), req.query);
  return sendSuccess(res, result);
});

/** GET /customers/:uuid */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomerByUuid(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, customer);
});

/** POST /customers */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(companyIdOf(req), req.body);
  return sendSuccess(res, customer, 'Customer created', StatusCodes.CREATED);
});

/** PUT /customers/:uuid */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(
    req.params.uuid,
    companyIdOf(req),
    req.body,
  );
  return sendSuccess(res, customer, 'Customer updated');
});

/** DELETE /customers/:uuid */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await customerService.deleteCustomer(req.params.uuid, companyIdOf(req));
  return sendSuccess(res, null, 'Customer deleted');
});
