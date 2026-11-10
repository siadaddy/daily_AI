#!/usr/bin/env python3
"""
🚗 자동차 인사이트 — 2단계 분석·저장
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
output/auto_{TODAY}.json (auto_collect.py 산출물)을 읽어
  사전 필터(auto_rules) → LLM 배치 분류·요약·시사점 → 속보 룰 → Supabase 저장 → 속보 ntfy
를 수행한다.

원칙: 분류·요약·시사점만 LLM 이 하고, 브랜드·속보·건수는 코드가 정한다.
LLM 이 실패해도 기사는 버리지 않는다 — 규칙 기반 최소 레코드로 저장한다.

사용:
  python pipeline/auto_analyze.py --dry-run --no-llm   # DB·LLM·알림 없이 규칙만 점검
  python pipeline/auto_analyze.py --dry-run            # LLM 은 쓰되 저장·알림 없음
  python pipeline/auto_analyze.py                      # 전체 실행
"""
from __future__ import annotations

import argparse
import json
import re
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.auto_rules import BMW_GROUP, BRANDS, is_breaking, relevance_score, rule_importance, tag_brands  # noqa: E402
from utils.news_common import dedupe_stories  # noqa: E402

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(PIPELINE_DIR, "output")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
NTFY_TOPIC = os.getenv("NTFY_TOPIC", "")

_KST = timezone(timedelta(hours=9))
TODAY = datetime.now(_KST).strftime("%Y-%m-%d")

MAX_ANALYZE = 120      # 하루에 LLM 으로 보내는 상한 (무료 쿼터 보호). 점수 높은 순으로 채운다.
BATCH_SIZE = 12
GROUP_RESERVE = 40     # BMW 그룹 기사에 먼저 보장하는 자리
PER_BRAND_CAP = 10     # 타 브랜드 하나가 독점하지 못하게 거는 소프트 캡
MAX_BREAKING_PUSH = 5  # 하루 속보 푸시 상한 — 알림 피로 방지
MIN_KEEP_IMPORTANCE = 2  # 1 = 무관 판정 → 저장하지 않는다

TOPICS = ("ev_aftersales", "ev_industry", "import_market", "sdv", "ai_auto", "bmw_group", "regulation", "other")
# 요약(다이제스트)을 만드는 주제 — 'other' 는 요약할 가치가 없다
DIGEST_TOPICS = ("bmw_group", "regulation", "ev_aftersales", "ev_industry", "import_market", "sdv", "ai_auto")
DIGEST_MIN_ARTICLES = 2   # 기사가 이만큼은 있어야 요약한다
DIGEST_PER_TOPIC = 12     # 요약에 넣는 주제당 기사 수(중요도 순)
DEDUPE_DAYS = 3           # 최근 며칠 안에 이미 저장한 사건은 다시 모으지 않는다
COMPETITOR_ITEMS = ("service_policy", "price", "campaign", "recall")


# ───────────────────────── 순수 함수 (테스트 대상) ─────────────────────────

_SOURCE_RANK = {"trade": 3, "global": 2, "naver": 1, "google": 0, "gov": 3}


def story_rank(a: dict) -> tuple:
    """같은 사건 중 대표로 남길 기사의 우선순위: BMW 그룹 > 전문지·해외매체 > 요약이 긴 것(정보가 많다)."""
    text = f"{a.get('title', '')} {a.get('summary', '')}"
    in_group = bool(set(tag_brands(text)) & BMW_GROUP)
    return (in_group, _SOURCE_RANK.get(a.get("source_type", ""), 0), len(a.get("summary") or ""))


def select_for_analysis(articles: list[dict], limit: int = MAX_ANALYZE) -> list[dict]:
    """분석 대상 선별. 상한(limit)이 있으니 무엇을 먼저 채울지가 곧 편집 방침이다.

    1) BMW 그룹 기사를 먼저(최대 GROUP_RESERVE) — 이 팀장이 가장 놓치면 안 되는 영역이라 점수와 무관하게 보장한다.
    2) 나머지는 점수 내림차순(동점이면 최신순). 단, 브랜드 하나가 자리를 독점하지 않게 브랜드당 PER_BRAND_CAP 까지만.
    3) 그래도 자리가 남으면 캡에 걸린 기사·0점 기사로 채운다(재현율 보호).
    """
    scored = []
    for a in articles:
        text = f"{a.get('title', '')} {a.get('summary', '')}"
        brands = tag_brands(text)
        s = relevance_score(a.get("title", ""), a.get("summary", ""), a.get("topic_hint"))
        if a.get("dup_count", 1) >= 3:  # 3개 매체 이상이 다룬 사건 — 코드가 정하는 중요도 신호
            s += 1
        scored.append((s, a.get("published_at") or "", a, brands))
    scored.sort(key=lambda t: (t[0], t[1]), reverse=True)

    picked: list[dict] = []
    group = [t for t in scored if set(t[3]) & BMW_GROUP][:GROUP_RESERVE]
    picked.extend(t[2] for t in group)
    taken = {id(t[2]) for t in group}

    per_brand: dict[str, int] = {}
    overflow: list[dict] = []
    for s, _, a, brands in scored:
        if id(a) in taken or len(picked) >= limit:
            continue
        if s <= 0:
            overflow.append(a)
            continue
        key = brands[0] if brands else ""
        if key and per_brand.get(key, 0) >= PER_BRAND_CAP:
            overflow.append(a)
            continue
        per_brand[key] = per_brand.get(key, 0) + 1
        picked.append(a)
    for a in overflow:
        if len(picked) >= limit:
            break
        picked.append(a)
    return picked[:limit]


def build_prompt(batch: list[dict]) -> str:
    lines = []
    for i, a in enumerate(batch):
        lang = "EN" if a.get("lang") == "en" else "KO"
        lines.append(f"[{i}] ({lang}, {a.get('source', '')}) {a.get('title', '')} :: {(a.get('summary') or '')[:160]}")
    articles = "\n".join(lines)
    return f"""당신은 수입차 브랜드 서비스본부 기획실의 뉴스 분석 보조입니다.
아래 기사 목록을 분류하고 요약하세요. 반드시 JSON 만 출력합니다.

규칙:
- 제공된 제목·요약에 **있는 내용만** 쓰세요. 숫자·날짜·고유명사를 추측하거나 만들어내지 마세요. 정보가 부족하면 짧게 쓰세요.
- topic 은 {list(TOPICS)} 중 하나. 아래 순서대로 가장 먼저 맞는 것을 고르세요.
  1) bmw_group: BMW·MINI·롤스로이스·한독모터스가 기사의 주인공(주어)인 경우
  2) regulation: 리콜·결함·과징금·정부 정책·규제·보조금·관세·소비자 분쟁이 핵심인 경우
  3) ev_aftersales: 정비·서비스센터·부품·보증·수리권·딜러 서비스 역량·배터리 진단/수리/재사용 기술이 핵심인 경우
  4) ai_auto: AI가 핵심 소재인 경우(차량 내 AI·AI 정비/고객응대·자율주행·로보택시)
  5) sdv: 소프트웨어 정의 차량·OTA·차량 OS·커넥티드가 핵심인 경우
  6) ev_industry: 전기차·배터리 산업 동향(신차·가격·성능, 배터리 기술·공급망·투자, 충전 인프라, EV 판매 실적) — 서비스 관점이 아닌 시장·기술 소식
  7) import_market: 수입차·경쟁사 판매·등록·점유율·전략(내연기관 포함)
  8) other: 위에 해당하지 않는 것. 자동차 산업과 거리가 멀면 importance 1.
  한 기사가 여러 주제에 걸치면 위 번호가 작은 쪽을 고르세요.
- importance 는 1~5 정수. 1=자동차 서비스 기획과 무관(연예·레이싱 행사·타 산업), 2=참고, 3=알아둘 만함, 4=중요, 5=즉시 보고감.
- summary_ko: 한국어 1~2문장 요약(120자 이내).
- title_ko: 영어(EN) 기사만 자연스러운 한국어 제목으로 번역. 한국어(KO) 기사는 빈 문자열.
- so_what: 서비스본부 기획 관점의 시사점 한 줄(60자 이내). 이것은 해석이므로 단정하지 말고 "~할 수 있음/~점검 필요" 어조로. 근거가 약하면 빈 문자열.
- competitor: BMW 그룹이 아닌 경쟁 브랜드의 서비스정책·가격·캠페인·리콜 사실이 기사에 **명시**된 경우만 {{"brand":"벤츠","item":"{'|'.join(COMPETITOR_ITEMS)} 중 하나","note":"사실 한 줄"}}, 아니면 null.

출력 형식:
{{"items":[{{"i":0,"topic":"ev_aftersales","importance":3,"summary_ko":"...","title_ko":"","so_what":"...","competitor":null}}]}}

기사 목록:
{articles}"""


def parse_llm_json(text: str) -> Optional[dict]:
    """LLM 응답에서 {"items": [...]} 를 복구한다. 못 읽으면 None.

    - 정상: {"items": [...]}  /  배열만 온 경우: [...]  /  코드펜스·잡설이 붙은 경우
    - 출력이 잘렸거나 일부가 깨졌어도, 끝까지 읽힌 항목({"i": 정수 …})은 건져 쓴다.
      (이 배치를 통째로 버리면 번역·시사점·경쟁사 기록이 전부 사라지기 때문)
    """
    if not text:
        return None
    body = re.sub(r"```(?:json)?", "", text).strip()
    try:
        data = json.loads(body)
        if isinstance(data, dict) and isinstance(data.get("items"), list):
            return data
        if isinstance(data, list):
            return {"items": data}
    except json.JSONDecodeError:
        pass
    lo, hi = body.find("{"), body.rfind("}")
    if 0 <= lo < hi:  # 앞뒤에 잡설이 붙은 정상 객체
        try:
            data = json.loads(body[lo:hi + 1])
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return data
        except json.JSONDecodeError:
            pass
    # 부분 복구: '{' 마다 객체 하나를 읽어 보고 "i" 가 있는 것만 모은다
    decoder = json.JSONDecoder()
    items, pos = [], 0
    while True:
        pos = body.find("{", pos)
        if pos < 0:
            break
        try:
            obj, used = decoder.raw_decode(body[pos:])
        except json.JSONDecodeError:
            pos += 1
            continue
        if isinstance(obj, dict) and isinstance(obj.get("i"), int):
            items.append(obj)
            pos += used
        else:
            pos += 1
    return {"items": items} if items else None


def _clamp_int(value, lo: int, hi: int, default: int) -> int:
    try:
        return max(lo, min(hi, int(value)))
    except (TypeError, ValueError):
        return default


def normalize_item(raw: dict, article: dict) -> dict:
    """LLM 한 항목을 검증·보정한다. 허용 밖의 값은 규칙 기반 기본값으로 대체."""
    topic = raw.get("topic")
    if topic not in TOPICS:
        topic = article.get("topic_hint") or "other"
    competitor = raw.get("competitor")
    if isinstance(competitor, dict):
        brand, item, note = competitor.get("brand"), competitor.get("item"), str(competitor.get("note") or "").strip()
        competitor = (
            {"brand": brand, "item": item, "note": note[:200]}
            if brand in BRANDS and brand not in BMW_GROUP and item in COMPETITOR_ITEMS and note
            else None
        )
    else:
        competitor = None
    return {
        "topic": topic,
        "importance": _clamp_int(raw.get("importance"), 1, 5, 2),
        "summary_ko": str(raw.get("summary_ko") or "").strip()[:300],
        "title_ko": str(raw.get("title_ko") or "").strip()[:200],
        "so_what": str(raw.get("so_what") or "").strip()[:120],
        "competitor": competitor,
    }


def fallback_item(article: dict) -> dict:
    """LLM 없이 저장할 최소 레코드. 한국어 기사는 원 요약을 그대로, 영문은 요약 없이."""
    ko = article.get("lang") != "en"
    text = f"{article.get('title', '')} {article.get('summary', '')}"
    return {
        "topic": article.get("topic_hint") or "other",
        "importance": rule_importance(article.get("title", ""), article.get("summary", ""), tag_brands(text)),
        "summary_ko": (article.get("summary") or "")[:300] if ko else "",
        "title_ko": "",
        "so_what": "",
        "competitor": None,
    }


def to_row(article: dict, item: dict, today: str) -> dict:
    text = f"{article.get('title', '')} {article.get('summary', '')}"
    brands = tag_brands(text)
    title = article["title"]
    title_original = ""
    if article.get("lang") == "en" and item["title_ko"]:
        title, title_original = item["title_ko"], article["title"]
    if article.get("lang") == "en" and not item["title_ko"]:
        title_original = article["title"]
    return {
        "date": today,
        "title": title,
        "title_original": title_original,
        "summary_ko": item["summary_ko"],
        "link": article["link"],
        "source": article.get("source", ""),
        "source_type": article.get("source_type", "trade"),
        "topic": item["topic"],
        "brands": brands,
        "importance": item["importance"],
        "is_breaking": is_breaking(article["title"], article.get("summary", ""), brands, item["importance"]),
        "lang": article.get("lang", "ko"),
        "published_at": article.get("published_at"),
        "so_what": item["so_what"],
    }


# ───────────────────────── 실행부 (네트워크) ─────────────────────────

OPENAI_MODEL = "gpt-4o-mini"


def ask_openai(prompt: str, max_tokens: int = 4096) -> str:
    """자동차 분석 전용 LLM 호출.

    ⚠️ Gemini 를 쓰지 않는 이유: AI 뉴스레터 파이프라인(pipeline-daily)과 같은 Gemini 무료 키를 공유하면
    하루 쿼터를 먼저 소진해 뉴스레터 글·카드뉴스가 비어 버린다(2026-11-08~09 실제 사고).
    OpenAI 는 리포트 생성에도 이미 쓰는 키이고, 하루 분석 비용은 몇 센트 수준이다.
    """
    key = os.getenv("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY 없음")
    r = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={
            "model": OPENAI_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        },
        timeout=90,
    )
    r.raise_for_status()
    return (r.json()["choices"][0]["message"]["content"] or "").strip()


def analyze_batch(batch: list[dict], use_llm: bool) -> list[dict]:
    """배치 하나를 분석해 항목 리스트(배치와 같은 길이·순서)를 돌려준다."""
    if use_llm:
        try:
            text = ask_openai(build_prompt(batch))
            data = parse_llm_json(text)
            if data and isinstance(data.get("items"), list):
                by_idx = {}
                for raw in data["items"]:
                    if isinstance(raw, dict) and isinstance(raw.get("i"), int) and 0 <= raw["i"] < len(batch):
                        by_idx[raw["i"]] = raw
                return [normalize_item(by_idx[i], a) if i in by_idx else fallback_item(a) for i, a in enumerate(batch)]
            head, tail = (text or "")[:150].replace("\n", " "), (text or "")[-150:].replace("\n", " ")
            print(f"    ⚠️  LLM 응답 파싱 실패({len(text or '')}자) — 이 배치는 규칙 기반으로 저장\n       앞: {head}\n       뒤: {tail}")
        except Exception as e:  # noqa: BLE001
            print(f"    ⚠️  LLM 호출 실패 — 이 배치는 규칙 기반으로 저장: {e}")
    return [fallback_item(a) for a in batch]


def remap_topics_for_legacy_db(rows: list[dict]) -> list[dict]:
    """auto_insight_v2.sql(토픽 제약 갱신) 적용 전 DB 에서도 저장이 깨지지 않게 새 주제를 옛 주제로 돌린다."""
    return [{**r, "topic": "import_market" if r["topic"] == "ev_industry" else r["topic"]} for r in rows]


def group_for_digest(rows: list[dict]) -> dict[str, list[dict]]:
    """주제별로 중요도 상위 기사만. 기사가 DIGEST_MIN_ARTICLES 미만인 주제는 요약하지 않는다."""
    by: dict[str, list[dict]] = {}
    for r in rows:
        if r.get("topic") in DIGEST_TOPICS:
            by.setdefault(r["topic"], []).append(r)
    out = {}
    for t in DIGEST_TOPICS:
        lst = sorted(by.get(t, []), key=lambda r: -int(r.get("importance") or 0))
        if len(lst) >= DIGEST_MIN_ARTICLES:
            out[t] = lst[:DIGEST_PER_TOPIC]
    return out


def build_digest_prompt(groups: dict[str, list[dict]]) -> str:
    blocks = []
    for topic, lst in groups.items():
        lines = "\n".join(f"- {r['title']} :: {(r.get('summary_ko') or '')[:110]}" for r in lst)
        blocks.append(f"[{topic}]\n{lines}")
    return f"""당신은 수입차 브랜드 서비스본부 기획실 팀장에게 아침 브리핑을 올리는 보조입니다.
아래는 오늘 수집된 자동차 뉴스를 주제별로 모은 것입니다. 같은 사건을 다룬 기사가 여러 개일 수 있으니 하나의 사건으로 묶어 쓰세요.
반드시 JSON 만 출력합니다.

규칙:
- 제공된 제목·요약에 **있는 내용만** 쓰세요. 숫자·날짜·고유명사를 추측하거나 만들어내지 마세요.
- 기사 건수는 쓰지 마세요(건수는 시스템이 따로 표시합니다).
- 주제마다 headline(그 주제의 오늘 핵심을 한 문장, 60자 이내)과 points(핵심 사건 2~3개, 각 80자 이내, 사건 단위로)를 쓰세요.
- 마지막에 "all" 키로 오늘 전체에서 가장 중요한 3가지를 points 로 쓰세요(headline 은 오늘의 한 줄 총평).
- 해석은 단정하지 말고 사실 위주로 쓰세요.

출력 형식:
{{"topics":{{"bmw_group":{{"headline":"...","points":["...","..."]}},"all":{{"headline":"...","points":["...","...","..."]}}}}}}

기사:
{chr(10).join(blocks)}"""


def normalize_digest(data: Optional[dict], groups: dict[str, list[dict]], counts: dict[str, int], total: int, today: str) -> list[dict]:
    """LLM 요약을 검증해 저장 행으로. 건수는 코드가 채운다(LLM 값 사용 안 함)."""
    topics = (data or {}).get("topics")
    if not isinstance(topics, dict):
        return []
    out = []
    for key in (*groups.keys(), "all"):
        raw = topics.get(key)
        if not isinstance(raw, dict):
            continue
        headline = str(raw.get("headline") or "").strip()[:120]
        pts = raw.get("points")
        points = [str(p).strip()[:140] for p in pts if str(p).strip()][:3] if isinstance(pts, list) else []
        if not headline and not points:
            continue
        out.append({
            "date": today, "topic": key, "headline": headline, "points": points,
            "article_count": total if key == "all" else counts.get(key, 0),
        })
    return out


def fetch_recent_titles(days: int = DEDUPE_DAYS) -> list[str]:
    """최근 며칠 안에 저장한 기사 제목 — 어제 낸 사건을 오늘 또 내지 않기 위한 비교 대상. 실패하면 빈 목록."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    try:
        from supabase import create_client
        since = (datetime.now(_KST) - timedelta(days=days)).strftime("%Y-%m-%d")
        res = (create_client(SUPABASE_URL, SUPABASE_KEY).table("auto_articles")
               .select("title").gte("date", since).limit(2000).execute())
        return [r["title"] for r in res.data or []]
    except Exception as e:  # noqa: BLE001
        print(f"  ⚠️  최근 제목 조회 실패 — 날짜 간 중복 제거 없이 진행: {e}")
        return []


def fetch_day_rows(day: str) -> list[dict]:
    from supabase import create_client
    res = (create_client(SUPABASE_URL, SUPABASE_KEY).table("auto_articles")
           .select("title,summary_ko,topic,importance").eq("date", day).gte("importance", 2).limit(1000).execute())
    return res.data or []


def save_digest(items: list[dict]) -> None:
    from supabase import create_client
    create_client(SUPABASE_URL, SUPABASE_KEY).table("auto_digest").upsert(items, on_conflict="date,topic").execute()


def make_digest(day_rows: list[dict], today: str) -> list[dict]:
    """하루치 기사로 주제별 요약을 만든다. LLM 실패 시 빈 목록(화면은 요약 없이 기사만 보여준다)."""
    groups = group_for_digest(day_rows)
    if not groups:
        return []
    try:
        data = parse_llm_json(ask_openai(build_digest_prompt(groups), max_tokens=3000))
    except Exception as e:  # noqa: BLE001
        print(f"  ⚠️  요약 생성 실패 — 이번엔 요약 없이: {e}")
        return []
    counts = {t: sum(1 for r in day_rows if r.get("topic") == t) for t in groups}
    return normalize_digest(data, groups, counts, len(day_rows), today)


def save_rows(rows: list[dict], competitor_rows: list[dict]) -> list[dict]:
    """이미 있는 링크는 건너뛰고 새 행만 insert. 새로 들어간 행을 돌려준다(속보 알림 대상 판별용)."""
    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    existing: set[str] = set()
    links = [r["link"] for r in rows]
    for i in range(0, len(links), 100):
        res = client.table("auto_articles").select("link").in_("link", links[i:i + 100]).execute()
        existing.update(x["link"] for x in res.data or [])
    new_rows = [r for r in rows if r["link"] not in existing]
    for i in range(0, len(new_rows), 100):
        chunk = new_rows[i:i + 100]
        try:
            client.table("auto_articles").insert(chunk).execute()
        except Exception as e:  # noqa: BLE001
            if "topic_check" not in str(e) and "23514" not in str(e):
                raise
            print("  ⚠️  DB 의 topic 제약이 옛 버전입니다 — pipeline/sql/auto_insight_v2.sql 을 실행하세요. "
                  "이번엔 새 주제(ev_industry)를 import_market 으로 저장합니다.")
            chunk = remap_topics_for_legacy_db(chunk)
            for r in new_rows[i:i + 100]:
                r["topic"] = "import_market" if r["topic"] == "ev_industry" else r["topic"]
            client.table("auto_articles").insert(chunk).execute()
    if competitor_rows:
        client.table("auto_competitor_log").upsert(
            competitor_rows, on_conflict="brand,item,source_link", ignore_duplicates=True
        ).execute()
    return new_rows


def notify(title: str, message: str, priority: int = 4) -> None:
    if not NTFY_TOPIC:
        return
    try:
        requests.post(
            "https://ntfy.sh/",
            json={"topic": NTFY_TOPIC, "title": title, "message": message, "priority": priority, "tags": ["rotating_light"]},
            timeout=5,
        )
    except Exception:  # noqa: BLE001
        pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="DB 저장·알림 없이 결과만 출력")
    ap.add_argument("--no-llm", action="store_true", help="LLM 호출 없이 규칙 기반으로만 처리")
    ap.add_argument("--input", default=os.path.join(OUTPUT_DIR, f"auto_{TODAY}.json"))
    args = ap.parse_args()

    if not os.path.exists(args.input):
        print(f"❌ 입력 파일 없음: {args.input} — auto_collect.py 를 먼저 실행하세요")
        return 1
    with open(args.input, encoding="utf-8") as f:
        articles = json.load(f)["articles"]

    known = fetch_recent_titles()
    unique = dedupe_stories(articles, rank=story_rank, known_titles=known)
    multi = sum(1 for a in unique if a.get("dup_count", 1) >= 2)
    print(f"🧹 같은 사건 정리: {len(articles)}건 → {len(unique)}건 "
          f"(여러 매체가 다룬 사건 {multi}개 · 최근 {DEDUPE_DAYS}일 저장 제목 {len(known)}건과 대조)")
    selected = select_for_analysis(unique)
    print(f"📥 분석 대상 {len(selected)}건 (상한 {MAX_ANALYZE})")

    rows, competitor_rows = [], []
    for i in range(0, len(selected), BATCH_SIZE):
        batch = selected[i:i + BATCH_SIZE]
        print(f"  🤖 배치 {i // BATCH_SIZE + 1}/{(len(selected) + BATCH_SIZE - 1) // BATCH_SIZE}")
        items = analyze_batch(batch, use_llm=not args.no_llm)
        for article, item in zip(batch, items):
            if item["importance"] < MIN_KEEP_IMPORTANCE:
                continue
            row = to_row(article, item, TODAY)
            rows.append(row)
            if item["competitor"]:
                competitor_rows.append({
                    "date": TODAY, "brand": item["competitor"]["brand"], "item": item["competitor"]["item"],
                    "note": item["competitor"]["note"], "source_link": row["link"],
                })
        if not args.no_llm and i + BATCH_SIZE < len(selected):
            time.sleep(1)

    breaking = sorted((r for r in rows if r["is_breaking"]), key=lambda r: -r["importance"])
    print(f"\n✅ 저장 대상 {len(rows)}건 (무관 판정 제외 {len(selected) - len(rows)}건) · 속보 후보 {len(breaking)}건 · 경쟁사 기록 {len(competitor_rows)}건")
    by_topic: dict[str, int] = {}
    for r in rows:
        by_topic[r["topic"]] = by_topic.get(r["topic"], 0) + 1
    print(f"   주제별: {by_topic}")

    if args.dry_run:
        for r in sorted(rows, key=lambda r: -r["importance"])[:12]:
            flag = "🚨" if r["is_breaking"] else "  "
            print(f" {flag} [{r['importance']}] {r['topic']:14} {r['title'][:60]}  {r['brands']}")
        if not args.no_llm:
            for d in make_digest(rows, TODAY):
                print(f"\n 📝 [{d['topic']}] ({d['article_count']}건) {d['headline']}")
                for pt in d["points"]:
                    print(f"      · {pt}")
        return 0

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL/KEY 없음 — 저장 불가")
        return 1
    new_rows = save_rows(rows, competitor_rows)
    print(f"💾 신규 {len(new_rows)}건 저장 (기존 {len(rows) - len(new_rows)}건은 건너뜀)")

    # 속보는 '이번에 새로 들어온 것'만 푸시해야 하루 여러 번 돌려도 같은 알림이 반복되지 않는다
    new_links = {r["link"] for r in new_rows}
    push = [r for r in breaking if r["link"] in new_links][:MAX_BREAKING_PUSH]
    for r in push:
        notify(f"🚨 {'/'.join(r['brands']) or '자동차'} 속보", f"{r['title']}\n{r['link']}")
    if push:
        print(f"🔔 속보 푸시 {len(push)}건")

    # 주제별 요약: 오늘 저장된 기사 전체로 다시 만든다(하루 두 번 돌아도 최신 상태 유지)
    if not args.no_llm:
        try:
            digest = make_digest(fetch_day_rows(TODAY), TODAY)
            if digest:
                save_digest(digest)
                print(f"📝 주제별 요약 {len(digest)}개 저장")
        except Exception as e:  # noqa: BLE001
            print(f"  ⚠️  요약 저장 실패(기사 저장에는 영향 없음 — auto_insight_v2.sql 적용 여부 확인): {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
