import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export interface RoleAttributes {
  id: number;
  uuid: string;
  name: string; // e.g. 'SuperAdmin', 'CompanyAdmin'
  description: string | null;
  isSystemRole: boolean;
  isPlatformRole: boolean; // true = cannot be assigned to company-scoped users
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleCreationAttributes = Optional<
  RoleAttributes,
  'id' | 'uuid' | 'description' | 'isSystemRole' | 'isPlatformRole'
>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare uuid: string;
  declare name: string;
  declare description: string | null;
  declare isSystemRole: boolean;
  declare isPlatformRole: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system_role',
    },
    isPlatformRole: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_platform_role',
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    paranoid: false,
  },
);

export default Role;
