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
  return getSroSchedules(rateId, date, originationSupplier, token);
};
