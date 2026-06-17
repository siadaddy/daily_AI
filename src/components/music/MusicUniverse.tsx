'use client'

import { useEffect, useRef } from 'react'

type Star = {
  angle: number
  radius: number
  speed: number
  size: number
  color: string
  opacity: number
  twinkleOffset: number
}

const STAR_COLORS = ['#ffffff', '#4d90f0', '#a78bfa', '#1c69d4', '#c4b5fd', '#93c5fd']

function initStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: Math.random() * 0.45 + 0.03,
    speed: (Math.random() * 0.0003 + 0.0001) * (Math.random() < 0.5 ? 1 : -1),
    size: Math.random() * 1.8 + 0.4,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    opacity: Math.random() * 0.6 + 0.4,
    twinkleOffset: Math.random() * Math.PI * 2,
  }))
}

export function MusicUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const starsRef = useRef<Star[]>(initStars(450))
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const tickRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => {
      mouseRef.current = null
    }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    function draw() {
      if (!ctx || !canvas) return
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const maxR = Math.min(W, H) * 0.46
      const t = tickRef.current
      tickRef.current++

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#080c14'
      ctx.fillRect(0, 0, W, H)

      // Nebula glow layers
      const nebula1 = ctx.createRadialGradient(cx - W * 0.1, cy - H * 0.05, 0, cx - W * 0.1, cy - H * 0.05, W * 0.38)
      nebula1.addColorStop(0, 'rgba(28,105,212,0.13)')
      nebula1.addColorStop(0.5, 'rgba(28,105,212,0.04)')
      nebula1.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula1
      ctx.fillRect(0, 0, W, H)

      const nebula2 = ctx.createRadialGradient(cx + W * 0.12, cy + H * 0.08, 0, cx + W * 0.12, cy + H * 0.08, W * 0.3)
      nebula2.addColorStop(0, 'rgba(167,139,250,0.1)')
      nebula2.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, W, H)

      // Stars
      const stars = starsRef.current
      const mouse = mouseRef.current
      for (const star of stars) {
        star.angle += star.speed

        const sx = cx + Math.cos(star.angle) * star.radius * maxR
        const sy = cy + Math.sin(star.angle) * star.radius * maxR * 0.45

        let size = star.size
        let opacity = star.opacity * (0.75 + 0.25 * Math.sin(t * 0.03 + star.twinkleOffset))

        if (mouse) {
          const dx = sx - mouse.x
          const dy = sy - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            const factor = 1 - dist / 80
            size += factor * 3
            opacity = Math.min(1, opacity + factor * 0.5)
          }
        }

        ctx.beginPath()
        ctx.arc(sx, sy, size, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.globalAlpha = opacity
        ctx.fill()
        ctx.globalAlpha = 1

        // Glow for brighter stars
        if (size > 1.5) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 4)
          glow.addColorStop(0, star.color + '55')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.globalAlpha = 0.4
          ctx.beginPath()
          ctx.arc(sx, sy, size * 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      // Core galactic glow
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.18)
      core.addColorStop(0, 'rgba(77,144,240,0.55)')
      core.addColorStop(0.4, 'rgba(28,105,212,0.18)')
      core.addColorStop(1, 'transparent')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.ellipse(cx, cy, maxR * 0.18, maxR * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Canvas 은하계 */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ height: 420, border: '1px solid var(--border)', background: '#080c14' }}
      >
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* 오버레이 */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
          <div>
            <h2 className="gradient-text text-2xl font-bold">🌌 뮤직 유니버스</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              마우스를 움직여 별과 교감하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#4d90f0]" />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              450개의 별이 은하를 이루고 있어요
            </span>
          </div>
        </div>
      </div>

      {/* YouTube 플레이어 */}
      <div className="glass-card overflow-hidden rounded-xl" style={{ height: 180 }}>
        <iframe
          src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0&controls=1&rel=0"
          className="h-full w-full"
          style={{ border: 'none' }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="뮤직 플레이리스트"
        />
      </div>
    </div>
  )
}
