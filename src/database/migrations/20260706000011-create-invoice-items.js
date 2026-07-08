'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoice_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      invoice_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'invoices', key: 'id' },
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
      item_sr_no: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },

      hs_code: { type: Sequelize.STRING(20), allowNull: false },
      product_description: { type: Sequelize.STRING(1000), allowNull: false },
      rate: { type: Sequelize.STRING(50), allowNull: false },
      uom: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
      total_values: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      value_sales_excluding_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      fixed_notified_value_or_retail_price: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      sales_tax_applicable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      sales_tax_withheld_at_source: {
        type: Sequelize.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
      },
      extra_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      further_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      sro_schedule_no: { type: Sequelize.STRING(100), allowNull: true },
      fed_payable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      discount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      sale_type: { type: Sequelize.STRING(150), allowNull: false },
      sro_item_serial_no: { type: Sequelize.STRING(50), allowNull: true },

      fbr_invoice_no: { type: Sequelize.STRING(60), allowNull: true },
      fbr_status_code: { type: Sequelize.STRING(10), allowNull: true },
      fbr_status: { type: Sequelize.STRING(50), allowNull: true },
      fbr_error_code: { type: Sequelize.STRING(20), allowNull: true },
      fbr_error: { type: Sequelize.TEXT, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('invoice_items', ['invoice_id']);
    await queryInterface.addIndex('invoice_items', ['hs_code']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('invoice_items');
  },
};
