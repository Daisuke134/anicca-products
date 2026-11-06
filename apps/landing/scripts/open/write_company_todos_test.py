import json
import re
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name('write_company_todos.py')
REAL_SOURCE = SCRIPT.parents[4] / 'COMPANY_TODO.md'
PUBLIC_FIELDS = {'priority', 'owner', 'action', 'quantity_goal', 'done_criteria', 'last_evidence_public', 'blocker_public'}


def run_writer(root, source_text):
    output = root / 'apps/landing/public/open'
    output.mkdir(parents=True, exist_ok=True)
    (root / 'COMPANY_TODO.md').write_text(source_text)
    (root / 'usage.json').write_text(json.dumps(dict(
        source='CheckSubscriptionUsage', measured_at='2026-11-05T22:28:00-08:00',
        timezone='America/Los_Angeles', plan='Ultra', weekly_usage_percent=12.7,
        grok_bot_share_percent=12.5, reset_at='2026-11-12T20:30:00-08:00', bots=[],
    )))
    (output / 'metrics.json').write_text('{"summary":{"platforms":[]},"kpis":[]}')
    subprocess.run(['python3', str(SCRIPT), str(root), '--usage-record', str(root / 'usage.json')], check=True)
    return json.loads((output / 'metrics.json').read_text())


class WriterTest(unittest.TestCase):
    def test_real_rows_keep_public_usage_and_policy_language(self):
        with tempfile.TemporaryDirectory() as d:
            result = run_writer(Path(d), REAL_SOURCE.read_text())
        self.assertEqual(len(result['public_work']), 17)
        row = next(row for row in result['public_work'] if row['action'].startswith('Token/usage overhead cut'))
        self.assertEqual(row['priority'], 1)
        self.assertEqual(row['action'], 'Token/usage overhead cut without killing W1–W8 outcome cadence')
        self.assertEqual(row['owner'], 'Grok Bot 参謀')
        self.assertFalse(any('Internal id' in row['action'] for row in result['public_work']))
        serialized = json.dumps(result['public_work'], ensure_ascii=False)
        for private_text in ('q-comedy-r1', 'Eligible recruit identified', 'private store'):
            self.assertNotIn(private_text, serialized)

    def test_private_lanes_excluded_across_every_field(self):
        source = (
            'Updated: 2026-11-05 (America/Los_Angeles). Owner self-rows: **Grok Bot 参謀**.\n'
            '| W1 | owner | P1 public work | public proof | **OPEN** |\n'
            '| W2 | owner | R-1 private action | private proof | **OPEN** |\n'
            '| W3 | q-comedy-r1 | P1 public work | public proof | **OPEN** |\n'
        )
        with tempfile.TemporaryDirectory() as d:
            result = run_writer(Path(d), source)
            rows = result['public_work']
        self.assertEqual([row['action'] for row in rows], ['P1 public work'])
        self.assertEqual(result['public_company_todo']['rows'], 1)
        for private_text in ('R-1', 'q-comedy-r1', 'private proof'):
            self.assertNotIn(private_text, json.dumps(rows))

    def test_public_todo_provenance_does_not_rewrite_rows(self):
        with tempfile.TemporaryDirectory() as d:
            result = run_writer(Path(d), REAL_SOURCE.read_text())
        source = result['public_company_todo']
        self.assertEqual(source['repository'], 'Daisuke134/anicca-products')
        self.assertEqual(source['path'], 'COMPANY_TODO.md')
        self.assertEqual(source['declared_updated'], re.search(r'^Updated: ([0-9-]+)', REAL_SOURCE.read_text(), re.M).group(1))
        self.assertEqual(source['timezone'], 'America/Los_Angeles')
        self.assertEqual(source['rows'], len(result['public_work']))
        for row in result['public_work']:
            self.assertEqual(set(row), PUBLIC_FIELDS)
            self.assertLessEqual(len(row['action']), 500)
            self.assertEqual(row['quantity_goal'], 'Accepted proof in public company TODO ' + row['quantity_goal'].rsplit(' ', 1)[1])
            work_id = row['quantity_goal'].rsplit(' ', 1)[1]
            self.assertTrue(row['blocker_public'].startswith(work_id))


if __name__ == '__main__':
    unittest.main()
