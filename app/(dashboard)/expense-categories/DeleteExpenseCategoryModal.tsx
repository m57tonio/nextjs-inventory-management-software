'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteExpenseCategory } from './actions';

type Props = {
  id:      number;
  name:    string;
  onClose: () => void;
};

export default function DeleteExpenseCategoryModal({ id, name, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isPending]);

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteExpenseCategory(id);
      if (result.success) {
        toast.success(`"${name}" has been deleted.`);
        router.refresh();
        onClose();
      } else {
        // Error means in-use block or permission failure — keep modal closed, show toast
        toast.error(result.error ?? 'Failed to delete expense category.');
        onClose();
      }
    });
  }

  return (
    <div
      className="gg-overlay is-open"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="gg-modal" role="dialog" aria-modal="true">

        <div className="gg-modal-head">
          <span className="gg-card-title">Delete Expense Category</span>
          <button
            type="button"
            className="gg-modal-close"
            onClick={onClose}
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
                Are you sure you want to delete <strong>{name}</strong>?
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: 13 }}>
                This will soft-delete the category. If any expenses are linked to it,
                the deletion will be blocked and you will see an error toast.
              </p>
            </div>
          </div>
        </div>

        <div className="gg-modal-foot">
          <button
            type="button"
            className="gg-btn gg-btn--secondary"
            onClick={onClose}
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
  );
}
