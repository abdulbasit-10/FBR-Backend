'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      ntn: { type: Sequelize.STRING(15), allowNull: false, unique: true },
      address: { type: Sequelize.STRING(500), allowNull: false },
      province: { type: Sequelize.STRING(100), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      sales_tax_reg_no: { type: Sequelize.STRING(50), allowNull: true },
      fbr_environment: {
        type: Sequelize.ENUM('sandbox', 'production', 'both'),
        allowNull: false,
        defaultValue: 'sandbox',
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('companies', ['ntn']);
    await queryInterface.addIndex('companies', ['is_active']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('companies');
  },
};
