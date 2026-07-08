'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      customer_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      invoice_type: {
        type: Sequelize.ENUM('Sale Invoice', 'Debit Note'),
        allowNull: false,
      },
      invoice_date: { type: Sequelize.DATEONLY, allowNull: false },
      invoice_ref_no: { type: Sequelize.STRING(50), allowNull: true },
      scenario_id: { type: Sequelize.STRING(10), allowNull: true },

      status: {
        type: Sequelize.ENUM('draft', 'validated', 'posted', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      environment: {
        type: Sequelize.ENUM('sandbox', 'production'),
        allowNull: false,
        defaultValue: 'sandbox',
      },

      seller_ntn_cnic: { type: Sequelize.STRING(15), allowNull: false },
      seller_business_name: { type: Sequelize.STRING(255), allowNull: false },
      seller_province: { type: Sequelize.STRING(100), allowNull: false },
      seller_address: { type: Sequelize.STRING(500), allowNull: false },
      buyer_ntn_cnic: { type: Sequelize.STRING(15), allowNull: true },
      buyer_business_name: { type: Sequelize.STRING(255), allowNull: false },
      buyer_province: { type: Sequelize.STRING(100), allowNull: false },
      buyer_address: { type: Sequelize.STRING(500), allowNull: false },
      buyer_registration_type: { type: Sequelize.STRING(20), allowNull: false },

      total_value_excluding_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_sales_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_further_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_extra_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_fed_payable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_discount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_value_including_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },

      fbr_invoice_number: { type: Sequelize.STRING(50), allowNull: true },
      fbr_dated: { type: Sequelize.DATE, allowNull: true },
      fbr_status_code: { type: Sequelize.STRING(10), allowNull: true },
      fbr_status: { type: Sequelize.STRING(50), allowNull: true },
      fbr_error_code: { type: Sequelize.STRING(20), allowNull: true },
      fbr_error: { type: Sequelize.TEXT, allowNull: true },
      fbr_raw_response: { type: Sequelize.JSON, allowNull: true },

      posted_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('invoices', ['company_id']);
    await queryInterface.addIndex('invoices', ['customer_id']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['invoice_date']);
    await queryInterface.addIndex('invoices', ['fbr_invoice_number']);
    await queryInterface.addIndex('invoices', ['company_id', 'status']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('invoices');
  },
};
