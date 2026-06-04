'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const dates = ['2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23', '2026-05-24', '2026-05-25', '2026-05-26'];

const data = {
  labels: dates,
  datasets: [
    {
      label: 'Sales',
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#C0851A',
      backgroundColor: 'rgba(192,133,26,.12)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: '#C0851A',
      borderWidth: 2,
    },
    {
      label: 'Purchases',
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#109C6B',
      backgroundColor: 'rgba(16,156,107,.10)',
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: '#109C6B',
      borderWidth: 2,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
  },
  scales: {
    x: { grid: { color: '#E6E1D8' } },
    y: { grid: { color: '#E6E1D8' }, beginAtZero: true },
  },
};

export default function WeekChart() {
  return <Line data={data} options={options} />;
}
