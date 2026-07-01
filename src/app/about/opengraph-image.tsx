import { ImageResponse } from 'next/og'

export const alt = 'AI 활용 경진대회 출품작 — 시아아빠의 AI 데일리'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadGoogleFont(text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`
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

export default async function Image() {
  const fontData = await loadGoogleFont(
    'AI활용경진대회출품작시아아빠의AI데일리자동화에이전트파이프라인DAILY KR'
  )

  const tags = [
    { label: '# 자동화 파이프라인', purple: false },
    { label: '# 자기학습 에이전트', purple: true },
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
      <div
        style={{
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '6px',
          height: '560px',
          backgroundColor: '#f59e0b',
        }}
      />

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f59e0b',
              borderRadius: '999px',
              padding: '10px 22px',
              marginRight: '20px',
            }}
          >
            <span
              style={{
                fontSize: '22px',
                color: '#ffffff',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              🏆 AI 경진대회 출품
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '56px',
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: '1.2',
            marginBottom: '28px',
          }}
        >
          AI 활용기 — 시아아빠의 AI 데일리
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '44px',
          }}
        >
          반복 업무를 AI 에이전트로 자동화한 목적·방법·결과·재현성 기록
        </div>

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
          AI 활용기
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
