import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as invoiceService from '../services/invoice.service';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../utils/AppError';

const requireUser = (req: Request) => {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
  return { companyId: req.user.companyId, userId: req.user.id };
};

/** GET /invoices */
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const result = await invoiceService.listInvoices(companyId, req.query);
  return sendSuccess(res, result);
});

/** GET /invoices/:uuid */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { companyId } = requireUser(req);
  const invoice = await invoiceService.getInvoiceByUuid(req.params.uuid, companyId);
  return sendSuccess(res, invoice);
});

/** POST /invoices */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const invoice = await invoiceService.createInvoice(companyId, userId, req.body);
  return sendSuccess(res, invoice, 'Invoice created', StatusCodes.CREATED);
});

/** PUT /invoices/:uuid */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const inv = await invoiceService.getInvoiceByUuid(req.params.uuid, companyId);
  const invoice = await invoiceService.updateInvoice(
    inv.id,
    companyId,
    userId,
    req.body,
  );
  return sendSuccess(res, invoice, 'Invoice updated');
});

/** DELETE /invoices/:uuid */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const inv = await invoiceService.getInvoiceByUuid(req.params.uuid, companyId);
  await invoiceService.deleteInvoice(inv.id, companyId, userId);
  return sendSuccess(res, null, 'Invoice deleted');
});

/** POST /invoices/:uuid/submit — synchronous submit to FBR */
export const submit = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const mode = ((req.body?.mode as string) ?? 'post') as 'validate' | 'post';
  if (mode !== 'validate' && mode !== 'post') {
    throw new BadRequestError('mode must be "validate" or "post"');
  }
  const inv = await invoiceService.getInvoiceByUuid(req.params.uuid, companyId);
  const invoice = await invoiceService.submitInvoice(
    inv.id,
    companyId,
    userId,
    mode,
  );
  return sendSuccess(res, invoice, `Invoice ${mode} completed`);
});

/** POST /invoices/:uuid/enqueue — asynchronous submit via queue (Module 14) */
export const enqueue = asyncHandler(async (req: Request, res: Response) => {
  const { companyId, userId } = requireUser(req);
  const mode = ((req.body?.mode as string) ?? 'post') as 'validate' | 'post';
  if (mode !== 'validate' && mode !== 'post') {
    throw new BadRequestError('mode must be "validate" or "post"');
  }
  const inv = await invoiceService.getInvoiceByUuid(req.params.uuid, companyId);
  const result = await invoiceService.enqueueInvoiceSubmit(
    inv.id,
    companyId,
    userId,
    mode,
  );
  return sendSuccess(res, result, 'Invoice queued', StatusCodes.ACCEPTED);
});
