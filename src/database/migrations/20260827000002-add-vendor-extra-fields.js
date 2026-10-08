'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('vendors', 'contact_person', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'email',
        });

        await queryInterface.addColumn('vendors', 'whatsapp', {
            type: Sequelize.STRING(30),
            allowNull: true,
            after: 'contact_person',
        });

        await queryInterface.addColumn('vendors', 'website', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'whatsapp',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('vendors', 'website');
        await queryInterface.removeColumn('vendors', 'whatsapp');
        await queryInterface.removeColumn('vendors', 'contact_person');
    },
};
