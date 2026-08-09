'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      purchase_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'purchases', key: 'id' },
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
      hs_code: { type: Sequelize.STRING(20), allowNull: true },
      product_description: { type: Sequelize.STRING(500), allowNull: false },
      uom: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      assessed_per_unit: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      retail_price: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      discount_percent: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      tax_percent: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      sales_tax_applicable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      further_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      extra_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      fed_payable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      value_excluding_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      value_including_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('purchase_items', ['purchase_id']);
    await queryInterface.addIndex('purchase_items', ['product_id']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('purchase_items');
  },
};
