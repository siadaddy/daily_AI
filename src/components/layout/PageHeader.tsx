import type { LucideIcon } from 'lucide-react'

/**
 * 독립 라우트(키워드·에이전트 등)의 지면 머리.
 * 뉴스레터 섹션 머리와 같은 문법을 쓴다 — 굵은 괘선 위 모노 키커,
 * 그 아래 세리프 제목. 네 곳에 흩어져 있던 동일 마크업을 한군데로 모았다.
 */
export function PageHeader({
  icon: Icon,
  kicker,
  title,
  description,
  meta,
}: {
  icon?: LucideIcon
  kicker: string
  title: string
  description?: string
  /** 우측 정렬 모노 보조 정보 (건수 등) */
  meta?: string
}) {
  return (
    <header className="flex flex-col gap-3 border-t-4 border-[var(--text)] pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {Icon && (
          <Icon
            size={13}
            strokeWidth={2}
            aria-hidden="true"
            className="translate-y-px"
            style={{ color: 'var(--muted)' }}
          />
        )}
        <span className="kicker kicker-accent">{kicker}</span>
        {meta && <span className="ed-section-count">{meta}</span>}
      </div>

      <h1 className="ed-headline text-[length:var(--fs-lead)]">{title}</h1>

      {description && (
        <p className="ed-lede max-w-[62ch] text-[0.9375rem]">{description}</p>
      )}
    </header>
  )
}
