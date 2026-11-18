"""Read-only funding and model snapshots; never purchases or reloads."""
import json
from pathlib import Path
import sys
import urllib.request
ROOT=Path(__file__).resolve().parent
entries=json.loads((Path.home()/'.local/share/anicca/credentials.json').read_text())['credentials']
def get(path,service):
    key=next(e['api_key'] for e in entries if e.get('service')==service)
    with urllib.request.urlopen(urllib.request.Request('https://openrouter.ai/api/v1/'+path,headers={'Authorization':'Bearer '+key}),timeout=30) as r:return r.read()
label=sys.argv[1]
for path,name,service in [('key','key-'+('before' if label=='before' else 'settled'),'openrouter-notification-eval-v2'),('credits','credits-'+label,'openrouter-capafy-management')]:
    raw=get(path,service);(ROOT/(name+'-v8.json')).write_bytes(raw)
    print(name,{k:v for k,v in json.loads(raw)['data'].items() if k in {'limit','usage','limit_remaining','total_credits','total_usage'}})
if label=='before':
    raw=get('models','openrouter-notification-eval-v2');(ROOT/'models-v8.json').write_bytes(raw)
    ids={e.get('canonical_slug', e['id']) for e in json.loads(raw)['data']}
    assert 'qwen/qwen4-max-20261115' in ids and 'google/gemini-2.5-flash-lite' in ids
    (ROOT/'funding-v8.json').write_text(json.dumps(dict(service='openrouter-notification-eval-v2',limit_changed=False,purchase_or_reload_calls=0,auto_top_up_source='funding-v7.json inherited OFF record; current settings UI unverified'),indent=2))
