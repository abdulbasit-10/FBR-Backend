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
        // Defensive: only drop the old index if it actually exists on this database —
        // avoids a hard failure if the prior migration's exact state is uncertain.
        const [existing] = await queryInterface.sequelize.query('SHOW INDEX FROM fbr_rates');
        const hasOldIndex = existing.some((row) => row.Key_name === 'fbr_rates_rate_id_unique');
        if (hasOldIndex) {
            await queryInterface.removeIndex('fbr_rates', 'fbr_rates_rate_id_unique');
        }
        const hasNewIndex = existing.some((row) => row.Key_name === 'fbr_rates_rate_id_transtype_unique');
        if (!hasNewIndex) {
            await queryInterface.addIndex('fbr_rates', ['rate_id', 'transaction_type_id'], {
                unique: true,
                name: 'fbr_rates_rate_id_transtype_unique',
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('fbr_rates', 'fbr_rates_rate_id_transtype_unique');
        await queryInterface.addIndex('fbr_rates', ['rate_id'], {
            unique: true,
            name: 'fbr_rates_rate_id_unique',
        });
    },
};
