'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.addIndex('fbr_rates', ['rate_id'], {
            unique: true,
            name: 'fbr_rates_rate_id_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('fbr_rates', 'fbr_rates_rate_id_unique');
    },
};
