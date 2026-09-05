'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('support_tickets', 'attachment_url', {
            type: Sequelize.STRING(500),
            allowNull: true,
            after: 'resolved_at',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('support_tickets', 'attachment_url');
    },
};
