'use strict';

/**
 * Purchase invoices — inbound side of the ledger.
 * Structurally parallels `invoices` but references vendors and never posts
 * to FBR (purchases are captured for internal reporting only).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchases', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vendor_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'vendors', key: 'id' },
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

      purchase_no: { type: Sequelize.STRING(20), allowNull: true },
      purchase_type: {
        type: Sequelize.ENUM('Purchase Invoice', 'Purchase Return'),
        allowNull: false,
        defaultValue: 'Purchase Invoice',
      },
      original_purchase_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'purchases', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      vendor_invoice_no: { type: Sequelize.STRING(100), allowNull: true },
      doc_date: { type: Sequelize.DATEONLY, allowNull: false },
      posting_date: { type: Sequelize.DATEONLY, allowNull: true },
      po_date: { type: Sequelize.DATEONLY, allowNull: true },
      po_number: { type: Sequelize.STRING(100), allowNull: true },

      status: {
        type: Sequelize.ENUM('draft', 'posted', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      source: {
        type: Sequelize.ENUM('Manual', 'API', 'Import'),
        allowNull: false,
        defaultValue: 'Manual',
      },

      vendor_ntn_cnic: { type: Sequelize.STRING(15), allowNull: true },
      vendor_business_name: { type: Sequelize.STRING(255), allowNull: false },
      vendor_province: { type: Sequelize.STRING(100), allowNull: true },
      vendor_address: { type: Sequelize.STRING(500), allowNull: true },
      vendor_registration_type: { type: Sequelize.STRING(20), allowNull: true },

      assessed_value: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_discount: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_value_excluding_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_sales_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_further_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_extra_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_fed_payable: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      advance_tax: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      total_value_including_st: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },

      posted_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('purchases', ['company_id']);
    await queryInterface.addIndex('purchases', ['vendor_id']);
    await queryInterface.addIndex('purchases', ['status']);
    await queryInterface.addIndex('purchases', ['purchase_type']);
    await queryInterface.addIndex('purchases', ['doc_date']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('purchases');
  },
};
