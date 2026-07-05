/**
 * Caption/article 텍스트를 HTML로 변환
 * - \n → <br>
 * - [사실] → 초록, [분석] → 파랑, [전망] → 보라 강조
 */
export function highlightCaption(text: string): string {
  return text
    .replace(
      /\[사실\]/g,
      '<span style="color:var(--green);font-weight:700">[사실]</span>'
    )
    .replace(
      /\[분석\]/g,
      '<span style="color:#60a5fa;font-weight:700">[분석]</span>'
    )
    .replace(
      /\[전망\]/g,
      '<span style="color:var(--accent2);font-weight:700">[전망]</span>'
    )
    .replace(/\n/g, '<br/>')
}

/**
 * 마크다운 → HTML 변환 (블로그 아티클용)
 * # h1 / ## h2 / ### h3 / - li / **bold** / > blockquote / #태그 지원
 */
export function mdToHtml(md: string): string {
  const normalized = md.replace(/\\n/g, '\n')
  const lines = normalized.split('\n')
  let html = ''
  let inList = false

  const isHashtagLine = (s: string) =>
    s.length > 0 && s.split(/\s+/).every((w) => w.startsWith('#'))

  for (const line of lines) {
    const l = line.trim()

    if (l.startsWith('### ')) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<h3>${l.slice(4)}</h3>`
    } else if (l.startsWith('## ')) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<h2>${l.slice(3)}</h2>`
    } else if (l.startsWith('# ')) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<h1>${l.slice(2)}</h1>`
    } else if (l.startsWith('> ')) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<blockquote>${l.slice(2)}</blockquote>`
    } else if (l.startsWith('- ')) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      html += `<li>${l.slice(2)}</li>`
    } else if (isHashtagLine(l)) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      const tags = l
        .split(/\s+/)
        .map((t) => `<span class="article-tag">${t}</span>`)
        .join('')
      html += `<div class="article-tags">${tags}</div>`
    } else if (l) {
      if (inList) {
        html += '</ul>'
        inList = false
      }
      html += `<p>${l}</p>`
    }
  }
  if (inList) html += '</ul>'

  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

/** 한국어 기준 읽기 예상 시간 (분) */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.replace(/\s/g, '').length / 350))
}
