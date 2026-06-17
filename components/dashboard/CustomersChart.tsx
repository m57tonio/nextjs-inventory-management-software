'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  '#6D5BD0', '#C0851A', '#109C6B', '#2C7BE0',
  '#DD4F88',
];

type Props = {
  customers: { name: string; total: number }[];
};

export default function CustomersChart({ customers }: Props) {
  const isEmpty = customers.length === 0;

  const data = isEmpty
    ? {
        labels:   ['No data'],
        datasets: [{ data: [1], backgroundColor: ['#E6E1D8'], borderColor: '#fff', borderWidth: 3 }],
      }
    : {
        labels:   customers.map((c) => c.name),
        datasets: [
          {
            data:            customers.map((c) => c.total),
            backgroundColor: customers.map((_, i) => PALETTE[i % PALETTE.length]),
            borderColor:     '#fff',
            borderWidth:     3,
          },
        ],
      };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'  as const,
        align:    'end'  as const,
        labels: {
          usePointStyle: true,
          pointStyle:    'rectRounded' as const,
          boxWidth:      14,
          padding:       10,
          color:         '#7A746A',
          font:          { family: "'Hanken Grotesk', sans-serif", size: 12, weight: 600 as const },
          generateLabels: isEmpty
            ? undefined
            : (chart: ChartJS) => {
                const meta = chart.getDatasetMeta(0);
                return (chart.data.labels as string[]).map((label, i) => ({
                  text:        label.length > 20 ? label.slice(0, 18) + '…' : label,
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

  return <Pie data={data} options={options} />;
}
