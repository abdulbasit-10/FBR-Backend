import { FbrToken } from '../models';
import { NotFoundError } from '../utils/AppError';

export type TokenEnv = 'sandbox' | 'production';

/**
 * Returns the ACTIVE FBR bearer token for a company + environment.
 * Throws if no active token is configured.
 */
export const getActiveTokenForCompany = async (
  companyId: number,
  environment: TokenEnv,
): Promise<string> => {
  const token = await FbrToken.findOne({
    where: { companyId, environment, isActive: true },
    order: [['created_at', 'DESC']],
  });
  if (!token) {
    throw new NotFoundError(
      `No active FBR ${environment} token configured for company #${companyId}`,
    );
  }
  return token.getPlaintextToken();
};

/**
 * Upsert a token: deactivates existing active tokens for this
 * (company, environment) then inserts a new active row.
 */
export const upsertToken = async (params: {
  companyId: number;
  environment: TokenEnv;
  token: string;
  expiresAt?: Date | null;
  createdBy?: number | null;
}): Promise<FbrToken> => {
  await FbrToken.update(
    { isActive: false },
    { where: { companyId: params.companyId, environment: params.environment, isActive: true } },
  );
  const row = FbrToken.build({
    companyId: params.companyId,
    environment: params.environment,
    tokenEncrypted: '', // placeholder before setPlaintextToken
    issuedAt: new Date(),
    expiresAt: params.expiresAt ?? null,
    isActive: true,
    createdBy: params.createdBy ?? null,
  });
  row.setPlaintextToken(params.token);
  await row.save();
  return row;
};

export const listTokensForCompany = async (companyId: number): Promise<FbrToken[]> =>
  FbrToken.findAll({
    where: { companyId },
    order: [['created_at', 'DESC']],
  });

export const deactivateToken = async (uuid: string, companyId: number): Promise<void> => {
  const row = await FbrToken.findOne({ where: { uuid, companyId } });
  if (!row) throw new NotFoundError('FBR token not found');
  row.isActive = false;
  await row.save();
};
