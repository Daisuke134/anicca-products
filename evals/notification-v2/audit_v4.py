"""Audit saved v4 runs without further model calls."""
import json
from pathlib import Path
from collections import Counter
from decimal import Decimal
from run_eval_v3 import conditions
ROOT=Path(__file__).resolve().parent

def audit(slug):
    out=ROOT/"output-v4"/slug
    run=json.loads((out/"run.json").read_text());records=run["records"]
    assert len(records)==32
    for row,(name,ctx) in zip(records,conditions()):assert (row["profile"],row["context"])==(name,ctx)
    raw=[json.loads(line) for line in (out/"raw.jsonl").read_text().splitlines()]
    assert len(raw)==sum(len(r["calls"]) for r in records)
    assert {r["response"]["id"] for r in raw}=={c["response"]["id"] for r in records for c in r["calls"]}
    assert len({r["response"]["id"] for r in raw})==len(raw)
    requests=[json.loads(line) for line in (out/"requests.jsonl").read_text().splitlines()]
    assert len(requests)==len(raw)
    assert {r["occurrence_id"] for r in requests}=={r["occurrence_id"] for r in raw}
    for row in records:
        if "decision" not in row: continue
        generators=[c for c in row["calls"] if c["phase"]=="generator"]
        content=generators[-1]["response"]["choices"][0]["message"]["content"]
        parsed=json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())
        assert parsed["candidates"]==row["decision"]["candidates"]
        judges=[c for c in row["calls"] if c["phase"]=="judge"]
        verdicts=json.loads(judges[-1]["response"]["choices"][0]["message"]["content"])["verdicts"]
        assert all(v["supported"] is True for v in verdicts)
        assert {v["id"] for v in verdicts}=={c["id"] for c in parsed["candidates"] if c["kind"]!="none"}
    sendable=[];all_texts=[];errors=[];none=0
    for row in records:
        if "error" in row:errors.append(dict(index=row["index"],error=row["error"]))
        for c in row.get("decision",{}).get("candidates",[]):
            if c["kind"]=="none":none+=1
            else:sendable.append(dict(case=row["index"]+1,profile=row["profile"],slot=row["context"]["push_state"]["slot"],**c))
        for attempt,call in enumerate([c for c in row["calls"] if c["phase"]=="generator"],1):
            content=call["response"]["choices"][0]["message"].get("content")
            if not content:continue
            try:cs=json.loads(content.strip().removeprefix("```json").removesuffix("```").strip())["candidates"]
            except (ValueError,KeyError):continue
            for c in cs:
                if c["kind"]!="none":all_texts.append(dict(case=row["index"]+1,attempt=attempt,**c))
    summary=dict(model=run["model"],cases=32,accepted=32-len(errors),rejected=len(errors),sendable=len(sendable),none=none,all_generated_texts=len(all_texts),finish_reasons={p:dict(Counter(r["response"]["choices"][0]["finish_reason"] for r in raw if r["phase"]==p)) for p in ["generator","judge"]},errors=errors,sendable_candidates=sendable,all_generated=all_texts)
    (out/"audit.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2))
    print(slug,{k:v for k,v in summary.items() if k not in ["errors","sendable_candidates","all_generated"]})
    return summary

if __name__=="__main__":
    import sys
    audit(sys.argv[1])
