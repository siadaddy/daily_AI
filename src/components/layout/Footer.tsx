export function Footer() {
  return (
    <footer
      className="mt-auto border-t py-6 text-center text-xs"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      <p>🤖 시아아빠의 AI 데일리 · Claude Code와 함께 제작 · AI Agent로 콘텐츠 자동 생성</p>
      <p className="mt-1">
        Powered by{' '}
        <span style={{ color: 'var(--bmw-lt)' }}>Next.js · Supabase · GitHub Actions</span>
      </p>
    </footer>
  )
}
