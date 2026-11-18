"""Synthetic-only eval. Never imports HTTP/APNs delivery; no production settings."""
import concurrent.futures
import contextvars
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

ROOT = Path(__file__).resolve().parent
MODEL = "deepseek/deepseek-v4.1-flash-1017"
spec = importlib.util.spec_from_file_location("interventions", ROOT / "reference/interventions.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


def credentials():
    data = json.loads((Path.home()/".local/share/anicca/credentials.json").read_text())
    return next(e["api_key"] for e in data["credentials"] if e.get("service") == "openrouter-notification-eval-v2")


def conditions():
    report = (Path.home()/"anicca-ops/files/notification-word-eval-2026-11-18.md").read_text()
    rows = report.split("## 2. プロフィール",1)[1].split("## 3.",1)[0]
    profiles = []
    for line in rows.splitlines():
        if not line.startswith("| ") or "（" not in line: continue
        cells = [x.strip() for x in line.strip("|").split("|")]
        if cells[2] not in m.VOCABULARY["desired_state"]: continue
        profiles.append((cells[0].split("（")[0], cells[1], cells[2]))
    assert len(profiles) == 8
    return [(name, dict(time_band=band,language="ja",desired_state=state,source="notification",
                push_state=dict(profile=dict(profile_summary=summary),recent_reactions=[],local_day="2026-11-18",slot=slot)))
            for name, summary, state in profiles
            for band, slot in [("morning","07:30"),("day","12:30"),("evening","18:30"),("night","22:30")]]


def run():
    key = credentials()
    out = ROOT/"output"
    out.mkdir(exist_ok=True)
    # Never overwrite a paid run or silently regenerate already sampled conditions.
    path = out/"run.json"
    if path.exists() or (out/"raw.jsonl").exists(): raise RuntimeError("Run already exists")
    lock = threading.Lock()
    current = contextvars.ContextVar("call")
    original = urllib.request.urlopen
    def transport(request, *args, **kwargs):
        with original(request, *args, **kwargs) as response:
            raw = response.read()
        payload = json.loads(raw)
        record = current.get()
        record["attempts"].append(payload)
        with lock:
            with (out/"raw.jsonl").open("a") as f:
                f.write(json.dumps(dict(profile=record["profile"],time_band=record["context"]["time_band"],response=payload),ensure_ascii=False)+"\n")
        return io.BytesIO(raw)
    def one(index, name, context):
        record = dict(index=index, profile=name,context=context,attempts=[])
        current.set(record)
        with tempfile.TemporaryDirectory() as tmp:
            store = m.InterventionStore(str(Path(tmp)/"case.db"), m.ChatLLMGenerator("https://openrouter.ai/api/v1",MODEL,key,timeout=120,max_tokens=4096),draw=lambda:.1)
            try:
                record["decision"] = store.decide_push("synthetic-"+name,str(uuid.uuid4()),{k:v for k,v in context.items() if k!="push_state"},context["push_state"])
            except Exception as e:
                record["error"] = dict(type=type(e).__name__,code=getattr(e,"code",None),message=str(e) if isinstance(e,(ValueError,KeyError,TypeError)) else "transport failure")
        with lock:
            (out/f"case-{index:02d}.json").write_text(json.dumps(record,ensure_ascii=False,indent=2))
        print(f'{index+1}/32 {name}/{context["time_band"]} attempts={len(record["attempts"])} status={"ERROR" if "error" in record else "PASS"}',flush=True)
        return record
    urllib.request.urlopen = transport
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(one,i,name,ctx) for i,(name,ctx) in enumerate(conditions())]
            records = [future.result() for future in futures]
    finally:
        urllib.request.urlopen = original
    path.write_text(json.dumps(dict(model=MODEL,max_tokens=4096,records=records),ensure_ascii=False,indent=2))
    print("Generation finished; fetch generation receipts with collect_cost().",flush=True)


def collect_cost():
    key=credentials(); out=ROOT/"output"
    run=json.loads((out/"run.json").read_text(),parse_float=Decimal)
    receipts=[]; errors=[]; total=Decimal(0)
    for record in run["records"]:
        for response in record["attempts"]:
            req=urllib.request.Request("https://openrouter.ai/api/v1/generation?id="+response["id"],headers={"Authorization":"Bearer "+key})
            try:
                with urllib.request.urlopen(req,timeout=30) as r:
                    receipt=json.loads(r.read(),parse_float=Decimal)
                cost = receipt["data"]["total_cost"]
                receipts.append(receipt)
            except urllib.error.HTTPError as e:
                if e.code != 404: raise
                errors.append(dict(id=response["id"],status=e.code))
                cost = response["usage"]["cost"]
            total += cost
    (out/"cost.json").write_text(json.dumps(dict(total_cost_usd=str(total),receipt_count=len(receipts),generation_lookup_errors=errors,cost_source="generation total_cost; completion usage.cost only for 404 lookup",receipts=receipts),ensure_ascii=False,indent=2,default=str))
    print("Generation receipt/fallback total USD:", total, "receipts:", len(receipts), "lookup errors:", len(errors))


if __name__ == "__main__":
    import sys
    collect_cost() if "--cost" in sys.argv else run()
