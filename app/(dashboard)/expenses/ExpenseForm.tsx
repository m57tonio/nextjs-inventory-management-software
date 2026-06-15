'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ExpenseState } from './actions';

export type ExpenseInitial = {
  date:              string; // YYYY-MM-DD
  title:             string;
  warehouseId:       number | '';
  expenseCategoryId: number | '';
  amount:            string;
  details:           string;
};

export type DropdownOption = { id: number; name: string };

type Action = (prev: ExpenseState, formData: FormData) => Promise<ExpenseState>;

type Props = {
  action:     Action;
  mode:       'create' | 'edit';
  initial?:   ExpenseInitial;
  warehouses: DropdownOption[];
  categories: DropdownOption[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({ action, mode, initial, warehouses, categories }: Props) {
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      {/* ── page header ── */}
      <div className="page-head">
        <h1 className="gg-page-title">
          {mode === 'create' ? 'Create Expense' : 'Edit Expense'}
        </h1>
        <Link href="/expenses" className="gg-btn gg-btn--secondary">
          <ArrowLeft size={17} /> Back
        </Link>
      </div>

      <div className="gg-card gg-card-pad">
        <div className="exp-grid">

          {/* Date */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-date">
              Date <span className="gg-req">*</span>
            </label>
            <div className="date-field">
              <input
                id="ex-date"
                name="date"
                type="date"
                className="gg-input gg-num"
                defaultValue={initial?.date ?? todayISO()}
                required
                disabled={isPending}
              />
              <Calendar />
            </div>
          </div>

          {/* Expense Title */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-title">
              Expense Title <span className="gg-req">*</span>
            </label>
            <input
              id="ex-title"
              name="title"
              className="gg-input"
              placeholder="Enter Expense Title"
              defaultValue={initial?.title ?? ''}
              required
              disabled={isPending}
            />
          </div>

          {/* Warehouse */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-warehouse">
              Warehouse <span className="gg-req">*</span>
            </label>
            <select
              id="ex-warehouse"
              name="warehouseId"
              className="gg-select"
              defaultValue={initial?.warehouseId ?? ''}
              required
              disabled={isPending}
            >
              <option value="">Choose Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Expense Category */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-category">
              Expense Category <span className="gg-req">*</span>
            </label>
            <select
              id="ex-category"
              name="expenseCategoryId"
              className="gg-select"
              defaultValue={initial?.expenseCategoryId ?? ''}
              required
              disabled={isPending}
            >
              <option value="">Choose Expense Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-amount">
              Amount <span className="gg-req">*</span>
            </label>
            <div className="gg-input-group">
              <input
                id="ex-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                className="gg-input gg-num"
                placeholder="Enter Amount"
                defaultValue={initial?.amount ?? ''}
                required
                disabled={isPending}
              />
              <span className="gg-input-suffix">$</span>
            </div>
          </div>

          {/* Details */}
          <div className="gg-field">
            <label className="gg-label" htmlFor="ex-details">Details</label>
            <textarea
              id="ex-details"
              name="details"
              className="gg-textarea"
              placeholder="Enter Details"
              defaultValue={initial?.details ?? ''}
              disabled={isPending}
            />
          </div>

        </div>

        {/* ── actions ── */}
        <div className="gg-form-actions">
          <button className="gg-btn gg-btn--primary" type="submit" disabled={isPending}>
            {isPending
              ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Check size={17} /> Save</>}
          </button>
          <Link href="/expenses" className="gg-btn gg-btn--secondary">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
