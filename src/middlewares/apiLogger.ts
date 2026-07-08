import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { ApiLog } from '../models';
import logger from '../utils/logger';

const SENSITIVE_HEADER_KEYS = new Set(['authorization', 'cookie', 'set-cookie']);
const SENSITIVE_BODY_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'token',
  'refreshtoken',
  'accesstoken',
]);

const redact = <T>(input: T): T => {
  if (!input || typeof input !== 'object') return input;
  const output: Record<string, unknown> = Array.isArray(input)
    ? ([...(input as unknown[])] as unknown as Record<string, unknown>)
    : { ...(input as Record<string, unknown>) };
  for (const k of Object.keys(output)) {
    if (SENSITIVE_BODY_KEYS.has(k.toLowerCase())) {
      output[k] = '***';
    } else if (typeof output[k] === 'object' && output[k] !== null) {
      output[k] = redact(output[k]);
    }
  }
  return output as T;
};

const redactHeaders = (h: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(h)) {
    out[k] = SENSITIVE_HEADER_KEYS.has(k.toLowerCase()) ? '***' : v;
  }
  return out;
};

/**
 * Inbound request logger. Writes a row to `api_logs` for every hit under
 * the API prefix. Skips /health and Swagger docs to keep the table lean.
 *
 * Body/headers are redacted (passwords, tokens). Response body is captured
 * by monkey-patching `res.json`.
 */
export const apiLogger = (req: Request, res: Response, next: NextFunction): void => {
  const started = Date.now();
  const shouldSkip =
    !req.originalUrl.startsWith(config.apiPrefix) ||
    req.originalUrl.startsWith(`${config.apiPrefix}/docs`);
  if (shouldSkip) return next();

  let responseBody: unknown = null;
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    responseBody = body;
    return originalJson(body);
  }) as Response['json'];

  res.on('finish', () => {
    // Persist asynchronously — never block the response
    void (async () => {
      try {
        await ApiLog.create({
          direction: 'inbound',
          companyId: req.user?.companyId ?? null,
          userId: req.user?.id ?? null,
          method: req.method,
          endpoint: req.originalUrl,
          requestHeaders: redactHeaders(req.headers as Record<string, unknown>) as object,
          requestBody: (redact(req.body) as object) ?? null,
          responseStatus: res.statusCode,
          responseBody: (redact(responseBody) as object) ?? null,
          durationMs: Date.now() - started,
          ipAddress: req.ip ?? null,
          userAgent: req.get('user-agent') ?? null,
        });
      } catch (err) {
        logger.warn('Failed to persist inbound api log', { err: (err as Error).message });
      }
    })();
  });

  next();
};
