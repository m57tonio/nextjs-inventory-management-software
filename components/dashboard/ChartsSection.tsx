'use client';

import dynamic from 'next/dynamic';

const WeekChart        = dynamic(() => import('./WeekChart'),        { ssr: false });
const TopProductsChart = dynamic(() => import('./TopProductsChart'), { ssr: false });
const CustomersChart   = dynamic(() => import('./CustomersChart'),   { ssr: false });

type YearProduct  = { name: string; revenue: number };
type MonthProduct = { name: string; quantity: number; revenue: number };
type TopCustomer  = { name: string; total: number };

type Props = {
  weekLabels:       string[];
  weekSales:        number[];
  weekPurchases:    number[];
  yearTopProducts:  YearProduct[];
  monthTopProducts: MonthProduct[];
  topCustomers:     TopCustomer[];
  monthLabel:       string;
  yearLabel:        string;
};

function fmtMoney(n: number) {
  return '$ ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ChartsSection({
  weekLabels,
  weekSales,
  weekPurchases,
  yearTopProducts,
  monthTopProducts,
  topCustomers,
  monthLabel,
  yearLabel,
}: Props) {
  return (
    <div className="dash-2col">

      {/* Left column */}
      <div className="dash-col">
        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">This Week Sales &amp; Purchases</span>
          </div>
          <div className="gg-card-pad">
            <div style={{ position: 'relative', width: '100%', height: 300 }}>
              <WeekChart labels={weekLabels} sales={weekSales} purchases={weekPurchases} />
            </div>
          </div>
        </div>

        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top Selling Products ({monthLabel})</span>
          </div>
          <div className="gg-card-pad" style={{ paddingTop: 0 }}>
            <table className="gg-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {monthTopProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '24px 0' }}>
                      No sales this month.
                    </td>
                  </tr>
                ) : (
                  monthTopProducts.map((p, i) => (
                    <tr key={i}>
                      <td className="gg-td-strong">{p.name}</td>
                      <td className="gg-num">{p.quantity}</td>
                      <td className="gg-num" style={{ textAlign: 'right' }}>{fmtMoney(p.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="dash-col">
        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top Selling Products ({yearLabel})</span>
          </div>
          <div className="gg-card-pad">
            <div style={{ position: 'relative', width: '100%', height: 340 }}>
              <TopProductsChart products={yearTopProducts} />
            </div>
          </div>
        </div>

        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top 5 Customers ({monthLabel})</span>
          </div>
          <div className="gg-card-pad">
            <div style={{ position: 'relative', width: '100%', height: 300 }}>
              <CustomersChart customers={topCustomers} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
