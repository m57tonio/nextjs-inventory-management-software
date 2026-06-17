import { type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { can } from '@/lib/can';
import { buildXlsx, xlsxDisposition } from '@/lib/excel';

export async function GET(request: NextRequest) {
  const denied = await can('Manage Reports');
  if (denied) return new Response(denied, { status: 403 });

  const { searchParams } = request.nextUrl;
  const whIdRaw = parseInt(searchParams.get('wh') ?? '', 10);
  const whId    = Number.isNaN(whIdRaw) ? null : whIdRaw;
  const q       = searchParams.get('q')?.trim() ?? '';

  if (whId === null) return new Response('Warehouse required', { status: 400 });

  const where: Prisma.ProductStockWhereInput = {
    warehouseId: whId,
    product: {
      deletedAt: null,
      ...(q && { OR: [
        { name: { contains: q } },
        { code: { contains: q } },
      ]}),
    },
  };

  const stocks = await db.productStock.findMany({
    where,
    orderBy: { product: { name: 'asc' } },
    select: {
      quantity: true,
      product: {
        select: {
          code:        true,
          name:        true,
          price:       true,
          productUnit: true,
          category:    { select: { name: true } },
        },
      },
    },
  });

  const headers = ['Code', 'Name', 'Category', 'Price', 'Current Stock', 'Unit'];
  const rows = stocks.map((s) => [
    s.product.code,
    s.product.name,
    s.product.category.name,
    Number(s.product.price),
    s.quantity,
    s.product.productUnit,
  ]);

  const buf = buildXlsx(headers, rows, 'Stock Reports');
  return new Response(buf, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': xlsxDisposition('stock-reports'),
    },
  });
}
