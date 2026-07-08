'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fbr_tokens', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      environment: {
        type: Sequelize.ENUM('sandbox', 'production'),
        allowNull: false,
      },
      token_encrypted: { type: Sequelize.TEXT, allowNull: false },
      issued_at: { type: Sequelize.DATE, allowNull: true },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('fbr_tokens', ['company_id']);
    await queryInterface.addIndex('fbr_tokens', ['company_id', 'environment']);
    await queryInterface.addIndex('fbr_tokens', ['is_active']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('fbr_tokens');
  },
};
