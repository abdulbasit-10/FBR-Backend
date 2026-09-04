import { Op } from 'sequelize';
import { Invoice, Purchase, InventoryAdjustment, sequelize } from '../models';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

/**
 * GET /dashboard — cards + charts + tables that the FE dashboard needs.
 */
export const getDashboard = async (companyId: number) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyWindow = new Date(now.getFullYear(), now.getMonth() - 11, 1); // last 12 months

  // ---- Cards ----
  const [statusRows, todaySalesRow, monthSalesRow, taxRow] = await Promise.all([
    Invoice.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('total_value_including_st')),
            0,
          ),
          'sum',
        ],
      ],
      where: { companyId },
      group: ['status'],
      raw: true,
    }),
    Invoice.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('total_value_including_st')),
            0,
          ),
          'sum',
        ],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        companyId,
        createdAt: { [Op.gte]: todayStart, [Op.lt]: todayEnd },
      },
      raw: true,
    }),
    Invoice.findOne({
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('total_value_including_st')),
            0,
          ),
          'sum',
        ],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId, invoiceDate: { [Op.gte]: monthStart } },
      raw: true,
    }),
    Invoice.findOne({
      attributes: [
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_sales_tax')), 0),
          'sales',
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_further_tax')), 0),
          'further',
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_extra_tax')), 0),
          'extra',
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_fed_payable')), 0),
          'fed',
        ],
      ],
      where: { companyId, status: 'posted' },
      raw: true,
    }),
  ]);

  const byStatus: Record<string, { count: number; sum: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of statusRows as any[]) {
    byStatus[r.status] = { count: Number(r.count), sum: Number(r.sum) };
  }

  const totalSales = Object.values(byStatus).reduce((a, s) => a + s.sum, 0);

  // ---- Doc counts (Sales/Purchase Invoices & Returns, Inventory Adjustments) ----
  const toCounts = (rows: { type: string; status: string; count: string }[], type: string) => {
    const filtered = rows.filter((r) => r.type === type);
    const total = filtered.reduce((a, r) => a + Number(r.count), 0);
    const posted = filtered.find((r) => r.status === 'posted');
    return {
      total,
      posted: Number(posted?.count ?? 0),
      unposted: total - Number(posted?.count ?? 0) - filtered.filter((r) => r.status === 'cancelled').reduce((a, r) => a + Number(r.count), 0),
    };
  };

  const [invoiceTypeRows, purchaseTypeRows, adjustmentRows] = await Promise.all([
    Invoice.findAll({
      attributes: [
        ['invoice_type', 'type'],
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId },
      group: ['invoice_type', 'status'],
      raw: true,
    }),
    Purchase.findAll({
      attributes: [
        ['purchase_type', 'type'],
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId },
      group: ['purchase_type', 'status'],
      raw: true,
    }),
    InventoryAdjustment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId },
      group: ['status'],
      raw: true,
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceTypeCounts = invoiceTypeRows as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const purchaseTypeCounts = purchaseTypeRows as any[];

  const adjustmentCounts = adjustmentRows as unknown as { status: string; count: string }[];
  const adjustmentTotal = adjustmentCounts.reduce((a, r) => a + Number(r.count), 0);
  const adjustmentPosted = Number(
    adjustmentCounts.find((r) => r.status === 'posted')?.count ?? 0,
  );
  const adjustmentCancelled = adjustmentCounts
    .filter((r) => r.status === 'cancelled')
    .reduce((a, r) => a + Number(r.count), 0);

  const docCounts = {
    salesInvoices: toCounts(invoiceTypeCounts, 'Sale Invoice'),
    salesReturns: toCounts(invoiceTypeCounts, 'Debit Note'),
    purchaseInvoices: toCounts(purchaseTypeCounts, 'Purchase Invoice'),
    purchaseReturns: toCounts(purchaseTypeCounts, 'Purchase Return'),
    inventoryAdjustments: {
      total: adjustmentTotal,
      posted: adjustmentPosted,
      unposted: adjustmentTotal - adjustmentPosted - adjustmentCancelled,
    },
  };

  // ---- Monthly Sales chart (last 12 months) ----
  const monthly = await Invoice.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('invoice_date'), '%Y-%m'), 'month'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value_including_st')), 0),
        'sales',
      ],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: { companyId, invoiceDate: { [Op.gte]: monthlyWindow } },
    group: ['month'],
    order: [[sequelize.literal('month'), 'ASC']],
    raw: true,
  });

  // ---- Monthly Activity chart (all doc types, last 12 months) ----
  const [monthlyPurchases, monthlyAdjustments] = await Promise.all([
    Purchase.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('doc_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId, docDate: { [Op.gte]: monthlyWindow } },
      group: ['month'],
      raw: true,
    }),
    InventoryAdjustment.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('doc_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: { companyId, docDate: { [Op.gte]: monthlyWindow } },
      group: ['month'],
      raw: true,
    }),
  ]);

  const activityByMonth: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of [...(monthly as any[]), ...(monthlyPurchases as any[]), ...(monthlyAdjustments as any[])]) {
    activityByMonth[r.month] = (activityByMonth[r.month] ?? 0) + Number(r.count);
  }
  const monthlyActivity = Object.entries(activityByMonth)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, count]) => ({ month, count }));

  // ---- Recent invoices ----
  const recentInvoices = await Invoice.findAll({
    where: { companyId },
    order: [['created_at', 'DESC']],
    limit: 10,
  });

  return {
    cards: {
      totalInvoices: docCounts.salesInvoices.total,
      acceptedInvoices: docCounts.salesInvoices.posted,
      pendingInvoices: docCounts.salesInvoices.unposted,
      rejectedInvoices: invoiceTypeCounts
        .filter((r) => r.type === 'Sale Invoice' && r.status === 'failed')
        .reduce((a, r) => a + Number(r.count), 0),
      totalSales,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todaySales: Number((todaySalesRow as any)?.sum ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todayCount: Number((todaySalesRow as any)?.count ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthSales: Number((monthSalesRow as any)?.sum ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthCount: Number((monthSalesRow as any)?.count ?? 0),
      docCounts,
      workload: {
        posted: Object.values(docCounts).reduce((a, d) => a + d.posted, 0),
        unposted: Object.values(docCounts).reduce((a, d) => a + d.unposted, 0),
      },
    },
    charts: {
      monthlySales: monthly,
      monthlyActivity,
      invoiceStatus: Object.entries(byStatus).map(([status, v]) => ({
        status,
        count: v.count,
        sum: v.sum,
      })),
      taxSummary: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        salesTax: Number((taxRow as any)?.sales ?? 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        furtherTax: Number((taxRow as any)?.further ?? 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extraTax: Number((taxRow as any)?.extra ?? 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fedPayable: Number((taxRow as any)?.fed ?? 0),
      },
    },
    tables: {
      recentInvoices,
    },
  };
};
