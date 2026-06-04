'use client';

import dynamic from 'next/dynamic';

const WeekChart = dynamic(() => import('./WeekChart'), { ssr: false });
const TopProductsChart = dynamic(() => import('./TopProductsChart'), { ssr: false });
const CustomersChart = dynamic(() => import('./CustomersChart'), { ssr: false });

export default function ChartsSection() {
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
              <WeekChart />
            </div>
          </div>
        </div>

        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top Selling Products (May)</span>
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
              <tbody style={{ minHeight: 90 }} />
            </table>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="dash-col">
        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top Selling Products (2026)</span>
          </div>
          <div className="gg-card-pad">
            <div style={{ position: 'relative', width: '100%', height: 340 }}>
              <TopProductsChart />
            </div>
          </div>
        </div>

        <div className="gg-card">
          <div className="gg-card-head">
            <span className="gg-card-title">Top 5 Customers (May)</span>
          </div>
          <div className="gg-card-pad">
            <div style={{ position: 'relative', width: '100%', height: 300 }}>
              <CustomersChart />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
