import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import {
  Boxes,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import { db } from '@/lib/db';
import StWarehouseFilter from './StWarehouseFilter';
import StSearch          from './StSearch';
import StPerPage         from './StPerPage';

const PER_OPTIONS = [10, 25, 50];

function fmtMoney(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StockReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ wh?: string; q?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;

  const q         = sp.q?.trim() ?? '';
  const page      = Math.max(1, parseInt(sp.page ?? '1', 10));
  const perParsed = parseInt(sp.per ?? '10', 10);
  const perPage   = PER_OPTIONS.includes(perParsed) ? perParsed : 10;

  // Fetch warehouses first — warehouse selection is required (no "All" option)
  const warehouses = await db.warehouse.findMany({
    where:   { deletedAt: null },
    select:  { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Resolve selected warehouse: URL param → first available → null (no warehouses)
  const whIdRaw = parseInt(sp.wh ?? '', 10);
  const whId    = !Number.isNaN(whIdRaw) && warehouses.some((w) => w.id === whIdRaw)
    ? whIdRaw
    : (warehouses[0]?.id ?? null);

  // ── Fetch stock (only when a warehouse exists) ────────────────────────────
  let total  = 0;
  let stocks: Array<{
    quantity: number;
    product: {
      id: number; code: string; name: string;
      price: Prisma.Decimal; productUnit: string;
      category: { name: string };
    };
  }> = [];

  if (whId !== null) {
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

    [total, stocks] = await Promise.all([
      db.productStock.count({ where }),
      db.productStock.findMany({
        where,
        orderBy: { product: { name: 'asc' } },
        skip:    (page - 1) * perPage,
        take:    perPage,
        select: {
          quantity: true,
          product: {
            select: {
              id:          true,
              code:        true,
              name:        true,
              price:       true,
              productUnit: true,
              category:    { select: { name: true } },
            },
          },
        },
      }),
    ]);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from       = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, total);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (whId !== null) params.set('wh', String(whId));
    if (q)             params.set('q',  q);
    params.set('per',  String(perPage));
    params.set('page', String(Math.max(1, Math.min(p, totalPages))));
    return `/reports/stock?${params}`;
  }

  function exportUrl() {
    const params = new URLSearchParams();
    if (whId !== null) params.set('wh', String(whId));
    if (q)             params.set('q',  q);
    return `/api/reports/stock/export?${params}`;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (warehouses.length === 0) {
    return (
      <div className="gg-empty-state">
        <Boxes size={40} style={{ color: 'var(--gray-300)' }} />
        <p>No warehouses found. Create a warehouse first.</p>
      </div>
    );
  }

  return (
    <>
      {/* Warehouse filter — required, no "All" option */}
      <StWarehouseFilter warehouses={warehouses} selectedId={whId!} />

      {/* Toolbar: search + spacer + EXCEL (no filter icon per design) */}
      <div className="rpt-toolbar">
        <StSearch defaultQ={q} />
        <div className="gg-spacer" />
        <a href={exportUrl()} className="btn-excel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          EXCEL
        </a>
      </div>

      {/* Table — inside gg-card gg-card-pad, plain gg-table (not spaced) */}
      <div className="gg-card gg-card-pad">
        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <Boxes size={40} style={{ color: 'var(--gray-300)' }} />
                      <p>
                        {q
                          ? 'No products match the search.'
                          : 'No stock records for this warehouse.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.product.id}>
                    <td><span className="gg-chip-code">{s.product.code}</span></td>
                    <td className="gg-td-strong">{s.product.name}</td>
                    <td>{s.product.category.name}</td>
                    <td className="gg-num">{fmtMoney(Number(s.product.price))}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span className="stock-count gg-num">{s.quantity}</span>
                        <span className="gg-chip-unit">{s.product.productUnit}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/products/${s.product.id}`}
                        className="btn-reports"
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                      >
                        Reports
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="gg-pagination">
          <div className="gg-perpage">
            <span className="gg-muted">Records per page</span>
            <StPerPage perPage={perPage} />
          </div>
          <span className="gg-muted gg-num">{from}–{to} of {total}</span>
          <div className="gg-spacer" />
          <Link href={pageUrl(1)}          className="gg-page-btn" aria-label="First">   <ChevronsLeft  size={17} /></Link>
          <Link href={pageUrl(page - 1)}   className="gg-page-btn" aria-label="Previous"><ChevronLeft   size={17} /></Link>
          <Link href={pageUrl(page + 1)}   className="gg-page-btn" aria-label="Next">   <ChevronRight  size={17} /></Link>
          <Link href={pageUrl(totalPages)} className="gg-page-btn" aria-label="Last">   <ChevronsRight size={17} /></Link>
        </div>
      </div>
    </>
  );
}
