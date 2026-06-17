'use client'

import { useState, useEffect } from 'react'

export interface ChartColors {
  grid: string
  tick: string
  legend: string
}

const DEFAULTS: ChartColors = {
  grid: 'rgba(255,255,255,0.08)',
  tick: '#64748b',
  legend: '#94a3b8',
}

function readFromDOM(): ChartColors {
  const s = getComputedStyle(document.documentElement)
  return {
    grid: s.getPropertyValue('--chart-grid').trim() || DEFAULTS.grid,
    tick: s.getPropertyValue('--chart-tick').trim() || DEFAULTS.tick,
    legend: s.getPropertyValue('--chart-legend').trim() || DEFAULTS.legend,
  }
}

export function useChartColors(): ChartColors {
  // Read immediately on client (SSR falls back to DEFAULTS)
  const [colors, setColors] = useState<ChartColors>(() =>
    typeof window === 'undefined' ? DEFAULTS : readFromDOM(),
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
