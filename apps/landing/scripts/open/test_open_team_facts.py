#!/usr/bin/env python3
"""Fail-closed tests for public /open/team current_status."""
import json
import tempfile
import unittest
from pathlib import Path

import open_team_facts as TF


class OpenTeamFactsTest(unittest.TestCase):
    def test_complete_roster_no_right_now(self):
        data = TF.build_team_facts()
        self.assertNotIn("right_now", data)
        self.assertEqual([r["agent"] for r in data["current_status"]], TF.ROSTER)
        self.assertEqual(len(data["current_status"]), 15)

    def test_schedule_is_not_proof_of_run(self):
        data = TF.build_team_facts()
        for loop in data["loops"]:
            self.assertIs(loop["proof_of_run"], False)
        naive = next(L for L in data["loops"] if "Naive product routine" in L["loop"])
        self.assertIn("14:00", naive["schedule"])
        self.assertFalse(naive["proof_of_run"])
        # Codex #10 merge proof is observed source work, not an App Store release.
        codex = next(r for r in data["current_status"] if r["agent"] == "Codex")
        self.assertEqual(codex["status"], "observed")
        self.assertIn("9282", codex["outcome"])
        self.assertIn("1.9.6", codex["outcome"])
        self.assertIn("Not a live release success", codex["outcome"])

    def test_stale_does_not_imply_active(self):
        data = TF.build_team_facts()
        for r in data["current_status"]:
            blob = json.dumps(r, ensure_ascii=False).lower()
            self.assertNotIn("currently working", blob)
            self.assertNotIn("right now active", blob)
            if r["status"] == "stale":
                self.assertTrue(r.get("last_event_at"))
            if r["status"] == "observed":
                self.assertTrue(r.get("last_event_at"))

    def test_fail_closed_on_right_now_and_private(self):
        data = TF.build_team_facts()
        bad = dict(data)
        bad["right_now"] = [{"agent": "X", "task": "old"}]
        with self.assertRaises(SystemExit):
            TF.validate_public_team(bad)
        bad2 = dict(data)
        bad2["current_status"] = list(data["current_status"])
        row = dict(bad2["current_status"][0])
        row["outcome"] = "see /workspace/team/secret"
        bad2["current_status"] = [row] + bad2["current_status"][1:]
        with self.assertRaises(SystemExit):
            TF.validate_public_team(bad2)

    def test_write_team_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = TF.write_team_json(tmp)
            path = Path(tmp) / "team" / "team.json"
            self.assertTrue(path.exists())
            loaded = json.loads(path.read_text())
            self.assertEqual(loaded["schema"], "current_status")
            self.assertNotIn("right_now", loaded)
            self.assertEqual(out["built_at"], loaded["built_at"])

    def test_preserves_verified_owner_facts(self):
        data = TF.build_team_facts()
        by = {r["agent"]: r for r in data["current_status"]}
        self.assertIn("1.9.6", by["Anicca Marketer"]["outcome"])
        self.assertIn("Review Failed", by["Fucker"]["outcome"])
        self.assertIn("CrowdWorks", by["Fucker"]["outcome"])  # access blocker remains; not a revenue claim
        self.assertNotIn("missing demo source", by["dr eggbot"]["outcome"])
        self.assertIn("src/cycle.ts", by["dr eggbot"]["outcome"])
        self.assertIn("19.564708", by["dr eggbot"]["outcome"])
        self.assertIn("a642df1374", by["Codex"]["outcome"])
        self.assertIn("9283", by["Codex"]["outcome"])
        self.assertIn("No live production", by["Codex"]["outcome"])
        self.assertIn("DRAFT_READY", by["Muse Relay"]["outcome"])
        self.assertIn("paid rows 0", by["Reporter"]["outcome"])
        self.assertIn("83.78", by["Reporter"]["outcome"])
        self.assertIn("not revenue", by["Reporter"]["outcome"])
        self.assertIn("affiliate comparison", by["Citation Scout"]["outcome"])
        self.assertIn("not a direct verified publish", by["Muse"]["outcome"])
        self.assertEqual(by["X Operator"]["last_event_at"], "2026-11-06 20:17 JST")
        self.assertIn("80imp/2like/1reply", by["X Operator"]["outcome"])
        self.assertIn("HTTP 403", by["X Operator"]["outcome"])
        self.assertIn("publication 0", by["X Operator"]["outcome"])
        self.assertNotEqual(by["X Operator"]["agent"], by["参謀"]["agent"])
        self.assertIn("review_failed", by["Fucker"]["proof"])
        self.assertIn("no hosted", by["Fucker"]["outcome"])

    def test_existing_owners_board_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as tmp:
            board = {
                "owners": [{"owner": name, "current_task": {"text": "unknown", "kind": "unknown"}, "cadence": {"kind": "schedule", "text": "schedule"}} for name in [
                    "参謀", "Anicca Marketer", "Fucker", "dr eggbot", "Forensic Writing", "Muse Relay",
                    "Muse（中継 bot）", "Codex（中継 bot）", "Dots（中継 bot）", "Pause", "Applications", "Reporter", "X Operator",
                    "Codex CLI (Mac mini)", "Muse VM", "Reason Dots",
                ]],
                "loops": [{"loop": f"loop-{i}"} for i in range(92)],
            }
            dest_dir = Path(tmp) / "team"
            dest_dir.mkdir()
            dest = dest_dir / "team.json"
            dest.write_text(json.dumps(board), encoding="utf-8")
            before = dest.read_text(encoding="utf-8")
            loaded = TF.write_team_json(tmp)
            self.assertEqual(dest.read_text(encoding="utf-8"), before)
            self.assertEqual(len(loaded["owners"]), 16)
            self.assertEqual(len(loaded["loops"]), 92)
            self.assertEqual(loaded["owners"][-1]["owner"], "Reason Dots")
            self.assertIn("X Operator", [row["owner"] for row in loaded["owners"]])


if __name__ == "__main__":
    unittest.main()
