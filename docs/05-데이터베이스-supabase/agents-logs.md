---
title: "agents / logs 테이블"
source_paths:
  - src/lib/types/index.ts
  - pipeline/agents/supabase_logger.py
tags: [table, supabase, realtime]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[office]]"
---

# agents / logs 테이블

## 내용
[[office]] 탭(AI Office)의 실시간 모니터링을 위한 한 쌍의 테이블. `agents`는 각 AI 직원의 현재
상태, `logs`는 행동 이력이다. 함께 Realtime 구독되므로 이 볼트에서도 하나의 노트로 묶는다.

## 컬럼

`agents` (`src/lib/types/index.ts`의 `Agent`):

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `name` | string | 예: `수집봇`, `박기획`, `이작가`, `최디자`, `AI주간트렌드`, `한뮤직` |
| `role` | string | |
| `status` | `'online' \| 'idle' \| 'offline'` | |
| `last_active` | string | |
| `avatar` | string \| null | |
| `current_task` | string \| null | |

`logs` (`ActivityLog`):

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | number | PK |
| `agent_name` | string | `agents.name`과 매핑(FK는 아니고 문자열 매칭으로 추정) |
| `action` | string | |
| `detail` | string \| null | |
| `created_at` | string | |

## 에이전트 ID 매핑
[[pipeline-agents#supabase_logger|supabase_logger.py]]의 `AGENT_IDS`가 한글 표시명을
`agents` 테이블의 upsert 키(예: `수집봇` → `collect-bot`, `박기획` → `planner`)로 매핑한다.
새 에이전트를 추가하면 이 매핑도 함께 갱신해야 한다.

## 쓰는 곳
- [[pipeline-agents|pipeline/agents/supabase_logger.py]] — 각 에이전트 실행 전후로
  `update_agent_status`, `log_action` 호출.

## 읽는 곳
- [[office]] 탭 `AgentStatusPanel`, `ActivityLog` — Supabase Realtime 구독(Client Component).

## 관련 문서
- [[office]]
- [[pipeline-agents]]
