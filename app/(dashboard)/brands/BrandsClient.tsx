'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Sparkles, Search,
         ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { createBrand, updateBrand, type BrandState } from './actions';
import BrandModal from './BrandModal';
import DeleteBrandModal from './DeleteBrandModal';

export type BrandRow = {
  id:        number;
  name:      string;
  logo:      string | null;
  createdAt: Date;
};

type Props = {
  brands:     BrandRow[];
  total:      number;
  page:       number;
  perPage:    number;
  totalPages: number;
  from:       number;
  to:         number;
  q:          string;
};

const PER_OPTIONS = [10, 25, 50];

export default function BrandsClient({
  brands, total, page, perPage, totalPages, from, to, q,
}: Props) {
  const router   = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Modal state ────────────────────────────────────────────────────────────
  // modalMode drives create vs. edit; editBrand supplies pre-fill data.
  // Both will be consumed by BrandModal in Step 3.
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editBrand, setEditBrand] = useState<BrandRow | null>(null);

  // Delete target — wired in Step 4.
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null);

  function openCreate() { setEditBrand(null); setModalMode('create'); }
  function openEdit(b: BrandRow) { setEditBrand(b); setModalMode('edit'); }
  function closeModal() { setModalMode(null); setEditBrand(null); }

  // ── Search (debounced URL update) ──────────────────────────────────────────
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (val) url.searchParams.set('q', val);
      else url.searchParams.delete('q');
      url.searchParams.delete('page');
      router.replace(url.pathname + url.search);
    }, 300);
  }

  // ── Per-page ───────────────────────────────────────────────────────────────
  function handlePerPage(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    url.searchParams.set('per', e.target.value);
    url.searchParams.set('page', '1');
    router.replace(url.pathname + url.search);
  }

  // ── Pagination URL helper ─────────────────────────────────────────────────
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('per',  String(perPage));
    params.set('page', String(Math.max(1, Math.min(p, totalPages))));
    return `/brands?${params}`;
  }

  return (
    <>
      {/* ── toolbar ── */}
      <div className="gg-table-toolbar">
        <div className="gg-input-icon" style={{ maxWidth: 460, width: '100%' }}>
          <Search size={18} />
          <input
            className="gg-input"
            placeholder="Search brands…"
            defaultValue={q}
            onChange={handleSearch}
          />
        </div>
        <div className="gg-spacer" />
        <button type="button" className="gg-btn gg-btn--primary" onClick={openCreate}>
          <Plus size={17} /> Create Brand
        </button>
      </div>

      {/* ── table ── */}
      <div className="gg-card gg-card-pad">
        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <Sparkles size={42} style={{ color: 'var(--gray-300)' }} />
                      <p>{q ? `No brands match "${q}".` : 'No brands yet.'}</p>
                      {!q && (
                        <button
                          type="button"
                          className="gg-btn gg-btn--primary"
                          style={{ marginTop: 'var(--sp-2)' }}
                          onClick={openCreate}
                        >
                          <Plus size={16} /> Create your first brand
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id}>
                    {/* Logo + name */}
                    <td>
                      <div className="gg-row gg-gap-3">
                        <div className="cat-thumb">
                          {b.logo
                            ? <img src={b.logo} alt={b.name} />
                            : <Sparkles size={20} />}
                        </div>
                        <span className="gg-td-strong">{b.name}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="gg-row gg-gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="act-btn act-edit"
                          title="Edit"
                          onClick={() => openEdit(b)}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          className="act-btn act-del"
                          title="Delete"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 size={18} />
                        </button>
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

          <Link href={pageUrl(1)}          className="gg-page-btn" aria-label="First"><ChevronsLeft  size={17} /></Link>
          <Link href={pageUrl(page - 1)}   className="gg-page-btn" aria-label="Previous"><ChevronLeft   size={17} /></Link>
          <Link href={pageUrl(page + 1)}   className="gg-page-btn" aria-label="Next"><ChevronRight  size={17} /></Link>
          <Link href={pageUrl(totalPages)} className="gg-page-btn" aria-label="Last"><ChevronsRight size={17} /></Link>
        </div>
      </div>

       

      {/* ── create / edit modal ── */}
      {modalMode && (
        <BrandModal
          key={modalMode === 'create' ? 'create' : String(editBrand!.id)}
          mode={modalMode}
          brand={editBrand}
          action={
            modalMode === 'create'
              ? createBrand
              : (updateBrand.bind(null, editBrand!.id) as (
                  prev: BrandState,
                  formData: FormData,
                ) => Promise<BrandState>)
          }
          onClose={closeModal}
        />
      )}

      {/* ── delete confirmation modal ── */}
      {deleteTarget && (
        <DeleteBrandModal
          brand={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
