#!/usr/bin/env python3
"""Atomically project the public company TODO into its existing metrics feed."""
import argparse, datetime, json, re
from pathlib import Path

# COMPANY_TODO.md is already a public-only source. Exclude its explicitly
# private lane wholesale; "Token/usage" and policy such as "no credentials"
# are ordinary public work text, not private evidence.
PRIVATE_LANE = re.compile(r'\bR-1\b|お笑い|q-comedy-r1', re.I)


def strip_cell(value):
    return re.sub(r'[*`]', '', value).strip()


def main():
 parser=argparse.ArgumentParser(); parser.add_argument('repository',type=Path); parser.add_argument('--usage-record',type=Path,required=True)
 args=parser.parse_args(); root=args.repository.resolve(); text=(root/'COMPANY_TODO.md').read_text(encoding='utf-8'); rows=[]
 for match in re.finditer(r'^\| (\d{1,2}) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|[ \t]*$',text,re.M):
  number,todo,owner,evidence=match.groups(); number=int(number)
  if not 1<=number<=30 or PRIVATE_LANE.search(match.group(0)): continue
  rows.append(dict(priority=number,owner=strip_cell(owner),action=strip_cell(todo)[:500],quantity_goal=f'Accepted proof in public COMPANY_TODO.md priority {number}',done_criteria='Only evidence-backed DONE; preparation/draft/tests are not outcomes.',last_evidence_public=strip_cell(evidence)[:500],blocker_public=f'Priority {number}: no DONE proof'))
 assert rows and [r['priority'] for r in rows]==[i for i in range(1,max(r['priority'] for r in rows)+1) if i!=15], 'Original 1-based order must not be renumbered'
 usage=json.loads(args.usage_record.read_text(encoding='utf-8')); assert 0<=usage['weekly_usage_percent']<=100
 for field in ['measured_at','timezone','weekly_usage_percent','grok_bot_share_percent','reset_at','plan','source','bots']: assert field in usage,field
 declared=re.search(r'^Updated: ([0-9]{4}-[0-9]{2}-[0-9]{2}) \(([^)]+)\)',text,re.M); assert declared
 source={'repository':'Daisuke134/anicca-products','path':'COMPANY_TODO.md','system_owner':'Grok Bot 参謀','declared_updated':declared.group(1),'timezone':declared.group(2),'rows':len(rows),'source_updated_at':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 path=root/'apps/landing/public/open/metrics.json'; feed=json.loads(path.read_text(encoding='utf-8')); feed.update(public_work=rows,usage_snapshot=usage,public_company_todo=source)
 temporary=path.with_suffix('.tmp'); temporary.write_text(json.dumps(feed,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); temporary.replace(path)
 print(json.dumps({'public_work':len(rows),'source':source}))

if __name__ == "__main__":
 main()
