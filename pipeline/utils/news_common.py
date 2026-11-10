"""자동차 인사이트 수집 공용 함수 (순수 함수 위주 — 테스트하기 쉽게 네트워크와 분리).

collect.py 와 일부 중복되지만 의도적이다: 기존 AI 뉴스 파이프라인을 건드리지 않기 위해
auto_* 스크립트는 이 모듈만 쓴다.
"""
from __future__ import annotations

import re
from functools import lru_cache
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
    "edaily.co.kr": "이데일리", "fnnews.com": "파이낸셜뉴스", "kmib.co.kr": "국민일보",
    "zdnet.co.kr": "ZDNet Korea", "inews24.com": "아이뉴스24", "imaeil.com": "매일신문",
    "tf.co.kr": "더팩트", "ekn.kr": "에너지경제", "ebn.co.kr": "EBN", "greened.kr": "녹색경제신문",
    "consumernews.co.kr": "소비자가만드는신문", "cstimes.com": "컨슈머타임스", "mtn.co.kr": "머니투데이방송",
}


def clean_html(text: str) -> str:
    """태그 제거 + HTML 엔티티 일부 복원 + 공백 정리."""
    text = re.sub(r"<[^>]+>", " ", text or "")
    for src, dst in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&quot;", '"'), ("&#39;", "'"), ("&nbsp;", " ")):
        text = text.replace(src, dst)
    return re.sub(r"\s+", " ", text).strip()


def extract_source(url: str, fallback: str = "") -> str:
    """도메인 → 매체명. 표에 없으면 fallback, 그것도 없으면 도메인 자체(출처가 '뉴스'로만 찍히지 않게)."""
    host = urlsplit(url or "").netloc.lower()
    for domain, name in _SOURCE_NAMES.items():
        if host == domain or host.endswith("." + domain):
            return name
    if fallback:
        return fallback
    return host[4:] if host.startswith("www.") else (host or "뉴스")


def tidy_source(name: str) -> str:
    """매체명이 주소('https://www.2news.co.kr/')로 들어온 경우 도메인만 남긴다. 이름이면 그대로."""
    name = (name or "").strip()
    if name.lower().startswith(("http://", "https://")):
        host = urlsplit(name).netloc.lower()
        return host[4:] if host.startswith("www.") else host
    return name


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


# ───────────── 같은 사건 중복(표현만 다른 헤드라인) 판정 ─────────────
# 링크·제목이 정확히 같은 것은 dedupe() 가 거른다. 여기서는 매체마다 제목을 다르게 쓴
# 같은 사건(예: 'LG엔솔 배터리 진단 7시간→10분' 이 7개 매체에서 7개 제목)을 묶는다.

_GENERIC = frozenset((
    "전기차", "배터리", "자동차", "수입차", "시장", "전망", "국내", "한국", "브랜드", "서비스", "기술", "업계",
    "신차", "출시", "발표", "공개", "확대", "강화", "관련", "위한", "통해", "대한", "올해", "내년", "이번",
    "증가", "감소", "성장", "상승", "하락", "급증", "급감", "돌파", "확보", "추진", "논란", "전략",
    "단독", "속보", "종합", "분석", "ev", "car", "cars", "the", "and", "for", "with", "new", "how", "why",
))
SIM_SURE = 0.36    # 이 이상이면 제목만으로 같은 사건
SIM_MAYBE = 0.28   # 이 이상이면 '고유 단어 2개 이상 일치'를 추가로 요구
_TAIL = re.compile(r"\s[-–|]\s[^-–|]{1,30}$")


@lru_cache(maxsize=16384)
def _norm_title(title: str) -> str:
    title = _TAIL.sub("", title or "")
    title = re.sub(r"\[[^\]]{1,12}\]|\([^)]{1,12}\)", "", title)       # [단독] (종합) 같은 머리말
    return re.sub(r"[^0-9a-z가-힣]+", " ", title.lower()).strip()


@lru_cache(maxsize=16384)
def _bigrams(title: str) -> frozenset[str]:
    s = _norm_title(title).replace(" ", "")
    return frozenset(s[i:i + 2] for i in range(len(s) - 1))


@lru_cache(maxsize=16384)
def _anchors(title: str) -> frozenset[str]:
    """제목에서 사건을 가리키는 고유 단어(일반어 제외). 숫자·단위('7시간', '10분')도 포함."""
    return frozenset(
        w for w in _norm_title(title).split()
        if len(w) >= 2 and w not in _GENERIC and not re.fullmatch(r"(19|20)\d\d년?", w)  # 연도는 사건을 가리키지 않는다
    )


def title_similarity(a: str, b: str) -> float:
    A, B = _bigrams(a), _bigrams(b)
    return len(A & B) / len(A | B) if A and B else 0.0


def is_same_story(a: str, b: str) -> bool:
    """두 제목이 같은 사건인가.

    - 문자 2-gram 자카드 ≥ 0.36 → 같은 사건
    - 0.28~0.36 → 고유 단어가 2개 이상 겹칠 때만(틀만 같은 '2035년 시장 전망' 류 오탐 방지)
    - 둘 다 숫자가 있는데 하나도 겹치지 않으면 다른 사건('3종 리콜' vs '5종 리콜')
    """
    sim = title_similarity(a, b)
    if sim < SIM_MAYBE:
        return False
    na, nb = set(re.findall(r"\d+", a)), set(re.findall(r"\d+", b))
    if na and nb and not (na & nb) and sim < 0.6:
        return False
    if sim >= SIM_SURE:
        return True
    return len(_anchors(a) & _anchors(b)) >= 2


def dedupe_stories(items: list[dict], rank, known_titles: Iterable[str] = ()) -> list[dict]:
    """같은 사건 기사는 대표 하나만 남긴다.

    rank(item): 클수록 대표로 우선. known_titles: 이미 저장된 최근 기사 제목 — 어제 낸 이야기를 오늘 또 내지 않는다.
    대표에는 item['dup_count'](묶인 기사 수, 자신 포함)가 붙는다 — 여러 매체가 다룬 사건이라는 신호.
    새 기사는 묶음의 대표뿐 아니라 묶음에 든 모든 제목과 비교한다(같은 사건의 표현이 매체마다 달라 대표 하나와는 멀 수 있다).
    """
    known = [t for t in known_titles if t]
    groups: list[list[dict]] = []
    for it in sorted(items, key=rank, reverse=True):
        title = it.get("title", "")
        if any(is_same_story(title, k) for k in known):
            continue
        for g in groups:
            if any(is_same_story(title, m.get("title", "")) for m in g):
                g.append(it)
                break
        else:
            groups.append([it])
    # 묶음끼리도 한 번 더: 이어 붙는 쌍이 늦게 생겨 같은 사건이 두 묶음으로 갈라진 경우
    merged = True
    while merged:
        merged = False
        for i in range(len(groups)):
            for j in range(len(groups) - 1, i, -1):
                if any(is_same_story(a.get("title", ""), b.get("title", "")) for a in groups[i] for b in groups[j]):
                    groups[i].extend(groups[j])
                    del groups[j]
                    merged = True
    reps = []
    for g in groups:
        rep = g[0]  # rank 가 가장 높은 기사가 먼저 들어갔다
        rep["dup_count"] = len(g)
        reps.append(rep)
    return reps
