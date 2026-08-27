import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export interface ProductAttributes {
  id: number;
  uuid: string;
  companyId: number;
  name: string;
  itemType: string | null;
  itemCategory: string | null;
  description: string | null;
  hsCode: string;
  uom: string;
  saleType: string;
  rate: string;
  rateId: string | null;
  rateValue: number;
  taxDescription: string | null;
  sroScheduleNo: string | null;
  sroItemSerialNo: string | null;
  unitPrice: number;
  assessedUnitCost: number | null;
  salesPrice: number | null;
  fixedNotifiedValueOrRetailPrice: number;
  printUom: string | null;
  mappingId: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type ProductCreationAttributes = Optional<
  ProductAttributes,
  | 'id'
  | 'uuid'
  | 'itemType'
  | 'itemCategory'
  | 'description'
  | 'taxDescription'
  | 'rateId'
  | 'sroScheduleNo'
  | 'sroItemSerialNo'
  | 'assessedUnitCost'
  | 'salesPrice'
  | 'fixedNotifiedValueOrRetailPrice'
  | 'printUom'
  | 'mappingId'
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
  declare itemType: string | null;
  declare itemCategory: string | null;
  declare description: string | null;
  declare hsCode: string;
  declare uom: string;
  declare saleType: string;
  declare rate: string;
  declare rateId: string | null;
  declare rateValue: number;
  declare taxDescription: string | null;
  declare sroScheduleNo: string | null;
  declare sroItemSerialNo: string | null;
  declare unitPrice: number;
  declare assessedUnitCost: number | null;
  declare salesPrice: number | null;
  declare fixedNotifiedValueOrRetailPrice: number;
  declare printUom: string | null;
  declare mappingId: string | null;
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
    itemType: { type: DataTypes.STRING(50), allowNull: true, field: 'item_type' },
    itemCategory: { type: DataTypes.STRING(100), allowNull: true, field: 'item_category' },
    description: { type: DataTypes.STRING(1000), allowNull: true },
    hsCode: { type: DataTypes.STRING(20), allowNull: false, field: 'hs_code' },
    uom: { type: DataTypes.STRING(100), allowNull: false },
    saleType: { type: DataTypes.STRING(150), allowNull: false, field: 'sale_type' },
    rate: { type: DataTypes.STRING(50), allowNull: false },
    rateId: { type: DataTypes.STRING(50), allowNull: true, field: 'rate_id' },
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
    taxDescription: { type: DataTypes.STRING(255), allowNull: true, field: 'tax_description' },
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
    assessedUnitCost: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      field: 'assessed_unit_cost',
      get() {
        const v = this.getDataValue('assessedUnitCost');
        return v === null ? null : parseFloat(v as unknown as string);
      },
    },
    salesPrice: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      field: 'sales_price',
      get() {
        const v = this.getDataValue('salesPrice');
        return v === null ? null : parseFloat(v as unknown as string);
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
    printUom: { type: DataTypes.STRING(50), allowNull: true, field: 'print_uom' },
    mappingId: { type: DataTypes.STRING(100), allowNull: true, field: 'mapping_id' },
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
