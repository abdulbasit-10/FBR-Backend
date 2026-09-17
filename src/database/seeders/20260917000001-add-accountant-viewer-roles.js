'use strict';

/**
 * The original 20260706000001 seeder defined Accountant/Viewer but never actually
 * inserted them: it ran before the `roles.uuid` column existed (added later, NOT NULL +
 * UNIQUE), so its INSERT IGNORE silently dropped both rows instead of erroring — only
 * SuperAdmin/CompanyAdmin ever made it into the database. This seeder supplies uuid via
 * MySQL's UUID() so the insert actually succeeds, then grants the same permission set the
 * original seeders intended.
 */

const ACCOUNTANT_PERMS = [
    'company.read',
    'customer.create', 'customer.read', 'customer.update',
    'product.create', 'product.read', 'product.update',
    'invoice.create', 'invoice.read', 'invoice.update', 'invoice.validate', 'invoice.post',
    'report.view',
    'vendor.create', 'vendor.read', 'vendor.update',
    'purchase.create', 'purchase.read', 'purchase.update', 'purchase.post',
    'inventory.create', 'inventory.read', 'inventory.post',
];

const VIEWER_PERMS = [
    'company.read',
    'customer.read', 'product.read', 'invoice.read', 'report.view',
    'vendor.read', 'purchase.read', 'inventory.read',
];

const ROLES = [
    { name: 'Accountant', description: 'Creates and posts invoices, manages customers & products', perms: ACCOUNTANT_PERMS },
    { name: 'Viewer', description: 'Read-only access to reports & invoices', perms: VIEWER_PERMS },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        for (const role of ROLES) {
            await queryInterface.sequelize.query(
                `INSERT IGNORE INTO roles (uuid, name, description, is_system_role, is_platform_role, created_at, updated_at)
         VALUES (UUID(), ?, ?, 1, 0, NOW(), NOW())`,
                { replacements: [role.name, role.description] },
            );
        }

        const [dbRoles] = await queryInterface.sequelize.query(
            `SELECT id, name FROM roles WHERE name IN (?)`,
            { replacements: [ROLES.map((r) => r.name)] },
        );
        const [dbPermissions] = await queryInterface.sequelize.query('SELECT id, name FROM permissions');
        const permByName = new Map(dbPermissions.map((p) => [p.name, p.id]));
        const roleByName = new Map(dbRoles.map((r) => [r.name, r.id]));

        const now = new Date();
        const rolePermRows = [];
        for (const role of ROLES) {
            const roleId = roleByName.get(role.name);
            if (!roleId) continue;
            for (const permName of role.perms) {
                const permId = permByName.get(permName);
                if (!permId) continue;
                rolePermRows.push({ role_id: roleId, permission_id: permId, created_at: now, updated_at: now });
            }
        }
        if (rolePermRows.length > 0) {
            await queryInterface.bulkInsert('role_permissions', rolePermRows, { ignoreDuplicates: true });
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query("DELETE FROM roles WHERE name IN ('Accountant', 'Viewer')");
    },
};
