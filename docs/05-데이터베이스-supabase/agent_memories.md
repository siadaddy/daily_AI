---
title: "agent_memories 테이블"
source_paths:
  - pipeline/utils/agent_memory.py
  - ai-crew/utils/agent_memory.py
tags: [table, supabase]
last_reviewed: 2026-09-04
status: 초안
related:
  - "[[pipeline-utils]]"
  - "[[ai-crew-개요]]"
---

# agent_memories 테이블

## 내용
파이프라인 에이전트의 장기 기억. 매 실행마다 경험(성공/실패 패턴, 힌트)을 누적해 다음 실행
프롬프트에 반영한다(`remember()`, `get_hints()` 패턴).

## 쓰기/읽기 전략
- 1차 저장소는 로컬 캐시 파일(`pipeline/agent_memory.json`)이고, GitHub Actions처럼 로컬 파일이
  없는 환경에서는 실행 시작 시 Supabase `agent_memories`에서 자동 복원한다
  ([[pipeline-utils#agent_memory|pipeline/utils/agent_memory.py]]).
- `ai-crew/`도 동일한 이름의 `agent_memory.py`를 갖고 있지만 **별도 구현**이다 — pipeline은
  `agent_name` 기준으로 여러 에이전트가 공유하는 반면, ai-crew의 음악 큐레이터는
  `agent_memories?agent_name=eq.한뮤직&select=events`로 자기 자신의 곡 이력만 조회한다
  ([[ai-crew-개요]] 참고).

## 확인 필요
정확한 컬럼 스키마(예: `agent_name`, `events`, `updated_at` 등)는 코드에서 사용하는 쿼리
파라미터로 추정한 것으로, Supabase에서 직접 확인 후 갱신할 것.

## 쓰는 곳 / 읽는 곳
- [[pipeline-utils]] — `remember()`(쓰기), `get_hints()`(읽기).
- [[ai-crew-개요]] — 음악 큐레이터가 기존 큐레이션 이력 조회에 사용.
- **웹앱 `/agents`, `/agents/[name]`** — `src/lib/agents/memory.ts`가 `persona`,
  `growth_score`, `diary`를 읽어 에이전트별 성장 기록 페이지로 렌더한다.
  2026-09-04 이전에는 웹앱에서 읽는 곳이 전혀 없었다.

`diary`는 `{ date, lesson, trigger }` 배열이며 에이전트당 최근 60건까지만 유지된다
(`add_diary()`가 앞에 넣고 잘라낸다). `AI주간트렌드` 행은 해당 에이전트가 제거된 뒤에도
과거 기록으로 남아 계속 조회된다 — [[pipeline-agents]] 참고.

## 관련 문서
- [[pipeline-utils]]
- [[ai-crew-개요]]
