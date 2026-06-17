import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import {
  Receipt, Filter,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import { db } from '@/lib/db';
import PrSearch     from './PrSearch';
import PrDatePicker from './PrDatePicker';
import PrPerPage    from './PrPerPage';

const PER_OPTIONS = [10, 25, 50];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PurchaseReportsPage({
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

  const [total, purchases] = await Promise.all([
    db.purchase.count({ where }),
    db.purchase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select: {
        id:            true,
        reference:     true,
        status:        true,
        grandTotal:    true,
        paymentStatus: true,
        paymentType:   true,
        createdAt:     true,
        supplier: { select: { name: true } },
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
    return `/reports/purchase?${params}`;
  }

  function exportUrl() {
    const params = new URLSearchParams();
    if (q)       params.set('q',    q);
    if (dateStr) params.set('date', dateStr);
    return `/api/reports/purchase/export?${params}`;
  }

  return (
    <>
      {/* Toolbar */}
      <div className="rpt-toolbar">
        <PrSearch defaultQ={q} />
        <div className="gg-spacer" />
        <button className="btn-icon-gold" title="Filter" type="button">
          <Filter size={18} />
        </button>
        <a href={exportUrl()} className="btn-excel" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          EXCEL
        </a>
        <PrDatePicker defaultDate={dateStr} />
      </div>

      {/* Table — gg-table--spaced, no gg-card wrapper */}
      <div className="gg-table-wrap">
        <table className="gg-table gg-table--spaced">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Grand Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Payment Type</th>
              <th>Created On</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 0, border: 'none' }}>
                  <div className="gg-empty-state">
                    <Receipt size={40} style={{ color: 'var(--gray-300)' }} />
                    <p>
                      {q || dateStr
                        ? 'No purchases match the current filter.'
                        : 'No purchases found.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const total  = Number(p.grandTotal);
                const paid   = p.paymentStatus === 'Paid' ? total : 0;
                const due    = p.paymentStatus === 'Paid' ? 0 : total;
                return (
                  <tr key={p.id}>
                    <td><span className="gg-chip-code gg-num">{p.reference}</span></td>
                    <td className="gg-td-strong">{p.supplier.name}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="gg-num gg-td-strong">{fmtMoney(total)}</td>
                    <td className="gg-num">{fmtMoney(paid)}</td>
                    <td className="gg-num">{fmtMoney(due)}</td>
                    <td><span className="gg-chip-unit">{p.paymentType}</span></td>
                    <td>
                      <span className="gg-chip-time gg-num">
                        {fmtTime(p.createdAt)}<br />{fmtDate(p.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="gg-pagination">
        <div className="gg-perpage">
          <span className="gg-muted">Records per page</span>
          <PrPerPage perPage={perPage} />
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
