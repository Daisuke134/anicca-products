import importlib.util
import unittest
from datetime import datetime
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("finalizer.py")
SPEC = importlib.util.spec_from_file_location("orca_zenn_finalizer", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def article(slug: str, published_at: str) -> dict:
    return {"slug": slug, "published_at": published_at, "title": slug}


class PlanTests(unittest.TestCase):
    def test_waits_for_japanese_window(self):
        api = {"articles": [article("previous", "2026-07-21T17:10:21.742+09:00")]}
        now = datetime.fromisoformat("2026-07-22T01:10:00+09:00")
        plan = MODULE.plan(api, now)
        self.assertEqual("wait", plan["action"])
        self.assertEqual(MODULE.JA_SLUG, plan["slug"])
        self.assertEqual("2026-07-22T17:10:31.742000+09:00", plan["retry_at"])

    def test_retries_japanese_after_window(self):
        api = {"articles": [article("previous", "2026-07-21T17:10:21.742+09:00")]}
        now = datetime.fromisoformat("2026-07-22T17:12:00+09:00")
        plan = MODULE.plan(api, now)
        self.assertEqual({"action": "retry", "slug": MODULE.JA_SLUG}, plan)

    def test_waits_for_english_after_japanese_is_live(self):
        api = {"articles": [article(MODULE.JA_SLUG, "2026-07-22T17:12:00+09:00")]}
        now = datetime.fromisoformat("2026-07-22T18:00:00+09:00")
        plan = MODULE.plan(api, now)
        self.assertEqual("wait", plan["action"])
        self.assertEqual(MODULE.EN_SLUG, plan["slug"])
        self.assertEqual("2026-07-23T17:12:10+09:00", plan["retry_at"])

    def test_done_only_when_both_languages_are_live(self):
        api = {
            "articles": [
                article(MODULE.EN_SLUG, "2026-07-23T17:14:00+09:00"),
                article(MODULE.JA_SLUG, "2026-07-22T17:12:00+09:00"),
            ]
        }
        now = datetime.fromisoformat("2026-07-23T17:20:00+09:00")
        self.assertEqual({"action": "done"}, MODULE.plan(api, now))


if __name__ == "__main__":
    unittest.main()
