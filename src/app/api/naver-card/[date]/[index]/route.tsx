import { ImageResponse } from 'next/og'
import { fetchCardNews } from '@/components/newsletter/NewsletterTab'
import { isValidDate } from '@/lib/dates'

export const revalidate = 300

/** 네이버 카드뉴스 관행에 맞춘 4:5 세로 판형 */
const W = 1080
const H = 1350

/**
 * 캡션 분량은 헤드라인이 몇 줄을 먹느냐에 달렸다.
 * 텍스트 영역은 1350 - 96(제자 띠) - 620(도판) - 여백 ≈ 542px.
 * 헤드라인 58px×1.25 = 줄당 72px, 캡션 30px×1.6 = 줄당 48px, 하단 출처 ≈ 92px.
 * 헤드라인이 한 줄 늘 때마다 캡션에서 대략 한 줄 반을 빼야 넘치지 않는다.
 */
function captionBudget(headline: string): number {
  const perLine = 16 // 58px 세리프 기준 한 줄에 들어가는 한글 글자 수(대략)
  const headlineLines = Math.max(1, Math.ceil(headline.length / perLine))
  return Math.max(90, 200 - (headlineLines - 1) * 55)
}

/** 사이트의 [사실]/[분석]/[전망] 강조색 (이미지라 리터럴 값만 쓴다) */
const MARK_COLORS: Record<string, string> = {
  '[사실]': '#6fd39b',
  '[분석]': '#7aa9ee',
  '[전망]': '#e8836c',
}

/**
 * Satori는 woff2를 못 읽어 OTF/TTF가 필요하다. Google Fonts는 UA를 보고
 * 포맷을 정하므로 구형 UA로 요청해 TTF를 받는다. `text=`로 실제 쓰이는
 * 글자만 서브셋해 한글 폰트 용량 문제를 피한다.
 * (opengraph-image.tsx에서 검증된 방식 재사용)
 */
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (bb10; Touch) AppleWebKit/537.1+ (KHTML, like Gecko) Version/10.0.0.1337 Mobile Safari/537.1+',
    },
  }).then((r) => r.text())
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error(`Google Fonts: TTF not found for ${family}`)
  return fetch(match[1]).then((r) => r.arrayBuffer())
}

/** 캡션을 강조 마커 기준으로 쪼개 색을 입힌다 */
function captionSegments(caption: string) {
  const marks = Object.keys(MARK_COLORS)
  const pattern = new RegExp(
    `(${marks.map((m) => `\\${m.slice(0, -1)}\\]`).join('|')})`
  )
  return caption
    .split(pattern)
    .filter(Boolean)
    .map((part, i) => ({
      key: i,
      text: part,
      color: MARK_COLORS[part] ?? '#b3aea5',
      bold: part in MARK_COLORS,
    }))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string; index: string }> }
) {
  const { date, index } = await params
  const i = Number(index)

  if (!isValidDate(date) || !Number.isInteger(i) || i < 0) {
    return new Response('Not found', { status: 404 })
  }

  const cards = await fetchCardNews(date)
  const card = cards[i]
  if (!card) return new Response('Not found', { status: 404 })

  const [y, m, d] = date.split('-')
  const num = String(i + 1).padStart(2, '0')
  const budget = captionBudget(card.headline)
  const caption =
    card.caption.length > budget
      ? card.caption.slice(0, budget).trimEnd() + '…'
      : card.caption
  const segments = captionSegments(caption)
  const source = card.source_name || '원문 보기'

  const headlineText = card.headline + '시아아빠의AI데일리'
  const bodyText = caption + source + `${y}.${m}.${d}CARD${num}·▶ 사실분석전망`

  const [serif, sans, sansBold] = await Promise.all([
    loadGoogleFont('Song+Myung', 400, headlineText),
    loadGoogleFont('Noto+Sans+KR', 400, bodyText),
    loadGoogleFont('Noto+Sans+KR', 700, bodyText),
  ])

  return new ImageResponse(
    <div
      style={{
        width: `${W}px`,
        height: `${H}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0b0b0c',
        fontFamily: 'NotoSansKR',
      }}
    >
      {/* 반전 제자 띠 — 사이트의 ed-issue-bar와 같은 장치 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f2efe9',
          color: '#0b0b0c',
          padding: '0 48px',
          height: '96px',
          fontSize: '30px',
          letterSpacing: '4px',
        }}
      >
        <div style={{ display: 'flex' }}>
          {y}.{m}.{d}
        </div>
        <div style={{ display: 'flex', fontWeight: 700 }}>CARD {num}</div>
      </div>

      {/* 도판 */}
      <div
        style={{
          display: 'flex',
          width: `${W}px`,
          height: '620px',
          overflow: 'hidden',
          backgroundColor: '#17171a',
        }}
      >
        {card.image_url ? (
          // Satori는 next/image를 이해하지 못한다 — ImageResponse 트리 안에서는
          // 순수 <img>만 렌더된다. 여기 결과물 자체가 이미지라 LCP와도 무관하다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image_url}
            width={W}
            height={620}
            style={{ objectFit: 'cover' }}
            alt=""
          />
        ) : null}
      </div>

      {/* 기사 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '48px 56px 44px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: 'SongMyung',
            fontSize: '58px',
            lineHeight: 1.25,
            color: '#f2efe9',
            letterSpacing: '-1px',
          }}
        >
          {card.headline}
        </div>

        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '3px',
            backgroundColor: '#d2604a',
            margin: '32px 0 28px',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            fontSize: '30px',
            lineHeight: 1.6,
            color: '#b3aea5',
          }}
        >
          {segments.map((s) => (
            <span
              key={s.key}
              style={{
                color: s.color,
                fontWeight: s.bold ? 700 : 400,
                marginRight: s.bold ? '10px' : '0',
              }}
            >
              {s.text}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '32px',
            borderTop: '1px solid rgba(242,239,233,0.14)',
            fontSize: '26px',
            color: '#7a766e',
          }}
        >
          <div style={{ display: 'flex' }}>▶ {source}</div>
          <div style={{ display: 'flex' }}>시아아빠의 AI 데일리</div>
        </div>
      </div>
    </div>,
    {
      width: W,
      height: H,
      fonts: [
        { name: 'SongMyung', data: serif, weight: 400, style: 'normal' },
        { name: 'NotoSansKR', data: sans, weight: 400, style: 'normal' },
        { name: 'NotoSansKR', data: sansBold, weight: 700, style: 'normal' },
      ],
    }
  )
}
