"""Offline replay of every paid attempt; never invokes a model."""
import io, json, tempfile, uuid
from pathlib import Path
from unittest.mock import patch
from run_eval_v8 import m
ROOT=Path(__file__).resolve().parent
out=ROOT/'output-v8/qwen'
analysis=[]
for path in sorted(out.glob('case-*.json')):
    row=json.loads(path.read_text()); attempts=[]; all_filters=[]
    for call in row['calls']:
        if call['phase']!='generator':continue
        item=dict(attempt=len(attempts)+1)
        try:
            content=call['response']['choices'][0]['message']['content']
            cs=json.loads(content.strip().removeprefix('```json').removesuffix('```').strip())['candidates']
            m.validate_candidates(cs)
            # Collect candidate-level rejections even if the survivor question ratio rejects the set.
            for c in cs:
                if c['kind']=='none':continue
                probe=[c,dict(id='auditSafe',kind='question',text='何を選びますか？',grounds=[],presuppositions=[],probability=.1),dict(id='auditNone',kind='none',text='',grounds=[],probability=.1)]
                try:
                    _,rej=m.filter_grounded_candidates(probe,row['context'])
                except ValueError:
                    # Same filter, but ensure the probe's probabilities sum to 1 and question ratio holds.
                    import copy
                    probe=copy.deepcopy(probe);probe[0]['probability']=.2;probe[1]['probability']=.4;probe[2]['probability']=.4
                    _,rej=m.filter_grounded_candidates(probe,row['context'])
                if rej: all_filters.append(dict(attempt=item['attempt'],**rej[0]))
            kept,rejected=m.filter_grounded_candidates(cs,row['context'])
            item.update(kept=kept,rejected=rejected)
        except (ValueError,KeyError,TypeError) as e:item['error']=str(e)
        attempts.append(item)
    responses=iter(row['calls'])
    def replay(req,*a,**k):
        call=next(responses)
        payload=json.loads(req.data)
        assert (payload['model']=='google/gemini-2.5-flash-lite')==(call['phase']=='judge')
        return io.BytesIO(json.dumps(call['response']).encode())
    with tempfile.TemporaryDirectory() as tmp,patch.object(m.urllib.request,'urlopen',replay):
        g=m.ChatLLMGenerator('https://offline.invalid','qwen/qwen4-max',max_tokens=8192)
        j=m.SemanticGroundingJudge('https://offline.invalid','google/gemini-2.5-flash-lite')
        store=m.InterventionStore(Path(tmp)/'replay.db',g,grounding=j,draw=lambda:.1)
        try:
            decision=store.decide('synthetic',str(uuid.uuid4()),row['context'])
            assert 'decision' in row and decision['candidates']==row['decision']['candidates']
            final='ACCEPT'
        except (ValueError,KeyError,TypeError) as e:
            assert 'error' in row and str(e)==row['error']['message']
            final=str(e)
    assert next(responses,None) is None
    analysis.append(dict(case=row['index']+1,attempts=attempts,all_filters=all_filters,final=final))
(ROOT/'retry-analysis-v8.json').write_text(json.dumps(analysis,ensure_ascii=False,indent=2))
print('offline replay verified',len(analysis),'cases')
