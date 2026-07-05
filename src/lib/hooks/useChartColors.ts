'use client'

import { useState, useEffect } from 'react'

export interface ChartColors {
  grid: string
  tick: string
  legend: string
  series: string[]
  etc: string
}

const DEFAULTS: ChartColors = {
  grid: 'rgba(255,255,255,0.08)',
  tick: '#64748b',
  legend: '#94a3b8',
  series: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767'],
  etc: '#94a3b8',
}

// hex(#rrggbb) → rgba 문자열
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function readFromDOM(): ChartColors {
  const s = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    s.getPropertyValue(name).trim() || fallback
  return {
    grid: read('--chart-grid', DEFAULTS.grid),
    tick: read('--chart-tick', DEFAULTS.tick),
    legend: read('--chart-legend', DEFAULTS.legend),
    series: DEFAULTS.series.map((fallback, i) =>
      read(`--viz-${i + 1}`, fallback)
    ),
    etc: read('--viz-etc', DEFAULTS.etc),
  }
}

export function useChartColors(): ChartColors {
  // Read immediately on client (SSR falls back to DEFAULTS)
  const [colors, setColors] = useState<ChartColors>(() =>
    typeof window === 'undefined' ? DEFAULTS : readFromDOM()
  )

  useEffect(() => {
    // Re-read whenever data-theme attribute changes
    const obs = new MutationObserver(() => setColors(readFromDOM()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  return colors
}
