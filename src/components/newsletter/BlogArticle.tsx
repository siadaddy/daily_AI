import { mdToHtml } from '@/lib/utils/caption'

export function BlogArticle({
  title,
  content,
}: {
  title?: string | null
  content?: string | null
}) {
  if (!content) return null

  return (
    <section className="glass-card overflow-hidden">
      {/* 헤더 */}
      <div
        className="px-6 py-4"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">✍️</span>
          <span className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--bmw-lt)' }}>
            AI 편집장의 오늘의 리뷰
          </span>
        </div>
        {title && (
          <h2 className="mt-1 text-base font-bold leading-snug" style={{ color: 'var(--text)' }}>
            {title}
          </h2>
        )}
      </div>

      {/* 본문 */}
      <div
        className="article-body px-6 py-5"
        dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
      />
    </section>
  )
}
