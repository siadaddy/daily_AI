import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import auto_analyze as aa  # noqa: E402


def art(title, **kw):
    base = {"title": title, "summary": "", "link": f"https://x.com/{abs(hash(title))}", "source": "t",
            "source_type": "trade", "lang": "ko", "published_at": None, "topic_hint": None}
    base.update(kw)
    return base


class Select(unittest.TestCase):
    def test_cap_and_priority_order(self):
        arts = [art("연예 소식"), art("BMW 서비스센터 확대"), art("수입차 리콜 발표")]
        out = aa.select_for_analysis(arts, limit=2)
        self.assertEqual(len(out), 2)
        self.assertNotIn("연예 소식", [a["title"] for a in out])

    def test_zero_score_fills_remaining_slots(self):
        arts = [art("연예 소식"), art("BMW 서비스센터 확대")]
        self.assertEqual(len(aa.select_for_analysis(arts, limit=10)), 2)


class SelectFairness(unittest.TestCase):
    def test_bmw_group_guaranteed_over_higher_scored_competitor_news(self):
        # 테슬라 기사 30건은 점수가 높고(우선어+브랜드), BMW 기사 3건은 점수가 낮다 → 그래도 BMW 는 전부 들어가야 한다
        tesla = [art(f"테슬라 서비스센터 수리 {i}", topic_hint="ev_aftersales") for i in range(30)]
        bmw = [art(f"BMW 신차 공개 행사 {i}") for i in range(3)]
        out = aa.select_for_analysis(tesla + bmw, limit=10)
        self.assertEqual(sum(1 for a in out if a["title"].startswith("BMW")), 3)

    def test_one_brand_cannot_monopolize(self):
        tesla = [art(f"테슬라 서비스센터 수리 {i}", topic_hint="ev_aftersales") for i in range(30)]
        others = [art(f"벤츠 서비스센터 {i}") for i in range(5)] + [art(f"BYD 서비스센터 {i}") for i in range(5)]
        out = aa.select_for_analysis(tesla + others, limit=20)
        self.assertEqual(sum(1 for a in out if a["title"].startswith("테슬라")), aa.PER_BRAND_CAP)

    def test_cap_is_soft_when_slots_remain(self):
        tesla = [art(f"테슬라 서비스센터 수리 {i}") for i in range(15)]
        self.assertEqual(len(aa.select_for_analysis(tesla, limit=15)), 15)


class Parse(unittest.TestCase):
    def test_code_fence_and_chatter(self):
        self.assertEqual(aa.parse_llm_json('설명입니다\n```json\n{"items": []}\n```'), {"items": []})

    def test_bare_array(self):
        self.assertEqual(aa.parse_llm_json('[{"i": 0, "topic": "sdv"}]'), {"items": [{"i": 0, "topic": "sdv"}]})

    def test_truncated_keeps_complete_items(self):
        cut = '{"items":[{"i":0,"topic":"sdv","summary_ko":"가"},{"i":1,"topic":"ev_aftersales","summary_ko":"나"},{"i":2,"topic":"re'
        got = aa.parse_llm_json(cut)
        self.assertEqual([r["i"] for r in got["items"]], [0, 1])

    def test_garbage(self):
        self.assertIsNone(aa.parse_llm_json("죄송합니다"))
        self.assertIsNone(aa.parse_llm_json('{"items": [oops'))
        self.assertIsNone(aa.parse_llm_json(""))


class Normalize(unittest.TestCase):
    def test_invalid_values_replaced(self):
        out = aa.normalize_item({"topic": "weird", "importance": 99, "summary_ko": None}, art("x", topic_hint="sdv"))
        self.assertEqual((out["topic"], out["importance"], out["summary_ko"]), ("sdv", 5, ""))

    def test_importance_non_numeric_defaults(self):
        self.assertEqual(aa.normalize_item({"importance": "높음"}, art("x"))["importance"], 2)

    def test_competitor_rules(self):
        ok = {"competitor": {"brand": "벤츠", "item": "recall", "note": "EQE 리콜"}}
        self.assertEqual(aa.normalize_item(ok, art("x"))["competitor"]["brand"], "벤츠")
        bmw = {"competitor": {"brand": "BMW", "item": "recall", "note": "n"}}      # 자사는 경쟁사 기록 대상 아님
        bad_item = {"competitor": {"brand": "벤츠", "item": "gossip", "note": "n"}}
        no_note = {"competitor": {"brand": "벤츠", "item": "recall", "note": ""}}
        for raw in (bmw, bad_item, no_note):
            self.assertIsNone(aa.normalize_item(raw, art("x"))["competitor"])


class Row(unittest.TestCase):
    def test_english_title_translated_and_original_kept(self):
        a = art("BMW recalls 5 Series", lang="en", link="https://e.com/1")
        item = aa.normalize_item({"title_ko": "BMW, 5시리즈 리콜", "importance": 4, "topic": "regulation"}, a)
        row = aa.to_row(a, item, "2026-11-07")
        self.assertEqual((row["title"], row["title_original"]), ("BMW, 5시리즈 리콜", "BMW recalls 5 Series"))
        self.assertEqual(row["brands"], ["BMW"])
        self.assertTrue(row["is_breaking"])

    def test_fallback_keeps_korean_summary_only(self):
        self.assertEqual(aa.fallback_item(art("x", summary="요약"))["summary_ko"], "요약")
        self.assertEqual(aa.fallback_item(art("x", summary="summary", lang="en"))["summary_ko"], "")

    def test_llm_outage_still_flags_bmw_recall(self):
        # LLM 이 죽어도 BMW 리콜은 속보로 남아야 한다 (fallback 중요도가 규칙 기반)
        a = art("BMW, 540i xDrive 등 3종 리콜")
        row = aa.to_row(a, aa.fallback_item(a), "2026-11-07")
        self.assertTrue(row["is_breaking"])

    def test_llm_outage_does_not_flag_ordinary_news(self):
        a = art("BMW 신형 iX3 공개")
        self.assertFalse(aa.to_row(a, aa.fallback_item(a), "2026-11-07")["is_breaking"])

    def test_prompt_contains_all_articles(self):
        p = aa.build_prompt([art("첫째"), art("둘째")])
        self.assertIn("[0]", p)
        self.assertIn("[1]", p)


if __name__ == "__main__":
    unittest.main()
