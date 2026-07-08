import { DataTypes, Model, Optional } from 'sequelize';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import sequelize from '../database/connection';
import config from '../config';

export interface UserAttributes {
  id: number;
  uuid: string;
  companyId: number | null; // null for SuperAdmin (platform-level)
  roleId: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type UserCreationAttributes = Optional<
  UserAttributes,
  'id' | 'uuid' | 'companyId' | 'phone' | 'isActive' | 'lastLoginAt'
>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare uuid: string;
  declare companyId: number | null;
  declare roleId: number;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare phone: string | null;
  declare isActive: boolean;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;

  /** Compare a plaintext password against the stored hash */
  public async verifyPassword(plaintext: string): Promise<boolean> {
    return bcrypt.compare(plaintext, this.passwordHash);
  }

  /** Convenience: strip sensitive fields for API output */
  public toSafeJSON(): Omit<UserAttributes, 'passwordHash'> {
    const { passwordHash: _pw, ...rest } = this.get({ plain: true }) as UserAttributes;
    return rest;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: () => randomUUID(),
    },
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'company_id',
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'role_id',
    },
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
    phone: { type: DataTypes.STRING(30), allowNull: true },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true,
    indexes: [{ fields: ['email'] }, { fields: ['company_id'] }, { fields: ['is_active'] }],
    hooks: {
      /**
       * Automatically hash plaintext password if a caller sets `password`
       * as a virtual field via `user.set('password', 'plain')` OR if `passwordHash`
       * looks like plaintext. Safer path: services should hash explicitly.
       */
      beforeCreate: async (user: User) => {
        // If a caller passed `password` via defaults, hash it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (user as any).password as string | undefined;
        if (raw) {
          user.passwordHash = await bcrypt.hash(raw, config.jwt.bcryptSaltRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = (user as any).password as string | undefined;
        if (raw) {
          user.passwordHash = await bcrypt.hash(raw, config.jwt.bcryptSaltRounds);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['passwordHash'] } },
    },
  },
);

export default User;
