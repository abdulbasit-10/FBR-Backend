import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export type InvoiceLogEvent =
  'created' | 'updated' | 'validated' | 'posted' | 'failed' | 'retried' | 'cancelled' | 'queued';

/**
 * Audit / history entries for each invoice. Records every state
 * transition plus FBR call outcomes so the UI can render a timeline.
 */
export interface InvoiceLogAttributes {
  id: number;
  invoiceId: number;
  userId: number | null;
  event: InvoiceLogEvent;
  fromStatus: string | null;
  toStatus: string | null;
  message: string | null;
  payload: object | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InvoiceLogCreationAttributes = Optional<
  InvoiceLogAttributes,
  'id' | 'userId' | 'fromStatus' | 'toStatus' | 'message' | 'payload'
>;

export class InvoiceLog
  extends Model<InvoiceLogAttributes, InvoiceLogCreationAttributes>
  implements InvoiceLogAttributes
{
  declare id: number;
  declare invoiceId: number;
  declare userId: number | null;
  declare event: InvoiceLogEvent;
  declare fromStatus: string | null;
  declare toStatus: string | null;
  declare message: string | null;
  declare payload: object | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InvoiceLog.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    invoiceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'invoice_id' },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'user_id' },
    event: {
      type: DataTypes.ENUM(
        'created',
        'updated',
        'validated',
        'posted',
        'failed',
        'retried',
        'cancelled',
        'queued',
      ),
      allowNull: false,
    },
    fromStatus: { type: DataTypes.STRING(20), allowNull: true, field: 'from_status' },
    toStatus: { type: DataTypes.STRING(20), allowNull: true, field: 'to_status' },
    message: { type: DataTypes.TEXT, allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
  },
  {
    sequelize,
    modelName: 'InvoiceLog',
    tableName: 'invoice_logs',
    paranoid: false,
    indexes: [{ fields: ['invoice_id'] }, { fields: ['event'] }, { fields: ['created_at'] }],
  },
);

export default InvoiceLog;
