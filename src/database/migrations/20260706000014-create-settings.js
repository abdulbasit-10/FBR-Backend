'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('settings', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scope: {
        type: Sequelize.ENUM('global', 'company', 'user'),
        allowNull: false,
        defaultValue: 'company',
      },
      key: { type: Sequelize.STRING(100), allowNull: false },
      value: { type: Sequelize.JSON, allowNull: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('settings', ['company_id']);
    await queryInterface.addIndex('settings', ['scope', 'key']);
    await queryInterface.addConstraint('settings', {
      fields: ['company_id', 'key'],
      type: 'unique',
      name: 'uq_settings_company_key',
    });
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('settings');
  },
};
