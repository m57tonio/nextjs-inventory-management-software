import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import {
  ShoppingCart, Filter,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import { db } from '@/lib/db';
import SrSearch     from './SrSearch';
import SrDatePicker from './SrDatePicker';
import SrPerPage    from './SrPerPage';

const PER_OPTIONS = [10, 25, 50];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, { bg: string; fg: string }> = {
    Received: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
    Ordered:  { bg: 'var(--info-bg)',    fg: 'var(--info)' },
    Pending:  { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
  };
  const c = colours[status] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-600)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 24, padding: '0 10px',
      borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: 600,
      background: c.bg, color: c.fg,
    }}>
      {status}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const colours: Record<string, { bg: string; fg: string }> = {
    Paid:    { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
    Partial: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
    Unpaid:  { bg: 'var(--danger-bg)',  fg: 'var(--danger)' },
  };
  const c = colours[status] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-600)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 24, padding: '0 10px',
      borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: 600,
      background: c.bg, color: c.fg,
    }}>
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SaleReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;

  const q         = sp.q?.trim() ?? '';
  const dateStr   = sp.date?.trim() ?? '';
  const page      = Math.max(1, parseInt(sp.page ?? '1', 10));
  const perParsed = parseInt(sp.per ?? '10', 10);
  const perPage   = PER_OPTIONS.includes(perParsed) ? perParsed : 10;

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

  const [total, sales] = await Promise.all([
    db.sale.count({ where }),
    db.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select: {
        id:            true,
        reference:     true,
        status:        true,
        grandTotal:    true,
        paid:          true,
        paymentStatus: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from       = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, total);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q)       params.set('q',    q);
    if (dateStr) params.set('date', dateStr);
    params.set('per',  String(perPage));
    params.set('page', String(Math.max(1, Math.min(p, totalPages))));
    return `/reports/sale?${params}`;
  }

  function exportUrl() {
    const params = new URLSearchParams();
    if (q)       params.set('q',    q);
    if (dateStr) params.set('date', dateStr);
    return `/api/reports/sale/export?${params}`;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="rpt-toolbar">
        <SrSearch defaultQ={q} />
        <div className="gg-spacer" />
        <button className="btn-icon-gold" title="Filter" type="button">
          <Filter size={18} />
        </button>
        <a href={exportUrl()} className="btn-excel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          EXCEL
        </a>
        <SrDatePicker defaultDate={dateStr} />
      </div>

      {/* Table — no gg-card wrapper, gg-table--spaced rows */}
      <div className="gg-table-wrap">
        <table className="gg-table gg-table--spaced">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Grand Total</th>
              <th>Paid</th>
              <th>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                  <div className="gg-empty-state">
                    <ShoppingCart size={40} style={{ color: 'var(--gray-300)' }} />
                    <p>
                      {q || dateStr
                        ? 'No sales match the current filter.'
                        : 'No sales found.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id}>
                  <td><span className="gg-chip-code gg-num">{s.reference}</span></td>
                  <td className="gg-td-strong">{s.customer.name}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="gg-num gg-td-strong">{fmtMoney(Number(s.grandTotal))}</td>
                  <td className="gg-num">{fmtMoney(Number(s.paid))}</td>
                  <td><PaymentStatusBadge status={s.paymentStatus} /></td>
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
          <SrPerPage perPage={perPage} />
        </div>
        <span className="gg-muted gg-num">{from}–{to} of {total}</span>
        <div className="gg-spacer" />
        <Link href={pageUrl(1)}          className="gg-page-btn" aria-label="First">   <ChevronsLeft  size={17} /></Link>
        <Link href={pageUrl(page - 1)}   className="gg-page-btn" aria-label="Previous"><ChevronLeft   size={17} /></Link>
        <Link href={pageUrl(page + 1)}   className="gg-page-btn" aria-label="Next">   <ChevronRight  size={17} /></Link>
        <Link href={pageUrl(totalPages)} className="gg-page-btn" aria-label="Last">   <ChevronsRight size={17} /></Link>
      </div>
    </>
  );
}
