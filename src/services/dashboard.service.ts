import { Op } from 'sequelize';
import { Invoice, sequelize } from '../models';

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

  const totalCount = Object.values(byStatus).reduce((a, s) => a + s.count, 0);
  const totalSales = Object.values(byStatus).reduce((a, s) => a + s.sum, 0);

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

  // ---- Recent invoices ----
  const recentInvoices = await Invoice.findAll({
    where: { companyId },
    order: [['created_at', 'DESC']],
    limit: 10,
  });

  return {
    cards: {
      totalInvoices: totalCount,
      acceptedInvoices: byStatus['posted']?.count ?? 0,
      pendingInvoices: (byStatus['draft']?.count ?? 0) + (byStatus['validated']?.count ?? 0),
      rejectedInvoices: byStatus['failed']?.count ?? 0,
      totalSales,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todaySales: Number((todaySalesRow as any)?.sum ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todayCount: Number((todaySalesRow as any)?.count ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthSales: Number((monthSalesRow as any)?.sum ?? 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      monthCount: Number((monthSalesRow as any)?.count ?? 0),
    },
    charts: {
      monthlySales: monthly,
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
