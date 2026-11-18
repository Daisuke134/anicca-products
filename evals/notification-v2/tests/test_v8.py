import copy
import importlib.util
import io
import json
from pathlib import Path
import pytest
from test_v6 import CTX, choices as old_choices
spec=importlib.util.spec_from_file_location('v8',Path(__file__).parents[1]/'reference/interventions_v8.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def choices(text='何を選びますか？'):
    cs=old_choices(text)
    for c in cs:
        if c['kind']=='question':c['presuppositions']=[]
    return cs

@pytest.mark.parametrize('declaration',[None, 'bad', [{'claim':'夜の傾向','span':'夜に考えごとが増える!'}], [{'claim':'夜の傾向'}], [{'claim':'','span':'夜'}]])
def test_missing_or_nonliteral_citation_prunes_candidate_only(declaration):
    cs=choices()
    if declaration is None:del cs[0]['presuppositions']
    else:cs[0]['presuppositions']=declaration
    m.validate_candidates(cs)
    kept,rejected=m.filter_grounded_candidates(cs,CTX)
    assert [c['id'] for c in kept]==['b','n']
    assert kept[0]['probability']==.3 and kept[1]['probability']==pytest.approx(.7)
    assert len(rejected)==1 and 'presupposition' in rejected[0]['reason']

@pytest.mark.parametrize('text',[
 'もし今よければ、この時間にいちばん気になっていることを言葉にしてみませんか？',
 '今夜は、気がかりを言葉にしてみませんか？',
 'この時間に頭にあることを言葉にしてみませんか？',
])
@pytest.mark.parametrize('citation',[False,True])
def test_v7_case12_and_current_concern_variants_pruned(text,citation):
    cs=choices(text)
    if citation:cs[0]['presuppositions']=[dict(claim='現在の気がかり',span='夜に考えごとが増える。')]
    kept,rejected=m.filter_grounded_candidates(cs,CTX)
    assert [c['id'] for c in kept]==['b','n'] and len(rejected)==1


def test_literal_current_fact_requires_declared_quote():
    ctx=copy.deepcopy(CTX);ctx['push_state']['profile']['profile_summary']='今、頭の中に浮かんでいるのは昨日の会議です。'
    cs=choices('今、頭の中に浮かんでいるのはどんな場面ですか？')
    kept,_=m.filter_grounded_candidates(cs,ctx)
    assert [c['id'] for c in kept]==['b','n']
    cs[0]['presuppositions']=[dict(claim='会議が浮かんでいる',span=ctx['push_state']['profile']['profile_summary'])]
    kept,rejected=m.filter_grounded_candidates(cs,ctx)
    assert len(kept)==3 and rejected==[]

@pytest.mark.parametrize('text',[
 '何を選びますか？',
 '運動と日記、いま続けているとしたらどちらを優先したいですか？',
 'もし今、頭の中に場面が浮かんでいるなら、どんな場面ですか？',
])
def test_empty_declaration_for_open_or_state_conditional_question(text):
    kept,rejected=m.filter_grounded_candidates(choices(text),CTX)
    assert len(kept)==3 and rejected==[]

def test_all_missing_declarations_yield_none_only():
    kept,rejected=m.filter_grounded_candidates(old_choices(),CTX)
    assert len(rejected)==2 and kept==[dict(id='n',kind='none',text='',grounds=[],probability=1.0)]

def test_prompts_require_quotes_and_explicit_only_with_worked_examples(monkeypatch):
    requests=[]
    def capture(req,**kwargs):
        payload=json.loads(req.data);requests.append(payload)
        content={'candidates':choices()} if len(requests)==1 else {'verdicts':[dict(id='a',claims=[],reason='開いた質問'),dict(id='b',claims=[],reason='仮定')]}
        return io.BytesIO(json.dumps({'choices':[{'message':{'content':json.dumps(content)}}]}).encode())
    monkeypatch.setattr(m.urllib.request,'urlopen',capture)
    m.ChatLLMGenerator('https://test.invalid','qwen/qwen4-max',max_tokens=8192)(CTX)
    m.SemanticGroundingJudge('https://test.invalid','google/gemini-2.5-flash-lite')(choices(),CTX)
    generator=requests[0]['messages'][0]['content'];judge=requests[1]['messages'][0]['content']
    assert 'presuppositions' in generator and 'span' in generator and 'verbatim' in generator
    assert 'ONLY explicitly stated' in judge and 'common-sense' in judge
    for row in json.loads((Path(__file__).parents[1]/'calibration-v8.json').read_text()):
        assert row['text'] in judge
