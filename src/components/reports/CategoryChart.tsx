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
import { useChartColors, withAlpha } from '@/lib/hooks/useChartColors'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export function CategoryChart({ stats }: { stats: CategoryStat[] }) {
  const { grid, tick, series, etc } = useChartColors()

  const data = {
    labels: stats.map((s) => s.name),
    datasets: [
      {
        data: stats.map((s) => s.count),
        // 슬롯 고정 배정 — 6개 초과분은 중립색 (색 순환 금지)
        backgroundColor: stats.map((_, i) =>
          withAlpha(i < series.length ? series[i] : etc, 0.75)
        ),
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
          x: { grid: { color: grid }, ticks: { color: tick } },
          y: { grid: { color: grid }, ticks: { color: tick } },
        },
      }}
    />
  )
}
