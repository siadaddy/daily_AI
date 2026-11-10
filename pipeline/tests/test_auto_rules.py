"""실행: python -m unittest discover -s pipeline/tests -v  (저장소 루트에서)"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from utils.auto_rules import is_breaking, relevance_score, tag_brands  # noqa: E402
from utils.news_common import dedupe, normalize_url, strip_publisher_suffix, tidy_source, title_key  # noqa: E402


class TagBrands(unittest.TestCase):
    def test_korean_and_english(self):
        self.assertEqual(tag_brands("한독모터스, 서비스센터 확대"), ["BMW"])
        self.assertIn("벤츠", tag_brands("Mercedes-Benz recall"))

    def test_word_boundary_avoids_false_positive(self):
        # 'mini' 가 'administration', 'minimum' 안에서 잡히면 안 된다
        self.assertEqual(tag_brands("Administration sets minimum standard"), [])
        self.assertEqual(tag_brands("new mini cooper unveiled"), ["MINI"])


class Relevance(unittest.TestCase):
    def test_racing_noise_dropped(self):
        self.assertLessEqual(relevance_score("2026 현대 N 페스티벌 5&6라운드"), 0)

    def test_service_signal_kept(self):
        self.assertGreater(relevance_score("수입차 서비스센터 대기 시간 논란"), 0)

    def test_noise_with_brand_and_signal_not_enough(self):
        self.assertLessEqual(relevance_score("벤츠 타이어 후원 이벤트"), 1)

    def test_short_terms_use_word_boundary(self):
        # 'ai' 는 'repair'·'again' 안에서 맞으면 안 된다
        self.assertLessEqual(relevance_score("Taurus owner gets car back again after repair"), 0)
        self.assertGreater(relevance_score("Automakers bet on AI agents"), 0)

    def test_bmw_group_never_dropped(self):
        self.assertGreaterEqual(relevance_score("[시승기] 더 뉴 BMW 7시리즈 타보니"), 1)

    def test_aftermarket_english_kept(self):
        self.assertGreater(relevance_score("Bosch names its Shop of the Year, technician training"), 0)


class Source(unittest.TestCase):
    def test_url_shaped_source_becomes_domain(self):
        self.assertEqual(tidy_source("https://www.2news.co.kr/"), "2news.co.kr")
        self.assertEqual(tidy_source("한국경제"), "한국경제")
        self.assertEqual(tidy_source(""), "")


class NewBrands(unittest.TestCase):
    def test_ev_brands_tagged(self):
        self.assertEqual(tag_brands("BYD 코리아 서비스센터 확대"), ["BYD"])
        self.assertIn("리비안", tag_brands("Rivian recalls R1T"))
        self.assertEqual(tag_brands("XPeng and NIO expand in Europe"), ["샤오펑", "니오"])

    def test_no_false_positives(self):
        self.assertEqual(tag_brands("아니오 라고 답했다"), [])           # 한글 '니오' 별칭을 쓰지 않는 이유
        self.assertEqual(tag_brands("Stanford study on batteries"), [])  # ford 단어 경계
        self.assertEqual(tag_brands("샤오미 신형 스마트폰 출시"), [])       # 휴대폰은 제외
        self.assertEqual(set(tag_brands("Honda and Toyota")), {"토요타", "혼다"})

    def test_new_brands_are_competitors_not_group(self):
        from utils.auto_rules import BMW_GROUP
        self.assertFalse({"BYD", "토요타", "GM"} & BMW_GROUP)


class Breaking(unittest.TestCase):
    def test_opinion_pieces_are_never_breaking(self):
        self.assertFalse(is_breaking("[데스크칼럼] BMW 리콜, AS도 명차다워야", "", ["BMW"], 5))
        self.assertFalse(is_breaking("[사설] 수입차 리콜 늑장", "", ["벤츠"], 5))

    def test_bmw_recall_is_breaking(self):
        self.assertTrue(is_breaking("BMW 5시리즈 리콜", "", ["BMW"], 3))

    def test_competitor_recall_is_never_breaking(self):
        self.assertFalse(is_breaking("벤츠 리콜", "", ["벤츠"], 5))
        self.assertFalse(is_breaking("볼보 과징금", "", ["볼보"], 5))

    def test_bmw_recall_needs_importance_3(self):
        self.assertFalse(is_breaking("BMW 리콜", "", ["BMW"], 2))

    def test_group_plant_halt_is_breaking(self):
        self.assertTrue(is_breaking("Mini Oxford Factory Halted: Missing Part Could Idle Plant", "", ["MINI"], 3))

    def test_plain_bmw_news_not_breaking(self):
        self.assertFalse(is_breaking("BMW 신형 iX3 공개", "", ["BMW"], 5))


class Dedupe(unittest.TestCase):
    def test_tracking_params_and_slash(self):
        self.assertEqual(
            normalize_url("https://Example.com/a/?utm_source=x&id=1#top"),
            "https://example.com/a?id=1",
        )

    def test_google_news_query_preserved(self):
        u = "https://news.google.com/rss/articles/CBMi?oc=5"
        self.assertEqual(normalize_url(u), u)

    def test_publisher_suffix(self):
        self.assertEqual(strip_publisher_suffix("BMW 리콜 - 모터그래프"), "BMW 리콜")
        self.assertEqual(title_key("BMW 리콜 - 오토헤럴드"), title_key("BMW 리콜 - 모터그래프"))

    def test_dedupe_by_title_across_sources(self):
        items = [
            {"title": "BMW 리콜 - 모터그래프", "link": "https://a.com/1"},
            {"title": "BMW 리콜 - 오토헤럴드", "link": "https://b.com/2"},
        ]
        self.assertEqual(len(dedupe(items)), 1)


if __name__ == "__main__":
    unittest.main()
