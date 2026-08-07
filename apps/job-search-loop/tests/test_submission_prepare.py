import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from job_search_loop.submission_prepare import prepare_submission


class SubmissionPrepareTests(unittest.TestCase):
    def test_explicit_user_overflow_is_forwarded_to_ledger_fence(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            resume = root / "resume.pdf"
            snapshot = root / "snapshot.json"
            fill = root / "fill.json"
            answers = root / "answers.json"
            resume.write_bytes(b"%PDF-1.4")
            snapshot.write_text(json.dumps({"version": 1}))
            fill.write_text(json.dumps({"status": "claim_ready"}))
            answers.write_text("[]")
            ledger = MagicMock()
            ledger.current_state.return_value = "materials_ready"
            ledger.claim_submission.return_value = SimpleNamespace(
                intent_id="intent-1", fence=13
            )
            ledger.record_submission_materials.return_value = {
                "payload_sha256": hashlib.sha256(b"materials").hexdigest()
            }

            with patch("job_search_loop.submission_prepare.Ledger", return_value=ledger):
                result = prepare_submission(
                    ledger_path=root / "ledger.sqlite3",
                    application_id="application-1",
                    japan_day="2026-08-07",
                    portfolio_bucket="strong_fit",
                    resume_path=resume,
                    snapshot_path=snapshot,
                    fill_receipt_path=fill,
                    answers_path=answers,
                    user_authorized_overflow=True,
                    overflow_reason="owner explicitly requested this application",
                )

            self.assertEqual(result["intent_id"], "intent-1")
            kwargs = ledger.claim_submission.call_args.kwargs
            self.assertTrue(kwargs["user_authorized_overflow"])
            self.assertEqual(
                kwargs["overflow_reason"],
                "owner explicitly requested this application",
            )


if __name__ == "__main__":
    unittest.main()
