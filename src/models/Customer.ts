import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type BuyerRegistrationType = 'Registered' | 'Unregistered';

export interface CustomerAttributes {
  id: number;
  uuid: string;
  companyId: number;
  businessName: string;
  ntnCnic: string | null; // optional for Unregistered
  registrationType: BuyerRegistrationType;
  province: string;
  address: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  customerNo: string | null;
  customerType: 'Individual' | 'Company';
  strn: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type CustomerCreationAttributes = Optional<
  CustomerAttributes,
  'id' | 'uuid' | 'ntnCnic' | 'phone' | 'email' | 'isActive' | 'customerNo' | 'customerType' | 'strn'
>;

export class Customer
  extends Model<CustomerAttributes, CustomerCreationAttributes>
  implements CustomerAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number;
  declare businessName: string;
  declare ntnCnic: string | null;
  declare registrationType: BuyerRegistrationType;
  declare province: string;
  declare address: string;
  declare phone: string | null;
  declare email: string | null;
  declare isActive: boolean;
  declare customerNo: string | null;
  declare customerType: 'Individual' | 'Company';
  declare strn: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Customer.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'company_id' },
    businessName: { type: DataTypes.STRING(255), allowNull: false, field: 'business_name' },
    ntnCnic: { type: DataTypes.STRING(15), allowNull: true, field: 'ntn_cnic' },
    registrationType: {
      type: DataTypes.ENUM('Registered', 'Unregistered'),
      allowNull: false,
      field: 'registration_type',
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
    },    customerNo: { type: DataTypes.STRING(10), allowNull: true, field: 'customer_no' },
    customerType: {
      type: DataTypes.ENUM('Individual', 'Company'),
      allowNull: false,
      defaultValue: 'Individual',
      field: 'customer_type',
    },
    strn: { type: DataTypes.STRING(20), allowNull: true },  },
  {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers',
    paranoid: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['ntn_cnic'] },
      { fields: ['company_id', 'ntn_cnic'] },
    ],
  },
);

export default Customer;
