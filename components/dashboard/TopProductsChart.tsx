'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  '#C0851A', '#109C6B', '#2C7BE0', '#6D5BD0',
  '#DD4F88', '#1BA3C2', '#DE7A1E', '#D8473A',
];

type Props = {
  products: { name: string; revenue: number }[];
};

export default function TopProductsChart({ products }: Props) {
  const isEmpty = products.length === 0;

  const data = isEmpty
    ? {
        labels:   ['No data'],
        datasets: [{ data: [1], backgroundColor: ['#E6E1D8'], borderWidth: 0 }],
      }
    : {
        labels:   products.map((p) => p.name),
        datasets: [
          {
            data:            products.map((p) => p.revenue),
            backgroundColor: products.map((_, i) => PALETTE[i % PALETTE.length]),
            borderColor:     '#fff',
            borderWidth:     3,
          },
        ],
      };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              '62%',
    plugins: {
      legend: {
        display:  !isEmpty,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle:    'rectRounded' as const,
          boxWidth:      12,
          padding:       14,
          color:         '#7A746A',
          font:          { family: "'Hanken Grotesk', sans-serif", size: 12 },
          // Truncate long product names in the legend.
          generateLabels: (chart: ChartJS) => {
            const meta = chart.getDatasetMeta(0);
            return (chart.data.labels as string[]).map((label, i) => ({
              text:        label.length > 22 ? label.slice(0, 20) + '…' : label,
              fillStyle:   (chart.data.datasets[0].backgroundColor as string[])[i],
              strokeStyle: '#fff',
              lineWidth:   2,
              hidden:      !meta.data[i]?.active,
              index:       i,
            }));
          },
        },
      },
      tooltip: {
        enabled: !isEmpty,
        callbacks: {
          label: (ctx: { label: string; parsed: number }) =>
            ` ${ctx.label}: $ ${ctx.parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
