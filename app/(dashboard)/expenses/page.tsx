import Link from 'next/link';
import {
  Plus, Pencil, Wallet,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import ExSearch         from './ExSearch';
import ExPerPage        from './ExPerPage';
import DeleteExpenseButton from './DeleteExpenseButton';

const PER_OPTIONS = [10, 25, 50];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;

  const q         = sp.q?.trim() ?? '';
  const page      = Math.max(1, parseInt(sp.page ?? '1', 10));
  const perParsed = parseInt(sp.per ?? '10', 10);
  const perPage   = PER_OPTIONS.includes(perParsed) ? perParsed : 10;

  const where: Prisma.ExpenseWhereInput = {
    deletedAt: null,
    ...(q && {
      OR: [
        { reference: { contains: q } },
        { title:     { contains: q } },
        { warehouse: { name: { contains: q } } },
        { category:  { name: { contains: q } } },
      ],
    }),
  };

  const [total, expenses] = await Promise.all([
    db.expense.count({ where }),
    db.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select: {
        id:        true,
        reference: true,
        title:     true,
        amount:    true,
        createdAt: true,
        warehouse: { select: { name: true } },
        category:  { select: { name: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const from       = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to         = Math.min(page * perPage, total);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('per',  String(perPage));
    params.set('page', String(Math.max(1, Math.min(p, totalPages))));
    return `/expenses?${params}`;
  }

  return (
    <>
      {/* ── toolbar ── */}
      <div className="gg-table-toolbar">
        <ExSearch defaultQ={q} />
        <div className="gg-spacer" />
        <Link href="/expenses/create" className="gg-btn gg-btn--primary">
          <Plus size={17} /> Create Expense
        </Link>
      </div>

      <div className="gg-card gg-card-pad">
        {/* ── table ── */}
        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Expense Title</th>
                <th>Warehouse</th>
                <th>Expense Category</th>
                <th>Amount</th>
                <th>Created On</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <Wallet size={42} style={{ color: 'var(--gray-300)' }} />
                      <p>
                        {q
                          ? `No expenses match "${q}".`
                          : 'No expenses yet.'}
                      </p>
                      {!q && (
                        <Link href="/expenses/create" className="gg-btn gg-btn--primary" style={{ marginTop: 'var(--sp-2)' }}>
                          <Plus size={16} /> Create your first expense
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((ex) => (
                  <tr key={ex.id}>
                    {/* Reference */}
                    <td>
                      <span className="gg-chip-code">{ex.reference}</span>
                    </td>

                    {/* Expense Title */}
                    <td>
                      <span className="gg-td-strong">{ex.title}</span>
                    </td>

                    {/* Warehouse */}
                    <td>{ex.warehouse.name}</td>

                    {/* Expense Category */}
                    <td>{ex.category.name}</td>

                    {/* Amount */}
                    <td>
                      <span className="gg-num gg-td-strong">
                        {Number(ex.amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Created On */}
                    <td>
                      <span className="gg-chip-time gg-num">
                        {ex.createdAt.toLocaleTimeString('en-US', {
                          hour:   '2-digit',
                          minute: '2-digit',
                        })}
                        <br />
                        {ex.createdAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day:   'numeric',
                          year:  'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-acts">
                        <Link
                          href={`/expenses/${ex.id}/edit`}
                          className="act-edit"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </Link>
                        <DeleteExpenseButton id={ex.id} reference={ex.reference} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── pagination ── */}
        <div className="gg-pagination">
          <div className="gg-perpage">
            <span className="gg-muted">Records per page</span>
            <ExPerPage perPage={perPage} />
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
