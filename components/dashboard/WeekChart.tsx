'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Props = {
  labels:    string[];
  sales:     number[];
  purchases: number[];
};

export default function WeekChart({ labels, sales, purchases }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label:                'Sales',
        data:                 sales,
        borderColor:          '#C0851A',
        backgroundColor:      'rgba(192,133,26,.12)',
        tension:              0.35,
        fill:                 true,
        pointRadius:          3,
        pointBackgroundColor: '#C0851A',
        borderWidth:          2,
      },
      {
        label:                'Purchases',
        data:                 purchases,
        borderColor:          '#109C6B',
        backgroundColor:      'rgba(16,156,107,.10)',
        tension:              0.35,
        fill:                 true,
        pointRadius:          3,
        pointBackgroundColor: '#109C6B',
        borderWidth:          2,
      },
    ],
  };

  const peak = Math.max(1, ...sales, ...purchases);

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'    as const,
        align:    'center' as const,
        labels: {
          usePointStyle: true,
          pointStyle:    'rectRounded' as const,
          boxWidth:      14,
          padding:       18,
          color:         '#7A746A',
          font:          { family: "'Hanken Grotesk', sans-serif", size: 12, weight: 600 as const },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            ` ${ctx.dataset.label ?? ''}: $ ${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: '#F3F0E9' },
        ticks: { color: '#7A746A', font: { family: "'Hanken Grotesk', sans-serif", size: 12 } },
      },
      y: {
        beginAtZero:  true,
        suggestedMax: peak,
        grid:         { color: '#F3F0E9' },
        title: {
          display: true,
          text:    'Amount',
          color:   '#7A746A',
          font:    { family: "'Hanken Grotesk', sans-serif", size: 12, weight: 600 as const },
        },
        ticks: {
          color:    '#7A746A',
          font:     { family: "'Hanken Grotesk', sans-serif", size: 12 },
          callback: (value: number | string) =>
            '$ ' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
