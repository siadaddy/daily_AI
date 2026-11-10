#!/usr/bin/env python3
"""
🚗 자동차 인사이트 — 1단계 수집
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSS(국내 전문지·해외 매체) + Google News RSS(질의별) + Naver 뉴스 검색을 모아
중복 제거한 뒤 pipeline/output/auto_{TODAY}.json 에 저장한다.
기존 collect.py(AI 뉴스)와 완전히 독립이다 — 같은 테이블·같은 출력 파일을 쓰지 않는다.

사용:
  python pipeline/auto_collect.py --dry-run      # 수집만 하고 소스별 건수 출력 (파일·DB 쓰기 없음)
  python pipeline/auto_collect.py                # output/auto_YYYY-MM-DD.json 저장
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote_plus

import requests
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils.news_common import (  # noqa: E402
    clean_html, contains_any, dedupe, extract_source, is_excluded, tidy_source,
    snippet, strip_publisher_suffix,
)

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(PIPELINE_DIR, "output")
SOURCES_PATH = os.path.join(PIPELINE_DIR, "auto_sources.json")

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")

_KST = timezone(timedelta(hours=9))
TODAY = datetime.now(_KST).strftime("%Y-%m-%d")
UA = "Mozilla/5.0 (compatible; auto-insight-collector/1.0)"
HTTP_TIMEOUT = 15
MAX_RETRIES = 3


def _get(url: str, **kwargs) -> Optional[requests.Response]:
    """재시도 있는 GET. 마지막까지 실패하면 None (한 소스 실패가 전체를 막지 않게)."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = requests.get(url, timeout=HTTP_TIMEOUT, headers={"User-Agent": UA, **kwargs.pop("headers", {})}, **kwargs)
            r.raise_for_status()
            return r
        except Exception as e:  # noqa: BLE001
            if attempt == MAX_RETRIES:
                print(f"    ⚠️  실패({attempt}/{MAX_RETRIES}) {url[:90]} — {e}")
                return None
            time.sleep(2 * attempt)
    return None


def _entry_time(entry) -> Optional[datetime]:
    for key in ("published_parsed", "updated_parsed"):
        t = entry.get(key)
        if t:
            return datetime(*t[:6], tzinfo=timezone.utc)
    return None


def _parse_feed(content: bytes):
    import feedparser  # 지연 import — 순수 함수 테스트에 의존성을 강요하지 않는다
    return feedparser.parse(content)


def collect_rss(cfg: dict, cutoff: datetime, auto_keywords: list[str]) -> list[dict]:
    resp = _get(cfg["url"])
    if resp is None:
        return []
    feed = _parse_feed(resp.content)
    items = []
    for e in feed.entries:
        published = _entry_time(e)
        if published and published < cutoff:
            continue
        title = clean_html(e.get("title", ""))
        summary = snippet(e.get("summary", "") or e.get("description", ""))
        if not title or not e.get("link"):
            continue
        if cfg.get("require_auto_keyword") and not contains_any(f"{title} {summary}", auto_keywords):
            continue
        items.append({
            "title": title, "link": e["link"], "summary": summary,
            "source": cfg["name"], "source_type": cfg["type"], "lang": cfg["lang"],
            "published_at": published.isoformat() if published else None,
            "topic_hint": None,
        })
    return items


def collect_google_news(cfg: dict, cutoff: datetime) -> list[dict]:
    lang = cfg["lang"]
    days = cfg.get("days")  # 기사가 드문 틈새 질의는 창을 넓힌다(기본: 전역 lookback)
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    hl, gl, ceid = ("ko", "KR", "KR:ko") if lang == "ko" else ("en-US", "US", "US:en")
    q = quote_plus(f"{cfg['q']} when:{days or 2}d")
    resp = _get(f"https://news.google.com/rss/search?q={q}&hl={hl}&gl={gl}&ceid={ceid}")
    if resp is None:
        return []
    feed = _parse_feed(resp.content)
    items = []
    for e in feed.entries:
        published = _entry_time(e)
        if published and published < cutoff:
            continue
        raw_title = clean_html(e.get("title", ""))
        source = tidy_source((e.get("source") or {}).get("title") or "") or extract_source(e.get("link", ""), "Google News")
        if not raw_title or not e.get("link"):
            continue
        items.append({
            "title": strip_publisher_suffix(raw_title), "link": e["link"],
            "summary": "",  # Google News 요약은 제목 반복이라 의미 없음
            "source": source, "source_type": "google", "lang": lang,
            "published_at": published.isoformat() if published else None,
            "topic_hint": cfg.get("topic_hint"),
        })
    return items


def collect_naver(cfg: dict) -> list[dict]:
    r = _get(
        "https://openapi.naver.com/v1/search/news.json",
        headers={"X-Naver-Client-Id": NAVER_CLIENT_ID, "X-Naver-Client-Secret": NAVER_CLIENT_SECRET},
        params={"query": cfg["q"], "display": 20, "sort": "date"},
    )
    if r is None:
        return []
    items = []
    for it in r.json().get("items", []):
        link = it.get("originallink") or it.get("link", "")
        pub = None
        try:
            pub = datetime.strptime(it.get("pubDate", ""), "%a, %d %b %Y %H:%M:%S %z").astimezone(timezone.utc)
        except ValueError:
            pass
        items.append({
            "title": clean_html(it.get("title", "")), "link": link,
            "summary": snippet(it.get("description", "")),
            "source": extract_source(link), "source_type": "naver", "lang": "ko",
            "published_at": pub.isoformat() if pub else None,
            "topic_hint": cfg.get("topic_hint"),
        })
    return items


def collect_all(sources: dict, verbose: bool = True) -> tuple[list[dict], dict]:
    """모든 소스를 돌고 (중복 제거된 기사 목록, 소스별 원시 건수) 를 돌려준다."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=sources.get("lookback_hours", 48))
    auto_keywords = sources["auto_keywords"]
    raw: list[dict] = []
    counts: dict[str, int] = {}

    def add(label: str, items: list[dict]):
        counts[label] = len(items)
        raw.extend(items)
        if verbose:
            print(f"    {label}: {len(items)}건")

    # 우선순위 순서: 전문 RSS(원문 링크·요약 풍부) → Naver → Google News(리다이렉트 링크라 마지막)
    print("📡 RSS")
    for cfg in sources["rss"]:
        add(f"RSS · {cfg['name']}", collect_rss(cfg, cutoff, auto_keywords))

    print("🟢 Naver")
    if NAVER_CLIENT_ID and NAVER_CLIENT_SECRET:
        for cfg in sources["naver"]:
            add(f"Naver · {cfg['q']}", collect_naver(cfg))
            time.sleep(0.2)
    else:
        print("    ⚠️  NAVER_CLIENT_ID/SECRET 없음 — Naver 수집 건너뜀")

    print("🔎 Google News")
    for cfg in sources["google_news"]:
        add(f"GNews · {cfg['q'][:30]}", collect_google_news(cfg, cutoff))
        time.sleep(0.3)

    filtered = [it for it in raw if not is_excluded(f"{it['title']} {it['summary']}")]
    return dedupe(filtered), counts


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="저장 없이 수집 결과 요약만 출력")
    ap.add_argument("--output", default=None, help="저장 경로(기본: pipeline/output/auto_YYYY-MM-DD.json)")
    args = ap.parse_args()

    with open(SOURCES_PATH, encoding="utf-8") as f:
        sources = json.load(f)

    articles, counts = collect_all(sources)
    total_raw = sum(counts.values())
    failed = [k for k, v in counts.items() if v == 0]

    by_type: dict[str, int] = {}
    for a in articles:
        by_type[a["source_type"]] = by_type.get(a["source_type"], 0) + 1
    print(f"\n✅ 원시 {total_raw}건 → 중복 제거 후 {len(articles)}건  {by_type}")
    if failed:
        print(f"⚠️  0건 소스 {len(failed)}개: {', '.join(failed)}")

    if args.dry_run:
        for a in articles[:15]:
            print(f"  [{a['source_type']:6}] {a['source'][:12]:12} | {a['title'][:70]}")
        return 0

    path = args.output or os.path.join(OUTPUT_DIR, f"auto_{TODAY}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"date": TODAY, "articles": articles, "source_counts": counts}, f, ensure_ascii=False, indent=2)
    print(f"💾 저장: {path}")
    # 전체 소스가 죽었을 때만 실패로 본다(일부 실패는 정상 운영)
    return 1 if not articles else 0


if __name__ == "__main__":
    sys.exit(main())
