import { type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { can } from '@/lib/can';
import { buildXlsx, xlsxDisposition } from '@/lib/excel';

export async function GET(request: NextRequest) {
  const denied = await can('Manage Reports');
  if (denied) return new Response(denied, { status: 403 });

  const { searchParams } = request.nextUrl;
  const q       = searchParams.get('q')?.trim() ?? '';
  const dateStr = searchParams.get('date')?.trim() ?? '';

  const where: Prisma.SaleWhereInput = {
    deletedAt: null,
    ...(q && { OR: [
      { reference: { contains: q } },
      { customer:  { name: { contains: q } } },
    ]}),
    ...(dateStr && {
      date: {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lte: new Date(dateStr + 'T23:59:59.999Z'),
      },
    }),
  };

  const sales = await db.sale.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      reference:     true,
      status:        true,
      grandTotal:    true,
      paid:          true,
      paymentStatus: true,
      customer: { select: { name: true } },
    },
  });

  const headers = ['Reference', 'Customer', 'Status', 'Grand Total', 'Paid', 'Payment Status'];
  const rows = sales.map((s) => [
    s.reference,
    s.customer.name,
    s.status,
    Number(s.grandTotal),
    Number(s.paid),
    s.paymentStatus,
  ]);

  const buf = buildXlsx(headers, rows, 'Sale Reports');
  return new Response(buf, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': xlsxDisposition('sale-reports'),
    },
  });
}
