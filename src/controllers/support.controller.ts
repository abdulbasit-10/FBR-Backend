import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as svc from '../services/support.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const requireUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return { companyId: req.user.companyId, userId: req.user.id };
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.listTickets(companyId, req.query));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  return sendSuccess(res, await svc.getTicketByUuid(req.params.uuid, companyId));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const t = await svc.createTicket(companyId, userId, req.body);
  return sendSuccess(res, t, 'Ticket created', StatusCodes.CREATED);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const t = await svc.updateTicket(req.params.uuid, companyId, req.body);
  return sendSuccess(res, t, 'Ticket updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  await svc.deleteTicket(req.params.uuid, companyId);
  return sendSuccess(res, null, 'Ticket deleted');
});
