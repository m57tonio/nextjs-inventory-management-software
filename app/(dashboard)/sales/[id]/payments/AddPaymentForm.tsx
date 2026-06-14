'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { addSalePayment } from '../../actions';
import type { ActionResult } from '../../actions';

const PAY_TYPES = ['Cash', 'Card', 'Cheque', 'Bank Transfer'] as const;

const INIT: ActionResult = {};

export default function AddPaymentForm({
  saleId,
  todayIso,
}: {
  saleId:   number;
  todayIso: string;
}) {
  const [state, action, isPending] = useActionState(addSalePayment, INIT);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error)   toast.error(state.error);
    if (state.success) {
      toast.success('Payment recorded.');
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="gg-card gg-card-pad" style={{ marginTop: 'var(--sp-6)' }}>
      <h2 className="gg-card-title" style={{ marginBottom: 'var(--sp-5)' }}>Add Payment</h2>

      <form ref={formRef} action={action}>
        <input type="hidden" name="saleId" value={saleId} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 'var(--sp-4)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          {/* Date */}
          <div className="gg-field">
            <label className="gg-label">Date <span className="gg-req">*</span></label>
            <input
              type="date"
              name="date"
              defaultValue={todayIso}
              required
              className="gg-input"
            />
          </div>

          {/* Amount */}
          <div className="gg-field">
            <label className="gg-label">Amount <span className="gg-req">*</span></label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
              className="gg-input gg-num"
            />
          </div>

          {/* Payment Type */}
          <div className="gg-field">
            <label className="gg-label">Payment Type <span className="gg-req">*</span></label>
            <select name="paymentType" className="gg-select" defaultValue="Cash">
              {PAY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="gg-field">
            <label className="gg-label">Notes</label>
            <input
              type="text"
              name="notes"
              placeholder="Optional note"
              className="gg-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="gg-btn gg-btn--primary"
            disabled={isPending}
          >
            {isPending
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Plus size={16} /> Add Payment</>}
          </button>
        </div>
      </form>
    </div>
  );
}
