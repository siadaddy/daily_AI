'use client'

import { useRef, useState } from 'react'
import { Check, Copy, AlertTriangle } from 'lucide-react'

type Status = 'idle' | 'copied' | 'failed'

/**
 * 서식을 유지한 채 클립보드에 담는다.
 *
 * 두 경로를 둔다:
 *  1) ClipboardItem으로 text/html + text/plain 동시 기록 — 최신 브라우저의 정공법
 *  2) 실패하면 실제 DOM을 선택해 execCommand('copy') — 구식이지만 서식 복사에
 *     한해서는 여전히 가장 넓게 동작하고, 권한 프롬프트도 없다
 * 둘 다 실패하면 사용자가 직접 드래그할 수 있게 안내한다.
 */
export function CopyForNaver({
  html,
  text,
  title,
  previewId,
}: {
  html: string
  text: string
  title: string
  /** 폴백에서 선택할 미리보기 DOM의 id */
  previewId: string
}) {
  const [body, setBody] = useState<Status>('idle')
  const [heading, setHeading] = useState<Status>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flash(set: (s: Status) => void, s: Status) {
    set(s)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => set('idle'), 2500)
  }

  async function copyRich() {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ])
        flash(setBody, 'copied')
        return
      }
      throw new Error('ClipboardItem unsupported')
    } catch {
      // 폴백: 미리보기 DOM을 선택해 복사 — 서식이 그대로 따라간다
      try {
        const node = document.getElementById(previewId)
        if (!node) throw new Error('preview not found')
        const range = document.createRange()
        range.selectNodeContents(node)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
        const ok = document.execCommand('copy')
        sel?.removeAllRanges()
        flash(setBody, ok ? 'copied' : 'failed')
      } catch {
        flash(setBody, 'failed')
      }
    }
  }

  async function copyTitle() {
    try {
      await navigator.clipboard.writeText(title)
      flash(setHeading, 'copied')
    } catch {
      flash(setHeading, 'failed')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyRich}
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--rule-strong)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] uppercase transition-colors hover:bg-[var(--glass)]"
          style={{ color: 'var(--text)' }}
        >
          {body === 'copied' ? (
            <Check size={13} strokeWidth={2} aria-hidden="true" />
          ) : body === 'failed' ? (
            <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Copy size={13} strokeWidth={2} aria-hidden="true" />
          )}
          본문 복사 (서식 유지)
        </button>

        <button
          type="button"
          onClick={copyTitle}
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs tracking-[0.1em] uppercase transition-colors hover:bg-[var(--glass)]"
          style={{ color: 'var(--muted2)' }}
        >
          {heading === 'copied' ? (
            <Check size={13} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Copy size={13} strokeWidth={2} aria-hidden="true" />
          )}
          제목 복사
        </button>
      </div>

      <p aria-live="polite" className="kicker">
        {body === 'copied' && '복사됐습니다 — 스마트에디터에 ⌘V / Ctrl+V'}
        {body === 'failed' &&
          '복사에 실패했습니다. 아래 미리보기를 직접 드래그해 복사하세요.'}
        {body === 'idle' && heading === 'copied' && '제목이 복사됐습니다'}
        {body === 'idle' && heading !== 'copied' && ' '}
      </p>
    </div>
  )
}
