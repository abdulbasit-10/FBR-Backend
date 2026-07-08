import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type LogDirection = 'inbound' | 'outbound';

/**
 * Audit log for HTTP traffic:
 *  - inbound  = requests hitting our API
 *  - outbound = calls we make to FBR / PRAL
 *
 * Sensitive fields (bearer tokens, passwords) MUST be redacted before saving.
 */
export interface ApiLogAttributes {
  id: number;
  uuid: string;
  direction: LogDirection;
  companyId: number | null;
  userId: number | null;
  invoiceId: number | null;

  method: string;
  endpoint: string;
  requestHeaders: object | null;
  requestBody: object | null;
  responseStatus: number | null;
  responseBody: object | null;
  durationMs: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ApiLogCreationAttributes = Optional<
  ApiLogAttributes,
  | 'id'
  | 'uuid'
  | 'companyId'
  | 'userId'
  | 'invoiceId'
  | 'requestHeaders'
  | 'requestBody'
  | 'responseStatus'
  | 'responseBody'
  | 'durationMs'
  | 'ipAddress'
  | 'userAgent'
  | 'errorMessage'
>;

export class ApiLog
  extends Model<ApiLogAttributes, ApiLogCreationAttributes>
  implements ApiLogAttributes
{
  declare id: number;
  declare uuid: string;
  declare direction: LogDirection;
  declare companyId: number | null;
  declare userId: number | null;
  declare invoiceId: number | null;
  declare method: string;
  declare endpoint: string;
  declare requestHeaders: object | null;
  declare requestBody: object | null;
  declare responseStatus: number | null;
  declare responseBody: object | null;
  declare durationMs: number | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ApiLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    direction: { type: DataTypes.ENUM('inbound', 'outbound'), allowNull: false },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'company_id' },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'user_id' },
    invoiceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'invoice_id' },
    method: { type: DataTypes.STRING(10), allowNull: false },
    endpoint: { type: DataTypes.STRING(500), allowNull: false },
    requestHeaders: { type: DataTypes.JSON, allowNull: true, field: 'request_headers' },
    requestBody: { type: DataTypes.JSON, allowNull: true, field: 'request_body' },
    responseStatus: { type: DataTypes.INTEGER, allowNull: true, field: 'response_status' },
    responseBody: { type: DataTypes.JSON, allowNull: true, field: 'response_body' },
    durationMs: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_ms' },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
    userAgent: { type: DataTypes.STRING(500), allowNull: true, field: 'user_agent' },
    errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
  },
  {
    sequelize,
    modelName: 'ApiLog',
    tableName: 'api_logs',
    paranoid: false,
    indexes: [
      { fields: ['direction'] },
      { fields: ['company_id'] },
      { fields: ['user_id'] },
      { fields: ['invoice_id'] },
      { fields: ['created_at'] },
    ],
  },
);

export default ApiLog;
