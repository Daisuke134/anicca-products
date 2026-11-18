import importlib.util
from pathlib import Path
import pytest

spec=importlib.util.spec_from_file_location("v5",Path(__file__).parents[1]/"reference/interventions_v5.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
ID="12345678-1234-1234-1234-123456789012"
CTX=dict(time_band="day",language="ja",desired_state="calm",source="notification")

def candidates(kinds):
    return [dict(id=str(i),kind=k,text="今、どんなことを選びますか？",probability=1/(len(kinds)+1)) for i,k in enumerate(kinds)]+[dict(id="n",kind="none",text="",probability=1/(len(kinds)+1))]

@pytest.mark.parametrize("kinds",[["reflection"],["question","reflection","action"],["question","question","reflection","action","teaching"]])
def test_question_count_below_half_rejected(kinds):
    with pytest.raises(ValueError,match="question candidate count"):
        m.validate_candidates(candidates(kinds))

@pytest.mark.parametrize("kinds",[["question"],["question","reflection"],["question","question","question","reflection","action"]])
def test_question_count_at_least_half_accepted(kinds):
    m.validate_candidates(candidates(kinds))

def test_question_count_failure_uses_single_regeneration(tmp_path):
    calls=[]
    def generate(ctx):
        calls.append(1)
        return candidates(["reflection"] if len(calls)==1 else ["question"])
    store=m.InterventionStore(tmp_path/"test.db",generate,draw=lambda:.1)
    result=store.decide("synthetic",ID,CTX)
    assert len(calls)==2 and result["candidates"][0]["kind"]=="question"

def test_repeated_question_count_failure_never_persists(tmp_path):
    calls=[]
    def generate(ctx):
        calls.append(1);return candidates(["reflection"])
    store=m.InterventionStore(tmp_path/"test.db",generate)
    with pytest.raises(ValueError,match="question candidate count"):
        store.decide("synthetic",ID,CTX)
    assert len(calls)==2
    with store.connect() as db: assert db.execute("select count(*) from cases").fetchone()[0]==0


def test_full_review_rejects_missing_or_changed_text():
    import sys
    sys.path.insert(0,str(Path(__file__).parents[1]))
    import audit_v5
    candidate=dict(case=1,id="a",text="何を選びますか？")
    with pytest.raises(AssertionError):audit_v5.validate_review([candidate],dict(rows=[]))
    with pytest.raises(AssertionError):audit_v5.validate_review([candidate],dict(rows=[dict(candidate,text="別の文。",status="PASS",categories=[],reason="確認")]))


def test_full_review_derives_no_go_from_fabrication():
    import audit_v5
    c=dict(case=1,id="a",text="本人の未提供の願望です。")
    result=audit_v5.validate_review([c],dict(rows=[dict(c,status="FAIL",categories=["fabrication"],reason="未提供の願望")]))
    assert result["verdict"]=="NO-GO" and result["fabrications"]==1 and result["failures"]==1
