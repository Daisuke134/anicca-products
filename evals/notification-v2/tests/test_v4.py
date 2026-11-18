import importlib.util
import io
import json
from pathlib import Path
import pytest

spec=importlib.util.spec_from_file_location("v4",Path(__file__).parents[1]/"reference/interventions_v4.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CTX=dict(time_band="day",language="ja",desired_state="calm",source="notification",push_state=dict(profile=dict(profile_summary="仕事の不安がある。"),recent_reactions=[],local_day="2026-11-18",slot="12:30"))
CS=[dict(id="a",kind="question",text="調子を整えるきっかけを一つ選ぶなら、何にしますか？",probability=.8),dict(id="n",kind="none",text="",probability=.2)]
ID="12345678-1234-1234-1234-123456789012"

def test_null_retries_through_store(tmp_path,monkeypatch):
    calls=[]
    def response(req,**kw):
        calls.append(json.loads(req.data))
        text=None if len(calls)==1 else json.dumps(dict(candidates=CS))
        return io.BytesIO(json.dumps(dict(choices=[dict(message=dict(content=text))])).encode())
    monkeypatch.setattr(m.urllib.request,"urlopen",response)
    g=m.ChatLLMGenerator("https://example.invalid","test",max_tokens=8192)
    store=m.InterventionStore(tmp_path/"x.db",g,draw=lambda:.1)
    result=store.decide("x",ID,{k:v for k,v in CTX.items() if k!="push_state"})
    assert result["send"] and len(calls)==2
    assert calls[0]["reasoning"]=={"enabled":False}

def test_generic_words_are_not_lexically_rejected():
    m.validate_grounding(CS[0]["text"],CTX)

def test_semantic_rejection_retries_and_does_not_persist(tmp_path):
    calls=[]
    def reject(candidates,context):
        calls.append(1);raise ValueError("ungrounded body state")
    store=m.InterventionStore(tmp_path/"x.db",lambda ctx:CS,grounding=reject)
    with pytest.raises(ValueError,match="ungrounded"):store.decide("x",ID,CTX)
    assert len(calls)==2
    with store.connect() as db:assert db.execute("select count(*) from cases").fetchone()[0]==0

def test_missing_semantic_judge_fails_closed(tmp_path):
    store=m.InterventionStore(tmp_path/"x.db",lambda ctx:CS)
    with pytest.raises(ValueError,match="semantic judge required"):store.decide("x",ID,CTX)

@pytest.mark.parametrize("verdicts",[[dict(id="a",supported=True,reason="generic")],[],[dict(id="a",supported="yes",reason="invalid")],[dict(id="a",supported=False,reason="invented symptom")]])
def test_judge_response_validation(monkeypatch,verdicts):
    monkeypatch.setattr(m.urllib.request,"urlopen",lambda *a,**k:io.BytesIO(json.dumps(dict(choices=[dict(message=dict(content=json.dumps(dict(verdicts=verdicts))))])).encode()))
    judge=m.SemanticGroundingJudge("https://example.invalid","test")
    if verdicts and verdicts[0]["supported"] is True:judge(CS,CTX)
    else:
        with pytest.raises(ValueError):judge(CS,CTX)


def test_saved_cases_resume_without_paid_calls(tmp_path,monkeypatch):
    import sys
    sys.path.insert(0,str(Path(__file__).parents[1]))
    import run_eval_v4 as runner
    monkeypatch.setattr(runner,'ROOT',tmp_path)
    monkeypatch.setattr(runner,'readback',lambda *a:dict(limit_remaining=.5))
    rows=[('synthetic',CTX)]
    monkeypatch.setattr(runner,'conditions',lambda:rows)
    out=tmp_path/'output-v4'/'test';out.mkdir(parents=True)
    saved=dict(index=0,profile='synthetic',context=CTX,calls=[],error=dict(type='saved'))
    (out/'case-00.json').write_text(json.dumps(saved))
    monkeypatch.setattr(runner.urllib.request,'urlopen',lambda *a,**k:pytest.fail('paid replay'))
    runner.run('test-model','test')
    assert json.loads((out/'run.json').read_text())['records']==[saved]

def test_cost_404_retains_exact_completion_cost(tmp_path,monkeypatch):
    import run_eval_v4 as runner
    import urllib.error
    monkeypatch.setattr(runner,'ROOT',tmp_path)
    monkeypatch.setattr(runner,'readback',lambda *a:dict(limit_remaining=.5))
    monkeypatch.setattr(runner,'credentials',lambda:'test')
    out=tmp_path/'output-v4'/'test';out.mkdir(parents=True)
    row=dict(phase='generator',response=dict(id='gen-test',usage=dict(cost=.00123),choices=[dict(finish_reason='stop')]))
    (out/'raw.jsonl').write_text(json.dumps(row)+'\n')
    def missing(*a,**k):raise urllib.error.HTTPError('https://example.invalid',404,'Not found',{},None)
    monkeypatch.setattr(runner.urllib.request,'urlopen',missing)
    runner.cost('test')
    assert json.loads((out/'cost.json').read_text())['total_cost_usd']=='0.00123'
