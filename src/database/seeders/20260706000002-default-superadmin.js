'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

/**
 * Creates (or upserts) a default SuperAdmin user.
 * Credentials come from environment variables so they're not hard-coded:
 *   SEED_SUPERADMIN_EMAIL     (default: admin@example.com)
 *   SEED_SUPERADMIN_PASSWORD  (default: Admin@12345)  <-- CHANGE ON FIRST LOGIN
 *   SEED_SUPERADMIN_NAME      (default: Super Admin)
 */

const EMAIL = process.env.SEED_SUPERADMIN_EMAIL || 'admin@example.com';
const PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@12345';
const NAME = process.env.SEED_SUPERADMIN_NAME || 'Super Admin';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface /* , Sequelize */) {
    const now = new Date();

    // Look up SuperAdmin role
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'SuperAdmin' LIMIT 1",
    );
    const superAdminRoleId = roles[0]?.id;
    if (!superAdminRoleId) {
      throw new Error("SuperAdmin role not found. Run 'default-roles-permissions' seeder first.");
    }

    // If user already exists, do nothing (idempotent)
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email: EMAIL } },
    );
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[seeder] SuperAdmin already exists: ${EMAIL}`);
      return;
    }

    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    await queryInterface.bulkInsert('users', [
      {
        uuid: randomUUID(),
        company_id: null, // platform-level user, no company
        role_id: superAdminRoleId,
        name: NAME,
        email: EMAIL,
        password_hash: passwordHash,
        phone: null,
        is_active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    // eslint-disable-next-line no-console
    console.log(`[seeder] SuperAdmin created: ${EMAIL} (change the default password!)`);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.bulkDelete('users', { email: EMAIL }, {});
  },
};
