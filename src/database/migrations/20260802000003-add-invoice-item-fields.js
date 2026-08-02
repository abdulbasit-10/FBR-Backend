'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoice_items', 'unit_price', {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      after: 'sro_item_serial_no',
    });

    await queryInterface.addColumn('invoice_items', 'discount_percent', {
      type: Sequelize.DECIMAL(8, 4),
      allowNull: false,
      defaultValue: 0,
      after: 'unit_price',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('invoice_items', 'discount_percent');
    await queryInterface.removeColumn('invoice_items', 'unit_price');
  },
};
