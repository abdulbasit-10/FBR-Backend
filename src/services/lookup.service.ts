import config from '../config';
import {
  Company,
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
} from '../models';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/AppError';
import * as fbr from './fbr-client.service';
import * as fbrTokens from './fbr-token.service';

/**
 * Lookup / Reference module.
 *
 * The FBR gateway exposes reference data (provinces, HS codes, UOM, rates …).
 * We cache them locally in `fbr_*` tables so dropdowns don't hammer FBR and
 * so lookups keep working during FBR outages.
 *
 * All read helpers read from local cache; the sync helpers refresh cache
 * from the upstream FBR endpoints.
 */

// ---------- Cached reads ----------

export const listProvinces = () => FbrProvince.findAll({ order: [['state_province_desc', 'ASC']] });
export const listDocTypes = () => FbrDocType.findAll({ order: [['doc_type_id', 'ASC']] });
export const listHsCodes = (limit = 500) =>
  FbrHsCode.findAll({ order: [['hs_code', 'ASC']], limit });
export const listUoms = () => FbrUom.findAll({ order: [['description', 'ASC']] });
export const listTransactionTypes = () =>
  FbrTransactionType.findAll({ order: [['transaction_desc', 'ASC']] });
export const listSros = (limit = 500) => FbrSro.findAll({ order: [['sro_id', 'ASC']], limit });
export const listRates = () => FbrRate.findAll({ order: [['rate_value', 'ASC']] });

/** Search HS codes (LIKE) */
export const searchHsCodes = async (q: string, limit = 50) => {
  const term = `%${q.trim()}%`;
  return FbrHsCode.findAll({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: { [(await import('sequelize')).Op.like]: term } as any,
    },
    limit,
  });
};

// ---------- Registration type lookup (proxied, no cache) ----------

export interface RegTypeResult {
  statuscode?: string;
  REGISTRATION_TYPE?: string;
  message?: string;
}

/** Like the /postinvoicedata calls, STATL & Get_Reg_Type require the company's FBR bearer token. */
export const resolveCompanyToken = async (companyId: number): Promise<string> => {
  const company = await Company.findByPk(companyId);
  if (!company) throw new NotFoundError('Company not found');
  const environment = company.fbrEnvironment === 'production' ? 'production' : 'sandbox';
  return fbrTokens.getActiveTokenForCompany(companyId, environment);
};

/** POST /dist/v1/Get_Reg_Type — returns Registered/Unregistered for an NTN/CNIC */
export const getRegistrationType = async (
  registrationNo: string,
  token?: string,
): Promise<RegTypeResult> => {
  return fbr.postUtility<RegTypeResult>(
    config.fbr.endpoints.getRegType,
    { Registration_No: registrationNo },
    token,
  );
};

/** Get_Reg_Type for a given company — resolves the company's active FBR token first. */
export const getRegistrationTypeForCompany = async (
  companyId: number,
  registrationNo: string,
): Promise<RegTypeResult> => {
  const token = await resolveCompanyToken(companyId);
  return getRegistrationType(registrationNo, token);
};

// ---------- Active Taxpayer List lookup (STATL, §5.11 — proxied, no cache) ----------

export interface StatlResult {
  // FBR's own sample response uses a literal space in this key, not a typo — kept verbatim.
  'status code'?: string;
  status?: string;
}

/** POST /dist/v1/statl — returns Active/In-Active taxpayer status for an NTN/CNIC as of a date */
export const getActiveTaxpayerStatus = async (
  regno: string,
  date: string,
  token?: string,
): Promise<StatlResult> => {
  return fbr.postUtility<StatlResult>(config.fbr.endpoints.statl, { regno, date }, token);
};

/** STATL for a given company — resolves the company's active FBR token first. */
export const getActiveTaxpayerStatusForCompany = async (
  companyId: number,
  regno: string,
  date: string,
): Promise<StatlResult> => {
  const token = await resolveCompanyToken(companyId);
  return getActiveTaxpayerStatus(regno, date, token);
};

/** Combined check used by "Verify with FBR" — registration type + active-taxpayer status. */
export const verifyRegistration = async (
  companyId: number,
  regno: string,
  date?: string,
): Promise<{ registrationType: RegTypeResult; taxpayerStatus: StatlResult }> => {
  const token = await resolveCompanyToken(companyId);
  const asOf = date ?? new Date().toISOString().slice(0, 10);
  const [registrationType, taxpayerStatus] = await Promise.all([
    getRegistrationType(regno, token),
    getActiveTaxpayerStatus(regno, asOf, token),
  ]);
  return { registrationType, taxpayerStatus };
};

// ---------- Sync jobs (populate local cache from FBR) ----------

interface ProvinceDto {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}
interface DocTypeDto {
  docTypeId: number;
  docDescription: string;
}
interface HsCodeDto {
  hS_CODE?: string;
  hsCode?: string;
  description: string;
}
interface UomDto {
  uoM_ID?: number;
  uomId?: number;
  description: string;
}
interface TransTypeDto {
  transactioN_TYPE_ID?: number;
  transactionTypeId?: number;
  transactioN_DESC?: string;
  transactionDesc?: string;
}
interface SroDto {
  srO_ID?: number;
  sroId?: number;
  srO_DESC?: string;
  sroDesc?: string;
}
interface RateDto {
  ratE_ID?: number;
  rateId?: number;
  ratE_DESC?: string;
  rateDesc?: string;
  ratE_VALUE?: number | string;
  rateValue?: number | string;
}

export const syncProvinces = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<ProvinceDto[]>(config.fbr.endpoints.provinces, undefined, token);
  const now = new Date();
  await Promise.all(
    data.map((p) =>
      FbrProvince.upsert({
        stateProvinceCode: p.stateProvinceCode,
        stateProvinceDesc: p.stateProvinceDesc,
        syncedAt: now,
      }),
    ),
  );
  return data.length;
};

export const syncDocTypes = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<DocTypeDto[]>(config.fbr.endpoints.docType, undefined, token);
  const now = new Date();
  await Promise.all(
    data.map((d) =>
      FbrDocType.upsert({
        docTypeId: d.docTypeId,
        docDescription: d.docDescription,
        syncedAt: now,
      }),
    ),
  );
  return data.length;
};

export const syncHsCodes = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<HsCodeDto[]>(config.fbr.endpoints.itemDesc, undefined, token);
  const now = new Date();
  const rows = data
    .map((d) => ({
      hsCode: (d.hS_CODE ?? d.hsCode ?? '').trim(),
      description: d.description,
    }))
    .filter((r) => r.hsCode);
  await Promise.all(rows.map((r) => FbrHsCode.upsert({ ...r, syncedAt: now })));
  return rows.length;
};

export const syncUoms = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<UomDto[]>(config.fbr.endpoints.uom, undefined, token);
  const now = new Date();
  const rows = data
    .map((d) => ({
      uomId: (d.uoM_ID ?? d.uomId) as number,
      description: d.description,
    }))
    .filter((r) => Number.isFinite(r.uomId));
  await Promise.all(rows.map((r) => FbrUom.upsert({ ...r, syncedAt: now })));
  return rows.length;
};

export const syncTransactionTypes = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<TransTypeDto[]>(config.fbr.endpoints.transType, undefined, token);
  const now = new Date();
  const rows = data
    .map((d) => ({
      transactionTypeId: (d.transactioN_TYPE_ID ?? d.transactionTypeId) as number,
      transactionDesc: (d.transactioN_DESC ?? d.transactionDesc ?? '').trim(),
    }))
    .filter((r) => Number.isFinite(r.transactionTypeId));
  await Promise.all(rows.map((r) => FbrTransactionType.upsert({ ...r, syncedAt: now })));
  return rows.length;
};

export const syncSros = async (token?: string): Promise<number> => {
  const data = await fbr.fetchReference<SroDto[]>(config.fbr.endpoints.sroItem, undefined, token);
  const now = new Date();
  const rows = data
    .map((d) => ({
      sroId: (d.srO_ID ?? d.sroId) as number,
      sroDesc: (d.srO_DESC ?? d.sroDesc ?? '').trim(),
    }))
    .filter((r) => Number.isFinite(r.sroId));
  await Promise.all(rows.map((r) => FbrSro.upsert({ ...r, syncedAt: now })));
  return rows.length;
};

export const syncRates = async (
  transTypeId?: number,
  originationSupplier?: number,
  date?: string,
  token?: string,
): Promise<number> => {
  const params: Record<string, string | number> = {};
  if (transTypeId !== undefined) params.transTypeId = transTypeId;
  if (originationSupplier !== undefined) params.originationSupplier = originationSupplier;
  if (date) params.date = date;

  const data = await fbr.fetchReference<RateDto[]>(config.fbr.endpoints.saleTypeToRate, params, token);
  const now = new Date();
  const rows = data
    .map((d) => ({
      rateId: (d.ratE_ID ?? d.rateId) as number,
      rateDesc: (d.ratE_DESC ?? d.rateDesc ?? '').toString(),
      rateValue: Number(d.ratE_VALUE ?? d.rateValue ?? 0),
      transactionTypeId: transTypeId ?? null,
      provinceId: originationSupplier ?? null,
      effectiveDate: date ?? null,
    }))
    .filter((r) => Number.isFinite(r.rateId));
  await Promise.all(rows.map((r) => FbrRate.upsert({ ...r, syncedAt: now })));
  return rows.length;
};

/** Run every safe/general sync. Returns counts per module. */
export const syncAll = async (companyId: number): Promise<Record<string, number>> => {
  const token = await resolveCompanyToken(companyId);
  const counts: Record<string, number> = {};
  const runners: Array<[string, () => Promise<number>]> = [
    ['provinces', () => syncProvinces(token)],
    ['docTypes', () => syncDocTypes(token)],
    ['hsCodes', () => syncHsCodes(token)],
    ['uoms', () => syncUoms(token)],
    ['transactionTypes', () => syncTransactionTypes(token)],
    ['sros', () => syncSros(token)],
  ];
  for (const [name, fn] of runners) {
    try {
      counts[name] = await fn();
    } catch (err) {
      logger.warn(`Reference sync failed for ${name}: ${(err as Error).message}`);
      counts[name] = -1;
    }
  }

  // Rates (§5.8) is NOT a flat reference list like the others — FBR requires
  // date + transTypeId + originationSupplier (province) as query params. Default
  // to transTypeId=18 ("Sale Invoice", per PRAL's own documented example), today's
  // date, and this company's own declared province, so the "Sale Type" picker on
  // the New Item page (which derives its options from synced rates) has something
  // usable without requiring a separate UI for picking those filters up front.
  try {
    const company = await Company.findByPk(companyId);
    const province = company?.province
      ? await FbrProvince.findOne({ where: { stateProvinceDesc: company.province } })
      : null;
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${today.getFullYear()}`;
    counts.rates = await syncRates(18, province?.stateProvinceCode, date, token);
  } catch (err) {
    logger.warn(`Reference sync failed for rates: ${(err as Error).message}`);
    counts.rates = -1;
  }

  return counts;
};

// ---------- SRO Schedule (§5.7 — distinct from SRO Item/§5.4, live proxy, no cache) ----------

export interface SroScheduleResult {
  sroId: number;
  sroDesc: string;
}

/**
 * GET /pdi/v1/SroSchedule — the SRO *schedule* applicable to a given tax rate (rate_id),
 * NOT the same list as /sroitemcode (Item Serial No, cached in fbr_sros). Per spec §5.7
 * this depends on rate_id/date/origination_supplier_csv, so it's fetched live, not cached.
 */
export const getSroSchedules = async (
  rateId: number,
  date?: string,
  originationSupplier?: number,
  token?: string,
): Promise<SroScheduleResult[]> => {
  const params: Record<string, string | number> = { rate_id: rateId };
  if (date) params.date = date;
  if (originationSupplier !== undefined) params.origination_supplier_csv = originationSupplier;

  const data = await fbr.fetchReference<SroDto[]>(config.fbr.endpoints.sroSchedule, params, token);
  return data
    .map((d) => ({ sroId: (d.srO_ID ?? d.sroId) as number, sroDesc: (d.srO_DESC ?? d.sroDesc ?? '').trim() }))
    .filter((r) => Number.isFinite(r.sroId));
};

/** SRO Schedule for a given company — resolves the company's active FBR token first. */
export const getSroSchedulesForCompany = async (
  companyId: number,
  rateId: number,
  date?: string,
  originationSupplier?: number,
): Promise<SroScheduleResult[]> => {
  const token = await resolveCompanyToken(companyId);
  // FBR's SroSchedule endpoint rejects requests missing date / origination_supplier_csv
  // (see §5.7 example: rate_id + date + origination_supplier_csv together). Default them
  // from today's date and the company's own declared province when the caller (e.g. the
  // New Item page) only supplies rateId — same defaults syncRates() uses in syncAll().
  let resolvedDate = date;
  let resolvedOrigination = originationSupplier;
  if (!resolvedDate || resolvedOrigination === undefined) {
    const company = await Company.findByPk(companyId);
    if (resolvedOrigination === undefined && company?.province) {
      const province = await FbrProvince.findOne({ where: { stateProvinceDesc: company.province } });
      resolvedOrigination = province?.stateProvinceCode;
    }
    if (!resolvedDate) {
      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      resolvedDate = `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${today.getFullYear()}`;
    }
  }
  return getSroSchedules(rateId, resolvedDate, resolvedOrigination, token);
};

// ---------- SRO Item (§ SROItem v2 — distinct from /sroitemcode v1, scoped to a chosen SRO Schedule) ----------

export interface SroItemResult {
  srO_ITEM_ID: number;
  srO_ITEM_DESC: string;
}

/**
 * GET /pdi/v2/SROItem?date=&sro_id= — the Item Serial No list valid for a SPECIFIC SRO
 * Schedule (sro_id from getSroSchedules/§5.7). NOT the same as the static /pdi/v1/sroitemcode
 * list (cached in fbr_sros) which isn't actually scoped to the chosen schedule — that's why
 * the "Item Serial" picker on the New Item page previously had no relevant options for most
 * SRO Schedules (confirmed live: FBR error [0078] "Valid Item Sr. No. is mandatory where
 * SRO/Schedule No. is provided").
 */
export const getSroItems = async (
  sroId: number,
  date?: string,
  token?: string,
): Promise<{ sroItemId: number; sroItemDesc: string }[]> => {
  const params: Record<string, string | number> = { sro_id: sroId };
  if (date) params.date = date;

  const data = await fbr.fetchReference<Array<Record<string, unknown>>>(
    config.fbr.endpoints.sroItemV2,
    params,
    token,
  );
  return data
    .map((d) => ({
      sroItemId: Number(d.srO_ITEM_ID ?? d.sroItemId),
      sroItemDesc: String(d.srO_ITEM_DESC ?? d.sroItemDesc ?? '').trim(),
    }))
    .filter((r) => Number.isFinite(r.sroItemId));
};

/** SRO Item for a given company — resolves the company's active FBR token first. */
export const getSroItemsForCompany = async (
  companyId: number,
  sroId: number,
  date?: string,
): Promise<{ sroItemId: number; sroItemDesc: string }[]> => {
  const token = await resolveCompanyToken(companyId);
  let resolvedDate = date;
  if (!resolvedDate) {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    resolvedDate = `${String(today.getDate()).padStart(2, '0')}-${months[today.getMonth()]}-${today.getFullYear()}`;
  }
  return getSroItems(sroId, resolvedDate, token);
};
