import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type PurchaseType = 'Purchase Invoice' | 'Purchase Return';
export type PurchaseStatus = 'draft' | 'posted' | 'cancelled';
export type PurchaseSource = 'Manual' | 'API' | 'Import';

export interface PurchaseAttributes {
  id: number;
  uuid: string;
  companyId: number;
  vendorId: number;
  createdBy: number;

  purchaseNo: string | null;
  purchaseType: PurchaseType;
  originalPurchaseId: number | null;
  vendorInvoiceNo: string | null;
  docDate: string;
  postingDate: string | null;
  poDate: string | null;
  poNumber: string | null;

  status: PurchaseStatus;
  source: PurchaseSource;

  vendorNtnCnic: string | null;
  vendorBusinessName: string;
  vendorProvince: string | null;
  vendorAddress: string | null;
  vendorRegistrationType: string | null;

  assessedValue: number;
  totalDiscount: number;
  totalValueExcludingST: number;
  totalSalesTax: number;
  totalFurtherTax: number;
  totalExtraTax: number;
  totalFedPayable: number;
  advanceTax: number;
  totalValueIncludingST: number;

  postedAt: Date | null;
  notes: string | null;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type PurchaseCreationAttributes = Optional<
  PurchaseAttributes,
  | 'id'
  | 'uuid'
  | 'purchaseNo'
  | 'originalPurchaseId'
  | 'vendorInvoiceNo'
  | 'postingDate'
  | 'poDate'
  | 'poNumber'
  | 'status'
  | 'source'
  | 'vendorNtnCnic'
  | 'vendorProvince'
  | 'vendorAddress'
  | 'vendorRegistrationType'
  | 'assessedValue'
  | 'totalDiscount'
  | 'totalValueExcludingST'
  | 'totalSalesTax'
  | 'totalFurtherTax'
  | 'totalExtraTax'
  | 'totalFedPayable'
  | 'advanceTax'
  | 'totalValueIncludingST'
  | 'postedAt'
  | 'notes'
>;

const decimalGetter = (field: keyof PurchaseAttributes) =>
  function (this: Purchase) {
    const v = this.getDataValue(field);
    return v === null || v === undefined ? 0 : parseFloat(v as unknown as string);
  };

export class Purchase
  extends Model<PurchaseAttributes, PurchaseCreationAttributes>
  implements PurchaseAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare vendorId: number;
  declare createdBy: number;
  declare purchaseNo: string | null;
  declare purchaseType: PurchaseType;
  declare originalPurchaseId: number | null;
  declare vendorInvoiceNo: string | null;
  declare docDate: string;
  declare postingDate: string | null;
  declare poDate: string | null;
  declare poNumber: string | null;
  declare status: PurchaseStatus;
  declare source: PurchaseSource;
  declare vendorNtnCnic: string | null;
  declare vendorBusinessName: string;
  declare vendorProvince: string | null;
  declare vendorAddress: string | null;
  declare vendorRegistrationType: string | null;
  declare assessedValue: number;
  declare totalDiscount: number;
  declare totalValueExcludingST: number;
  declare totalSalesTax: number;
  declare totalFurtherTax: number;
  declare totalExtraTax: number;
  declare totalFedPayable: number;
  declare advanceTax: number;
  declare totalValueIncludingST: number;
  declare postedAt: Date | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Purchase.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    vendorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'vendor_id' },
    createdBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'created_by' },
    purchaseNo: { type: DataTypes.STRING(20), allowNull: true, field: 'purchase_no' },
    purchaseType: {
      type: DataTypes.ENUM('Purchase Invoice', 'Purchase Return'),
      allowNull: false,
      defaultValue: 'Purchase Invoice',
      field: 'purchase_type',
    },
    originalPurchaseId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'original_purchase_id',
    },
    vendorInvoiceNo: { type: DataTypes.STRING(100), allowNull: true, field: 'vendor_invoice_no' },
    docDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'doc_date' },
    postingDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'posting_date' },
    poDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'po_date' },
    poNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'po_number' },
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    source: {
      type: DataTypes.ENUM('Manual', 'API', 'Import'),
      allowNull: false,
      defaultValue: 'Manual',
    },
    vendorNtnCnic: { type: DataTypes.STRING(15), allowNull: true, field: 'vendor_ntn_cnic' },
    vendorBusinessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'vendor_business_name',
    },
    vendorProvince: { type: DataTypes.STRING(100), allowNull: true, field: 'vendor_province' },
    vendorAddress: { type: DataTypes.STRING(500), allowNull: true, field: 'vendor_address' },
    vendorRegistrationType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'vendor_registration_type',
    },
    assessedValue: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'assessed_value',
      get: decimalGetter('assessedValue'),
    },
    totalDiscount: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_discount',
      get: decimalGetter('totalDiscount'),
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
    advanceTax: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'advance_tax',
      get: decimalGetter('advanceTax'),
    },
    totalValueIncludingST: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'total_value_including_st',
      get: decimalGetter('totalValueIncludingST'),
    },
    postedAt: { type: DataTypes.DATE, allowNull: true, field: 'posted_at' },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Purchase',
    tableName: 'purchases',
    paranoid: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['vendor_id'] },
      { fields: ['status'] },
      { fields: ['purchase_type'] },
      { fields: ['doc_date'] },
    ],
  },
);

export default Purchase;
