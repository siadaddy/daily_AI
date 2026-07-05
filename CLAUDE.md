# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Important: This is Next.js 16

This project runs **Next.js 16.2.9** with **React 19**. APIs and conventions may differ from training data. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for up-to-date guidance.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
npm test         # Vitest (unit tests for src/lib/utils)
npx prettier --write .  # Format all files (run before committing)
```

## What this project is

Korean AI news dashboard (한국 AI 뉴스 대시보드). Content is generated daily by a Python AI pipeline (GitHub Actions, 06:00 KST) and served by a Next.js app on Vercel. Three codebases live in this repo:

| Directory   | What it is                                                                                                                        | How it runs                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/`      | Next.js 16 web app                                                                                                                | Vercel                                               |
| `pipeline/` | Python AI pipeline: collects news (Naver API), generates card news + blog article + images via Gemini/Groq/HF, writes to Supabase | GitHub Actions `pipeline-daily.yml`, daily 06:00 KST |
| `ai-crew/`  | Standalone music curator: generates `public/music/music_*.json` consumed by the Music Universe iframe                             | Run manually                                         |

**`pipeline/` and `ai-crew/` intentionally diverged.** They share file names (`music_curator.py`, `gemini_client.py`, `agent_memory.py`) but are NOT copies: pipeline's music curator writes to Supabase, ai-crew's writes JSON files to `public/music/`. Do not "deduplicate" them into one, and do not assume a fix in one applies to the other.

## Web app architecture (`src/`)

**App Router** with `src/` directory layout and `@/*` alias pointing to `src/*`.

```
src/
├── proxy.ts                # Next 16 proxy (middleware): refreshes Supabase auth session cookies
├── app/
│   ├── layout.tsx          # Root layout (ThemeProvider, fonts)
│   ├── page.tsx            # Main page — tab SPA via ?tab= & ?date= query params (Server Component)
│   ├── globals.css         # Design tokens (CSS variables) + Tailwind v4
│   ├── about/              # AI staff intro page
│   ├── actions/community.ts  # Server Actions: auth, posts, comments, likes
│   └── api/                # Route Handlers (all proxy external APIs to avoid client CORS)
│       ├── weather/  exchange/  crypto/  market/   # dashboard data
│       ├── music-search/                           # music tab search (YouTube)
│       ├── analytics/                              # reports tab aggregate data (+prev-period comparison)
│       └── reports/generate/                       # Vercel Cron (weekly Mon 01:00 / monthly 1st 01:30 UTC)
│                                                   #   → OpenAI → weekly_reports; ?period=weekly|monthly,
│                                                   #   ?start=YYYY-MM-DD for backfill (weekly-briefing/generate = legacy alias)
├── components/
│   ├── layout/             # Header, TabNav (5 tabs), Footer, UserButton, ThemeProvider
│   ├── dashboard/          # DashboardBar + 13 ticker widgets (Clock, Weather, Exchange, BTC, ETH,
│   │                       #   KOSPI, KOSDAQ, NASDAQ, S&P500, DXY, Gold, Oil, VIX) + NewsTicker
│   ├── newsletter/         # NewsletterTab, DateNav, FeaturedCard, NewsCard, BlogArticle,
│   │                       #   RawNewsSection, AiPicksSection, ContentInteraction, PreparingBanner
│   ├── reports/            # ReportsTab (?view=weekly|monthly|dashboard, ?report=YYYY-MM-DD),
│   │                       #   ReportsSubNav, PeriodReport, ReportArchiveList, TrendHighlights,
│   │                       #   ReportsDashboard, charts (Chart.js): CategoryChart, VolumeChart,
│   │                       #   KeywordChart, SourcePieChart, StatsKpiRow
│   ├── office/             # OfficeTab, OfficeCanvas (Canvas + RAF), AgentStatusPanel, ActivityLog
│   ├── music/              # MusicUniverse — iframe wrapping /music/music.html (Three.js)
│   ├── community/          # AuthModal
│   └── portfolio/          # PortfolioCard (PortfolioSection)
├── lib/
│   ├── supabase/client.ts  # createBrowserClient — Client Components only
│   ├── supabase/server.ts  # createServerClient — Server Components / Route Handlers / Actions only
│   ├── supabase/admin.ts   # createAdminClient (service-role, bypasses RLS) — report generation only
│   ├── reports/generate.ts # shared weekly/monthly report generation (OpenAI + upsert)
│   ├── hooks/              # useInterval, useChartColors
│   ├── utils/              # keywords.ts (Korean keyword extraction), caption.ts (md→HTML, highlight),
│   │                       #   validation.ts (user-input validation for Server Actions)
│   └── types/index.ts      # NewsCard, ContentCard, Article, Agent, Log, TabId, Category …
└── store/app.ts            # Zustand: activeTab, categoryFilter, selectedDate (client-side UI state)
```

**Tabs:** `?tab=newsletter|reports|music|office|portfolio` (+ `?date=YYYY-MM-DD` on newsletter). URL is the source of truth for deep-linking; Zustand mirrors UI state client-side.

## Supabase tables (existing — do not rename)

| Table                                   | Content                                                                                          | Written by                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `news_cards`                            | Raw collected news (daily crawl)                                                                 | pipeline `collect.py`                          |
| `card_news`                             | AI-generated card news (5/day)                                                                   | pipeline `main.py`                             |
| `articles`                              | AI-generated blog article                                                                        | pipeline `main.py`                             |
| `news_trends`                           | Daily TOP3 trend analysis                                                                        | pipeline                                       |
| `weekly_reports`                        | Weekly AND monthly report JSON (`period_type` discriminator, unique on `period_type,week_start`) | `/api/reports/generate` (OpenAI, service-role) |
| `agents`, `logs`                        | AI Office tab status + activity (Realtime)                                                       | pipeline `supabase_logger.py`                  |
| `agent_memories`                        | Pipeline agent long-term memory                                                                  | pipeline                                       |
| `community_posts`, `community_comments` | Community board                                                                                  | Server Actions                                 |
| `content_likes`, `content_comments`     | Inline likes/comments on content                                                                 | Server Actions                                 |

⚠️ `news_cards` (raw news) and `card_news` (generated cards) are **different tables** — easy to confuse.

## Data fetching strategy

- News/reports → Server Components with `unstable_cache` (card news 300s, date list/reports 3600s)
- Agent status & activity log → Supabase Realtime subscription (Client Components, office tab)
- Weather/exchange/market/crypto → `/api/*` Route Handlers fetched with SWR (CORS workaround)
- Clock → `useInterval` client-side only
- Auth session refresh → `src/proxy.ts` (runs on every non-static request)

## Key decisions

- **Canvas animations** (AI Office tab): `requestAnimationFrame` loop inside `useEffect` with cleanup. Do not convert to DOM animation — Canvas is required for performance.
- **Music Universe tab:** `<iframe src="/music/music.html">` wrapping the existing Three.js app. Keep it isolated; its data comes from `public/music/*.json` (generated by `ai-crew/`).
- **Cron auth:** `/api/reports/generate` requires `Authorization: Bearer $CRON_SECRET`. Report upserts must use `createAdminClient()` (`src/lib/supabase/admin.ts`) — `weekly_reports` RLS only allows service-role writes.
- **Server Actions** validate input length/content via `src/lib/utils/validation.ts` — reuse those helpers for any new user-generated content.

## Styling

Tailwind CSS v4 — uses `@import "tailwindcss"` (not the v3 `@tailwind` directives).

Design tokens live in `src/app/globals.css` as CSS custom properties:

```css
--bmw: #1c69d4 /* primary blue accent */ --accent2: #a78bfa
  /* purple secondary */ --bg: #080c14 /* dark background (default) */
  --card: #111827 --glass: rgba(255, 255, 255, 0.04);
```

Dark mode is **default**. Light mode overrides via `[data-theme="light"]` selector (next-themes).

Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`. Run format before committing.

## Environment variables

Web app (`.env.local`, from `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # report upsert (RLS bypass) — server-only
OPENAI_API_KEY=        # weekly/monthly report generation (gpt-4o-mini)
CRON_SECRET=           # report cron auth + manual backfill
YOUTUBE_API_KEY=       # music search
```

Pipeline (`pipeline/.env`, from `pipeline/.env.example`): `SUPABASE_URL`, `SUPABASE_KEY`, `NAVER_CLIENT_*`, `GEMINI_API_KEY*`, `GROQ_API_KEY*`, `HF_TOKEN*`, `NTFY_TOPIC`. In CI these come from GitHub Actions secrets.
