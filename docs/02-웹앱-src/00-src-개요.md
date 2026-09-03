---
title: "src/ 웹앱 개요"
source_paths:
  - src/app/page.tsx
  - src/app/news/[date]/page.tsx
  - src/app/reports/[period]/[start]/page.tsx
  - src/app/keyword/[keyword]/page.tsx
  - src/app/agents/[name]/page.tsx
  - src/app/sitemap.ts
  - src/lib/dates.ts
  - src/store/app.ts
tags: [overview, nextjs]
last_reviewed: 2026-09-04
status: 확인됨
related:
  - "[[layout]]"
---

# src/ 웹앱 개요

Next.js 16 App Router. `src/app/page.tsx`가 5개 탭을 모두 렌더링하는 탭 SPA이고,
**그와 별개로 콘텐츠마다 독립 라우트가 존재한다**. 독립 라우트 쪽이 정식 경로(canonical)이며
검색엔진 색인 대상이다.

## 두 갈래 URL

### 탭 SPA (`/?tab=`) — 사람이 둘러보는 경로
- `?tab=newsletter|reports|music|office|portfolio` — 활성 탭 (기본값 `newsletter`)
- `?date=YYYY-MM-DD` — newsletter 탭에서 조회할 날짜
- `?view=weekly|monthly|dashboard`, `?report=YYYY-MM-DD` — reports 탭 하위 뷰 ([[reports]] 참고)

### 독립 라우트 — 색인·공유되는 정식 경로

| 경로 | 내용 |
|---|---|
| `/news/[date]` | 날짜별 뉴스레터. `NewsletterTab`을 그대로 재사용 |
| `/reports/[period]/[start]` | 주간·월간 리포트 퍼머링크 |
| `/keyword` · `/keyword/[keyword]` | 키워드별 전 기간 뉴스 아카이브 (상위 200개) |
| `/agents` · `/agents/[name]` | AI 에이전트 페르소나·성장 일기 ([[agent_memories]]) |
| `/sitemap.xml` `/feed.xml` `/llms.txt` `/robots.txt` | 색인·구독·AI 크롤러용 |

### 왜 둘 다 두는가
전부 쿼리 파라미터에 묶여 있던 탓에 매일 쌓이는 콘텐츠가 색인 대상으로 선언조차 되지
않았다(사이트맵에 정적 3개 URL뿐). 2026-09-04에 독립 라우트를 추가하면서도 **기존 쿼리
URL은 그대로 200을 유지**한다 — 이미 공유된 링크를 깨지 않기 위해서다. 대신 canonical만
독립 라우트를 가리킨다.

정식 경로 규칙은 `src/lib/dates.ts`의 `newsHref()` / `reportHref()` / `keywordHref()`
한 곳에 모여 있다. 오늘 자 뉴스레터는 `/`가 정식 경로이고 과거만 `/news/[date]`다 —
새 링크를 만들 때 직접 문자열을 조립하지 말고 이 헬퍼를 쓸 것.

`generateMetadata`가 경로별로 `<title>`/`description`/canonical을 만들고, JSON-LD는
`Organization`+`WebSite`(루트 레이아웃), `NewsArticle`(뉴스레터), `BreadcrumbList`,
`ItemList`(키워드)를 내보낸다.

[[라이브러리-및-상태관리#store|Zustand 스토어]](`src/store/app.ts`)는 이 URL 상태를 클라이언트
쪽에서 미러링만 한다 — 즉 새로고침해도 탭/필터/날짜가 URL에 남아있어야 딥링크가 유지된다.
새 UI 상태를 추가할 때 "URL에 반영해야 하는 상태인지"를 먼저 판단할 것 — 딥링크가 필요 없는
순수 UI 상태(예: 모달 열림 여부)만 Zustand에만 두는 것이 맞다.

## 렌더링 전략
- `NewsletterTab`, `ReportsTab` 등은 Server Component 우선, 필요한 부분만 `'use client'`.
- `Suspense`로 감싸 스트리밍.
- 독립 라우트는 `generateStaticParams`로 프리렌더 + ISR(뉴스 300초, 나머지 3600초).
- 공통 크롬(헤더·탭·대시보드·날짜 네비·푸터)은 `src/components/layout/SiteShell.tsx`가
  담당하며 `page.tsx`와 모든 독립 라우트가 공유한다.
- **빌드 타임에 호출되는 조회는 반드시 실패를 흡수해야 한다.** `generateStaticParams`와
  `sitemap.ts`가 Supabase를 읽는데, CI는 placeholder 자격증명으로 빌드하므로 예외가
  새어나가면 빌드 전체가 죽는다. `src/lib/content-dates.ts` 등의 fetcher는 조회 실패 시
  빈 값으로 떨어진다.

## 관련 문서
- [[layout]] — `Header`, `TabNav`가 이 URL 상태를 읽고 링크를 만든다.
- [[라이브러리-및-상태관리]]
- [[newsletter]] · [[reports]] · [[agent_memories]]
