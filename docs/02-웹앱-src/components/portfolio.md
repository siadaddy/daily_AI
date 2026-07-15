---
title: "portfolio 컴포넌트"
source_paths:
  - src/components/portfolio/PortfolioCard.tsx
tags: [component, static-data]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[00-src-개요]]"
---

# portfolio 컴포넌트

## 역할
`portfolio` 탭. 이 사이트를 만든 개인의 다른 프로젝트들을 소개하는 정적 콘텐츠 페이지 —
DB 조회 없이 컴포넌트 안에 하드코딩된 `PORTFOLIO_ITEMS` 배열을 렌더링한다.

## 데이터 구조
`PortfolioItem`: `title`, `description`, `emoji`, `tags`, `href`, `status`
(`'live' | 'ended' | 'demo' | 'wip'`), `category`(`'personal' | 'work' | 'edu'`), 그리고
공모전 등 출품 근거용 `aiUsage`(AI로 한 일 한 줄 요약), `evidenceImg`, `detailHref`/`detailLabel`.

## 왜 이렇게 되어 있는가
`aiUsage`/`evidenceImg` 필드가 있는 이유: 이 사이트 자체가 "AI 활용 공모전" 출품작 성격을
겸하고 있어, 각 프로젝트에서 AI를 어떻게 썼는지 근거를 남겨두는 용도로 보인다
(`detailHref: '/about/ai-usage'` 같은 상세 페이지 링크 포함).

## 새 항목 추가 시
DB나 API 연동 없이 `PORTFOLIO_ITEMS` 배열에 항목을 추가/수정하면 된다 — 다른 탭과 달리
서버 데이터 소스가 없는 유일한 탭.

## 관련 문서
- [[00-src-개요]]
