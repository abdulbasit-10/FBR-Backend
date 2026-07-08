'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.STRING(1000), allowNull: true },
      hs_code: { type: Sequelize.STRING(20), allowNull: false },
      uom: { type: Sequelize.STRING(100), allowNull: false },
      sale_type: { type: Sequelize.STRING(150), allowNull: false },
      rate: { type: Sequelize.STRING(50), allowNull: false },
      rate_value: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      sro_schedule_no: { type: Sequelize.STRING(100), allowNull: true },
      sro_item_serial_no: { type: Sequelize.STRING(50), allowNull: true },
      unit_price: { type: Sequelize.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
      fixed_notified_value_or_retail_price: {
        type: Sequelize.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('products', ['company_id']);
    await queryInterface.addIndex('products', ['hs_code']);
    await queryInterface.addIndex('products', ['is_active']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('products');
  },
};
