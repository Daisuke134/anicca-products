"""Offline audit: deterministic validation plus explicitly recorded full-read judgments."""
import importlib.util
import json
from pathlib import Path
from collections import Counter
from decimal import Decimal

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("generator", ROOT / "reference/interventions.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
# Full-read decisions, keyed by 1-based case / attempt / candidate, not keyword graders.
REVIEWED = {(8,1):6, (15,1):5, (17,1):6, (22,1):6, (22,2):6, (25,1):6, (32,1):5}
FAILURES = {
    (8, 1, "a"): (["fabrication"], "今日、他人と比較せずに済んだ瞬間があったという未提供の出来事を前提にする。"),
    (22, 1, "a"): (["japanese"], "『どれがいちばん手をつけたいこと』は主語・目的語の接続が不自然。『どれに手をつけたい』などが必要。"),
    (22, 1, "d"): (["japanese"], "『減やせる』は活用の誤り。『チャンスのかけら』も不自然な組合せ。"),
    (22, 2, "d"): (["fabrication"], "先延ばしの理由を本人の『やりたかった』『大事だった』という未提供の願望・価値へ置き換える。末尾が推測でも埋め込まれた願望は未根拠。"),
    (25, 1, "a"): (["fabrication", "japanese"], "プロフィールは一般的な入眠困難であり昨夜の睡眠を提供しない。『眠りは回復に近づけていますか』も主語と述語の対応が不自然。"),
    (25, 1, "f"): (["fabrication"], "朝slotだけでは朝の準備中・準備の合間という行動の根拠にならない。"),
}

def parse(content):
    content = content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())["candidates"]

def audit():
    out=ROOT/"output-v3"
    run=json.loads((out/"run.json").read_text())
    judgments=[]; attempts=[]
    for record in run["records"]:
        for number,response in enumerate(record["attempts"],1):
            choice=response["choices"][0]
            content=choice["message"].get("content")
            item=dict(case=record["index"]+1,attempt=number,profile=record["profile"],slot=record["context"]["push_state"]["slot"],generation_id=response["id"],response_model=response.get("model"),finish_reason=choice.get("finish_reason"),usage=response.get("usage"),content_present=bool(content))
            try:
                if not content:
                    raise ValueError("no candidate content; finish_reason="+str(choice.get("finish_reason")))
                candidates=parse(content)
                m.validate_candidates(candidates)
                for c in candidates:
                    if c["kind"]!="none":m.validate_grounding(c["text"],record["context"])
                item["validation"]="PASS"
            except (ValueError,KeyError,TypeError) as e:
                item["validation"]="REJECT";item["reason"]=str(e)
            attempts.append(item)
            if not content:continue
            candidates=parse(content)
            assert REVIEWED[(record["index"]+1,number)] == sum(c["kind"]!="none" for c in candidates), "Unreviewed candidate set"
            accepted="decision" in record and number==len(record["attempts"])
            for c in candidates:
                classes,reason=FAILURES.get((record["index"]+1,number,c["id"]),([],"プロフィールの反映、一般的な提案、または明示的な仮定として成立。"))
                if c["kind"]=="none":reason="空文のno-send候補。文面率の分母から除外。"
                judgments.append(dict(case=record["index"]+1,attempt=number,profile=record["profile"],slot=item["slot"],**c,sendable=accepted and c["kind"]!="none",judgment="FAIL" if classes else "PASS",classes=classes,reason=reason))
    old=json.loads((ROOT/"output/run.json").read_text())
    assert [(r["profile"],r["context"]) for r in run["records"]] == [(r["profile"],r["context"]) for r in old["records"]]
    assert len(run["records"])==32
    raw=[json.loads(line) for line in (out/"raw.jsonl").read_text().splitlines()]
    assert {r["response"]["id"] for r in raw} == {a["generation_id"] for a in attempts}
    exact=json.loads((out/"run.json").read_text(),parse_float=Decimal)
    exact_cost=sum(a["usage"]["cost"] for r in exact["records"] for a in r["attempts"])
    assert len({(j["case"],j["attempt"],j["id"]) for j in judgments})==len(judgments)
    sendable=[j for j in judgments if j["sendable"]]
    generated=[j for j in judgments if j["kind"]!="none"]
    summary=dict(cases=len(run["records"]),accepted_cases=sum("decision" in r for r in run["records"]),attempts=len(attempts),retries=sum(max(0,len(r["attempts"])-1) for r in run["records"]),finish_reasons=dict(Counter(a["finish_reason"] for a in attempts)),sendable=len(sendable),sendable_fail=sum(j["judgment"]=="FAIL" for j in sendable),sendable_fail_rate=None if not sendable else sum(j["judgment"]=="FAIL" for j in sendable)/len(sendable),generated_texts=len(generated),generated_fail=sum(j["judgment"]=="FAIL" for j in generated),generated_fabrication=sum("fabrication" in j["classes"] for j in generated),generated_tone=sum("tone" in j["classes"] for j in generated),none_candidates=sum(j["kind"]=="none" for j in judgments),response_cost_usd=str(exact_cost))
    result=dict(judge="Codex full-read qualitative assessment; not independent human review",summary=summary,attempts=attempts,judgments=judgments)
    (out/"judgments.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=="__main__":audit()
