import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { BadRequestError, UnauthorizedError } from '../utils/AppError';
import * as authService from '../services/auth.service';
import { verifyRefreshToken } from '../services/jwt.service';

const clientContext = (req: Request) => ({
  ipAddress: (req.ip ?? req.socket.remoteAddress ?? null) as string | null,
  userAgent: req.get('user-agent') ?? null,
});

/** POST /auth/login */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password, clientContext(req));
  return sendSuccess(res, result, 'Login successful');
});

/** POST /auth/refresh */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refresh(refreshToken, clientContext(req));
  return sendSuccess(res, result, 'Tokens refreshed');
});

/**
 * POST /auth/logout
 * Revokes the caller's current refresh token. Body: { refreshToken }
 * (We need the refresh token because access tokens don't identify a session.)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) throw new BadRequestError('refreshToken is required');

  const decoded = verifyRefreshToken(refreshToken);
  if (!req.user) throw new UnauthorizedError('Not authenticated');
  if (decoded.sub !== req.user.id) {
    throw new UnauthorizedError('Refresh token does not belong to the current session');
  }
  await authService.logout(decoded.jti);
  return sendSuccess(res, null, 'Logged out');
});

/** POST /auth/logout-all — revokes every active session for the user */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Not authenticated');
  const revoked = await authService.logoutAll(req.user.id);
  return sendSuccess(res, { revoked }, 'All sessions revoked');
});

/** GET /auth/me — current user */
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Not authenticated');
  const user = await authService.getCurrentUser(req.user.id);
  return sendSuccess(res, user, 'Current user');
});

/** POST /auth/change-password */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError('Not authenticated');
  const { oldPassword, newPassword } = req.body as {
    oldPassword: string;
    newPassword: string;
  };
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  return sendSuccess(
    res,
    null,
    'Password changed successfully. Please log in again on other devices.',
    StatusCodes.OK,
  );
});
