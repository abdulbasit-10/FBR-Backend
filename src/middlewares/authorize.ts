import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

/**
 * RBAC guards. Compose after `authenticate` in the middleware chain:
 *
 *   router.post('/invoices', authenticate, authorize('invoice.create'), controller.create)
 *   router.get('/admin', authenticate, requireRole('SuperAdmin'), controller.x)
 *
 * Notes:
 *  - SuperAdmin is a system role that ALWAYS passes any authorize() check.
 *  - authorize() takes one or more permission strings; the user needs ALL of them (AND).
 *  - Use authorizeAny() for OR semantics.
 */

const SUPERADMIN = 'SuperAdmin';

const ensureAuthenticated = (req: Request): void => {
  if (!req.user) throw new UnauthorizedError('Authentication required');
};

/** User must possess ALL listed permissions. */
export const authorize =
  (...requiredPermissions: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      ensureAuthenticated(req);
      const user = req.user!;

      if (user.roleName === SUPERADMIN) return next();

      const missing = requiredPermissions.filter((p) => !user.permissions.includes(p));
      if (missing.length > 0) {
        throw new ForbiddenError(`Missing required permission(s): ${missing.join(', ')}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };

/** User must possess AT LEAST ONE of the listed permissions. */
export const authorizeAny =
  (...anyOf: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      ensureAuthenticated(req);
      const user = req.user!;
      if (user.roleName === SUPERADMIN) return next();

      const has = anyOf.some((p) => user.permissions.includes(p));
      if (!has) {
        throw new ForbiddenError(`Requires one of: ${anyOf.join(', ')}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };

/** Restrict to one or more roles by name. */
export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      ensureAuthenticated(req);
      const user = req.user!;
      if (!roles.includes(user.roleName)) {
        throw new ForbiddenError(`Requires role: ${roles.join(' or ')}`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };

/**
 * Multi-tenant guard.
 * Ensures a request scoped to `:companyId` (params) or body.companyId belongs
 * to the authenticated user's company. SuperAdmin bypasses this check.
 *
 * Also validates that non-SuperAdmin users have a companyId at all.
 */
export const requireSameCompany = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    ensureAuthenticated(req);
    const user = req.user!;
    if (user.roleName === SUPERADMIN) return next();

    if (user.companyId === null) {
      throw new ForbiddenError('Your account is not linked to a company');
    }

    const target =
      req.params.companyId ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req.body as any)?.companyId ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req.query as any)?.companyId;

    if (target !== undefined && Number(target) !== user.companyId) {
      throw new ForbiddenError('You cannot access resources of another company');
    }
    next();
  } catch (err) {
    next(err);
  }
};
