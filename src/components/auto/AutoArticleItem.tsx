import { ArrowUpRight, Siren } from 'lucide-react'
import type { AutoArticle } from '@/lib/auto/types'

/**
 * 기사 한 건. 상자 없이 괘선과 위계로만 구분한다.
 * 요약과 시사점은 AI 가 쓴 것이므로 시사점은 '해석'임을 라벨로 분명히 한다.
 */
export function AutoArticleItem({
  article,
  lead = false,
}: {
  article: AutoArticle
  lead?: boolean
}) {
  return (
    <article className="flex flex-col gap-2 border-t border-[var(--rule)] pt-4">
      <p className="kicker flex flex-wrap items-center gap-x-3 gap-y-1">
        {article.is_breaking && (
          <span className="kicker-accent flex items-center gap-1">
            <Siren size={11} strokeWidth={2} aria-hidden="true" />
            속보
          </span>
        )}
        <span>{article.source}</span>
        {article.brands.length > 0 && <span>{article.brands.join(' · ')}</span>}
        <span aria-label={`중요도 ${article.importance}`}>
          {'●'.repeat(article.importance)}
          <span style={{ opacity: 0.25 }}>
            {'●'.repeat(5 - article.importance)}
          </span>
        </span>
      </p>

      <h3
        className={
          lead
            ? 'ed-headline text-[1.75rem]'
            : 'ed-display text-[1.125rem] leading-snug'
        }
      >
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {article.title}
          <ArrowUpRight
            size={13}
            strokeWidth={2}
            aria-hidden="true"
            className="ml-1 inline align-baseline"
            style={{ color: 'var(--muted)' }}
          />
        </a>
      </h3>

      {article.title_original && article.title_original !== article.title && (
        <p
          className="font-[family-name:var(--font-mono)] text-[11px]"
          style={{ color: 'var(--muted)' }}
        >
          {article.title_original}
        </p>
      )}

      {article.summary_ko && (
        <p className="ed-lede max-w-3xl text-[0.9375rem]">
          {article.summary_ko}
        </p>
      )}

      {article.so_what && (
        <p className="max-w-3xl text-[0.875rem] leading-relaxed">
          <span className="kicker kicker-accent mr-2">시사점 · AI 해석</span>
          {article.so_what}
        </p>
      )}
    </article>
  )
}
