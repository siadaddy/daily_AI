---
title: "weekly-briefing/generate API 라우트 (레거시 별칭)"
source_paths:
  - src/app/api/weekly-briefing/generate/route.ts
tags: [api, legacy]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[reports-generate]]"
---

# GET/POST /api/weekly-briefing/generate

## 역할
[[reports-generate]]의 구버전 경로명. 전체가 한 줄짜리 재수출이다:

```ts
export { GET, POST, maxDuration } from '@/app/api/reports/generate/route'
```

로직/문서는 전혀 중복되지 않고 [[reports-generate]]로 100% 위임된다. 이 경로로 걸린 Cron이나
외부 연동이 아직 있을 수 있어 삭제하지 않고 별칭만 유지하는 것으로 보인다.

## 신규 코드 작성 시
새 코드에서는 이 경로를 직접 호출하지 말고 `/api/reports/generate`를 사용할 것. 이 라우트를
수정할 일이 생긴다면 대부분 [[reports-generate]] 쪽을 고쳐야 하는 경우다.

## 관련 문서
- [[reports-generate]]
