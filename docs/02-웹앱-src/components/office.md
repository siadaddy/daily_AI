---
title: "office 컴포넌트"
source_paths:
  - src/components/office/OfficeTab.tsx
  - src/components/office/OfficeCanvas.tsx
  - src/components/office/AgentStatusPanel.tsx
  - src/components/office/ActivityLog.tsx
tags: [component, realtime, canvas]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[agents-logs]]"
  - "[[0001-canvas-대신-DOM-금지]]"
---

# office 컴포넌트

## 역할
`office` 탭 — pipeline의 AI 에이전트들이 뉴스를 수집/기획/집필/디자인하는 과정을 사무실
메타포로 시각화하고, 실시간 상태를 보여준다.

## 컴포넌트 구조
- `OfficeTab` — 최상위 조합.
- `OfficeCanvas`(`'use client'`) — Canvas + `requestAnimationFrame` 애니메이션. DOM 애니메이션으로
  바꾸지 말 것 — [[0001-canvas-대신-DOM-금지]] 참고.
- `AgentStatusPanel`(`'use client'`) — [[agents-logs|agents]] 테이블 실시간 상태.
- `ActivityLog`(`'use client'`) — [[agents-logs|logs]] 테이블 실시간 활동 이력.

## 데이터 흐름
`AgentStatusPanel`, `ActivityLog`는 Supabase Realtime을 구독하는 Client Component —
`unstable_cache`를 쓰는 다른 탭과 달리 폴링/캐시가 아니라 실시간 push를 받는다.

## 왜 이렇게 되어 있는가
Canvas 애니메이션 유지 결정은 [[0001-canvas-대신-DOM-금지]] 참고. Realtime을 쓰는 이유는
pipeline이 GitHub Actions에서 몇 분간 실행되는 동안 사용자가 "지금 무슨 에이전트가 뭘 하고
있는지"를 새로고침 없이 보게 하려는 것.

## 관련 문서
- [[agents-logs]]
- [[0001-canvas-대신-DOM-금지]]
- [[pipeline-agents]] — 이 탭이 보여주는 실제 실행 주체.
