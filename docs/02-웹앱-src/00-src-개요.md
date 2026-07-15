---
title: "src/ 웹앱 개요"
source_paths:
  - src/app/page.tsx
  - src/store/app.ts
tags: [overview, nextjs]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[layout]]"
---

# src/ 웹앱 개요

Next.js 16 App Router. `src/app/page.tsx` 하나가 5개 탭을 모두 렌더링하는 사실상의 SPA다 —
탭 간 이동은 페이지 전환이 아니라 URL 쿼리 파라미터 변경으로 이루어진다.

## URL이 진실의 원천 (source of truth)

- `?tab=newsletter|reports|music|office|portfolio` — 활성 탭 (기본값 `newsletter`)
- `?date=YYYY-MM-DD` — newsletter 탭에서 조회할 날짜
- `?view=weekly|monthly|dashboard`, `?report=YYYY-MM-DD` — reports 탭 하위 뷰 ([[reports]] 참고)

`page.tsx`는 이 쿼리를 읽어 SEO 메타데이터(`generateMetadata`)까지 탭/날짜별로 동적으로
생성한다 — 예를 들어 newsletter 탭은 그날의 아티클 제목/본문 일부를 `<title>`/`description`에
반영한다.

[[라이브러리-및-상태관리#store|Zustand 스토어]](`src/store/app.ts`)는 이 URL 상태를 클라이언트
쪽에서 미러링만 한다 — 즉 새로고침해도 탭/필터/날짜가 URL에 남아있어야 딥링크가 유지된다.
새 UI 상태를 추가할 때 "URL에 반영해야 하는 상태인지"를 먼저 판단할 것 — 딥링크가 필요 없는
순수 UI 상태(예: 모달 열림 여부)만 Zustand에만 두는 것이 맞다.

## 렌더링 전략
- `NewsletterTab`, `ReportsTab` 등은 Server Component 우선, 필요한 부분만 `'use client'`.
- `Suspense`로 감싸 스트리밍.

## 관련 문서
- [[layout]] — `Header`, `TabNav`가 이 URL 상태를 읽고 링크를 만든다.
- [[라이브러리-및-상태관리]]
