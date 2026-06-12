export type DiscountType = 'Fixed' | 'Percentage';
export type TaxType = 'Inclusive' | 'Exclusive';

export interface LineInput {
  netUnitCost: number;
  quantity: number;
  discountType: DiscountType;
  discount: number;
  taxType: TaxType;
  orderTax: number;   // per-line tax rate as a percentage
}

export interface OrderInput {
  lines: LineInput[];
  orderTaxPct: number;   // order-level tax percentage
  flatDiscount: number;  // order-level flat discount in currency
  shipping: number;      // flat shipping cost
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes the stored subtotal for a single purchase/sale line.
 *
 * Discount is applied first (on the gross = unitCost × qty), then:
 *   Exclusive: tax is added on top of the after-discount amount.
 *   Inclusive: tax is already baked into netUnitCost — nothing extra added.
 */
export function lineSubtotal(item: LineInput): number {
  const gross = item.netUnitCost * item.quantity;

  const discountAmt =
    item.discountType === 'Percentage'
      ? gross * (item.discount / 100)
      : item.discount;

  const afterDiscount = gross - discountAmt;

  const taxAmt =
    item.taxType === 'Exclusive'
      ? afterDiscount * (item.orderTax / 100)
      : 0;

  return round2(afterDiscount + taxAmt);
}

/**
 * Computes the order grand total from line subtotals plus order-level
 * tax, discount, and shipping.
 *
 * grandTotal = Σ(lineSubtotal) + orderTaxAmt − flatDiscount + shipping
 */
export function orderGrandTotal(order: OrderInput): number {
  const subtotalsSum = order.lines.reduce(
    (sum, line) => sum + lineSubtotal(line),
    0,
  );

  const orderTaxAmt = round2(subtotalsSum * (order.orderTaxPct / 100));

  return round2(subtotalsSum + orderTaxAmt - order.flatDiscount + order.shipping);
}
