import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';
import type { FbrBusinessActivity, FbrSector } from '../constants/fbrScenarios';

export type FbrEnvironment = 'sandbox' | 'production' | 'both';

export interface CompanyAttributes {
  id: number;
  uuid: string;
  name: string;
  businessName: string;
  ntn: string; // 7 or 13 digits
  address: string;
  province: string;
  phone: string | null;
  email: string | null;
  salesTaxRegNo: string | null;
  businessActivity: FbrBusinessActivity | null;
  sector: FbrSector | null;
  fbrEnvironment: FbrEnvironment;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type CompanyCreationAttributes = Optional<
  CompanyAttributes,
  'id' | 'uuid' | 'phone' | 'email' | 'salesTaxRegNo' | 'businessActivity' | 'sector' | 'fbrEnvironment' | 'isActive'
>;

export class Company
  extends Model<CompanyAttributes, CompanyCreationAttributes>
  implements CompanyAttributes
{
  declare id: number;
  declare uuid: string;
  declare name: string;
  declare businessName: string;
  declare ntn: string;
  declare address: string;
  declare province: string;
  declare phone: string | null;
  declare email: string | null;
  declare salesTaxRegNo: string | null;
  declare businessActivity: FbrBusinessActivity | null;
  declare sector: FbrSector | null;
  declare fbrEnvironment: FbrEnvironment;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}

Company.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    businessName: { type: DataTypes.STRING(255), allowNull: false, field: 'business_name' },
    ntn: { type: DataTypes.STRING(15), allowNull: false, unique: true },
    address: { type: DataTypes.STRING(500), allowNull: false },
    province: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    salesTaxRegNo: { type: DataTypes.STRING(50), allowNull: true, field: 'sales_tax_reg_no' },
    businessActivity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'business_activity',
    },
    sector: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fbrEnvironment: {
      type: DataTypes.ENUM('sandbox', 'production', 'both'),
      allowNull: false,
      defaultValue: 'sandbox',
      field: 'fbr_environment',
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
    modelName: 'Company',
    tableName: 'companies',
    paranoid: true,
    indexes: [{ fields: ['ntn'] }, { fields: ['is_active'] }],
  },
);

export default Company;
