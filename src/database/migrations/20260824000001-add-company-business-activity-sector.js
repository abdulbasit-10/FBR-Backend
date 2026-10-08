'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'business_activity', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'sales_tax_reg_no',
        });

        await queryInterface.addColumn('companies', 'sector', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'business_activity',
        });
    },

    async down(queryInterface /* , Sequelize */) {
        await queryInterface.removeColumn('companies', 'sector');
        await queryInterface.removeColumn('companies', 'business_activity');
    },
};
