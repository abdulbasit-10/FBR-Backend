import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from '../database/connection';

export type SettingScope = 'global' | 'company' | 'user';

/**
 * Generic key/value settings store. Used for:
 *  - Global platform settings (scope='global', companyId=null)
 *  - Per-company configuration (scope='company', companyId=X) — e.g. invoice
 *    prefix, default environment, notification preferences, FBR integration flags
 */
export interface SettingAttributes {
  id: number;
  uuid: string;
  companyId: number | null;
  scope: SettingScope;
  key: string;
  value: unknown;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SettingCreationAttributes = Optional<
  SettingAttributes,
  'id' | 'uuid' | 'companyId' | 'value' | 'description'
>;

export class Setting
  extends Model<SettingAttributes, SettingCreationAttributes>
  implements SettingAttributes
{
  declare id: number;
  declare uuid: string;
  declare companyId: number | null;
  declare scope: SettingScope;
  declare key: string;
  declare value: unknown;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Setting.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'company_id' },
    scope: {
      type: DataTypes.ENUM('global', 'company', 'user'),
      allowNull: false,
      defaultValue: 'company',
    },
    key: { type: DataTypes.STRING(100), allowNull: false },
    value: { type: DataTypes.JSON, allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    paranoid: false,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['scope', 'key'] },
      { fields: ['company_id', 'key'], unique: true, name: 'uq_settings_company_key' },
    ],
  },
);

export default Setting;
