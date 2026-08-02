'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'posting_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'invoice_date',
    });

    await queryInterface.addColumn('invoices', 'po_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: 'posting_date',
    });

    await queryInterface.addColumn('invoices', 'po_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'po_date',
    });

    await queryInterface.addColumn('invoices', 'advance_tax', {
      type: Sequelize.DECIMAL(18, 4),
      allowNull: false,
      defaultValue: 0,
      after: 'total_value_including_st',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('invoices', 'advance_tax');
    await queryInterface.removeColumn('invoices', 'po_number');
    await queryInterface.removeColumn('invoices', 'po_date');
    await queryInterface.removeColumn('invoices', 'posting_date');
  },
};
