import { Transaction, Op, WhereOptions, Order } from 'sequelize';
import { randomUUID } from 'crypto';
import {
  InventoryAdjustment,
  InventoryAdjustmentItem,
  sequelize,
} from '../models';
import { BadRequestError, NotFoundError } from '../utils/AppError';

export interface CreateAdjustmentItemInput {
  productId?: number | null;
  productDescription: string;
  uom: string;
  quantity: number;
  unitCost?: number;
  reason?: string | null;
}

export interface CreateAdjustmentInput {
  docDate: string;
  postingDate?: string | null;
  reason?: string | null;
  source?: 'Manual' | 'API' | 'Import';
  notes?: string | null;
  items: CreateAdjustmentItemInput[];
}

export interface ListAdjustmentsQuery {
  page?: number;
  limit?: number;
  status?: 'draft' | 'posted' | 'cancelled';
  source?: 'Manual' | 'API' | 'Import';
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

const nextAdjustmentNo = async (companyId: number): Promise<string> => {
  const last = await InventoryAdjustment.findOne({
    where: { companyId },
    order: [['id', 'DESC']],
    attributes: ['adjustmentNo'],
    paranoid: false,
  });
  const num = last?.adjustmentNo
    ? parseInt(last.adjustmentNo.replace('IA-', ''), 10) || 0
    : 0;
  return `IA-${String(num + 1).padStart(4, '0')}`;
};

export const listAdjustments = async (companyId: number, q: ListAdjustmentsQuery) => {
  const page = Math.max(1, q.page ?? 1);
  const limit = Math.min(200, Math.max(1, q.limit ?? 20));
  const offset = (page - 1) * limit;

  const where: WhereOptions = { companyId };
  const w = where as Record<string, unknown>;
  if (q.status) w.status = q.status;
  if (q.source) w.source = q.source;
  if (q.from || q.to) {
    const range: Record<symbol, unknown> = {};
    if (q.from) range[Op.gte] = q.from;
    if (q.to) range[Op.lte] = q.to;
    w.docDate = range;
  }
  if (q.search) {
    (w[Op.or as unknown as string] as unknown) = [
      { adjustmentNo: { [Op.like]: `%${q.search}%` } },
      { reason: { [Op.like]: `%${q.search}%` } },
    ];
  }

  const order: Order = [
    [q.sortBy ?? 'doc_date', (q.sortDir ?? 'DESC').toUpperCase() as 'ASC' | 'DESC'],
  ];

  const { rows, count } = await InventoryAdjustment.findAndCountAll({
    where,
    order,
    limit,
    offset,
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

export const getAdjustmentByUuid = async (
  uuid: string,
  companyId: number,
): Promise<InventoryAdjustment> => {
  const a = await InventoryAdjustment.findOne({
    where: { uuid, companyId },
    include: [{ model: InventoryAdjustmentItem, as: 'items' }],
  });
  if (!a) throw new NotFoundError('Adjustment not found');
  return a;
};

export const createAdjustment = async (
  companyId: number,
  userId: number,
  input: CreateAdjustmentInput,
): Promise<InventoryAdjustment> => {
  if (!input.items?.length) throw new BadRequestError('Adjustment must have at least one line');
  const adjustmentNo = await nextAdjustmentNo(companyId);
  const lineTotal = input.items.reduce(
    (sum, it) => sum + Number(it.quantity) * Number(it.unitCost ?? 0),
    0,
  );

  return sequelize.transaction(async (transaction: Transaction) => {
    const adj = await InventoryAdjustment.create(
      {
        uuid: randomUUID(),
        companyId,
        createdBy: userId,
        adjustmentNo,
        docDate: input.docDate,
        postingDate: input.postingDate ?? null,
        reason: input.reason ?? null,
        source: input.source ?? 'Manual',
        status: 'draft',
        lines: input.items.length,
        lineTotal,
        notes: input.notes ?? null,
      },
      { transaction },
    );

    let sr = 0;
    for (const it of input.items) {
      sr++;
      const lineValue = Number(it.quantity) * Number(it.unitCost ?? 0);
      await InventoryAdjustmentItem.create(
        {
          adjustmentId: adj.id,
          productId: it.productId ?? null,
          itemSrNo: sr,
          productDescription: it.productDescription,
          uom: it.uom,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost ?? 0),
          lineValue,
          reason: it.reason ?? null,
        },
        { transaction },
      );
    }

    return adj;
  });
};

export const postAdjustment = async (
  uuid: string,
  companyId: number,
): Promise<InventoryAdjustment> => {
  const a = await getAdjustmentByUuid(uuid, companyId);
  if (a.status === 'posted') throw new BadRequestError('Already posted');
  a.status = 'posted';
  a.postedAt = new Date();
  await a.save();
  return a;
};

export const cancelAdjustment = async (
  uuid: string,
  companyId: number,
): Promise<InventoryAdjustment> => {
  const a = await getAdjustmentByUuid(uuid, companyId);
  a.status = 'cancelled';
  await a.save();
  return a;
};

export const deleteAdjustment = async (uuid: string, companyId: number): Promise<void> => {
  const a = await getAdjustmentByUuid(uuid, companyId);
  await a.destroy();
};
