import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

/**
 * Invoice line item. Mirrors the fields FBR expects in the items[] array
 * and stores the per-item FBR response (invoiceNo like "…-1").
 */
export interface InvoiceItemAttributes {
  id: number;
  invoiceId: number;
  productId: number | null; // snapshot; product may be edited later
  itemSrNo: number; // 1-based

  hsCode: string;
  productDescription: string;
  rate: string; // e.g. "18%"
  uom: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string | null;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string | null;

  // FBR per-item response
  fbrInvoiceNo: string | null;
  fbrStatusCode: string | null;
  fbrStatus: string | null;
  fbrErrorCode: string | null;
  fbrError: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type InvoiceItemCreationAttributes = Optional<
  InvoiceItemAttributes,
  | 'id'
  | 'productId'
  | 'totalValues'
  | 'fixedNotifiedValueOrRetailPrice'
  | 'salesTaxWithheldAtSource'
  | 'extraTax'
  | 'furtherTax'
  | 'sroScheduleNo'
  | 'fedPayable'
  | 'discount'
  | 'sroItemSerialNo'
  | 'fbrInvoiceNo'
  | 'fbrStatusCode'
  | 'fbrStatus'
  | 'fbrErrorCode'
  | 'fbrError'
>;

const decGet = (field: keyof InvoiceItemAttributes) =>
  function (this: InvoiceItem) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class InvoiceItem
  extends Model<InvoiceItemAttributes, InvoiceItemCreationAttributes>
  implements InvoiceItemAttributes
{
  declare id: number;
  declare invoiceId: number;
  declare productId: number | null;
  declare itemSrNo: number;
  declare hsCode: string;
  declare productDescription: string;
  declare rate: string;
  declare uom: string;
  declare quantity: number;
  declare totalValues: number;
  declare valueSalesExcludingST: number;
  declare fixedNotifiedValueOrRetailPrice: number;
  declare salesTaxApplicable: number;
  declare salesTaxWithheldAtSource: number;
  declare extraTax: number;
  declare furtherTax: number;
  declare sroScheduleNo: string | null;
  declare fedPayable: number;
  declare discount: number;
  declare saleType: string;
  declare sroItemSerialNo: string | null;
  declare fbrInvoiceNo: string | null;
  declare fbrStatusCode: string | null;
  declare fbrStatus: string | null;
  declare fbrErrorCode: string | null;
  declare fbrError: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

InvoiceItem.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    invoiceId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'invoice_id' },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'product_id' },
    itemSrNo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'item_sr_no' },

    hsCode: { type: DataTypes.STRING(20), allowNull: false, field: 'hs_code' },
    productDescription: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'product_description',
    },
    rate: { type: DataTypes.STRING(50), allowNull: false },
    uom: { type: DataTypes.STRING(100), allowNull: false },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
      get: decGet('quantity'),
    },
    totalValues: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_values',
      get: decGet('totalValues'),
    },
    valueSalesExcludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'value_sales_excluding_st',
      get: decGet('valueSalesExcludingST'),
    },
    fixedNotifiedValueOrRetailPrice: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'fixed_notified_value_or_retail_price',
      get: decGet('fixedNotifiedValueOrRetailPrice'),
    },
    salesTaxApplicable: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'sales_tax_applicable',
      get: decGet('salesTaxApplicable'),
    },
    salesTaxWithheldAtSource: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'sales_tax_withheld_at_source',
      get: decGet('salesTaxWithheldAtSource'),
    },
    extraTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'extra_tax',
      get: decGet('extraTax'),
    },
    furtherTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'further_tax',
      get: decGet('furtherTax'),
    },
    sroScheduleNo: { type: DataTypes.STRING(100), allowNull: true, field: 'sro_schedule_no' },
    fedPayable: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'fed_payable',
      get: decGet('fedPayable'),
    },
    discount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      get: decGet('discount'),
    },
    saleType: { type: DataTypes.STRING(150), allowNull: false, field: 'sale_type' },
    sroItemSerialNo: { type: DataTypes.STRING(50), allowNull: true, field: 'sro_item_serial_no' },

    fbrInvoiceNo: { type: DataTypes.STRING(60), allowNull: true, field: 'fbr_invoice_no' },
    fbrStatusCode: { type: DataTypes.STRING(10), allowNull: true, field: 'fbr_status_code' },
    fbrStatus: { type: DataTypes.STRING(50), allowNull: true, field: 'fbr_status' },
    fbrErrorCode: { type: DataTypes.STRING(20), allowNull: true, field: 'fbr_error_code' },
    fbrError: { type: DataTypes.TEXT, allowNull: true, field: 'fbr_error' },
  },
  {
    sequelize,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items',
    paranoid: false,
    indexes: [{ fields: ['invoice_id'] }, { fields: ['hs_code'] }],
  },
);

export default InvoiceItem;
