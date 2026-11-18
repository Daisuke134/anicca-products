"""Synthetic eval only; append-only paid-call ledger and resumable completed cases."""
import concurrent.futures
import contextvars
from collections import Counter
from decimal import Decimal
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import threading
import urllib.request
import urllib.error
import uuid
import sys
from run_eval_v3 import conditions, credentials

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("v4",ROOT/"reference/interventions_v4.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
JUDGE="google/gemini-2.5-flash-lite"

def readback(out,label):
    req=urllib.request.Request("https://openrouter.ai/api/v1/key",headers={"Authorization":"Bearer "+credentials()})
    with urllib.request.urlopen(req,timeout=30) as r: data=json.load(r)
    (out/f"key-{label}.json").write_text(json.dumps(data,indent=2))
    return data["data"]

def run(model,slug):
    out=ROOT/"output-v4"/slug;out.mkdir(parents=True,exist_ok=True)
    remaining=readback(out,"resume" if (out/"raw.jsonl").exists() else "before")["limit_remaining"]
    if remaining < .10: raise RuntimeError("Insufficient evaluation-key headroom; no balance reload")
    current=contextvars.ContextVar("case");lock=threading.Lock();original=urllib.request.urlopen
    def transport(req,*args,**kwargs):
        payload=json.loads(req.data);case=current.get()
        phase="judge" if payload["model"]==JUDGE else "generator"
        tag=dict(index=case["index"],profile=case["profile"],phase=phase,occurrence_id=str(uuid.uuid4()))
        with lock:
            with (out/"requests.jsonl").open("a") as f:f.write(json.dumps(dict(tag,request=payload),ensure_ascii=False)+"\n")
        try:
            with original(req,*args,**kwargs) as r:raw=r.read()
        except Exception as e:
            with lock:
                with (out/"errors.jsonl").open("a") as f:f.write(json.dumps(dict(tag,error_class=type(e).__name__,status=getattr(e,"code",None),body=e.read().decode() if isinstance(e,urllib.error.HTTPError) else None,effect="rejected" if getattr(e,"code",None)==400 else "unknown",next_action="inspect provider error and key usage before retry"))+"\n")
            raise
        response=json.loads(raw)
        with lock:
            with (out/"raw.jsonl").open("a") as f:f.write(json.dumps(dict(tag,response=response),ensure_ascii=False)+"\n")
        case["calls"].append(dict(phase=phase,response=response))
        return io.BytesIO(raw)
    touched=set()
    for filename in ["requests.jsonl","raw.jsonl"]:
        if (out/filename).exists():
            touched.update(json.loads(line)["index"] for line in (out/filename).read_text().splitlines())
    def one(i,name,ctx):
        path=out/f"case-{i:02d}.json"
        if path.exists():return json.loads(path.read_text())
        if i in touched:raise RuntimeError(f"Incomplete paid case {i}; reconcile ledger, never replay automatically")
        case=dict(index=i,profile=name,context=ctx,calls=[]);current.set(case)
        with tempfile.TemporaryDirectory() as tmp:
            g=m.ChatLLMGenerator("https://openrouter.ai/api/v1",model,credentials(),timeout=150,max_tokens=8192,reasoning=None if model=="z-ai/glm-5.3" else False)
            j=m.SemanticGroundingJudge("https://openrouter.ai/api/v1",JUDGE,credentials())
            store=m.InterventionStore(Path(tmp)/"synthetic.db",g,grounding=j,draw=lambda:.1)
            try:
                case["decision"]=store.decide_push("synthetic-"+name,str(uuid.uuid4()),{k:v for k,v in ctx.items() if k!="push_state"},ctx["push_state"])
            except Exception as e:
                case["error"]=dict(type=type(e).__name__,code=getattr(e,"code",None),message=str(e) if isinstance(e,(ValueError,KeyError,TypeError)) else "transport failure; inspect ledger")
        temp=path.with_suffix(".tmp");temp.write_text(json.dumps(case,ensure_ascii=False,indent=2));temp.replace(path)
        print(f"{slug} {i+1}/32 {name}/{ctx["time_band"]} calls={len(case["calls"])} {"REJECT" if "error" in case else "ACCEPT"}",flush=True)
        return case
    urllib.request.urlopen=transport
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            futures=[pool.submit(one,i,name,ctx) for i,(name,ctx) in enumerate(conditions())]
            records=[f.result() for f in futures]
    finally:urllib.request.urlopen=original
    (out/"run.json").write_text(json.dumps(dict(model=model,judge=JUDGE,max_tokens=8192,reasoning=None if model=="z-ai/glm-5.3" else dict(enabled=False),records=records),ensure_ascii=False,indent=2))
    readback(out,"after")

def cost(slug):
    out=ROOT/"output-v4"/slug
    rows=[json.loads(x,parse_float=Decimal) for x in (out/"raw.jsonl").read_text().splitlines()]
    assert len({r["response"]["id"] for r in rows})==len(rows)
    receipts=[];fallbacks=[];total=Decimal(0);usage=Decimal(0);finish={}
    for row in rows:
        response=row["response"];usage+=response["usage"]["cost"]
        phase=row["phase"];finish.setdefault(phase,Counter()).update([response["choices"][0]["finish_reason"]])
        req=urllib.request.Request("https://openrouter.ai/api/v1/generation?id="+response["id"],headers={"Authorization":"Bearer "+credentials()})
        try:
            with urllib.request.urlopen(req,timeout=30) as r: receipt=json.load(r,parse_float=Decimal)
            receipts.append(dict(phase=phase,receipt=receipt));total+=receipt["data"]["total_cost"]
        except urllib.error.HTTPError as e:
            if e.code!=404:raise
            fallbacks.append(dict(id=response["id"],status=404,cost=response["usage"]["cost"]));total+=response["usage"]["cost"]
    result=dict(total_cost_usd=str(total),completion_cost_usd=str(usage),receipt_count=len(receipts),fallbacks=fallbacks,finish_reasons=finish,receipts=receipts)
    (out/"cost.json").write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str))
    readback(out,"final")
    print(slug, "USD",total,"finish",finish,"receipts",len(receipts),"fallbacks",len(fallbacks))

if __name__=="__main__":
    if sys.argv[1]=="cost":cost(sys.argv[2])
    else:run(sys.argv[1],sys.argv[2])
