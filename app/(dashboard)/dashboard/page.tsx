import ChartsSection from '@/components/dashboard/ChartsSection';
import {
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Banknote,
  MinusCircle,
} from 'lucide-react';

const KPI_TILES = [
  { color: 'gold',    icon: <ShoppingCart />,  value: '$ 0.00', label: 'Sales' },
  { color: 'emerald', icon: <ShoppingBag />,   value: '$ 0.00', label: 'Purchases' },
  { color: 'blue',    icon: <ArrowRight />,    value: '$ 0.00', label: 'Sales Returns' },
  { color: 'orange',  icon: <ArrowLeft />,     value: '$ 0.00', label: 'Purchases Returns' },
  { color: 'violet',  icon: <DollarSign />,    value: '$ 0.00', label: 'Today Total Sales' },
  { color: 'rose',    icon: <Banknote />,      value: '$ 0.00', label: 'Today Total Received (Sales)' },
  { color: 'cyan',    icon: <ShoppingCart />,  value: '$ 0.00', label: 'Today Total Purchases' },
  { color: 'red',     icon: <MinusCircle />,   value: '$ 0.00', label: 'Today Total Expense' },
];

const RECENT_SALES = [
  { ref: 'SA_11149', customer: 'direct-customer', total: '71,800.00', paid: '71,800.00', due: '0.00' },
  { ref: 'SA_11148', customer: 'direct-customer', total: '31,920.00', paid: '31,920.00', due: '0.00' },
  { ref: 'SA_11147', customer: 'direct-customer', total: '7,980.00',  paid: '7,980.00',  due: '0.00' },
  { ref: 'SA_11146', customer: 'direct-customer', total: '11,970.00', paid: '11,970.00', due: '0.00' },
  { ref: 'SA_11145', customer: 'direct-customer', total: '7,980.00',  paid: '7,980.00',  due: '0.00' },
];

const STOCK_ALERTS = [
  { code: '002', product: 'ipl laser hair removal',   warehouse: 'Office', qty: '0', alert: '3' },
  { code: '001', product: 'FACE FAT AND DOUBLE CHIN', warehouse: 'Office', qty: '2', alert: '3' },
];

export default function DashboardPage() {
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

      {/* Charts — client component (dynamic imports with ssr:false live there) */}
      <ChartsSection />

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
                {RECENT_SALES.map((s) => (
                  <tr key={s.ref}>
                    <td><span className="gg-chip-code">{s.ref}</span></td>
                    <td>{s.customer}</td>
                    <td><span className="gg-badge gg-badge--success">Received</span></td>
                    <td className="gg-num gg-td-strong">$ {s.total}</td>
                    <td className="gg-num">$ {s.paid}</td>
                    <td className="gg-num">$ {s.due}</td>
                    <td><span className="gg-badge gg-badge--success">Paid</span></td>
                  </tr>
                ))}
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
                {STOCK_ALERTS.map((s) => (
                  <tr key={s.code}>
                    <td className="gg-num">{s.code}</td>
                    <td className="gg-td-strong">{s.product}</td>
                    <td>{s.warehouse}</td>
                    <td>
                      <span className="qty-pill gg-num">{s.qty}</span>{' '}
                      <span className="gg-chip-unit">piece</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="alert-pill gg-num">{s.alert}</span>{' '}
                      <span className="gg-chip-unit">piece</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
