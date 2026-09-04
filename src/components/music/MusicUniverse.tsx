'use client'

import { useEffect, useRef, useState } from 'react'
import { Orbit, Maximize2, Minimize2 } from 'lucide-react'

export function MusicUniverse() {
  const [loaded, setLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: 600,
        background: '#000008',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-opacity duration-500">
          <Orbit
            size={56}
            strokeWidth={1.5}
            style={{
              color: 'var(--brand-light)',
              animation: 'spin-slow 3s linear infinite',
            }}
          />
          <p className="gradient-text text-lg font-bold">
            뮤직 유니버스 로딩 중...
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            3D 음악 은하계를 준비하고 있어요
          </p>
        </div>
      )}

      <iframe
        src="/music/music.html"
        className="h-full w-full"
        style={{
          border: 'none',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
        onLoad={() => setLoaded(true)}
        title="뮤직 유니버스 3D"
        allow="autoplay; camera"
      />

      {loaded && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--r-sm)',
            color: '#fff',
          }}
          title={isFullscreen ? '전체화면 종료' : '전체화면'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 size={14} strokeWidth={2} />
              축소
            </>
          ) : (
            <>
              <Maximize2 size={14} strokeWidth={2} />
              전체화면
            </>
          )}
        </button>
      )}
    </div>
  )
}
