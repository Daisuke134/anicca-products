"""L-74A — outreach email deliveries are `email_sent`, never `submitted`.

Section 15 item 34 and section 17.3 rule 1 of the Job Hunter spec: a provider ACK
for an outbound email the resident itself sent must stay `email_sent`. Only an
inbound employer message bound to the application may create a confirmed
application. These tests exercise the generalized correction over every affected
row, not a single hardcoded application id.
"""

import hashlib
import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from job_search_loop.daily_reporting import deliver_truth_correction
from job_search_loop.guardian import ledger_health
from job_search_loop.ledger import Ledger
from job_search_loop.state import TRANSITIONS, InvalidTransition, validate_transition
from job_search_loop.summary import build_summary_v2


def _japan_day() -> str:
    return datetime.now(timezone(timedelta(hours=9))).date().isoformat()


class OutreachTruthCorrectionTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.ledger = Ledger(self.root / "ledger.sqlite3")
        self.message = self.root / "message.txt"
        self.message.write_text("Dear Hiring Team", encoding="utf-8")
        self.resume = self.root / "resume.pdf"
        self.resume.write_bytes(b"%PDF resume")
        self.source_sha = hashlib.sha256(b"official source").hexdigest()

    def tearDown(self):
        self.ledger.close()
        self.tempdir.cleanup()

    def _deliver(self, *, company, ordinal, acceptance, route_kind):
        """Reproduce the historical projection that wrongly marked email `submitted`."""
        application_id = self.ledger.add_application(
            company,
            "AI Solutions Architect",
            f"https://jobs.ashbyhq.com/{company.lower()}/role-{ordinal}/application",
        )
        route_id = self.ledger.register_application_route(
            application_id,
            route_kind=route_kind,
            endpoint=f"talent+{ordinal}@example.test",
            ordinal=ordinal,
            source_url="https://careers.example.test/jobs",
            source_sha256=self.source_sha,
            recipient_acceptance=acceptance,
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
        if acceptance == "outreach_only":
            # The pre-fix code path projected outreach deliveries as `submitted`.
            with self.ledger._transaction():
                self.ledger._project_delivered_application_route_in_transaction(
                    row={**dict(route), "recipient_acceptance": "accepts_applications"},
                    provider_id=str(route["provider_id"]),
                    evidence_sha256=evidence_sha256,
                )
        return application_id, route_id, evidence_sha256

    def _summary_row(self, application_id):
        return next(
            row
            for row in self.ledger.event_summary_rows()
            if row["application_id"] == application_id
        )

    def test_email_sent_is_a_real_state_reachable_from_submit_claimed(self):
        self.assertIn("email_sent", TRANSITIONS)
        self.assertIn("email_sent", TRANSITIONS["submit_claimed"])
        validate_transition("submit_claimed", "email_sent")
        for target in (
            "submitted",
            "recruiter_contact",
            "screening",
            "interview",
            "rejected",
            "withdrawn",
            "not_submitted",
        ):
            validate_transition("email_sent", target)
        with self.assertRaises(InvalidTransition):
            validate_transition("email_sent", "offer")

    def test_every_outreach_only_delivery_is_corrected_to_email_sent(self):
        rows = [
            self._deliver(
                company=company,
                ordinal=ordinal,
                acceptance="outreach_only",
                route_kind="recruiting_outreach",
            )
            for ordinal, company in enumerate(("Cursor", "NVIDIA", "Salesforce"), start=4)
        ]
        day = _japan_day()
        for application_id, _, _ in rows:
            self.assertEqual(self.ledger.current_state(application_id), "submitted")
        self.assertEqual(self.ledger.confirmed_daily_count(day), 3)

        first = self.ledger.reconcile_delivered_application_routes()
        second = self.ledger.reconcile_delivered_application_routes()

        # Generalized: all three, not one hardcoded id.
        self.assertEqual(first["outreach_correction_count"], 3)
        self.assertEqual(second["outreach_correction_count"], 0)
        for application_id, route_id, evidence_sha256 in rows:
            self.assertEqual(self.ledger.current_state(application_id), "email_sent")
            route = next(
                row
                for row in self.ledger.application_routes(application_id)
                if str(row["route_id"]) == route_id
            )
            # Immutable receipts are never rewritten.
            self.assertEqual(route["delivery_evidence_sha256"], evidence_sha256)
            self.assertEqual(
                [
                    event["to_state"]
                    for event in self.ledger.application_route_events(route_id)
                ],
                ["eligible", "action_started", "delivered"],
            )
            summary = self._summary_row(application_id)
            self.assertEqual(summary["current_state"], "email_sent")
            self.assertFalse(summary["ever_submitted"])
            self.assertTrue(summary["submission_attempted"])
            self.assertNotIn(
                "confirmed_application", summary["positive_funnel_stages"]
            )
        # An email does not consume a confirmed-application slot.
        self.assertEqual(self.ledger.confirmed_daily_count(day), 0)
        self.assertEqual(
            sum(self.ledger.confirmed_daily_portfolio(day).values()), 0
        )
        slot_states = {
            str(row[0])
            for row in self.ledger.connection.execute(
                "SELECT status FROM daily_slots WHERE japan_day = ?", (day,)
            )
        }
        self.assertEqual(slot_states, {"email_sent"})
        self.assertEqual(ledger_health(self.ledger.path)["status"], "healthy")

        value = build_summary_v2(
            day=day, applications=self.ledger.event_summary_rows()
        )
        self.assertEqual(value["counts"], {"email_sent": 3})
        self.assertEqual(value["ats_progress"]["confirmed_adapters"], [])
        self.assertEqual(
            value["funnel"]["confirmed_application_rate"],
            {"numerator": 0, "denominator": 3, "rate": 0.0},
        )

    def test_route_that_accepts_applications_is_never_corrected(self):
        application_id, _, _ = self._deliver(
            company="Employer",
            ordinal=3,
            acceptance="accepts_applications",
            route_kind="recruiting_email",
        )
        self.assertEqual(self.ledger.current_state(application_id), "submitted")
        result = self.ledger.reconcile_delivered_application_routes()
        self.assertEqual(result["outreach_correction_count"], 0)
        self.assertEqual(self.ledger.current_state(application_id), "submitted")
        self.assertEqual(ledger_health(self.ledger.path)["status"], "healthy")

    def test_correction_is_not_reported_as_an_automatic_upgrade_path(self):
        """`email_sent` must never be raised to `submitted` by the reconciler."""
        application_id, _, _ = self._deliver(
            company="Workday",
            ordinal=9,
            acceptance="outreach_only",
            route_kind="recruiting_outreach",
        )
        self.ledger.reconcile_delivered_application_routes()
        self.assertEqual(self.ledger.current_state(application_id), "email_sent")
        for _ in range(3):
            self.ledger.reconcile_delivered_application_routes()
        self.assertEqual(self.ledger.current_state(application_id), "email_sent")


class TruthCorrectionReportTests(unittest.TestCase):
    def test_correction_is_reported_once_in_japanese_with_both_numbers(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            summary_path = root / "summary.v2.json"
            outbox_path = root / "outbox.sqlite3"
            value = build_summary_v2(
                day="2026-08-08",
                applications=[
                    {
                        "application_id": "confirmed",
                        "canonical_url": "https://jobs.ashbyhq.com/e/a/application",
                        "owner": "agent",
                        "current_state": "submitted",
                        "ever_submitted": True,
                        "submission_attempted": True,
                        "positive_funnel_stages": ["confirmed_application"],
                    },
                    *(
                        {
                            "application_id": f"emailed-{index}",
                            "canonical_url": f"https://jobs.ashbyhq.com/e/{index}/application",
                            "owner": "agent",
                            "current_state": "email_sent",
                            "ever_submitted": False,
                            "submission_attempted": True,
                            "positive_funnel_stages": [],
                        }
                        for index in range(5)
                    ),
                ],
            )
            summary_path.write_text(json.dumps(value), encoding="utf-8")

            sent = []

            def sender(*, database, event_key, message):
                sent.append((event_key, message))
                return {"status": "sent", "message_id": "4242"}

            first = deliver_truth_correction(
                summary_path=summary_path,
                outbox_path=outbox_path,
                corrected_count=5,
                previous_confirmed=6,
                sender=sender,
            )
            deliver_truth_correction(
                summary_path=summary_path,
                outbox_path=outbox_path,
                corrected_count=5,
                previous_confirmed=6,
                sender=sender,
            )

            self.assertEqual(first["status"], "sent")
            # Same projection and same count produce one stable, deduplicated key.
            self.assertEqual({key for key, _ in sent}, {first["event_key"]})
            message = sent[0][1]
            self.assertIn("訂正", message)
            self.assertIn("誤りでした", message)
            # The wrong number, the arithmetic, and the corrected number.
            self.assertIn("応募済み 6 件", message)
            self.assertIn("訂正後の応募済み: 1 件（6 件 − 5 件）", message)
            self.assertIn(
                "そのうち企業からの受領確認が取れている応募: 1 件", message
            )
            self.assertIn("メール送信のみで企業の返信待ち: 5 件", message)

    def test_correction_report_rejects_a_tampered_projection(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            summary_path = root / "summary.v2.json"
            value = build_summary_v2(
                day="2026-08-08",
                applications=[
                    {
                        "application_id": "one",
                        "canonical_url": "https://jobs.ashbyhq.com/e/a/application",
                        "owner": "agent",
                        "current_state": "email_sent",
                        "ever_submitted": False,
                        "submission_attempted": True,
                        "positive_funnel_stages": [],
                    }
                ],
            )
            value["counts"]["submitted"] = 99
            summary_path.write_text(json.dumps(value), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
                deliver_truth_correction(
                    summary_path=summary_path,
                    outbox_path=root / "outbox.sqlite3",
                    corrected_count=5,
                    previous_confirmed=6,
                    sender=lambda **_: {"status": "sent", "message_id": "1"},
                )


if __name__ == "__main__":
    unittest.main()
