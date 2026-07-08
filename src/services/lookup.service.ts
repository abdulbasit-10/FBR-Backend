import config from '../config';
import {
  FbrProvince,
  FbrDocType,
  FbrHsCode,
  FbrUom,
  FbrTransactionType,
  FbrSro,
  FbrRate,
} from '../models';
import logger from '../utils/logger';
import * as fbr from './fbr-client.service';

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

export const syncProvinces = async (): Promise<number> => {
  const data = await fbr.fetchReference<ProvinceDto[]>(config.fbr.endpoints.provinces);
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

export const syncDocTypes = async (): Promise<number> => {
  const data = await fbr.fetchReference<DocTypeDto[]>(config.fbr.endpoints.docType);
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

export const syncHsCodes = async (): Promise<number> => {
  const data = await fbr.fetchReference<HsCodeDto[]>(config.fbr.endpoints.itemDesc);
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

export const syncUoms = async (): Promise<number> => {
  const data = await fbr.fetchReference<UomDto[]>(config.fbr.endpoints.uom);
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

export const syncTransactionTypes = async (): Promise<number> => {
  const data = await fbr.fetchReference<TransTypeDto[]>(config.fbr.endpoints.transType);
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

export const syncSros = async (): Promise<number> => {
  const data = await fbr.fetchReference<SroDto[]>(config.fbr.endpoints.sroItem);
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
): Promise<number> => {
  const params: Record<string, string | number> = {};
  if (transTypeId !== undefined) params.transTypeId = transTypeId;
  if (originationSupplier !== undefined) params.originationSupplier = originationSupplier;
  if (date) params.date = date;

  const data = await fbr.fetchReference<RateDto[]>(config.fbr.endpoints.saleTypeToRate, params);
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
export const syncAll = async (): Promise<Record<string, number>> => {
  const counts: Record<string, number> = {};
  const runners: Array<[string, () => Promise<number>]> = [
    ['provinces', syncProvinces],
    ['docTypes', syncDocTypes],
    ['hsCodes', syncHsCodes],
    ['uoms', syncUoms],
    ['transactionTypes', syncTransactionTypes],
    ['sros', syncSros],
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
