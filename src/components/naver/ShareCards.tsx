'use client'

import { useState } from 'react'
import { Share2, Check, AlertTriangle, Loader2 } from 'lucide-react'

type Phase = 'idle' | 'loading' | 'ready' | 'shared' | 'unsupported' | 'failed'

/**
 * 카드 이미지를 기기 공유 시트로 한 번에 넘긴다.
 *
 * 모바일에서 이미지를 한 장씩 길게 눌러 저장하고 앨범에서 다시 첨부하는 건
 * 매일 할 짓이 못 된다. Web Share API로 5장을 한 번에 넘기면 네이버 블로그 앱을
 * 바로 고르거나 사진에 일괄 저장할 수 있다.
 *
 * iOS Safari는 share()가 사용자 제스처와 같은 태스크에서 불리길 요구해서,
 * 이미지를 먼저 받아오는 동안 제스처 컨텍스트가 끊기면 NotAllowedError가 난다.
 * 그래서 받아온 파일을 들고 있다가, 그 경우 "한 번 더" 누르면 즉시 공유한다.
 */
export function ShareCards({
  date,
  count,
  layout = 'tall',
  label: labelText,
}: {
  date: string
  count: number
  /** tall = 세로형(모바일), wide = 가로형(PC) */
  layout?: 'tall' | 'wide'
  label?: string
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<File[] | null>(null)

  const supported =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function fetchCards(): Promise<File[]> {
    const out: File[] = []
    for (let i = 0; i < count; i++) {
      const q = layout === 'wide' ? '?layout=wide' : ''
      const res = await fetch(`/api/naver-card/${date}/${i}${q}`)
      if (!res.ok) throw new Error(`card ${i} ${res.status}`)
      const blob = await res.blob()
      out.push(
        new File(
          [blob],
          `${date}_${layout}_${String(i + 1).padStart(2, '0')}.png`,
          { type: 'image/png' }
        )
      )
      setProgress(i + 1)
    }
    return out
  }

  async function share(ready: File[]) {
    // canShare는 files 지원 여부까지 확인해 준다 (데스크톱 크롬은 대개 false)
    if (navigator.canShare && !navigator.canShare({ files: ready })) {
      setPhase('unsupported')
      return
    }
    await navigator.share({
      files: ready,
      title: `${date} AI 뉴스 카드`,
    })
    setPhase('shared')
  }

  async function onClick() {
    if (!supported) {
      setPhase('unsupported')
      return
    }
    try {
      // 이미 받아둔 게 있으면 제스처 안에서 바로 공유 — iOS 재시도 경로
      if (files) {
        await share(files)
        return
      }
      setPhase('loading')
      setProgress(0)
      const ready = await fetchCards()
      setFiles(ready)
      await share(ready)
    } catch (e) {
      // 사용자가 공유 시트를 닫은 건 실패가 아니다
      if (e instanceof DOMException && e.name === 'AbortError') {
        setPhase(files ? 'ready' : 'idle')
        return
      }
      setPhase(files ? 'ready' : 'failed')
    }
  }

  const label =
    phase === 'loading'
      ? `이미지 준비 중 ${progress}/${count}`
      : phase === 'shared'
        ? '공유했습니다'
        : phase === 'ready'
          ? '한 번 더 눌러 공유'
          : (labelText ?? `카드 이미지 ${count}장 공유`)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={phase === 'loading'}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-[var(--rule-strong)] px-5 py-3 font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] uppercase transition-colors hover:bg-[var(--glass)] disabled:opacity-60"
        style={{ color: 'var(--text)' }}
      >
        {phase === 'loading' ? (
          <Loader2
            size={14}
            strokeWidth={2}
            className="animate-spin"
            aria-hidden="true"
          />
        ) : phase === 'shared' ? (
          <Check size={14} strokeWidth={2} aria-hidden="true" />
        ) : phase === 'failed' || phase === 'unsupported' ? (
          <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
        )}
        {label}
      </button>

      <p aria-live="polite" className="kicker">
        {phase === 'unsupported' &&
          '이 브라우저는 파일 공유를 지원하지 않습니다. 아래 이미지를 길게 눌러 저장하세요.'}
        {phase === 'failed' && '가져오지 못했습니다. 다시 시도해 주세요.'}
        {phase === 'shared' && '네이버 블로그 앱이나 사진 앱을 고르면 됩니다'}
        {(phase === 'idle' || phase === 'loading' || phase === 'ready') &&
          '모바일에서 공유 시트로 한 번에 넘깁니다'}
      </p>
    </div>
  )
}
