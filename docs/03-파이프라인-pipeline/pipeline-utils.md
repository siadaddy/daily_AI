---
title: "pipeline/utils 모듈"
source_paths:
  - pipeline/utils/agent_memory.py
  - pipeline/utils/gemini_client.py
  - pipeline/utils/quality_tracker.py
tags: [pipeline, utils]
last_reviewed: 2026-07-15
status: 확인됨
related:
  - "[[pipeline-agents]]"
  - "[[agent_memories]]"
---

# pipeline/utils 모듈

## agent_memory.py
AI 직원 공통 메모리 시스템. 로컬 캐시 파일(`pipeline/agent_memory.json`)이 1차 저장소이고,
GitHub Actions처럼 로컬 파일이 없는 환경에서는 실행 시작 시 [[agent_memories]] 테이블에서
자동 복원한다(`_load_from_supabase`). `remember()`로 경험 누적, `get_hints()`로 최근 학습
힌트를 프롬프트에 삽입 — [[pipeline-agents]]의 planner/designer/music_curator/weekly_trend가
모두 이 두 함수를 사용.

## gemini_client.py
이름과 달리 **Groq와 Gemini 둘 다** 다루는 클라이언트 모듈. `GROQ_KEYS`(최대 4개, 라운드로빈
`_key_cycle`)로 Groq(`openai/gpt-oss-120b` 모델, OpenAI 호환 엔드포인트)를 호출한다. 모든
프롬프트에 `_LANG_RULE`(한국어·영어·이모지만 허용, 한자/일본어/베트남어 등 절대 금지 — 특히
한글의 한자 혼용 금지)을 자동으로 덧붙인다 — [[pipeline-agents|writer.py]]의 톤 규칙과 함께
콘텐츠 언어 품질을 강제하는 두 축 중 하나.

## quality_tracker.py
매일 실행 결과의 품질 이슈를 `pipeline/quality_log.json`에 누적하는 학습 트래커.
`_ISSUE_HINTS` 딕셔너리가 이슈 유형별(블랙리스트 표현, 제목-본문 불일치, 해시태그 부족,
깨진 자모/한자/외국어, 도입부 유사, 반복 문장) 경고 문구를 정의하고, 최근 반복되는 이슈는
다음 실행 프롬프트에 "[학습경고]"로 삽입되어 [[pipeline-agents|writer.py]]가 같은 실수를
반복하지 않도록 유도한다.

## 왜 이렇게 되어 있는가
`agent_memory`(경험/힌트)와 `quality_tracker`(품질 이슈)가 별도 파일로 나뉜 이유: 전자는
"무엇을 다뤘는지"(소재 중복 방지 등) 기억이고, 후자는 "어떻게 썼는지"(톤/형식 실수) 기억이라
관심사가 다르기 때문으로 보인다. 새 학습 신호를 추가할 때 이 구분을 따를 것.

## 관련 문서
- [[pipeline-agents]]
- [[agent_memories]]
