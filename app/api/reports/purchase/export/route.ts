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

  const where: Prisma.PurchaseWhereInput = {
    deletedAt: null,
    ...(q && { OR: [
      { reference: { contains: q } },
      { supplier:  { name: { contains: q } } },
    ]}),
    ...(dateStr && {
      date: {
        gte: new Date(dateStr + 'T00:00:00.000Z'),
        lte: new Date(dateStr + 'T23:59:59.999Z'),
      },
    }),
  };

  const purchases = await db.purchase.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      reference:     true,
      status:        true,
      grandTotal:    true,
      paymentStatus: true,
      paymentType:   true,
      createdAt:     true,
      supplier: { select: { name: true } },
    },
  });

  const headers = ['Reference', 'Supplier', 'Status', 'Grand Total', 'Paid', 'Due', 'Payment Type', 'Created On'];
  const rows = purchases.map((p) => {
    const total = Number(p.grandTotal);
    const paid  = p.paymentStatus === 'Paid' ? total : 0;
    const due   = p.paymentStatus === 'Paid' ? 0 : total;
    return [
      p.reference,
      p.supplier.name,
      p.status,
      total,
      paid,
      due,
      p.paymentType,
      p.createdAt.toISOString().slice(0, 10),
    ];
  });

  const buf = buildXlsx(headers, rows, 'Purchase Reports');
  return new Response(buf, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': xlsxDisposition('purchase-reports'),
    },
  });
}
