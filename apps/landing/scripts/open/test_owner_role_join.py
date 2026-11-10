#!/usr/bin/env python3
"""Roster joins are by owner name. Index -1 must not rewrite the last row."""
import unittest
from datetime import datetime
from pathlib import Path

import build_team_owners as owners


class OwnerRoleJoinTest(unittest.TestCase):
    def test_missing_role_does_not_use_negative_index(self):
        built = owners.build_owners(Path("/workspace/does-not-exist"), datetime.now(owners.JST))
        self.assertEqual(len(built), 16)
        self.assertEqual(built[-1]["owner"], "Reason Dots")
        self.assertEqual([row["owner"] for row in built].count("X Operator"), 1)
        # list.index would return -1 for Nobody and overwrite Reason Dots.
        joined = owners.join_roles(built, [{"owner": "Nobody", "note": "negative index"}])
        self.assertEqual(len(joined), 16)
        self.assertEqual(joined[-1]["owner"], "Reason Dots")
        self.assertIsNot(joined[-1]["owner"], "Nobody")
        names = [row["owner"] for row in joined]
        self.assertEqual(names.count("X Operator"), 1)
        sanbo = next(row for row in joined if row["owner"] == "参謀")
        self.assertNotEqual(sanbo["owner"], "X Operator")
        for row in joined:
            self.assertEqual(row["current_task"], {"text": "unknown", "kind": "unknown"})
            self.assertEqual(row["cadence"]["kind"], "schedule")

    def test_positional_minus_one_is_the_bug_this_join_refuses(self):
        names = ["参謀", "X Operator", "Reason Dots"]
        rows = [{"owner": name} for name in names]
        missing = "Nobody"
        try:
            index = names.index(missing)
        except ValueError:
            index = -1
        self.assertEqual(index, -1)
        self.assertEqual(rows[index]["owner"], "Reason Dots")
        safe = owners.join_roles(
            [{"owner": name, "current_task": {"text": "unknown", "kind": "unknown"}, "cadence": {"text": "schedule", "kind": "schedule"}} for name in ["参謀", "Anicca Marketer", "Fucker", "dr eggbot", "Forensic Writing", "Muse Relay", "Muse（中継 bot）", "Codex（中継 bot）", "Dots（中継 bot）", "Pause", "Applications", "Reporter", "X Operator", "Codex CLI (Mac mini)", "Muse VM", "Reason Dots"]],
            [{"owner": "Nobody"}],
        )
        self.assertEqual(safe[-1]["owner"], "Reason Dots")


if __name__ == "__main__":
    unittest.main()
