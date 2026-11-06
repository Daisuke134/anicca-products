import json
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT=Path(__file__).with_name('write_company_todos.py')

def run_writer(source):
 with tempfile.TemporaryDirectory() as temp:
  root=Path(temp); (root/'COMPANY_TODO.md').write_text(source)
  output=root/'apps/landing/public/open'; output.mkdir(parents=True)
  (output/'metrics.json').write_text('{"summary": {"keep": 1}, "kpis": [{"keep": 2}]}')
  (root/'usage.json').write_text(json.dumps(dict(source='CheckSubscriptionUsage',measured_at='2026-11-05T22:28:00-08:00',timezone='America/Los_Angeles',plan='Ultra',weekly_usage_percent=12.7,grok_bot_share_percent=12.5,reset_at='2026-11-12T20:30:00-08:00',bots=[])))
  subprocess.run(['python3',str(SCRIPT),str(root),'--usage-record',str(root/'usage.json')],check=True,capture_output=True,text=True)
  return json.loads((output/'metrics.json').read_text())

class NumberedOwnerTodoWriterTest(unittest.TestCase):
 def test_real_source_preserves_original_one_based_priority_and_single_owner(self):
  result=run_writer((Path(__file__).resolve().parents[4]/'COMPANY_TODO.md').read_text())
  rows=result['public_work']
  self.assertEqual([r['priority'] for r in rows], [i for i in range(1,31) if i!=15])
  self.assertNotIn('R-1', json.dumps(rows,ensure_ascii=False))
  self.assertEqual(result['summary'], {'keep': 1})
  self.assertEqual(result['kpis'], [{'keep': 2}])
  self.assertEqual(result['public_company_todo']['declared_updated'],'2026-11-06')
  by={row['priority']: row['last_evidence_public'] for row in rows}
  self.assertIn('f585e9f599ddff304b20f7f090b238db3f2d5a1da30eaa12f258264134bc03a1', by[11])
  self.assertIn('review_failed', by[11])
  self.assertIn('Honne evidence remains required', by[11])
  self.assertIn('83.78', by[13])
  self.assertIn('total_paid_out_usd=0', by[13])
  self.assertIn('19.564708', by[16])
  self.assertIn('agt_3b7pjzk133jd5tcjjxp54fbr66', by[16])
  self.assertIn('src/cycle.ts', by[16])
  self.assertIn('No optional $0.05 session', by[16])
  self.assertIn('not a verified funded job', by[17])
  self.assertIn('not a verified free-task marketplace', by[17])
  self.assertIn('03:54 PT', by[19])
  self.assertIn('Spotify artist link is not proof', by[19])
  self.assertIn('a642df1374', by[20])
  self.assertIn('11/11 pass', by[20])
  self.assertIn('No live production delivery', by[20])
  self.assertIn('PR891', by[27])
  self.assertIn('44494e2f9ac66e2c55e2f78386f4e7b7f6b46628', by[27])
  self.assertIn('not merged', by[27])
  self.assertNotIn(15, by)
  self.assertIn('GUARDS ACTIVE on Nov 6 09:30-09:33 PT', by[1])
  self.assertIn('45 regular enabled (4 paused)', by[1])
  self.assertIn('finished one-offs outside count', by[1])
  self.assertIn('request_id3adfa6bb-e297-4a52-af5f-89dae4753227', by[1])
  self.assertNotIn('49 enabled', by[1])
  self.assertNotIn('all daily routines are stopped', by[1])
  self.assertEqual(next(r['blocker_public'] for r in rows if r['priority']==1), 'Guard controls active; quantitative saving and measured output not yet proven, not marked DONE')
  self.assertNotEqual(next(r['blocker_public'] for r in rows if r['priority']==1), 'Priority 1: no DONE proof')
  self.assertEqual(next(r['blocker_public'] for r in rows if r['priority']==30), 'Known budget guard; exact saved percentage unavailable, not failure of guard')
  self.assertNotEqual(next(r['blocker_public'] for r in rows if r['priority']==30), 'Priority 30: no DONE proof')
  self.assertIn('GUARDS ACTIVE', by[30])
  self.assertIn('64.7', by[30])
  self.assertIn('saving percentage unmeasured', by[30])
  self.assertIn('never claim30%saved', by[30])
  self.assertNotIn('all daily routines are stopped', by[30])
  self.assertNotIn('30% saving is achieved', by[30])
  self.assertIn('PR 9287', by[9])
  self.assertIn('NOT DEPLOYED', by[9])
  self.assertIn('HTTP 404', by[9])
  self.assertNotIn('five indexed', by[9])
  self.assertIn('SOURCE ON MAIN, LIVE PENDING', by[25])
  self.assertIn('57.5', by[25])
  self.assertIn('16:57:33 GMT', by[25])
  self.assertIn('metrics.json usage_snapshot', by[25])
  self.assertIn('in_progress', by[27])
  self.assertIn('no matched before after basis', by[30])
 def test_replace_evidence_keeps_owner_and_order(self):
  import importlib.util
  spec=importlib.util.spec_from_file_location('write_company_todos', SCRIPT)
  mod=importlib.util.module_from_spec(spec)
  spec.loader.exec_module(mod)
  source='Updated: 2026-11-06 (America/Los_Angeles)\n| 1 | a | Owner A | old |\n| 2 | b | Owner B | keep |\n'
  updated=mod.replace_evidence(source, 1, 'Owner A', 'new evidence')
  self.assertIn('| 1 | a | Owner A | new evidence |', updated)
  self.assertIn('| 2 | b | Owner B | keep |', updated)
  with self.assertRaises(SystemExit):
   mod.replace_evidence(source, 2, 'Owner A', 'stolen')
 def test_repo_usage_path_matches_metrics(self):
  root=Path(__file__).resolve().parents[4]/'apps/landing/public/open'
  usage=json.loads((root/'usage-snapshot.json').read_text())
  metrics=json.loads((root/'metrics.json').read_text())
  todo=json.loads((root/'company-todo.json').read_text())
  self.assertEqual(usage['weekly_usage_percent'], metrics['usage_snapshot']['weekly_usage_percent'])
  self.assertEqual(usage['measured_at'], metrics['usage_snapshot']['measured_at'])
  self.assertEqual(usage['weekly_usage_percent'], todo['usage_snapshot']['weekly_usage_percent'])
  self.assertEqual(usage['measured_at'], todo['usage_snapshot']['measured_at'])
 def test_finance_refresh_cannot_drop_projection_or_rewrite_finance(self):
  source=(Path(__file__).resolve().parents[4]/'COMPANY_TODO.md').read_text()
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp)
   (root/'COMPANY_TODO.md').write_text(source)
   output=root/'apps/landing/public/open'
   output.mkdir(parents=True)
   finance='{\n "grok_ultra": ["keep-finance"],\n "goal": {"current_mrr_usd": 20.0}\n}\n'
   (output/'metrics.json').write_text(finance)
   (root/'usage.json').write_text(json.dumps(dict(source='CheckSubscriptionUsage',measured_at='2026-11-05T23:00:00-08:00',timezone='America/Los_Angeles',plan='Ultra',weekly_usage_percent=21.1,grok_bot_share_percent=21,reset_at='2026-11-12T20:30:00-08:00',bots=[])))
   subprocess.run(['python3',str(SCRIPT),str(root),'--usage-record',str(root/'usage.json')],check=True,capture_output=True,text=True)
   # The finance generator replaces metrics.json and does not emit public_work.
   (output/'metrics.json').write_text(finance)
   subprocess.run(['python3',str(SCRIPT),str(root),'--usage-record',str(root/'usage.json')],check=True,capture_output=True,text=True)
   text=(output/'metrics.json').read_text()
   self.assertIn('"grok_ultra": ["keep-finance"]', text)
   parsed=json.loads(text)
   self.assertEqual(parsed['goal'], {'current_mrr_usd': 20.0})
   self.assertEqual(len(parsed['public_work']), 29)
   self.assertEqual(parsed['usage_snapshot']['weekly_usage_percent'], 21.1)
   sidecar=json.loads((output/'company-todo.json').read_text())
   self.assertEqual([row['priority'] for row in sidecar['public_work']], [i for i in range(1,31) if i!=15])
   self.assertNotIn('public_work', finance)
 def test_numeric_rows_in_order(self):
  source='Updated: 2026-11-05 (America/Los_Angeles)\n'+''.join(f'| {n} | Public action {n} | One owner | Accepted proof {n}: OPEN |\n' for n in [1,2,3])
  rows=run_writer(source)['public_work']
  self.assertEqual([r['priority'] for r in rows],[1,2,3])
  for row in rows:
   self.assertEqual(row['owner'],'One owner')
   self.assertEqual(row['quantity_goal'],f"Accepted proof in public COMPANY_TODO.md priority {row['priority']}")
   self.assertEqual(row['blocker_public'],f"Priority {row['priority']}: no DONE proof")
   self.assertEqual(set(row),{'priority','owner','action','quantity_goal','done_criteria','last_evidence_public','blocker_public'})
if __name__=='__main__': unittest.main()
