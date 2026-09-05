import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type SupportStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type SupportPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface SupportTicketAttributes {
  id: number;
  uuid: string;
  companyId: number;
  createdBy: number;
  ticketNo: string | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: SupportPriority;
  status: SupportStatus;
  resolvedAt: Date | null;
  attachmentUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type SupportTicketCreationAttributes = Optional<
  SupportTicketAttributes,
  | 'id'
  | 'uuid'
  | 'ticketNo'
  | 'description'
  | 'category'
  | 'priority'
  | 'status'
  | 'resolvedAt'
  | 'attachmentUrl'
>;

export class SupportTicket
  extends Model<SupportTicketAttributes, SupportTicketCreationAttributes>
  implements SupportTicketAttributes {
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare createdBy: number;
  declare ticketNo: string | null;
  declare title: string;
  declare description: string | null;
  declare category: string | null;
  declare priority: SupportPriority;
  declare status: SupportStatus;
  declare resolvedAt: Date | null;
  declare attachmentUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

SupportTicket.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'created_by' },
    ticketNo: { type: DataTypes.STRING(20), allowNull: true, field: 'ticket_no' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    priority: {
      type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
      allowNull: false,
      defaultValue: 'Normal',
    },
    status: {
      type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'),
      allowNull: false,
      defaultValue: 'Open',
    },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
    attachmentUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'attachment_url' },
  },
  {
    sequelize,
    modelName: 'SupportTicket',
    tableName: 'support_tickets',
    paranoid: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['status'] },
      { fields: ['created_by'] },
    ],
  },
);

export default SupportTicket;
