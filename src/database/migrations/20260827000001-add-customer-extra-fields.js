'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('customers', 'contact', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'strn',
        });

        await queryInterface.addColumn('customers', 'contact_person', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'contact',
        });

        await queryInterface.addColumn('customers', 'whatsapp', {
            type: Sequelize.STRING(30),
            allowNull: true,
            after: 'contact_person',
        });

        await queryInterface.addColumn('customers', 'website', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'whatsapp',
        });

        await queryInterface.addColumn('customers', 'mapping_id', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'website',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('customers', 'mapping_id');
        await queryInterface.removeColumn('customers', 'website');
        await queryInterface.removeColumn('customers', 'whatsapp');
        await queryInterface.removeColumn('customers', 'contact_person');
        await queryInterface.removeColumn('customers', 'contact');
    },
};
