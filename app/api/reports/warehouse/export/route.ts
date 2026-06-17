import { type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { can } from '@/lib/can';
import { buildXlsx, xlsxDisposition } from '@/lib/excel';

const VALID_SUBS = ['sales', 'sale-returns', 'purchase-returns', 'expenses'] as const;
type Sub = typeof VALID_SUBS[number];

export async function GET(request: NextRequest) {
  const denied = await can('Manage Reports');
  if (denied) return new Response(denied, { status: 403 });

  const { searchParams } = request.nextUrl;
  const whIdRaw = parseInt(searchParams.get('wh') ?? '', 10);
  const whId    = Number.isNaN(whIdRaw) ? null : whIdRaw;
  const sub     = (VALID_SUBS as readonly string[]).includes(searchParams.get('sub') ?? '')
    ? (searchParams.get('sub') as Sub)
    : 'sales';
  const q = searchParams.get('q')?.trim() ?? '';

  const whFilter = whId ? { warehouseId: whId } : {};

  let buf: ArrayBuffer;
  let filename: string;

  if (sub === 'sales') {
    const where: Prisma.SaleWhereInput = {
      deletedAt: null,
      ...whFilter,
      ...(q && { OR: [
        { reference: { contains: q } },
        { customer:  { name: { contains: q } } },
        { warehouse: { name: { contains: q } } },
      ]}),
    };
    const rows = await db.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        reference:     true,
        status:        true,
        grandTotal:    true,
        paid:          true,
        due:           true,
        paymentStatus: true,
        customer:  { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });
    buf = buildXlsx(
      ['Reference', 'Customer', 'Warehouse', 'Status', 'Grand Total', 'Paid', 'Due', 'Payment Status'],
      rows.map((r) => [r.reference, r.customer.name, r.warehouse.name, r.status,
        Number(r.grandTotal), Number(r.paid), Number(r.due), r.paymentStatus]),
      'Sales',
    );
    filename = 'warehouse-sales';
  } else if (sub === 'sale-returns') {
    const where: Prisma.SaleReturnWhereInput = {
      deletedAt: null,
      ...whFilter,
      ...(q && { OR: [
        { reference: { contains: q } },
        { customer:  { name: { contains: q } } },
        { warehouse: { name: { contains: q } } },
      ]}),
    };
    const rows = await db.saleReturn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        reference:     true,
        status:        true,
        grandTotal:    true,
        paid:          true,
        due:           true,
        paymentStatus: true,
        customer:  { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });
    buf = buildXlsx(
      ['Reference', 'Customer', 'Warehouse', 'Status', 'Grand Total', 'Paid', 'Due', 'Payment Status'],
      rows.map((r) => [r.reference, r.customer.name, r.warehouse.name, r.status,
        Number(r.grandTotal), Number(r.paid), Number(r.due), r.paymentStatus]),
      'Sales Returns',
    );
    filename = 'warehouse-sale-returns';
  } else if (sub === 'purchase-returns') {
    const where: Prisma.PurchaseReturnWhereInput = {
      deletedAt: null,
      ...whFilter,
      ...(q && { OR: [
        { reference: { contains: q } },
        { supplier:  { name: { contains: q } } },
        { warehouse: { name: { contains: q } } },
      ]}),
    };
    const rows = await db.purchaseReturn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        reference:  true,
        status:     true,
        grandTotal: true,
        paid:       true,
        due:        true,
        supplier:  { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });
    buf = buildXlsx(
      ['Reference', 'Supplier', 'Warehouse', 'Status', 'Grand Total', 'Paid', 'Due'],
      rows.map((r) => [r.reference, r.supplier.name, r.warehouse.name, r.status,
        Number(r.grandTotal), Number(r.paid), Number(r.due)]),
      'Purchase Returns',
    );
    filename = 'warehouse-purchase-returns';
  } else {
    // expenses
    const where: Prisma.ExpenseWhereInput = {
      deletedAt: null,
      ...whFilter,
      ...(q && { OR: [
        { reference: { contains: q } },
        { title:     { contains: q } },
        { warehouse: { name: { contains: q } } },
      ]}),
    };
    const rows = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        reference: true,
        title:     true,
        amount:    true,
        date:      true,
        warehouse: { select: { name: true } },
        category:  { select: { name: true } },
      },
    });
    buf = buildXlsx(
      ['Reference', 'Title', 'Warehouse', 'Category', 'Amount', 'Date'],
      rows.map((r) => [r.reference, r.title, r.warehouse.name, r.category.name,
        Number(r.amount), r.date.toISOString().slice(0, 10)]),
      'Expenses',
    );
    filename = 'warehouse-expenses';
  }

  return new Response(buf, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': xlsxDisposition(filename),
    },
  });
}
