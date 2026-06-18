interface PortfolioItem {
  title: string
  description: string
  emoji: string
  tags: string[]
  href: string
  status?: 'live' | 'ended' | 'demo'
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    title: 'AI 뉴스레터 자동화',
    description: 'Claude Code + AI Agent + GitHub Actions로 매일 새벽 뉴스를 자동 수집·분석·발행',
    emoji: '📰',
    tags: ['Python', 'Claude Code', 'AI Agent', 'Supabase', 'GitHub Actions'],
    href: '?tab=newsletter',
    status: 'live',
  },
  {
    title: '뮤직 유니버스 3D',
    description: 'Three.js로 구현한 3D 음악 은하계 — 70개 이상의 노래를 장르별로 시각화',
    emoji: '🌌',
    tags: ['Three.js', 'WebGL', 'iTunes API'],
    href: '?tab=music',
    status: 'live',
  },
  {
    title: '암호화폐 자동 트레이딩',
    description: 'AI 기반 자동 매매 봇 — 현재 종료됨',
    emoji: '💰',
    tags: ['Python', 'Upbit API', 'Claude AI'],
    href: '/works/coin.html',
    status: 'ended',
  },
  {
    title: '커피 입지 최적화 분석',
    description: '서울 유동인구·경쟁 데이터로 최적 카페 위치 분석',
    emoji: '☕',
    tags: ['Python', 'Pandas', 'Folium'],
    href: '/works/map.html',
    status: 'demo',
  },
  {
    title: 'Instacart VIP 분석 대시보드',
    description: '장바구니 분석으로 VIP 고객 패턴 발견 및 추천 전략 수립',
    emoji: '🛒',
    tags: ['Python', 'Pandas', 'Matplotlib'],
    href: 'https://youngs-9ewwwhdidksu3qeifbh2qb.streamlit.app/',
    status: 'demo',
  },
  {
    title: 'BMW SA 대시보드',
    description: '서비스 어드바이저 성과 분석 대시보드',
    emoji: '🚗',
    tags: ['Python', 'Streamlit', 'Plotly'],
    href: '/works/SA대시보드_demo.html',
    status: 'demo',
  },
  {
    title: '차량 등록 기준 지역 시각화',
    description: 'KIADA 데이터 크롤링 → 행정구역별 BMW 등록 대수 choropleth 지도 (시도→시군구 드릴다운)',
    emoji: '🗺️',
    tags: ['Python', 'GeoPandas', 'Folium', 'Kakao API'],
    href: '/works/vehicle-reg-map.html',
    status: 'demo',
  },
  {
    title: '딜러 & 지점 매출 시각화',
    description: 'DFR 기준 84개 딜러·지점의 YTD 판매량·성장률을 버블 맵과 성과 테이블로 시각화',
    emoji: '📍',
    tags: ['Python', 'GeoPandas', 'Folium', 'Kakao API'],
    href: '/works/dealer-sales-map.html',
    status: 'demo',
  },
  {
    title: '차량 입고 대수 분석 대시보드',
    description: '4년치 일 단위 입고 데이터로 주차별 KPI·YoY 비교·연말 예측·요일 패턴 분석',
    emoji: '📊',
    tags: ['Python', 'Streamlit', 'Plotly', 'Google Sheets API'],
    href: 'https://intake-dashboard-nvkkwjrlsuapds4kub79hw.streamlit.app/',
    status: 'live',
  },
]

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  live: { label: 'LIVE', cls: 'badge-green' },
  demo: { label: 'DEMO', cls: 'badge-blue' },
  ended: { label: 'ENDED', cls: 'badge-purple' },
}

export function PortfolioSection() {
  return (
    <section>
      <div
        className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(28,105,212,0.08) 0%, rgba(167,139,250,0.04) 100%)',
          border: '1px solid rgba(28,105,212,0.15)',
          borderLeft: '3px solid var(--bmw)',
        }}
      >
        <span className="text-xl">🛠</span>
        <span className="text-base font-bold" style={{ color: 'var(--text)' }}>My Works</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PORTFOLIO_ITEMS.map((item) => {
          const st = item.status ? STATUS_LABEL[item.status] : null
          return (
            <a
              key={item.title}
              href={item.href}
              className="glass-card group flex flex-col gap-3 p-5 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{item.emoji}</span>
                {st && <span className={`badge ${st.cls}`}>{st.label}</span>}
              </div>
              <div>
                <h3 className="mb-1 font-bold" style={{ color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted2)' }}>
                  {item.description}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="badge badge-blue text-[10px]">
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
