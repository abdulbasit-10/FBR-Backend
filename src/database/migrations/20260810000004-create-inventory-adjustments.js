'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_adjustments', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      adjustment_no: { type: Sequelize.STRING(20), allowNull: true },
      doc_date: { type: Sequelize.DATEONLY, allowNull: false },
      posting_date: { type: Sequelize.DATEONLY, allowNull: true },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      source: {
        type: Sequelize.ENUM('Manual', 'API', 'Import'),
        allowNull: false,
        defaultValue: 'Manual',
      },
      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      lines: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      line_total: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      posted_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('inventory_adjustments', ['company_id']);
    await queryInterface.addIndex('inventory_adjustments', ['status']);
    await queryInterface.addIndex('inventory_adjustments', ['doc_date']);

    await queryInterface.createTable('inventory_adjustment_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      adjustment_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'inventory_adjustments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      item_sr_no: { type: Sequelize.INTEGER, allowNull: false },
      product_description: { type: Sequelize.STRING(500), allowNull: false },
      uom: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      unit_cost: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      line_value: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('inventory_adjustment_items', ['adjustment_id']);
    await queryInterface.addIndex('inventory_adjustment_items', ['product_id']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('inventory_adjustment_items');
    await queryInterface.dropTable('inventory_adjustments');
  },
};
