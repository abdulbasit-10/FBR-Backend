'use strict';

/**
 * Seeder — add permissions for the modules introduced 2026-08-10:
 *   vendor.*  purchase.*  inventory.*
 * Grants them to SuperAdmin, CompanyAdmin and (where sensible) Accountant.
 */

const NEW_PERMISSIONS = [
  { module: 'vendor', action: 'create', description: 'Create vendors' },
  { module: 'vendor', action: 'read', description: 'View vendors' },
  { module: 'vendor', action: 'update', description: 'Update vendors' },
  { module: 'vendor', action: 'delete', description: 'Delete vendors' },

  { module: 'purchase', action: 'create', description: 'Create purchase invoices' },
  { module: 'purchase', action: 'read', description: 'View purchase invoices' },
  { module: 'purchase', action: 'update', description: 'Update draft purchase invoices' },
  { module: 'purchase', action: 'post', description: 'Post purchase invoices' },
  { module: 'purchase', action: 'cancel', description: 'Cancel purchase invoices' },

  { module: 'inventory', action: 'create', description: 'Create inventory adjustments' },
  { module: 'inventory', action: 'read', description: 'View inventory adjustments' },
  { module: 'inventory', action: 'post', description: 'Post inventory adjustments' },
  { module: 'inventory', action: 'cancel', description: 'Cancel inventory adjustments' },
];

const ROLE_GRANTS = {
  SuperAdmin: NEW_PERMISSIONS.map((p) => `${p.module}.${p.action}`),
  CompanyAdmin: NEW_PERMISSIONS.map((p) => `${p.module}.${p.action}`),
  Accountant: [
    'vendor.create',
    'vendor.read',
    'vendor.update',
    'purchase.create',
    'purchase.read',
    'purchase.update',
    'purchase.post',
    'inventory.create',
    'inventory.read',
    'inventory.post',
  ],
  Viewer: ['vendor.read', 'purchase.read', 'inventory.read'],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface /* , Sequelize */) {
    const now = new Date();

    // Insert new permissions (idempotent)
    const permissionRows = NEW_PERMISSIONS.map((p) => ({
      name: `${p.module}.${p.action}`,
      module: p.module,
      action: p.action,
      description: p.description,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('permissions', permissionRows, { ignoreDuplicates: true });

    // Fetch fresh IDs
    const [dbPermissions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM permissions',
    );
    const permByName = new Map(dbPermissions.map((p) => [p.name, p.id]));

    const [dbRoles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const roleByName = new Map(dbRoles.map((r) => [r.name, r.id]));

    // Build role_permissions rows
    const rolePermRows = [];
    for (const [roleName, permNames] of Object.entries(ROLE_GRANTS)) {
      const roleId = roleByName.get(roleName);
      if (!roleId) continue;
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
      await queryInterface.bulkInsert('role_permissions', rolePermRows, {
        ignoreDuplicates: true,
      });
    }
  },

  async down(queryInterface /* , Sequelize */) {
    const names = NEW_PERMISSIONS.map((p) => `${p.module}.${p.action}`);
    const [dbPermissions] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE name IN (${names.map((n) => `'${n}'`).join(',')})`,
    );
    const ids = dbPermissions.map((p) => p.id);
    if (ids.length > 0) {
      await queryInterface.sequelize.query(
        `DELETE FROM role_permissions WHERE permission_id IN (${ids.join(',')})`,
      );
      await queryInterface.sequelize.query(
        `DELETE FROM permissions WHERE id IN (${ids.join(',')})`,
      );
    }
  },
};
