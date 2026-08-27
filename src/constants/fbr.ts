/**
 * FBR Digital Invoicing constants derived from the PRAL Technical
 * Specification for DI API — User Manual v1.12 (§9 & §10).
 */

/** Sandbox testing scenarios (spec §9). */
export const FBR_SANDBOX_SCENARIOS = [
  'SN001', 'SN002', 'SN003', 'SN004', 'SN005', 'SN006', 'SN007',
  'SN008', 'SN009', 'SN010', 'SN011', 'SN012', 'SN013', 'SN014',
  'SN015', 'SN016', 'SN017', 'SN018', 'SN019', 'SN020', 'SN021',
  'SN022', 'SN023', 'SN024', 'SN025', 'SN026', 'SN027', 'SN028',
] as const;
export type FbrScenarioId = (typeof FBR_SANDBOX_SCENARIOS)[number];

/** Regex for a valid HS code as accepted by FBR (e.g. "0101.2100"). */
export const HS_CODE_PATTERN = /^\d{4}\.\d{4}$/;

/** Regex for a valid NTN (7 digits) or CNIC (13 digits). */
export const NTN_CNIC_PATTERN = /^(\d{7}|\d{13})$/;

/** Debit-note reference-invoice length rules (spec §4.1.2 invoiceRefNo). */
export const DEBIT_NOTE_REF_LENGTHS = [22, 28] as const;
