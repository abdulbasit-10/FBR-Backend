'use strict';

/**
 * FBR reference cache tables.
 * These are refreshed periodically by pulling from the FBR reference endpoints.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Provinces
    await queryInterface.createTable('fbr_provinces', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      state_province_code: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      state_province_desc: { type: Sequelize.STRING(100), allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // Document Types
    await queryInterface.createTable('fbr_doc_types', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      doc_type_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      doc_description: { type: Sequelize.STRING(150), allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // HS Codes
    await queryInterface.createTable('fbr_hs_codes', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      hs_code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('fbr_hs_codes', ['hs_code']);

    // UOMs
    await queryInterface.createTable('fbr_uoms', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uom_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      description: { type: Sequelize.STRING(150), allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // Transaction Types
    await queryInterface.createTable('fbr_transaction_types', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      transaction_type_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      transaction_desc: { type: Sequelize.STRING(255), allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // SROs
    await queryInterface.createTable('fbr_sros', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      sro_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      sro_desc: { type: Sequelize.STRING(255), allowNull: false },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // Rates
    await queryInterface.createTable('fbr_rates', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      rate_id: { type: Sequelize.INTEGER, allowNull: false },
      rate_desc: { type: Sequelize.STRING(255), allowNull: false },
      rate_value: { type: Sequelize.DECIMAL(8, 4), allowNull: false, defaultValue: 0 },
      transaction_type_id: { type: Sequelize.INTEGER, allowNull: true },
      province_id: { type: Sequelize.INTEGER, allowNull: true },
      effective_date: { type: Sequelize.DATEONLY, allowNull: true },
      synced_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('fbr_rates', ['rate_id']);
    await queryInterface.addIndex('fbr_rates', [
      'transaction_type_id',
      'province_id',
      'effective_date',
    ]);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('fbr_rates');
    await queryInterface.dropTable('fbr_sros');
    await queryInterface.dropTable('fbr_transaction_types');
    await queryInterface.dropTable('fbr_uoms');
    await queryInterface.dropTable('fbr_hs_codes');
    await queryInterface.dropTable('fbr_doc_types');
    await queryInterface.dropTable('fbr_provinces');
  },
};
