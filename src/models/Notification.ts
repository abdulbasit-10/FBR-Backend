import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAttributes {
  id: number;
  uuid: string;
  userId: number;
  companyId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: object | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'uuid' | 'companyId' | 'type' | 'link' | 'metadata' | 'isRead' | 'readAt'
>;

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare uuid: string;
  declare userId: number;
  declare companyId: number | null;
  declare type: NotificationType;
  declare title: string;
  declare message: string;
  declare link: string | null;
  declare metadata: object | null;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'user_id' },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'company_id' },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      allowNull: false,
      defaultValue: 'info',
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    paranoid: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'is_read'] },
      { fields: ['created_at'] },
    ],
  },
);

export default Notification;
