'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ActionState } from './actions';

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

type Props = {
  mode:    'create' | 'edit';
  name?:   string;
  action:  Action;
  onClose: () => void;
};

export default function ExpenseCategoryModal({ mode, name, action, onClose }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isPending]);

  // Toast + refresh + close on result
  useEffect(() => {
    if (!state.success && !state.error) return;
    if (state.success) {
      toast.success(mode === 'create' ? 'Expense category created.' : 'Expense category updated.');
      router.refresh();
      onClose();
    } else if (state.error) {
      toast.error(state.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div
      className="gg-overlay is-open"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="gg-modal" role="dialog" aria-modal="true">

        <div className="gg-modal-head">
          <span className="gg-card-title">
            {mode === 'create' ? 'Create Expense Category' : 'Edit Expense Category'}
          </span>
          <button
            type="button"
            className="gg-modal-close"
            onClick={onClose}
            disabled={isPending}
          >
            <X size={18} />
          </button>
        </div>

        <form action={formAction}>
          <div className="gg-modal-body">
            <div className="gg-field">
              <label className="gg-label" htmlFor="ec-name">
                Name <span className="gg-req">*</span>
              </label>
              <input
                id="ec-name"
                name="name"
                className="gg-input"
                placeholder="Enter Name"
                defaultValue={name ?? ''}
                required
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>

          <div className="gg-modal-foot">
            <button
              type="submit"
              className="gg-btn gg-btn--primary"
              disabled={isPending}
            >
              {isPending
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Check size={16} /> Save</>}
            </button>
            <button
              type="button"
              className="gg-btn gg-btn--secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
