'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('products', 'item_type', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'name',
        });

        await queryInterface.addColumn('products', 'item_category', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'item_type',
        });

        await queryInterface.addColumn('products', 'tax_description', {
            type: Sequelize.STRING(255),
            allowNull: true,
            after: 'rate_value',
        });

        await queryInterface.addColumn('products', 'assessed_unit_cost', {
            type: Sequelize.DECIMAL(15, 4),
            allowNull: true,
            after: 'unit_price',
        });

        await queryInterface.addColumn('products', 'sales_price', {
            type: Sequelize.DECIMAL(15, 4),
            allowNull: true,
            after: 'assessed_unit_cost',
        });

        await queryInterface.addColumn('products', 'print_uom', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'fixed_notified_value_or_retail_price',
        });

        await queryInterface.addColumn('products', 'mapping_id', {
            type: Sequelize.STRING(100),
            allowNull: true,
            after: 'print_uom',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('products', 'mapping_id');
        await queryInterface.removeColumn('products', 'print_uom');
        await queryInterface.removeColumn('products', 'sales_price');
        await queryInterface.removeColumn('products', 'assessed_unit_cost');
        await queryInterface.removeColumn('products', 'tax_description');
        await queryInterface.removeColumn('products', 'item_category');
        await queryInterface.removeColumn('products', 'item_type');
    },
};
