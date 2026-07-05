'use client'

import { useEffect, useRef, useState } from 'react'

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
      className="relative overflow-hidden rounded-2xl"
      style={{
        height: 600,
        background: '#000008',
        border: '1px solid var(--border)',
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
          <div className="animate-pulse text-6xl">🌌</div>
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
          transition: 'opacity 0.5s',
        }}
        onLoad={() => setLoaded(true)}
        title="뮤직 유니버스 3D"
        allow="autoplay; camera"
      />

      {loaded && (
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-all hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
          }}
          title={isFullscreen ? '전체화면 종료' : '전체화면'}
        >
          {isFullscreen ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
              축소
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              전체화면
            </>
          )}
        </button>
      )}
    </div>
  )
}
