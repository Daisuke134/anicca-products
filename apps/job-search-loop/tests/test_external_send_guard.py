"""A test run must never be able to reach a real external recipient.

On 2026-08-08 the owner received two Telegram messages containing pure fixture
content: company "Example", url "https://jobs.example/1", recipient
"talent@example.test", receipt "gmail:outreach-timeout", body "Complete sent
message.".  Those strings exist only in
`tests/test_application_reporting.py`.

Root cause: `deliver_outreach_dossiers` injects two transports, `sender` for
documents and `message_sender` for text.  Both tests stubbed `sender` only, so
`message_sender` fell back to its production default `telegram.send_once`, and
the text dossier was sent through the real Telegram API before the stubbed
document sender was ever reached.

The general defect is a production transport reachable through a default
argument.  Two layers close it: the transport boundary refuses to send while a
test runner is in process or when the payload is fixture-shaped, and the
specific function no longer defaults its text transport.
"""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path

from job_search_loop import telegram


class ExternalSendGuardTests(unittest.TestCase):
    def test_real_transport_refuses_to_send_while_a_test_runner_is_in_process(self):
        # The guard lives in the real network function so that the 97 test
        # modules which inject their own requester keep working; only the
        # default path that would actually reach api.telegram.org is closed.
        with self.assertRaises(telegram.ExternalSendBlocked):
            telegram._telegram_request(
                method="sendMessage",
                token="test-token",
                fields={"chat_id": "test-target", "text": "an ordinary message"},
            )

    def test_real_transport_refuses_fixture_shaped_payloads(self):
        for payload in (
            "Recipient: talent@example.test",
            "https://jobs.example/1",
            "see https://example.com/job",
        ):
            with self.subTest(payload=payload):
                with self.assertRaises(telegram.ExternalSendBlocked):
                    telegram._telegram_request(
                        method="sendMessage",
                        token="test-token",
                        fields={"chat_id": "test-target", "text": payload},
                    )

    def test_outreach_dossier_text_transport_has_no_production_default(self):
        import importlib
        import inspect

        reporting = importlib.import_module("job_search_loop.application_reporting")
        signature = inspect.signature(reporting.deliver_outreach_dossiers)
        parameter = signature.parameters["message_sender"]
        self.assertIs(
            parameter.default,
            inspect.Parameter.empty,
            "message_sender must be supplied explicitly; a production default lets a "
            "test that stubs only `sender` reach the real Telegram API",
        )

    def test_stubbing_only_the_document_sender_cannot_reach_the_real_transport(self):
        import importlib

        reporting = importlib.import_module("job_search_loop.application_reporting")
        report = {
            "application_id": "application-guard",
            "company": "Example",
            "title": "AI Engineer",
            "canonical_url": "https://jobs.example/1",
            "recipient": "talent@example.test",
            "subject": "Application — AI Engineer",
            "route_kind": "recruiting_outreach",
            "recipient_acceptance": "outreach_only",
            "provider_id": "gmail:outreach-guard",
            "message_sha256": "a" * 64,
            "resume_sha256": "b" * 64,
            "message_body": "Complete sent message.",
            "resume_path": "/private/resume.pdf",
        }

        with self.assertRaises(TypeError):
            reporting.deliver_outreach_dossiers(
                ledger_path=Path("unused.sqlite3"),
                outbox_path=Path("outbox.sqlite3"),
                media_root=Path("media"),
                report_reader=lambda _: [report],
                sender=lambda **_: (_ for _ in ()).throw(
                    subprocess.TimeoutExpired("openclaw", 60)
                ),
            )


if __name__ == "__main__":
    unittest.main()
