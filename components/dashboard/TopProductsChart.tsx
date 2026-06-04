'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ['No Data'],
  datasets: [
    {
      data: [1],
      backgroundColor: ['#E6E1D8'],
      borderWidth: 0,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const },
  },
};

export default function TopProductsChart() {
  return <Doughnut data={data} options={options} />;
}
