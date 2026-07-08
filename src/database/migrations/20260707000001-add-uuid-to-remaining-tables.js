'use strict';

const { v4: uuidv4 } = require('uuid');

const tables = ['notifications', 'settings', 'fbr_tokens', 'roles'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of tables) {
      // Add the column (nullable first so existing rows don't fail)
      await queryInterface.addColumn(table, 'uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        unique: false, // unique added after back-fill
      });

      // Back-fill existing rows
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM \`${table}\` WHERE uuid IS NULL`
      );
      for (const row of rows) {
        await queryInterface.sequelize.query(
          `UPDATE \`${table}\` SET uuid = ? WHERE id = ?`,
          { replacements: [uuidv4(), row.id] }
        );
      }

      // Now make it NOT NULL + UNIQUE
      await queryInterface.changeColumn(table, 'uuid', {
        type: Sequelize.UUID,
        allowNull: false,
      });
      await queryInterface.addIndex(table, ['uuid'], { unique: true, name: `${table}_uuid_unique` });
    }
  },

  async down(queryInterface) {
    for (const table of tables) {
      await queryInterface.removeIndex(table, `${table}_uuid_unique`);
      await queryInterface.removeColumn(table, 'uuid');
    }
  },
};
