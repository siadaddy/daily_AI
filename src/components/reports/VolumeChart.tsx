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

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Filler)

export function VolumeChart({ volumeSeries }: { volumeSeries: DailyVolume[] }) {
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
        backgroundColor: 'rgba(28,105,212,0.65)',
        borderColor: 'rgba(77,144,240,0.9)',
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
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 }, maxRotation: 45 },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 },
            beginAtZero: true,
          },
        },
      }}
    />
  )
}
