"""
Supabase agents / logs 테이블 write 헬퍼
Office 탭 실시간 모니터링 연동용
"""

import os
from datetime import datetime, timezone

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# 에이전트 이름 → agents 테이블 id 매핑 (upsert 기준 키)
AGENT_IDS = {
    "수집봇":     "collect-bot",
    "박기획":     "planner",
    "이작가":     "writer",
    "최디자":     "designer",
    "AI주간트렌드": "weekly-trend",
    "한뮤직":     "music-curator",
}

AGENT_ROLES = {
    "수집봇":     "뉴스 수집",
    "박기획":     "콘텐츠 기획",
    "이작가":     "카드뉴스 작성",
    "최디자":     "이미지 생성",
    "AI주간트렌드": "주간 트렌드 분석",
    "한뮤직":     "음악 큐레이션",
}


def _headers() -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }


def update_agent_status(name: str, status: str, current_task: str = ""):
    """agents 테이블에 에이전트 상태 upsert.
    status: 'online' | 'idle' | 'offline'
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        import requests as _req
        agent_id = AGENT_IDS.get(name, name.lower().replace(" ", "-"))
        payload = {
            "id":           agent_id,
            "name":         name,
            "role":         AGENT_ROLES.get(name, ""),
            "status":       status,
            "last_active":  datetime.now(timezone.utc).isoformat(),
            "current_task": current_task,
        }
        _req.post(
            f"{SUPABASE_URL}/rest/v1/agents",
            headers=_headers(),
            json=payload,
            timeout=5,
        )
    except Exception as e:
        print(f"  ⚠️  [supabase_logger] agents upsert 실패 (무시): {e}")


def log_action(agent_name: str, action: str, detail: str = ""):
    """logs 테이블에 에이전트 활동 INSERT."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        import requests as _req
        _req.post(
            f"{SUPABASE_URL}/rest/v1/logs",
            headers={**_headers(), "Prefer": "return=minimal"},
            json={
                "agent_name": agent_name,
                "action":     action,
                "detail":     detail[:500] if detail else "",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            timeout=5,
        )
    except Exception as e:
        print(f"  ⚠️  [supabase_logger] logs insert 실패 (무시): {e}")
