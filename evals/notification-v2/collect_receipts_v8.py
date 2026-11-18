"""Read-only receipt collection with persisted progress after the original HTTP408."""
import concurrent.futures
from collections import Counter
from decimal import Decimal
import json
from pathlib import Path
import urllib.request
from run_eval_v8 import credentials, readback
ROOT=Path(__file__).resolve().parent
out=ROOT/'output-v8/qwen'
cache=out/'receipts';cache.mkdir(exist_ok=True)
rows=[json.loads(x,parse_float=Decimal) for x in (out/'raw.jsonl').read_text().splitlines()]
assert len({r['response']['id'] for r in rows})==len(rows)

def one(row):
    ident=row['response']['id'];path=cache/(ident+'.json')
    if path.exists(): raw=path.read_bytes()
    else:
        req=urllib.request.Request('https://openrouter.ai/api/v1/generation?id='+ident,headers={'Authorization':'Bearer '+credentials()})
        try:
            with urllib.request.urlopen(req,timeout=30) as r:raw=r.read()
        except Exception as e:
            with (out/'receipt-errors.jsonl').open('a') as f:f.write(json.dumps(dict(id=ident,error_class=type(e).__name__,status=getattr(e,'code',None),effect='read_only',next_action='retry missing receipt GET only'))+'\n')
            raise
        data=json.loads(raw);assert data['data']['id']==ident
        path.write_bytes(raw)
    data=json.loads(raw,parse_float=Decimal);assert data['data']['id']==ident
    return dict(phase=row['phase'],receipt=data)

if __name__=='__main__':
    receipts=[];errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(one,row):row['response']['id'] for row in rows}
        for future in concurrent.futures.as_completed(futures):
            try:receipts.append(future.result())
            except Exception as e:errors.append(dict(id=futures[future],error_class=type(e).__name__,status=getattr(e,'code',None)))
    diagnosis=dict(required=len(rows),cached=len(receipts),missing=errors,effect='read_only',next_action='GET missing receipts only' if errors else 'all official receipts present')
    (out/'receipt-diagnosis.json').write_text(json.dumps(diagnosis,indent=2))
    if errors:raise RuntimeError(f'{len(errors)} missing official receipts; progress persisted')
    total=sum((r['receipt']['data']['total_cost'] for r in receipts),Decimal(0))
    usage=sum((r['response']['usage']['cost'] for r in rows),Decimal(0))
    finish={p:dict(Counter(r['response']['choices'][0]['finish_reason'] for r in rows if r['phase']==p)) for p in ['generator','judge']}
    result=dict(total_cost_usd=str(total),completion_cost_usd=str(usage),receipt_count=len(receipts),fallbacks=[],finish_reasons=finish,receipts=receipts)
    (out/'cost.json').write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str))
    readback(out,'final')
    print('official receipts',len(receipts),'USD',total)
