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
  self.assertEqual(result['public_company_todo']['declared_updated'],'2026-11-05')
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
