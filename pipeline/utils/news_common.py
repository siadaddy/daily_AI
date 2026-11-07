"""자동차 인사이트 수집 공용 함수 (순수 함수 위주 — 테스트하기 쉽게 네트워크와 분리).

collect.py 와 일부 중복되지만 의도적이다: 기존 AI 뉴스 파이프라인을 건드리지 않기 위해
auto_* 스크립트는 이 모듈만 쓴다.
"""
from __future__ import annotations

import re
from typing import Iterable, Optional
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

# 추적용 쿼리 파라미터 — 같은 기사를 다른 링크로 보이게 만든다
_TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "igshid", "ref", "ocid", "cmpid", "spm",
}

# 수집 단계에서 제외할 키워드 (기존 collect.py 와 같은 규칙)
EXCLUDE_KEYWORDS = ("삼천리",)

_SOURCE_NAMES = {
    "yna.co.kr": "연합뉴스", "hankyung.com": "한국경제", "etnews.com": "전자신문",
    "heraldcorp.com": "헤럴드경제", "chosun.com": "조선일보", "joongang.co.kr": "중앙일보",
    "donga.com": "동아일보", "mk.co.kr": "매일경제", "mt.co.kr": "머니투데이",
    "motorgraph.com": "모터그래프", "autoherald.co.kr": "오토헤럴드",
    "autodaily.co.kr": "오토데일리", "autotimes.co.kr": "오토타임즈",
    "carisyou.com": "카이즈유", "electrek.co": "Electrek", "insideevs.com": "InsideEVs",
    "carscoops.com": "Carscoops", "motor1.com": "Motor1", "techcrunch.com": "TechCrunch",
    "press.bmwgroup.com": "BMW Group PressClub", "reuters.com": "Reuters",
}


def clean_html(text: str) -> str:
    """태그 제거 + HTML 엔티티 일부 복원 + 공백 정리."""
    text = re.sub(r"<[^>]+>", " ", text or "")
    for src, dst in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")):
        text = text.replace(src, dst)
    return re.sub(r"\s+", " ", text).strip()


def extract_source(url: str, fallback: str = "뉴스") -> str:
    host = urlsplit(url or "").netloc.lower()
    for domain, name in _SOURCE_NAMES.items():
        if host == domain or host.endswith("." + domain):
            return name
    return fallback


def normalize_url(url: str) -> str:
    """중복 판정용 링크 정규화: 추적 파라미터·프래그먼트·끝 슬래시 제거, 호스트 소문자화.

    Google News 리다이렉트(news.google.com/rss/articles/…)는 쿼리가 곧 식별자이므로 그대로 둔다.
    """
    url = (url or "").strip()
    if not url:
        return ""
    parts = urlsplit(url)
    host = parts.netloc.lower()
    if host.endswith("news.google.com"):
        return urlunsplit((parts.scheme or "https", host, parts.path, parts.query, ""))
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k.lower() not in _TRACKING_PARAMS]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme or "https", host, path, urlencode(query), ""))


def title_key(title: str) -> str:
    """제목 유사 중복 판정 키: 소문자 + 영숫자·한글만 + 앞 40자. 'ㅇㅇ - 매체명' 꼬리는 제거."""
    title = re.sub(r"\s[-–|]\s[^-–|]{1,30}$", "", title or "")
    return re.sub(r"[^0-9a-z가-힣]", "", title.lower())[:40]


def strip_publisher_suffix(title: str) -> str:
    """Google News 제목 끝의 ' - 매체명' 제거."""
    return re.sub(r"\s[-–|]\s[^-–|]{1,30}$", "", title or "").strip()


def contains_any(text: str, words: Iterable[str]) -> bool:
    low = (text or "").lower()
    return any(w.lower() in low for w in words)


def is_excluded(text: str) -> bool:
    return any(bad in (text or "") for bad in EXCLUDE_KEYWORDS)


def dedupe(items: list[dict]) -> list[dict]:
    """링크 → 제목 키 순으로 중복 제거. 먼저 나온 항목(= 우선순위 높은 소스)이 이긴다."""
    seen_links: set[str] = set()
    seen_titles: set[str] = set()
    out: list[dict] = []
    for it in items:
        link_key = normalize_url(it.get("link", ""))
        t_key = title_key(it.get("title", ""))
        if not link_key or not t_key:
            continue
        if link_key in seen_links or t_key in seen_titles:
            continue
        seen_links.add(link_key)
        seen_titles.add(t_key)
        it["link"] = link_key
        out.append(it)
    return out


def snippet(text: str, limit: int = 300) -> Optional[str]:
    text = clean_html(text)
    return text[:limit] if text else ""
