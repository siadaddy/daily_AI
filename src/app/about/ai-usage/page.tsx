import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI 활용기 | 시아아빠의 AI 데일리',
  description:
    '반복 업무를 AI 에이전트로 자동화한 과정 — 목적, 방법, 결과, 재현성을 정리한 AI 경진대회 출품 기록입니다.',
}

const METHODS = [
  {
    emoji: '🗞️',
    title: '일일 콘텐츠 파이프라인',
    desc: '수집→기획→작성→디자인→음악 큐레이션 5-에이전트 체인. Groq(4키 failover)로 뉴스 요약, Gemini 2.5-flash(2키, Groq 폴백)로 기획·작성·이미지 프롬프트, HuggingFace FLUX.1로 카드 이미지 생성. GitHub Actions로 매일 06:00 자동 실행.',
    tags: ['Groq llama-3.3-70b', 'Gemini 2.5-flash', 'HF FLUX.1-schnell'],
  },
  {
    emoji: '📈',
    title: '주간 트렌드 브리핑',
    desc: '7일치 뉴스 데이터를 OpenAI gpt-4o-mini에 넘겨 요약·트렌드·인사이트를 구조화된 JSON으로 생성, Vercel Cron으로 매주 월요일 자동 발행.',
    tags: ['OpenAI gpt-4o-mini', 'Vercel Cron'],
  },
  {
    emoji: '🧠',
    title: '에이전트 자기학습 메모리 (핵심 차별점)',
    desc: '박기획·이작가·최디자·한뮤직·AI주간트렌드 — 5개 페르소나가 매일 일지를 남기고, 최근 14일의 성과 데이터에서 힌트를 뽑아 다음 프롬프트에 반영. 7일 이상 지나면 Gemini로 스스로 페르소나를 재작성. 예: "밝은 색이 반응이 좋다"를 학습해 다음 이미지 프롬프트에 자동 반영.',
    tags: ['Gemini 2.5-flash', 'Supabase 영속 메모리'],
  },
  {
    emoji: '🛠️',
    title: '메타: AI로 AI 만드는 도구를 만듦',
    desc: '이 저장소 자체의 개발도 Claude Code 커스텀 서브에이전트(.claude/agents/)로 자동화 — DB 스키마·아키텍처·UI 패턴을 코드에 내재화해 반복 개발 결정을 빠르게 처리.',
    tags: ['Claude Code Subagents'],
  },
]

const RESULT_STATS = [
  { num: '5개', label: 'AI Agent 파이프라인' },
  { num: '06:00', label: '매일 자동 실행' },
  { num: '7일', label: '자기학습 재작성 주기' },
  { num: '8+', label: 'API 키 failover' },
]

export default function AiUsagePage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(28,105,212,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-5xl">🏆</span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase"
              style={{ background: 'var(--gold)', color: '#fff' }}
            >
              AI 경진대회 출품
            </span>
          </div>

          <h1
            className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: 'var(--text)' }}
          >
            AI 활용기 — 시아아빠의 AI 데일리
          </h1>

          <p
            className="mb-8 text-base leading-relaxed"
            style={{ color: 'var(--muted2)' }}
          >
            매일 반복되던 뉴스 수집·정리 업무를 AI 에이전트에게 맡기고,
            <br />그 과정에서 배운 것을 목적 · 방법 · 결과 · 재현성 순으로
            정리했습니다.
          </p>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--bmw)', color: '#fff' }}
          >
            서비스 소개 페이지 보기 →
          </Link>
        </div>
      </section>

      {/* ── 목적 ─────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-3 text-center text-2xl font-bold"
            style={{ color: 'var(--text)' }}
          >
            목적 — 왜 AI로 자동화했나
          </h2>
          <p
            className="mb-10 text-center text-sm"
            style={{ color: 'var(--muted2)' }}
          >
            매일 아침 수십 개 뉴스 사이트를 열어 손으로 정리하던 일이
            있었습니다. 반복적이고, 시간이 걸리고, 사람이 하기엔 지루한 일 —
            AI에게 맡기기 딱 좋은 조건이었습니다.
          </p>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <ul
              className="space-y-2 text-sm"
              style={{ color: 'var(--muted2)' }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--red)' }}>Before</span>
                매일 아침 수동으로 뉴스 사이트를 돌며 스크랩·요약
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--green)' }}>After</span>
                AI 에이전트가 수집부터 발행까지 06:00 이전에 자동 완료
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--red)' }}>Before</span>
                업무에서도 대시보드·차트를 엑셀로 손수 취합·보고
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--green)' }}>After</span>
                같은 자동화 방식을 업무 대시보드에도 적용 —{' '}
                <Link
                  href="/?tab=portfolio"
                  className="underline"
                  style={{ color: 'var(--bmw-lt)' }}
                >
                  포트폴리오에서 사례 확인
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 방법 ─────────────────────────────────── */}
      <section className="px-4 py-16" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-3 text-center text-2xl font-bold"
            style={{ color: 'var(--text)' }}
          >
            방법 — 무엇을 어떻게 만들었나
          </h2>
          <p
            className="mb-12 text-center text-sm"
            style={{ color: 'var(--muted2)' }}
          >
            작업 성격에 맞춰 LLM을 다르게 골라 쓰고, 실패 시 자동 전환되는
            failover 구조로 안정성을 확보했습니다.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {METHODS.map((m) => (
              <div
                key={m.title}
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{m.emoji}</span>
                  <h3 className="font-bold" style={{ color: 'var(--text)' }}>
                    {m.title}
                  </h3>
                </div>
                <p
                  className="mb-3 text-sm leading-relaxed"
                  style={{ color: 'var(--muted2)' }}
                >
                  {m.desc}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                      style={{
                        background: 'rgba(28,105,212,0.12)',
                        color: 'var(--bmw-lt)',
                        border: '1px solid rgba(28,105,212,0.25)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 결과 ─────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-bold"
            style={{ color: 'var(--text)' }}
          >
            결과 — 숫자로 보는 자동화
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {RESULT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div
                  className="mb-1 text-3xl font-bold"
                  style={{ color: 'var(--bmw-lt)' }}
                >
                  {stat.num}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <p
            className="mt-8 text-center text-sm"
            style={{ color: 'var(--muted2)' }}
          >
            업무 프로젝트별 전/후 비교는 정량 수치 대신{' '}
            <Link
              href="/?tab=portfolio"
              className="underline"
              style={{ color: 'var(--bmw-lt)' }}
            >
              포트폴리오 카드
            </Link>
            에 실제 화면(민감정보 블러 처리) 캡처로 증거를 남겼습니다.
          </p>
        </div>
      </section>

      {/* ── 완성도 및 재현성 ─────────────────────── */}
      <section className="px-4 py-16" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-bold"
            style={{ color: 'var(--text)' }}
          >
            완성도 및 재현성
          </h2>

          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <ul
              className="space-y-3 text-sm"
              style={{ color: 'var(--muted2)' }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--green)' }}>▸</span>
                GitHub Actions 스케줄로 매일 운영 중 — 코드와 cron 설정 모두
                레포에서 확인 가능
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--green)' }}>▸</span>
                환경변수 패턴은 프로젝트 CLAUDE.md에 문서화 (API 키 등 민감값은
                비공개)
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--green)' }}>▸</span>
                <a
                  href="https://github.com/siadaddy/daily_AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--bmw-lt)' }}
                >
                  github.com/siadaddy/daily_AI
                </a>{' '}
                — 심사 목적으로 레포 열람 가능
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ───────────────────────────── */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-3xl">🤖</p>
          <h2
            className="mb-3 text-2xl font-bold"
            style={{ color: 'var(--text)' }}
          >
            직접 확인해보세요
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--muted2)' }}>
            매일 자동으로 갱신되는 실제 서비스와 업무 자동화 사례입니다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--bmw)', color: '#fff' }}
            >
              뉴스레터 보기 →
            </Link>
            <Link
              href="/?tab=portfolio"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                background: 'var(--glass)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              포트폴리오 보기 →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
