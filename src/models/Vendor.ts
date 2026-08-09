import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type VendorRegistrationType = 'Registered' | 'Unregistered';

export interface VendorAttributes {
  id: number;
  uuid: string;
  companyId: number;
  vendorNo: string | null;
  businessName: string;
  ntnCnic: string | null;
  strn: string | null;
  registrationType: VendorRegistrationType;
  vendorType: 'Individual' | 'Company';
  province: string;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type VendorCreationAttributes = Optional<
  VendorAttributes,
  | 'id'
  | 'uuid'
  | 'vendorNo'
  | 'ntnCnic'
  | 'strn'
  | 'phone'
  | 'email'
  | 'isActive'
  | 'vendorType'
>;

export class Vendor
  extends Model<VendorAttributes, VendorCreationAttributes>
  implements VendorAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare vendorNo: string | null;
  declare businessName: string;
  declare ntnCnic: string | null;
  declare strn: string | null;
  declare registrationType: VendorRegistrationType;
  declare vendorType: 'Individual' | 'Company';
  declare province: string;
  declare address: string;
  declare phone: string | null;
  declare email: string | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Vendor.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    vendorNo: { type: DataTypes.STRING(10), allowNull: true, field: 'vendor_no' },
    businessName: { type: DataTypes.STRING(255), allowNull: false, field: 'business_name' },
    ntnCnic: { type: DataTypes.STRING(15), allowNull: true, field: 'ntn_cnic' },
    strn: { type: DataTypes.STRING(20), allowNull: true },
    registrationType: {
      type: DataTypes.ENUM('Registered', 'Unregistered'),
      allowNull: false,
      field: 'registration_type',
    },
    vendorType: {
      type: DataTypes.ENUM('Individual', 'Company'),
      allowNull: false,
      defaultValue: 'Company',
      field: 'vendor_type',
    },
    province: { type: DataTypes.STRING(100), allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'Vendor',
    tableName: 'vendors',
    paranoid: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['ntn_cnic'] },
      { fields: ['company_id', 'ntn_cnic'] },
    ],
  },
);

export default Vendor;
