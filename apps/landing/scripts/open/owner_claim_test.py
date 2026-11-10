#!/usr/bin/env python3
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import claim_board as board  # noqa: E402
import claim_cycle  # noqa: E402
import measure_task_output as measure  # noqa: E402
import owner_row  # noqa: E402

TODO = (ROOT.parents[3] / 'COMPANY_TODO.md').read_text(encoding='utf-8')
ACTORS = json.loads((ROOT / 'row_actors.json').read_text(encoding='utf-8'))
WORKFLOW = Path(__file__).resolve().parents[4] / '.github/workflows/company-todo-owner.yml'


class OwnerRowTest(unittest.TestCase):
    def test_verification_bot_gets_a_pull_request_for_its_own_row(self):
        result = owner_row.apply_owner_evidence(TODO, ACTORS, 'cursor[bot]', 26, 'new evidence')
        self.assertEqual(result['mode'], 'pull_request')
        self.assertIn('| new evidence |', result['text'])
        self.assertEqual(result['owner'], 'Grok Bot 参謀 (verification only)')
        self.assertIn('| Codex |', result['text'])

    def test_same_bot_cannot_write_codex_row(self):
        with self.assertRaises(SystemExit):
            owner_row.apply_owner_evidence(TODO, ACTORS, 'cursor[bot]', 10, 'stolen')

    def test_muse_dots_and_codex_are_unmapped(self):
        for actor in ('Muse', 'Dots', 'Codex'):
            with self.assertRaises(SystemExit):
                owner_row.apply_owner_evidence(TODO, ACTORS, actor, 26, 'not allowed')

    def test_workflow_is_manual_and_does_not_push_main(self):
        text = WORKFLOW.read_text(encoding='utf-8')
        self.assertIn('workflow_dispatch:', text)
        self.assertNotIn('schedule:', text)
        self.assertNotIn('git push origin main', text)
        self.assertIn('gh pr create --base main', text)


class ClaimCycleTest(unittest.TestCase):
    def test_private_cycle_rejects_stale_owner_and_expires(self):
        with tempfile.TemporaryDirectory() as temp:
            db = Path(temp) / 'claims.sqlite'
            self.assertEqual(claim_cycle.assert_private_db(db), db.resolve())
            with self.assertRaises(SystemExit):
                claim_cycle.assert_private_db(Path(temp) / 'public/open/claims.sqlite')
            conn = board.connect(db)
            board.init_db(conn)
            cycle = claim_cycle.run_cycle(conn, 'cursor[bot]')
            conn.close()
        self.assertTrue(cycle['claim'])
        self.assertTrue(cycle['stale_rejected'])
        self.assertTrue(cycle['release'])
        self.assertEqual(cycle['expired_count'], 1)
        self.assertIsNone(cycle['owner_after_expiry'])
        self.assertEqual(cycle['lease_state_after_expiry'], 'open')
        receipt = claim_cycle.build_receipt('cursor[bot]', 403, {'status': 200}, cycle)
        self.assertTrue(receipt['synthetic_fixture'])
        self.assertFalse(receipt['different_agent_call'])
        self.assertFalse(receipt['hosted_claim_api'])

    def test_a_name_is_not_a_different_agent_call(self):
        named = claim_cycle.build_receipt('some-other-bot', 200, {}, {'claim': True})
        self.assertFalse(named['different_agent_call'])
        self.assertTrue(named['synthetic_fixture'])
        real = claim_cycle.build_receipt('some-other-bot', 200, {}, {'claim': True}, authenticated_request=True)
        self.assertTrue(real['different_agent_call'])
        self.assertFalse(real['synthetic_fixture'])


class MeasureTest(unittest.TestCase):
    def test_baseline_leaves_savings_blank(self):
        usage = {'weekly_usage_percent': 57.5, 'measured_at': '2026-11-06T08:16:00-08:00', 'source': 'CheckSubscriptionUsage'}
        tasks = [
            {'task': 'local claim cycle', 'kind': 'synthetic_fixture', 'output_units': 1, 'started_at': '2026-11-06T17:10:00Z', 'ended_at': '2026-11-06T17:10:01Z', 'usage_before': usage, 'usage_after': None},
            {'task': 'metrics refresh e0bbc46e', 'kind': 'git_commit', 'output_units': 1, 'started_at': '2026-11-06T15:12:00Z', 'ended_at': '2026-11-06T15:12:00Z', 'usage_before': None, 'usage_after': None},
        ]
        self.assertFalse(measure.comparable(tasks[0]))
        self.assertFalse(measure.comparable(tasks[1]))
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'out.csv'
            rows = measure.write_csv(path, tasks)
        self.assertEqual([row['savings'] for row in rows], ['', ''])
        self.assertEqual(rows[0]['usage_before_percent'], 57.5)
        self.assertEqual(rows[1]['usage_after_percent'], '')


if __name__ == '__main__':
    unittest.main()
