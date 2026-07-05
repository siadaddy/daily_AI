'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { SourceStat } from '@/lib/types'
import { useChartColors, withAlpha } from '@/lib/hooks/useChartColors'

ChartJS.register(ArcElement, Tooltip, Legend)

export function SourcePieChart({ sources }: { sources: SourceStat[] }) {
  const { legend, series, etc } = useChartColors()

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
        // 슬롯 고정 배정 — '기타'와 6개 초과분은 중립색 (색 순환 금지)
        backgroundColor: sources.map((s, i) =>
          withAlpha(
            s.source === '기타' || i >= series.length ? etc : series[i],
            0.85
          )
        ),
        borderColor: 'rgba(0,0,0,0.2)',
        borderWidth: 2,
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
              color: legend,
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
