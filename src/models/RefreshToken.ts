import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface RefreshTokenAttributes {
  id: number;
  userId: number;
  tokenHash: string; // sha256 of refresh JWT (never store the raw token)
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefreshTokenCreationAttributes = Optional<
  RefreshTokenAttributes,
  'id' | 'revokedAt' | 'replacedByTokenId' | 'ipAddress' | 'userAgent'
>;

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: number;
  declare userId: number;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare replacedByTokenId: number | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public isActive(): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > Date.now();
  }
}

RefreshToken.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true, field: 'token_hash' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    revokedAt: { type: DataTypes.DATE, allowNull: true, field: 'revoked_at' },
    replacedByTokenId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'replaced_by_token_id',
    },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
    userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    paranoid: false,
    indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
  },
);

export default RefreshToken;
