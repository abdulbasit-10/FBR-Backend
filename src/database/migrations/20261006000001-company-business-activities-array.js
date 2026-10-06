'use strict';

/**
 * Converts companies.business_activity (single value) into business_activities
 * (JSON array), so a company can declare more than one Business Activity to FBR
 * — matching PRAL's IRIS registration form, where Business Nature allows multiple
 * selections but Sector remains a single value.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'business_activities', {
            type: Sequelize.JSON,
            allowNull: true,
            after: 'business_activity',
        });

        await queryInterface.sequelize.query(
            `UPDATE companies
       SET business_activities = JSON_ARRAY(business_activity)
       WHERE business_activity IS NOT NULL AND business_activity <> ''`,
        );

        await queryInterface.removeColumn('companies', 'business_activity');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'business_activity', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'sales_tax_reg_no',
        });

        await queryInterface.sequelize.query(
            `UPDATE companies
       SET business_activity = JSON_UNQUOTE(JSON_EXTRACT(business_activities, '$[0]'))
       WHERE business_activities IS NOT NULL`,
        );

        await queryInterface.removeColumn('companies', 'business_activities');
    },
};
