---
title: "community_posts / community_comments / content_likes / content_comments 테이블"
source_paths:
  - src/lib/types/index.ts
  - src/app/actions/community.ts
  - src/lib/utils/validation.ts
tags: [table, supabase]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[community]]"
  - "[[라이브러리-및-상태관리]]"
---

# 커뮤니티 테이블 그룹

## 내용
자유 게시판(`community_posts`, `community_comments`)과, 뉴스레터/리포트 등 콘텐츠에 다는
인라인 좋아요·댓글(`content_likes`, `content_comments`)을 하나로 묶는다. 둘 다 항상 함께
Server Actions에서 다뤄지기 때문.

## 컬럼

`community_posts` (`CommunityPost`):

| 컬럼 | 타입 |
|---|---|
| `id` | number |
| `user_id` | string |
| `nickname` | string |
| `title` | string |
| `content` | string |
| `view_count` | number |
| `created_at` | string |

`community_comments` (`CommunityComment`):

| 컬럼 | 타입 |
|---|---|
| `id` | number |
| `post_id` | number |
| `user_id` | string |
| `nickname` | string |
| `content` | string |
| `created_at` | string |

`content_likes`, `content_comments`는 게시판이 아닌 콘텐츠(뉴스레터 카드, 아티클 등)에 대한
범용 좋아요/댓글로 추정되며, [[라이브러리-및-상태관리#validation.ts|src/lib/utils/validation.ts]]의
`isValidContentKey()`(영문/숫자/하이픈/언더스코어/콜론/점, 최대 200자)로 검증하는
`content_key` 컬럼을 갖는 것으로 보인다 — 정확한 스키마는 확인 필요.

## 쓰는 곳 / 읽는 곳
- `src/app/actions/community.ts` (Server Actions) — `signUp`, `signIn`, `signOut`, `createPost`,
  `deletePost` 등. 모든 사용자 입력은 [[라이브러리-및-상태관리#validation.ts|validation.ts]]의
  `validateText()`/`LIMITS`로 길이 검증 후 저장.
- [[community]] 탭 `AuthModal` 등 UI.

## 왜 이렇게 되어 있는가
- 에러 메시지를 그대로 클라이언트에 노출하지 않기 위해 `publicDbError()`가 Supabase 원본
  에러를 서버 로그로만 남기고 사용자에게는 일반화된 한국어 메시지를 반환한다.

## 관련 문서
- [[community]]
- [[라이브러리-및-상태관리]]
