import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type InvoiceType = 'Sale Invoice' | 'Debit Note';
export type InvoiceStatus = 'draft' | 'validated' | 'posted' | 'failed' | 'cancelled';
export type InvoiceEnvironment = 'sandbox' | 'production';

/**
 * Invoice header. Stores the full FBR request/response snapshot so
 * we can re-render the invoice exactly as it was posted.
 */
export interface InvoiceAttributes {
  id: number;
  uuid: string;
  companyId: number;
  customerId: number;
  createdBy: number; // user id

  invoiceType: InvoiceType;
  invoiceDate: string; // 'YYYY-MM-DD'
  invoiceRefNo: string | null; // only for Debit Note
  scenarioId: string | null; // sandbox only

  status: InvoiceStatus;
  environment: InvoiceEnvironment;

  // --- Snapshot of seller & buyer at time of invoicing (per FBR contract) ---
  sellerNtnCnic: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNtnCnic: string | null;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;

  // --- Computed totals (from items) ---
  totalValueExcludingST: number;
  totalSalesTax: number;
  totalFurtherTax: number;
  totalExtraTax: number;
  totalFedPayable: number;
  totalDiscount: number;
  totalValueIncludingST: number;

  // --- FBR response bookkeeping ---
  fbrInvoiceNumber: string | null;
  fbrDated: Date | null;
  fbrStatusCode: string | null;
  fbrStatus: string | null;
  fbrErrorCode: string | null;
  fbrError: string | null;
  fbrRawResponse: object | null;

  postedAt: Date | null;
  notes: string | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type InvoiceCreationAttributes = Optional<
  InvoiceAttributes,
  | 'id'
  | 'uuid'
  | 'invoiceRefNo'
  | 'scenarioId'
  | 'status'
  | 'buyerNtnCnic'
  | 'totalValueExcludingST'
  | 'totalSalesTax'
  | 'totalFurtherTax'
  | 'totalExtraTax'
  | 'totalFedPayable'
  | 'totalDiscount'
  | 'totalValueIncludingST'
  | 'fbrInvoiceNumber'
  | 'fbrDated'
  | 'fbrStatusCode'
  | 'fbrStatus'
  | 'fbrErrorCode'
  | 'fbrError'
  | 'fbrRawResponse'
  | 'postedAt'
  | 'notes'
>;

const decimalGetter = (field: keyof InvoiceAttributes) =>
  function (this: Invoice) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class Invoice
  extends Model<InvoiceAttributes, InvoiceCreationAttributes>
  implements InvoiceAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare customerId: number;
  declare createdBy: number;
  declare invoiceType: InvoiceType;
  declare invoiceDate: string;
  declare invoiceRefNo: string | null;
  declare scenarioId: string | null;
  declare status: InvoiceStatus;
  declare environment: InvoiceEnvironment;
  declare sellerNtnCnic: string;
  declare sellerBusinessName: string;
  declare sellerProvince: string;
  declare sellerAddress: string;
  declare buyerNtnCnic: string | null;
  declare buyerBusinessName: string;
  declare buyerProvince: string;
  declare buyerAddress: string;
  declare buyerRegistrationType: string;
  declare totalValueExcludingST: number;
  declare totalSalesTax: number;
  declare totalFurtherTax: number;
  declare totalExtraTax: number;
  declare totalFedPayable: number;
  declare totalDiscount: number;
  declare totalValueIncludingST: number;
  declare fbrInvoiceNumber: string | null;
  declare fbrDated: Date | null;
  declare fbrStatusCode: string | null;
  declare fbrStatus: string | null;
  declare fbrErrorCode: string | null;
  declare fbrError: string | null;
  declare fbrRawResponse: object | null;
  declare postedAt: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Invoice.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    customerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'customer_id' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'created_by' },

    invoiceType: {
      type: DataTypes.ENUM('Sale Invoice', 'Debit Note'),
      allowNull: false,
      field: 'invoice_type',
    },
    invoiceDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'invoice_date' },
    invoiceRefNo: { type: DataTypes.STRING(50), allowNull: true, field: 'invoice_ref_no' },
    scenarioId: { type: DataTypes.STRING(10), allowNull: true, field: 'scenario_id' },

    status: {
      type: DataTypes.ENUM('draft', 'validated', 'posted', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    environment: {
      type: DataTypes.ENUM('sandbox', 'production'),
      allowNull: false,
      defaultValue: 'sandbox',
    },

    sellerNtnCnic: { type: DataTypes.STRING(15), allowNull: false, field: 'seller_ntn_cnic' },
    sellerBusinessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'seller_business_name',
    },
    sellerProvince: { type: DataTypes.STRING(100), allowNull: false, field: 'seller_province' },
    sellerAddress: { type: DataTypes.STRING(500), allowNull: false, field: 'seller_address' },
    buyerNtnCnic: { type: DataTypes.STRING(15), allowNull: true, field: 'buyer_ntn_cnic' },
    buyerBusinessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'buyer_business_name',
    },
    buyerProvince: { type: DataTypes.STRING(100), allowNull: false, field: 'buyer_province' },
    buyerAddress: { type: DataTypes.STRING(500), allowNull: false, field: 'buyer_address' },
    buyerRegistrationType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'buyer_registration_type',
    },

    totalValueExcludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_value_excluding_st',
      get: decimalGetter('totalValueExcludingST'),
    },
    totalSalesTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_sales_tax',
      get: decimalGetter('totalSalesTax'),
    },
    totalFurtherTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_further_tax',
      get: decimalGetter('totalFurtherTax'),
    },
    totalExtraTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_extra_tax',
      get: decimalGetter('totalExtraTax'),
    },
    totalFedPayable: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_fed_payable',
      get: decimalGetter('totalFedPayable'),
    },
    totalDiscount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_discount',
      get: decimalGetter('totalDiscount'),
    },
    totalValueIncludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_value_including_st',
      get: decimalGetter('totalValueIncludingST'),
    },

    fbrInvoiceNumber: { type: DataTypes.STRING(50), allowNull: true, field: 'fbr_invoice_number' },
    fbrDated: { type: DataTypes.DATE, allowNull: true, field: 'fbr_dated' },
    fbrStatusCode: { type: DataTypes.STRING(10), allowNull: true, field: 'fbr_status_code' },
    fbrStatus: { type: DataTypes.STRING(50), allowNull: true, field: 'fbr_status' },
    fbrErrorCode: { type: DataTypes.STRING(20), allowNull: true, field: 'fbr_error_code' },
    fbrError: { type: DataTypes.TEXT, allowNull: true, field: 'fbr_error' },
    fbrRawResponse: { type: DataTypes.JSON, allowNull: true, field: 'fbr_raw_response' },

    postedAt: { type: DataTypes.DATE, allowNull: true, field: 'posted_at' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    paranoid: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['customer_id'] },
      { fields: ['status'] },
      { fields: ['invoice_date'] },
      { fields: ['fbr_invoice_number'] },
      { fields: ['company_id', 'status'] },
    ],
  },
);

export default Invoice;
