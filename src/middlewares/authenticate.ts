import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/AppError';
import { verifyAccessToken } from '../services/jwt.service';
import type { AuthUser } from '../types/express';

/**
 * Authenticates the incoming request via `Authorization: Bearer <access-token>`.
 * On success, populates `req.user` and calls next().
 *
 * NOTE: This middleware trusts the JWT payload for authorization data
 * (roleName, permissions). Access tokens are short-lived (default 15m), so
 * revoked/updated permissions take effect after the next refresh.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedError('Access token is empty');

    const payload = verifyAccessToken(token);

    const user: AuthUser = {
      id: payload.sub,
      uuid: payload.uuid,
      email: payload.email,
      name: payload.name,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions ?? [],
    };
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth: attaches req.user if a valid token is present, else continues.
 * Useful for endpoints that behave slightly differently for logged-in users.
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    req.user = {
      id: payload.sub,
      uuid: payload.uuid,
      email: payload.email,
      name: payload.name,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleName: payload.roleName,
      permissions: payload.permissions ?? [],
    };
  } catch {
    // ignore — treat as anonymous
  }
  next();
};
