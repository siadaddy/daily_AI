'use client'

import { useState } from 'react'

export function MusicUniverse() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ height: 600, background: '#000008', border: '1px solid var(--border)' }}
    >
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
          <div className="animate-pulse text-6xl">🌌</div>
          <p className="gradient-text text-lg font-bold">뮤직 유니버스 로딩 중...</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>3D 음악 은하계를 준비하고 있어요</p>
        </div>
      )}
      <iframe
        src="/music/music.html"
        className="h-full w-full"
        style={{ border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
        onLoad={() => setLoaded(true)}
        title="뮤직 유니버스 3D"
        allow="autoplay; camera"
      />
    </div>
  )
}
