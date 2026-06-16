'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { CategoryStat } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export function CategoryChart({ stats }: { stats: CategoryStat[] }) {
  const data = {
    labels: stats.map((s) => s.name),
    datasets: [
      {
        data: stats.map((s) => s.count),
        backgroundColor: [
          'rgba(28,105,212,0.7)',
          'rgba(167,139,250,0.7)',
          'rgba(16,185,129,0.7)',
          'rgba(245,158,11,0.7)',
          'rgba(239,68,68,0.7)',
          'rgba(77,144,240,0.7)',
        ],
        borderRadius: 8,
      },
    ],
  }

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
        },
      }}
    />
  )
}
