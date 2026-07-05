'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { DailyVolume } from '@/lib/types'
import dayjs from 'dayjs'
import { useChartColors, withAlpha } from '@/lib/hooks/useChartColors'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Filler)

export function VolumeChart({ volumeSeries }: { volumeSeries: DailyVolume[] }) {
  const { grid, tick, series } = useChartColors()

  if (volumeSeries.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        발행량 데이터가 없습니다
      </p>
    )
  }

  const data = {
    labels: volumeSeries.map((v) => dayjs(v.date).format('MM/DD')),
    datasets: [
      {
        label: '기사 수',
        data: volumeSeries.map((v) => v.count),
        backgroundColor: withAlpha(series[0], 0.65),
        borderColor: withAlpha(series[0], 0.9),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}건` } },
        },
        scales: {
          x: {
            grid: { color: grid },
            ticks: { color: tick, font: { size: 11 }, maxRotation: 45 },
          },
          y: {
            grid: { color: grid },
            ticks: { color: tick, font: { size: 11 }, stepSize: 1 },
            beginAtZero: true,
          },
        },
      }}
    />
  )
}
