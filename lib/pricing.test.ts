import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lineSubtotal, orderGrandTotal } from './pricing';

// ── lineSubtotal ─────────────────────────────────────────────────────────────

describe('lineSubtotal', () => {
  it('base: no discount, no tax', () => {
    assert.equal(
      lineSubtotal({ netUnitCost: 10, quantity: 3, discountType: 'Fixed', discount: 0, taxType: 'Exclusive', orderTax: 0 }),
      30,
    );
  });

  it('Exclusive tax is added on top of the after-discount amount', () => {
    // gross 100×2=200, no discount, 10% exclusive → 200+20 = 220
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Fixed', discount: 0, taxType: 'Exclusive', orderTax: 10 }),
      220,
    );
  });

  it('Inclusive tax does NOT add extra (tax already in unit cost)', () => {
    // gross 100×2=200, no discount, 10% inclusive → still 200
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Fixed', discount: 0, taxType: 'Inclusive', orderTax: 10 }),
      200,
    );
  });

  it('Fixed discount is subtracted before Exclusive tax is applied', () => {
    // gross 200, fixed discount 20 → 180, 10% exclusive → 180+18 = 198
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Fixed', discount: 20, taxType: 'Exclusive', orderTax: 10 }),
      198,
    );
  });

  it('Percentage discount is computed on the gross amount', () => {
    // gross 200, 10% disc = 20 off → 180, no tax → 180
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Percentage', discount: 10, taxType: 'Exclusive', orderTax: 0 }),
      180,
    );
  });

  it('Percentage discount + Exclusive tax', () => {
    // gross 200, 10% disc = 20 off → 180, 5% exclusive = 9 → 189
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Percentage', discount: 10, taxType: 'Exclusive', orderTax: 5 }),
      189,
    );
  });

  it('Percentage discount + Inclusive tax (no extra tax added)', () => {
    // gross 200, 10% disc = 20 off → 180, inclusive → 180
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Percentage', discount: 10, taxType: 'Inclusive', orderTax: 5 }),
      180,
    );
  });

  it('Fixed discount + Inclusive tax (no extra tax)', () => {
    // gross 200, fixed 20 off → 180, inclusive → 180
    assert.equal(
      lineSubtotal({ netUnitCost: 100, quantity: 2, discountType: 'Fixed', discount: 20, taxType: 'Inclusive', orderTax: 10 }),
      180,
    );
  });

  it('result is rounded to 2 decimal places', () => {
    // (10/3) × 1 ≈ 3.3333…  → rounds to 3.33
    assert.equal(
      lineSubtotal({ netUnitCost: 10 / 3, quantity: 1, discountType: 'Fixed', discount: 0, taxType: 'Exclusive', orderTax: 0 }),
      3.33,
    );
  });

  it('zero quantity yields zero subtotal', () => {
    assert.equal(
      lineSubtotal({ netUnitCost: 500, quantity: 0, discountType: 'Fixed', discount: 0, taxType: 'Exclusive', orderTax: 15 }),
      0,
    );
  });
});

// ── orderGrandTotal ──────────────────────────────────────────────────────────

const noTaxLine = {
  netUnitCost: 100,
  quantity: 2,
  discountType: 'Fixed' as const,
  discount: 0,
  taxType: 'Exclusive' as const,
  orderTax: 0,
}; // lineSubtotal = 200

describe('orderGrandTotal', () => {
  it('sums line subtotals', () => {
    assert.equal(
      orderGrandTotal({ lines: [noTaxLine, noTaxLine], orderTaxPct: 0, flatDiscount: 0, shipping: 0 }),
      400,
    );
  });

  it('applies order-level tax percentage to the subtotals sum', () => {
    // 200 subtotals, 10% order tax = 20 → grand 220
    assert.equal(
      orderGrandTotal({ lines: [noTaxLine], orderTaxPct: 10, flatDiscount: 0, shipping: 0 }),
      220,
    );
  });

  it('subtracts flat order discount', () => {
    // 200 subtotals, no tax, 50 discount → 150
    assert.equal(
      orderGrandTotal({ lines: [noTaxLine], orderTaxPct: 0, flatDiscount: 50, shipping: 0 }),
      150,
    );
  });

  it('adds shipping', () => {
    // 200 subtotals, no tax, no discount, 25 shipping → 225
    assert.equal(
      orderGrandTotal({ lines: [noTaxLine], orderTaxPct: 0, flatDiscount: 0, shipping: 25 }),
      225,
    );
  });

  it('full combination: orderTax + flatDiscount + shipping', () => {
    // 200 subtotals, 10% order tax = 20 → 220, -50 discount → 170, +15 shipping → 185
    assert.equal(
      orderGrandTotal({ lines: [noTaxLine], orderTaxPct: 10, flatDiscount: 50, shipping: 15 }),
      185,
    );
  });

  it('empty lines: grand total = orderTax(0) + shipping', () => {
    assert.equal(
      orderGrandTotal({ lines: [], orderTaxPct: 10, flatDiscount: 0, shipping: 5 }),
      5,
    );
  });

  it('matches design example: $493 + $1,110 = $1,603 (no order-level adjustments)', () => {
    const line1 = { netUnitCost: 493, quantity: 1, discountType: 'Fixed' as const, discount: 0, taxType: 'Exclusive' as const, orderTax: 0 };
    const line2 = { netUnitCost: 1110, quantity: 1, discountType: 'Fixed' as const, discount: 0, taxType: 'Exclusive' as const, orderTax: 0 };
    assert.equal(
      orderGrandTotal({ lines: [line1, line2], orderTaxPct: 0, flatDiscount: 0, shipping: 0 }),
      1603,
    );
  });

  it('line-level Exclusive tax contributes to subtotals before order tax is computed', () => {
    // 100×1, 10% exclusive line tax → lineSubtotal 110
    // order: 10% orderTax on 110 → +11 → grand 121
    const line = { netUnitCost: 100, quantity: 1, discountType: 'Fixed' as const, discount: 0, taxType: 'Exclusive' as const, orderTax: 10 };
    assert.equal(
      orderGrandTotal({ lines: [line], orderTaxPct: 10, flatDiscount: 0, shipping: 0 }),
      121,
    );
  });

  it('grand total rounded to 2 decimal places', () => {
    // 3 lines of (10/3 × 1) = 3.33 each = 9.99, 10% orderTax = 1 → 10.99
    const line = { netUnitCost: 10 / 3, quantity: 1, discountType: 'Fixed' as const, discount: 0, taxType: 'Exclusive' as const, orderTax: 0 };
    assert.equal(
      orderGrandTotal({ lines: [line, line, line], orderTaxPct: 10, flatDiscount: 0, shipping: 0 }),
      10.99,
    );
  });
});
