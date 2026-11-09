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

TOPICS = ("ev_aftersales", "import_market", "sdv", "ai_auto", "bmw_group", "regulation", "other")
COMPETITOR_ITEMS = ("service_policy", "price", "campaign", "recall")


# ───────────────────────── 순수 함수 (테스트 대상) ─────────────────────────

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
- topic 은 {list(TOPICS)} 중 하나. (ev_aftersales=전기차 정비·배터리·부품·서비스센터, import_market=수입차 판매·등록·경쟁사, sdv=소프트웨어 정의 차량·OTA·커넥티드, ai_auto=자동차×AI(정비 진단·고객응대·차량 내 AI), bmw_group=BMW·MINI·롤스로이스·한독모터스 관련, regulation=리콜·규제·정책·소비자 분쟁)
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


def ask_openai(prompt: str) -> str:
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
            "max_tokens": 4096,
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
        client.table("auto_articles").insert(new_rows[i:i + 100]).execute()
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

    selected = select_for_analysis(articles)
    print(f"📥 수집 {len(articles)}건 → 분석 대상 {len(selected)}건 (상한 {MAX_ANALYZE})")

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
    return 0


if __name__ == "__main__":
    sys.exit(main())
