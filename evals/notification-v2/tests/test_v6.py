import importlib.util
import io
import json
from pathlib import Path
import pytest

spec=importlib.util.spec_from_file_location("v6",Path(__file__).parents[1]/"reference/interventions_v6.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CTX=dict(time_band="day",language="ja",desired_state="calm",source="notification",push_state=dict(profile=dict(profile_summary="夜に考えごとが増える。"),recent_reactions=[],local_day="2026-11-18",slot="12:30"))
ID="12345678-1234-1234-1234-123456789012"

def choices(text="何を選びますか？",kind="question",grounds=None):
    return [dict(id="a",kind=kind,text=text,grounds=[] if grounds is None else grounds,probability=.3),dict(id="b",kind="question",text="もし時間があれば、何から始めてみたいですか？",grounds=[],probability=.3),dict(id="n",kind="none",text="",grounds=[],probability=.4)]

def decide(tmp_path,cs):
    return m.InterventionStore(tmp_path/"test.db",lambda _:cs,draw=lambda:.1,grounding=lambda *_:None).decide("synthetic",ID,CTX)

@pytest.mark.parametrize("text",["今日も頑張ってきましたね。","これは真剣に向き合った証ですね。","今まで三回も始めましたね。","今は落ち着きたい気持ちなのですね。"])
def test_ungrounded_declaration_pruned_without_regeneration(tmp_path,text):
    result=decide(tmp_path,choices(text,"reflection"))
    assert [c["id"] for c in result["candidates"]]==["b","n"]
    assert result["candidates"][0]["probability"]==.3
    assert result["candidates"][1]["probability"]==pytest.approx(.7)
    assert result["rejected_candidates"][0]["candidate"]["text"]==text

@pytest.mark.parametrize("text,kind",[("どんなことを選びますか？","question"),("もし少し休めるなら、何をしてみたいですか？","question"),("ゆっくり息を吐いてみましょう。","breathing")])
def test_safe_open_question_and_general_action_survive(tmp_path,text,kind):
    result=decide(tmp_path,choices(text,kind))
    assert result["candidates"][0]["text"]==text
    assert result["rejected_candidates"]==[]

def test_profile_paraphrase_requires_real_profile_field(tmp_path):
    result=decide(tmp_path,choices("夜に考えごとが増えるのですね。","reflection",["profile_summary"]))
    assert len(result["candidates"])==3
    (tmp_path/"test.db").unlink()
    result=decide(tmp_path,choices("夜に考えごとが増えるのですね。","reflection",["desired_state"]))
    assert [c["id"] for c in result["candidates"]]==["b","n"]

def test_missing_grounds_rejected(tmp_path):
    cs=choices();del cs[0]["grounds"]
    with pytest.raises(ValueError):decide(tmp_path,cs)

def test_all_pruned_is_no_send(tmp_path):
    cs=choices("今日も頑張りましたね。","question")
    cs[1]["text"]="あなたは何度も挑戦しましたね。"
    result=decide(tmp_path,cs)
    assert result["send"] is False and result["candidates"][0]["probability"]==1

@pytest.mark.parametrize("verdict,raises",[
    ({"id":"a","claims":[{"claim":"本人は三回試みた","profile_fields":["profile_summary"],"entailed":False}],"reason":"数量は未提供"},True),
    ({"id":"a","claims":[],"reason":"質問のみ"},False),
    ({"id":"a","claims":[{"claim":"夜に考えごとが増える","profile_fields":["profile_summary"],"entailed":True}],"reason":"明記"},False),
    ({"id":"a","claims":[{"claim":"未提供の事実","profile_fields":[],"entailed":True}],"reason":"不正根拠"},True),
])
def test_claim_judge_checks_each_entailment(monkeypatch,verdict,raises):
    payload={"choices":[{"message":{"content":json.dumps({"verdicts":[verdict]})}}]}
    monkeypatch.setattr(m.urllib.request,"urlopen",lambda *a,**k:io.BytesIO(json.dumps(payload).encode()))
    judge=m.SemanticGroundingJudge("https://test.invalid","test")
    cs=[choices()[0],choices()[-1]]
    if raises:
        with pytest.raises(ValueError):judge(cs,CTX)
    else:judge(cs,CTX)
