import type { ContentCard, NewsTrend } from '@/lib/types'
import { mdToHtml } from '@/lib/utils/caption'

/**
 * 네이버 블로그(스마트에디터 ONE) 붙여넣기용 변환기.
 *
 * 에디터가 붙여넣기를 자기 컴포넌트 모델로 다시 만들기 때문에 클래스·CSS 변수·
 * 레이아웃은 전부 버려진다. 살아남는 것만 쓴다:
 *   h2/h3 · p · strong · blockquote · ol/ul/li · a · img · hr,
 *   그리고 span의 인라인 color(리터럴 hex만 — var()는 해석되지 않는다).
 * div·table·flex는 쓰지 않는다. 지면의 "생김새"가 아니라 "순서와 위계"를 옮긴다.
 */

export interface NaverPostInput {
  date: string
  cards: ContentCard[]
  article: { title: string; content: string } | null
  trend: NewsTrend | null
  /** 원문 역링크용 사이트 주소 (예: https://siadaddy-ai.vercel.app) */
  siteUrl: string
}

export interface NaverPost {
  /** 블로그 글 제목 제안 */
  title: string
  /** 붙여넣기용 HTML */
  html: string
  /** 리치 붙여넣기가 막힌 환경용 평문 */
  text: string
}

/** 사이트에서 쓰는 [사실]/[분석]/[전망] 강조색 — 네이버용 리터럴 값 */
const MARK_COLORS: Record<string, string> = {
  '[사실]': '#1f7a4d',
  '[분석]': '#1a56b8',
  '[전망]': '#b8412c',
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 캡션의 태그 강조를 인라인 색으로, 줄바꿈을 <br>로 */
function captionToHtml(caption: string): string {
  let out = escapeHtml(caption)
  for (const [mark, color] of Object.entries(MARK_COLORS)) {
    out = out
      .split(mark)
      .join(`<span style="color:${color};font-weight:bold">${mark}</span>`)
  }
  return out.replace(/\n/g, '<br />')
}

/**
 * mdToHtml은 사이트용이라 해시태그 줄을 <div class="article-tags">로 만든다.
 * div와 class는 스마트에디터가 통째로 버리거나 예측 불가하게 접으므로,
 * 문단과 순수 텍스트로 풀어서 넘긴다.
 */
export function sanitizeForNaver(html: string): string {
  return html
    .replace(/<div class="article-tags">/g, '<p>')
    .replace(/<span class="article-tag">([^<]*)<\/span>/g, '$1 ')
    .replace(/<\/div>/g, '</p>')
    .replace(/<div[^>]*>/g, '<p>')
    .replace(/\sclass="[^"]*"/g, '')
}

function sourceLink(card: ContentCard): string {
  if (!card.source_url) return ''
  const name = escapeHtml(card.source_name || '원문 보기')
  return `<p><a href="${escapeHtml(card.source_url)}">▶ ${name}</a></p>`
}

function cardBlock(card: ContentCard, index: number): string {
  const num = String(index + 1).padStart(2, '0')
  const parts: string[] = []

  if (card.image_url) {
    parts.push(
      `<p><img src="${escapeHtml(card.image_url)}" alt="${escapeHtml(card.headline)}" /></p>`
    )
  }
  parts.push(`<h3>${num}. ${escapeHtml(card.headline)}</h3>`)
  parts.push(`<p>${captionToHtml(card.caption)}</p>`)
  const src = sourceLink(card)
  if (src) parts.push(src)

  return parts.join('\n')
}

/** HTML → 평문 (리치 붙여넣기가 안 되는 환경용 폴백) */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(h1|h2|h3|p|li|blockquote)>/gi, '\n')
    .replace(/<li>/gi, '· ')
    .replace(/<hr\s*\/?>/gi, '\n———\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function composeNaverPost({
  date,
  cards,
  article,
  trend,
  siteUrl,
}: NaverPostInput): NaverPost {
  const [y, m, d] = date.split('-')
  const blocks: string[] = []

  // 1. 발행 정보 — 지면의 제자 띠에 해당
  blocks.push(
    `<p><strong>${y}.${m}.${d}</strong> · AI가 수집·분석해 매일 06:00 발행합니다.</p>`
  )

  // 2. 카드뉴스 — 리드 기사 + 후속 기사 (사이트와 같은 순서)
  if (cards.length > 0) {
    blocks.push('<hr />')
    blocks.push('<h2>오늘의 카드뉴스</h2>')
    cards.forEach((card, i) => blocks.push(cardBlock(card, i)))
  }

  // 3. AI Pick TOP 3
  const top3 = trend?.top3 ?? []
  if (top3.length > 0) {
    blocks.push('<hr />')
    blocks.push('<h2>AI가 고른 오늘의 TOP 3</h2>')
    const insight = trend?.talking_points?.one_line_insight
    if (insight) {
      blocks.push(`<blockquote>${escapeHtml(insight)}</blockquote>`)
    }
    blocks.push(
      '<ol>' +
        top3
          .map(
            (t) =>
              `<li><strong>${escapeHtml(t.title)}</strong> (${escapeHtml(t.category)})<br />${escapeHtml(t.why)}</li>`
          )
          .join('') +
        '</ol>'
    )
  }

  // 4. 오늘의 대화 소재
  const points = trend?.talking_points?.talking_points ?? []
  if (points.length > 0) {
    blocks.push('<hr />')
    blocks.push('<h2>오늘의 대화 소재</h2>')
    for (const p of points) {
      blocks.push(`<h3>${escapeHtml(p.topic)}</h3>`)
      blocks.push(`<p>${escapeHtml(p.context)}</p>`)
      blocks.push(`<p><strong>Q. ${escapeHtml(p.question)}</strong></p>`)
      blocks.push(`<p>${escapeHtml(p.business_impact)}</p>`)
    }
  }

  // 5. AI 편집장의 리뷰 — 기존 마크다운 변환기를 그대로 재사용
  if (article?.content) {
    blocks.push('<hr />')
    blocks.push('<h2>AI 편집장의 리뷰</h2>')
    if (article.title) {
      blocks.push(`<h3>${escapeHtml(article.title)}</h3>`)
    }
    blocks.push(sanitizeForNaver(mdToHtml(article.content)))
  }

  // 6. 역링크 — 같은 글이 두 곳에 올라가므로 원문 위치를 명시한다
  blocks.push('<hr />')
  blocks.push(
    `<p>이 글은 <a href="${escapeHtml(siteUrl)}/news/${escapeHtml(date)}">시아아빠의 AI 데일리</a>에서 자동 생성된 내용을 옮긴 것입니다. 매일 아침 6시 발행됩니다.</p>`
  )

  const html = blocks.join('\n')
  const title = article?.title
    ? `${article.title} (${y}.${m}.${d} AI 뉴스)`
    : `${y}.${m}.${d} AI 뉴스 브리핑`

  return { title, html, text: htmlToPlainText(html) }
}
