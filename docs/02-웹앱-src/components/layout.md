---
title: "layout 컴포넌트"
source_paths:
  - src/components/layout/Header.tsx
  - src/components/layout/TabNav.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/ThemeProvider.tsx
  - src/components/layout/UserButton.tsx
tags: [component]
last_reviewed: 2026-09-03
status: 초안
related:
  - "[[00-src-개요]]"
---

# layout 컴포넌트

## 역할
전체 페이지 뼈대. `src/app/layout.tsx`(루트 레이아웃)에서 `ThemeProvider`, `Header`, `TabNav`,
`Footer`를 조합한다.

## 컴포넌트
- `Header` — 로고(lucide `Bot` 아이콘), 타이틀, `UserButton`, `ClockWidget`/`WeatherWidget`
  (데스크톱 전체 표시 + 모바일 압축(`compact`) 표시) 배치.
- `TabNav` — 탭(`?tab=`) 전환 UI. `office`(AI 사무실) 탭은 코드상 존재하지만 네비게이션
  배열에서 주석 처리되어 있어 실제로는 4개 탭(뉴스레터/리포트/뮤직/포트폴리오)만 노출된다.
  lucide 아이콘 + `framer-motion`의 `layoutId` 공유 레이아웃 애니메이션으로 active 밑줄이
  탭 사이를 이동하며, 테마 토글 아이콘(해/달)도 `framer-motion`으로 회전+페이드 전환된다.
  모든 모션은 `useReducedMotion()`을 확인해 reduced-motion 환경에서 즉시 전환으로 대체한다.
- `Footer` — 하단 정보.
- `ThemeProvider` — **커스텀 React Context 기반**(`next-themes` 미사용). `useState<'dark'|'light'>`
  로 상태를 관리하고, `useEffect`에서 `localStorage` 복원 → `document.documentElement`에
  `data-theme` 속성 반영 + `localStorage` 동기화를 수행한다. 기본값은 `'dark'`.
- `UserButton` — Supabase Auth 로그인 상태 표시, 클릭 시 [[community]]의 `AuthModal` 오픈.

## 왜 이렇게 되어 있는가
다크모드가 기본인 이유는 `globals.css`의 `:root` 토큰 블록이 다크 배경 값을 기본값으로 잡고
`[data-theme="light"]` 셀렉터로 라이트 값을 오버라이드하는 구조이기 때문 — `ThemeProvider`의
초기 상태값(`'dark'`)도 이 토큰 구조와 짝을 맞춘 것이다. 새 컴포넌트를 만들 때도 "다크 우선,
라이트 오버라이드" 순서로 CSS 변수를 써야 일관성이 유지된다.

## 관련 문서
- [[00-src-개요]]
- [[community]] — `UserButton` ↔ `AuthModal` 연결.
