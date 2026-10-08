'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoices', 'mapping_id', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'notes',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoices', 'mapping_id');
    },
};
