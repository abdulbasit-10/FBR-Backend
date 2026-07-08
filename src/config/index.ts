import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  dialect: 'mysql';
  logging: boolean;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  bcryptSaltRounds: number;
}

interface FbrConfig {
  baseUrl: string;
  endpoints: {
    postInvoiceSandbox: string;
    postInvoiceProduction: string;
    validateInvoiceSandbox: string;
    validateInvoiceProduction: string;
    provinces: string;
    docType: string;
    itemDesc: string;
    sroItem: string;
    transType: string;
    uom: string;
    sroSchedule: string;
    saleTypeToRate: string;
    hsUom: string;
    sroItemV2: string;
    statl: string;
    getRegType: string;
  };
  timeoutMs: number;
}

interface AppConfig {
  env: string;
  port: number;
  apiPrefix: string;
  appName: string;
  encryptionKey: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  fbr: FbrConfig;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  log: {
    level: string;
    dir: string;
  };
}

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const config: AppConfig = {
  env: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  appName: process.env.APP_NAME ?? 'FBR Digital Invoicing Backend',
  encryptionKey: required('ENCRYPTION_KEY'),

  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: toInt(process.env.DB_PORT, 3306),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    dialect: 'mysql',
    logging: toBool(process.env.DB_LOGGING, false),
    pool: {
      max: toInt(process.env.DB_POOL_MAX, 10),
      min: toInt(process.env.DB_POOL_MIN, 0),
      acquire: toInt(process.env.DB_POOL_ACQUIRE, 30000),
      idle: toInt(process.env.DB_POOL_IDLE, 10000),
    },
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),
  },

  fbr: {
    baseUrl: process.env.FBR_BASE_URL ?? 'https://gw.fbr.gov.pk',
    endpoints: {
      postInvoiceSandbox:
        process.env.FBR_POST_INVOICE_SANDBOX ?? '/di_data/v1/di/postinvoicedata_sb',
      postInvoiceProduction:
        process.env.FBR_POST_INVOICE_PRODUCTION ?? '/di_data/v1/di/postinvoicedata',
      validateInvoiceSandbox:
        process.env.FBR_VALIDATE_INVOICE_SANDBOX ?? '/di_data/v1/di/validateinvoicedata_sb',
      validateInvoiceProduction:
        process.env.FBR_VALIDATE_INVOICE_PRODUCTION ?? '/di_data/v1/di/validateinvoicedata',
      provinces: process.env.FBR_REF_PROVINCES ?? '/pdi/v1/provinces',
      docType: process.env.FBR_REF_DOCTYPE ?? '/pdi/v1/doctypecode',
      itemDesc: process.env.FBR_REF_ITEMDESC ?? '/pdi/v1/itemdesccode',
      sroItem: process.env.FBR_REF_SROITEM ?? '/pdi/v1/sroitemcode',
      transType: process.env.FBR_REF_TRANSTYPE ?? '/pdi/v1/transtypecode',
      uom: process.env.FBR_REF_UOM ?? '/pdi/v1/uom',
      sroSchedule: process.env.FBR_REF_SROSCHED ?? '/pdi/v1/SroSchedule',
      saleTypeToRate: process.env.FBR_REF_SALETYPE_TO_RATE ?? '/pdi/v2/SaleTypeToRate',
      hsUom: process.env.FBR_REF_HS_UOM ?? '/pdi/v2/HS_UOM',
      sroItemV2: process.env.FBR_REF_SROITEM_V2 ?? '/pdi/v2/SROItem',
      statl: process.env.FBR_STATL ?? '/dist/v1/statl',
      getRegType: process.env.FBR_GET_REG_TYPE ?? '/dist/v1/Get_Reg_Type',
    },
    timeoutMs: toInt(process.env.FBR_REQUEST_TIMEOUT_MS, 30000),
  },

  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: toBool(process.env.CORS_CREDENTIALS, true),
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 100),
  },

  log: {
    level: process.env.LOG_LEVEL ?? 'info',
    dir: process.env.LOG_DIR ?? 'logs',
  },
};

// Validate encryption key length (must be 32 bytes for AES-256)
if (Buffer.byteLength(config.encryptionKey, 'utf8') !== 32) {
  throw new Error(
    `ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Current length: ${Buffer.byteLength(
      config.encryptionKey,
      'utf8',
    )}`,
  );
}

export default config;
