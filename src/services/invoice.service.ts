import { Transaction, Op, WhereOptions, Order } from 'sequelize';
import { randomUUID } from 'crypto';
import { Company, Customer, Invoice, InvoiceItem, InvoiceLog, sequelize } from '../models';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/AppError';
import logger from '../utils/logger';
import * as fbrClient from './fbr-client.service';
import { FbrInvoiceResponse } from './fbr-client.service';
import * as fbrTokens from './fbr-token.service';
import { Queue } from './queue.service';
import type { InvoiceAttributes } from '../models/Invoice';
import type { InvoiceItemCreationAttributes } from '../models/InvoiceItem';
import {
  applicableScenarios,
  isScenarioApplicable,
} from '../constants/fbrScenarios';

// ---------- Types ----------

export interface CreateInvoiceItemInput {
  productId?: number | null;
  hsCode: string;
  productDescription: string;
  rate: string;
  uom: string;
  quantity: number;
  totalValues?: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice?: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource?: number;
  extraTax?: number;
  furtherTax?: number;
  sroScheduleNo?: string | null;
  fedPayable?: number;
  discount?: number;
  saleType: string;
  sroItemSerialNo?: string | null;
  unitPrice?: number;
  discountPercent?: number;
}

export interface CreateInvoiceInput {
  customerId: number;
  invoiceType?: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string; // YYYY-MM-DD
  invoiceRefNo?: string | null;
  scenarioId?: string | null;
  postingDate?: string | null;
  poDate?: string | null;
  poNumber?: string | null;
  advanceTax?: number;
  environment?: 'sandbox' | 'production';
  notes?: string | null;
  items: CreateInvoiceItemInput[];
}

export interface ListInvoicesQuery {
  page?: number;
  limit?: number;
  status?: 'draft' | 'validated' | 'posted' | 'failed' | 'cancelled';
  customerId?: number;
  from?: Date | string;
  to?: Date | string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

// ---------- Helpers ----------

const sum = (values: number[]): number => values.reduce((acc, v) => acc + v, 0);

const toDateOnly = (d: string | Date): string => {
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const computeTotals = (items: CreateInvoiceItemInput[]) => {
  const totalValueExcludingST = sum(items.map((i) => Number(i.valueSalesExcludingST)));
  const totalSalesTax = sum(items.map((i) => Number(i.salesTaxApplicable)));
  const totalFurtherTax = sum(items.map((i) => Number(i.furtherTax ?? 0)));
  const totalExtraTax = sum(items.map((i) => Number(i.extraTax ?? 0)));
  const totalFedPayable = sum(items.map((i) => Number(i.fedPayable ?? 0)));
  const totalDiscount = sum(items.map((i) => Number(i.discount ?? 0)));
  const totalValueIncludingST =
    totalValueExcludingST +
    totalSalesTax +
    totalFurtherTax +
    totalExtraTax +
    totalFedPayable -
    totalDiscount;

  return {
    totalValueExcludingST,
    totalSalesTax,
    totalFurtherTax,
    totalExtraTax,
    totalFedPayable,
    totalDiscount,
    totalValueIncludingST,
  };
};

/** Build the JSON payload FBR expects for /postinvoicedata & /validateinvoicedata */
const buildFbrPayload = (invoice: Invoice, items: InvoiceItem[]): object => ({
  invoiceType: invoice.invoiceType,
  invoiceDate: toDateOnly(invoice.invoiceDate),
  sellerNTNCNIC: invoice.sellerNtnCnic,
  sellerBusinessName: invoice.sellerBusinessName,
  sellerProvince: invoice.sellerProvince,
  sellerAddress: invoice.sellerAddress,
  buyerNTNCNIC: invoice.buyerNtnCnic,
  buyerBusinessName: invoice.buyerBusinessName,
  buyerProvince: invoice.buyerProvince,
  buyerAddress: invoice.buyerAddress,
  buyerRegistrationType: invoice.buyerRegistrationType,
  invoiceRefNo: invoice.invoiceRefNo ?? undefined,
  scenarioId: invoice.scenarioId ?? undefined,
  items: items.map((it) => ({
    hsCode: it.hsCode,
    productDescription: it.productDescription,
    rate: it.rate,
    uoM: it.uom,
    quantity: Number(it.quantity),
    totalValues: Number(it.totalValues),
    valueSalesExcludingST: Number(it.valueSalesExcludingST),
    fixedNotifiedValueOrRetailPrice: Number(it.fixedNotifiedValueOrRetailPrice),
    salesTaxApplicable: Number(it.salesTaxApplicable),
    salesTaxWithheldAtSource: Number(it.salesTaxWithheldAtSource),
    extraTax: Number(it.extraTax),
    furtherTax: Number(it.furtherTax),
    sroScheduleNo: it.sroScheduleNo ?? '',
    fedPayable: Number(it.fedPayable),
    discount: Number(it.discount),
    saleType: it.saleType,
    sroItemSerialNo: it.sroItemSerialNo ?? '',
  })),
});

const logEvent = async (
  invoiceId: number,
  event:
    'created' | 'updated' | 'validated' | 'posted' | 'failed' | 'retried' | 'cancelled' | 'queued',
  opts: {
    userId?: number | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    message?: string;
    payload?: object;
    transaction?: Transaction;
  } = {},
): Promise<void> => {
  await InvoiceLog.create(
    {
      invoiceId,
      userId: opts.userId ?? null,
      event,
      fromStatus: opts.fromStatus ?? null,
      toStatus: opts.toStatus ?? null,
      message: opts.message ?? null,
      payload: opts.payload ?? null,
    },
    { transaction: opts.transaction },
  );
};

// ---------- CRUD ----------

export const createInvoice = async (
  companyId: number,
  userId: number,
  input: CreateInvoiceInput,
): Promise<Invoice> => {
  const company = await Company.findByPk(companyId);
  if (!company) throw new NotFoundError('Company not found');

  const customer = await Customer.findOne({ where: { id: input.customerId, companyId } });
  if (!customer) throw new NotFoundError('Customer not found');

  const items = input.items;
  if (!items?.length) throw new BadRequestError('Invoice must have at least one item');

  const invoiceType = input.invoiceType ?? 'Sale Invoice';
  const environment =
    input.environment ??
    (company.fbrEnvironment === 'production' ? 'production' : 'sandbox');

  // Rule §4.1.2: buyer NTN/CNIC is mandatory when the buyer is Registered.
  if (customer.registrationType === 'Registered' && !customer.ntnCnic) {
    throw new BadRequestError(
      'Buyer is Registered but customer record has no NTN/CNIC. Update the customer before invoicing.',
    );
  }

  // Rule spec error 0034: Debit Note must be within 180 days of the original invoice.
  if (invoiceType === 'Debit Note' && input.invoiceRefNo) {
    const original = await Invoice.findOne({
      where: { companyId, fbrInvoiceNumber: input.invoiceRefNo },
    });
    if (original) {
      const originalDate = new Date(original.invoiceDate);
      const noteDate = new Date(input.invoiceDate);
      if (noteDate < originalDate) {
        throw new BadRequestError(
          'Debit Note date must be greater than or equal to the original invoice date.',
        );
      }
      const days = (noteDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 180) {
        throw new BadRequestError(
          'Debit Note can only be added within 180 days of the original invoice date.',
        );
      }
    }
  }

  // Rule §10: chosen scenarioId must be applicable to the seller's declared
  // business activity × sector when both are set on the company.
  if (
    environment === 'sandbox' &&
    input.scenarioId &&
    company.businessActivity &&
    company.sector &&
    !isScenarioApplicable(company.businessActivity, company.sector, input.scenarioId)
  ) {
    const list = applicableScenarios(company.businessActivity, company.sector);
    throw new BadRequestError(
      `Scenario ${input.scenarioId} is not applicable to ${company.businessActivity} / ${company.sector}. ` +
      `Allowed: ${list?.join(', ') ?? '—'}.`,
    );
  }

  const totals = computeTotals(items);

  return sequelize.transaction(async (transaction) => {
    const invoice = await Invoice.create(
      {
        uuid: randomUUID(),
        companyId,
        customerId: customer.id,
        createdBy: userId,
        invoiceType,
        invoiceDate: toDateOnly(input.invoiceDate),
        postingDate: input.postingDate ? toDateOnly(input.postingDate) : null,
        poDate: input.poDate ? toDateOnly(input.poDate) : null,
        poNumber: input.poNumber ?? null,
        advanceTax: Number(input.advanceTax ?? 0),
        invoiceRefNo: input.invoiceRefNo ?? null,
        scenarioId: input.scenarioId ?? null,
        status: 'draft',
        environment,
        // Seller snapshot from company
        sellerNtnCnic: company.ntn,
        sellerBusinessName: company.businessName,
        sellerProvince: company.province,
        sellerAddress: company.address,
        // Buyer snapshot from customer
        buyerNtnCnic: customer.ntnCnic,
        buyerBusinessName: customer.businessName,
        buyerProvince: customer.province,
        buyerAddress: customer.address,
        buyerRegistrationType: customer.registrationType,
        ...totals,
        notes: input.notes ?? null,
      },
      { transaction },
    );

    let sr = 0;
    for (const it of items) {
      sr++;
      await InvoiceItem.create(
        {
          invoiceId: invoice.id,
          productId: it.productId ?? null,
          itemSrNo: sr,
          hsCode: it.hsCode,
          productDescription: it.productDescription,
          rate: it.rate,
          uom: it.uom,
          quantity: Number(it.quantity),
          totalValues: Number(it.totalValues ?? 0),
          valueSalesExcludingST: Number(it.valueSalesExcludingST),
          fixedNotifiedValueOrRetailPrice: Number(it.fixedNotifiedValueOrRetailPrice ?? 0),
          salesTaxApplicable: Number(it.salesTaxApplicable),
          salesTaxWithheldAtSource: Number(it.salesTaxWithheldAtSource ?? 0),
          extraTax: Number(it.extraTax ?? 0),
          furtherTax: Number(it.furtherTax ?? 0),
          sroScheduleNo: it.sroScheduleNo ?? null,
          fedPayable: Number(it.fedPayable ?? 0),
          discount: Number(it.discount ?? 0),
          saleType: it.saleType,
          sroItemSerialNo: it.sroItemSerialNo ?? null,
          unitPrice: Number(it.unitPrice ?? 0),
          discountPercent: Number(it.discountPercent ?? 0),
        } as InvoiceItemCreationAttributes,
        { transaction },
      );
    }

    await logEvent(invoice.id, 'created', {
      userId,
      toStatus: 'draft',
      transaction,
    });

    return invoice;
  });
};

export const listInvoices = async (companyId: number, q: ListInvoicesQuery) => {
  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(200, Math.max(1, q.limit ?? 20));
  const offset = (page - 1) * limit;

  const where: WhereOptions = { companyId };
  if (q.status) (where as Record<string, unknown>).status = q.status;
  if (q.customerId) (where as Record<string, unknown>).customerId = q.customerId;
  if (q.from || q.to) {
    const range: Record<symbol, unknown> = {};
    if (q.from) range[Op.gte] = toDateOnly(q.from);
    if (q.to) range[Op.lte] = toDateOnly(q.to);
    (where as Record<string, unknown>).invoiceDate = range;
  }
  if (q.search) {
    (where as Record<string, unknown>)[Op.or as unknown as string] = [
      { fbrInvoiceNumber: { [Op.like]: `%${q.search}%` } },
      { buyerBusinessName: { [Op.like]: `%${q.search}%` } },
      { invoiceRefNo: { [Op.like]: `%${q.search}%` } },
    ];
  }

  const order: Order = [
    [q.sortBy ?? 'invoice_date', (q.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
  ];

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'businessName', 'ntnCnic'] }],
  });

  return {
    rows,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit)),
    },
  };
};

export const getInvoice = async (id: number, companyId: number): Promise<Invoice> => {
  const invoice = await Invoice.findOne({
    where: { id, companyId },
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Customer, as: 'customer' },
      { model: InvoiceLog, as: 'logs', separate: true, order: [['created_at', 'ASC']] },
    ],
  });
  if (!invoice) throw new NotFoundError('Invoice not found');
  return invoice;
};

export const getInvoiceByUuid = async (uuid: string, companyId: number): Promise<Invoice> => {
  const invoice = await Invoice.findOne({
    where: { uuid, companyId },
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Customer, as: 'customer' },
      { model: InvoiceLog, as: 'logs', separate: true, order: [['created_at', 'ASC']] },
    ],
  });
  if (!invoice) throw new NotFoundError('Invoice not found');
  return invoice;
};

export const updateInvoice = async (
  id: number,
  companyId: number,
  userId: number,
  input: Partial<CreateInvoiceInput>,
): Promise<Invoice> => {
  const invoice = await getInvoice(id, companyId);
  if (invoice.status !== 'draft' && invoice.status !== 'failed') {
    throw new ForbiddenError(
      `Only draft / failed invoices can be updated (current: ${invoice.status})`,
    );
  }

  return sequelize.transaction(async (transaction) => {
    if (input.customerId && input.customerId !== invoice.customerId) {
      const customer = await Customer.findOne({
        where: { id: input.customerId, companyId },
      });
      if (!customer) throw new NotFoundError('Customer not found');
      invoice.customerId = customer.id;
      invoice.buyerNtnCnic = customer.ntnCnic;
      invoice.buyerBusinessName = customer.businessName;
      invoice.buyerProvince = customer.province;
      invoice.buyerAddress = customer.address;
      invoice.buyerRegistrationType = customer.registrationType;
    }
    if (input.invoiceType) invoice.invoiceType = input.invoiceType;
    if (input.invoiceDate) invoice.invoiceDate = toDateOnly(input.invoiceDate);
    if (input.postingDate !== undefined) invoice.postingDate = input.postingDate ? toDateOnly(input.postingDate) : null;
    if (input.poDate !== undefined) invoice.poDate = input.poDate ? toDateOnly(input.poDate) : null;
    if (input.poNumber !== undefined) invoice.poNumber = input.poNumber ?? null;
    if (input.advanceTax !== undefined) invoice.advanceTax = Number(input.advanceTax);
    if (input.invoiceRefNo !== undefined) invoice.invoiceRefNo = input.invoiceRefNo;
    if (input.scenarioId !== undefined) invoice.scenarioId = input.scenarioId;
    if (input.environment) invoice.environment = input.environment;
    if (input.notes !== undefined) invoice.notes = input.notes;

    if (input.items?.length) {
      await InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction });
      let sr = 0;
      for (const it of input.items) {
        sr++;
        await InvoiceItem.create(
          {
            invoiceId: invoice.id,
            productId: it.productId ?? null,
            itemSrNo: sr,
            hsCode: it.hsCode,
            productDescription: it.productDescription,
            rate: it.rate,
            uom: it.uom,
            quantity: Number(it.quantity),
            totalValues: Number(it.totalValues ?? 0),
            valueSalesExcludingST: Number(it.valueSalesExcludingST),
            fixedNotifiedValueOrRetailPrice: Number(it.fixedNotifiedValueOrRetailPrice ?? 0),
            salesTaxApplicable: Number(it.salesTaxApplicable),
            salesTaxWithheldAtSource: Number(it.salesTaxWithheldAtSource ?? 0),
            extraTax: Number(it.extraTax ?? 0),
            furtherTax: Number(it.furtherTax ?? 0),
            sroScheduleNo: it.sroScheduleNo ?? null,
            fedPayable: Number(it.fedPayable ?? 0),
            discount: Number(it.discount ?? 0),
            saleType: it.saleType,
            sroItemSerialNo: it.sroItemSerialNo ?? null,
            unitPrice: Number(it.unitPrice ?? 0),
            discountPercent: Number(it.discountPercent ?? 0),
          } as InvoiceItemCreationAttributes,
          { transaction },
        );
      }
      const totals = computeTotals(input.items);
      Object.assign(invoice, totals);
    }

    // If it was failed, reset to draft
    const fromStatus = invoice.status;
    if (invoice.status === 'failed') {
      invoice.status = 'draft';
      invoice.fbrErrorCode = null;
      invoice.fbrError = null;
    }

    await invoice.save({ transaction });
    await logEvent(invoice.id, 'updated', {
      userId,
      fromStatus,
      toStatus: invoice.status,
      transaction,
    });
    return invoice;
  });
};

export const deleteInvoice = async (
  id: number,
  companyId: number,
  userId: number,
): Promise<void> => {
  const invoice = await getInvoice(id, companyId);
  if (invoice.status === 'posted') {
    throw new ForbiddenError('Posted invoices cannot be deleted, use cancel instead');
  }
  await logEvent(invoice.id, 'cancelled', {
    userId,
    fromStatus: invoice.status,
    toStatus: 'cancelled',
    message: 'Invoice deleted',
  });
  await invoice.destroy();
};

// ---------- FBR submission ----------

const applyResponseToInvoice = async (
  invoice: Invoice,
  items: InvoiceItem[],
  response: FbrInvoiceResponse,
  mode: 'validate' | 'post',
): Promise<void> => {
  const vr = response.validationResponse;
  invoice.fbrRawResponse = response as unknown as object;
  invoice.fbrStatusCode = vr?.statusCode ?? null;
  invoice.fbrStatus = vr?.status ?? null;
  invoice.fbrErrorCode = vr?.errorCode ?? null;
  invoice.fbrError = vr?.error ?? null;

  if (vr?.statusCode === '00') {
    if (mode === 'post') {
      invoice.status = 'posted';
      invoice.fbrInvoiceNumber = response.invoiceNumber ?? null;
      invoice.fbrDated = response.dated ? new Date(response.dated) : null;
      invoice.postedAt = new Date();
    } else {
      invoice.status = 'validated';
    }

    // per-item statuses
    if (vr.invoiceStatuses?.length) {
      for (const s of vr.invoiceStatuses) {
        const idx = parseInt(s.itemSNo, 10);
        const item = items.find((i) => i.itemSrNo === idx);
        if (item) {
          item.fbrInvoiceNo = s.invoiceNo ?? null;
          item.fbrStatusCode = s.statusCode ?? null;
          item.fbrStatus = s.status ?? null;
          item.fbrErrorCode = s.errorCode ?? null;
          item.fbrError = s.error ?? null;
          await item.save();
        }
      }
    }
  } else {
    invoice.status = 'failed';
  }

  await invoice.save();
};

export const submitInvoice = async (
  id: number,
  companyId: number,
  userId: number,
  mode: 'validate' | 'post',
): Promise<Invoice> => {
  const invoice = await getInvoice(id, companyId);
  if (invoice.status === 'posted') {
    throw new BadRequestError('Invoice already posted');
  }
  if (invoice.status === 'cancelled') {
    throw new BadRequestError('Cancelled invoice cannot be submitted');
  }

  const items = await InvoiceItem.findAll({
    where: { invoiceId: invoice.id },
    order: [['item_sr_no', 'ASC']],
  });

  // Skip real FBR call when FBR_MOCK_MODE=true (testing without credentials)
  if (process.env.FBR_MOCK_MODE === 'true') {
    // Use the same SI-#### numbering as everywhere else — no "MOCK-" noise in the invoice list
    const mockNo = `SI-${String(invoice.id).padStart(4, '0')}`;
    invoice.status = mode === 'post' ? 'posted' : 'validated';
    invoice.fbrInvoiceNumber = mode === 'post' ? mockNo : null;
    invoice.fbrStatus = 'Success';
    invoice.fbrError = null;
    invoice.fbrErrorCode = null;
    await invoice.save();
    await logEvent(invoice.id, mode === 'post' ? 'posted' : 'validated', {
      userId, fromStatus: 'draft', toStatus: invoice.status,
      message: `Mock FBR response (FBR_MOCK_MODE=true): ${mockNo}`,
    });
    return invoice;
  }

  const token = await fbrTokens.getActiveTokenForCompany(companyId, invoice.environment);
  const payload = buildFbrPayload(invoice, items);
  const fromStatus = invoice.status;

  try {
    const response =
      mode === 'post'
        ? await fbrClient.postInvoice({
          token,
          environment: invoice.environment,
          payload,
          ctx: { companyId, userId, invoiceId: invoice.id },
        })
        : await fbrClient.validateInvoice({
          token,
          environment: invoice.environment,
          payload,
          ctx: { companyId, userId, invoiceId: invoice.id },
        });

    await applyResponseToInvoice(invoice, items, response, mode);
    await logEvent(invoice.id, mode === 'post' ? 'posted' : 'validated', {
      userId,
      fromStatus,
      toStatus: invoice.status,
      payload: response as unknown as object,
    });
    return invoice;
  } catch (err) {
    const message = (err as Error).message;
    invoice.status = 'failed';
    invoice.fbrError = message;
    await invoice.save();
    await logEvent(invoice.id, 'failed', {
      userId,
      fromStatus,
      toStatus: 'failed',
      message,
    });
    throw err;
  }
};

// ---------- Queue integration (Module 14) ----------

interface QueuedSubmitJob {
  invoiceId: number;
  companyId: number;
  userId: number;
  mode: 'validate' | 'post';
}

export const invoiceQueue = new Queue<QueuedSubmitJob>(async (data) => {
  await submitInvoice(data.invoiceId, data.companyId, data.userId, data.mode);
}, 2);

/** Enqueue an invoice submission — returns immediately with a queued status. */
export const enqueueInvoiceSubmit = async (
  id: number,
  companyId: number,
  userId: number,
  mode: 'validate' | 'post',
): Promise<{ invoiceId: number; jobId: number }> => {
  const invoice = await getInvoice(id, companyId);
  if (invoice.status === 'posted') {
    throw new BadRequestError('Invoice already posted');
  }
  const jobId = invoiceQueue.add(
    `invoice:${mode}`,
    { invoiceId: id, companyId, userId, mode },
    { maxAttempts: 3, backoffMs: 3000 },
  );
  await logEvent(id, 'queued', {
    userId,
    fromStatus: invoice.status,
    message: `Queued for ${mode} (jobId=${jobId})`,
  });
  logger.info(`Queued invoice ${id} for ${mode} — job ${jobId}`);
  return { invoiceId: id, jobId };
};

// ---------- Aggregations for dashboard / reports (used by other services) ----------

export const _internalCountsByStatus = async (
  companyId: number,
  where: Partial<InvoiceAttributes> = {},
): Promise<Record<string, number>> => {
  const rows = await Invoice.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: { companyId, ...where },
    group: ['status'],
    raw: true,
  });
  const out: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of rows as any[]) out[r.status] = Number(r.count);
  return out;
};
