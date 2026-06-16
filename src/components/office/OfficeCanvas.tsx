'use client'

import { useEffect, useRef } from 'react'

export function OfficeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let angle = 0

    function draw() {
      if (!ctx || !canvas) return
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#080c14'
      ctx.fillRect(0, 0, W, H)

      // ── Radar ──────────────────────────────────────────
      const cx = W * 0.3
      const cy = H * 0.5
      const r = Math.min(W, H) * 0.22

      // Rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(28,105,212,0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(28,105,212,0.15)'
      ctx.beginPath()
      ctx.moveTo(cx - r, cy)
      ctx.lineTo(cx + r, cy)
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx, cy + r)
      ctx.stroke()

      // Sweep
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle)
      const sweepGrad = ctx.createLinearGradient(0, 0, r, 0)
      sweepGrad.addColorStop(0, 'rgba(28,105,212,0.6)')
      sweepGrad.addColorStop(1, 'rgba(28,105,212,0)')
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, r, -0.3, 0.3)
      ctx.fillStyle = sweepGrad
      ctx.fill()
      ctx.restore()

      // Blips (fixed positions)
      const blips = [
        { x: cx + r * 0.3, y: cy - r * 0.5 },
        { x: cx - r * 0.4, y: cy + r * 0.3 },
        { x: cx + r * 0.6, y: cy + r * 0.2 },
        { x: cx - r * 0.1, y: cy - r * 0.7 },
        { x: cx + r * 0.1, y: cy + r * 0.6 },
      ]
      blips.forEach((b) => {
        ctx.beginPath()
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#10b981'
        ctx.fill()
      })

      // Radar label
      ctx.fillStyle = '#4d90f0'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('AI CREW RADAR', cx, cy + r + 20)

      // ── Monitor grid ────────────────────────────────────
      const monitors = [
        { label: '📰 PLANNER', x: W * 0.6, y: H * 0.15 },
        { label: '🔍 NEWS', x: W * 0.8, y: H * 0.15 },
        { label: '🎨 DESIGNER', x: W * 0.6, y: H * 0.5 },
        { label: '📊 TREND', x: W * 0.8, y: H * 0.5 },
      ]
      const mW = W * 0.14
      const mH = H * 0.28

      monitors.forEach((m) => {
        // Screen bg
        ctx.fillStyle = '#0f1520'
        ctx.strokeStyle = 'rgba(28,105,212,0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(m.x - mW / 2, m.y, mW, mH, 6)
        ctx.fill()
        ctx.stroke()

        // Label
        ctx.fillStyle = '#4d90f0'
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(m.label, m.x, m.y + 14)

        // Activity bars
        for (let i = 0; i < 3; i++) {
          const bw = (mW - 16) * (0.4 + Math.sin(angle * 3 + m.x + i) * 0.3)
          ctx.fillStyle = `rgba(28,105,212,${0.3 + Math.abs(Math.sin(angle + i)) * 0.4})`
          ctx.beginPath()
          ctx.roundRect(m.x - mW / 2 + 8, m.y + 24 + i * 18, bw, 10, 3)
          ctx.fill()
        }
      })

      angle += 0.02
      rafRef.current = requestAnimationFrame(draw)
    }

    // Resize canvas to container
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    resize()
    window.addEventListener('resize', resize)

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full rounded-2xl"
      style={{ background: '#080c14' }}
    />
  )
}
