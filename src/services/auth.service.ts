import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { RefreshToken, Role, User, Permission } from '../models';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/AppError';
import config from '../config';
import logger from '../utils/logger';
import {
  AccessTokenPayload,
  getRefreshTokenExpiryDate,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface SafeUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  companyId: number | null;
  role: { id: number; name: string };
  permissions: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
}

interface ClientContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

// ---------- Internal helpers ----------

const loadUserWithRoleAndPermissions = async (userId: number): Promise<User> => {
  const user = await User.scope('withPassword').findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      },
    ],
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const toSafeUser = (user: User): SafeUser => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (user as any).role as
    { id: number; name: string; permissions?: { name: string }[] } | undefined;
  return {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    companyId: user.companyId,
    role: role ? { id: role.id, name: role.name } : { id: user.roleId, name: 'Unknown' },
    permissions: role?.permissions?.map((p) => p.name) ?? [],
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
};

const issueTokens = async (
  user: User,
  ctx: ClientContext,
  replacesTokenId?: number,
): Promise<AuthTokens> => {
  const safe = toSafeUser(user);

  // Create refresh_tokens row FIRST so we can embed its id (jti) in the JWT
  const refreshRow = await RefreshToken.create({
    userId: user.id,
    tokenHash: '', // filled below after we compute the JWT
    expiresAt: getRefreshTokenExpiryDate(),
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
    replacedByTokenId: null,
  });

  const refreshToken = signRefreshToken({ sub: user.id, jti: refreshRow.id });
  refreshRow.tokenHash = hashRefreshToken(refreshToken);
  await refreshRow.save();

  if (replacesTokenId) {
    await RefreshToken.update(
      { revokedAt: new Date(), replacedByTokenId: refreshRow.id },
      { where: { id: replacesTokenId } },
    );
  }

  const accessPayload: Omit<AccessTokenPayload, 'type'> = {
    sub: safe.id,
    uuid: safe.uuid,
    email: safe.email,
    name: safe.name,
    companyId: safe.companyId,
    roleId: safe.role.id,
    roleName: safe.role.name,
    permissions: safe.permissions,
  };
  const accessToken = signAccessToken(accessPayload);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: config.jwt.accessExpiresIn,
    refreshTokenExpiresIn: config.jwt.refreshExpiresIn,
  };
};

// ---------- Public API ----------

/** Authenticate with email/password → returns user + fresh token pair */
export const login = async (
  email: string,
  password: string,
  ctx: ClientContext = {},
): Promise<AuthResult> => {
  const user = await User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
    include: [
      {
        model: Role,
        as: 'role',
        include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      },
    ],
  });

  // Same message for both cases to avoid user enumeration
  if (!user) throw new UnauthorizedError('Invalid credentials');
  if (!user.isActive) throw new ForbiddenError('Account is inactive. Contact your administrator.');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new UnauthorizedError('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokens(user, ctx);
  return { user: toSafeUser(user), tokens };
};

/**
 * Exchange a refresh token for a new access + refresh pair.
 * Implements:
 *  - Signature + expiry validation
 *  - DB record lookup by jti + hash match (must be the SAME token)
 *  - Rotation (old row revoked, replaced_by_token_id set)
 *  - Theft detection: if a REVOKED token is presented, we revoke ALL of that
 *    user's tokens (a stolen token was replayed after rotation)
 */
export const refresh = async (
  presentedToken: string,
  ctx: ClientContext = {},
): Promise<AuthResult> => {
  const decoded = verifyRefreshToken(presentedToken);

  const dbToken = await RefreshToken.findByPk(decoded.jti);
  if (!dbToken || dbToken.userId !== decoded.sub) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // If the presented token was already revoked → possible theft. Nuke session.
  if (dbToken.revokedAt !== null) {
    logger.warn('Refresh token reuse detected — revoking all sessions', {
      userId: decoded.sub,
      tokenId: decoded.jti,
    });
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId: decoded.sub, revokedAt: null } },
    );
    throw new UnauthorizedError('Refresh token has been revoked. Please log in again.');
  }

  // Constant-time-ish comparison via hash equality
  if (dbToken.tokenHash !== hashRefreshToken(presentedToken)) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (dbToken.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await loadUserWithRoleAndPermissions(decoded.sub);
  if (!user.isActive) throw new ForbiddenError('Account is inactive.');

  const tokens = await issueTokens(user, ctx, dbToken.id);
  return { user: toSafeUser(user), tokens };
};

/** Revoke a specific refresh token (single-device logout) */
export const logout = async (refreshTokenId: number): Promise<void> => {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { id: refreshTokenId, revokedAt: null } },
  );
};

/** Revoke all active refresh tokens for a user (logout everywhere) */
export const logoutAll = async (userId: number): Promise<number> => {
  const [count] = await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
  return count;
};

/** Return the current user (fresh from DB, with permissions) */
export const getCurrentUser = async (userId: number): Promise<SafeUser> => {
  const user = await loadUserWithRoleAndPermissions(userId);
  return toSafeUser(user);
};

/** Change password: verify old, hash new, revoke all sessions */
export const changePassword = async (
  userId: number,
  oldPassword: string,
  newPassword: string,
): Promise<void> => {
  if (oldPassword === newPassword) {
    throw new BadRequestError('New password must be different from the old password');
  }

  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw new NotFoundError('User not found');

  const match = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!match) throw new UnauthorizedError('Current password is incorrect');

  user.passwordHash = await bcrypt.hash(newPassword, config.jwt.bcryptSaltRounds);
  await user.save();

  // Invalidate all existing sessions
  await RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
};

/** Housekeeping: delete refresh tokens that expired > 30 days ago */
export const purgeExpiredRefreshTokens = async (): Promise<number> => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return RefreshToken.destroy({ where: { expiresAt: { [Op.lt]: cutoff } } });
};
