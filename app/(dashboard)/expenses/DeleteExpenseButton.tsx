'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteExpense } from './actions';

type Props = { id: number; reference: string };

export default function DeleteExpenseButton({ id, reference }: Props) {
  const router = useRouter();
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteExpense(id);
      if (result.success) {
        setOpen(false);
        toast.success(`Expense "${reference}" has been deleted.`);
        router.refresh();
      } else {
        setOpen(false);
        toast.error(result.error ?? 'Failed to delete expense.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="act-del"
        title="Delete"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={17} />
      </button>

      {open && (
        <div
          className="gg-overlay is-open"
          onClick={(e) => e.target === e.currentTarget && !isPending && setOpen(false)}
        >
          <div className="gg-modal" role="dialog" aria-modal="true">
            <div className="gg-modal-head">
              <span className="gg-card-title">Delete Expense</span>
              <button
                type="button"
                className="gg-modal-close"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                <X size={18} />
              </button>
            </div>

            <div className="gg-modal-body">
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ margin: 0, color: 'var(--ink)', fontWeight: 500 }}>
                    Are you sure you want to delete <strong>{reference}</strong>?
                  </p>
                  <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: 13 }}>
                    This action will soft-delete the expense record.
                  </p>
                </div>
              </div>
            </div>

            <div className="gg-modal-foot">
              <button
                type="button"
                className="gg-btn gg-btn--secondary"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gg-btn gg-btn--danger"
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
                  : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
