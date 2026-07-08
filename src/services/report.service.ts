import { Op } from 'sequelize';
import { Invoice, InvoiceItem, sequelize } from '../models';

export interface DateRange {
  from?: Date | string;
  to?: Date | string;
}

const rangeWhere = (r: DateRange) => {
  const where: Record<symbol, unknown> = {};
  if (r.from) where[Op.gte] = typeof r.from === 'string' ? new Date(r.from) : r.from;
  if (r.to) where[Op.lte] = typeof r.to === 'string' ? new Date(r.to) : r.to;
  return Object.getOwnPropertySymbols(where).length ? where : undefined;
};

/** GET /reports/daily — per-day totals for the given range (default: last 30 days). */
export const dailyReport = async (companyId: number, r: DateRange) => {
  const to = r.to ? new Date(r.to) : new Date();
  const from = r.from ? new Date(r.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  return Invoice.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('invoice_date')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value_including_st')), 0),
        'total',
      ],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_sales_tax')), 0),
        'salesTax',
      ],
    ],
    where: {
      companyId,
      invoiceDate: { [Op.between]: [from, to] },
    },
    group: [sequelize.fn('DATE', sequelize.col('invoice_date'))],
    order: [[sequelize.literal('date'), 'ASC']],
    raw: true,
  });
};

/** GET /reports/monthly — per-month totals. */
export const monthlyReport = async (companyId: number, r: DateRange) => {
  const where: Record<string, unknown> = { companyId };
  const dr = rangeWhere(r);
  if (dr) where.invoiceDate = dr;

  return Invoice.findAll({
    attributes: [
      [sequelize.fn('DATE_FORMAT', sequelize.col('invoice_date'), '%Y-%m'), 'month'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value_including_st')), 0),
        'total',
      ],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_sales_tax')), 0),
        'salesTax',
      ],
    ],
    where,
    group: ['month'],
    order: [[sequelize.literal('month'), 'ASC']],
    raw: true,
  });
};

/** GET /reports/tax — tax breakdown by rate (from invoice_items). */
export const taxReport = async (companyId: number, r: DateRange) => {
  const invoiceWhere: Record<string, unknown> = { companyId, status: 'posted' };
  const dr = rangeWhere(r);
  if (dr) invoiceWhere.invoiceDate = dr;

  return InvoiceItem.findAll({
    attributes: [
      'rate',
      [sequelize.fn('COUNT', sequelize.col('InvoiceItem.id')), 'itemCount'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('value_sales_excluding_st')), 0),
        'valueExcluding',
      ],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('sales_tax_applicable')), 0),
        'salesTax',
      ],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('further_tax')), 0),
        'furtherTax',
      ],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('extra_tax')), 0), 'extraTax'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('fed_payable')), 0),
        'fedPayable',
      ],
    ],
    include: [
      {
        model: Invoice,
        as: 'invoice',
        attributes: [],
        where: invoiceWhere,
        required: true,
      },
    ],
    group: ['rate'],
    order: [['rate', 'ASC']],
    raw: true,
  });
};

/** GET /reports/sales — sales report grouped by customer or product. */
export const salesReport = async (
  companyId: number,
  r: DateRange & { groupBy?: 'customer' | 'product' },
) => {
  const invoiceWhere: Record<string, unknown> = { companyId };
  const dr = rangeWhere(r);
  if (dr) invoiceWhere.invoiceDate = dr;

  if (r.groupBy === 'product') {
    return InvoiceItem.findAll({
      attributes: [
        'productId',
        'productDescription',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'qty'],
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.col('value_sales_excluding_st')),
            0,
          ),
          'sales',
        ],
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('sales_tax_applicable')), 0),
          'salesTax',
        ],
      ],
      include: [
        { model: Invoice, as: 'invoice', attributes: [], where: invoiceWhere, required: true },
      ],
      group: ['productId', 'productDescription'],
      order: [[sequelize.literal('sales'), 'DESC']],
      raw: true,
    });
  }

  // default: by customer
  return Invoice.findAll({
    attributes: [
      'customerId',
      'buyerBusinessName',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_value_including_st')), 0),
        'total',
      ],
      [
        sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('total_sales_tax')), 0),
        'salesTax',
      ],
    ],
    where: invoiceWhere,
    group: ['customerId', 'buyerBusinessName'],
    order: [[sequelize.literal('total'), 'DESC']],
    raw: true,
  });
};
