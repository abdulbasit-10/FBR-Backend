'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_logs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      direction: { type: Sequelize.ENUM('inbound', 'outbound'), allowNull: false },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      invoice_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      method: { type: Sequelize.STRING(10), allowNull: false },
      endpoint: { type: Sequelize.STRING(500), allowNull: false },
      request_headers: { type: Sequelize.JSON, allowNull: true },
      request_body: { type: Sequelize.JSON, allowNull: true },
      response_status: { type: Sequelize.INTEGER, allowNull: true },
      response_body: { type: Sequelize.JSON, allowNull: true },
      duration_ms: { type: Sequelize.INTEGER, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      error_message: { type: Sequelize.TEXT, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('api_logs', ['direction']);
    await queryInterface.addIndex('api_logs', ['company_id']);
    await queryInterface.addIndex('api_logs', ['user_id']);
    await queryInterface.addIndex('api_logs', ['invoice_id']);
    await queryInterface.addIndex('api_logs', ['created_at']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('api_logs');
  },
};
