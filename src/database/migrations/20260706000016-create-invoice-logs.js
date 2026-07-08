'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_logs', {
      id: { type: Sequelize.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      invoice_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'invoices', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      event: {
        type: Sequelize.ENUM(
          'created',
          'updated',
          'validated',
          'posted',
          'failed',
          'retried',
          'cancelled',
          'queued',
        ),
        allowNull: false,
      },
      from_status: { type: Sequelize.STRING(20), allowNull: true },
      to_status: { type: Sequelize.STRING(20), allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: true },
      payload: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('invoice_logs', ['invoice_id']);
    await queryInterface.addIndex('invoice_logs', ['event']);
    await queryInterface.addIndex('invoice_logs', ['created_at']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('invoice_logs');
  },
};
