"""자동차 인사이트의 결정적 규칙(LLM 없음): 브랜드 태깅 · 노이즈 사전 필터 · 속보 룰.

LLM 에는 '분류·요약·시사점'만 맡기고, 건수·속보·브랜드처럼 틀리면 곤란한 판단은 여기서 코드로 한다
(리포트에서 LLM 이 수치를 지어낸 전례 — src/lib/utils/category-stats.ts 주석 참고).
"""
from __future__ import annotations

import re

# 브랜드 → 별칭. 영문 별칭은 단어 경계로, 한글은 부분 일치로 찾는다.
BRANDS: dict[str, tuple[str, ...]] = {
    "BMW": ("bmw", "비엠더블유", "한독모터스", "bmw코리아", "bmw 코리아"),
    "MINI": ("mini", "미니 쿠퍼", "미니코리아", "미니 코리아"),
    "롤스로이스": ("rolls-royce", "rolls royce", "롤스로이스"),
    "벤츠": ("mercedes", "벤츠", "메르세데스"),
    "아우디": ("audi", "아우디"),
    "폭스바겐": ("volkswagen", "폭스바겐"),
    "포르쉐": ("porsche", "포르쉐"),
    "렉서스": ("lexus", "렉서스"),
    "볼보": ("volvo", "볼보"),
    "폴스타": ("polestar", "폴스타"),
    "테슬라": ("tesla", "테슬라"),
    "제네시스": ("genesis", "제네시스"),
    "현대차": ("hyundai", "현대차", "현대자동차"),
    "기아": ("kia", "기아"),
    # 전기차 전업·신흥 (한국 진출·유럽 서비스망 확장 동향이 경쟁 구도의 변수)
    "BYD": ("byd", "비야디"),
    "리비안": ("rivian", "리비안"),
    "루시드": ("lucid motors", "lucid air", "lucid gravity", "루시드"),
    "샤오펑": ("xpeng", "샤오펑"),
    "니오": ("nio",),  # 한글 '니오'는 '아니오' 등에 걸려 쓰지 않는다
    "지커": ("zeekr", "지커"),
    "샤오미": ("xiaomi su7", "xiaomi yu7", "샤오미 su7", "샤오미 yu7", "샤오미 전기차"),  # 휴대폰 기사는 제외
    "KG모빌리티": ("kg모빌리티", "kg mobility", "kgm", "케이지모빌리티"),
    # 국내 판매 수입·외산 브랜드
    "토요타": ("toyota", "토요타", "도요타"),
    "혼다": ("honda", "혼다"),
    "포드": ("ford", "포드"),
    "지프": ("jeep", "지프"),
    "랜드로버": ("land rover", "landrover", "range rover", "랜드로버", "레인지로버"),
    "재규어": ("jaguar", "재규어"),
    "마세라티": ("maserati", "마세라티"),
    "스텔란티스": ("stellantis", "스텔란티스"),
    "GM": ("general motors", "제너럴모터스", "한국gm", "쉐보레", "chevrolet", "캐딜락", "cadillac"),
}
_EN_ONLY = re.compile(r"^[a-z\- ]+$")

BMW_GROUP = {"BMW", "MINI", "롤스로이스"}

# 서비스본부 기획 관점에서 가치가 높은 신호
PRIORITY_TERMS = (
    "서비스센터", "정비", "수리", "as", "애프터", "aftersales", "after-sales", "aftermarket", "right to repair", "수리권",
    "technician", "mechanic", "dealership", "dealer", "repair shop", "service center", "정비사", "딜러",
    "리콜", "recall", "결함", "보증", "워런티", "warranty", "부품", "배터리", "battery", "충전", "고전압",
    "ota", "sdv", "software-defined", "소프트웨어 정의", "소프트웨어",
    "ai", "인공지능", "에이전트", "agent", "자율주행", "autonomous",
    "ban", "tariff", "포티투닷", "신규등록", "등록", "판매량", "판매 순위", "점유율", "보조금", "규제", "법안", "관세",
)

# 보고 가치가 낮은 행사·후원성 기사
NOISE_TERMS = (
    "레이싱", "모터스포츠", "f1", "랠리", "wrc", "팝업스토어", "시상식", "골프", "기부", "봉사", "후원",
    "스폰서", "페스티벌", "굿즈", "포토", "화보", "시승기", "타이어",
)

RECALL_TERMS = ("리콜", "recall", "결함", "시정조치")
REGULATION_TERMS = ("규제", "법안", "과징금", "공정위", "국토부", "환경부", "관세", "right to repair", "수리권", "tariff")
CRITICAL_TERMS = ("화재", "사망", "인수", "합병", "파업", "halt", "halted", "halts", "shutdown", "생산 차질", "가동 중단", "생산 중단", "판매 중단", "판매 중지", "대규모", "대량")


def tag_brands(text: str) -> list[str]:
    low = (text or "").lower()
    found = []
    for brand, aliases in BRANDS.items():
        for a in aliases:
            hit = re.search(rf"\b{re.escape(a)}\b", low) if _EN_ONLY.match(a) else (a in low)
            if hit:
                found.append(brand)
                break
    return found


def _term_hit(low: str, term: str) -> bool:
    """영문 신호어는 단어 경계로 찾는다('ai' 가 'repair'·'again' 에 걸리면 안 된다).
    4자 이하 약어는 양쪽 경계, 그보다 긴 영단어는 왼쪽만(recall → recalled 허용). 한글은 부분 일치."""
    if not term.isascii():
        return term in low
    t = re.escape(term.strip())
    right = r"(?![a-z0-9])" if len(term.strip()) <= 4 else ""
    return re.search(rf"(?<![a-z0-9]){t}{right}", low) is not None


def _has(text: str, terms) -> bool:
    low = (text or "").lower()
    return any(_term_hit(low, t) for t in terms)


def relevance_score(title: str, summary: str = "", topic_hint: str | None = None) -> int:
    """>0 이면 분석 대상. 노이즈만 있고 신호가 없으면 0 이하.

    제목에 신호가 있으면 가중(요약은 길어서 우연 일치가 많다).
    """
    score = 0
    if _has(title, PRIORITY_TERMS):
        score += 2
    elif _has(summary, PRIORITY_TERMS):
        score += 1
    brands = tag_brands(f"{title} {summary}")
    if brands:
        score += 1
    if topic_hint in ("bmw_group", "regulation", "ev_aftersales"):
        score += 1  # 사용자가 직접 지정한 질의에서 나온 기사
    if _has(title, NOISE_TERMS):
        score -= 2
    # 우리 회사 브랜드 기사는 시승기·행사성이어도 버리지 않는다(팀장이 놓치면 안 되는 영역)
    if set(brands) & BMW_GROUP:
        score = max(score, 1)
    return score


# 칼럼·사설·기고는 사실 보도가 아니라 의견이므로 속보 대상이 아니다
OPINION_MARKERS = ("칼럼", "컬럼", "사설", "기고", "오피니언", "opinion:", "editorial")


def is_breaking(title: str, summary: str, brands: list[str], importance: int) -> bool:
    """속보 룰. BMW 그룹 브랜드 + 리콜/규제/중대 사안 + 중요도 3 이상.

    경쟁사 리콜·규제는 속보가 아니다 — 경쟁사 비교표(auto_competitor_log)로만 쌓는다.
    (실제 데이터에서 경쟁사까지 포함하면 하루 114건 중 25건이 속보로 잡혀 의미가 없었다)
    LLM importance 는 보조 신호일 뿐, 핵심 조건은 키워드 + 브랜드다.
    """
    if any(m in (title or "").lower() for m in OPINION_MARKERS):
        return False
    if not set(brands) & BMW_GROUP:
        return False
    text = f"{title} {summary}"
    recall_or_reg = _has(text, RECALL_TERMS) or _has(text, REGULATION_TERMS)
    return (recall_or_reg or _has(text, CRITICAL_TERMS)) and importance >= 3


def rule_importance(title: str, summary: str, brands: list[str]) -> int:
    """LLM 이 없을 때(또는 실패했을 때) 쓰는 규칙 기반 중요도. 속보가 LLM 장애로 사라지지 않게 한다."""
    text = f"{title} {summary}"
    recall_or_reg = _has(text, RECALL_TERMS) or _has(text, REGULATION_TERMS)
    in_group = bool(set(brands) & BMW_GROUP)
    if in_group and (recall_or_reg or _has(text, CRITICAL_TERMS)):
        return 4
    if recall_or_reg:
        return 3
    if in_group:
        return 3
    return 2
