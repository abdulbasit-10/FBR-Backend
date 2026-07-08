import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as userService from '../services/user.service';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const scope = (req: Request): number | null | undefined => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.roleName === 'SuperAdmin' ? undefined : req.user.companyId;
};

// ---------- Users ----------

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const companyId = scope(req);
  const params = { ...req.query, companyId } as Record<string, unknown>;
  const result = await userService.listUsers(params);
  return sendSuccess(res, result);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const u = await userService.getUserByUuid(req.params.uuid, scope(req));
  return sendSuccess(res, u);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const body = { ...req.body };
  // Non-SuperAdmin can only create users within their own company
  if (req.user.roleName !== 'SuperAdmin') {
    if (!req.user.companyId) throw new ForbiddenError('No company linked to account');
    body.companyId = req.user.companyId;
  }
  const u = await userService.createUser(body);
  return sendSuccess(res, u, 'User created', StatusCodes.CREATED);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserByUuid(req.params.uuid, scope(req));
  const u = await userService.updateUser(user.id, scope(req), req.body);
  return sendSuccess(res, u, 'User updated');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserByUuid(req.params.uuid, scope(req));
  await userService.deleteUser(user.id, scope(req));
  return sendSuccess(res, null, 'User deleted');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserByUuid(req.params.uuid, scope(req));
  await userService.resetPassword(user.id, scope(req), req.body.newPassword);
  return sendSuccess(res, null, 'Password reset');
});

// ---------- Roles & Permissions ----------

export const listRoles = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await userService.listRoles()),
);

export const getRole = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await userService.getRoleByUuid(req.params.uuid)),
);

export const createRole = asyncHandler(async (req: Request, res: Response) =>
  sendSuccess(res, await userService.createRole(req.body), 'Role created', StatusCodes.CREATED),
);

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await userService.getRoleByUuid(req.params.uuid);
  return sendSuccess(res, await userService.updateRole(role.id, req.body), 'Role updated');
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await userService.getRoleByUuid(req.params.uuid);
  await userService.deleteRole(role.id);
  return sendSuccess(res, null, 'Role deleted');
});

export const listPermissions = asyncHandler(async (_req: Request, res: Response) =>
  sendSuccess(res, await userService.listPermissions()),
);
