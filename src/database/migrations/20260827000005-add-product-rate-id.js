'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('products', 'rate_id', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'rate',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('products', 'rate_id');
    },
};
