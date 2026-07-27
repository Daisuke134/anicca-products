import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from job_search_loop.calendar_sync import event_key, prep_windows
from job_search_loop.inbox import classify_message
from job_search_loop.outbox import DeliveryUncertain, Outbox
from job_search_loop.summary import build_summary


class OperationsTests(unittest.TestCase):
    def test_inbox_classification(self):
        self.assertEqual(
            classify_message("Interview invitation", "Choose a time with our recruiter"),
            "interview",
        )
        self.assertEqual(
            classify_message("Application received", "Thank you for applying"),
            "confirmation",
        )
        self.assertEqual(
            classify_message("Update", "We will not be moving forward"), "rejection"
        )

    def test_calendar_key_and_prep_windows_are_stable(self):
        start = datetime(2026, 8, 5, 1, 0, tzinfo=timezone.utc)
        self.assertEqual(event_key("thread-1", start), event_key("thread-1", start))
        now = datetime(2026, 8, 1, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(prep_windows(now, start), ("three_day", "one_day"))

    def test_outbox_never_blind_retries_send_started(self):
        with tempfile.TemporaryDirectory() as directory:
            outbox = Outbox(Path(directory) / "outbox.sqlite3")
            row = outbox.enqueue("daily:2026-07-28", "hello")
            claim = outbox.claim(row)
            outbox.mark_send_started(row, claim)
            with self.assertRaises(DeliveryUncertain):
                outbox.claim(row)
            outbox.close()

    def test_summary_contains_counts_without_pii(self):
        value = build_summary(
            day="2026-07-28",
            states=["submitted", "submitted", "rejected"],
            model_route="terra-medium-bounded",
        )
        self.assertEqual(value["counts"]["submitted"], 2)
        self.assertNotIn("email", str(value).lower())


if __name__ == "__main__":
    unittest.main()
