/**
 * FBR §10 — Applicable Scenarios based on Business Activity × Sector.
 * Sourced from PRAL Technical Specification for DI API v1.12.
 *
 * The mapping enumerates which sandbox scenario IDs (SN001–SN028)
 * a seller may use given its declared business activity and sector.
 */

export const FBR_BUSINESS_ACTIVITIES = [
  'Manufacturer',
  'Importer',
  'Distributor',
  'Wholesaler',
  'Exporter',
  'Retailer',
  'Service Provider',
  'Other',
] as const;
export type FbrBusinessActivity = (typeof FBR_BUSINESS_ACTIVITIES)[number];

export const FBR_SECTORS = [
  'All Other Sectors',
  'Steel',
  'FMCG',
  'Textile',
  'Telecom',
  'Petroleum',
  'Electricity Distribution',
  'Gas Distribution',
  'Services',
  'Automobile',
  'CNG Stations',
  'Pharmaceuticals',
  'Wholesale / Retails',
] as const;
export type FbrSector = (typeof FBR_SECTORS)[number];

// Base sets reused below.
const BASE = ['SN001','SN002','SN005','SN006','SN007','SN015','SN016','SN017','SN021','SN022','SN024'];
const RETAIL_SET = ['SN026','SN027','SN028','SN008'];

const MANUFACTURER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      BASE,
  Steel:                    ['SN003','SN004','SN011'],
  FMCG:                     [...BASE, 'SN008'],
  Textile:                  [...BASE, 'SN009'],
  Telecom:                  [...BASE, 'SN010'],
  Petroleum:                [...BASE, 'SN012'],
  'Electricity Distribution': [...BASE, 'SN013'],
  'Gas Distribution':       [...BASE, 'SN014'],
  Services:                 [...BASE, 'SN018','SN019'],
  Automobile:               [...BASE, 'SN020'],
  'CNG Stations':           [...BASE, 'SN023'],
  Pharmaceuticals:          [...BASE],
  'Wholesale / Retails':    [...BASE, ...RETAIL_SET],
};

const IMPORTER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      BASE,
  Steel:                    [...BASE, 'SN003','SN004','SN011'],
  FMCG:                     [...BASE, 'SN008'],
  Textile:                  [...BASE, 'SN009'],
  Telecom:                  [...BASE, 'SN010'],
  Petroleum:                [...BASE, 'SN012'],
  'Electricity Distribution': [...BASE, 'SN013'],
  'Gas Distribution':       [...BASE, 'SN014'],
  Services:                 [...BASE, 'SN018','SN019'],
  Automobile:               [...BASE, 'SN020'],
  'CNG Stations':           [...BASE, 'SN023'],
  Pharmaceuticals:          [...BASE, 'SN025'],
  'Wholesale / Retails':    [...BASE, ...RETAIL_SET],
};

const DISTRIBUTOR: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      [...BASE, ...RETAIL_SET],
  Steel:                    ['SN003','SN004','SN011', ...RETAIL_SET],
  FMCG:                     ['SN008', ...RETAIL_SET],
  Textile:                  ['SN009', ...RETAIL_SET],
  Telecom:                  ['SN010', ...RETAIL_SET],
  Petroleum:                ['SN012', ...RETAIL_SET],
  'Electricity Distribution': ['SN013', ...RETAIL_SET],
  'Gas Distribution':       ['SN014', ...RETAIL_SET],
  Services:                 ['SN018','SN019', ...RETAIL_SET],
  Automobile:               ['SN020', ...RETAIL_SET],
  'CNG Stations':           ['SN023', ...RETAIL_SET],
  Pharmaceuticals:          ['SN025', ...RETAIL_SET],
  'Wholesale / Retails':    ['SN001','SN002', ...RETAIL_SET],
};

const WHOLESALER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      [...BASE, ...RETAIL_SET],
  Steel:                    ['SN003','SN004','SN011', ...RETAIL_SET],
  FMCG:                     ['SN008', ...RETAIL_SET],
  Textile:                  ['SN009', ...RETAIL_SET],
  Telecom:                  ['SN010', ...RETAIL_SET],
  Petroleum:                ['SN012', ...RETAIL_SET],
  'Electricity Distribution': ['SN013', ...RETAIL_SET],
  'Gas Distribution':       ['SN014', ...RETAIL_SET],
  Services:                 ['SN018','SN019', ...RETAIL_SET],
  Automobile:               ['SN020', ...RETAIL_SET],
  'CNG Stations':           ['SN023', ...RETAIL_SET],
  Pharmaceuticals:          ['SN025', ...RETAIL_SET],
  'Wholesale / Retails':    ['SN001','SN002', ...RETAIL_SET],
};

const EXPORTER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      BASE,
  Steel:                    [...BASE, 'SN003','SN004','SN011'],
  FMCG:                     [...BASE, 'SN008'],
  Textile:                  [...BASE, 'SN009'],
  Telecom:                  [...BASE, 'SN010'],
  Petroleum:                [...BASE, 'SN012'],
  'Electricity Distribution': [...BASE, 'SN013'],
  'Gas Distribution':       [...BASE, 'SN014'],
  Services:                 [...BASE, 'SN018','SN019'],
  Automobile:               [...BASE, 'SN020'],
  'CNG Stations':           [...BASE, 'SN023'],
  Pharmaceuticals:          [...BASE, 'SN025'],
  'Wholesale / Retails':    [...BASE, ...RETAIL_SET],
};

const RETAILER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      [...BASE, ...RETAIL_SET],
  Steel:                    ['SN003','SN004','SN011'],
  FMCG:                     RETAIL_SET,
  Textile:                  ['SN009', ...RETAIL_SET],
  Telecom:                  ['SN010', ...RETAIL_SET],
  Petroleum:                ['SN012', ...RETAIL_SET],
  'Electricity Distribution': ['SN013', ...RETAIL_SET],
  'Gas Distribution':       ['SN014', ...RETAIL_SET],
  Services:                 ['SN018','SN019', ...RETAIL_SET],
  Automobile:               ['SN020', ...RETAIL_SET],
  'CNG Stations':           ['SN023', ...RETAIL_SET],
  Pharmaceuticals:          ['SN025', ...RETAIL_SET],
  'Wholesale / Retails':    RETAIL_SET,
};

const SERVICE_PROVIDER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      [...BASE, 'SN018','SN019'],
  Steel:                    ['SN003','SN004','SN011','SN018','SN019'],
  FMCG:                     ['SN008','SN018','SN019'],
  Textile:                  ['SN009','SN018','SN019'],
  Telecom:                  ['SN010','SN018','SN019'],
  Petroleum:                ['SN012','SN018','SN019'],
  'Electricity Distribution': ['SN013','SN018','SN019'],
  'Gas Distribution':       ['SN014','SN018','SN019'],
  Services:                 ['SN018','SN019'],
  Automobile:               ['SN020','SN018','SN019'],
  'CNG Stations':           ['SN023','SN018','SN019'],
  Pharmaceuticals:          ['SN025','SN018','SN019'],
  'Wholesale / Retails':    [...RETAIL_SET, 'SN018','SN019'],
};

const OTHER: Partial<Record<FbrSector, string[]>> = {
  'All Other Sectors':      BASE,
  Steel:                    [...BASE, 'SN003','SN004','SN011'],
  FMCG:                     [...BASE, 'SN008'],
  Textile:                  [...BASE, 'SN009'],
  Telecom:                  [...BASE, 'SN010'],
  Petroleum:                [...BASE, 'SN012'],
  'Electricity Distribution': [...BASE, 'SN013'],
  'Gas Distribution':       [...BASE, 'SN014'],
  Services:                 [...BASE, 'SN018','SN019'],
  Automobile:               [...BASE, 'SN020'],
  'CNG Stations':           [...BASE, 'SN023'],
  Pharmaceuticals:          [...BASE, 'SN025'],
  'Wholesale / Retails':    [...BASE, ...RETAIL_SET],
};

const APPLICABLE_MAP: Record<FbrBusinessActivity, Partial<Record<FbrSector, string[]>>> = {
  Manufacturer: MANUFACTURER,
  Importer: IMPORTER,
  Distributor: DISTRIBUTOR,
  Wholesaler: WHOLESALER,
  Exporter: EXPORTER,
  Retailer: RETAILER,
  'Service Provider': SERVICE_PROVIDER,
  Other: OTHER,
};

/**
 * Returns the sandbox scenario IDs applicable to the given activity + sector,
 * or `null` if the pairing isn't declared in the spec.
 */
export function applicableScenarios(
  activity: FbrBusinessActivity | null | undefined,
  sector: FbrSector | null | undefined,
): string[] | null {
  if (!activity || !sector) return null;
  return APPLICABLE_MAP[activity]?.[sector] ?? null;
}

/** True if `scenarioId` is allowed for the (activity, sector) pair. */
export function isScenarioApplicable(
  activity: FbrBusinessActivity | null | undefined,
  sector: FbrSector | null | undefined,
  scenarioId: string,
): boolean {
  const list = applicableScenarios(activity, sector);
  if (!list) return true; // caller declined to declare — accept
  return list.includes(scenarioId);
}
