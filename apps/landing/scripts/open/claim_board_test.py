#!/usr/bin/env python3
"""Concurrency + silent-failure tests for claim_board.py. Source: this file + claim_board.py."""
from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import claim_board as cb  # noqa: E402


class ClaimBoardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / "claims.sqlite"
        self.conn = cb.connect(self.db)
        cb.init_db(self.conn)
        cb.upsert_task(
            self.conn,
            "x-15min-engine",
            "X @diceai0 15m publish engine",
            status="open",
            last_public_at=None,
            blocker_public="connector review card / Nothing was posted",
            quantity_goal_public="published URLs only",
            quantity_done=0,
        )

    def tearDown(self):
        self.conn.close()
        self.tmp.cleanup()

    def test_concurrent_claims_one_wins(self):
        results = [None, None]

        def worker(i, owner):
            c = cb.connect(self.db)
            results[i] = cb.claim(c, "x-15min-engine", owner, expected_revision=0, lease_seconds=60)
            c.close()

        t1 = threading.Thread(target=worker, args=(0, "bot-a"))
        t2 = threading.Thread(target=worker, args=(1, "bot-b"))
        t1.start(); t2.start(); t1.join(); t2.join()
        wins = [r for r in results if r and r.get("ok")]
        losses = [r for r in results if r and not r.get("ok")]
        self.assertEqual(len(wins), 1, results)
        self.assertEqual(len(losses), 1, results)
        self.assertIsNotNone(wins[0]["lease_token"])
        self.assertEqual(wins[0]["public"]["owner"], wins[0]["public"]["owner"])
        loser_public = losses[0].get("public") or {}
        self.assertNotEqual(loser_public.get("owner"), losses[0].get("attempted_owner"))
        # Loser must not own the task
        self.assertEqual(wins[0]["public"]["owner"] in {"bot-a", "bot-b"}, True)
        self.assertNotEqual(loser_public.get("owner"), None if losses[0]["error"] == "missing_task" else "both")
        owned = wins[0]["public"]["owner"]
        self.assertTrue(all((r.get("public") or {}).get("owner") in {None, owned} for r in losses))

    def test_same_lease_duplicate_is_idempotent_renew(self):
        first = cb.claim(self.conn, "x-15min-engine", "bot-a", expected_revision=0, lease_seconds=60)
        self.assertTrue(first["ok"])
        second = cb.claim(
            self.conn,
            "x-15min-engine",
            "bot-a",
            expected_revision=first["revision"],
            lease_seconds=60,
            lease_token=first["lease_token"],
        )
        self.assertTrue(second["ok"], second)
        self.assertEqual(second["lease_token"], first["lease_token"])
        self.assertEqual(second["revision"], first["revision"] + 1)

    def test_expired_claim_returns_and_other_can_take(self):
        first = cb.claim(self.conn, "x-15min-engine", "bot-a", expected_revision=0, lease_seconds=1)
        self.assertTrue(first["ok"])
        # Force expiry
        self.conn.execute(
            "UPDATE tasks SET lease_expires=? WHERE task_id=?",
            ("2000-01-01T00:00:00Z", "x-15min-engine"),
        )
        n = cb.expire_leases(self.conn)
        self.assertGreaterEqual(n, 1)
        row = self.conn.execute("SELECT owner, revision FROM tasks WHERE task_id='x-15min-engine'").fetchone()
        self.assertIsNone(row["owner"])
        second = cb.claim(self.conn, "x-15min-engine", "bot-b", expected_revision=row["revision"], lease_seconds=60)
        self.assertTrue(second["ok"], second)
        self.assertEqual(second["public"]["owner"], "bot-b")

    def test_stale_worker_heartbeat_rejected(self):
        first = cb.claim(self.conn, "x-15min-engine", "bot-a", expected_revision=0, lease_seconds=60)
        bad = cb.heartbeat(
            self.conn,
            "x-15min-engine",
            "bot-a",
            lease_token="wrong-token",
            expected_revision=first["revision"],
        )
        self.assertFalse(bad["ok"])
        self.assertEqual(bad["error"], "stale_worker_rejected")
        # Wrong revision also rejected
        bad2 = cb.heartbeat(
            self.conn,
            "x-15min-engine",
            "bot-a",
            lease_token=first["lease_token"],
            expected_revision=first["revision"] + 99,
        )
        self.assertFalse(bad2["ok"])

    def test_stale_owner_cannot_overwrite_without_winning_claim(self):
        first = cb.claim(self.conn, "x-15min-engine", "bot-a", expected_revision=0, lease_seconds=60)
        stale = cb.claim(
            self.conn,
            "x-15min-engine",
            "bot-stale",
            expected_revision=0,  # stale revision
            lease_seconds=60,
        )
        self.assertFalse(stale["ok"])
        self.assertIn(stale["error"], {"revision_mismatch", "already_claimed", "claim_lost_race"})
        held = cb.claim(
            self.conn,
            "x-15min-engine",
            "bot-b",
            expected_revision=first["revision"],
            lease_seconds=60,
        )
        self.assertFalse(held["ok"])
        self.assertEqual(held["error"], "already_claimed")
        self.assertEqual(held["public"]["owner"], "bot-a")

    def test_silent_failure_escalation_dedupe(self):
        created1 = cb.escalate_silent(self.conn)
        self.assertTrue(any("last_public_at unknown" in a["message"] for a in created1), created1)
        self.assertTrue(any("quantity_done=0" in a["message"] for a in created1), created1)
        created2 = cb.escalate_silent(self.conn)
        self.assertEqual(created2, [], "alerts must dedupe")
        snap = cb.snapshot(self.conn)
        self.assertEqual(snap["note"].find("public snapshot not application permission") >= 0, True)
        task = next(t for t in snap["tasks"] if t["task_id"] == "x-15min-engine")
        self.assertEqual(task["last_public_at"], "unknown")
        self.assertTrue(task["publish_blocked_zero"])
        self.assertNotIn("lease_token", task)


if __name__ == "__main__":
    unittest.main()
