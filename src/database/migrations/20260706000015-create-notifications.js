'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('info', 'success', 'warning', 'error'),
        allowNull: false,
        defaultValue: 'info',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      link: { type: Sequelize.STRING(500), allowNull: true },
      metadata: { type: Sequelize.JSON, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['created_at']);
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('notifications');
  },
};
