/**
 * 네이버 카드 이미지의 판형 계산.
 *
 * 라우트(next/og)와 분리해 두면 순수 함수라 테스트할 수 있다.
 */

/** 네이버 카드뉴스 관행에 맞춘 4:5 세로 판형 */
export const CARD_W = 1080
export const CARD_H = 1350

/**
 * 캡션을 자르지 않고 담는 것이 우선이다.
 *
 * 실제 캡션은 250~340자로, 처음 잡았던 고정 150자 예산은 본문의 절반을
 * 버리고 있었다. 대신 사진을 줄이고 글자를 줄여 전부 들어가는 조합을 찾는다.
 *
 * 텍스트 영역 = 1350 - 96(제자 띠) - 사진 - 92(상하 여백)
 *              - 헤드라인 - 63(액센트 괘선) - 66(출처 푸터)
 *
 * 한 줄 글자수를 968/fontSize(= 한글 1em)로 잡았더니 실제보다 훨씬 적게
 * 계산돼 사진을 필요 이상으로 줄이고 아래에 큰 여백을 남겼다. 캡션에는
 * 공백·숫자·라틴이 섞여 평균 글자폭이 0.85em 정도다 — 실측(폰트 27px에서
 * 336자가 7줄 ≈ 48자/줄)에 맞춰 보정한다.
 */
export const TEXT_W = 968
export const AVG_CHAR_RATIO = 0.85
export const CHROME = 96 + 92 + 63 + 66 // 제자 띠 + 여백 + 괘선 + 푸터

export interface CardLayout {
  photo: number
  font: number
  maxChars: number
}

/** 사진·글씨가 큰 조합부터 시도해 캡션이 통째로 들어가는 첫 조합을 쓴다 */
export function pickLayout(headline: string, caption: string): CardLayout {
  const headlineH = Math.max(1, Math.ceil(headline.length / 16)) * 72
  const candidates = [
    { photo: 620, font: 30 },
    { photo: 560, font: 29 },
    { photo: 480, font: 28 },
    { photo: 420, font: 27 },
    { photo: 360, font: 26 },
    { photo: 300, font: 25 },
  ]

  for (const c of candidates) {
    const avail = CARD_H - CHROME - c.photo - headlineH
    const perLine = Math.floor(TEXT_W / (c.font * AVG_CHAR_RATIO))
    const lines = Math.ceil(caption.length / perLine)
    if (lines * c.font * 1.6 <= avail) {
      return { ...c, maxChars: caption.length }
    }
  }

  // 어떤 조합으로도 안 들어가면 가장 빽빽한 조합에서 잘라낸다
  const last = candidates[candidates.length - 1]
  const avail = CARD_H - CHROME - last.photo - headlineH
  const perLine = Math.floor(TEXT_W / (last.font * AVG_CHAR_RATIO))
  const maxLines = Math.max(1, Math.floor(avail / (last.font * 1.6)))
  return { ...last, maxChars: maxLines * perLine }
}

/** 부득이 잘라야 하면 문장 경계에서 끊는다 — 단어 중간에서 끊기지 않도록 */
export function cutAtSentence(text: string, max: number): string {
  if (text.length <= max) return text
  const slice = text.slice(0, max)
  const boundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?')
  )
  const cut = boundary > max * 0.55 ? slice.slice(0, boundary + 1) : slice
  return cut.trimEnd() + '…'
}

/* ── 가로형(16:9) ────────────────────────────────────────────
   PC 블로그 본문 폭에 맞는 판형. 사진이 왼쪽 46%, 글이 오른쪽을 쓴다.
   세로형과 달리 사진 크기가 고정이라, 캡션이 길면 글자만 줄인다. */

export const WIDE_W = 1600
export const WIDE_H = 900
/** 사진이 차지하는 좌측 폭 */
export const WIDE_PHOTO_W = 736
/** 글 영역의 실제 글자 폭 (전체 - 사진 - 좌우 여백) */
export const WIDE_TEXT_W = WIDE_W - WIDE_PHOTO_W - 56 * 2
/** 제자 띠 + 상하 여백 + 액센트 괘선 + 출처 푸터 */
export const WIDE_CHROME = 72 + 88 + 48 + 60

export interface WideLayout {
  font: number
  maxChars: number
}

/**
 * 가로형은 사진 폭이 고정이라 글자 크기만으로 맞춘다.
 * 헤드라인은 우측 폭 기준으로 줄 수를 센다(48px 세리프 ≈ 줄당 15자).
 */
export function pickWideLayout(headline: string, caption: string): WideLayout {
  const headlineLines = Math.max(1, Math.ceil(headline.length / 15))
  const headlineH = headlineLines * 60
  const avail = WIDE_H - WIDE_CHROME - headlineH

  for (const font of [30, 29, 28, 27, 26, 25, 24]) {
    const perLine = Math.floor(WIDE_TEXT_W / (font * AVG_CHAR_RATIO))
    const lines = Math.ceil(caption.length / perLine)
    if (lines * font * 1.6 <= avail) return { font, maxChars: caption.length }
  }

  const font = 24
  const perLine = Math.floor(WIDE_TEXT_W / (font * AVG_CHAR_RATIO))
  const maxLines = Math.max(1, Math.floor(avail / (font * 1.6)))
  return { font, maxChars: maxLines * perLine }
}
