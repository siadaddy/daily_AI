"""
📊 주간 트렌드 브리핑 에이전트 (매주 월요일 실행)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase card_news + news_cards 테이블에서 지난 7일 데이터 분석
→ 분야별 이슈 빈도 집계 + Gemini 인사이트
→ Supabase weekly_reports 테이블에 저장
"""

import os, json, re as _re
from datetime import date, timedelta
from utils.gemini_client import ask_ai
from utils.agent_memory import remember, get_hints, add_diary

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

SYSTEM = """당신은 BMW 딜러십에 근무하며 삼천리 그룹에 관심 있는 30대 직장인을 위한 경제·기술 뉴스 큐레이터입니다.
이번 주 뉴스를 날카롭게 분석해 "그래서 나한테 뭔 의미야?"에 바로 답하는 인사이트를 씁니다.
삼천리 그룹(에너지·가스·도시가스 계열) 관련 뉴스가 있으면 자동차·에너지 산업 연결 관점으로 언급.

글쓰기 원칙:
- 구체적 기업명·수치·날짜가 없는 문장은 쓰지 않는다
- "~이다", "~기 때문이다", "~것으로 예상된다" 패턴 3회 이상 반복 금지
- "중요성이 증가", "새로운 산업 창출", "많은 기업들" 같은 공허한 표현 금지
- 딱 이 뉴스를 읽은 독자가 내일 동료에게 꺼낼 수 있는 얘기를 써라
- JSON만 출력. 코드블록(```) 없이."""

_CAT_ORDER = [
    "🤖 AI / 인공지능",
    "💰 경제 / 금융",
    "💻 기술 / IT",
    "🚗 자동차",
    "🏙️ 사회",
    "🚨 사건 / 사고",
]


def _load_recent_from_supabase(n: int = 7) -> list:
    """Supabase card_news 테이블에서 최근 n일치 데이터 로드"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠️  Supabase 설정 없음 — 데이터 로드 불가")
        return []
    try:
        import requests as _req
        today = date.today()
        cutoff = (today - timedelta(days=n)).strftime("%Y-%m-%d")
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
        r = _req.get(
            f"{SUPABASE_URL}/rest/v1/card_news?select=date,cards&date=gte.{cutoff}&order=date.desc",
            headers=headers,
            timeout=10,
        )
        if r.status_code != 200:
            print(f"  ⚠️  card_news 로드 실패 ({r.status_code})")
            return []
        return r.json() or []
    except Exception as e:
        print(f"  ⚠️  card_news 로드 오류: {e}")
        return []


def _load_news_cards_from_supabase(n: int = 7) -> list:
    """Supabase news_cards 테이블에서 최근 n일치 기사 로드"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        import requests as _req
        cutoff = (date.today() - timedelta(days=n)).strftime("%Y-%m-%d")
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
        r = _req.get(
            f"{SUPABASE_URL}/rest/v1/news_cards?select=date,title,category&date=gte.{cutoff}",
            headers=headers,
            timeout=10,
        )
        if r.status_code != 200:
            return []
        return r.json() or []
    except Exception as e:
        print(f"  ⚠️  news_cards 로드 오류: {e}")
        return []


def _aggregate(card_news_rows: list, news_cards_rows: list) -> dict:
    cat_counts: dict[str, int] = {}
    all_headlines: list[str] = []
    news_samples: dict[str, list[str]] = {}

    # card_news 헤드라인
    for row in card_news_rows:
        for card in (row.get("cards") or []):
            h = card.get("headline", "").strip()
            if h:
                all_headlines.append(h)

    # news_cards 카테고리 집계
    for row in news_cards_rows:
        cat = row.get("category", "").strip()
        title = row.get("title", "").strip()
        if not cat or "하이라이트" in cat or "BMW" in cat:
            continue
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        if cat not in news_samples:
            news_samples[cat] = []
        if title and len(news_samples[cat]) < 5:
            news_samples[cat].append(title)

    ordered = []
    for cat in _CAT_ORDER:
        if cat in cat_counts:
            ordered.append({"name": cat, "count": cat_counts[cat]})
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        if not any(o["name"] == cat for o in ordered):
            ordered.append({"name": cat, "count": cnt})

    max_cnt = max((o["count"] for o in ordered), default=1)
    for o in ordered:
        o["pct"] = round(o["count"] / max_cnt * 100)

    return {
        "category_counts": ordered,
        "all_headlines":   all_headlines,
        "news_samples":    news_samples,
    }


def _close_json(s: str) -> str:
    in_str, escaped = False, False
    for ch in s:
        if escaped:
            escaped = False
            continue
        if ch == '\\' and in_str:
            escaped = True
            continue
        if ch == '"':
            in_str = not in_str
    if in_str:
        s += '"'
    opens = s.count('{') - s.count('}')
    arr_opens = s.count('[') - s.count(']')
    s += ']' * max(arr_opens, 0)
    s += '}' * max(opens, 0)
    return s


def _ai_analysis(agg: dict, days_analyzed: int) -> dict:
    weekly_hints = get_hints("AI주간트렌드")
    cat_summary = "\n".join(
        f"  {o['name']}: {o['count']}건"
        for o in agg["category_counts"]
    )
    headlines_text = "\n".join(f"  - {h}" for h in agg["all_headlines"][:20])

    top_cats = [o["name"] for o in agg["category_counts"][:4]]
    samples_text = ""
    for cat in top_cats:
        titles = agg["news_samples"].get(cat, [])
        if titles:
            samples_text += f"\n  [{cat}]\n" + "\n".join(f"    · {t}" for t in titles[:3])

    prompt = f"""아래는 지난 {days_analyzed}일간 AI 뉴스레터의 뉴스 데이터입니다.{weekly_hints}

=== 분야별 기사 건수 ===
{cat_summary}

=== 이번 주 카드뉴스 헤드라인 (AI 선정) ===
{headlines_text}

=== 분야별 기사 샘플 (실제 뉴스 제목) ===
{samples_text}

위 데이터만 근거로 아래 JSON 형식으로 출력하세요.
데이터에 없는 수치·기업명·사건 절대 창작 금지.

{{
  "week_summary": "이번 주 전체를 한 문장으로 — 위 헤드라인에서 뽑은 핵심 키워드 2~3개 포함 (30자 내외)",
  "hot_category": "기사 건수 1위 분야명 (위 분야명 그대로 복사)",
  "sections": [
    {{
      "category": "분야명 (위 분야명 그대로 복사 — 절대 바꾸지 말 것)",
      "top_issue": "위 기사 제목에서 뽑은 이번 주 핵심 이슈 한 줄 (20자 내외)",
      "insight": "2문장. ①위 기사에 등장한 기업명·수치 포함해 무슨 일이 있었는지. ②독자에게 미치는 실질적 의미."
    }}
  ],
  "weekly_insight": "이번 주 뉴스를 관통하는 흐름 3문장. 실제 등장한 기업·이슈·수치 언급. 분야 간 연결고리와 독자에게 주는 시사점.",
  "next_watch": [
    "다음 주 주목할 이슈 — 구체적 기업명 또는 이벤트명 포함"
  ]
}}

⚠️ 반드시 지킬 규칙:
- sections: 기사 건수 상위 4개 분야만 포함 (0건 분야 제외)
- next_watch: 2~3개
- 한국어·영어·이모지만. 베트남어·러시아어·한자·일본어 등 절대 금지
- JSON만 출력. 코드블록(```) 없이."""

    raw = ask_ai(prompt, system=SYSTEM, temperature=0.55, json_mode=False, max_tokens=4096)
    raw = raw.replace("```json", "").replace("```", "").strip()
    raw = _re.sub(r'[Ѐ-ӿĀ-ɏḀ-ỿ]', '', raw)

    try:
        return json.loads(raw)
    except Exception:
        m = _re.search(r'\{.*', raw, _re.DOTALL)
        if m:
            fragment = _close_json(m.group())
            try:
                return json.loads(fragment)
            except Exception:
                pass
        raise ValueError(f"JSON 파싱 실패: {raw[:300]}")


def _save_to_supabase(payload: dict) -> bool:
    """weekly_reports 테이블에 upsert"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    try:
        import requests as _req
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }
        today = date.today().strftime("%Y-%m-%d")
        week_start = (date.today() - timedelta(days=7)).strftime("%Y-%m-%d")
        row = {
            "week_start":     week_start,
            "week_end":       today,
            "week_label":     payload.get("week_label", ""),
            "generated_at":   today,
            "days_analyzed":  payload.get("days_analyzed", 0),
            "week_summary":   payload.get("week_summary", ""),
            "hot_category":   payload.get("hot_category", ""),
            "category_counts": payload.get("category_counts", []),
            "sections":        payload.get("sections", []),
            "weekly_insight":  payload.get("weekly_insight", ""),
            "next_watch":      payload.get("next_watch", []),
            "top_headlines":   payload.get("top_headlines", []),
        }
        r = _req.post(
            f"{SUPABASE_URL}/rest/v1/weekly_reports",
            headers=headers,
            json=row,
            timeout=10,
        )
        if r.status_code in (200, 201):
            print("  ✅ Supabase weekly_reports 저장 완료")
            return True
        print(f"  ⚠️  weekly_reports 저장 실패 ({r.status_code}): {r.text[:100]}")
        return False
    except Exception as e:
        print(f"  ⚠️  weekly_reports 저장 오류: {e}")
        return False


def run():
    print("📊 주간 트렌드 브리핑 에이전트 실행 중...")

    card_news_rows  = _load_recent_from_supabase(7)
    news_cards_rows = _load_news_cards_from_supabase(7)

    if not card_news_rows and not news_cards_rows:
        print("  ⚠️  분석 가능한 데이터 없음 — 스킵")
        return

    days_analyzed = 7
    print(f"  📂 card_news {len(card_news_rows)}건, news_cards {len(news_cards_rows)}건 집계 중...")
    agg = _aggregate(card_news_rows, news_cards_rows)

    print("  🤖 Gemini 인사이트 분석 중...")
    ai = _ai_analysis(agg, days_analyzed)

    today = date.today()
    oldest = today - timedelta(days=days_analyzed)
    week_label = f"{oldest.strftime('%m/%d')} ~ {(today - timedelta(days=1)).strftime('%m/%d')}"

    remember("AI주간트렌드", "weekly_analysis", {
        "week_label":   week_label,
        "week_summary": ai.get("week_summary", ""),
        "hot_category": ai.get("hot_category", ""),
    })

    hot = ai.get("hot_category", "")
    summary = ai.get("week_summary", "")
    add_diary("AI주간트렌드",
              f"{week_label} 주간 분석 완료. 이번 주 핫이슈는 {hot}. '{summary}'",
              trigger="weekly_trend")

    payload = {
        "week_label":      week_label,
        "generated_at":    today.strftime("%Y-%m-%d"),
        "days_analyzed":   days_analyzed,
        "week_summary":    ai.get("week_summary", ""),
        "hot_category":    ai.get("hot_category", ""),
        "category_counts": agg["category_counts"],
        "sections":        ai.get("sections", []),
        "weekly_insight":  ai.get("weekly_insight", ""),
        "next_watch":      ai.get("next_watch", []),
        "top_headlines":   agg["all_headlines"][:35],
    }

    _save_to_supabase(payload)
    print(f"  ✅ 주간 트렌드 완료: '{payload['week_summary']}'")
    return payload
