'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Minus, Plus, Trash2, Pencil, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createSale, updateSale, searchProductsForSale } from './actions';
import type { ActionResult, SearchProductForSale } from './actions';
import { lineSubtotal, orderGrandTotal } from '@/lib/pricing';

// ── Types ─────────────────────────────────────────────────────────────────────

type Warehouse = { id: number; name: string };
type Customer  = { id: number; name: string };
type Unit      = { id: number; name: string };

export type LineItem = {
  productId:    number;
  name:         string;
  code:         string;
  productUnit:  string;
  currentStock: number;
  netUnitPrice: number;
  quantity:     number;
  discountType: 'Fixed' | 'Percentage';
  discount:     number;
  taxType:      'Inclusive' | 'Exclusive';
  orderTax:     number;
  saleUnit:     string;
};

export type InitialValues = {
  id:            number;
  date:          string;
  warehouseId:   number;
  customerId:    number;
  status:        'Received' | 'Ordered' | 'Pending';
  orderTaxPct:   number;
  flatDiscount:  number;
  shipping:      number;
  paymentType:   string;
  paidAmount:    number;
  notes:         string;
  items:         LineItem[];
};

type Props = {
  warehouses:        Warehouse[];
  customers:         Customer[];
  units:             Unit[];
  defaultCustomerId: number;
  initial?:          InitialValues;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function derivePaymentStatus(paid: number, grand: number): string {
  if (paid <= 0)        return 'Unpaid';
  if (paid >= grand)    return 'Paid';
  return 'Partial';
}

const PAY_STATUS_COLOURS: Record<string, { bg: string; fg: string }> = {
  Paid:    { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
  Partial: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
  Unpaid:  { bg: 'var(--danger-bg)',  fg: 'var(--danger)' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SaleForm({
  warehouses, customers, units, defaultCustomerId, initial,
}: Props) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    isEdit ? updateSale : createSale,
    {},
  );

  // ── Header state ──────────────────────────────────────────────────────────
  const [date,        setDate]       = useState(() => initial?.date ?? new Date().toISOString().slice(0, 10));
  const [warehouseId, setWarehouseId] = useState<number | ''>(() => initial?.warehouseId ?? '');
  const [customerId,  setCustomerId]  = useState<number | ''>(() => initial?.customerId ?? defaultCustomerId);

  // ── Line items ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<LineItem[]>(() => initial?.items ?? []);

  // ── Order-level fields ────────────────────────────────────────────────────
  const [orderTaxPct,  setOrderTaxPct]  = useState(() => initial?.orderTaxPct  ?? 0);
  const [flatDiscount, setFlatDiscount] = useState(() => initial?.flatDiscount ?? 0);
  const [shipping,     setShipping]     = useState(() => initial?.shipping     ?? 0);
  const [status,       setStatus]       = useState<'Received' | 'Ordered' | 'Pending'>(() => initial?.status ?? 'Received');
  const [paymentType,  setPaymentType]  = useState(() => initial?.paymentType ?? 'Cash');
  const [paidAmount,   setPaidAmount]   = useState(() => initial?.paidAmount ?? 0);
  const [notes,        setNotes]        = useState(() => initial?.notes ?? '');

  // ── Per-line modal state ──────────────────────────────────────────────────
  const [modalItem,     setModalItem]     = useState<LineItem | null>(null);
  const [modalPrice,    setModalPrice]    = useState('');
  const [modalTaxType,  setModalTaxType]  = useState<'Inclusive' | 'Exclusive'>('Exclusive');
  const [modalOrderTax, setModalOrderTax] = useState('');
  const [modalDiscType, setModalDiscType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [modalDisc,     setModalDisc]     = useState('');
  const [modalUnit,     setModalUnit]     = useState('');

  // ── Product search ────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<SearchProductForSale[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, startSearch]    = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Toast / redirect on action result ────────────────────────────────────
  const initialId = initial?.id;
  useEffect(() => {
    if (state.error)   toast.error(state.error);
    if (state.success) {
      router.push(initialId
        ? `/sales/${initialId}`
        : state.id ? `/sales/${state.id}` : '/sales',
      );
    }
  }, [state, router, initialId]);

  // ── Warehouse change — clear items (stock context resets) ─────────────────
  function handleWarehouseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setWarehouseId(e.target.value ? parseInt(e.target.value, 10) : '');
    setItems([]);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  // ── Product search (300ms debounce, warehouse-scoped) ─────────────────────
  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(() => {
      startSearch(async () => {
        const res = await searchProductsForSale(q.trim(), warehouseId || null);
        setResults(res);
        setShowResults(true);
      });
    }, 300);
  }

  // ── Add product from search result ────────────────────────────────────────
  function addItem(product: SearchProductForSale) {
    if (items.some((i) => i.productId === product.id)) return;
    setItems((prev) => [
      ...prev,
      {
        productId:    product.id,
        name:         product.name,
        code:         product.code,
        productUnit:  product.productUnit,
        currentStock: product.currentStock,
        netUnitPrice: product.price,
        quantity:     1,
        discountType: 'Fixed',
        discount:     0,
        taxType:      'Exclusive',
        orderTax:     0,
        saleUnit:     product.productUnit,
      },
    ]);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  // ── Qty stepper ───────────────────────────────────────────────────────────
  function updateQty(productId: number, qty: number) {
    setItems((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i),
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
    setModalUnit(item.saleUnit);
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
              saleUnit:     modalUnit || i.saleUnit,
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

  const clampedPaid   = Math.min(paidAmount, grand);
  const liveDue        = Math.max(0, grand - clampedPaid);
  const livePayStatus  = derivePaymentStatus(clampedPaid, grand);
  const psColour       = PAY_STATUS_COLOURS[livePayStatus] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-600)' };

  // ── Serialised items for hidden field ─────────────────────────────────────
  const itemsJson = JSON.stringify(
    items.map(({ productId, quantity, discountType, discount, taxType, orderTax, netUnitPrice, saleUnit }) => ({
      productId, quantity, discountType, discount, taxType, orderTax, netUnitPrice, saleUnit,
    })),
  );

  const canSubmit = !isPending && !!warehouseId && !!customerId && items.length > 0;

  return (
    <>
      <form action={formAction}>
        <div className="gg-card gg-card-pad">

          {/* Hidden fields */}
          {isEdit && <input type="hidden" name="saleId"     value={initial!.id} />}
          <input type="hidden" name="items"      value={itemsJson} />
          <input type="hidden" name="grandTotal" value={grand.toString()} />

          {/* ── Header: Date / Warehouse / Customer ──────────────────────── */}
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
              <label className="gg-label">Warehouse <span className="gg-req">*</span></label>
              <select
                name="warehouseId"
                className="gg-select"
                value={warehouseId}
                onChange={handleWarehouseChange}
                disabled={isEdit}
              >
                <option value="">Select warehouse…</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="gg-field">
              <label className="gg-label">Customer <span className="gg-req">*</span></label>
              <select
                name="customerId"
                className="gg-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value, 10) : '')}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Product search ─────────────────────────────────────────────── */}
          <div className="gg-field" style={{ marginBottom: 'var(--sp-6)', position: 'relative' }}>
            <label className="gg-label">Product</label>
            <div className="gg-input-icon">
              {isSearching
                ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite', color: 'var(--gray-400)' }} />
                : <Search size={17} />}
              <input
                className="gg-input"
                placeholder={
                  !warehouseId
                    ? 'Select a warehouse first…'
                    : 'Search Product by Code or Name'
                }
                disabled={!warehouseId}
                value={query}
                onChange={handleQueryChange}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                onFocus={() => results.length > 0 && setShowResults(true)}
                autoComplete="off"
              />
            </div>

            {showResults && (
              <div className="adj-search-results">
                {results.length === 0
                  ? <p className="adj-search-empty">No products with stock in this warehouse.</p>
                  : results.map((p) => {
                      const already = items.some((i) => i.productId === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="adj-search-item"
                          onMouseDown={() => addItem(p)}
                          disabled={already}
                        >
                          <span className="adj-search-name">{p.name}</span>
                          <span className="gg-chip-code">{p.code}</span>
                          <span className="stock-chip">{p.currentStock}&nbsp;{p.productUnit}</span>
                          {already && <Check size={14} style={{ color: 'var(--success-fg)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
              </div>
            )}
          </div>

          {/* ── Order items table ──────────────────────────────────────────── */}
          <label className="gg-label" style={{ display: 'block', marginBottom: 'var(--sp-3)' }}>
            Order items <span className="gg-req">*</span>
          </label>

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
                      {warehouseId
                        ? 'Use the search above to add products.'
                        : 'Select a warehouse to search for products.'}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const gross   = item.netUnitPrice * item.quantity;
                    const discAmt = item.discountType === 'Percentage'
                      ? gross * item.discount / 100
                      : item.discount;
                    const taxAmt  = item.taxType === 'Exclusive'
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
                            {item.currentStock}&nbsp;{item.saleUnit}
                          </span>
                        </td>
                        <td>
                          <div className="gg-stepper">
                            <button type="button" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                              <Minus size={15} />
                            </button>
                            <input
                              className="gg-num"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateQty(item.productId, parseInt(e.target.value, 10) || 1)}
                            />
                            <button type="button" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                              <Plus size={15} />
                            </button>
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
                            title="Remove"
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
              <span className="ptr-val gg-num">{fmt(orderTaxAmt)} ({orderTaxPct.toFixed(2)}&nbsp;%)</span>
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

          {/* ── Status / Payment Type (2-col) ──────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--sp-6)',
              marginTop: 'var(--sp-8)',
            }}
          >
            <div className="gg-field">
              <label className="gg-label">Status <span className="gg-req">*</span></label>
              <select
                name="status"
                className="gg-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="Received">Received</option>
                <option value="Pending">Pending</option>
                <option value="Ordered">Ordered</option>
              </select>
            </div>

            <div className="gg-field">
              <label className="gg-label">Payment Type <span className="gg-req">*</span></label>
              <select
                name="paymentType"
                className="gg-select"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* ── Paid Amount + live Payment Status (2-col) ─────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--sp-6)',
              marginTop: 'var(--sp-6)',
            }}
          >
            <div className="gg-field">
              <label className="gg-label">Paid Amount</label>
              <div className="gg-input-group">
                <input
                  name="paidAmount"
                  className="gg-input gg-num"
                  type="number" min={0} step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                />
                <span className="gg-input-suffix">$</span>
              </div>
            </div>

            <div className="gg-field">
              <label className="gg-label">Payment Status</label>
              <div style={{ display: 'flex', alignItems: 'center', height: 42, gap: 'var(--sp-3)' }}>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    height: 28, padding: '0 14px',
                    borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 600,
                    background: psColour.bg, color: psColour.fg,
                  }}
                >
                  {livePayStatus}
                </span>
                {clampedPaid > 0 && (
                  <span className="gg-muted" style={{ fontSize: 13 }}>
                    Due: {fmt(liveDue)}
                  </span>
                )}
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
              <button type="button" className="gg-modal-close" onClick={() => setModalItem(null)}>
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
              <button type="button" className="gg-btn gg-btn--primary" onClick={saveModal}>
                <Check size={16} /> Save
              </button>
              <button type="button" className="gg-btn gg-btn--secondary" onClick={() => setModalItem(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
