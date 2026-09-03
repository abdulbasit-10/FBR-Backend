import Joi from 'joi';
import {
  FBR_SANDBOX_SCENARIOS,
  HS_CODE_PATTERN,
  DEBIT_NOTE_REF_LENGTHS,
} from '../constants/fbr';

const invoiceItemSchema = Joi.object({
  productId: Joi.number().integer().positive().allow(null).optional(),
  hsCode: Joi.string()
    .trim()
    .pattern(HS_CODE_PATTERN, 'HS code in NNNN.NNNN format')
    .required(),
  productDescription: Joi.string().trim().max(1000).required(),
  rate: Joi.string().trim().max(50).required(),
  uom: Joi.string().trim().max(100).required(),
  quantity: Joi.number().positive().precision(4).required(),
  totalValues: Joi.number().min(0).precision(4).default(0),
  valueSalesExcludingST: Joi.number().min(0).precision(4).required(),
  fixedNotifiedValueOrRetailPrice: Joi.number().min(0).precision(4).default(0),
  salesTaxApplicable: Joi.number().min(0).precision(4).required(),
  salesTaxWithheldAtSource: Joi.number().min(0).precision(4).default(0),
  extraTax: Joi.number().min(0).precision(4).default(0),
  furtherTax: Joi.number().min(0).precision(4).default(0),
  sroScheduleNo: Joi.string().trim().max(100).allow(null, '').optional(),
  fedPayable: Joi.number().min(0).precision(4).default(0),
  discount: Joi.number().min(0).precision(4).default(0),
  saleType: Joi.string().trim().max(150).required(),
  sroItemSerialNo: Joi.string().trim().max(50).allow(null, '').optional(),
  unitPrice: Joi.number().min(0).precision(4).default(0),
  discountPercent: Joi.number().min(0).max(100).precision(4).default(0),
});

const scenarioIdField = Joi.string()
  .trim()
  .valid(...FBR_SANDBOX_SCENARIOS);

// Debit-note invoiceRefNo: digits only, 22 chars (NTN) or 28 chars (CNIC).
const invoiceRefNoField = Joi.string()
  .trim()
  .pattern(/^\d+$/, 'digits only')
  .custom((value, helpers) => {
    if (!DEBIT_NOTE_REF_LENGTHS.includes(value.length as 22 | 28)) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid':
      'invoiceRefNo must be 22 digits (NTN case) or 28 digits (CNIC case)',
  });

// In FBR_MOCK_MODE, posted invoices carry a readable "SI-####" number instead of a
// real FBR-issued digit string, so relax the strict digit-length check for Debit Notes.
const debitNoteRefField =
  process.env.FBR_MOCK_MODE === 'true'
    ? Joi.string().trim().max(50).required()
    : invoiceRefNoField.required();

export const createInvoiceSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  invoiceType: Joi.string().valid('Sale Invoice', 'Debit Note').default('Sale Invoice'),
  invoiceDate: Joi.date().iso().required(),
  postingDate: Joi.date().iso().allow(null).optional(),
  poDate: Joi.date().iso().allow(null).optional(),
  poNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  advanceTax: Joi.number().min(0).precision(4).default(0),
  environment: Joi.string().valid('sandbox', 'production').default('sandbox'),
  invoiceRefNo: Joi.when('invoiceType', {
    is: 'Debit Note',
    then: debitNoteRefField,
    otherwise: Joi.string().trim().max(50).allow(null, '').optional(),
  }),
  scenarioId: Joi.when('environment', {
    is: 'sandbox',
    then: scenarioIdField.required(),
    otherwise: Joi.any().strip(),
  }),
  notes: Joi.string().trim().max(2000).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
});

export const updateInvoiceSchema = Joi.object({
  customerId: Joi.number().integer().positive().optional(),
  invoiceType: Joi.string().valid('Sale Invoice', 'Debit Note').optional(),
  invoiceDate: Joi.date().iso().optional(),
  postingDate: Joi.date().iso().allow(null).optional(),
  poDate: Joi.date().iso().allow(null).optional(),
  poNumber: Joi.string().trim().max(50).allow(null, '').optional(),
  advanceTax: Joi.number().min(0).precision(4).optional(),
  invoiceRefNo: invoiceRefNoField.allow(null, '').optional(),
  scenarioId: scenarioIdField.allow(null, '').optional(),
  environment: Joi.string().valid('sandbox', 'production').optional(),
  notes: Joi.string().trim().max(2000).allow(null, '').optional(),
  mappingId: Joi.string().trim().max(100).allow(null, '').optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).optional(),
});

export const submitInvoiceSchema = Joi.object({
  mode: Joi.string().valid('validate', 'post').default('post'),
});

export const invoiceListQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  status: Joi.string().valid('draft', 'validated', 'posted', 'failed', 'cancelled').optional(),
  customerId: Joi.number().integer().positive().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref('from')).optional(),
  search: Joi.string().trim().max(200).allow('').optional(),
  sortBy: Joi.string().max(60).optional(),
  sortDir: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
});
