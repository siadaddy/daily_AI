import { ImageResponse } from 'next/og'

export const alt = '시아아빠의 AI 데일리'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadGoogleFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`
  // Use an older UA so Google Fonts returns TTF (not woff2 — Satori only supports OTF/TTF)
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (bb10; Touch) AppleWebKit/537.1+ (KHTML, like Gecko) Version/10.0.0.1337 Mobile Safari/537.1+',
    },
  }).then((r) => r.text())
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
  if (!match)
    throw new Error('Google Fonts: OTF/TTF URL not found in CSS response')
  return fetch(match[1]).then((r) => r.arrayBuffer())
}

function formatDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default async function Image() {
  const fontData = await loadGoogleFont(
    '시아아빠의AI데일리뉴스레터트렌드리포트음악유니버스DAILY KR'
  )

  const tags = [
    { label: '# 뉴스레터', purple: false },
    { label: '# 트렌드리포트', purple: true },
    { label: '# 음악유니버스', purple: false },
  ]

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F5F8FF',
        fontFamily: '"NotoSansKR", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent spine */}
      <div
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '6px',
          height: '560px',
          backgroundColor: '#1c69d4',
        }}
      />

      {/* Subtle horizontal rule lines for "newsprint" texture */}
      {[120, 240, 360, 480].map((y) => (
        <div
          key={y}
          style={{
            position: 'absolute',
            left: '6px',
            top: `${y}px`,
            right: '0px',
            height: '1px',
            backgroundColor: 'rgba(28,105,212,0.06)',
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          flex: '1',
          padding: '56px 80px 56px 72px',
          position: 'relative',
        }}
      >
        {/* Top row: AI badge icon + title + LIVE badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}
        >
          {/* Title group */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* AI icon box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '68px',
                height: '68px',
                backgroundColor: '#1c69d4',
                borderRadius: '14px',
                marginRight: '24px',
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                AI
              </span>
            </div>

            <span
              style={{
                fontSize: '62px',
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: '1',
              }}
            >
              시아아빠의 AI 데일리
            </span>
          </div>

          {/* LIVE badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(28,105,212,0.22)',
              borderRadius: '999px',
              padding: '10px 22px',
            }}
          >
            <div
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                marginRight: '10px',
              }}
            />
            <span
              style={{
                fontSize: '22px',
                color: '#475569',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              AI LIVE
            </span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '31px',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '44px',
          }}
        >
          AI가 매일 자동 생성하는 뉴스레터 · 트렌드 리포트 · 음악 유니버스
        </div>

        {/* Tag pills */}
        <div style={{ display: 'flex' }}>
          {tags.map(({ label, purple }, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                backgroundColor: purple
                  ? 'rgba(124,58,237,0.08)'
                  : 'rgba(28,105,212,0.08)',
                color: purple ? '#7c3aed' : '#1c69d4',
                border: `1.5px solid ${purple ? 'rgba(124,58,237,0.22)' : 'rgba(28,105,212,0.22)'}`,
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                marginRight: i < tags.length - 1 ? '14px' : '0px',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Dark masthead strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
          height: '70px',
          padding: '0px 80px 0px 72px',
        }}
      >
        <span
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.18em',
          }}
        >
          AI DAILY
        </span>
        <span
          style={{
            fontSize: '20px',
            color: '#64748b',
            letterSpacing: '0.06em',
          }}
        >
          {formatDate()} · KR
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: 'NotoSansKR',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
