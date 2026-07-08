import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

/**
 * Local cache of FBR reference data. Populated by a scheduled sync
 * (or manual admin trigger) so we don't hit FBR on every dropdown.
 */

// -------------------- Province --------------------
export interface FbrProvinceAttributes {
  id: number;
  stateProvinceCode: number;
  stateProvinceDesc: string;
  syncedAt: Date;
}
export type FbrProvinceCreation = Optional<FbrProvinceAttributes, 'id' | 'syncedAt'>;

export class FbrProvince
  extends Model<FbrProvinceAttributes, FbrProvinceCreation>
  implements FbrProvinceAttributes
{
  declare id: number;
  declare stateProvinceCode: number;
  declare stateProvinceDesc: string;
  declare syncedAt: Date;
}

FbrProvince.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    stateProvinceCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'state_province_code',
    },
    stateProvinceDesc: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'state_province_desc',
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  { sequelize, modelName: 'FbrProvince', tableName: 'fbr_provinces', timestamps: false },
);

// -------------------- Document Type --------------------
export interface FbrDocTypeAttributes {
  id: number;
  docTypeId: number;
  docDescription: string;
  syncedAt: Date;
}
export type FbrDocTypeCreation = Optional<FbrDocTypeAttributes, 'id' | 'syncedAt'>;

export class FbrDocType
  extends Model<FbrDocTypeAttributes, FbrDocTypeCreation>
  implements FbrDocTypeAttributes
{
  declare id: number;
  declare docTypeId: number;
  declare docDescription: string;
  declare syncedAt: Date;
}

FbrDocType.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    docTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'doc_type_id',
    },
    docDescription: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'doc_description',
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  { sequelize, modelName: 'FbrDocType', tableName: 'fbr_doc_types', timestamps: false },
);

// -------------------- HS Code --------------------
export interface FbrHsCodeAttributes {
  id: number;
  hsCode: string;
  description: string;
  syncedAt: Date;
}
export type FbrHsCodeCreation = Optional<FbrHsCodeAttributes, 'id' | 'syncedAt'>;

export class FbrHsCode
  extends Model<FbrHsCodeAttributes, FbrHsCodeCreation>
  implements FbrHsCodeAttributes
{
  declare id: number;
  declare hsCode: string;
  declare description: string;
  declare syncedAt: Date;
}

FbrHsCode.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    hsCode: { type: DataTypes.STRING(20), allowNull: false, unique: true, field: 'hs_code' },
    description: { type: DataTypes.TEXT, allowNull: false },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  {
    sequelize,
    modelName: 'FbrHsCode',
    tableName: 'fbr_hs_codes',
    timestamps: false,
    indexes: [{ fields: ['hs_code'] }],
  },
);

// -------------------- UOM --------------------
export interface FbrUomAttributes {
  id: number;
  uomId: number;
  description: string;
  syncedAt: Date;
}
export type FbrUomCreation = Optional<FbrUomAttributes, 'id' | 'syncedAt'>;

export class FbrUom extends Model<FbrUomAttributes, FbrUomCreation> implements FbrUomAttributes {
  declare id: number;
  declare uomId: number;
  declare description: string;
  declare syncedAt: Date;
}

FbrUom.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uomId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'uom_id' },
    description: { type: DataTypes.STRING(150), allowNull: false },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  { sequelize, modelName: 'FbrUom', tableName: 'fbr_uoms', timestamps: false },
);

// -------------------- Transaction Type --------------------
export interface FbrTransactionTypeAttributes {
  id: number;
  transactionTypeId: number;
  transactionDesc: string;
  syncedAt: Date;
}
export type FbrTransactionTypeCreation = Optional<FbrTransactionTypeAttributes, 'id' | 'syncedAt'>;

export class FbrTransactionType
  extends Model<FbrTransactionTypeAttributes, FbrTransactionTypeCreation>
  implements FbrTransactionTypeAttributes
{
  declare id: number;
  declare transactionTypeId: number;
  declare transactionDesc: string;
  declare syncedAt: Date;
}

FbrTransactionType.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    transactionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'transaction_type_id',
    },
    transactionDesc: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'transaction_desc',
    },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  {
    sequelize,
    modelName: 'FbrTransactionType',
    tableName: 'fbr_transaction_types',
    timestamps: false,
  },
);

// -------------------- SRO --------------------
export interface FbrSroAttributes {
  id: number;
  sroId: number;
  sroDesc: string;
  syncedAt: Date;
}
export type FbrSroCreation = Optional<FbrSroAttributes, 'id' | 'syncedAt'>;

export class FbrSro extends Model<FbrSroAttributes, FbrSroCreation> implements FbrSroAttributes {
  declare id: number;
  declare sroId: number;
  declare sroDesc: string;
  declare syncedAt: Date;
}

FbrSro.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    sroId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'sro_id' },
    sroDesc: { type: DataTypes.STRING(255), allowNull: false, field: 'sro_desc' },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  { sequelize, modelName: 'FbrSro', tableName: 'fbr_sros', timestamps: false },
);

// -------------------- Rate --------------------
export interface FbrRateAttributes {
  id: number;
  rateId: number;
  rateDesc: string;
  rateValue: number;
  transactionTypeId: number | null;
  provinceId: number | null;
  effectiveDate: string | null; // YYYY-MM-DD
  syncedAt: Date;
}
export type FbrRateCreation = Optional<
  FbrRateAttributes,
  'id' | 'transactionTypeId' | 'provinceId' | 'effectiveDate' | 'syncedAt'
>;

export class FbrRate
  extends Model<FbrRateAttributes, FbrRateCreation>
  implements FbrRateAttributes
{
  declare id: number;
  declare rateId: number;
  declare rateDesc: string;
  declare rateValue: number;
  declare transactionTypeId: number | null;
  declare provinceId: number | null;
  declare effectiveDate: string | null;
  declare syncedAt: Date;
}

FbrRate.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    rateId: { type: DataTypes.INTEGER, allowNull: false, field: 'rate_id' },
    rateDesc: { type: DataTypes.STRING(255), allowNull: false, field: 'rate_desc' },
    rateValue: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'rate_value',
      get() {
        const v = this.getDataValue('rateValue');
        return v === null ? 0 : parseFloat(v as unknown as string);
      },
    },
    transactionTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'transaction_type_id',
    },
    provinceId: { type: DataTypes.INTEGER, allowNull: true, field: 'province_id' },
    effectiveDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'effective_date' },
    syncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'synced_at',
    },
  },
  {
    sequelize,
    modelName: 'FbrRate',
    tableName: 'fbr_rates',
    timestamps: false,
    indexes: [
      { fields: ['rate_id'] },
      { fields: ['transaction_type_id', 'province_id', 'effective_date'] },
    ],
  },
);

export default {
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
};
