import { Transaction, Op, WhereOptions, Order } from 'sequelize';
import { randomUUID } from 'crypto';
import { Purchase, PurchaseItem, Vendor, sequelize } from '../models';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import type { PurchaseCreationAttributes, PurchaseType } from '../models/Purchase';
import type { PurchaseItemCreationAttributes } from '../models/PurchaseItem';

// ---------- Types ----------

export interface CreatePurchaseItemInput {
  productId?: number | null;
  hsCode?: string | null;
  productDescription: string;
  uom: string;
  quantity: number;
  unitPrice?: number;
  assessedPerUnit?: number;
  retailPrice?: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface CreatePurchaseInput {
  vendorId: number;
  purchaseType?: PurchaseType;
  originalPurchaseUuid?: string | null;
  vendorInvoiceNo?: string | null;
  docDate: string;
  postingDate?: string | null;
  poDate?: string | null;
  poNumber?: string | null;
  advanceTax?: number;
  source?: 'Manual' | 'API' | 'Import';
  notes?: string | null;
  items: CreatePurchaseItemInput[];
}

export interface ListPurchasesQuery {
  page?: number;
  limit?: number;
  status?: 'draft' | 'posted' | 'cancelled';
  vendorId?: number;
  purchaseType?: PurchaseType;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

// ---------- Helpers ----------

const sum = (v: number[]): number => v.reduce((a, b) => a + b, 0);

const computeLineTotals = (input: CreatePurchaseItemInput) => {
  const qty = Number(input.quantity);
  const assessed = Number(input.assessedPerUnit ?? input.unitPrice ?? 0);
  const assessedValue = qty * assessed;
  const discountPct = Number(input.discountPercent ?? 0);
  const discount = (assessedValue * discountPct) / 100;
  const valueExcludingST = assessedValue - discount;
  const taxPct = Number(input.taxPercent ?? 0);
  const salesTax = (valueExcludingST * taxPct) / 100;
  const valueIncludingST = valueExcludingST + salesTax;
  return { assessedValue, discount, valueExcludingST, salesTax, valueIncludingST };
};

const computeHeaderTotals = (items: CreatePurchaseItemInput[]) => {
  const lines = items.map((i) => ({ ...i, ...computeLineTotals(i) }));
  return {
    assessedValue: sum(lines.map((l) => l.assessedValue)),
    totalDiscount: sum(lines.map((l) => l.discount)),
    totalValueExcludingST: sum(lines.map((l) => l.valueExcludingST)),
    totalSalesTax: sum(lines.map((l) => l.salesTax)),
    totalValueIncludingST: sum(lines.map((l) => l.valueIncludingST)),
    lines,
  };
};

const nextPurchaseNo = async (companyId: number, type: PurchaseType): Promise<string> => {
  const prefix = type === 'Purchase Return' ? 'PR-' : 'PI-';
  const last = await Purchase.findOne({
    where: { companyId, purchaseType: type },
    order: [['id', 'DESC']],
    attributes: ['purchaseNo'],
    paranoid: false,
  });
  const num = last?.purchaseNo ? parseInt(last.purchaseNo.replace(prefix, ''), 10) || 0 : 0;
  return `${prefix}${String(num + 1).padStart(4, '0')}`;
};

// ---------- Public API ----------

export const listPurchases = async (companyId: number, q: ListPurchasesQuery) => {
  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(200, Math.max(1, q.limit ?? 20));
  const offset = (page - 1) * limit;

  const where: WhereOptions = { companyId };
  const w = where as Record<string, unknown>;
  if (q.status) w.status = q.status;
  if (q.vendorId) w.vendorId = q.vendorId;
  if (q.purchaseType) w.purchaseType = q.purchaseType;
  if (q.from || q.to) {
    const range: Record<symbol, unknown> = {};
    if (q.from) range[Op.gte] = q.from;
    if (q.to) range[Op.lte] = q.to;
    w.docDate = range;
  }
  if (q.search) {
    (w[Op.or as unknown as string] as unknown) = [
      { purchaseNo: { [Op.like]: `%${q.search}%` } },
      { vendorInvoiceNo: { [Op.like]: `%${q.search}%` } },
      { vendorBusinessName: { [Op.like]: `%${q.search}%` } },
    ];
  }

  const order: Order = [
    [q.sortBy ?? 'doc_date', (q.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
  ];

  const { rows, count } = await Purchase.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      { model: Vendor, as: 'vendor', attributes: ['id', 'vendorNo', 'businessName', 'ntnCnic'] },
    ],
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

export const getPurchaseByUuid = async (uuid: string, companyId: number): Promise<Purchase> => {
  const p = await Purchase.findOne({
    where: { uuid, companyId },
    include: [
      { model: Vendor, as: 'vendor' },
      { model: PurchaseItem, as: 'items' },
    ],
  });
  if (!p) throw new NotFoundError('Purchase not found');
  return p;
};

export const createPurchase = async (
  companyId: number,
  userId: number,
  input: CreatePurchaseInput,
): Promise<Purchase> => {
  const vendor = await Vendor.findOne({ where: { id: input.vendorId, companyId } });
  if (!vendor) throw new NotFoundError('Vendor not found');
  if (!input.items?.length) throw new BadRequestError('Purchase must have at least one item');

  let originalPurchaseId: number | null = null;
  if (input.originalPurchaseUuid) {
    const original = await Purchase.findOne({
      where: { uuid: input.originalPurchaseUuid, companyId },
    });
    if (!original) throw new NotFoundError('Original purchase not found');
    originalPurchaseId = original.id;
  }

  const totals = computeHeaderTotals(input.items);
  const purchaseType: PurchaseType = input.purchaseType ?? 'Purchase Invoice';
  const purchaseNo = await nextPurchaseNo(companyId, purchaseType);

  return sequelize.transaction(async (transaction: Transaction) => {
    const purchase = await Purchase.create(
      {
        uuid: randomUUID(),
        companyId,
        vendorId: vendor.id,
        createdBy: userId,
        purchaseNo,
        purchaseType,
        originalPurchaseId,
        vendorInvoiceNo: input.vendorInvoiceNo ?? null,
        docDate: input.docDate,
        postingDate: input.postingDate ?? null,
        poDate: input.poDate ?? null,
        poNumber: input.poNumber ?? null,
        advanceTax: Number(input.advanceTax ?? 0),
        source: input.source ?? 'Manual',
        vendorNtnCnic: vendor.ntnCnic,
        vendorBusinessName: vendor.businessName,
        vendorProvince: vendor.province,
        vendorAddress: vendor.address,
        vendorRegistrationType: vendor.registrationType,
        assessedValue: totals.assessedValue,
        totalDiscount: totals.totalDiscount,
        totalValueExcludingST: totals.totalValueExcludingST,
        totalSalesTax: totals.totalSalesTax,
        totalValueIncludingST: totals.totalValueIncludingST + Number(input.advanceTax ?? 0),
        notes: input.notes ?? null,
      } as PurchaseCreationAttributes,
      { transaction },
    );

    let sr = 0;
    for (const line of totals.lines) {
      sr++;
      await PurchaseItem.create(
        {
          purchaseId: purchase.id,
          productId: line.productId ?? null,
          itemSrNo: sr,
          hsCode: line.hsCode ?? null,
          productDescription: line.productDescription,
          uom: line.uom,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice ?? 0),
          assessedPerUnit: Number(line.assessedPerUnit ?? line.unitPrice ?? 0),
          retailPrice: Number(line.retailPrice ?? 0),
          discountPercent: Number(line.discountPercent ?? 0),
          discount: line.discount,
          taxPercent: Number(line.taxPercent ?? 0),
          salesTaxApplicable: line.salesTax,
          valueExcludingST: line.valueExcludingST,
          valueIncludingST: line.valueIncludingST,
        } as PurchaseItemCreationAttributes,
        { transaction },
      );
    }
    return purchase;
  });
};

export const updatePurchase = async (
  uuid: string,
  companyId: number,
  data: Partial<CreatePurchaseInput>,
): Promise<Purchase> => {
  const p = await getPurchaseByUuid(uuid, companyId);
  if (p.status === 'posted') throw new BadRequestError('Cannot edit a posted purchase');
  const patch: Record<string, unknown> = {};
  if (data.vendorInvoiceNo !== undefined) patch.vendorInvoiceNo = data.vendorInvoiceNo;
  if (data.docDate !== undefined) patch.docDate = data.docDate;
  if (data.postingDate !== undefined) patch.postingDate = data.postingDate;
  if (data.poDate !== undefined) patch.poDate = data.poDate;
  if (data.poNumber !== undefined) patch.poNumber = data.poNumber;
  if (data.notes !== undefined) patch.notes = data.notes;
  await p.update(patch);
  return p;
};

export const postPurchase = async (uuid: string, companyId: number): Promise<Purchase> => {
  const p = await getPurchaseByUuid(uuid, companyId);
  if (p.status === 'posted') throw new BadRequestError('Already posted');
  p.status = 'posted';
  p.postedAt = new Date();
  await p.save();
  return p;
};

export const cancelPurchase = async (uuid: string, companyId: number): Promise<Purchase> => {
  const p = await getPurchaseByUuid(uuid, companyId);
  p.status = 'cancelled';
  await p.save();
  return p;
};

export const deletePurchase = async (uuid: string, companyId: number): Promise<void> => {
  const p = await getPurchaseByUuid(uuid, companyId);
  await p.destroy();
};
