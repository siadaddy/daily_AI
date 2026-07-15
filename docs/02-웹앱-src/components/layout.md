---
title: "layout 컴포넌트"
source_paths:
  - src/components/layout/Header.tsx
  - src/components/layout/TabNav.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/ThemeProvider.tsx
  - src/components/layout/UserButton.tsx
tags: [component]
last_reviewed: 2026-07-15
status: 초안
related:
  - "[[00-src-개요]]"
---

# layout 컴포넌트

## 역할
전체 페이지 뼈대. `src/app/layout.tsx`(루트 레이아웃)에서 `ThemeProvider`, `Header`, `TabNav`,
`Footer`를 조합한다.

## 컴포넌트
- `Header` — 로고, 타이틀, `UserButton` 배치.
- `TabNav` — 5개 탭(`?tab=`) 전환 UI. [[00-src-개요|URL 쿼리]]를 직접 갱신하는 링크로 구성.
- `Footer` — 하단 정보.
- `ThemeProvider` — next-themes 기반, 다크모드 기본값 + `[data-theme="light"]`로 라이트모드
  오버라이드.
- `UserButton` — Supabase Auth 로그인 상태 표시, 클릭 시 [[community]]의 `AuthModal` 오픈.

## 왜 이렇게 되어 있는가
다크모드가 기본인 이유는 디자인 토큰(`globals.css`)이 다크 배경을 기본값으로 잡고 라이트를
오버라이드로 처리하기 때문 — 새 컴포넌트를 만들 때도 "다크 우선, 라이트 오버라이드" 순서로
CSS 변수를 써야 일관성이 유지된다.

## 관련 문서
- [[00-src-개요]]
- [[community]] — `UserButton` ↔ `AuthModal` 연결.
