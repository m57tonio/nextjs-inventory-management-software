'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteBrand } from './actions';
import type { BrandRow } from './BrandsClient';

type Props = {
  brand:   BrandRow;
  onClose: () => void;
};

export default function DeleteBrandModal({ brand, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isPending]);

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.success) {
        onClose();
        toast.success(`"${brand.name}" has been deleted.`);
        router.refresh();
      } else {
        onClose();
        toast.error(result.error ?? 'Failed to delete brand.');
      }
    });
  }

  return (
    <div
      className="gg-overlay is-open"
      onClick={(e) => e.target === e.currentTarget && !isPending && onClose()}
    >
      <div className="gg-modal">
        <div className="gg-modal-head">
          <span className="gg-card-title">Delete Brand</span>
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
            <AlertTriangle
              size={20}
              style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <p style={{ margin: 0, color: 'var(--ink)', fontWeight: 500 }}>
                Are you sure you want to delete <strong>{brand.name}</strong>?
              </p>
              <p style={{ margin: '6px 0 0', color: 'var(--gray-500)', fontSize: 13 }}>
                The brand will be soft-deleted. If it is referenced by any
                products the deletion will be blocked.
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
            {isPending ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Deleting…</>
            ) : (
              <><Trash2 size={16} /> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
