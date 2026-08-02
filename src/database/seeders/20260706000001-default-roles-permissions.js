'use strict';

/**
 * Seeds:
 *  - Default permissions (module.action)
 *  - Default roles (SuperAdmin, CompanyAdmin)
 *  - Role → Permission assignments
 *
 * SuperAdmin user is created in a separate seeder so it can be re-run
 * safely to reset credentials if needed.
 */

const PERMISSIONS = [
  // Company
  { module: 'company', action: 'create', description: 'Create companies' },
  { module: 'company', action: 'read', description: 'View companies' },
  { module: 'company', action: 'update', description: 'Update companies' },
  { module: 'company', action: 'delete', description: 'Delete companies' },

  // User
  { module: 'user', action: 'create', description: 'Create users' },
  { module: 'user', action: 'read', description: 'View users' },
  { module: 'user', action: 'update', description: 'Update users' },
  { module: 'user', action: 'delete', description: 'Delete users' },

  // Role & Permission
  { module: 'role', action: 'manage', description: 'Manage roles & permissions' },

  // Customer
  { module: 'customer', action: 'create', description: 'Create customers' },
  { module: 'customer', action: 'read', description: 'View customers' },
  { module: 'customer', action: 'update', description: 'Update customers' },
  { module: 'customer', action: 'delete', description: 'Delete customers' },

  // Product
  { module: 'product', action: 'create', description: 'Create products' },
  { module: 'product', action: 'read', description: 'View products' },
  { module: 'product', action: 'update', description: 'Update products' },
  { module: 'product', action: 'delete', description: 'Delete products' },

  // Invoice
  { module: 'invoice', action: 'create', description: 'Create draft invoices' },
  { module: 'invoice', action: 'read', description: 'View invoices' },
  { module: 'invoice', action: 'update', description: 'Update draft invoices' },
  { module: 'invoice', action: 'validate', description: 'Validate invoice against FBR' },
  { module: 'invoice', action: 'post', description: 'Post invoice to FBR' },
  { module: 'invoice', action: 'cancel', description: 'Cancel invoices' },

  // FBR Token
  { module: 'fbrtoken', action: 'manage', description: 'Manage per-company FBR tokens' },

  // API Logs
  { module: 'apilog', action: 'view', description: 'View API audit logs' },

  // Reports
  { module: 'report', action: 'view', description: 'View reports & dashboards' },

  // Reference sync
  { module: 'reference', action: 'sync', description: 'Trigger FBR reference sync' },
];

const ROLES = [
  {
    name: 'SuperAdmin',
    description: 'Platform administrator — full access to all companies and settings',
    isSystemRole: true,
    // Full access
    permissions: '*',
  },
  {
    name: 'CompanyAdmin',
    description: 'Administrator of a single company',
    isSystemRole: true,
    permissions: [
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'company.read',
      'company.update',
      'customer.create',
      'customer.read',
      'customer.update',
      'customer.delete',
      'product.create',
      'product.read',
      'product.update',
      'product.delete',
      'invoice.create',
      'invoice.read',
      'invoice.update',
      'invoice.validate',
      'invoice.post',
      'invoice.cancel',
      'fbrtoken.manage',
      'apilog.view',
      'report.view',
      'reference.sync',
    ],
  },
  {
    name: 'Accountant',
    description: 'Creates and posts invoices, manages customers & products',
    isSystemRole: true,
    permissions: [
      'customer.create',
      'customer.read',
      'customer.update',
      'product.create',
      'product.read',
      'product.update',
      'invoice.create',
      'invoice.read',
      'invoice.update',
      'invoice.validate',
      'invoice.post',
      'report.view',
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to reports & invoices',
    isSystemRole: true,
    permissions: ['customer.read', 'product.read', 'invoice.read', 'report.view'],
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface /* , Sequelize */) {
    const now = new Date();

    // -------- Permissions --------
    const permissionRows = PERMISSIONS.map((p) => ({
      name: `${p.module}.${p.action}`,
      module: p.module,
      action: p.action,
      description: p.description,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('permissions', permissionRows, { ignoreDuplicates: true });

    // Re-fetch to get IDs (bulkInsert doesn't reliably return IDs in MySQL)
    const [dbPermissions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM permissions',
    );
    const permByName = new Map(dbPermissions.map((p) => [p.name, p.id]));

    // -------- Roles --------
    const roleRows = ROLES.map((r) => ({
      name: r.name,
      description: r.description,
      is_system_role: r.isSystemRole,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('roles', roleRows, { ignoreDuplicates: true });

    const [dbRoles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const roleByName = new Map(dbRoles.map((r) => [r.name, r.id]));

    // -------- Role → Permission --------
    const rolePermRows = [];
    for (const role of ROLES) {
      const roleId = roleByName.get(role.name);
      if (!roleId) continue;

      const permNames =
        role.permissions === '*' ? PERMISSIONS.map((p) => `${p.module}.${p.action}`) : role.permissions;

      for (const name of permNames) {
        const permId = permByName.get(name);
        if (!permId) continue;
        rolePermRows.push({
          role_id: roleId,
          permission_id: permId,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (rolePermRows.length > 0) {
      await queryInterface.bulkInsert('role_permissions', rolePermRows, { ignoreDuplicates: true });
    }
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
