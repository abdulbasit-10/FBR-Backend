/**
 * Central model registry & association definitions.
 * Import from this file everywhere in the app:
 *   import { User, Company, Invoice } from '@/models';
 */
import sequelize from '../database/connection';

import Company from './Company';
import Role from './Role';
import Permission from './Permission';
import RolePermission from './RolePermission';
import User from './User';
import RefreshToken from './RefreshToken';
import Customer from './Customer';
import Product from './Product';
import Invoice from './Invoice';
import InvoiceItem from './InvoiceItem';
import InvoiceLog from './InvoiceLog';
import FbrToken from './FbrToken';
import ApiLog from './ApiLog';
import Setting from './Setting';
import Notification from './Notification';
import {
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
} from './FbrReference';

// ---------- Associations ----------

// Company ↔ Users
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Role ↔ User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Role ↔ Permission (many-to-many via role_permissions)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User ↔ RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company ↔ Customers
Company.hasMany(Customer, { foreignKey: 'companyId', as: 'customers' });
Customer.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company ↔ Products
Company.hasMany(Product, { foreignKey: 'companyId', as: 'products' });
Product.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company ↔ Invoices, Customer ↔ Invoices, User ↔ Invoices (creator)
Company.hasMany(Invoice, { foreignKey: 'companyId', as: 'invoices' });
Invoice.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'createdInvoices' });
Invoice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Invoice ↔ InvoiceItems
Invoice.hasMany(InvoiceItem, {
  foreignKey: 'invoiceId',
  as: 'items',
  onDelete: 'CASCADE',
});
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// Product ↔ InvoiceItems (nullable snapshot)
Product.hasMany(InvoiceItem, { foreignKey: 'productId', as: 'invoiceItems' });
InvoiceItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Invoice ↔ InvoiceLog
Invoice.hasMany(InvoiceLog, { foreignKey: 'invoiceId', as: 'logs', onDelete: 'CASCADE' });
InvoiceLog.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
User.hasMany(InvoiceLog, { foreignKey: 'userId', as: 'invoiceLogs' });
InvoiceLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company ↔ FbrTokens
Company.hasMany(FbrToken, { foreignKey: 'companyId', as: 'fbrTokens', onDelete: 'CASCADE' });
FbrToken.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(FbrToken, { foreignKey: 'createdBy', as: 'issuedFbrTokens' });
FbrToken.belongsTo(User, { foreignKey: 'createdBy', as: 'issuer' });

// ApiLog relations (nullable)
Company.hasMany(ApiLog, { foreignKey: 'companyId', as: 'apiLogs' });
ApiLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(ApiLog, { foreignKey: 'userId', as: 'apiLogs' });
ApiLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Invoice.hasMany(ApiLog, { foreignKey: 'invoiceId', as: 'apiLogs' });
ApiLog.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// Settings & Notifications
Company.hasMany(Setting, { foreignKey: 'companyId', as: 'settings', onDelete: 'CASCADE' });
Setting.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications',
  onDelete: 'CASCADE',
});
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Company.hasMany(Notification, { foreignKey: 'companyId', as: 'notifications' });
Notification.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// ---------- Exports ----------
export {
  sequelize,
  Company,
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  InvoiceLog,
  FbrToken,
  ApiLog,
  Setting,
  Notification,
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
};

// Re-export attribute types so services can import them from one place
export type { CompanyAttributes, CompanyCreationAttributes } from './Company';
export type { UserAttributes, UserCreationAttributes } from './User';
export type { CustomerAttributes, CustomerCreationAttributes } from './Customer';
export type { ProductAttributes, ProductCreationAttributes } from './Product';
export type { InvoiceAttributes, InvoiceCreationAttributes } from './Invoice';
export type { InvoiceItemAttributes, InvoiceItemCreationAttributes } from './InvoiceItem';
export type { InvoiceLogAttributes, InvoiceLogCreationAttributes } from './InvoiceLog';
export type { SettingAttributes, SettingCreationAttributes } from './Setting';
export type { NotificationAttributes, NotificationCreationAttributes } from './Notification';
export type { RoleAttributes, RoleCreationAttributes } from './Role';
export type { PermissionAttributes, PermissionCreationAttributes } from './Permission';
export type { FbrTokenAttributes, FbrTokenCreationAttributes } from './FbrToken';
export type { ApiLogAttributes, ApiLogCreationAttributes } from './ApiLog';

export const models = {
  Company,
  Role,
  Permission,
  RolePermission,
  User,
  RefreshToken,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  InvoiceLog,
  FbrToken,
  ApiLog,
  Setting,
  Notification,
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
};

export default models;
