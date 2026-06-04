'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const data = {
  labels: ['No Data'],
  datasets: [
    {
      label: 'Total',
      data: [0],
      backgroundColor: '#C0851A',
      borderRadius: 6,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: '#E6E1D8' }, beginAtZero: true },
  },
};

export default function CustomersChart() {
  return <Bar data={data} options={options} />;
}
