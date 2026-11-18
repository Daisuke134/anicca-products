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
