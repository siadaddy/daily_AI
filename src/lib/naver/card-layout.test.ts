import { describe, it, expect } from 'vitest'
import {
  pickLayout,
  cutAtSentence,
  CARD_H,
  CHROME,
  TEXT_W,
  AVG_CHAR_RATIO,
} from './card-layout'

/** pickLayout이 고른 조합에서 캡션이 실제로 들어가는지 되계산 */
function fits(headline: string, caption: string) {
  const l = pickLayout(headline, caption)
  const headlineH = Math.max(1, Math.ceil(headline.length / 16)) * 72
  const avail = CARD_H - CHROME - l.photo - headlineH
  const perLine = Math.floor(TEXT_W / (l.font * AVG_CHAR_RATIO))
  const shown = Math.min(caption.length, l.maxChars)
  return Math.ceil(shown / perLine) * l.font * 1.6 <= avail
}

const HEADLINE = 'BYD, 유럽 시장 전략 수정!' // 실제 길이대
const cap = (n: number) => '가'.repeat(n)

describe('pickLayout', () => {
  it('실제 캡션 길이(250~340자)를 자르지 않는다', () => {
    // 이 범위를 자르고 있던 것이 원래 버그였다
    for (const n of [252, 255, 300, 328, 336]) {
      const l = pickLayout(HEADLINE, cap(n))
      expect(l.maxChars, `${n}자에서 잘림`).toBeGreaterThanOrEqual(n)
    }
  })

  it('고른 조합에 캡션이 실제로 들어간다', () => {
    for (const n of [50, 150, 252, 336, 500, 900]) {
      expect(fits(HEADLINE, cap(n)), `${n}자에서 넘침`).toBe(true)
    }
  })

  it('캡션이 길수록 사진과 글자를 줄인다', () => {
    const short = pickLayout(HEADLINE, cap(120))
    const long = pickLayout(HEADLINE, cap(336))
    expect(long.photo).toBeLessThanOrEqual(short.photo)
    expect(long.font).toBeLessThanOrEqual(short.font)
  })

  it('짧은 캡션에서는 가장 큰 사진을 쓴다', () => {
    expect(pickLayout(HEADLINE, cap(80)).photo).toBe(620)
  })

  it('헤드라인이 길면 그만큼 캡션 공간을 양보한다', () => {
    const shortH = pickLayout('짧은 제목', cap(300))
    const longH = pickLayout(
      '아주 긴 제목이 두 줄을 넘어가는 경우를 상정한다',
      cap(300)
    )
    expect(longH.photo).toBeLessThanOrEqual(shortH.photo)
  })

  it('감당 못 할 길이는 잘라내되 조판은 유지한다', () => {
    const l = pickLayout(HEADLINE, cap(3000))
    expect(l.maxChars).toBeLessThan(3000)
    expect(l.maxChars).toBeGreaterThan(0)
    expect(fits(HEADLINE, cap(3000))).toBe(true)
  })
})

describe('cutAtSentence', () => {
  it('한도 이내면 그대로 둔다', () => {
    expect(cutAtSentence('짧은 문장이다.', 100)).toBe('짧은 문장이다.')
  })

  it('경계가 뒤쪽에 있으면 문장 끝에서 끊는다', () => {
    // '.'이 13번째 — 한도 20의 55%(11)를 넘으므로 문장 경계를 쓴다
    const out = cutAtSentence(
      '가나다라마바사아자차카타파.하하하하하하하하하하',
      20
    )
    expect(out).toBe('가나다라마바사아자차카타파.…')
  })

  it('경계가 너무 앞이면 그냥 자른다 — 본문이 과하게 날아가지 않도록', () => {
    const out = cutAtSentence(
      '가. 나나나나나나나나나나나나나나나나나나나나',
      20
    )
    expect(out.length).toBeGreaterThan(10)
    expect(out.endsWith('…')).toBe(true)
  })
})
