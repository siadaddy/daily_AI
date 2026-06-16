export function Footer() {
  return (
    <footer
      className="mt-auto border-t py-6 text-center text-xs"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      <p>🤖 시아아빠의 AI 데일리 · 매일 새벽 Gemini AI가 자동 생성</p>
      <p className="mt-1">
        Powered by{' '}
        <span style={{ color: 'var(--bmw-lt)' }}>Next.js · Supabase · HuggingFace FLUX</span>
      </p>
    </footer>
  )
}
