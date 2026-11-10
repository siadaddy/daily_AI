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


class StoryDedupe(unittest.TestCase):
    LG = [
        "LG엔솔, 배터리 진단시간 7시간→10분…CES 2027 혁신상 수상",
        "LG에너지솔루션, 배터리 진단 '7시간→10분'…CES 2027 혁신상 수상",
        "\"7시간 걸리던 배터리 진단, 단 10분에\"…LG엔솔, CES 혁신상 수상",
        "LG엔솔, 폐배터리 진단 시간 대폭 단축..CES 혁신상 수상 - 머니투데이",
    ]

    def test_same_event_different_headlines_collapse_to_one(self):
        arts = [art(t, source_type="naver") for t in self.LG] + [art("BMW 5시리즈 리콜 발표")]
        out = aa.dedupe_stories(arts, rank=aa.story_rank)
        self.assertEqual(len(out), 2)
        self.assertEqual(max(a["dup_count"] for a in out), 4)

    def test_templated_titles_with_different_subjects_are_kept(self):
        a = art("탄소나노튜브 도전재 시장 2035년 전망: 전기차 배터리 수요 증가")
        b = art("전기차 진단 장비 시장 2035년 전망: 전기차 보유 대수 증가")
        self.assertEqual(len(aa.dedupe_stories([a, b], rank=aa.story_rank)), 2)

    def test_conflicting_numbers_are_different_stories(self):
        self.assertEqual(len(aa.dedupe_stories([art("BMW 3종 리콜"), art("BMW 5종 리콜")], rank=aa.story_rank)), 2)

    def test_story_already_saved_in_recent_days_is_dropped(self):
        out = aa.dedupe_stories([art(self.LG[0])], rank=aa.story_rank, known_titles=[self.LG[1]])
        self.assertEqual(out, [])

    def test_bmw_group_article_is_the_representative(self):
        bmw = art("BMW, 삼성SDI·LG엔솔 배터리 추가 공급계약…유럽·미국 시장 공략", source_type="google")
        other = art("삼성SDI·LG엔솔, 6세대 배터리 공급사로 선정", source_type="trade", summary="요약이 아주 길어도")
        out = aa.dedupe_stories([other, bmw], rank=aa.story_rank)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["title"], bmw["title"])

    def test_widely_covered_story_gets_selection_boost(self):
        wide = art("현대차 신형 전기차 공개 행사", dup_count=4)
        single = art("기아 신형 전기차 공개 행사", dup_count=1)
        out = aa.select_for_analysis([single, wide], limit=1)
        self.assertEqual(out[0]["title"], wide["title"])


class Digest(unittest.TestCase):
    def rows(self, topic, n, imp=3):
        return [{"title": f"{topic} 기사 {i}", "summary_ko": "요약", "topic": topic, "importance": imp - (i % 2)} for i in range(n)]

    def test_topics_with_too_few_articles_are_not_summarized(self):
        g = aa.group_for_digest(self.rows("sdv", 1) + self.rows("regulation", 3) + self.rows("other", 9))
        self.assertEqual(list(g), ["regulation"])

    def test_group_is_capped_and_sorted_by_importance(self):
        g = aa.group_for_digest(self.rows("regulation", 30, imp=5))
        self.assertEqual(len(g["regulation"]), aa.DIGEST_PER_TOPIC)
        self.assertGreaterEqual(g["regulation"][0]["importance"], g["regulation"][-1]["importance"])

    def test_counts_come_from_code_not_llm(self):
        g = {"regulation": self.rows("regulation", 3)}
        data = {"topics": {"regulation": {"headline": "리콜 잇따라", "points": ["a", "b"], "article_count": 999},
                           "all": {"headline": "총평", "points": ["x"]}}}
        out = aa.normalize_digest(data, g, {"regulation": 22}, 150, "2026-11-10")
        by = {d["topic"]: d for d in out}
        self.assertEqual(by["regulation"]["article_count"], 22)
        self.assertEqual(by["all"]["article_count"], 150)

    def test_invalid_digest_is_ignored(self):
        self.assertEqual(aa.normalize_digest({"topics": "oops"}, {}, {}, 0, "d"), [])
        self.assertEqual(aa.normalize_digest(None, {}, {}, 0, "d"), [])

    def test_points_limited_to_three_and_blank_dropped(self):
        g = {"sdv": self.rows("sdv", 2)}
        data = {"topics": {"sdv": {"headline": "h", "points": ["1", "", "2", "3", "4"]}}}
        self.assertEqual(aa.normalize_digest(data, g, {"sdv": 2}, 2, "d")[0]["points"], ["1", "2", "3"])

    def test_prompt_forbids_counts_and_inventing(self):
        p = aa.build_digest_prompt({"sdv": self.rows("sdv", 2)})
        self.assertIn("건수는 쓰지 마세요", p)
        self.assertIn("만들어내지 마세요", p)


class Taxonomy(unittest.TestCase):
    def test_ev_industry_is_a_topic_and_in_the_prompt(self):
        self.assertIn("ev_industry", aa.TOPICS)
        self.assertIn("ev_industry", aa.build_prompt([art("x")]))

    def test_unknown_topic_falls_back_to_hint(self):
        out = aa.normalize_item({"topic": "weird"}, art("x", topic_hint="ev_industry"))
        self.assertEqual(out["topic"], "ev_industry")

    def test_legacy_db_remap(self):
        rows = [{"topic": "ev_industry"}, {"topic": "sdv"}]
        self.assertEqual([r["topic"] for r in aa.remap_topics_for_legacy_db(rows)], ["import_market", "sdv"])


class OpenAICall(unittest.TestCase):
    def test_uses_openai_json_mode_and_never_gemini(self):
        from unittest import mock
        resp = mock.Mock()
        resp.json.return_value = {"choices": [{"message": {"content": ' {"items": []} '}}]}
        with mock.patch.dict(os.environ, {"OPENAI_API_KEY": "k"}), mock.patch.object(aa.requests, "post", return_value=resp) as post:
            self.assertEqual(aa.ask_openai("p"), '{"items": []}')
        url = post.call_args.args[0]
        self.assertIn("api.openai.com", url)
        self.assertEqual(post.call_args.kwargs["json"]["response_format"], {"type": "json_object"})
        self.assertNotIn("gemini_client", open(aa.__file__, encoding="utf-8").read().split("def analyze_batch")[1])

    def test_missing_key_raises(self):
        from unittest import mock
        with mock.patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            with self.assertRaises(RuntimeError):
                aa.ask_openai("p")


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
