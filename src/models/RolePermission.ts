import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection';

/**
 * Junction table linking Roles ↔ Permissions.
 */
export interface RolePermissionAttributes {
  roleId: number;
  permissionId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RolePermission
  extends Model<RolePermissionAttributes>
  implements RolePermissionAttributes
{
  declare roleId: number;
  declare permissionId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      field: 'role_id',
    },
    permissionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      field: 'permission_id',
    },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    paranoid: false,
  },
);

export default RolePermission;
