import { Op } from 'sequelize';
import {
  Invoice,
  InvoiceItem,
  Purchase,
  PurchaseItem,
  Customer,
  Vendor,
  InventoryAdjustment,
  InventoryAdjustmentItem,
  Product,
} from '../models';

export interface ItemLedgerRow {
  documentNo: string;
  documentDate: string;
  postingDate: string | null;
  documentType: 'Sales Invoice' | 'Debit Note' | 'Purchase Invoice' | 'Purchase Return' | 'Inventory Adjustment';
  itemNo: number | null;
  hsCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  unitPrice: number;
}

export interface ItemLedgerQuery {
  from?: string;
  to?: string;
  productId?: number;
  docType?: 'Sales Invoice' | 'Debit Note' | 'Purchase Invoice' | 'Purchase Return' | 'Inventory Adjustment';
  search?: string;
}

/**
 * Cross-source item ledger — unions sale-item and purchase-item history
 * for the given company, filtered by document date range.
 */
export const getItemLedger = async (
  companyId: number,
  q: ItemLedgerQuery,
): Promise<ItemLedgerRow[]> => {
  const rows: ItemLedgerRow[] = [];

  const dateFilter: Record<symbol, unknown> = {};
  if (q.from) dateFilter[Op.gte] = q.from;
  if (q.to) dateFilter[Op.lte] = q.to;

  // Sale side (invoices + invoice_items)
  if (!q.docType || q.docType === 'Sales Invoice' || q.docType === 'Debit Note') {
    const saleWhere: Record<string, unknown> = { companyId, status: 'posted' };
    if (q.from || q.to) saleWhere.invoiceDate = dateFilter;
    if (q.docType === 'Debit Note') saleWhere.invoiceType = 'Debit Note';
    if (q.docType === 'Sales Invoice') saleWhere.invoiceType = 'Sale Invoice';

    const invoiceItemWhere: Record<string, unknown> = {};
    if (q.productId) invoiceItemWhere.productId = q.productId;
    if (q.search) {
      invoiceItemWhere[Op.or as unknown as string] = [
        { productDescription: { [Op.like]: `%${q.search}%` } },
        { hsCode: { [Op.like]: `%${q.search}%` } },
      ];
    }

    const items = await InvoiceItem.findAll({
      where: invoiceItemWhere,
      include: [
        {
          model: Invoice,
          as: 'invoice',
          where: saleWhere,
          required: true,
          attributes: [
            'fbrInvoiceNumber',
            'invoiceDate',
            'postingDate',
            'invoiceType',
            'id',
          ],
          include: [{ model: Customer, as: 'customer', attributes: ['businessName'] }],
        },
      ],
    });

    for (const it of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inv = (it as any).invoice as Invoice;
      rows.push({
        documentNo:
          inv.fbrInvoiceNumber ?? `SI-${String(inv.id).padStart(4, '0')}`,
        documentDate: String(inv.invoiceDate),
        postingDate: inv.postingDate ? String(inv.postingDate) : null,
        documentType: inv.invoiceType === 'Debit Note' ? 'Debit Note' : 'Sales Invoice',
        itemNo: it.productId ?? null,
        hsCode: it.hsCode,
        itemName: it.productDescription,
        quantity: Number(it.quantity),
        uom: it.uom,
        unitCost: 0,
        unitPrice: Number(it.unitPrice ?? 0),
      });
    }
  }

  // Purchase side (purchases + purchase_items)
  if (!q.docType || q.docType === 'Purchase Invoice' || q.docType === 'Purchase Return') {
    const purchaseWhere: Record<string, unknown> = { companyId, status: 'posted' };
    if (q.from || q.to) purchaseWhere.docDate = dateFilter;
    if (q.docType === 'Purchase Return') purchaseWhere.purchaseType = 'Purchase Return';
    if (q.docType === 'Purchase Invoice') purchaseWhere.purchaseType = 'Purchase Invoice';

    const purchaseItemWhere: Record<string, unknown> = {};
    if (q.productId) purchaseItemWhere.productId = q.productId;
    if (q.search) {
      purchaseItemWhere[Op.or as unknown as string] = [
        { productDescription: { [Op.like]: `%${q.search}%` } },
        { hsCode: { [Op.like]: `%${q.search}%` } },
      ];
    }

    const items = await PurchaseItem.findAll({
      where: purchaseItemWhere,
      include: [
        {
          model: Purchase,
          as: 'purchase',
          where: purchaseWhere,
          required: true,
          attributes: ['purchaseNo', 'docDate', 'postingDate', 'purchaseType', 'id'],
          include: [{ model: Vendor, as: 'vendor', attributes: ['businessName'] }],
        },
      ],
    });

    for (const it of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (it as any).purchase as Purchase;
      rows.push({
        documentNo: p.purchaseNo ?? `PI-${String(p.id).padStart(4, '0')}`,
        documentDate: String(p.docDate),
        postingDate: p.postingDate ? String(p.postingDate) : null,
        documentType:
          p.purchaseType === 'Purchase Return' ? 'Purchase Return' : 'Purchase Invoice',
        itemNo: it.productId ?? null,
        hsCode: it.hsCode ?? '',
        itemName: it.productDescription,
        quantity: Number(it.quantity),
        uom: it.uom,
        unitCost: Number(it.unitPrice ?? 0),
        unitPrice: 0,
      });
    }
  }

  // Inventory Adjustment side (inventory_adjustments + inventory_adjustment_items)
  if (!q.docType || q.docType === 'Inventory Adjustment') {
    const adjustmentWhere: Record<string, unknown> = { companyId, status: 'posted' };
    if (q.from || q.to) adjustmentWhere.docDate = dateFilter;

    const adjustmentItemWhere: Record<string, unknown> = {};
    if (q.productId) adjustmentItemWhere.productId = q.productId;
    if (q.search) {
      adjustmentItemWhere[Op.or as unknown as string] = [
        { productDescription: { [Op.like]: `%${q.search}%` } },
      ];
    }

    const items = await InventoryAdjustmentItem.findAll({
      where: adjustmentItemWhere,
      include: [
        {
          model: InventoryAdjustment,
          as: 'adjustment',
          where: adjustmentWhere,
          required: true,
          attributes: ['adjustmentNo', 'docDate', 'postingDate', 'id'],
        },
        { model: Product, as: 'product', attributes: ['hsCode'] },
      ],
    });

    for (const it of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adj = (it as any).adjustment as InventoryAdjustment;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product = (it as any).product as Product | null;
      rows.push({
        documentNo: adj.adjustmentNo ?? `IA-${String(adj.id).padStart(4, '0')}`,
        documentDate: String(adj.docDate),
        postingDate: adj.postingDate ? String(adj.postingDate) : null,
        documentType: 'Inventory Adjustment',
        itemNo: it.productId ?? null,
        hsCode: product?.hsCode ?? '',
        itemName: it.productDescription,
        quantity: Number(it.quantity),
        uom: it.uom,
        unitCost: Number(it.unitCost ?? 0),
        unitPrice: 0,
      });
    }
  }

  rows.sort((a, b) => (a.documentDate < b.documentDate ? 1 : -1));
  return rows;
};
