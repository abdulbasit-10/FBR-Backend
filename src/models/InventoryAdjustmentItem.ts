import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface InventoryAdjustmentItemAttributes {
  id: number;
  adjustmentId: number;
  productId: number | null;
  itemSrNo: number;
  productDescription: string;
  uom: string;
  quantity: number;
  unitCost: number;
  lineValue: number;
  reason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InventoryAdjustmentItemCreationAttributes = Optional<
  InventoryAdjustmentItemAttributes,
  'id' | 'productId' | 'unitCost' | 'lineValue' | 'reason'
>;

const decimalGetter = (field: keyof InventoryAdjustmentItemAttributes) =>
  function (this: InventoryAdjustmentItem) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class InventoryAdjustmentItem
  extends Model<InventoryAdjustmentItemAttributes, InventoryAdjustmentItemCreationAttributes>
  implements InventoryAdjustmentItemAttributes
{
  declare id: number;
  declare adjustmentId: number;
  declare productId: number | null;
  declare itemSrNo: number;
  declare productDescription: string;
  declare uom: string;
  declare quantity: number;
  declare unitCost: number;
  declare lineValue: number;
  declare reason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InventoryAdjustmentItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    adjustmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'adjustment_id',
    },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'product_id' },
    itemSrNo: { type: DataTypes.INTEGER, allowNull: false, field: 'item_sr_no' },
    productDescription: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'product_description',
    },
    uom: { type: DataTypes.STRING(100), allowNull: false },
    quantity: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      get: decimalGetter('quantity'),
    },
    unitCost: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_cost',
      get: decimalGetter('unitCost'),
    },
    lineValue: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'line_value',
      get: decimalGetter('lineValue'),
    },
    reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: 'InventoryAdjustmentItem',
    tableName: 'inventory_adjustment_items',
    paranoid: false,
    indexes: [{ fields: ['adjustment_id'] }, { fields: ['product_id'] }],
  },
);

export default InventoryAdjustmentItem;
