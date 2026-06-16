import Link from 'next/link';
import {
  Plus, Pencil, ShieldCheck,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import RolesSearch    from './RolesSearch';
import RolesPerPage   from './RolesPerPage';
import DeleteRoleButton from './DeleteRoleButton';

const PER_OPTIONS = [10, 25, 50];

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; per?: string }>;
}) {
  const sp = await searchParams;

  const q         = sp.q?.trim() ?? '';
  const page      = Math.max(1, parseInt(sp.page ?? '1', 10));
  const perParsed = parseInt(sp.per ?? '10', 10);
  const perPage   = PER_OPTIONS.includes(perParsed) ? perParsed : 10;

  const where: Prisma.RoleWhereInput = {
    deletedAt: null,
    ...(q && { name: { contains: q } }),
  };

  const [total, roles] = await Promise.all([
    db.role.count({ where }),
    db.role.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * perPage,
      take:    perPage,
      select:  { id: true, name: true, createdAt: true },
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
    return `/roles?${params}`;
  }

  return (
    <>
      {/* ── toolbar ── */}
      <div className="gg-table-toolbar">
        <RolesSearch defaultQ={q} />
        <div className="gg-spacer" />
        <Link href="/roles/create" className="gg-btn gg-btn--primary">
          <Plus size={17} /> Create Role
        </Link>
      </div>

      <div className="gg-card gg-card-pad">
        {/* ── table ── */}
        <div className="gg-table-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 0, border: 'none' }}>
                    <div className="gg-empty-state">
                      <ShieldCheck size={42} style={{ color: 'var(--gray-300)' }} />
                      <p>
                        {q
                          ? `No roles match "${q}".`
                          : 'No roles yet.'}
                      </p>
                      {!q && (
                        <Link href="/roles/create" className="gg-btn gg-btn--primary" style={{ marginTop: 'var(--sp-2)' }}>
                          <Plus size={16} /> Create your first role
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id}>
                    {/* Name */}
                    <td>
                      <span className="gg-td-strong">{r.name}</span>
                    </td>

                    {/* Date */}
                    <td>
                      <span className="gg-num">
                        {r.createdAt.toLocaleDateString('en-US', {
                          month: '2-digit',
                          day:   '2-digit',
                          year:  'numeric',
                        })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-acts">
                        <Link
                          href={`/roles/${r.id}/edit`}
                          className="act-edit"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </Link>
                        <DeleteRoleButton id={r.id} name={r.name} />
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
            <RolesPerPage perPage={perPage} />
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
