import { mdToHtml, readingMinutes } from '@/lib/utils/caption'

export function BlogArticle({
  title,
  content,
  date,
}: {
  title?: string | null
  content?: string | null
  date?: string
}) {
  if (!content) return null

  const mins = readingMinutes(content)
  const displayDate = date
    ? new Date(date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
    : null

  return (
    <section className="blog-article">
      {/* 상단 액센트 라인 */}
      <div className="blog-accent" />

      {/* 헤더 */}
      <div className="blog-header">
        {title && (
          <h2 className="blog-title">{title}</h2>
        )}

        <div className="blog-meta">
          {displayDate && (
            <span className="blog-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              {displayDate}
            </span>
          )}
          <span className="blog-meta-dot">·</span>
          <span className="blog-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            약 {mins}분 읽기
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div
        className="article-body blog-body"
        dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
      />
    </section>
  )
}
