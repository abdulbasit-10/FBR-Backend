'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      uuid: { type: Sequelize.UUID, allowNull: false, unique: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      business_name: { type: Sequelize.STRING(255), allowNull: false },
      ntn_cnic: { type: Sequelize.STRING(15), allowNull: true },
      registration_type: {
        type: Sequelize.ENUM('Registered', 'Unregistered'),
        allowNull: false,
      },
      province: { type: Sequelize.STRING(100), allowNull: false },
      address: { type: Sequelize.STRING(500), allowNull: false },
      phone: { type: Sequelize.STRING(30), allowNull: true },
      email: { type: Sequelize.STRING(255), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('customers', ['company_id']);
    await queryInterface.addIndex('customers', ['ntn_cnic']);
    await queryInterface.addIndex('customers', ['company_id', 'ntn_cnic']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('customers');
  },
};
