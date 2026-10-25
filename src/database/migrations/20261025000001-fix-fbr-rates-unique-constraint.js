'use strict';

/**
 * The previous migration made `rate_id` globally unique, which was correct when rates
 * were synced for a single shared transTypeId. Now that rates are synced per Sale Type
 * (each with its own transTypeId), the SAME rate_id can legitimately recur under several
 * different sale types (e.g. "0%" under both "Services" and "Goods at zero-rate") — the
 * global unique constraint would make each sale type's sync silently overwrite the last,
 * losing data for every sale type except whichever was synced most recently.
 *
 * Replace it with a composite unique constraint on (rate_id, transaction_type_id) so each
 * sale type keeps its own independent row for the same rate_id.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.removeIndex('fbr_rates', 'fbr_rates_rate_id_unique');
        await queryInterface.addIndex('fbr_rates', ['rate_id', 'transaction_type_id'], {
            unique: true,
            name: 'fbr_rates_rate_id_transtype_unique',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('fbr_rates', 'fbr_rates_rate_id_transtype_unique');
        await queryInterface.addIndex('fbr_rates', ['rate_id'], {
            unique: true,
            name: 'fbr_rates_rate_id_unique',
        });
    },
};
