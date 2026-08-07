import json
import os
import tempfile
import unittest
from pathlib import Path

from job_search_loop.job_hunt_controller import run_ashby_campaign, run_campaign


class JobHuntControllerTests(unittest.TestCase):
    def test_daily_driver_uses_campaign_controller_without_masking_failure(self):
        driver = (
            Path(__file__).resolve().parents[1] / "scripts" / "run-daily.sh"
        ).read_text(encoding="utf-8")

        self.assertIn("-m job_search_loop.job_hunt_controller", driver)
        self.assertNotIn('RUNNER_RC=0\nelse\n  "$JOB_SEARCH_PYTHON" -m job_search_loop.persistent_application_runner', driver)

    def test_continues_until_authoritative_submission(self):
        requests = [
            {"company": "Dead Shell", "title": "Role One"},
            {"company": "Unknown Submit", "title": "Role Two"},
            {"company": "Confirmed", "title": "Role Three"},
        ]
        outcomes = iter(
            [
                {"status": "pre_click_failed", "application_id": "one"},
                {"status": "submit_unknown", "application_id": "two"},
                {"status": "submitted", "application_id": "three"},
            ]
        )
        attempted = []

        def execute(request, evidence_dir):
            attempted.append((request["company"], evidence_dir.name))
            return next(outcomes)

        with tempfile.TemporaryDirectory() as directory:
            result = run_campaign(
                requests=requests,
                evidence_root=Path(directory),
                execute=execute,
            )

        self.assertEqual(result["status"], "submitted")
        self.assertEqual(result["attempt_count"], 3)
        self.assertEqual(result["submitted"], ["three"])
        self.assertEqual(result["submit_unknown"], ["two"])
        self.assertEqual(
            [company for company, _ in attempted],
            ["Dead Shell", "Unknown Submit", "Confirmed"],
        )

    def test_exhaustion_is_not_reported_as_success(self):
        requests = [{"company": "Blocked", "title": "Only Role"}]

        with tempfile.TemporaryDirectory() as directory:
            result = run_campaign(
                requests=requests,
                evidence_root=Path(directory),
                execute=lambda request, evidence_dir: {
                    "status": "pre_click_failed",
                    "application_id": "blocked",
                },
            )

        self.assertEqual(result["status"], "exhausted_without_submission")
        self.assertEqual(result["attempt_count"], 1)
        self.assertEqual(result["submitted"], [])

    def test_real_transaction_boundary_continues_after_two_non_successes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            transaction = root / "transaction.py"
            transaction.write_text(
                """#!/usr/bin/env python3
import json, os, sys
from pathlib import Path
request = json.loads(Path(sys.argv[1]).read_text())
evidence = Path(os.environ['JOB_SEARCH_EVIDENCE_DIR'])
if request['company'] == 'Broken':
    raise SystemExit(7)
status = 'ats_unconfirmed' if request['company'] == 'Unknown' else 'applied_ats'
(evidence / 'ashby-submit-result.json').write_text(json.dumps({'status': status}))
(evidence / 'submission-prepare.json').write_text(json.dumps({'application_id': request['application_id']}))
""",
                encoding="utf-8",
            )
            os.chmod(transaction, 0o700)
            request_path = root / "campaign.json"
            request_path.write_text(
                json.dumps(
                    {
                        "candidates": [
                            {"company": "Broken", "title": "One", "application_id": "one"},
                            {"company": "Unknown", "title": "Two", "application_id": "two"},
                            {"company": "Confirmed", "title": "Three", "application_id": "three"},
                        ]
                    }
                ),
                encoding="utf-8",
            )

            result = run_ashby_campaign(
                request_path=request_path,
                evidence_root=root / "evidence",
                transaction_script=transaction,
                environment={},
            )

        self.assertEqual(result["status"], "submitted")
        self.assertEqual(result["attempt_count"], 3)
        self.assertEqual(result["submitted"], ["three"])
        self.assertEqual(result["submit_unknown"], ["two"])


if __name__ == "__main__":
    unittest.main()
