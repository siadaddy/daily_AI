type Category = 'personal' | 'work' | 'edu'

interface PortfolioItem {
  title: string
  description: string
  emoji: string
  tags: string[]
  href: string
  status?: 'live' | 'ended' | 'demo' | 'wip'
  category: Category
  /** AI로 한 일 한 줄 요약 — 경진대회용 "방법" 근거 */
  aiUsage?: string
  /** 블러 처리된 전/후 스크린샷 경로 (public/works/evidence/*.png) */
  evidenceImg?: string
  /** AI 활용기 상세 페이지 등 보조 링크 */
  detailHref?: string
  detailLabel?: string
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  // ── 개인 프로젝트 ─────────────────────────────────────────
  {
    title: '오늘줍 — 동네 마감임박 상품 마켓플레이스',
    description:
      '카페·빵집·편의점 사장님이 당일 남은 상품을 할인가로 등록하면 소비자가 지도에서 찾아 예약하는 양방향 마켓플레이스',
    emoji: '🥐',
    tags: ['Next.js 15', 'Supabase', 'PostGIS', 'Kakao Maps', 'Realtime'],
    href: 'https://shopping-delta-ashen.vercel.app/',
    status: 'live',
    category: 'personal',
    aiUsage:
      'AI 추천 시스템·사장님 AI 인사이트 대시보드 개발 중 — 2026 화성시 AI 공모전 출품작',
  },
  {
    title: 'AI 뉴스레터 자동화',
    description:
      'Claude Code + AI Agent + GitHub Actions로 매일 새벽 뉴스를 자동 수집·분석·발행',
    emoji: '📰',
    tags: ['Python', 'Claude Code', 'AI Agent', 'Supabase', 'GitHub Actions'],
    href: '?tab=newsletter',
    status: 'live',
    category: 'personal',
    aiUsage:
      '5-에이전트(수집·기획·작성·디자인·음악) 파이프라인 + 7일마다 스스로 프롬프트를 재작성하는 자기학습 메모리',
    detailHref: '/about/ai-usage',
    detailLabel: 'AI 활용기 자세히 보기 →',
  },
  {
    title: '뮤직 유니버스 3D',
    description:
      'Three.js로 구현한 3D 음악 은하계 — 70개 이상의 노래를 장르별로 시각화',
    emoji: '🌌',
    tags: ['Three.js', 'WebGL', 'iTunes API'],
    href: '?tab=music',
    status: 'live',
    category: 'personal',
  },
  {
    title: '암호화폐 자동 트레이딩',
    description: 'AI 기반 자동 매매 봇 — 현재 종료됨',
    emoji: '💰',
    tags: ['Python', 'Upbit API', 'Claude AI'],
    href: '/works/coin.html',
    status: 'ended',
    category: 'personal',
    aiUsage:
      'RSI·MACD 등 지표 스코어링 + Groq AI 판단 자동매매 — 103회 매매 후 손실로 종료, 실패까지 투명하게 기록',
  },
  // ── 업무 프로젝트 ─────────────────────────────────────────
  {
    title: '통합 대시보드 자동화',
    description:
      'MyDMS 리포트 자동 추출 · PostgreSQL DB 적재 · Next.js 통합 대시보드 · 텔레그램 봇 알림',
    emoji: '🤖',
    tags: ['Python', 'PostgreSQL', 'Next.js', 'Telegram Bot', 'Recharts'],
    href: '/works/dashboard-auto.html',
    status: 'wip',
    category: 'work',
    aiUsage:
      '매일 수기로 다운받아 취합하던 MyDMS 리포트를 스크립트로 자동 추출·적재 — 취합 시간을 텔레그램 알림 한 줄로 대체',
  },
  {
    title: '딜러 & 지점 매출 시각화',
    description:
      'DFR 기준 84개 딜러·지점의 YTD 판매량·성장률을 버블 맵과 성과 테이블로 시각화',
    emoji: '📍',
    tags: ['Python', 'GeoPandas', 'Folium', 'Kakao API'],
    href: '/works/dealer-sales-map.html',
    status: 'demo',
    category: 'work',
    aiUsage:
      '엑셀 표로만 보던 84개 딜러 실적을 지오코딩·버블맵으로 자동 시각화 — 지역별 격차를 한눈에 파악',
  },
  {
    title: '차량 등록 기준 지역 시각화',
    description:
      'KIADA 데이터 크롤링 → 행정구역별 BMW 등록 대수 choropleth 지도 (시도→시군구 드릴다운)',
    emoji: '🗺️',
    tags: ['Python', 'GeoPandas', 'Folium', 'Kakao API'],
    href: '/works/vehicle-reg-map.html',
    status: 'demo',
    category: 'work',
    aiUsage:
      'KIADA 공시 데이터를 크롤링부터 지도 렌더링까지 자동화 — 시도→시군구 드릴다운 choropleth로 수작업 집계 대체',
  },
  {
    title: 'BMW SA 대시보드',
    description: '서비스 어드바이저 성과 분석 대시보드',
    emoji: '🚗',
    tags: ['Python', 'Streamlit', 'Plotly'],
    href: '/works/sa-dashboard-demo.html',
    status: 'demo',
    category: 'work',
    aiUsage:
      '서비스 어드바이저별 실적을 수기 취합하던 방식을 대시보드로 자동 집계 — 지점장 보고용 차트 생성 시간 단축',
  },
  {
    title: '차량 입고 대수 분석 대시보드',
    description:
      '4년치 일 단위 입고 데이터로 주차별 KPI·YoY 비교·연말 예측·요일 패턴 분석',
    emoji: '📊',
    tags: ['Python', 'Streamlit', 'Plotly', 'Google Sheets API'],
    href: '/works/intake-dashboard.html',
    status: 'demo',
    category: 'work',
    aiUsage:
      '4년치 일별 입고 데이터를 Google Sheets에서 자동 수집해 주차별 KPI·YoY·연말 예측까지 자동 산출',
  },
  {
    title: '주소클렌징 시스템',
    description:
      '지점별 고객 주소 데이터 113,777건 정제 · Juso/Kakao API 이중 검증 · 99.7% 성공률',
    emoji: '📍',
    tags: ['Python', 'Juso API', 'Kakao Maps API', 'pandas', 'asyncio'],
    href: '/works/address-cleansing.html',
    status: 'demo',
    category: 'work',
    aiUsage:
      '비정형 주소 문자열을 Juso/Kakao API 이중 검증으로 비동기 일괄 정제 — 113,777건을 99.7% 성공률로 처리',
  },
  // ── 교육 ─────────────────────────────────────────────────
  {
    title: '커피 입지 최적화 분석',
    description: '서울 유동인구·경쟁 데이터로 최적 카페 위치 분석',
    emoji: '☕',
    tags: ['Python', 'Pandas', 'Folium'],
    href: '/works/map.html',
    status: 'demo',
    category: 'edu',
  },
  {
    title: 'Instacart VIP 분석 대시보드',
    description: '장바구니 분석으로 VIP 고객 패턴 발견 및 추천 전략 수립',
    emoji: '🛒',
    tags: ['Python', 'Pandas', 'Matplotlib'],
    href: 'https://youngs-9ewwwhdidksu3qeifbh2qb.streamlit.app/',
    status: 'demo',
    category: 'edu',
  },
]

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'personal', label: '🧑‍💻 개인 프로젝트' },
  { key: 'work', label: '💼 업무 프로젝트' },
  { key: 'edu', label: '🎓 교육' },
]

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  live: { label: 'LIVE', cls: 'badge-green' },
  demo: { label: 'DEMO', cls: 'badge-blue' },
  ended: { label: 'ENDED', cls: 'badge-purple' },
  wip: { label: '작업중', cls: 'badge-orange' },
}

export function PortfolioSection() {
  return (
    <section className="flex flex-col gap-10">
      {CATEGORIES.map(({ key, label }) => {
        const items = PORTFOLIO_ITEMS.filter((i) => i.category === key)
        return (
          <div key={key}>
            {/* 카테고리 헤더 */}
            <div
              className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background:
                  'linear-gradient(135deg, rgba(28,105,212,0.08) 0%, rgba(167,139,250,0.04) 100%)',
                border: '1px solid rgba(28,105,212,0.15)',
                borderLeft: '3px solid var(--bmw)',
              }}
            >
              <span
                className="text-base font-bold"
                style={{ color: 'var(--text)' }}
              >
                {label}
              </span>
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--muted2)' }}
              >
                {items.length}개
              </span>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const st = item.status ? STATUS_LABEL[item.status] : null
                return (
                  <div
                    key={item.title}
                    className="glass-card group relative flex flex-col gap-3 p-5 transition-transform hover:-translate-y-1"
                  >
                    <a
                      href={item.href}
                      className="absolute inset-0 z-0"
                      aria-label={item.title}
                    />
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{item.emoji}</span>
                      {st && (
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      )}
                    </div>
                    <div>
                      <h3
                        className="mb-1 font-bold"
                        style={{ color: 'var(--text)' }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--muted2)' }}
                      >
                        {item.description}
                      </p>
                      {item.aiUsage && (
                        <p
                          className="mt-2 rounded-lg px-2.5 py-1.5 text-xs leading-relaxed"
                          style={{
                            background: 'rgba(28,105,212,0.08)',
                            color: 'var(--bmw-lt)',
                          }}
                        >
                          🤖 {item.aiUsage}
                        </p>
                      )}
                      {item.evidenceImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.evidenceImg}
                          alt={`${item.title} 전/후 증거 (민감정보 블러 처리)`}
                          className="mt-2 rounded-lg"
                          style={{ border: '1px solid var(--border)' }}
                        />
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-blue text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {item.detailHref && (
                      <a
                        href={item.detailHref}
                        className="relative z-10 self-start text-xs font-semibold hover:underline"
                        style={{ color: 'var(--bmw-lt)' }}
                      >
                        {item.detailLabel ?? '자세히 보기 →'}
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
