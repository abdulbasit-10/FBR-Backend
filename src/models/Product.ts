import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export interface ProductAttributes {
  id: number;
  uuid: string;
  companyId: number;
  name: string;
  description: string | null;
  hsCode: string; // e.g. "0101.2100"
  uom: string; // e.g. "Numbers, pieces, units"
  saleType: string; // e.g. "Goods at standard rate (default)"
  rate: string; // e.g. "18%"
  rateValue: number; // e.g. 18.00 (for calculations)
  sroScheduleNo: string | null;
  sroItemSerialNo: string | null;
  unitPrice: number; // default sales value excl. ST
  fixedNotifiedValueOrRetailPrice: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type ProductCreationAttributes = Optional<
  ProductAttributes,
  | 'id'
  | 'uuid'
  | 'description'
  | 'sroScheduleNo'
  | 'sroItemSerialNo'
  | 'fixedNotifiedValueOrRetailPrice'
  | 'isActive'
>;

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare name: string;
  declare description: string | null;
  declare hsCode: string;
  declare uom: string;
  declare saleType: string;
  declare rate: string;
  declare rateValue: number;
  declare sroScheduleNo: string | null;
  declare sroItemSerialNo: string | null;
  declare unitPrice: number;
  declare fixedNotifiedValueOrRetailPrice: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(1000), allowNull: true },
    hsCode: { type: DataTypes.STRING(20), allowNull: false, field: 'hs_code' },
    uom: { type: DataTypes.STRING(100), allowNull: false },
    saleType: { type: DataTypes.STRING(150), allowNull: false, field: 'sale_type' },
    rate: { type: DataTypes.STRING(50), allowNull: false },
    rateValue: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'rate_value',
      get() {
        const v = this.getDataValue('rateValue');
        return v === null ? 0 : parseFloat(v as unknown as string);
      },
    },
    sroScheduleNo: { type: DataTypes.STRING(100), allowNull: true, field: 'sro_schedule_no' },
    sroItemSerialNo: { type: DataTypes.STRING(50), allowNull: true, field: 'sro_item_serial_no' },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_price',
      get() {
        const v = this.getDataValue('unitPrice');
        return v === null ? 0 : parseFloat(v as unknown as string);
      },
    },
    fixedNotifiedValueOrRetailPrice: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'fixed_notified_value_or_retail_price',
      get() {
        const v = this.getDataValue('fixedNotifiedValueOrRetailPrice');
        return v === null ? 0 : parseFloat(v as unknown as string);
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    paranoid: true,
    indexes: [{ fields: ['company_id'] }, { fields: ['hs_code'] }, { fields: ['is_active'] }],
  },
);

export default Product;
