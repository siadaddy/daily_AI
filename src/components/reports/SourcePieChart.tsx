'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { SourceStat } from '@/lib/types'

ChartJS.register(ArcElement, Tooltip, Legend)

const PALETTE = [
  'rgba(28,105,212,0.85)',
  'rgba(167,139,250,0.85)',
  'rgba(16,185,129,0.85)',
  'rgba(245,158,11,0.85)',
  'rgba(239,68,68,0.85)',
  'rgba(77,144,240,0.85)',
  'rgba(20,184,166,0.85)',
  'rgba(234,179,8,0.85)',
  'rgba(100,116,139,0.70)',
]

export function SourcePieChart({ sources }: { sources: SourceStat[] }) {
  if (sources.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        출처 데이터가 없습니다
      </p>
    )
  }

  const data = {
    labels: sources.map((s) => s.source),
    datasets: [
      {
        data: sources.map((s) => s.count),
        backgroundColor: sources.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <Doughnut
      data={data}
      options={{
        cutout: '62%',
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { size: 11 },
              padding: 12,
              boxWidth: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw}건`,
            },
          },
        },
      }}
    />
  )
}
