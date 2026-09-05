import { ImageResponse } from 'next/og'
import { fetchCardNews } from '@/components/newsletter/NewsletterTab'
import { isValidDate } from '@/lib/dates'
import {
  pickLayout,
  pickWideLayout,
  cutAtSentence,
  CARD_W,
  CARD_H,
  WIDE_W,
  WIDE_H,
  WIDE_PHOTO_W,
} from '@/lib/naver/card-layout'

export const revalidate = 300

/** 사이트의 [사실]/[분석]/[전망] 강조색 (이미지라 리터럴 값만 쓴다) */
const MARK_COLORS: Record<string, string> = {
  '[사실]': '#6fd39b',
  '[분석]': '#7aa9ee',
  '[전망]': '#e8836c',
}

const INK = '#0b0b0c'
const PAPER = '#f2efe9'
const BODY = '#b3aea5'
const DIM = '#7a766e'
const ACCENT = '#d2604a'
const RULE = 'rgba(242,239,233,0.14)'

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
      color: MARK_COLORS[part] ?? BODY,
      bold: part in MARK_COLORS,
    }))
}

/**
 * 카드 이미지. `?layout=wide`면 PC 블로그용 가로형(사진 왼쪽·글 오른쪽),
 * 기본은 모바일용 세로형(사진 위·글 아래).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string; index: string }> }
) {
  const { date, index } = await params
  const i = Number(index)
  const wide = new URL(req.url).searchParams.get('layout') === 'wide'

  if (!isValidDate(date) || !Number.isInteger(i) || i < 0) {
    return new Response('Not found', { status: 404 })
  }

  const cards = await fetchCardNews(date)
  const card = cards[i]
  if (!card) return new Response('Not found', { status: 404 })

  const [y, m, d] = date.split('-')
  const num = String(i + 1).padStart(2, '0')
  const source = card.source_name || '원문 보기'

  const tall = pickLayout(card.headline, card.caption)
  const flat = pickWideLayout(card.headline, card.caption)
  const caption = cutAtSentence(
    card.caption,
    wide ? flat.maxChars : tall.maxChars
  )
  const segments = captionSegments(caption)

  const headlineText = card.headline + '시아아빠의AI데일리'
  const bodyText = caption + source + `${y}.${m}.${d}CARD${num}·▶ 사실분석전망`

  const [serif, sans, sansBold] = await Promise.all([
    loadGoogleFont('Song+Myung', 400, headlineText),
    loadGoogleFont('Noto+Sans+KR', 400, bodyText),
    loadGoogleFont('Noto+Sans+KR', 700, bodyText),
  ])

  const fonts = [
    {
      name: 'SongMyung',
      data: serif,
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'NotoSansKR',
      data: sans,
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'NotoSansKR',
      data: sansBold,
      weight: 700 as const,
      style: 'normal' as const,
    },
  ]

  const photo = card.image_url ? (
    // Satori는 next/image를 이해하지 못한다 — ImageResponse 트리 안에서는
    // 순수 <img>만 렌더된다. 여기 결과물 자체가 이미지라 LCP와도 무관하다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={card.image_url}
      width={wide ? WIDE_PHOTO_W : CARD_W}
      height={wide ? WIDE_H : tall.photo}
      style={{ objectFit: 'cover' }}
      alt=""
    />
  ) : null

  const captionBlock = (font: number) => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        fontSize: `${font}px`,
        lineHeight: 1.6,
        color: BODY,
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
  )

  const footer = (fontSize: number, padTop: number) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: `${padTop}px`,
        borderTop: `1px solid ${RULE}`,
        fontSize: `${fontSize}px`,
        color: DIM,
      }}
    >
      <div style={{ display: 'flex' }}>▶ {source}</div>
      <div style={{ display: 'flex' }}>시아아빠의 AI 데일리</div>
    </div>
  )

  /* ── 가로형: 사진 왼쪽 · 글 오른쪽 (PC 블로그용) ───────────── */
  if (wide) {
    return new ImageResponse(
      <div
        style={{
          width: `${WIDE_W}px`,
          height: `${WIDE_H}px`,
          display: 'flex',
          backgroundColor: INK,
          fontFamily: 'NotoSansKR',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${WIDE_PHOTO_W}px`,
            height: `${WIDE_H}px`,
            overflow: 'hidden',
            backgroundColor: '#17171a',
          }}
        >
          {photo}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '0 56px',
          }}
        >
          {/* 세로형의 반전 제자 띠를, 우측 단 안에서는 괘선 한 줄로 옮겼다 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '72px',
              borderBottom: `1px solid ${RULE}`,
              fontSize: '26px',
              letterSpacing: '4px',
              color: DIM,
            }}
          >
            <div style={{ display: 'flex' }}>
              {y}.{m}.{d}
            </div>
            <div style={{ display: 'flex', color: ACCENT, fontWeight: 700 }}>
              CARD {num}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '44px 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'SongMyung',
                fontSize: '48px',
                lineHeight: 1.25,
                color: PAPER,
                letterSpacing: '-1px',
              }}
            >
              {card.headline}
            </div>

            <div
              style={{
                display: 'flex',
                width: '100px',
                height: '3px',
                backgroundColor: ACCENT,
                margin: '24px 0',
              }}
            />

            {captionBlock(flat.font)}
            {footer(24, 24)}
          </div>
        </div>
      </div>,
      { width: WIDE_W, height: WIDE_H, fonts }
    )
  }

  /* ── 세로형: 사진 위 · 글 아래 (모바일용) ──────────────────── */
  return new ImageResponse(
    <div
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: INK,
        fontFamily: 'NotoSansKR',
      }}
    >
      {/* 반전 제자 띠 — 사이트의 ed-issue-bar와 같은 장치 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: PAPER,
          color: INK,
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

      <div
        style={{
          display: 'flex',
          width: `${CARD_W}px`,
          height: `${tall.photo}px`,
          overflow: 'hidden',
          backgroundColor: '#17171a',
        }}
      >
        {photo}
      </div>

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
            color: PAPER,
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
            backgroundColor: ACCENT,
            margin: '32px 0 28px',
          }}
        />

        {captionBlock(tall.font)}
        {footer(26, 32)}
      </div>
    </div>,
    { width: CARD_W, height: CARD_H, fonts }
  )
}
