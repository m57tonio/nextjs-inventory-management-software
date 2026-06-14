import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import AddPaymentForm from './AddPaymentForm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function fmtDateTime(d: Date) {
  return (
    d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
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
      height: 22, padding: '0 10px',
      borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.fg,
    }}>
      {status}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SalePaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/');

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const sale = await db.sale.findFirst({
    where: { id, deletedAt: null },
    select: {
      id:            true,
      reference:     true,
      grandTotal:    true,
      paid:          true,
      due:           true,
      paymentStatus: true,
      date:          true,
      customer:  { select: { name: true } },
      warehouse: { select: { name: true } },
      payments: {
        orderBy: { date: 'desc' },
        select: {
          id:          true,
          amount:      true,
          paymentType: true,
          date:        true,
          notes:       true,
          createdAt:   true,
        },
      },
    },
  });

  if (!sale) notFound();

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <>
      {/* ── Page head ──────────────────────────────────────────────────────── */}
      <div className="page-head">
        <h1 className="gg-page-title">
          Sale Payments — <span className="gg-num">{sale.reference}</span>
        </h1>
        <Link href={`/sales/${id}`} className="gg-btn gg-btn--secondary gg-btn--sm">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* ── Payment summary ────────────────────────────────────────────────── */}
      <div className="gg-card gg-card-pad">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--sp-4)',
          }}
        >
          <div className="pur-info-panel">
            <div className="pur-band">Sale Info</div>
            <div className="pur-info-body">
              <div className="pur-info-line">
                <span className="k">Reference :</span>
                <span className="v gg-num">{sale.reference}</span>
              </div>
              <div className="pur-info-line">
                <span className="k">Customer :</span>
                <span className="v">{sale.customer.name}</span>
              </div>
              <div className="pur-info-line">
                <span className="k">Warehouse :</span>
                <span className="v">{sale.warehouse.name}</span>
              </div>
              <div className="pur-info-line">
                <span className="k">Date :</span>
                <span className="v gg-num">{fmtDate(sale.date)}</span>
              </div>
            </div>
          </div>

          <div className="pur-info-panel">
            <div className="pur-band">Payment Summary</div>
            <div className="pur-info-body">
              <div className="pur-info-line">
                <span className="k">Grand Total :</span>
                <span className="v gg-num">{fmt(Number(sale.grandTotal))}</span>
              </div>
              <div className="pur-info-line">
                <span className="k">Total Paid :</span>
                <span className="v gg-num" style={{ color: 'var(--success-fg)' }}>
                  {fmt(Number(sale.paid))}
                </span>
              </div>
              <div className="pur-info-line">
                <span className="k">Due :</span>
                <span
                  className="v gg-num"
                  style={{ color: Number(sale.due) > 0 ? 'var(--danger)' : 'inherit' }}
                >
                  {fmt(Number(sale.due))}
                </span>
              </div>
              <div className="pur-info-line" style={{ alignItems: 'center' }}>
                <span className="k">Status :</span>
                <PaymentStatusBadge status={sale.paymentStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment history table ─────────────────────────────────────── */}
        <div className="pur-band" style={{ margin: 'var(--sp-6) 0 var(--sp-4)' }}>
          Payment History
        </div>

        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Notes</th>
                <th>Recorded On</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <DollarSign size={36} style={{ color: 'var(--gray-300)' }} />
                      <p>No payments recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sale.payments.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="gg-num gg-muted">{sale.payments.length - idx}</td>
                    <td className="gg-num">{fmtDate(p.date)}</td>
                    <td className="gg-num gg-td-strong">{fmt(Number(p.amount))}</td>
                    <td><span className="gg-chip-unit">{p.paymentType}</span></td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                      {p.notes ?? '—'}
                    </td>
                    <td className="gg-num" style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {fmtDateTime(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sale.payments.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2} className="gg-td-strong">Total</td>
                  <td className="gg-num gg-td-strong">{fmt(Number(sale.paid))}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Add Payment form ───────────────────────────────────────────────── */}
      <AddPaymentForm saleId={sale.id} todayIso={todayIso} />
    </>
  );
}
