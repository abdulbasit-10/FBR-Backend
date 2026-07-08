import jwt, { JwtPayload, SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { UnauthorizedError } from '../utils/AppError';

/**
 * JWT service — issues and verifies access & refresh tokens.
 *
 * Access token payload is deliberately lean but self-sufficient so the
 * authenticate middleware can authorize without a DB hit on every request.
 * Refresh tokens carry only { sub, jti } — the DB row (refresh_tokens) is
 * the source of truth and enables revocation + rotation + theft detection.
 */

export interface AccessTokenPayload {
  sub: number; // user id
  uuid: string;
  email: string;
  name: string;
  companyId: number | null;
  roleId: number;
  roleName: string;
  permissions: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number; // user id
  jti: number; // refresh_tokens.id
  type: 'refresh';
}

const accessSecret: Secret = config.jwt.accessSecret;
const refreshSecret: Secret = config.jwt.refreshSecret;

export const signAccessToken = (payload: Omit<AccessTokenPayload, 'type'>): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'access' }, accessSecret, options);
};

export const signRefreshToken = (payload: Omit<RefreshTokenPayload, 'type'>): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, type: 'refresh' }, refreshSecret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, accessSecret) as JwtPayload & AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Wrong token type');
    }
    return decoded;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = (err as any).name;
    if (name === 'TokenExpiredError') throw new UnauthorizedError('Access token expired');
    if (name === 'JsonWebTokenError') throw new UnauthorizedError('Invalid access token');
    throw err;
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, refreshSecret) as JwtPayload & RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Wrong token type');
    }
    return decoded;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = (err as any).name;
    if (name === 'TokenExpiredError') throw new UnauthorizedError('Refresh token expired');
    if (name === 'JsonWebTokenError') throw new UnauthorizedError('Invalid refresh token');
    throw err;
  }
};

/**
 * Deterministic hash of a refresh token for storage.
 * We NEVER store raw refresh tokens — only their SHA-256 hash so a DB leak
 * cannot be replayed against our auth endpoints.
 */
export const hashRefreshToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Parse a duration string like "15m", "7d", "1h" into milliseconds.
 * (Used to compute refresh token expiry Date for DB storage.)
 */
export const parseDurationToMs = (duration: string): number => {
  const match = /^(\d+)\s*(ms|s|m|h|d|w|y)$/.exec(duration.trim());
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
};

export const getRefreshTokenExpiryDate = (): Date =>
  new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn));
