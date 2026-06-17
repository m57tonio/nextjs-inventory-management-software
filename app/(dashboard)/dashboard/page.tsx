import { ShoppingCart, ShoppingBag, ArrowRight, ArrowLeft, DollarSign, Banknote, MinusCircle, ShieldOff } from 'lucide-react';
import { can } from '@/lib/can';
import { db } from '@/lib/db';
import ChartsSection from '@/components/dashboard/ChartsSection';

function fmtMoney(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_COLOURS: Record<string, { bg: string; fg: string }> = {
  Received: { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
  Ordered:  { bg: 'var(--info-bg)',    fg: 'var(--info)'       },
  Pending:  { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
};

const PAYMENT_COLOURS: Record<string, { bg: string; fg: string }> = {
  Paid:    { bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
  Partial: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)' },
  Unpaid:  { bg: 'var(--danger-bg)',  fg: 'var(--danger)'     },
};

const BADGE_STYLE = {
  display: 'inline-flex', alignItems: 'center',
  height: 24, padding: '0 10px',
  borderRadius: 'var(--r-sm)', fontSize: 12.5, fontWeight: 600,
} as const;

function SaleStatusBadge({ status }: { status: string }) {
  const c = STATUS_COLOURS[status] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-600)' };
  return <span style={{ ...BADGE_STYLE, background: c.bg, color: c.fg }}>{status}</span>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const c = PAYMENT_COLOURS[status] ?? { bg: 'var(--gray-100)', fg: 'var(--gray-600)' };
  return <span style={{ ...BADGE_STYLE, background: c.bg, color: c.fg }}>{status}</span>;
}

export default async function DashboardPage() {
  const denied = await can('Manage Dashboard');
  if (denied) {
    return (
      <div className="gg-empty-state" style={{ minHeight: 320 }}>
        <ShieldOff size={42} style={{ color: 'var(--gray-300)' }} />
        <p>{denied}</p>
      </div>
    );
  }

  // Date ranges — all UTC midnight, matching how sale/purchase date fields are stored.
  const now          = new Date();
  const todayStart   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayEnd     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const sevenDaysAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
  const yearStart    = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const monthStart   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    salesAgg,
    purchasesAgg,
    saleReturnsAgg,
    purchaseReturnsAgg,
    todaySalesAgg,
    todayReceivedAgg,
    todayPurchasesAgg,
    todayExpenseAgg,
    weekSalesRows,
    weekPurchasesRows,
    yearTopRows,
    monthTopRows,
    topCustomerRows,
    recentSales,
  ] = await Promise.all([
    // 1. All-time sales (Received only)
    db.sale.aggregate({
      where: { deletedAt: null, status: 'Received' },
      _sum:  { grandTotal: true },
    }),
    // 2. All-time purchases (Received only)
    db.purchase.aggregate({
      where: { deletedAt: null, status: 'Received' },
      _sum:  { grandTotal: true },
    }),
    // 3. All-time sale returns (Received or Completed)
    db.saleReturn.aggregate({
      where: { deletedAt: null, status: { in: ['Received', 'Completed'] } },
      _sum:  { grandTotal: true },
    }),
    // 4. All-time purchase returns (Received only)
    db.purchaseReturn.aggregate({
      where: { deletedAt: null, status: 'Received' },
      _sum:  { grandTotal: true },
    }),
    // 5. Today's sales grand totals (Received only)
    db.sale.aggregate({
      where: { deletedAt: null, status: 'Received', date: { gte: todayStart, lte: todayEnd } },
      _sum:  { grandTotal: true },
    }),
    // 6. Today's payments actually collected (SalePayment rows dated today)
    db.salePayment.aggregate({
      where: { date: { gte: todayStart, lte: todayEnd }, sale: { deletedAt: null } },
      _sum:  { amount: true },
    }),
    // 7. Today's purchases grand totals (Received only)
    db.purchase.aggregate({
      where: { deletedAt: null, status: 'Received', date: { gte: todayStart, lte: todayEnd } },
      _sum:  { grandTotal: true },
    }),
    // 8. Today's expenses
    db.expense.aggregate({
      where: { deletedAt: null, date: { gte: todayStart, lte: todayEnd } },
      _sum:  { amount: true },
    }),
    // 9. Last-7-days sales grouped by day
    db.sale.groupBy({
      by:    ['date'],
      where: { deletedAt: null, status: 'Received', date: { gte: sevenDaysAgo, lte: todayEnd } },
      _sum:  { grandTotal: true },
    }),
    // 10. Last-7-days purchases grouped by day
    db.purchase.groupBy({
      by:    ['date'],
      where: { deletedAt: null, status: 'Received', date: { gte: sevenDaysAgo, lte: todayEnd } },
      _sum:  { grandTotal: true },
    }),
    // 11. Year-to-date top products by revenue (for doughnut)
    db.saleItem.groupBy({
      by:      ['productId'],
      where:   { sale: { deletedAt: null, status: 'Received', date: { gte: yearStart, lte: todayEnd } } },
      _sum:    { quantity: true, subtotal: true },
      orderBy: [{ _sum: { subtotal: 'desc' } }],
      take:    8,
    }),
    // 12. Month-to-date top products by revenue (for table)
    db.saleItem.groupBy({
      by:      ['productId'],
      where:   { sale: { deletedAt: null, status: 'Received', date: { gte: monthStart, lte: todayEnd } } },
      _sum:    { quantity: true, subtotal: true },
      orderBy: [{ _sum: { subtotal: 'desc' } }],
      take:    8,
    }),
    // 13. Month-to-date top 5 customers by sales grand total (for pie)
    db.sale.groupBy({
      by:      ['customerId'],
      where:   { deletedAt: null, status: 'Received', date: { gte: monthStart, lte: todayEnd } },
      _sum:    { grandTotal: true },
      orderBy: [{ _sum: { grandTotal: 'desc' } }],
      take:    5,
    }),
    // 14. 5 most recent sales for the Recent Sales table
    db.sale.findMany({
      where:   { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select: {
        id:            true,
        reference:     true,
        status:        true,
        grandTotal:    true,
        paid:          true,
        due:           true,
        paymentStatus: true,
        customer:      { select: { name: true } },
      },
    }),
  ]);

  // Build ordered label array: [day-6, day-5, ..., today]
  const weekLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    weekLabels.push(d.toISOString().slice(0, 10));
  }

  const salesByDay: Record<string, number> = {};
  for (const row of weekSalesRows) {
    salesByDay[row.date.toISOString().slice(0, 10)] = Number(row._sum.grandTotal ?? 0);
  }
  const purchasesByDay: Record<string, number> = {};
  for (const row of weekPurchasesRows) {
    purchasesByDay[row.date.toISOString().slice(0, 10)] = Number(row._sum.grandTotal ?? 0);
  }

  const weekSales     = weekLabels.map((d) => salesByDay[d]     ?? 0);
  const weekPurchases = weekLabels.map((d) => purchasesByDay[d] ?? 0);

  // Secondary lookups — run in parallel after the main Promise.all.
  const allProductIds  = [...new Set([...yearTopRows.map((r) => r.productId), ...monthTopRows.map((r) => r.productId)])];
  const allCustomerIds = [...new Set(topCustomerRows.map((r) => r.customerId))];

  type StockAlertRow = {
    code:          string;
    productName:   string;
    warehouseName: string;
    quantity:      number;
    stockAlert:    number;
    productUnit:   string;
  };

  const [productRows, customerRows, stockAlerts] = await Promise.all([
    allProductIds.length > 0
      ? db.product.findMany({ where: { id: { in: allProductIds } },  select: { id: true, name: true } })
      : Promise.resolve([] as { id: number; name: string }[]),
    allCustomerIds.length > 0
      ? db.customer.findMany({ where: { id: { in: allCustomerIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: number; name: string }[]),
    // Stock alert: ProductStock rows where quantity <= product.stockAlert.
    // Cross-field comparison requires raw SQL — Prisma's type-safe API can't express it.
    db.$queryRaw<StockAlertRow[]>`
      SELECT
        p.code,
        p.name        AS productName,
        w.name        AS warehouseName,
        ps.quantity,
        p.stockAlert,
        p.productUnit
      FROM ProductStock ps
      JOIN Product   p ON p.id = ps.productId
      JOIN Warehouse w ON w.id = ps.warehouseId
      WHERE p.deletedAt  IS NULL
        AND w.deletedAt  IS NULL
        AND p.stockAlert IS NOT NULL
        AND ps.quantity  <= p.stockAlert
      ORDER BY ps.quantity ASC, p.name ASC
    `,
  ]);

  const nameMap: Record<number, string> = {};
  for (const p of productRows) nameMap[p.id] = p.name;

  const customerNameMap: Record<number, string> = {};
  for (const c of customerRows) customerNameMap[c.id] = c.name;

  const yearTopProducts = yearTopRows.map((r) => ({
    name:    nameMap[r.productId] ?? 'Unknown',
    revenue: Number(r._sum.subtotal ?? 0),
  }));
  const monthTopProducts = monthTopRows.map((r) => ({
    name:     nameMap[r.productId] ?? 'Unknown',
    quantity: r._sum.quantity      ?? 0,
    revenue:  Number(r._sum.subtotal ?? 0),
  }));

  const topCustomers = topCustomerRows.map((r) => ({
    name:  customerNameMap[r.customerId] ?? 'Unknown',
    total: Number(r._sum.grandTotal ?? 0),
  }));

  const monthLabel = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const yearLabel = String(now.getUTCFullYear());

  const KPI_TILES = [
    { color: 'gold',    icon: <ShoppingCart />, value: fmtMoney(Number(salesAgg._sum.grandTotal           ?? 0)), label: 'Sales' },
    { color: 'emerald', icon: <ShoppingBag />,  value: fmtMoney(Number(purchasesAgg._sum.grandTotal       ?? 0)), label: 'Purchases' },
    { color: 'blue',    icon: <ArrowRight />,   value: fmtMoney(Number(saleReturnsAgg._sum.grandTotal     ?? 0)), label: 'Sales Returns' },
    { color: 'orange',  icon: <ArrowLeft />,    value: fmtMoney(Number(purchaseReturnsAgg._sum.grandTotal ?? 0)), label: 'Purchases Returns' },
    { color: 'violet',  icon: <DollarSign />,   value: fmtMoney(Number(todaySalesAgg._sum.grandTotal      ?? 0)), label: 'Today Total Sales' },
    { color: 'rose',    icon: <Banknote />,     value: fmtMoney(Number(todayReceivedAgg._sum.amount       ?? 0)), label: 'Today Total Received (Sales)' },
    { color: 'cyan',    icon: <ShoppingCart />, value: fmtMoney(Number(todayPurchasesAgg._sum.grandTotal  ?? 0)), label: 'Today Total Purchases' },
    { color: 'red',     icon: <MinusCircle />,  value: fmtMoney(Number(todayExpenseAgg._sum.amount        ?? 0)), label: 'Today Total Expense' },
  ];

  return (
    <div className="dash-section-gap">

      {/* KPI tiles */}
      <div className="gg-kpi-grid">
        {KPI_TILES.map((t) => (
          <div key={t.label} className={`gg-kpi gg-kpi--${t.color}`}>
            <div className="gg-kpi-ico">{t.icon}</div>
            <div className="gg-kpi-body">
              <span className="gg-kpi-value gg-num">{t.value}</span>
              <span className="gg-kpi-label">{t.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <ChartsSection
        weekLabels={weekLabels}
        weekSales={weekSales}
        weekPurchases={weekPurchases}
        yearTopProducts={yearTopProducts}
        monthTopProducts={monthTopProducts}
        topCustomers={topCustomers}
        monthLabel={monthLabel}
        yearLabel={yearLabel}
      />

      {/* Recent Sales */}
      <div className="gg-card">
        <div className="gg-card-head">
          <span className="gg-card-title">Recent Sales</span>
        </div>
        <div className="gg-card-pad" style={{ paddingTop: 0 }}>
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '24px 0' }}>
                      No sales yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((s) => (
                    <tr key={s.id}>
                      <td><span className="gg-chip-code gg-num">{s.reference}</span></td>
                      <td className="gg-td-strong">{s.customer.name}</td>
                      <td><SaleStatusBadge status={s.status} /></td>
                      <td className="gg-num gg-td-strong">{fmtMoney(Number(s.grandTotal))}</td>
                      <td className="gg-num">{fmtMoney(Number(s.paid))}</td>
                      <td className="gg-num">{fmtMoney(Number(s.due))}</td>
                      <td><PaymentStatusBadge status={s.paymentStatus} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Alert */}
      <div className="gg-card">
        <div className="gg-card-head">
          <span className="gg-card-title">Stock Alert</span>
        </div>
        <div className="gg-card-pad" style={{ paddingTop: 0 }}>
          <div className="gg-table-wrap">
            <table className="gg-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Alert Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '24px 0' }}>
                      No stock alerts.
                    </td>
                  </tr>
                ) : (
                  stockAlerts.map((s, i) => (
                    <tr key={i}>
                      <td className="gg-num">{s.code}</td>
                      <td className="gg-td-strong">{s.productName}</td>
                      <td>{s.warehouseName}</td>
                      <td>
                        <span className="qty-pill gg-num">{Number(s.quantity)}</span>{' '}
                        <span className="gg-chip-unit">{s.productUnit}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="alert-pill gg-num">{Number(s.stockAlert)}</span>{' '}
                        <span className="gg-chip-unit">{s.productUnit}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

       

    </div>
  );
}
