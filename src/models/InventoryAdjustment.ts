import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type InventoryAdjustmentStatus = 'draft' | 'posted' | 'cancelled';

export interface InventoryAdjustmentAttributes {
  id: number;
  uuid: string;
  companyId: number;
  createdBy: number;
  adjustmentNo: string | null;
  docDate: string;
  postingDate: string | null;
  reason: string | null;
  source: 'Manual' | 'API' | 'Import';
  status: InventoryAdjustmentStatus;
  lines: number;
  lineTotal: number;
  postedAt: Date | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type InventoryAdjustmentCreationAttributes = Optional<
  InventoryAdjustmentAttributes,
  | 'id'
  | 'uuid'
  | 'adjustmentNo'
  | 'postingDate'
  | 'reason'
  | 'source'
  | 'status'
  | 'lines'
  | 'lineTotal'
  | 'postedAt'
  | 'notes'
>;

const decimalGetter = (field: keyof InventoryAdjustmentAttributes) =>
  function (this: InventoryAdjustment) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class InventoryAdjustment
  extends Model<InventoryAdjustmentAttributes, InventoryAdjustmentCreationAttributes>
  implements InventoryAdjustmentAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare createdBy: number;
  declare adjustmentNo: string | null;
  declare docDate: string;
  declare postingDate: string | null;
  declare reason: string | null;
  declare source: 'Manual' | 'API' | 'Import';
  declare status: InventoryAdjustmentStatus;
  declare lines: number;
  declare lineTotal: number;
  declare postedAt: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

InventoryAdjustment.init(
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
    adjustmentNo: { type: DataTypes.STRING(20), allowNull: true, field: 'adjustment_no' },
    docDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'doc_date' },
    postingDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'posting_date' },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    source: {
      type: DataTypes.ENUM('Manual', 'API', 'Import'),
      allowNull: false,
      defaultValue: 'Manual',
    },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    lines: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lineTotal: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'line_total',
      get: decimalGetter('lineTotal'),
    },
    postedAt: { type: DataTypes.DATE, allowNull: true, field: 'posted_at' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'InventoryAdjustment',
    tableName: 'inventory_adjustments',
    paranoid: true,
    indexes: [{ fields: ['company_id'] }, { fields: ['status'] }, { fields: ['doc_date'] }],
  },
);

export default InventoryAdjustment;
