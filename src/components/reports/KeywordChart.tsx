'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { KeywordStat } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const COLORS = [
  'rgba(28,105,212,0.85)',
  'rgba(77,144,240,0.80)',
  'rgba(167,139,250,0.80)',
  'rgba(16,185,129,0.75)',
  'rgba(245,158,11,0.75)',
  'rgba(239,68,68,0.75)',
  'rgba(20,184,166,0.75)',
  'rgba(234,179,8,0.75)',
]

export function KeywordChart({ keywords }: { keywords: KeywordStat[] }) {
  if (keywords.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        키워드 데이터가 없습니다
      </p>
    )
  }

  const top = keywords.slice(0, 15)

  const data = {
    labels: top.map((k) => k.word),
    datasets: [
      {
        data: top.map((k) => k.count),
        backgroundColor: top.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  return (
    <Bar
      data={data}
      options={{
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}회` } } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#e2e8f0', font: { size: 12 } },
          },
        },
      }}
    />
  )
}
