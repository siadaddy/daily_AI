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
  - src/components/newsletter/TalkingPointsSection.tsx
  - src/components/newsletter/FactSummary.tsx
  - src/components/newsletter/ContentInteraction.tsx
  - src/components/newsletter/PreparingBanner.tsx
tags: [component]
last_reviewed: 2026-09-04
status: 확인됨
related:
  - "[[card_news]]"
  - "[[articles]]"
  - "[[news_cards]]"
---

# newsletter 컴포넌트

## 역할
기본 탭(`?tab=newsletter`, 생략 가능). 특정 날짜의 AI 생성 콘텐츠를 보여준다.
`NewsletterTab`은 `{ date }`만 받는 Server Component라 탭 SPA(`/?date=`)와 독립 라우트
(`/news/[date]`) 양쪽에서 그대로 재사용된다 — [[00-src-개요]] 참고.

## 컴포넌트 구조
- `NewsletterTab` — 최상위. `fetchTodayArticle`(page.tsx의 메타데이터 생성에서도 재사용)로
  [[articles]]를 조회하는 등 데이터 페칭 진입점.
- `FactSummary` — 상단 사실 요약(발행일·카드 수·수집 기사 수·분야/출처 수).
  AI 어시스턴트가 인용할 때 필요한 메타데이터를 본문에 명시하는 용도.
- `DateNav` — 날짜 이동 UI. 칩은 `<button>`이 아니라 `next/link`다 — JS 클릭 핸들러였을 때
  크롤러가 과거 아카이브를 전혀 따라갈 수 없었기 때문(2026-09-04 수정).
- `FeaturedCard` — 오늘의 대표 카드([[card_news]] 중 1개 강조).
- `NewsCard` — 카드뉴스 개별 카드, `[사실]/[분석]/[전망]` 하이라이트는
  [[라이브러리-및-상태관리#caption.ts|highlightCaption()]] 사용.
- `BlogArticle` — [[articles]] 본문을 [[라이브러리-및-상태관리#caption.ts|mdToHtml()]]로 변환해 렌더링.
- `RawNewsSection` — [[news_cards]] 원본 뉴스 목록 노출(가공 전 원자료를 그대로 보여주는 섹션).
- `AiPicksSection` — [[news_trends]]의 `top3`(AI가 고른 그날의 TOP 3)와
  `talking_points.one_line_insight`를 렌더.
- `TalkingPointsSection` — [[news_trends]]의 `talking_points.talking_points[]` 3건을
  `{ topic, context, question, business_impact }` 카드로 렌더. `collect.py`가 매일
  생성해 저장하지만 2026-09-04 전까지 화면에 노출되지 않던 데이터다.
- `ContentInteraction` — 좋아요/댓글 UI, [[community]]의 `content_likes`/`content_comments`
  테이블과 연동.
- `PreparingBanner` — 아직 오늘 콘텐츠가 준비되지 않았을 때(파이프라인 실행 전) 표시.

## 왜 이렇게 되어 있는가
`RawNewsSection`이 별도로 존재하는 이유는 AI가 다섯 개만 골라 가공하는 [[card_news]]와 달리,
그날 수집된 [[news_cards]] 전체를 그대로 보고 싶은 사용자를 위한 것.

## 관련 문서
- [[card_news]] · [[articles]] · [[news_cards]] · [[news_trends]]
- [[00-src-개요]] — `/news/[date]` 독립 라우트
- [[community]] — `ContentInteraction`이 쓰는 좋아요/댓글 테이블.
