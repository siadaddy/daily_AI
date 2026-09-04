import { describe, it, expect } from 'vitest'
import {
  composeNaverPost,
  escapeHtml,
  htmlToPlainText,
  sanitizeForNaver,
} from './compose'
import type { ContentCard, NewsTrend } from '@/lib/types'

const card = (over: Partial<ContentCard> = {}): ContentCard => ({
  headline: '오픈AI, GPT-6 공개',
  caption: '[사실] 어제 공개됐다.\n[분석] 파장이 크다.',
  image_url: 'https://img.example.com/a.png',
  source_url: 'https://news.example.com/1',
  source_name: '연합뉴스',
  ...over,
})

const base = {
  date: '2026-09-04',
  cards: [] as ContentCard[],
  article: null,
  trend: null,
  siteUrl: 'https://siadaddy-ai.vercel.app',
}

describe('escapeHtml', () => {
  it('마크업 문자를 이스케이프한다', () => {
    expect(escapeHtml('<script>&"')).toBe('&lt;script&gt;&amp;&quot;')
  })
})

describe('composeNaverPost', () => {
  it('스마트에디터가 버리는 태그를 만들지 않는다', () => {
    const { html } = composeNaverPost({
      ...base,
      cards: [card()],
      // 해시태그 줄은 mdToHtml이 div로 감싼다 — 그것까지 걸러지는지 확인
      article: {
        title: '리뷰',
        content: '## 소제목\n본문입니다.\n#AI #GPT6',
      },
    })
    // div·table·flex 레이아웃은 붙여넣기에서 무너지므로 애초에 쓰지 않는다
    expect(html).not.toMatch(/<div|<table|<section/)
    // CSS 변수는 네이버에서 해석되지 않는다
    expect(html).not.toContain('var(--')
    expect(html).not.toContain('class=')
  })

  it('사이트와 같은 순서로 섹션을 쌓는다', () => {
    const trend = {
      top3: [{ rank: 1, title: 'A', category: 'AI', why: '중요' }],
      talking_points: {
        one_line_insight: '한 줄 인사이트',
        talking_points: [
          {
            topic: '주제',
            context: '맥락',
            question: '질문',
            business_impact: '함의',
          },
        ],
      },
    } as unknown as NewsTrend

    const { html } = composeNaverPost({
      ...base,
      cards: [card()],
      trend,
      article: { title: '리뷰', content: '본문' },
    })

    const order = [
      '오늘의 카드뉴스',
      'TOP 3',
      '오늘의 대화 소재',
      'AI 편집장의 리뷰',
    ]
    const positions = order.map((h) => html.indexOf(h))
    expect(positions.every((p) => p >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('캡션 강조를 리터럴 색으로 바꾸고 줄바꿈을 유지한다', () => {
    const { html } = composeNaverPost({ ...base, cards: [card()] })
    expect(html).toContain('color:#1f7a4d') // [사실]
    expect(html).toContain('color:#1a56b8') // [분석]
    expect(html).toContain('<br />')
  })

  it('카드 번호와 이미지·출처를 함께 싣는다', () => {
    const { html } = composeNaverPost({ ...base, cards: [card(), card()] })
    expect(html).toContain('<h3>01.')
    expect(html).toContain('<h3>02.')
    expect(html).toContain('<img src="https://img.example.com/a.png"')
    expect(html).toContain('href="https://news.example.com/1"')
  })

  it('출처가 없는 카드도 깨지지 않는다', () => {
    const { html } = composeNaverPost({
      ...base,
      cards: [card({ source_url: '', image_url: null })],
    })
    expect(html).toContain('오픈AI, GPT-6 공개')
    expect(html).not.toContain('<img')
  })

  it('중복 콘텐츠 대비로 원문 역링크를 항상 넣는다', () => {
    const { html } = composeNaverPost(base)
    expect(html).toContain('/news/2026-09-04')
  })

  it('콘텐츠가 비어도 제목과 본문을 만든다', () => {
    const { title, html, text } = composeNaverPost(base)
    expect(title).toBe('2026.09.04 AI 뉴스 브리핑')
    expect(html.length).toBeGreaterThan(0)
    expect(text).toContain('2026.09.04')
  })

  it('아티클 제목이 있으면 블로그 제목에 쓴다', () => {
    const { title } = composeNaverPost({
      ...base,
      article: { title: 'GPT-6가 바꾼 것', content: '본문' },
    })
    expect(title).toBe('GPT-6가 바꾼 것 (2026.09.04 AI 뉴스)')
  })

  it('사용자 콘텐츠의 마크업을 이스케이프한다', () => {
    const { html } = composeNaverPost({
      ...base,
      cards: [card({ headline: '<img onerror=x>', caption: 'a' })],
    })
    expect(html).toContain('&lt;img onerror=x&gt;')
  })
})

describe('htmlToPlainText', () => {
  it('태그를 걷어내고 줄바꿈을 살린다', () => {
    const out = htmlToPlainText(
      '<h2>제목</h2><p>본문<br />다음 줄</p><li>항목</li>'
    )
    expect(out).toContain('제목')
    expect(out).toContain('본문\n다음 줄')
    expect(out).toContain('· 항목')
    expect(out).not.toContain('<')
  })

  it('엔티티를 되돌린다', () => {
    expect(htmlToPlainText('<p>a &amp; b &quot;c&quot;</p>')).toBe('a & b "c"')
  })
})

describe('sanitizeForNaver', () => {
  it('해시태그 div를 문단과 순수 텍스트로 푼다', () => {
    const out = sanitizeForNaver(
      '<div class="article-tags"><span class="article-tag">#AI</span></div>'
    )
    expect(out).not.toContain('<div')
    expect(out).not.toContain('class=')
    expect(out).toContain('#AI')
  })

  it('남은 class 속성을 모두 제거한다', () => {
    expect(sanitizeForNaver('<p class="x">a</p>')).toBe('<p>a</p>')
  })
})
