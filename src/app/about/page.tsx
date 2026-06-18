import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '서비스 소개 | 시아아빠의 AI 데일리',
  description:
    'AI Agent가 매일 아침 뉴스를 수집·분석·정리해 자동 발행하는 개인 AI 뉴스 플랫폼의 소개 페이지입니다.',
}

const PIPELINE_STEPS = [
  {
    emoji: '🌐',
    step: 'Step 1',
    title: '뉴스 수집',
    desc: '네이버 뉴스 API로 AI, 기술, 경제, 자동차, BMW 등 9개 카테고리 뉴스 자동 수집',
    color: 'var(--bmw)',
  },
  {
    emoji: '🤖',
    step: 'Step 2',
    title: 'AI 분석·요약',
    desc: 'Gemini AI가 핵심 키워드 추출, 3줄 요약, 중요도 스코어링으로 의미 있는 뉴스만 선별',
    color: 'var(--accent2)',
  },
  {
    emoji: '🎨',
    step: 'Step 3',
    title: '카드뉴스 생성',
    desc: '선별된 뉴스를 헤드라인 + 캡션 형태의 카드뉴스로 자동 변환, 이미지 매칭',
    color: 'var(--green)',
  },
  {
    emoji: '📊',
    step: 'Step 4',
    title: 'TOP 3 선정',
    desc: '당일 가장 중요한 뉴스 3개를 선정하고 "왜 중요한가" 이유까지 AI가 직접 작성',
    color: 'var(--gold)',
  },
  {
    emoji: '✍️',
    step: 'Step 5',
    title: 'AI 에디터 리뷰',
    desc: '하루 전체 뉴스 흐름을 분석한 블로그 포스트를 AI 에디터가 자동 작성',
    color: 'var(--bmw-lt)',
  },
  {
    emoji: '🗄️',
    step: 'Step 6',
    title: 'DB 저장',
    desc: 'Supabase에 날짜별로 차곡차곡 누적 저장 — 60일 이상 아카이브 유지',
    color: 'var(--red)',
  },
  {
    emoji: '📱',
    step: 'Step 7',
    title: '자동 발행',
    desc: 'GitHub Actions 스케줄로 매일 06:40 자동 실행 → 웹에 즉시 게시',
    color: 'var(--accent2)',
  },
]

const AGENTS = [
  {
    emoji: '🕷️',
    name: '수집봇',
    nameEn: 'Collector Agent',
    role: '뉴스 크롤링 & 카테고리 분류',
    model: 'GitHub Actions + Python',
    tasks: ['네이버 뉴스 API 검색', '키워드별 수집', '중복 제거', '카테고리 태깅'],
  },
  {
    emoji: '🔍',
    name: '분석봇',
    nameEn: 'Analyst Agent',
    role: '핵심 인사이트 추출',
    model: 'Gemini 2.5-flash / Groq llama-3.3-70b',
    tasks: ['키워드 추출', '3줄 요약', '중요도 스코어링', 'TOP 3 선정'],
  },
  {
    emoji: '🎨',
    name: '디자인봇',
    nameEn: 'Designer Agent',
    role: '카드뉴스 콘텐츠 생성',
    model: 'Gemini 2.5-flash + HF FLUX.1',
    tasks: ['헤드라인 작성', '캡션 생성', '이미지 키워드 추출', '카드 레이아웃'],
  },
  {
    emoji: '✍️',
    name: '에디터봇',
    nameEn: 'Editor Agent',
    role: 'AI 에디터 리뷰 작성',
    model: 'Gemini 2.5-flash / Groq llama-3.3-70b',
    tasks: ['일일 뉴스 종합', '흐름 분석', '블로그 포스트 작성', '인사이트 도출'],
  },
  {
    emoji: '📋',
    name: '매니저봇',
    nameEn: 'Manager Agent',
    role: '전체 파이프라인 관리',
    model: 'GitHub Actions',
    tasks: ['스케줄 실행', '오류 감지', 'DB 저장 조율', '발행 트리거'],
  },
]

const FEATURES = [
  { emoji: '📰', title: 'AI 뉴스레터', desc: '매일 자동 생성되는 카드뉴스 — 아침에 열면 이미 준비되어 있음' },
  { emoji: '📊', title: '트렌드 리포트', desc: '주간 뉴스 통계 & 카테고리별 빈도 분석 차트' },
  { emoji: '🗓️', title: '60일 아카이브', desc: '날짜 선택으로 과거 뉴스 탐색 — 흐름 추적 가능' },
  { emoji: '📈', title: '실시간 시장 지수', desc: 'KOSPI, NASDAQ, S&P500, 비트코인, 금, 유가 실시간 표시' },
  { emoji: '🏷️', title: '카테고리 필터', desc: 'AI · 기술 · 경제 · 자동차 · BMW 등 9개 분야 필터링' },
  { emoji: '🌙', title: '다크 / 라이트 모드', desc: '눈에 편한 테마 전환 — 시스템 설정 연동' },
]

const STACK = [
  { category: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4'] },
  { category: 'Backend', items: ['Supabase', 'PostgreSQL', 'Realtime Subscriptions'] },
  { category: 'AI', items: ['Gemini 2.5-flash', 'Groq llama-3.3-70b', 'GPT-4o-mini', 'HF FLUX.1-schnell'] },
  { category: 'Infra', items: ['GitHub Actions', 'Vercel', 'Open-Meteo', 'Yahoo Finance'] },
]

export default function AboutPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-20 text-center">
        {/* 배경 글로우 */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(28,105,212,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="text-5xl">🤖</span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'var(--green)', color: '#fff' }}
            >
              LIVE
            </span>
          </div>

          <h1
            className="mb-4 text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: 'var(--text)' }}
          >
            시아아빠의 AI 데일리
          </h1>

          <p
            className="mb-3 text-xl font-medium md:text-2xl"
            style={{ color: 'var(--bmw-lt)' }}
          >
            AI가 뉴스를 읽고, 당신은 인사이트를 얻는다
          </p>

          <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--muted2)' }}>
            매일 06:40, AI Agent가 뉴스를 수집·분석·정리해 자동 발행합니다.
            <br />
            당신이 아침을 시작할 때 이미 모든 준비가 되어 있습니다.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--bmw)', color: '#fff' }}
          >
            오늘의 뉴스레터 보기 →
          </Link>
        </div>
      </section>

      {/* ── Problem → Solution ───────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            왜 만들었나
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Problem */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="text-2xl">😩</span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--red)' }}>
                  Problem
                </h3>
              </div>
              <p className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>
                아침마다 쏟아지는 뉴스, 다 볼 수 없잖아요
              </p>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted2)' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--red)' }}>✕</span>
                  수십 개 탭을 열어 하나하나 확인하는 시간 낭비
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--red)' }}>✕</span>
                  같은 뉴스가 여러 곳에 중복 — 뭐가 진짜 중요한지 모름
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--red)' }}>✕</span>
                  AI, 경제, 자동차 — 분야가 달라 각각 찾아야 함
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--red)' }}>✕</span>
                  지난 뉴스 흐름 파악이 어렵고 아카이브도 없음
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(16,185,129,0.2)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--green)' }}>
                  Solution
                </h3>
              </div>
              <p className="mb-4 font-semibold" style={{ color: 'var(--text)' }}>
                AI Agent가 대신 읽고 핵심만 전달
              </p>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--muted2)' }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  수십 개 소스 자동 수집 — 아침에 열면 이미 준비됨
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  AI가 중요도 스코어링해 TOP 3 핵심 뉴스 선정
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  10개 카테고리 자동 분류 + 카테고리별 필터링
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: 'var(--green)' }}>✓</span>
                  60일 아카이브로 뉴스 흐름 & 트렌드 분석 가능
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Pipeline Flow ─────────────────────── */}
      <section className="px-4 py-16" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--bmw-lt)' }}>
            자동화 파이프라인
          </div>
          <h2 className="mb-4 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            매일 06:40, 이렇게 동작합니다
          </h2>
          <p className="mb-12 text-center text-sm" style={{ color: 'var(--muted2)' }}>
            GitHub Actions 스케줄 트리거 → AI Agent 체인 실행 → Supabase 저장 → 웹 자동 갱신
          </p>

          {/* Flow grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE_STEPS.map((s, i) => (
              <div
                key={s.step}
                className="relative rounded-2xl p-5"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${s.color}33`,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Step badge */}
                <div
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{ background: `${s.color}22`, color: s.color }}
                >
                  {s.step}
                </div>

                <div className="mb-2 text-2xl">{s.emoji}</div>
                <h3 className="mb-2 font-bold" style={{ color: 'var(--text)' }}>
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted2)' }}>
                  {s.desc}
                </p>

                {/* Connector arrow (not last item) */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-lg lg:block"
                    style={{ color: 'var(--muted)' }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline bar */}
          <div className="mt-8 flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
            <span>⏰ 매일 06:40 자동 시작</span>
            <span>→</span>
            <span>약 15~20분 소요</span>
            <span>→</span>
            <span>07:00 이전 발행 완료</span>
          </div>
        </div>
      </section>

      {/* ── AI Agent Crew ────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 text-center text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent2)' }}>
            AI 크루
          </div>
          <h2 className="mb-3 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            5명의 AI Agent가 함께 일합니다
          </h2>
          <p className="mb-12 text-center text-sm" style={{ color: 'var(--muted2)' }}>
            각 Agent는 전문 역할을 맡아 파이프라인을 분업 처리합니다
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{agent.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold" style={{ color: 'var(--text)' }}>
                        {agent.name}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                        style={{ background: 'var(--green)', color: '#fff' }}
                      >
                        LIVE
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {agent.nameEn}
                    </div>
                  </div>
                </div>

                <p className="mb-3 text-sm font-medium" style={{ color: 'var(--bmw-lt)' }}>
                  {agent.role}
                </p>

                <div
                  className="mb-3 rounded-lg px-2.5 py-1.5 text-xs"
                  style={{ background: 'var(--glass)', color: 'var(--muted2)' }}
                >
                  🔧 {agent.model}
                </div>

                <ul className="space-y-1">
                  {agent.tasks.map((task) => (
                    <li key={task} className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted2)' }}>
                      <span style={{ color: 'var(--green)' }}>▸</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="px-4 py-16" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            플랫폼 기능
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="shrink-0 text-2xl">{f.emoji}</span>
                <div>
                  <h3 className="mb-1 font-bold" style={{ color: 'var(--text)' }}>
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted2)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            숫자로 보는 프로젝트
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { num: '60일+', label: '누적 아카이브' },
              { num: '06:40', label: '매일 자동 업데이트' },
              { num: '9개', label: '뉴스 카테고리' },
              { num: '5명', label: 'AI Agent 운영' },
            ].map((stat) => (
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
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────── */}
      <section className="px-4 py-16" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--text)' }}>
            기술 스택
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {STACK.map((group) => (
              <div
                key={group.category}
                className="rounded-2xl p-5"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <h3
                  className="mb-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--muted)' }}
                >
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgba(28,105,212,0.12)',
                        color: 'var(--bmw-lt)',
                        border: '1px solid rgba(28,105,212,0.25)',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ───────────────────────────── */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-2 text-3xl">🤖</p>
          <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--text)' }}>
            오늘 아침 뉴스가 기다리고 있어요
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--muted2)' }}>
            매일 06:40에 자동 업데이트됩니다. 북마크 해두고 아침마다 확인해보세요.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--bmw)', color: '#fff' }}
          >
            뉴스레터 바로가기 →
          </Link>
        </div>
      </section>
    </main>
  )
}
