import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';
import { decrypt, encrypt } from '../utils/encryption';

export type TokenEnvironment = 'sandbox' | 'production';

/**
 * FBR bearer tokens per company per environment.
 * Only one "isActive=true" record per (company, environment) — enforced in service layer.
 * The raw token is encrypted at rest with AES-256-GCM.
 */
export interface FbrTokenAttributes {
  id: number;
  uuid: string;
  companyId: number;
  environment: TokenEnvironment;
  tokenEncrypted: string;
  issuedAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FbrTokenCreationAttributes = Optional<
  FbrTokenAttributes,
  'id' | 'uuid' | 'issuedAt' | 'expiresAt' | 'isActive' | 'createdBy'
>;

export class FbrToken
  extends Model<FbrTokenAttributes, FbrTokenCreationAttributes>
  implements FbrTokenAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare environment: TokenEnvironment;
  declare tokenEncrypted: string;
  declare issuedAt: Date | null;
  declare expiresAt: Date | null;
  declare isActive: boolean;
  declare createdBy: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /** Decrypt and return the raw bearer token. Use sparingly. */
  public getPlaintextToken(): string {
    return decrypt(this.tokenEncrypted);
  }

  /** Set token by encrypting the raw string. */
  public setPlaintextToken(raw: string): void {
    this.tokenEncrypted = encrypt(raw);
  }
}

FbrToken.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    environment: {
      type: DataTypes.ENUM('sandbox', 'production'),
      allowNull: false,
    },
    tokenEncrypted: { type: DataTypes.TEXT, allowNull: false, field: 'token_encrypted' },
    issuedAt: { type: DataTypes.DATE, allowNull: true, field: 'issued_at' },
    expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'created_by' },
  },
  {
    sequelize,
    modelName: 'FbrToken',
    tableName: 'fbr_tokens',
    paranoid: false,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['company_id', 'environment'] },
      { fields: ['is_active'] },
    ],
  },
);

export default FbrToken;
