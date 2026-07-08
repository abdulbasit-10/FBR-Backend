import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import config from '../config';
import {
  User,
  Role,
  Permission,
  RolePermission,
  UserAttributes,
  UserCreationAttributes,
  sequelize,
} from '../models';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/AppError';
import {
  PaginationParams,
  PaginatedResult,
  buildSearchWhere,
  normalisePagination,
  paginationMeta,
} from '../utils/pagination';

// ---------- Users ----------

export const listUsers = async (
  params: PaginationParams & { companyId?: number | null },
): Promise<PaginatedResult<User>> => {
  const { page, limit, offset } = normalisePagination(params);
  const search = buildSearchWhere(params.search, ['name', 'email']);
  const where: Record<string, unknown> = search ? { ...(search as object) } : {};
  if (params.companyId !== undefined) where.companyId = params.companyId;

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: Role, as: 'role' }],
    order: [
      [params.sortBy ?? 'created_at', (params.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
    ],
    limit,
    offset,
  });
  return { rows, meta: paginationMeta(page, limit, count) };
};

export const getUser = async (id: number, companyId?: number | null): Promise<User> => {
  const where: Record<string, unknown> = { id };
  if (companyId !== undefined) where.companyId = companyId;
  const user = await User.findOne({ where, include: [{ model: Role, as: 'role' }] });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const getUserByUuid = async (uuid: string, companyId?: number | null): Promise<User> => {
  const where: Record<string, unknown> = { uuid };
  if (companyId !== undefined) where.companyId = companyId;
  const user = await User.findOne({ where, include: [{ model: Role, as: 'role' }] });
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const createUser = async (
  data: Omit<UserCreationAttributes, 'passwordHash'> & { password: string },
): Promise<User> => {
  const existing = await User.findOne({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) throw new ConflictError('Email already in use');

  const passwordHash = await bcrypt.hash(data.password, config.jwt.bcryptSaltRounds);
  const created = await User.create({
    name: data.name,
    email: data.email.toLowerCase().trim(),
    passwordHash,
    phone: data.phone ?? null,
    roleId: data.roleId,
    companyId: data.companyId ?? null,
    isActive: data.isActive ?? true,
  });
  return created;
};

export const updateUser = async (
  id: number,
  companyId: number | null | undefined,
  data: Partial<UserAttributes>,
): Promise<User> => {
  const user = await getUser(id, companyId);
  if (data.email && data.email !== user.email) {
    const existing = await User.findOne({
      where: { email: data.email.toLowerCase().trim(), id: { [Op.ne]: id } },
    });
    if (existing) throw new ConflictError('Email already in use');
    user.email = data.email.toLowerCase().trim();
  }
  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.roleId !== undefined) user.roleId = data.roleId;
  if (data.companyId !== undefined) user.companyId = data.companyId;
  if (data.isActive !== undefined) user.isActive = data.isActive;

  await user.save();
  return user;
};

export const deleteUser = async (id: number, companyId?: number | null): Promise<void> => {
  const user = await getUser(id, companyId);
  await user.destroy();
};

export const resetPassword = async (
  id: number,
  companyId: number | null | undefined,
  newPassword: string,
): Promise<void> => {
  if (!newPassword || newPassword.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }
  const user = await getUser(id, companyId);
  user.passwordHash = await bcrypt.hash(newPassword, config.jwt.bcryptSaltRounds);
  await user.save();
};

// ---------- Roles & Permissions ----------

export const listRoles = () =>
  Role.findAll({
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    order: [['name', 'ASC']],
  });

export const listPermissions = () =>
  Permission.findAll({
    order: [
      ['module', 'ASC'],
      ['action', 'ASC'],
    ],
  });

export const getRole = async (id: number): Promise<Role> => {
  const role = await Role.findByPk(id, {
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) throw new NotFoundError('Role not found');
  return role;
};

export const getRoleByUuid = async (uuid: string): Promise<Role> => {
  const role = await Role.findOne({
    where: { uuid },
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  if (!role) throw new NotFoundError('Role not found');
  return role;
};

export const createRole = async (data: {
  name: string;
  description?: string | null;
  permissionIds: number[];
}): Promise<Role> => {
  return sequelize.transaction(async (t) => {
    const role = await Role.create(
      { name: data.name, description: data.description ?? null, isSystemRole: false },
      { transaction: t },
    );
    if (data.permissionIds.length) {
      await RolePermission.bulkCreate(
        data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        { transaction: t, ignoreDuplicates: true },
      );
    }
    return role;
  });
};

export const updateRole = async (
  id: number,
  data: { name?: string; description?: string | null; permissionIds?: number[] },
): Promise<Role> => {
  const role = await getRole(id);
  if (role.isSystemRole && data.name && data.name !== role.name) {
    throw new BadRequestError('System role name cannot be changed');
  }
  return sequelize.transaction(async (t) => {
    if (data.name !== undefined) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;
    await role.save({ transaction: t });

    if (data.permissionIds !== undefined) {
      await RolePermission.destroy({ where: { roleId: role.id }, transaction: t });
      if (data.permissionIds.length) {
        await RolePermission.bulkCreate(
          data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
          { transaction: t, ignoreDuplicates: true },
        );
      }
    }
    return getRole(role.id);
  });
};

export const deleteRole = async (id: number): Promise<void> => {
  const role = await getRole(id);
  if (role.isSystemRole) throw new BadRequestError('System roles cannot be deleted');
  const inUse = await User.count({ where: { roleId: id } });
  if (inUse > 0) throw new ConflictError('Role is assigned to users');
  await role.destroy();
};
