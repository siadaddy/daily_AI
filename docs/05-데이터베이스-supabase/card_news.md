---
title: "card_news 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/main.py
  - pipeline/agents/writer.py
  - pipeline/agents/designer.py
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[newsletter]]"
  - "[[news_cards]]"
---

# card_news 테이블

## 내용
AI 크루가 매일 생성하는 카드뉴스(하루 5개). [[news_cards]](원본 뉴스)와 **다른 테이블**.

## 컬럼 (`src/lib/types/index.ts`의 `ContentCard` 기준)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `headline` | string | 카드 헤드라인 |
| `caption` | string | 본문 — `[사실]`/`[분석]`/`[전망]` 태그 포함, [[라이브러리-및-상태관리#caption.ts|caption.ts]]가 색상 하이라이트 처리 |
| `image_url` | string \| null | designer 에이전트가 생성해 Supabase Storage에 올린 이미지 |
| `source_url` | string | 원문 링크 |
| `source_name` | string | 언론사 |

실제 행은 날짜별로 `date`, `cards`(위 구조체 배열) 컬럼에 묶여 저장되는 것으로 보인다
([[pipeline-agents]]의 planner가 `date, cards`를 select하는 코드 참고) — 정확한 테이블 스키마는
Supabase에서 재확인 필요.

## 쓰는 곳
- [[pipeline-agents|pipeline/agents/writer.py]] — 카드뉴스 5개 텍스트 생성.
- [[pipeline-agents|pipeline/agents/designer.py]] — 이미지 생성 후 `image_url` 채움.
- `pipeline/main.py`가 최종 저장을 오케스트레이션.

## 읽는 곳
- [[newsletter]] 탭의 `FeaturedCard`, `NewsCard`.
- [[pipeline-agents|planner.py]] — 최근 3일간 사용된 헤드라인 중복 방지용으로 재조회.

## 관련 문서
- [[news_cards]] (혼동 주의)
- [[pipeline-agents]]
