'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Pencil, Trash2, Search, Tag,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import { createExpenseCategory, updateExpenseCategory } from './actions';
import type { ActionState } from './actions';
import ExpenseCategoryModal        from './ExpenseCategoryModal';
import DeleteExpenseCategoryModal  from './DeleteExpenseCategoryModal';

export type ECRow = { id: number; name: string };

type Props = {
  rows:       ECRow[];
  total:      number;
  page:       number;
  perPage:    number;
  totalPages: number;
  from:       number;
  to:         number;
  q:          string;
};

const PER_OPTIONS = [10, 25, 50];

export default function ExpenseCategoriesClient({
  rows, total, page, perPage, totalPages, from, to, q,
}: Props) {
  const router   = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalMode,    setModalMode]    = useState<'create' | 'edit' | null>(null);
  const [editRow,      setEditRow]      = useState<ECRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ECRow | null>(null);

  function openCreate() { setEditRow(null); setModalMode('create'); }
  function openEdit(r: ECRow) { setEditRow(r); setModalMode('edit'); }
  function closeModal() { setModalMode(null); setEditRow(null); }

  // ── Debounced search ──────────────────────────────────────────────────────
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (val) url.searchParams.set('q', val);
      else     url.searchParams.delete('q');
      url.searchParams.delete('page');
      router.replace(url.pathname + url.search);
    }, 300);
  }

  // ── Per-page ──────────────────────────────────────────────────────────────
  function handlePerPage(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    url.searchParams.set('per',  e.target.value);
    url.searchParams.set('page', '1');
    router.replace(url.pathname + url.search);
  }

  // ── Pagination URL ────────────────────────────────────────────────────────
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('per',  String(perPage));
    params.set('page', String(Math.max(1, Math.min(p, totalPages))));
    return `/expense-categories?${params}`;
  }

  // ── Action bound for edit ─────────────────────────────────────────────────
  const editAction = editRow
    ? (updateExpenseCategory.bind(null, editRow.id) as (
        prev: ActionState, fd: FormData,
      ) => Promise<ActionState>)
    : createExpenseCategory;

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="gg-table-toolbar">
        <div className="gg-input-icon" style={{ maxWidth: 460, width: '100%' }}>
          <Search size={18} />
          <input
            className="gg-input"
            placeholder="Search expense categories…"
            defaultValue={q}
            onChange={handleSearch}
          />
        </div>
        <div className="gg-spacer" />
        <button type="button" className="gg-btn gg-btn--primary" onClick={openCreate}>
          <Plus size={17} /> Create Expense Category
        </button>
      </div>

      {/* ── Table ── */}
      <div className="gg-card gg-card-pad">
        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <Tag size={42} style={{ color: 'var(--gray-300)' }} />
                      <p>
                        {q
                          ? `No expense categories match "${q}".`
                          : 'No expense categories yet.'}
                      </p>
                      {!q && (
                        <button
                          type="button"
                          className="gg-btn gg-btn--primary"
                          style={{ marginTop: 'var(--sp-2)' }}
                          onClick={openCreate}
                        >
                          <Plus size={16} /> Create your first category
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="gg-td-strong">{r.name}</span></td>
                  <td>
                    <div className="gg-row gg-gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="act-btn act-edit"
                        title="Edit"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        type="button"
                        className="act-btn act-del"
                        title="Delete"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="gg-pagination">
          <div className="gg-perpage">
            <span className="gg-muted">Records per page</span>
            <select
              className="gg-select"
              style={{ width: 78, height: 38 }}
              defaultValue={perPage}
              onChange={handlePerPage}
            >
              {PER_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <span className="gg-muted gg-num">{from}–{to} of {total}</span>

          <div className="gg-spacer" />

          <Link href={pageUrl(1)}          className="gg-page-btn" aria-label="First">   <ChevronsLeft  size={17} /></Link>
          <Link href={pageUrl(page - 1)}   className="gg-page-btn" aria-label="Previous"><ChevronLeft   size={17} /></Link>
          <Link href={pageUrl(page + 1)}   className="gg-page-btn" aria-label="Next">   <ChevronRight  size={17} /></Link>
          <Link href={pageUrl(totalPages)} className="gg-page-btn" aria-label="Last">   <ChevronsRight size={17} /></Link>
        </div>
      </div>

      {/* ── Create / edit modal ── */}
      {modalMode && (
        <ExpenseCategoryModal
          key={modalMode === 'create' ? 'create' : String(editRow!.id)}
          mode={modalMode}
          name={editRow?.name}
          action={modalMode === 'create' ? createExpenseCategory : editAction}
          onClose={closeModal}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <DeleteExpenseCategoryModal
          id={deleteTarget.id}
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
