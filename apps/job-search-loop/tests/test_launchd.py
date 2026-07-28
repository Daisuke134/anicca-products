import plistlib
import unittest
from pathlib import Path


class LaunchdTests(unittest.TestCase):
    def test_plists_have_separate_bounded_schedules(self):
        root = Path(__file__).parents[1] / "launchd"
        daily = plistlib.loads((root / "ai.anicca.job-search-daily.plist").read_bytes())
        inbox = plistlib.loads((root / "ai.anicca.job-search-inbox.plist").read_bytes())
        self.assertTrue(daily["RunAtLoad"])
        self.assertEqual(daily["StartCalendarInterval"]["Hour"], 8)
        self.assertEqual(daily["StartCalendarInterval"]["Minute"], 30)
        self.assertEqual(inbox["StartInterval"], 900)
        self.assertNotEqual(daily["Label"], inbox["Label"])
        self.assertNotEqual(daily["ProgramArguments"][0], inbox["ProgramArguments"][0])

    def test_inbox_shell_uses_deterministic_prefilter_before_model(self):
        root = Path(__file__).parents[1]
        script = (root / "scripts" / "run-inbox.sh").read_text(encoding="utf-8")
        self.assertIn("job_search_loop.inbox scan", script)
        self.assertIn('if [[ "$NEW_COUNT" == "0" ]]', script)
        self.assertIn("job_search_loop.inbox mark", script)


if __name__ == "__main__":
    unittest.main()
