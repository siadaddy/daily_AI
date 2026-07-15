---
title: "newsletter 컴포넌트"
source_paths:
  - src/components/newsletter/NewsletterTab.tsx
  - src/components/newsletter/DateNav.tsx
  - src/components/newsletter/FeaturedCard.tsx
  - src/components/newsletter/NewsCard.tsx
  - src/components/newsletter/BlogArticle.tsx
  - src/components/newsletter/RawNewsSection.tsx
  - src/components/newsletter/AiPicksSection.tsx
  - src/components/newsletter/ContentInteraction.tsx
  - src/components/newsletter/PreparingBanner.tsx
tags: [component]
last_reviewed: 2026-07-15
status: 초안
related:
  - "[[card_news]]"
  - "[[articles]]"
  - "[[news_cards]]"
---

# newsletter 컴포넌트

## 역할
기본 탭(`?tab=newsletter`, 생략 가능). 특정 날짜(`?date=`)의 AI 생성 콘텐츠를 보여준다.

## 컴포넌트 구조
- `NewsletterTab` — 최상위. `fetchTodayArticle`(page.tsx의 메타데이터 생성에서도 재사용)로
  [[articles]]를 조회하는 등 데이터 페칭 진입점.
- `DateNav` — 날짜 이동 UI, `?date=` 갱신.
- `FeaturedCard` — 오늘의 대표 카드([[card_news]] 중 1개 강조).
- `NewsCard` — 카드뉴스 개별 카드, `[사실]/[분석]/[전망]` 하이라이트는
  [[라이브러리-및-상태관리#caption.ts|highlightCaption()]] 사용.
- `BlogArticle` — [[articles]] 본문을 [[라이브러리-및-상태관리#caption.ts|mdToHtml()]]로 변환해 렌더링.
- `RawNewsSection` — [[news_cards]] 원본 뉴스 목록 노출(가공 전 원자료를 그대로 보여주는 섹션).
- `AiPicksSection` — AI가 고른 콘텐츠 섹션(카드뉴스 기반으로 추정, 정확한 선정 기준은
  코드 재확인 필요).
- `ContentInteraction` — 좋아요/댓글 UI, [[community]]의 `content_likes`/`content_comments`
  테이블과 연동.
- `PreparingBanner` — 아직 오늘 콘텐츠가 준비되지 않았을 때(파이프라인 실행 전) 표시.

## 왜 이렇게 되어 있는가
`RawNewsSection`이 별도로 존재하는 이유는 AI가 다섯 개만 골라 가공하는 [[card_news]]와 달리,
그날 수집된 [[news_cards]] 전체를 그대로 보고 싶은 사용자를 위한 것.

## 관련 문서
- [[card_news]] · [[articles]] · [[news_cards]]
- [[community]] — `ContentInteraction`이 쓰는 좋아요/댓글 테이블.
