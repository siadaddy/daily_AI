'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { KeywordStat } from '@/lib/types'
import { useChartColors, withAlpha } from '@/lib/hooks/useChartColors'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export function KeywordChart({ keywords }: { keywords: KeywordStat[] }) {
  const { grid, tick, series } = useChartColors()

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
        // 키워드는 순위(크기) 데이터 — 단일 색으로 막대 길이만 비교
        backgroundColor: withAlpha(series[0], 0.8),
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
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}회` } },
        },
        scales: {
          x: {
            grid: { color: grid },
            ticks: { color: tick, font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: tick, font: { size: 12 } },
          },
        },
      }}
    />
  )
}
