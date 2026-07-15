---
title: "articles 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/agents/writer.py
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[newsletter]]"
---

# articles 테이블

## 내용
AI 편집장("시아아빠" 페르소나)이 매일 쓰는 블로그 아티클 1건.

## 컬럼 (`src/lib/types/index.ts`의 `Article` 기준)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `date` | string | |
| `title` | string \| null | |
| `content` | string | 마크다운 — [[라이브러리-및-상태관리#caption.ts|mdToHtml()]]로 HTML 변환해 렌더링 |
| `created_at` | string | |

## 쓰는 곳
- [[pipeline-agents|pipeline/agents/writer.py]] — 카드뉴스와 같은 실행에서 함께 생성.
  글쓰기 톤은 writer.py의 `SYSTEM` 프롬프트에 상세히 정의(반말 카톡체, 블랙리스트 표현 금지 등).

## 읽는 곳
- [[newsletter]] 탭 `BlogArticle`.
- `src/app/page.tsx`의 `fetchTodayArticle` — 페이지 `<meta description>` 생성에도 사용(글 본문 앞부분을 잘라 SEO 설명으로 사용).
- [[analytics]] — 기간 내 아티클 본문을 키워드 추출 입력으로 사용.

## 관련 문서
- [[pipeline-agents]]
