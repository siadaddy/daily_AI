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
npx prettier --write .  # Format all files
```

No test suite is configured yet.

## Architecture

**App Router** (Next.js) with `src/` directory layout and `@/*` alias pointing to `src/*`.

This project is rebuilding [siadaddy.github.io/youngs](https://siadaddy.github.io/youngs/index.html) — a Korean AI news dashboard — into a modular Next.js app. The planned structure:

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.tsx          # Root layout (ThemeProvider, fonts)
│   ├── page.tsx            # Main page — tab-based SPA (?tab= query param)
│   ├── globals.css         # Design tokens (CSS variables) + Tailwind v4
│   ├── about/              # AI staff intro page
│   └── api/
│       ├── weather/        # Proxies Open-Meteo (avoids client CORS)
│       └── exchange/       # Proxies exchange rate API
├── components/
│   ├── layout/             # Header, TabNav (4 tabs), Footer
│   ├── dashboard/          # ClockWidget, WeatherWidget, ExchangeWidget
│   ├── newsletter/         # FeaturedCard, NewsCard, NewsGrid, BlogArticle, RawNewsSection
│   ├── reports/            # WeeklyBriefing, CategoryChart (Chart.js), CardArchive, MonthlyStats
│   ├── office/             # OfficeCanvas (Canvas + RAF), AgentStatusPanel, ActivityLog
│   ├── music/              # MusicUniverse (Three.js iframe wrapper)
│   └── portfolio/          # PortfolioCard
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # createBrowserClient — use only in Client Components
│   │   └── server.ts       # createServerClient — use only in Server Components / Route Handlers
│   ├── hooks/              # useInterval, useWeather, useExchangeRate
│   └── types/index.ts      # NewsCard, Article, Agent, Log types
└── store/app.ts            # Zustand store: activeTab, categoryFilter, selectedDate
```

## Key Decisions

**Supabase tables (existing, do not rename):** `news_cards`, `articles`, `agents`, `logs`

**Data fetching strategy:**
- News/reports → Server Components with ISR (`revalidate: 3600`)
- Activity log → Supabase Realtime subscription (Client Component)
- Weather/exchange rate → `/api/*` Route Handlers fetched with SWR (CORS workaround)
- Clock → `useInterval` client-side only

**Tab navigation:** URL query param `?tab=newsletter|reports|music|office` for deep-linking. State managed in Zustand (`store/app.ts`).

**Canvas animations** (AI Office tab): `requestAnimationFrame` loop inside `useEffect` with cleanup. Do not convert to DOM animation — Canvas is required for performance.

**Music Universe tab:** Rendered as an `<iframe>` wrapping the existing Three.js app. Keep it isolated.

## Styling

Tailwind CSS v4 — uses `@import "tailwindcss"` (not the v3 `@tailwind` directives).

Design tokens live in `src/app/globals.css` as CSS custom properties:
```css
--bmw: #1c69d4          /* primary blue accent */
--accent2: #a78bfa      /* purple secondary */
--bg: #080c14           /* dark background (default) */
--card: #111827
--glass: rgba(255,255,255,.04)
```

Dark mode is **default**. Light mode overrides via `[data-theme="light"]` selector (next-themes).

Prettier auto-sorts Tailwind classes via `prettier-plugin-tailwindcss`. Run format before committing.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Values come from the existing Supabase project used by the original site.
