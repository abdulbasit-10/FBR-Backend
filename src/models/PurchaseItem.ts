import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

export interface PurchaseItemAttributes {
  id: number;
  purchaseId: number;
  productId: number | null;
  itemSrNo: number;
  hsCode: string | null;
  productDescription: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  assessedPerUnit: number;
  retailPrice: number;
  discountPercent: number;
  discount: number;
  taxPercent: number;
  salesTaxApplicable: number;
  furtherTax: number;
  extraTax: number;
  fedPayable: number;
  valueExcludingST: number;
  valueIncludingST: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PurchaseItemCreationAttributes = Optional<
  PurchaseItemAttributes,
  | 'id'
  | 'productId'
  | 'hsCode'
  | 'unitPrice'
  | 'assessedPerUnit'
  | 'retailPrice'
  | 'discountPercent'
  | 'discount'
  | 'taxPercent'
  | 'salesTaxApplicable'
  | 'furtherTax'
  | 'extraTax'
  | 'fedPayable'
  | 'valueExcludingST'
  | 'valueIncludingST'
>;

const decimalGetter = (field: keyof PurchaseItemAttributes) =>
  function (this: PurchaseItem) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class PurchaseItem
  extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes>
  implements PurchaseItemAttributes
{
  declare id: number;
  declare purchaseId: number;
  declare productId: number | null;
  declare itemSrNo: number;
  declare hsCode: string | null;
  declare productDescription: string;
  declare uom: string;
  declare quantity: number;
  declare unitPrice: number;
  declare assessedPerUnit: number;
  declare retailPrice: number;
  declare discountPercent: number;
  declare discount: number;
  declare taxPercent: number;
  declare salesTaxApplicable: number;
  declare furtherTax: number;
  declare extraTax: number;
  declare fedPayable: number;
  declare valueExcludingST: number;
  declare valueIncludingST: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PurchaseItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    purchaseId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'purchase_id' },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'product_id' },
    itemSrNo: { type: DataTypes.INTEGER, allowNull: false, field: 'item_sr_no' },
    hsCode: { type: DataTypes.STRING(20), allowNull: true, field: 'hs_code' },
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
    unitPrice: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_price',
      get: decimalGetter('unitPrice'),
    },
    assessedPerUnit: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'assessed_per_unit',
      get: decimalGetter('assessedPerUnit'),
    },
    retailPrice: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'retail_price',
      get: decimalGetter('retailPrice'),
    },
    discountPercent: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'discount_percent',
      get: decimalGetter('discountPercent'),
    },
    discount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      get: decimalGetter('discount'),
    },
    taxPercent: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_percent',
      get: decimalGetter('taxPercent'),
    },
    salesTaxApplicable: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'sales_tax_applicable',
      get: decimalGetter('salesTaxApplicable'),
    },
    furtherTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'further_tax',
      get: decimalGetter('furtherTax'),
    },
    extraTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'extra_tax',
      get: decimalGetter('extraTax'),
    },
    fedPayable: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'fed_payable',
      get: decimalGetter('fedPayable'),
    },
    valueExcludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'value_excluding_st',
      get: decimalGetter('valueExcludingST'),
    },
    valueIncludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'value_including_st',
      get: decimalGetter('valueIncludingST'),
    },
  },
  {
    sequelize,
    modelName: 'PurchaseItem',
    tableName: 'purchase_items',
    paranoid: false,
    indexes: [{ fields: ['purchase_id'] }, { fields: ['product_id'] }],
  },
);

export default PurchaseItem;
