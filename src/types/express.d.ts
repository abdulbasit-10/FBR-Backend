/**
 * Global type augmentations.
 * Extends Express Request so `req.user` is strongly typed everywhere.
 */


export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  name: string;
  companyId: number | null;
  roleId: number;
  roleName: string;
  permissions: string[];
  /** Refresh token id used to obtain this session (present on refresh flow) */
  refreshTokenId?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export {};
