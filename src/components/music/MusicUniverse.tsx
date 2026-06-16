'use client'

import { useState } from 'react'

export function MusicUniverse() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative h-[600px] overflow-hidden rounded-2xl" style={{ background: '#080c14', border: '1px solid var(--border)' }}>
      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
          <div className="text-6xl animate-pulse">🌌</div>
          <p className="gradient-text font-bold text-lg">뮤직 유니버스 로딩 중...</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>3D 음악 은하계를 준비하고 있어요</p>
        </div>
      )}

      <iframe
        src="https://siadaddy.github.io/youngs/music-universe.html"
        className="h-full w-full"
        style={{ border: 'none', opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }}
        onLoad={() => setLoaded(true)}
        title="뮤직 유니버스 3D"
        allow="autoplay"
      />
    </div>
  )
}
