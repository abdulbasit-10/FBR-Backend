import axios, { AxiosError, AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { FbrApiError } from '../utils/AppError';
import { ApiLog } from '../models';

const REDACT_HEADERS = new Set(['authorization', 'cookie', 'set-cookie']);

const redactHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = REDACT_HEADERS.has(k.toLowerCase()) ? '***' : v;
  }
  return out;
};

const buildClient = (token: string): AxiosInstance =>
  axios.create({
    baseURL: config.fbr.baseUrl,
    timeout: config.fbr.timeoutMs,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

interface LogContext {
  companyId?: number | null;
  userId?: number | null;
  invoiceId?: number | null;
}

const persistOutboundLog = async (params: {
  method: string;
  url: string;
  requestHeaders?: Record<string, unknown>;
  requestBody?: unknown;
  responseStatus?: number | null;
  responseBody?: unknown;
  durationMs: number;
  errorMessage?: string | null;
  ctx?: LogContext;
}): Promise<void> => {
  try {
    await ApiLog.create({
      direction: 'outbound',
      companyId: params.ctx?.companyId ?? null,
      userId: params.ctx?.userId ?? null,
      invoiceId: params.ctx?.invoiceId ?? null,
      method: params.method,
      endpoint: params.url,
      requestHeaders: params.requestHeaders
        ? (redactHeaders(params.requestHeaders) as object)
        : null,
      requestBody: (params.requestBody as object) ?? null,
      responseStatus: params.responseStatus ?? null,
      responseBody: (params.responseBody as object) ?? null,
      durationMs: Math.round(params.durationMs),
      errorMessage: params.errorMessage ?? null,
    });
  } catch (err) {
    logger.warn('Failed to persist outbound api log', { err: (err as Error).message });
  }
};

// ---------- Endpoint helpers ----------

const postInvoicePath = (env: 'sandbox' | 'production'): string =>
  env === 'sandbox'
    ? config.fbr.endpoints.postInvoiceSandbox
    : config.fbr.endpoints.postInvoiceProduction;

const validateInvoicePath = (env: 'sandbox' | 'production'): string =>
  env === 'sandbox'
    ? config.fbr.endpoints.validateInvoiceSandbox
    : config.fbr.endpoints.validateInvoiceProduction;

// ---------- FBR Response types ----------

export interface FbrItemStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo: string;
  errorCode: string;
  error: string;
}

export interface FbrInvoiceResponse {
  invoiceNumber?: string;
  dated?: string;
  validationResponse?: {
    statusCode: string;
    status: string;
    errorCode?: string;
    error?: string;
    invoiceStatuses?: FbrItemStatus[] | null;
  };
}

// ---------- Public API ----------

export const postInvoice = async (params: {
  token: string;
  environment: 'sandbox' | 'production';
  payload: object;
  ctx?: LogContext;
}): Promise<FbrInvoiceResponse> => {
  const url = postInvoicePath(params.environment);
  const client = buildClient(params.token);
  const started = Date.now();
  try {
    const res = await client.post(url, params.payload);
    await persistOutboundLog({
      method: 'POST',
      url: `${config.fbr.baseUrl}${url}`,
      requestHeaders: client.defaults.headers as Record<string, unknown>,
      requestBody: params.payload,
      responseStatus: res.status,
      responseBody: res.data,
      durationMs: Date.now() - started,
      ctx: params.ctx,
    });
    return res.data as FbrInvoiceResponse;
  } catch (err) {
    const axErr = err as AxiosError;
    await persistOutboundLog({
      method: 'POST',
      url: `${config.fbr.baseUrl}${url}`,
      requestHeaders: client.defaults.headers as Record<string, unknown>,
      requestBody: params.payload,
      responseStatus: axErr.response?.status ?? null,
      responseBody: axErr.response?.data ?? null,
      durationMs: Date.now() - started,
      errorMessage: axErr.message,
      ctx: params.ctx,
    });
    throw new FbrApiError(
      `FBR postInvoice failed: ${axErr.message}`,
      axErr.response?.status ?? 502,
      axErr.response?.data,
    );
  }
};

export const validateInvoice = async (params: {
  token: string;
  environment: 'sandbox' | 'production';
  payload: object;
  ctx?: LogContext;
}): Promise<FbrInvoiceResponse> => {
  const url = validateInvoicePath(params.environment);
  const client = buildClient(params.token);
  const started = Date.now();
  try {
    const res = await client.post(url, params.payload);
    await persistOutboundLog({
      method: 'POST',
      url: `${config.fbr.baseUrl}${url}`,
      requestHeaders: client.defaults.headers as Record<string, unknown>,
      requestBody: params.payload,
      responseStatus: res.status,
      responseBody: res.data,
      durationMs: Date.now() - started,
      ctx: params.ctx,
    });
    return res.data as FbrInvoiceResponse;
  } catch (err) {
    const axErr = err as AxiosError;
    await persistOutboundLog({
      method: 'POST',
      url: `${config.fbr.baseUrl}${url}`,
      requestHeaders: client.defaults.headers as Record<string, unknown>,
      requestBody: params.payload,
      responseStatus: axErr.response?.status ?? null,
      responseBody: axErr.response?.data ?? null,
      durationMs: Date.now() - started,
      errorMessage: axErr.message,
      ctx: params.ctx,
    });
    throw new FbrApiError(
      `FBR validateInvoice failed: ${axErr.message}`,
      axErr.response?.status ?? 502,
      axErr.response?.data,
    );
  }
};

/** GET a reference-data endpoint. No token required for /pdi endpoints. */
export const fetchReference = async <T = unknown>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> => {
  const url = path.startsWith('http') ? path : `${config.fbr.baseUrl}${path}`;
  const started = Date.now();
  try {
    const res = await axios.get(url, {
      params,
      timeout: config.fbr.timeoutMs,
      headers: { Accept: 'application/json' },
    });
    await persistOutboundLog({
      method: 'GET',
      url,
      requestBody: params ?? null,
      responseStatus: res.status,
      responseBody: res.data,
      durationMs: Date.now() - started,
    });
    return res.data as T;
  } catch (err) {
    const axErr = err as AxiosError;
    await persistOutboundLog({
      method: 'GET',
      url,
      requestBody: params ?? null,
      responseStatus: axErr.response?.status ?? null,
      responseBody: axErr.response?.data ?? null,
      durationMs: Date.now() - started,
      errorMessage: axErr.message,
    });
    throw new FbrApiError(
      `FBR reference fetch failed: ${axErr.message}`,
      axErr.response?.status ?? 502,
      axErr.response?.data,
    );
  }
};

/** POST to a small utility endpoint (STATL / Get_Reg_Type). Token may be required. */
export const postUtility = async <T = unknown>(
  path: string,
  body: object,
  token?: string,
): Promise<T> => {
  const url = path.startsWith('http') ? path : `${config.fbr.baseUrl}${path}`;
  const started = Date.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await axios.post(url, body, { timeout: config.fbr.timeoutMs, headers });
    await persistOutboundLog({
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: body,
      responseStatus: res.status,
      responseBody: res.data,
      durationMs: Date.now() - started,
    });
    return res.data as T;
  } catch (err) {
    const axErr = err as AxiosError;
    await persistOutboundLog({
      method: 'POST',
      url,
      requestHeaders: headers,
      requestBody: body,
      responseStatus: axErr.response?.status ?? null,
      responseBody: axErr.response?.data ?? null,
      durationMs: Date.now() - started,
      errorMessage: axErr.message,
    });
    throw new FbrApiError(
      `FBR utility call failed: ${axErr.message}`,
      axErr.response?.status ?? 502,
      axErr.response?.data,
    );
  }
};
