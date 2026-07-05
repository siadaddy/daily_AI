import { describe, it, expect } from 'vitest'
import { highlightCaption, mdToHtml, readingMinutes } from './caption'

describe('highlightCaption', () => {
  it('[사실]/[분석]/[전망] 태그를 색상 span으로 감싼다', () => {
    const html = highlightCaption('[사실] A\n[분석] B\n[전망] C')
    expect(html).toContain('>[사실]</span>')
    expect(html).toContain('>[분석]</span>')
    expect(html).toContain('>[전망]</span>')
    expect(html).toContain('<br/>')
  })
})

describe('mdToHtml', () => {
  it('헤딩/리스트/볼드/인용을 변환한다', () => {
    const html = mdToHtml(
      '# 제목\n## 부제\n- 항목1\n- 항목2\n> 인용\n**강조** 본문'
    )
    expect(html).toContain('<h1>제목</h1>')
    expect(html).toContain('<h2>부제</h2>')
    expect(html).toContain('<ul><li>항목1</li><li>항목2</li></ul>')
    expect(html).toContain('<blockquote>인용</blockquote>')
    expect(html).toContain('<strong>강조</strong>')
  })

  it('리스트가 문서 끝에서 닫힌다', () => {
    const html = mdToHtml('- a\n- b')
    expect(html.endsWith('</ul>')).toBe(true)
  })

  it('해시태그 줄을 태그 목록으로 변환한다', () => {
    const html = mdToHtml('본문\n#AI #뉴스')
    expect(html).toContain('article-tags')
    expect(html).toContain('#AI')
  })

  it('이스케이프된 \\n(리터럴)을 개행으로 정규화한다', () => {
    const html = mdToHtml('# 제목\\n본문')
    expect(html).toContain('<h1>제목</h1>')
    expect(html).toContain('<p>본문</p>')
  })
})

describe('readingMinutes', () => {
  it('최소 1분을 보장한다', () => {
    expect(readingMinutes('짧음')).toBe(1)
  })

  it('350자당 1분으로 계산한다 (공백 제외)', () => {
    expect(readingMinutes('가'.repeat(700))).toBe(2)
  })
})
