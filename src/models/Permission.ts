import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

/**
 * Permissions follow "module.action" naming convention.
 * Examples:
 *   - company.manage
 *   - user.create, user.read, user.update, user.delete
 *   - customer.create, customer.read, ...
 *   - product.create, product.read, ...
 *   - invoice.create, invoice.validate, invoice.post, invoice.read, invoice.cancel
 *   - fbrtoken.manage
 *   - report.view
 *   - apilog.view
 */
export interface PermissionAttributes {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PermissionCreationAttributes = Optional<PermissionAttributes, 'id' | 'description'>;

export class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: number;
  declare name: string;
  declare module: string;
  declare action: string;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Permission.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    module: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    paranoid: false,
    indexes: [{ fields: ['module'] }],
  },
);

export default Permission;
