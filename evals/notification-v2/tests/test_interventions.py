import importlib.util
import json
from pathlib import Path
import pytest

spec = importlib.util.spec_from_file_location("interventions", Path(__file__).parents[1] / "reference/interventions.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def candidates(text="今、小さく始めるなら何を選びますか？", kind="question"):
    return [dict(id="a",kind=kind,text=text,probability=.8),dict(id="n",kind="none",text="",probability=.2)]

@pytest.mark.parametrize("text", ["「」を見てください。", "『まだ続きます。", "今、\ufffdを感じて。", "今はhello worldに集中しましょう。", "今、心Приветを見て。", "今、ゆっくりゆっくりゆっくりゆっくり。", "みたいな日だね。", "今日の気持ちを、", "くるくるせっけんかんティールのみョンを置いて。"])
def test_reject_corrupt_japanese(text):
    with pytest.raises(ValueError): m.validate_candidates(candidates(text))

@pytest.mark.parametrize("text", ["SNSで比べたくなるとき、どう過ごしたいですか？", "今日は「少しだけ」で始めてみませんか？", "今は休んでも大丈夫。", "Take a moment to breathe."])
def test_accept_natural_text(text):
    m.validate_candidates(candidates(text))

def test_reject_humor():
    with pytest.raises(ValueError): m.validate_candidates(candidates(kind="humor"))

CTX=dict(time_band="day",language="ja",desired_state="calm",source="notification")
ID="12345678-1234-1234-1234-123456789012"
@pytest.mark.parametrize("failure", ["distribution", "json"])
def test_retry_once_and_replay_without_generation(tmp_path, failure):
    calls=[]
    def generate(context):
        calls.append(context)
        if len(calls)==1:
            if failure=="json": raise json.JSONDecodeError("broken", "", 0)
            return [dict(c, probability=.1) for c in candidates()]
        return candidates()
    store=m.InterventionStore(tmp_path/"store.db",generate,draw=lambda:.1)
    result=store.decide("test",ID,CTX)
    assert result["send"] is True
    assert store.decide("test",ID,CTX)==result
    assert len(calls)==2

def test_retry_exhausted_does_not_persist(tmp_path):
    calls=[]
    def generate(context):
        calls.append(context)
        return candidates("「」")
    store=m.InterventionStore(tmp_path/"store.db",generate)
    with pytest.raises(ValueError): store.decide("test",ID,CTX)
    assert len(calls)==2
    with store.connect() as db: assert db.execute("select count(*) from cases").fetchone()[0]==0

def test_transport_error_not_retried(tmp_path):
    calls=[]
    def generate(context):
        calls.append(context)
        raise TimeoutError("network")
    store=m.InterventionStore(tmp_path/"store.db",generate)
    with pytest.raises(TimeoutError): store.decide("test",ID,CTX)
    assert len(calls)==1

@pytest.mark.parametrize("text,profile", [
    ("今朝、面接の前に少しでも自信を感じるために、自分にどんな言葉をかけてあげたいですか？", "就職活動中。面接前の不安が強い。"),
    ("布団の中で、今いちばんゆっくり感じられる呼吸はどんなテンポですか？", "布団に入っても明日の予定が頭を回って眠れない。"),
    ("田中さんと渋谷で会ったんですね。", "仕事の不安がある。"),
    ("彼氏との結婚式が近いんですね。", "仕事の不安がある。"),
    ("肩が痛いんですね。", "仕事の不安がある。"),
    ("昨日は落ち着きたいと話していましたね。", "仕事の不安がある。"),
])
def test_reject_ungrounded_facts_through_store(tmp_path,text,profile):
    calls=[]
    def generate(context):
        calls.append(1)
        return candidates(text)
    store=m.InterventionStore(tmp_path/"facts.db",generate)
    state=dict(profile=dict(profile_summary=profile),recent_reactions=[],local_day="2026-11-18",slot="07:30")
    with pytest.raises(ValueError,match="ungrounded"):
        store.decide_push("synthetic",ID,CTX,state)
    assert len(calls)==2
    with store.connect() as db: assert db.execute("select count(*) from cases").fetchone()[0]==0

@pytest.mark.parametrize("text,profile", [
    ("面接の前に、どんな言葉をかけてあげたいですか？", "面接前の不安が強い。"),
    ("ゆっくり息を吐いてみましょう。", "仕事の不安がある。"),
    ("今朝はどんな気持ちで過ごしたいですか？", "仕事の不安がある。"),
    ("今朝、面接の前にどんな言葉をかけたいですか？", "今朝、面接の予定がある。"),
])
def test_grounded_or_generic_interventions(text,profile):
    m.validate_grounding(text,dict(push_state=dict(profile=dict(profile_summary=profile))))
