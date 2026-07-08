import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as companyService from '../services/company.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const isSuperAdmin = (req: Request): boolean => req.user?.roleName === 'SuperAdmin';

/** GET /companies */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  // Non-SuperAdmin can only see their own company
  if (!isSuperAdmin(req)) {
    if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
    const one = await companyService.getCompanyById(req.user.companyId);
    return sendSuccess(res, { rows: [one], meta: { total: 1, page: 1, limit: 1, totalPages: 1 } });
  }
  const result = await companyService.listCompanies(req.query);
  return sendSuccess(res, result);
});

/** GET /companies/:uuid */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const company = await companyService.assertCompanyAccessibleByUuid(
    req.params.uuid,
    req.user.companyId,
    isSuperAdmin(req),
  );
  return sendSuccess(res, company);
});

/** POST /companies — SuperAdmin only */
export const create = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.createCompany(req.body);
  return sendSuccess(res, company, 'Company created', StatusCodes.CREATED);
});

/** PUT /companies/:uuid */
export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const company = await companyService.assertCompanyAccessibleByUuid(
    req.params.uuid,
    req.user.companyId,
    isSuperAdmin(req),
  );
  const updated = await companyService.updateCompany(company.id, req.body);
  return sendSuccess(res, updated, 'Company updated');
});

/** DELETE /companies/:uuid — SuperAdmin only */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const company = await companyService.getCompanyByUuid(req.params.uuid);
  await companyService.deleteCompany(company.id);
  return sendSuccess(res, null, 'Company deleted');
});
