'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, Pencil, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSaleReturn, updateSaleReturn } from './actions';
import type { ActionResult } from './actions';
import { lineSubtotal, orderGrandTotal } from '@/lib/pricing';

// ── Types ─────────────────────────────────────────────────────────────────────

type Unit = { id: number; name: string };

export type LineItem = {
  productId:    number;
  name:         string;
  code:         string;
  productUnit:  string;
  currentStock: number;   // live warehouse stock (display only)
  maxQty:       number;   // ceiling: original sale qty for this product
  netUnitPrice: number;
  quantity:     number;
  discountType: 'Fixed' | 'Percentage';
  discount:     number;
  taxType:      'Inclusive' | 'Exclusive';
  orderTax:     number;
  returnUnit:   string;
};

export type InitialValues = {
  id:            number;   // 0 = create, >0 = edit
  date:          string;
  warehouseId:   number;
  customerId:    number;
  saleId:        number | null;
  saleReference: string;
  status:        'Pending' | 'Received' | 'Completed';
  orderTaxPct:   number;
  flatDiscount:  number;
  shipping:      number;
  notes:         string;
  items:         LineItem[];
};

type Props = {
  units:   Unit[];
  initial: InitialValues;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SaleReturnForm({ units, initial }: Props) {
  const router = useRouter();
  const isEdit = initial.id > 0;

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    isEdit ? updateSaleReturn : createSaleReturn,
    {},
  );

  // ── Header state ──────────────────────────────────────────────────────────
  const [date,   setDate]   = useState(() => initial.date);
  const [status, setStatus] = useState<InitialValues['status']>(() => initial.status);

  // ── Line items ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<LineItem[]>(() => initial.items);

  // ── Order-level fields ────────────────────────────────────────────────────
  const [orderTaxPct,  setOrderTaxPct]  = useState(() => initial.orderTaxPct);
  const [flatDiscount, setFlatDiscount] = useState(() => initial.flatDiscount);
  const [shipping,     setShipping]     = useState(() => initial.shipping);
  const [notes,        setNotes]        = useState(() => initial.notes);

  // ── Per-line modal state ──────────────────────────────────────────────────
  const [modalItem,     setModalItem]     = useState<LineItem | null>(null);
  const [modalPrice,    setModalPrice]    = useState('');
  const [modalTaxType,  setModalTaxType]  = useState<'Inclusive' | 'Exclusive'>('Exclusive');
  const [modalOrderTax, setModalOrderTax] = useState('');
  const [modalDiscType, setModalDiscType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [modalDisc,     setModalDisc]     = useState('');
  const [modalUnit,     setModalUnit]     = useState('');

  // ── Toast / redirect ──────────────────────────────────────────────────────
  const returnId = initial.id;
  useEffect(() => {
    if (state.error)   toast.error(state.error);
    if (state.success) {
      router.push(
        returnId > 0
          ? `/sales-returns/${returnId}`
          : state.id ? `/sales-returns/${state.id}` : '/sales-returns',
      );
    }
  }, [state, router, returnId]);

  // ── Qty stepper — capped at original sale qty ─────────────────────────────
  function updateQty(productId: number, qty: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(i.maxQty, Math.max(1, qty)) }
          : i,
      ),
    );
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  // ── Per-line modal ────────────────────────────────────────────────────────
  function openModal(item: LineItem) {
    setModalItem(item);
    setModalPrice(item.netUnitPrice.toString());
    setModalTaxType(item.taxType);
    setModalOrderTax(item.orderTax.toString());
    setModalDiscType(item.discountType);
    setModalDisc(item.discount.toString());
    setModalUnit(item.returnUnit);
  }

  function saveModal() {
    if (!modalItem) return;
    const price = parseFloat(modalPrice)    || 0;
    const tax   = parseFloat(modalOrderTax) || 0;
    const disc  = parseFloat(modalDisc)     || 0;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === modalItem.productId
          ? {
              ...i,
              netUnitPrice: price,
              taxType:      modalTaxType,
              orderTax:     tax,
              discountType: modalDiscType,
              discount:     disc,
              returnUnit:   modalUnit || i.returnUnit,
            }
          : i,
      ),
    );
    setModalItem(null);
  }

  // ── Live totals ───────────────────────────────────────────────────────────
  const lineInputs = items.map((i) => ({
    netUnitCost:  i.netUnitPrice,
    quantity:     i.quantity,
    discountType: i.discountType,
    discount:     i.discount,
    taxType:      i.taxType,
    orderTax:     i.orderTax,
  }));

  const grand        = orderGrandTotal({ lines: lineInputs, orderTaxPct, flatDiscount, shipping });
  const subtotalsSum = lineInputs.reduce((s, l) => s + lineSubtotal(l), 0);
  const orderTaxAmt  = Math.round(subtotalsSum * orderTaxPct) / 100;

  // ── Serialise items for hidden field ──────────────────────────────────────
  const itemsJson = JSON.stringify(
    items.map(({ productId, quantity, discountType, discount, taxType, orderTax, netUnitPrice, returnUnit }) => ({
      productId, quantity, discountType, discount, taxType, orderTax, netUnitPrice, returnUnit,
    })),
  );

  const canSubmit = !isPending && items.length > 0;

  return (
    <>
      <form action={formAction}>
        <div className="gg-card gg-card-pad">

          {/* ── Hidden context fields ─────────────────────────────────────── */}
          {isEdit && <input type="hidden" name="returnId"    value={initial.id} />}
          {initial.saleId && <input type="hidden" name="saleId" value={initial.saleId} />}
          <input type="hidden" name="warehouseId" value={initial.warehouseId} />
          <input type="hidden" name="customerId"  value={initial.customerId} />
          <input type="hidden" name="items"       value={itemsJson} />
          <input type="hidden" name="grandTotal"  value={grand.toString()} />

          {/* ── Header: Date / Sale Reference / Status ─────────────────────── */}
          <div className="pur-top">
            <div className="gg-field">
              <label className="gg-label">Date <span className="gg-req">*</span></label>
              <input
                name="date"
                type="date"
                className="gg-input gg-num"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="gg-field">
              <label className="gg-label">Sale Reference <span className="gg-req">*</span></label>
              <input
                className="gg-input"
                value={initial.saleReference || '—'}
                disabled
                readOnly
              />
            </div>

            <div className="gg-field">
              <label className="gg-label">Status <span className="gg-req">*</span></label>
              <select
                name="status"
                className="gg-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as InitialValues['status'])}
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* ── Product List heading ───────────────────────────────────────── */}
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 600,
            color: 'var(--ink)', fontSize: 15, marginBottom: 'var(--sp-4)',
          }}>
            Product List
          </div>

          <label className="gg-label" style={{ display: 'block', marginBottom: 'var(--sp-3)' }}>
            Order items <span className="gg-req">*</span>
          </label>

          {/* ── Order items table ──────────────────────────────────────────── */}
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Net Unit Price</th>
                  <th>Stock</th>
                  <th>Qty</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, padding: 'var(--sp-8) var(--sp-5)' }}
                    >
                      All items removed. Add at least one item to save.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const gross   = item.netUnitPrice * item.quantity;
                    const discAmt = item.discountType === 'Percentage'
                      ? gross * item.discount / 100
                      : item.discount;
                    const taxAmt = item.taxType === 'Exclusive'
                      ? (gross - discAmt) * item.orderTax / 100
                      : 0;
                    const sub = lineSubtotal({
                      netUnitCost:  item.netUnitPrice,
                      quantity:     item.quantity,
                      discountType: item.discountType,
                      discount:     item.discount,
                      taxType:      item.taxType,
                      orderTax:     item.orderTax,
                    });
                    return (
                      <tr key={item.productId}>
                        <td>
                          <div className="prod-cell">
                            <span className="prod-code">{item.code}</span>
                            <span className="prod-name-row">
                              <span className="gg-chip-unit">{item.name}</span>
                              <button
                                type="button"
                                className="prod-edit"
                                title="Edit line details"
                                onClick={() => openModal(item)}
                              >
                                <Pencil size={14} />
                              </button>
                            </span>
                          </div>
                        </td>
                        <td className="gg-num">{fmt(item.netUnitPrice)}</td>
                        <td>
                          <span className="stock-chip gg-num">
                            {item.currentStock}&nbsp;{item.returnUnit}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div className="gg-stepper">
                              <button
                                type="button"
                                onClick={() => updateQty(item.productId, item.quantity - 1)}
                              >
                                <Minus size={15} />
                              </button>
                              <input
                                className="gg-num"
                                type="number"
                                min={1}
                                max={item.maxQty}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQty(item.productId, parseInt(e.target.value, 10) || 1)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => updateQty(item.productId, item.quantity + 1)}
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center' }}>
                              max&nbsp;{item.maxQty}
                            </span>
                          </div>
                        </td>
                        <td className="gg-num">{fmt(discAmt)}</td>
                        <td className="gg-num">{fmt(taxAmt)}</td>
                        <td className="gg-num gg-td-strong">{fmt(sub)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="gg-icon-btn"
                            style={{ border: 'none', color: 'var(--danger)' }}
                            title="Remove line"
                            onClick={() => removeItem(item.productId)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Totals box ─────────────────────────────────────────────────── */}
          <div className="pur-totals-box">
            <div className="pur-totals-row">
              <span className="ptr-lbl">Order Tax</span>
              <span className="ptr-val gg-num">
                {fmt(orderTaxAmt)}&nbsp;({orderTaxPct.toFixed(2)}&nbsp;%)
              </span>
            </div>
            <div className="pur-totals-row">
              <span className="ptr-lbl">Discount</span>
              <span className="ptr-val gg-num">{fmt(flatDiscount)}</span>
            </div>
            <div className="pur-totals-row">
              <span className="ptr-lbl">Shipping</span>
              <span className="ptr-val gg-num">{fmt(shipping)}</span>
            </div>
            <div className="pur-totals-row ptr-grand">
              <span className="ptr-lbl">Grand Total</span>
              <span className="ptr-val gg-num">{fmt(grand)}</span>
            </div>
          </div>

          {/* ── Order Tax / Discount / Shipping inputs ─────────────────────── */}
          <div className="pur-below">
            <div className="gg-field">
              <label className="gg-label">Order Tax</label>
              <div className="gg-input-group">
                <input
                  name="orderTaxPct"
                  className="gg-input gg-num"
                  type="number" min={0} step="0.01"
                  value={orderTaxPct}
                  onChange={(e) => setOrderTaxPct(parseFloat(e.target.value) || 0)}
                />
                <span className="gg-input-suffix">%</span>
              </div>
            </div>
            <div className="gg-field">
              <label className="gg-label">Discount</label>
              <div className="gg-input-group">
                <input
                  name="flatDiscount"
                  className="gg-input gg-num"
                  type="number" min={0} step="0.01"
                  value={flatDiscount}
                  onChange={(e) => setFlatDiscount(parseFloat(e.target.value) || 0)}
                />
                <span className="gg-input-suffix">$</span>
              </div>
            </div>
            <div className="gg-field">
              <label className="gg-label">Shipping</label>
              <div className="gg-input-group">
                <input
                  name="shipping"
                  className="gg-input gg-num"
                  type="number" min={0} step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                />
                <span className="gg-input-suffix">$</span>
              </div>
            </div>
          </div>

          {/* ── Notes ──────────────────────────────────────────────────────── */}
          <div className="gg-field" style={{ marginTop: 'var(--sp-5)' }}>
            <label className="gg-label">Notes</label>
            <textarea
              name="notes"
              className="gg-textarea"
              placeholder="Enter Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* ── Form actions ───────────────────────────────────────────────── */}
          <div className="gg-form-actions">
            <button
              type="submit"
              className="gg-btn gg-btn--primary"
              disabled={!canSubmit}
            >
              {isPending
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Check size={16} /> {isEdit ? 'Update' : 'Save'}</>}
            </button>
            <button
              type="button"
              className="gg-btn gg-btn--secondary"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </button>
          </div>

        </div>
      </form>

      {/* ── Per-line edit modal ────────────────────────────────────────────── */}
      {modalItem && (
        <div
          className="gg-overlay is-open"
          onClick={(e) => e.target === e.currentTarget && setModalItem(null)}
        >
          <div className="gg-modal">
            <div className="gg-modal-head">
              <span className="gg-card-title">{modalItem.name}</span>
              <button
                type="button"
                className="gg-modal-close"
                onClick={() => setModalItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="gg-modal-body">
              <div className="gg-field">
                <label className="gg-label">Product Price <span className="gg-req">*</span></label>
                <div className="gg-input-group">
                  <input
                    className="gg-input gg-num"
                    type="number" min={0} step="0.01"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(e.target.value)}
                  />
                  <span className="gg-input-suffix">$</span>
                </div>
              </div>

              <div className="gg-field">
                <label className="gg-label">Tax Type <span className="gg-req">*</span></label>
                <select
                  className="gg-select"
                  value={modalTaxType}
                  onChange={(e) => setModalTaxType(e.target.value as 'Inclusive' | 'Exclusive')}
                >
                  <option value="Exclusive">Exclusive</option>
                  <option value="Inclusive">Inclusive</option>
                </select>
              </div>

              <div className="gg-field">
                <label className="gg-label">Order Tax</label>
                <div className="gg-input-group">
                  <input
                    className="gg-input gg-num"
                    type="number" min={0} step="0.01"
                    value={modalOrderTax}
                    onChange={(e) => setModalOrderTax(e.target.value)}
                  />
                  <span className="gg-input-suffix">%</span>
                </div>
              </div>

              <div className="gg-field">
                <label className="gg-label">Discount Type <span className="gg-req">*</span></label>
                <select
                  className="gg-select"
                  value={modalDiscType}
                  onChange={(e) => setModalDiscType(e.target.value as 'Fixed' | 'Percentage')}
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Percentage">Percentage</option>
                </select>
              </div>

              <div className="gg-field">
                <label className="gg-label">Discount</label>
                <input
                  className="gg-input gg-num"
                  type="number" min={0} step="0.01"
                  value={modalDisc}
                  onChange={(e) => setModalDisc(e.target.value)}
                />
              </div>

              <div className="gg-field">
                <label className="gg-label">Sale Unit <span className="gg-req">*</span></label>
                <select
                  className="gg-select"
                  value={modalUnit}
                  onChange={(e) => setModalUnit(e.target.value)}
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="gg-modal-foot">
              <button
                type="button"
                className="gg-btn gg-btn--primary"
                onClick={saveModal}
              >
                <Check size={16} /> Save
              </button>
              <button
                type="button"
                className="gg-btn gg-btn--secondary"
                onClick={() => setModalItem(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
