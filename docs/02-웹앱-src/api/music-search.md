---
title: "music-search API 라우트"
source_paths:
  - src/app/api/music-search/route.ts
tags: [api, music]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[music]]"
---

# GET /api/music-search?q=

## 역할
곡 제목(쿼리 `q`)으로 YouTube에서 영상 1개를 검색해 `videoId`를 반환. Music Universe(Three.js)
가 곡을 재생할 때 유튜브 embed용 videoId가 필요해서 이 라우트를 거친다.

## 요청
| 파라미터 | 필수 |
|---|---|
| `q` | O — 없으면 400 |

## 외부 의존성
YouTube Data API v3 (`YOUTUBE_API_KEY` 환경변수 필요).

## 캐싱
`revalidate = 86400` (24시간) — 같은 검색어는 하루 동안 재사용, YouTube API 쿼터 절약 목적으로
보인다.

## 왜 이렇게 되어 있는가
`YOUTUBE_API_KEY`가 없으면 500이 아니라 **200 + `{ videoId: null }`**을 반환한다 — 음악 재생
UI 하나가 죽는다고 전체 페이지가 에러 상태로 보이지 않게 하려는 방어적 설계. 새로운 외부
API 연동을 추가할 때도 "키 없음"과 "일시적 에러"를 구분해서 후자만 5xx로 응답하는 패턴을
고려할 것.

## 관련 문서
- [[music]] — `MusicUniverse`가 iframe 내부(Three.js 앱)에서 이 라우트를 호출.
