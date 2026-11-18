"""Classify every saved judge response through the frozen validator, no model calls."""
import io,json
from collections import Counter
from pathlib import Path
from unittest.mock import patch
from run_eval_v8 import m
ROOT=Path(__file__).resolve().parent
out=ROOT/'output-v8/qwen'
rows=[]
for path in sorted(out.glob('case-*.json')):
    case=json.loads(path.read_text());cs=None;attempt=0
    for call in case['calls']:
        if call['phase']=='generator':
            attempt+=1
            content=call['response']['choices'][0]['message']['content']
            try:
                cs=json.loads(content.strip().removeprefix('```json').removesuffix('```').strip())['candidates']
                m.validate_candidates(cs);cs,_=m.filter_grounded_candidates(cs,case['context'])
            except (ValueError,KeyError,TypeError):cs=None
        else:
            assert cs is not None
            def replay(*a,**k):return io.BytesIO(json.dumps(call['response']).encode())
            with patch.object(m.urllib.request,'urlopen',replay):
                try:
                    m.SemanticGroundingJudge('https://offline.invalid','google/gemini-2.5-flash-lite')(cs,case['context'])
                    result='accepted';error=None
                except (ValueError,KeyError,TypeError) as e:
                    error=str(e);result='semantic_rejection' if error.startswith('ungrounded semantic claims:') else 'json_schema_rejection'
            rows.append(dict(case=case['index']+1,attempt=attempt,result=result,error=error))
summary=dict(counts=dict(Counter(r['result'] for r in rows)),rows=rows)
(out/'judge-analysis.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(summary['counts'])
