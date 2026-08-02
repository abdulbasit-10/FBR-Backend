'use strict';

const COMPANY_ADMIN_PERMS = [
  'user.create', 'user.read', 'user.update', 'user.delete',
  'company.read', 'company.update',
  'customer.create', 'customer.read', 'customer.update', 'customer.delete',
  'product.create', 'product.read', 'product.update', 'product.delete',
  'invoice.create', 'invoice.read', 'invoice.update', 'invoice.validate', 'invoice.post', 'invoice.cancel',
  'fbrtoken.manage', 'apilog.view', 'report.view', 'reference.sync',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add is_platform_role column (defaults false for all existing roles)
    await queryInterface.addColumn('roles', 'is_platform_role', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'is_system_role',
    });

    // 2. Mark SuperAdmin as platform-level so it cannot be assigned to company users
    await queryInterface.sequelize.query(
      "UPDATE roles SET is_platform_role = 1 WHERE name = 'SuperAdmin'",
    );

    // 3. Insert CompanyAdmin (INSERT IGNORE skips if already exists)
    await queryInterface.sequelize.query(`
      INSERT IGNORE INTO roles (uuid, name, description, is_system_role, is_platform_role, created_at, updated_at)
      VALUES (UUID(), 'CompanyAdmin', 'Administrator of a single company', 1, 0, NOW(), NOW())
    `);

    // 4. Assign all permissions to CompanyAdmin
    const inList = COMPANY_ADMIN_PERMS.map(() => '?').join(',');
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
       SELECT r.id, p.id, NOW(), NOW()
       FROM roles r
       JOIN permissions p ON p.name IN (${inList})
       WHERE r.name = 'CompanyAdmin'`,
      { replacements: COMPANY_ADMIN_PERMS },
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DELETE FROM roles WHERE name = 'CompanyAdmin'",
    );
    await queryInterface.removeColumn('roles', 'is_platform_role');
  },
};
