import hashlib
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from job_search_loop.daily_reporting import render_pipeline
from job_search_loop.ledger import Ledger
from job_search_loop.summary import build_summary_v2


class ConfirmedApplicationProjectionTests(unittest.TestCase):
    """Spec section 15 requirement rows 14 and 15.

    A confirmed application is one an employer acknowledged. An outbound email
    the resident sent is `email_sent` and must never enter the confirmed cohort.
    """

    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.ledger = Ledger(self.root / "ledger.sqlite3")
        self.message = self.root / "message.txt"
        self.message.write_text("Dear Hiring Team", encoding="utf-8")
        self.resume = self.root / "resume.pdf"
        self.resume.write_bytes(b"%PDF resume")
        self.source_sha = hashlib.sha256(b"official source").hexdigest()
        self.day = datetime.now(timezone(timedelta(hours=9))).date().isoformat()

    def tearDown(self):
        self.ledger.close()
        self.tempdir.cleanup()

    def _outreach_email(self, company, ordinal):
        """An outbound email the resident sent, historically mis-projected."""
        application_id = self.ledger.add_application(
            company,
            "AI Solutions Architect",
            f"https://jobs.ashbyhq.com/{company.lower()}/role-{ordinal}/application",
        )
        route_id = self.ledger.register_application_route(
            application_id,
            route_kind="recruiting_outreach",
            endpoint=f"talent+{ordinal}@example.test",
            ordinal=ordinal,
            source_url="https://careers.example.test/jobs",
            source_sha256=self.source_sha,
            recipient_acceptance="outreach_only",
        )
        evidence_sha256 = hashlib.sha256(f"receipt-{ordinal}".encode()).hexdigest()
        self.ledger.claim_application_route(
            route_id,
            actor="resident_worker",
            fence=ordinal,
            message_path=str(self.message),
            message_sha256=hashlib.sha256(self.message.read_bytes()).hexdigest(),
            resume_path=str(self.resume),
            resume_sha256=hashlib.sha256(self.resume.read_bytes()).hexdigest(),
        )
        self.ledger.complete_application_route(
            route_id,
            fence=ordinal,
            state="delivered",
            provider_id=f"gmail:outreach-{ordinal}",
            evidence_sha256=evidence_sha256,
        )
        route = next(
            row
            for row in self.ledger.application_routes(application_id)
            if str(row["route_id"]) == route_id
        )
        with self.ledger._transaction():
            self.ledger._project_delivered_application_route_in_transaction(
                row={**dict(route), "recipient_acceptance": "accepts_applications"},
                provider_id=str(route["provider_id"]),
                evidence_sha256=evidence_sha256,
            )
        return application_id

    def _employer_acknowledged(self, company, ordinal):
        """An inbound employer message bound to the application."""
        application_id = self.ledger.add_application(
            company,
            "Account Manager",
            f"https://jobs.ashbyhq.com/{company.lower()}/ack-{ordinal}/application",
        )
        for state in ("qualified", "materials_ready", "submit_claimed", "submit_unknown"):
            self.ledger.transition(application_id, state)
        evidence_sha256 = hashlib.sha256(f"employer-ack-{ordinal}".encode()).hexdigest()
        received_at = "2026-08-07T00:00:00+00:00"
        with self.ledger._transaction():
            self.ledger._append_event(
                application_id,
                "submit_unknown",
                "submitted",
                {
                    "message_id": f"gmail:inbound-{ordinal}",
                    "thread_id": f"thread-{ordinal}",
                    "evidence_sha256": evidence_sha256,
                    "received_at": received_at,
                },
            )
            self.ledger.connection.execute(
                "UPDATE applications SET current_state = 'submitted' WHERE id = ?",
                (application_id,),
            )
        self.ledger.record_funnel_outcome(
            application_id=application_id,
            funnel_stage="confirmed_application",
            disposition="positive",
            evidence_source="gmail",
            evidence_sha256=evidence_sha256,
            occurred_at=received_at,
            observed_at=received_at,
        )
        return application_id

    def test_summary_v2_rebuilds_from_events_and_matches_telegram_projection(self):
        acknowledged = self._employer_acknowledged("ElevenLabs", 1)
        emailed = [self._outreach_email(company, ordinal) for ordinal, company
                   in enumerate(("Cursor", "NVIDIA"), start=4)]
        manual = self.ledger.add_application(
            "OpenAI",
            "AI Success Engineer",
            "https://jobs.ashbyhq.com/openai/success/application",
            owner="dais_manual",
        )
        for state in ("qualified", "materials_ready", "submit_claimed", "submitted"):
            self.ledger.transition(manual, state)

        self.ledger.reconcile_delivered_application_routes()
        value = build_summary_v2(
            day=self.day, applications=self.ledger.event_summary_rows()
        )

        # Rebuilt purely from events.
        self.assertEqual(
            value["counts"], {"email_sent": 2, "submitted": 2}
        )
        for application_id in emailed:
            self.assertEqual(self.ledger.current_state(application_id), "email_sent")
        self.assertEqual(self.ledger.current_state(acknowledged), "submitted")

        # Autonomous confirmed applications == applications holding an inbound
        # employer message. The dais_manual row is counted separately.
        self.assertEqual(
            value["confirmed_applications"],
            {"agent": 1, "dais_manual": 0, "recruiter": 0, "total": 1},
        )
        self.assertEqual(value["owners"], {"agent": 3, "dais_manual": 1})

        # The Telegram projection reports the same numbers, from the same object.
        rendered = render_pipeline(value)
        confirmed = value["funnel"]["confirmed_application_rate"]
        self.assertIn(
            f"応募確認: {confirmed['numerator']}/{confirmed['denominator']}", rendered
        )
        self.assertIn("Agent 3", rendered)
        self.assertIn("Dais手動 1", rendered)

    def test_funnel_rates_use_confirmed_application_denominator(self):
        self._employer_acknowledged("ElevenLabs", 1)
        self._outreach_email("Cursor", 4)
        self._outreach_email("NVIDIA", 5)
        self.ledger.reconcile_delivered_application_routes()

        value = build_summary_v2(
            day=self.day, applications=self.ledger.event_summary_rows()
        )
        funnel = value["funnel"]

        # Emails are attempts, never confirmations.
        self.assertEqual(
            funnel["confirmed_application_rate"],
            {"numerator": 1, "denominator": 3, "rate": 0.3333},
        )
        confirmed = funnel["confirmed_application_rate"]["numerator"]
        for metric in ("recruiter_reply_rate", "interview_rate", "offer_rate"):
            self.assertEqual(
                funnel[metric]["denominator"],
                confirmed,
                f"{metric} must be measured against confirmed applications",
            )
        self.assertEqual(value["confirmed_applications"]["agent"], confirmed)


class SummaryProjectionTests(unittest.TestCase):
    def test_funnel_metrics_expose_exact_numerators_and_denominators(self):
        def row(identifier, stages):
            return {
                "application_id": identifier,
                "canonical_url": f"https://jobs.example/{identifier}",
                "owner": "agent",
                "current_state": "submitted",
                "ever_submitted": True,
                "submission_attempted": True,
                "positive_funnel_stages": stages,
            }

        value = build_summary_v2(
            day="2026-08-05",
            applications=[
                row("one", ["confirmed_application", "recruiter_response", "interview", "final_round", "offer", "accepted"]),
                row("two", ["confirmed_application"]),
                row("three", []),
            ],
        )
        self.assertEqual(value["funnel"], {
            "confirmed_application_rate": {"numerator": 2, "denominator": 3, "rate": 0.6667},
            "recruiter_reply_rate": {"numerator": 1, "denominator": 2, "rate": 0.5},
            "interview_rate": {"numerator": 1, "denominator": 2, "rate": 0.5},
            "final_round_rate": {"numerator": 1, "denominator": 1, "rate": 1.0},
            "offer_rate": {"numerator": 1, "denominator": 2, "rate": 0.5},
            "acceptance_rate": {"numerator": 1, "denominator": 1, "rate": 1.0},
        })

    def test_funnel_metric_rejects_numerator_outside_denominator(self):
        with self.assertRaisesRegex(ValueError, "outside its denominator"):
            build_summary_v2(day="2026-08-05", applications=[{
                "application_id": "one",
                "canonical_url": "https://jobs.example/one",
                "owner": "agent",
                "current_state": "interview",
                "ever_submitted": True,
                "submission_attempted": True,
                "positive_funnel_stages": ["interview"],
            }])

    def test_cli_writes_private_adapter_progress_without_application_details(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            database = root / "ledger.sqlite3"
            output = root / "summary.v2.json"
            ledger = Ledger(database)
            applications = [
                (
                    ledger.add_application(
                        "Ashby Employer",
                        "Applied AI Engineer",
                        "https://jobs.ashbyhq.com/example/ashby-role/application",
                    ),
                    "submitted",
                ),
                (
                    ledger.add_application(
                        "Workday Employer",
                        "AI Solutions Consultant",
                        "https://example.wd5.myworkdayjobs.com/careers/job/42",
                    ),
                    "submit_unknown",
                ),
                (
                    ledger.add_application(
                        "Generic Employer",
                        "AI Product Manager",
                        "https://careers.example.com/jobs/7",
                    ),
                    "submitted",
                ),
                (
                    ledger.add_application(
                        "Progressed Ashby Employer",
                        "AI Partnerships Lead",
                        "https://jobs.ashbyhq.com/example/progressed-role/application",
                    ),
                    "interview",
                ),
            ]
            for application_id, state in applications:
                for transition in ("qualified", "materials_ready", "submit_claimed"):
                    ledger.transition(application_id, transition)
                if state == "interview":
                    ledger.transition(application_id, "submitted")
                    ledger.transition(application_id, "interview")
                else:
                    ledger.transition(application_id, state)
            ledger.close()

            output.write_text("{partial", encoding="utf-8")
            output.chmod(0o644)
            result = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "job_search_loop.summary",
                    "--ledger",
                    str(database),
                    "--output",
                    str(output),
                    "--day",
                    "2026-07-29",
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(output.is_file())
            self.assertEqual(output.stat().st_mode & 0o777, 0o600)
            self.assertEqual(
                [
                    path.name
                    for path in root.iterdir()
                    if path.name.startswith(".summary.v2.json.")
                ],
                [],
            )
            value = json.loads(output.read_text(encoding="utf-8"))
            first_bytes = output.read_bytes()
            self.assertEqual(value["version"], 2)
            self.assertEqual(value["day"], "2026-07-29")
            self.assertEqual(
                value["counts"],
                {
                    "interview": 1,
                    "submit_unknown": 1,
                    "submitted": 2,
                },
            )
            self.assertEqual(value["owners"], {"agent": 4})
            self.assertEqual(
                value["ats_progress"],
                {
                    "required_adapters": ["ashby", "workday"],
                    "confirmed_adapters": ["ashby"],
                    "complete": False,
                    "adapters": {
                        "ashby": {"ever_submitted": 2, "interview": 1, "submitted": 1},
                        "generic": {"ever_submitted": 1, "submitted": 1},
                        "workday": {"submit_unknown": 1},
                    },
                },
            )
            self.assertRegex(value["projection_sha256"], r"^[a-f0-9]{64}$")
            self.assertNotIn("model_route", value)
            output.unlink()
            replay = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "job_search_loop.summary",
                    "--ledger",
                    str(database),
                    "--output",
                    str(output),
                    "--day",
                    "2026-07-29",
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(replay.returncode, 0, replay.stderr)
            self.assertEqual(output.read_bytes(), first_bytes)
            ledger = Ledger(database)
            try:
                with self.assertRaises(sqlite3.IntegrityError):
                    ledger.connection.execute(
                        "UPDATE events SET to_state='rejected'"
                    )
                with self.assertRaises(sqlite3.IntegrityError):
                    ledger.connection.execute("DELETE FROM events")
                with self.assertRaises(sqlite3.IntegrityError):
                    ledger.connection.execute(
                        "UPDATE applications SET current_state='rejected'"
                    )
            finally:
                ledger.close()
            encoded = json.dumps(value).casefold()
            for private_value in (
                "ashby employer",
                "workday employer",
                "generic employer",
                "applied ai engineer",
                "https://",
            ):
                self.assertNotIn(private_value, encoded)


if __name__ == "__main__":
    unittest.main()
