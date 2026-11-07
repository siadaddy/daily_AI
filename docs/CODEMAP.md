# CODEMAP

> **자동 생성 파일 — 직접 수정 금지.** `npm run codemap` 으로 재생성 (Stop 훅이 자동 실행). 설명·작업표는 `scripts/codemap-notes.json` 에서 고친다.
> **읽는 법: 통째로 읽지 말 것.** 먼저 §0(파일 앞쪽 약 45줄)만 읽고, 필요한 섹션은 `grep -n "^## " docs/CODEMAP.md` 로 위치를 찾아 `offset/limit` 으로 읽는다.
> 줄 수(≈)는 반올림값. `→` 내부 import · `←` 이 파일을 쓰는 곳 · `r:`/`w:` Supabase 읽기/쓰기 · `rev` 라우트 revalidate(초) · `cache` unstable_cache(초).

한국 AI 뉴스 대시보드. 3개 코드베이스: `src/`(Next.js 16 · Vercel), `pipeline/`(Python · GitHub Actions 매일 06:00 KST → Supabase), `ai-crew/`(수동 음악 큐레이터). 규칙·스타일·환경변수는 `CLAUDE.md`, 이 파일은 "어디에 무엇이 있나"만 다룬다.

## 0. 작업 → 먼저 볼 파일

| 작업 | 진입 파일 |
|---|---|
| 뉴스레터 화면·카드 | `components/newsletter/NewsletterTab.tsx`(데이터 fetch 포함) · `FeaturedCard` · `NewsCard` · `BlogArticle` |
| 홈 탭 라우팅(`?tab=`,`?date=`) | `app/page.tsx` · `lib/tabs.ts` · `components/layout/TabNav.tsx` |
| 일자별 영구 링크 `/news/[date]` | `app/news/[date]/page.tsx` · `lib/content-dates.ts` · `lib/dates.ts` |
| 주간/월간 리포트 생성 | `lib/reports/generate.ts` · `app/api/reports/generate/route.ts` · `vercel.json` 크론 |
| 리포트 화면·아카이브 | `components/reports/*` · `lib/reports/query.ts` · `app/reports/[period]/[start]/page.tsx` |
| 분석 대시보드 데이터 | `app/api/analytics/route.ts` · `components/reports/ReportsDashboard.tsx` · `lib/utils/category-stats.ts` |
| 키워드 추출·아카이브 | `lib/utils/keywords.ts` · `lib/keywords/archive.ts` · `app/keyword/*` |
| 네이버 블로그 내보내기 | `app/news/[date]/naver/page.tsx` · `lib/naver/*` · `components/naver/*` · `app/api/naver-card/[date]/[index]/route.tsx` · `scripts/capture-site.mjs` |
| 로그인·댓글·좋아요 | `app/actions/community.ts` · `components/community/AuthModal.tsx` · `components/newsletter/ContentInteraction.tsx` · `lib/utils/validation.ts` |
| AI Office 탭 | `components/office/*` (Canvas+RAF, agents/logs Realtime) |
| 에이전트 소개·일기 | `app/agents/*` · `lib/agents/memory.ts` (`agent_memories`) |
| Music Universe | `components/music/MusicUniverse.tsx` → `public/music/music.html`(iframe) · 곡 생성은 `ai-crew/agents/music_curator.py` |
| 시장·날씨 위젯 | `components/dashboard/*` · `app/api/{market,crypto,exchange,weather}` |
| 디자인 토큰·타이포 | `app/globals.css` · `app/layout.tsx`(폰트) · `components/layout/ThemeProvider.tsx` |
| SEO·피드 | `app/sitemap.ts` · `robots.ts` · `feed.xml/route.ts` · `llms.txt/route.ts` · `opengraph-image.tsx` |
| 인증 세션 갱신 | `src/proxy.ts` · `lib/supabase/*` |
| 일일 파이프라인 | `pipeline/collect.py` → `pipeline/main.py` · `.github/workflows/pipeline-daily.yml` |
| '삼천리' 제외 필터 | `lib/utils/exclude.ts`(쓰기·읽기 양쪽에 적용) · `pipeline/collect.py` |

### 주의사항 (코드만 봐서는 놓치기 쉬운 것)

- `news_cards`(수집한 원본 뉴스)와 `card_news`(AI가 만든 카드뉴스)는 **다른 테이블**이다. 역색인(§4)에서 확인.
- Supabase 클라이언트 4종: `supabase/public.ts`(익명·쿠키 없음 → `unstable_cache`·sitemap·feed), `server.ts`(쿠키 · Route Handler/Action), `client.ts`(브라우저 전용), `admin.ts`(service-role · `lib/reports/generate.ts` 전용). `route.ts`/`actions`/`server.ts` 에서 `createBrowserClient` 금지(훅이 막음).
- `NewsletterTab.tsx` 는 컴포넌트이면서 데이터 접근 모듈이다. `fetchCardNews` 등을 `api/naver-card`, `news/[date]/naver` 가 import 하고, 자체 `getSupabase()` 를 쓴다(`createPublicClient` 아님).
- `fetchAllPages` 는 `lib/reports/generate.ts` 에 있지만 `api/analytics`·`keywords/archive` 도 쓰는 공용 페이지네이션이다.
- `pipeline/` 과 `ai-crew/` 는 의도적으로 분기됨 — 같은 파일명(`music_curator.py` 등)이어도 합치지 말 것. pipeline 은 곡 라이브러리를 Supabase `agent_memories` 에, ai-crew 는 `public/music/*.json` 에 쓴다.
- `data-capture` 속성은 `scripts/capture-site.mjs`(Playwright)가 화면 캡처 대상으로 쓴다. 속성을 지우면 야간 capture 잡이 실패한다.
- 주간/월간 리포트는 Python이 아니라 웹 크론(`/api/reports/generate`, `Authorization: Bearer $CRON_SECRET`)이 만든다. `/api/weekly-briefing/generate` 는 레거시 별칭.

## 1. 라우트 (`src/app`)

### 페이지
- `/about/ai-usage` ≈350 — AI 활용 안내(정적) | ext github.com
- `/about` ≈650 — AI 스태프 소개(정적)
- `/agents/[name]` ≈200 — 에이전트 상세 + 일기 | rev=3600 · SSG · → lib/agents/memory
- `/agents` ≈100 — 에이전트 목록 | rev=3600 · → lib/agents/memory
- `/keyword/[keyword]` ≈200 — 키워드별 뉴스 아카이브 | rev=3600 · SSG · → lib/keywords/archive
- `/keyword` ≈80 — 키워드 인덱스 | rev=3600 · → lib/keywords/archive
- `/naver` ≈20 — `/news/{오늘}/naver` 로 리다이렉트(force-dynamic)
- `/news/[date]/naver` ≈300 — 네이버 블로그 내보내기 화면 | rev=300 · fetch /api/naver-card · → components/naver/CopyForNaver, components/naver/ShareImages, components/newsletter/NewsletterTab, lib/naver/compose, lib/naver/screens
- `/news/[date]` ≈100 — 일자별 뉴스 영구 링크(NewsletterTab 렌더) | rev=300 · SSG · → components/newsletter/NewsletterTab, lib/content-dates, lib/utils/caption
- `/` ≈150 — 홈 — `?tab=`/`?date=` 탭 SPA (서버 컴포넌트) | → components/music/MusicUniverse, components/newsletter/NewsletterTab, components/office/OfficeTab, components/portfolio/PortfolioCard, components/reports/ReportsTab, lib/content-dates, lib/tabs, lib/utils/caption
- `/reports/[period]/[start]` ≈150 — 리포트 영구 링크 | rev=3600 · SSG · → components/reports/PeriodReport, components/reports/ReportArchiveList, components/reports/ReportsSubNav, components/reports/TrendHighlights, lib/reports/query

### Route Handlers (외부 API는 서버에서 프록시)
- `/api/analytics` ≈200 — 리포트 탭 집계(`?period=day|week|month`, 이전 기간 비교) | exports GET · db r:articles,news_cards,news_trends · → lib/reports/generate, lib/supabase/server, lib/utils/category-stats, lib/utils/exclude, lib/utils/keywords
- `/api/crypto` ≈30 — BTC/ETH(CoinGecko) | rev=300 · exports GET · ext api.coingecko.com
- `/api/exchange` ≈20 — 환율 | rev=3600 · exports GET · ext open.er-api.com
- `/api/market` ≈60 — KOSPI·KOSDAQ·NASDAQ·S&P·DXY·금·유가·VIX(Yahoo) | rev=300 · exports GET · ext query2.finance.yahoo.com
- `/api/music-search` ≈30 — 음악 검색(YouTube Data API) | rev=86400 · exports GET · ext www.googleapis.com · env YOUTUBE_API_KEY
- `/api/naver-card/[date]/[index]` ≈350 — 카드 이미지 렌더(`next/og`, 세로·가로) | rev=300 · exports GET · ext fonts.googleapis.com · → components/newsletter/NewsletterTab, lib/naver/card-layout
- `/api/reports/generate` ≈90 — 주간/월간 리포트 생성 크론(`?period=`, `?start=` 백필, CRON_SECRET) | exports GET, POST · env CRON_SECRET · → lib/reports/generate
- `/api/weather` ≈30 — 날씨(open-meteo) | rev=1800 · exports GET · ext air-quality-api.open-meteo.com,api.open-meteo.com
- `/api/weekly-briefing/generate` ≈10 — 레거시 별칭 — `reports/generate` 재export | exports GET, POST · → app/api/reports/generate/route
- `/feed.xml` ≈80 — RSS(`articles`) | rev=3600 · exports GET · db r:articles · → lib/supabase/public, lib/utils/caption
- `/llms.txt` ≈100 — llms.txt(`articles`) | rev=3600 · exports GET · db r:articles · → lib/keywords/archive, lib/reports/query, lib/supabase/public

### Server Actions (`app/actions`)
- `app/actions/community` ≈200 — 인증(signUp/signIn/signOut) · 게시글/댓글 · 좋아요/인라인 댓글 | server · exports signUp, signIn, signOut, createPost, deletePost, createComment, toggleLike, addComment, +1 · db r:content_likes w:community_comments,community_posts,content_comments,content_likes · → lib/supabase/server, lib/utils/validation

### 레이아웃·SEO·특수 파일
- `app/about/opengraph-image` ≈200 — about OG 이미지 | ext fonts.googleapis.com
- `app/layout` ≈150 — 루트 레이아웃(폰트·ThemeProvider·메타데이터)
- `app/not-found` ≈30 — 404
- `app/opengraph-image` ≈250 — 홈 OG 이미지 | ext fonts.googleapis.com
- `app/robots` ≈50 — robots
- `app/sitemap` ≈70 — sitemap (콘텐츠·리포트·키워드·에이전트 URL) | rev=3600

## 2. `src/lib` · `store` · `proxy`

**lib/**
- `content-dates.ts` ≈40 — 콘텐츠가 있는 날짜 목록(`card_news`), 오류 시 `[]` | exports fetchAvailableDates, fetchAllContentDates · db r:card_news · cache 3600s · → lib/supabase/public · ← app/news/[date]/page, app/page, app/sitemap
- `dates.ts` ≈40 — 날짜 검증·링크 헬퍼(`newsHref`, `reportHref`, `keywordHref`는 URL 인코딩) | exports getToday, isValidDate, newsHref, reportHref, keywordHref · ← app/api/naver-card/[date]/[index]/route, app/keyword/[keyword]/page, app/keyword/page +11
- `site-url.ts` ≈10 — `getSiteUrl()` | exports getSiteUrl · ← app/agents/[name]/page, app/agents/page, app/feed.xml/route +10
- `tabs.ts` ≈30 — `tabHref`, `parseTab` | exports tabHref, parseTab · ← app/page, components/layout/TabNav

**lib/agents/** — AI 에이전트 장기 기억 조회
- `memory.ts` ≈90 — 에이전트 기억·일기 조회, `getAgentRole` | exports getAgentRole, fetchAgentMemories, fetchAgentMemory · db r:agent_memories · cache 3600s · → lib/supabase/public · ← app/agents/[name]/page, app/agents/page, app/sitemap

**lib/hooks/** — 클라이언트 훅
- `useChartColors.ts` ≈60 — 차트 테마 색상 훅(차트 4종이 사용) | client · exports withAlpha, useChartColors · ← components/reports/CategoryChart, components/reports/KeywordChart, components/reports/SourcePieChart +1
- `useInterval.ts` ≈20 — `useInterval` (ClockWidget) | ← components/dashboard/ClockWidget

**lib/keywords/** — 키워드 아카이브 조회
- `archive.ts` ≈100 — 상위 키워드·키워드별 뉴스(PostgREST `.or ilike`; `isSafeKeyword` 가 필터 문자 방어) | exports TOP_KEYWORD_COUNT, isSafeKeyword, getTopKeywords, getNewsByKeyword · db r:articles,news_cards,news_trends · cache 3600s · → lib/reports/generate, lib/supabase/public, lib/utils/exclude, lib/utils/keywords · ← app/keyword/[keyword]/page, app/keyword/page, app/llms.txt/route +1

**lib/naver/** — 네이버 블로그 내보내기: 카드 레이아웃 계산 · SmartEditor용 HTML 조립 · 캡처 이미지 목록
- `card-layout.ts` ≈100 — 세로(1080×1350)·가로(1600×900) 카드 레이아웃 계산, `cutAtSentence` | exports CARD_W, CARD_H, TEXT_W, AVG_CHAR_RATIO, CHROME, pickLayout, cutAtSentence, WIDE_W, +5 · ← app/api/naver-card/[date]/[index]/route
- `compose.ts` ≈200 — SmartEditor-safe HTML 조립 `composeNaverPost` | exports escapeHtml, sanitizeForNaver, htmlToPlainText, composeNaverPost · ext siadaddy-ai.vercel.app · → lib/utils/caption · ← app/news/[date]/naver/page
- `screens.ts` ≈100 — Storage `card-images/screens/{date}` 의 캡처 이미지 목록 (`{viewport}-{key}-{w}x{h}.png`) | exports shotLabel, sortShots, parseShotName, fetchScreens · db storage:card-images · cache 300s · ← app/news/[date]/naver/page

**lib/reports/** — 주간/월간 리포트 생성(쓰기)과 조회(읽기)
- `generate.ts` ≈450 — 리포트 생성(OpenAI→`weekly_reports` upsert), `fetchAllPages`, `previousRange` | exports fetchAllPages, previousRange, generateReport · db r:news_cards,news_trends,weekly_reports w:weekly_reports · ADMIN-client · env OPENAI_API_KEY · → lib/supabase/admin, lib/utils/category-stats, lib/utils/exclude, lib/utils/keywords · ← app/api/analytics/route, app/api/reports/generate/route, lib/keywords/archive
- `query.ts` ≈70 — 리포트 조회(`sanitizeReport`·`filterTop3` 적용), 캐시 키 `weekly-reports` v2 | exports fetchReports, fetchAllReportKeys, fetchTrendsInRange · db r:news_trends,weekly_reports · cache 3600s · → lib/supabase/public, lib/utils/exclude · ← app/llms.txt/route, app/reports/[period]/[start]/page, app/sitemap +1

**lib/supabase/** — 클라이언트 4종 (위 주의사항 참고)
- `admin.ts` ≈20 — service-role `createAdminClient` (RLS 우회) | exports createAdminClient · ADMIN-client · env SUPABASE_SERVICE_ROLE_KEY · ← lib/reports/generate
- `client.ts` ≈10 — 브라우저용 `createClient` | exports createClient · ← components/layout/UserButton, components/office/ActivityLog, components/office/AgentStatusPanel
- `public.ts` ≈10 — 익명 `createPublicClient` — 모든 캐시 fetcher·sitemap·feed | exports createPublicClient · ← app/feed.xml/route, app/llms.txt/route, lib/agents/memory +3
- `server.ts` ≈30 — 쿠키 기반 서버용 `createClient` | exports createClient · ← app/actions/community, app/api/analytics/route

**lib/types/** — 공용 타입
- `index.ts` ≈200 — 공용 타입 전부 | ← app/api/analytics/route, app/api/reports/generate/route, app/page +31
  - types: ActivityLog, Agent, AnalyticsComparison, AnalyticsPayload, Article, Category, CategoryStat, CommunityComment, CommunityPost, ContentCard, DailyVolume, KeywordStat, KeywordTrend, NewsCard, NewsTrend, PeriodReport, PeriodType, ReportPeriod, ReportSection, SourceStat, TabId, Top3Item, WeeklyReport

**lib/utils/** — 순수 함수 모음 (대부분 테스트 있음)
- `caption.ts` ≈100 — 마크다운→HTML, 캡션 하이라이트, 읽기 시간 | exports highlightCaption, mdToHtml, readingMinutes, plainTextExcerpt · ← app/feed.xml/route, app/news/[date]/page, app/page +5
- `category-stats.ts` ≈50 — 카테고리 통계·증감률 | exports deltaPct, buildCategoryStats · ← app/api/analytics/route, lib/reports/generate
- `exclude.ts` ≈80 — '삼천리' 제외 필터: `isExcludedNews`, `filterTop3`, `sanitizeReport` | exports EXCLUDED_KEYWORDS, containsExcluded, isExcludedNews, filterTop3, stripExcludedSentences, sanitizeReport · ← app/api/analytics/route, components/newsletter/NewsletterTab, lib/keywords/archive +2
- `keywords.ts` ≈200 — 한국어 키워드 추출 `extractKeywords` | exports extractKeywords · ← app/api/analytics/route, lib/keywords/archive, lib/reports/generate
- `validation.ts` ≈60 — Server Action 입력 검증(`LIMITS`, `validateText`) | exports LIMITS, validateText, isValidContentKey, publicDbError · ← app/actions/community

**src/**
- `proxy.ts` ≈40 — Next 16 proxy(미들웨어) — Supabase 인증 쿠키 갱신, 정적 자산 제외

**store/**
- `app.ts` ≈20 — Zustand `useAppStore` (카테고리 필터 — RawNewsSection만 사용) | exports useAppStore · ← components/newsletter/RawNewsSection

## 3. `src/components`

**community/** — 로그인/가입 모달
- `AuthModal.tsx` ≈200 — 로그인/가입 모달 | client

**dashboard/** — 상단 시세 바. 위젯은 `useEffect`+`fetch` 로 `/api/*` 호출(SWR 아님)
- BtcWidget, ClockWidget, DashboardBar, DxyWidget, EthWidget, ExchangeWidget, GoldWidget, KosdaqWidget, KospiWidget, NasdaqWidget, NewsTicker, OilWidget, Sp500Widget, VixWidget, WeatherWidget | fetch /api/crypto,/api/exchange,/api/market,/api/weather | db card_news

**layout/** — 사이트 셸 · 헤더 · 탭 · 테마 · 푸터
- `Footer.tsx` ≈50 — 푸터
- `Header.tsx` ≈60 — 헤더(시계·날씨·UserButton) | client · → components/dashboard/ClockWidget, components/dashboard/WeatherWidget
- `PageHeader.tsx` ≈50 — 독립 라우트용 페이지 헤더
- `SiteShell.tsx` ≈70 — Header·TabNav·DashboardBar·DateNav·Footer 조립(서버) | exports SiteShell, LoadingSkeleton · → components/dashboard/DashboardBar, components/newsletter/DateNav
- `TabNav.tsx` ≈150 — 5개 탭 네비(`activeTab: null` = 독립 라우트) | client · → lib/tabs
- `ThemeProvider.tsx` ≈50 — 커스텀 테마 컨텍스트(next-themes 아님) | client · exports ThemeProvider, useTheme
- `UserButton.tsx` ≈150 — 인증 상태 + AuthModal | client · → lib/supabase/client

**music/** — Music Universe iframe 래퍼
- `MusicUniverse.tsx` ≈100 — `/music/music.html` iframe | client

**naver/** — 네이버 블로그 복사·이미지 공유 UI
- `CopyForNaver.tsx` ≈100 — 조립된 HTML 클립보드 복사 | client
- `ShareImages.tsx` ≈150 — 카드 이미지 공유·다운로드 | client

**newsletter/** — 뉴스레터 탭 본문 (서버 컴포넌트 + 상호작용)
- `AiPicksSection.tsx` ≈80 — AI 픽 | client
- `BlogArticle.tsx` ≈70 — 블로그 글 본문 | client · → lib/utils/caption
- `ContentInteraction.tsx` ≈350 — 좋아요·댓글(SWR+Realtime+Server Action) | client · db r:content_comments,content_likes · swr · realtime content_comments · → app/actions/community
- `DateNav.tsx` ≈150 — 날짜 이동 | client
- `FactSummary.tsx` ≈70 — 사실 요약(서버)
- `FeaturedCard.tsx` ≈80 — 대표 카드(`data-capture=card-01`) | client · data-capture×1 · → lib/utils/caption
- `NewsCard.tsx` ≈80 — 카드뉴스 카드(`data-capture=card-NN`) | client · data-capture×1 · → lib/utils/caption
- `NewsletterTab.tsx` ≈350 — 뉴스레터 탭 본문 + 데이터 fetcher(`fetchCardNews`·`fetchTodayArticle`·`fetchTodayTrend`) | exports fetchCardNews, fetchTodayArticle, fetchTodayTrend, NewsletterTab · db r:articles,card_news,news_cards,news_trends · cache 300s · data-capture×4 · → lib/utils/caption, lib/utils/exclude
- `PreparingBanner.tsx` ≈100 — 오늘 콘텐츠 준비중 배너 | client
- `RawNewsSection.tsx` ≈100 — 수집 원본 뉴스 목록(zustand 필터) | client · → store/app
- `TalkingPointsSection.tsx` ≈80 — 대화 소재 | client

**office/** — AI Office 탭 (Canvas + Realtime)
- `ActivityLog.tsx` ≈80 — 활동 로그(Realtime `logs`) | client · db r:logs · realtime logs · → lib/supabase/client
- `AgentStatusPanel.tsx` ≈90 — 에이전트 상태(Realtime `agents`) | client · db r:agents · realtime agents · → lib/supabase/client
- `OfficeCanvas.tsx` ≈150 — Canvas + requestAnimationFrame 애니메이션(DOM 변환 금지) | client
- `OfficeTab.tsx` ≈30 — 오피스 탭 컨테이너

**portfolio/** — 포트폴리오 탭
- `PortfolioCard.tsx` ≈300 — `PortfolioSection` + 프로젝트 카드 | client · exports PortfolioSection · ext shopping-delta-ashen.vercel.app,youngs-9ewwwhdidksu3qeifbh2qb.streamlit.app

**reports/** — 리포트 탭 · 차트(Chart.js)
- `CategoryChart.tsx` ≈50 — 카테고리 차트 | client · → lib/hooks/useChartColors
- `KeywordChart.tsx` ≈90 — 키워드 차트(`/keyword/..` 링크) | client · → lib/hooks/useChartColors
- `PeriodReport.tsx` ≈200 — 주간/월간 리포트 본문 | client
- `ReportArchiveList.tsx` ≈70 — 지난 리포트 목록 | client
- `ReportsDashboard.tsx` ≈200 — 분석 대시보드(SWR `/api/analytics`) | client · swr · fetch /api/analytics
- `ReportsPeriodSelector.tsx` ≈50 — 기간 선택 | client
- `ReportsSubNav.tsx` ≈70 — weekly/monthly/dashboard 서브탭 | client
- `ReportsTab.tsx` ≈60 — 리포트 탭(서버, `?view=`/`?report=`) | rev=3600 · → lib/reports/query
- `SourcePieChart.tsx` ≈70 — 출처 파이 차트 | client · → lib/hooks/useChartColors
- `StatsKpiRow.tsx` ≈150 — KPI 행(count-up) | client
- `TrendHighlights.tsx` ≈80 — 트렌드 하이라이트 | client
- `VolumeChart.tsx` ≈70 — 일별 볼륨 차트 | client · → lib/hooks/useChartColors

## 4. Supabase 테이블 역색인 (누가 읽고/쓰는가)

| 테이블 | 읽기 | 쓰기 | 비고 |
|---|---|---|---|
| `agent_memories` | ai-crew/utils/agent_memory.py, lib/agents/memory, pipeline/agents/music_curator.py, pipeline/main.py, pipeline/utils/agent_memory.py | ai-crew/utils/agent_memory.py, pipeline/agents/music_curator.py, pipeline/utils/agent_memory.py | 에이전트 장기 기억·일기·곡 라이브러리 |
| `agents` | components/office/AgentStatusPanel | pipeline/agents/supabase_logger.py | Office 탭 에이전트 상태(Realtime) |
| `articles` | app/api/analytics/route, app/feed.xml/route, app/llms.txt/route, components/newsletter/NewsletterTab, lib/keywords/archive | pipeline/main.py | AI 생성 블로그 글 |
| `card_news` | components/dashboard/NewsTicker, components/newsletter/NewsletterTab, lib/content-dates, pipeline/agents/planner.py | pipeline/main.py | AI 생성 카드뉴스(하루 5장) |
| `community_comments` | — | app/actions/community | 커뮤니티 댓글 |
| `community_posts` | — | app/actions/community | 커뮤니티 게시글 |
| `content_comments` | components/newsletter/ContentInteraction | app/actions/community | 콘텐츠 인라인 댓글 |
| `content_likes` | app/actions/community, components/newsletter/ContentInteraction | app/actions/community | 콘텐츠 좋아요 |
| `logs` | components/office/ActivityLog | pipeline/agents/supabase_logger.py | Office 탭 활동 로그(Realtime) |
| `news_cards` | app/api/analytics/route, components/newsletter/NewsletterTab, lib/keywords/archive, lib/reports/generate | pipeline/collect.py | 수집한 원본 뉴스(일일 크롤) |
| `news_trends` | app/api/analytics/route, components/newsletter/NewsletterTab, lib/keywords/archive, lib/reports/generate, lib/reports/query | pipeline/collect.py | 일일 TOP3 트렌드 |
| `weekly_reports` | lib/reports/generate, lib/reports/query | lib/reports/generate | 주간·월간 리포트 JSON (`period_type`, unique `period_type,week_start`) — service-role 만 쓰기 |

_Python 쪽 REST 호출의 읽기/쓰기는 `requests.<method>` 로 추정한 값이다. Storage 버킷은 각 파일 줄의 `storage:` 참고._

## 5. 데이터 가져오기 방식 한눈에

- **unstable_cache**: components/newsletter/NewsletterTab(300s), lib/agents/memory(3600s), lib/content-dates(3600s), lib/keywords/archive(3600s), lib/naver/screens(300s), lib/reports/query(3600s)
- **라우트 revalidate**: /agents/[name](3600), /agents(3600), /api/crypto(300), /api/exchange(3600), /api/market(300), /api/music-search(86400), /api/naver-card/[date]/[index](300), /api/weather(1800), /feed.xml(3600), /keyword/[keyword](3600), /keyword(3600), /llms.txt(3600), /news/[date]/naver(300), /news/[date](300), /reports/[period]/[start](3600), app/sitemap(3600), components/reports/ReportsTab(3600)
- **SWR**: components/newsletter/ContentInteraction, components/reports/ReportsDashboard
- **Realtime(postgres_changes)**: components/newsletter/ContentInteraction(content_comments), components/office/ActivityLog(logs), components/office/AgentStatusPanel(agents)
- 대시보드 위젯은 SWR이 아니라 `useEffect`+`fetch` 로 `/api/*` 를 호출한다.

## 6. `pipeline/` (Python 3.11, GitHub Actions 매일 06:00 KST)

- 호출 순서: `collect.py main` (수집봇 online → Naver 수집 → TOP3 → 대화소재 → `news_cards`/`news_trends`) → artifact 전달 → `main.py main` (output 로드 → `planner.run` → `writer.run` → `designer.run`(실패 시 빈 이미지로 계속) → `card_news`/`articles` upsert → ntfy → `_should_run_music()`(90일↑) 이면 `music_curator.run/save`, 아니면 `reflect()`). 각 단계 `retry` 3회, 실패 시 exit 1 + 긴급 ntfy.
- 리포트(주간/월간)는 Python에서 제거됨 — 웹 크론이 담당.

- `agents/designer.py` ≈350 — 최디자 — 이미지 5장: HF FLUX → OpenAI → PIL 순 폴백, Storage 업로드 | defs run (+4 private) · db storage:card-images · ext router.huggingface.co · → utils.agent_memory, utils.gemini_client
- `agents/music_curator.py` ≈300 — 한뮤직 — 13장르×10곡, 곡 라이브러리를 `agent_memories` 에 저장 | defs run, save, reflect (+4 private) · db r:agent_memories w:agent_memories · → utils.agent_memory, utils.gemini_client
- `agents/planner.py` ≈300 — 박기획 — 카드 5장+블로그 기획, 최근 3일 제목 중복 회피 | defs run (+2 private) · db r:card_news · → utils.agent_memory, utils.gemini_client
- `agents/supabase_logger.py` ≈90 — Office 탭용 `agents`/`logs` 기록 | defs update_agent_status, log_action (+1 private) · db w:agents,logs
- `agents/writer.py` ≈600 — 이작가('시아아빠' 페르소나) — 캡션·본문 + 품질검사/반복 제거 | defs quality_check, run (+15 private) · → utils.agent_memory, utils.gemini_client, utils.quality_tracker
- `check_gemini_keys.py` ≈60 — 수동 진단(키·모델 조합 점검) — CI에서 안 씀 | ext generativelanguage.googleapis.com
- `collect.py` ≈450 — 1단계 뉴스 수집(Naver 8카테고리, '삼천리' 제외) → Groq TOP3·대화소재 → `news_cards`/`news_trends` + `output/` 파일 | defs ask_ai, search_naver_news, clean_html, extract_source, fetch_all, build_ai_summary, generate_talking_points, insert_to_supabase, insert_trends_to_supabase, save_output, main (+2 private) · db w:news_cards,news_trends · ext api.groq.com,openapi.naver.com · → agents.supabase_logger
- `main.py` ≈250 — 2단계 오케스트레이터: planner→writer→designer→`card_news`/`articles` upsert, ntfy 알림, 90일마다 음악 큐레이션 | defs notify, retry, main (+3 private) · db r:agent_memories w:articles,card_news · ext ntfy.sh · → agents.designer, agents.music_curator, agents.planner, agents.supabase_logger, agents.writer
- `utils/agent_memory.py` ≈350 — 에이전트 장기 기억·페르소나·일기 (로컬 JSON ↔ `agent_memories`) | defs remember, recall, get_hints, get_persona, get_diary, get_growth_score, add_diary, update_persona, should_update_persona (+9 private) · db r:agent_memories w:agent_memories
- `utils/gemini_client.py` ≈250 — LLM 클라이언트: Gemini 2.5 우선(키 2개) → Groq 폴백(키 4개) | defs reset_rate_limit_cache, ask_gemini, ask_ai, ask_gemini25_first (+3 private) · ext api.groq.com,generativelanguage.googleapis.com
- `utils/quality_tracker.py` ≈100 — writer 품질 이슈 누적(`quality_log.json`, gitignore) | defs load_log, record_run, get_adaptive_hints (+2 private)

env: GEMINI_API_KEY, GEMINI_API_KEY_2, GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, GROQ_API_KEY_4, HF_TOKEN, HF_TOKEN_2, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NOTION_TOKEN, NTFY_TOPIC, OPENAI_API_KEY, SUPABASE_KEY, SUPABASE_URL

## 7. `ai-crew/` (수동 실행 · CI/웹앱에서 호출 안 함)

`main.py` 없음. 에이전트를 직접 import/실행한다. pipeline 과 합치지 말 것.

- `agents/music_curator.py` ≈300 — pipeline 판과 달리 `public/music/music.json`·`music_YYYY-MM-DD.json` 파일로 저장 | defs run, save, reflect (+3 private) · → utils.agent_memory, utils.gemini_client
- `utils/agent_memory.py` ≈350 — pipeline 판 + `get_summary` | defs remember, recall, get_hints, get_summary, get_persona, get_diary, get_growth_score, add_diary, update_persona, should_update_persona (+9 private) · db r:agent_memories w:agent_memories
- `utils/gemini_client.py` ≈250 — pipeline 판 + `ask_groq_first` | defs ask_gemini, ask_ai, ask_groq_first, ask_gemini25_first (+3 private) · ext api.groq.com,generativelanguage.googleapis.com

env: GEMINI_API_KEY, GEMINI_API_KEY_2, GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, GROQ_API_KEY_4, SUPABASE_KEY, SUPABASE_URL

## 8. 워크플로우 · 크론 · 스크립트

- `.github/workflows/ci.yml` — ✅ CI (lint + test + build) | push · pull_request | jobs ci | `npm ci`, `npm run lint`, `npm test`, `npm run build`
- `.github/workflows/keepalive.yml` — 💓 스케줄 유지 (keepalive) | cron 0 0 1,15 * * · manual | jobs keepalive
  - 60일 비활성으로 스케줄이 꺼지지 않게 pipeline-daily 를 enable
- `.github/workflows/pipeline-daily.yml` — 📰 AI 파이프라인 (수집 + 생성) | cron 0 21 * * * · manual | jobs collect→generate→capture | `python pipeline/collect.py`, `python pipeline/main.py`, `npm i --no-save playwright@1.63.0`, `npx playwright install --with-deps chromium`, `node scripts/capture-site.mjs`
  - 06:00 KST. collect → generate → capture 3잡 순차, 실패 시 ntfy
- vercel cron `/api/reports/generate?period=weekly` @ `0 1 * * 1` (UTC)
- vercel cron `/api/reports/generate?period=monthly` @ `30 1 1 * *` (UTC)
- npm scripts: `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `codemap`
- `scripts/capture-site.mjs` ≈150 — Playwright로 배포 사이트의 `[data-capture]` 를 390px/1280px 캡처 → Storage `card-images/screens/{date}` (`--dry` 지원) | db storage:card-images · env SITE_URL,SUPABASE_KEY,SUPABASE_URL
- Storage 버킷 `card-images`: `designer.py` 가 카드 이미지, `capture-site.mjs` 가 `screens/{date}/` 캡처를 업로드 · `lib/naver/screens.ts` 가 목록 조회.
- 필요 env: 웹앱 `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CRON_SECRET`, `YOUTUBE_API_KEY` (`.env.example`) · 파이프라인 키 목록은 §6 `env:`.

## 9. 테스트 (vitest, `src/**/*.test.ts`, node 환경) — 컴포넌트·라우트 테스트는 없음

- `dates.test` → lib/dates
- `keywords/archive.test` → lib/keywords/archive
- `naver/card-layout.test` → lib/naver/card-layout
- `naver/compose.test` → lib/naver/compose, lib/types
- `reports/previous-range.test` → lib/reports/generate
- `tabs.test` → lib/tabs
- `utils/caption.test` → lib/utils/caption
- `utils/category-stats.test` → lib/utils/category-stats
- `utils/exclude.test` → lib/types, lib/utils/exclude
- `utils/keywords.test` → lib/utils/keywords
- `utils/validation.test` → lib/utils/validation

## 10. 이 지도에 없는 것

- `docs/` Obsidian 볼트(수동 작성·갱신 중단, 2026-09-04) — 배경 설명용. 최신 구조는 이 파일을 신뢰.
- `public/works/*`(정적 포트폴리오 데모), `public/music/*`(Three.js `music.html` + 곡 JSON), `.claude/skills/*`(디자인 스킬), `test.html`(무관한 보고서), `package-lock.json`.
- `node_modules`, `.next`, `__pycache__`, `pipeline/output`(생성물).
