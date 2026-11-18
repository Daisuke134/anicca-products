"""Export complete source text for primary reading; no automatic quality labels."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent
out=ROOT/'output-v8/qwen'
audit=json.loads((out/'audit.json').read_text());run=json.loads((out/'run.json').read_text())
parts=[]
for r in run['records']:
    cs=[c for c in r.get('decision',{}).get('candidates',[]) if c['kind']!='none']
    if not cs:continue
    parts.append(f"CASE {r['index']+1} {r['profile']} {r['context']['push_state']['slot']}\nPROFILE: "+json.dumps(r['context']['push_state']['profile'],ensure_ascii=False))
    for c in cs:parts.append(json.dumps(c,ensure_ascii=False))
(out/'primary-reading.txt').write_text('\n'.join(parts))
filters=[]
for r in json.loads((ROOT/'retry-analysis-v8.json').read_text()):
    for f in r['all_filters']:filters.append(dict(case=r['case'],**f))
(out/'filter-reading.json').write_text(json.dumps(filters,ensure_ascii=False,indent=2))
print('sendable',len(audit['sendable_candidates']),'filter occurrences',len(filters))
