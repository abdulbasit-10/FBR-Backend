'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'customer_no', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'is_active',
    });

    await queryInterface.addColumn('customers', 'customer_type', {
      type: Sequelize.ENUM('Individual', 'Company'),
      allowNull: false,
      defaultValue: 'Individual',
      after: 'customer_no',
    });

    await queryInterface.addColumn('customers', 'strn', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'customer_type',
    });

    await queryInterface.addIndex('customers', ['customer_no'], { name: 'customers_customer_no' });
    await queryInterface.addIndex('customers', ['customer_type'], { name: 'customers_customer_type' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('customers', 'customers_customer_no');
    await queryInterface.removeIndex('customers', 'customers_customer_type');
    await queryInterface.removeColumn('customers', 'strn');
    await queryInterface.removeColumn('customers', 'customer_type');
    await queryInterface.removeColumn('customers', 'customer_no');
  },
};
