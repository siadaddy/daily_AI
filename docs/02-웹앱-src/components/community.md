---
title: "community 컴포넌트"
source_paths:
  - src/components/community/AuthModal.tsx
  - src/app/actions/community.ts
tags: [component, auth]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[community]]"
  - "[[layout]]"
---

# community 컴포넌트

## 역할
로그인/회원가입 모달(`AuthModal`) 하나가 이 폴더의 전부다. 게시판 목록/글쓰기 UI는 이 폴더가
아니라 다른 곳(뉴스레터/리포트 등 콘텐츠에 붙는 인라인 댓글/좋아요 UI는
[[newsletter]]의 `ContentInteraction`)에 있는 것으로 보이며, 게시판 자체 페이지가 있다면
추가 확인 필요.

## 컴포넌트
- `AuthModal({ onClose })` — [[layout]]의 `UserButton` 클릭 시 열림. 이메일/비밀번호
  회원가입·로그인 폼, Server Actions(`signUp`, `signIn`)를 직접 호출.

## 데이터 흐름
`AuthModal` → `src/app/actions/community.ts`의 `signUp`/`signIn`/`signOut` Server Actions →
Supabase Auth. 입력 검증은 [[라이브러리-및-상태관리#validation.ts|validateText()]]로 닉네임
길이만 여기서 검증(이메일/비밀번호 형식은 Supabase Auth가 처리).

## 관련 문서
- [[community]] — Server Actions와 테이블 상세.
- [[layout]] — `UserButton`.
