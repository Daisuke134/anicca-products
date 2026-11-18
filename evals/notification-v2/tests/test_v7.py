import importlib.util
from pathlib import Path
import pytest
from test_v6 import CTX, choices
spec=importlib.util.spec_from_file_location('v7',Path(__file__).parents[1]/'reference/interventions_v7.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

# These literal fixtures catch missing presupposition screening, including false grounds.
@pytest.mark.parametrize('text',[
 '今、頭の中に浮かんでいるのはどんな場面ですか？',
 '今この時間に、何もしないでいることについてどう感じていますか？',
 'もしよければ、最近の面接で少しでも手応えを感じられた場面はありますか？',
 '頭をぐるぐる回っている明日の予定は、どんな内容ですか？',
 '頭をぐるぐる回っている明日の予定は、どんな内容ですか？',
 '頭をぐるぐる回っている明日の予定の中で、いちばん気になっているのはどの場面ですか？',
 'いま浮かんでいる明日のことを、紙やスマホに書き出してみるとしたら、何から書きますか？',
 '現在、作業している最中に何を感じていますか？',
 '最近の失敗で、どんなことを学びましたか？',
 '今気になっていることの中で何を選びますか？',
])
@pytest.mark.parametrize('grounds',[[],['profile_summary']])
def test_unsupported_question_pruned_and_mass_moved_to_none(text,grounds):
    kept,rejected=m.filter_grounded_candidates(choices(text,grounds=grounds),CTX)
    assert [c['id'] for c in kept]==['b','n']
    assert kept[0]['probability']==.3
    assert kept[1]['probability']==pytest.approx(.7)
    assert rejected[0]['candidate']['text']==text
    assert 'presupposition' in rejected[0]['reason']

@pytest.mark.parametrize('text',[
 'もし今、頭の中に場面が浮かんでいるなら、どんな場面ですか？',
 'もし今何もしないでいるなら、どう感じていますか？',
 'もし最近面接を受けたなら、何を感じましたか？',
 '今、どんなことを選びたいですか？',
 '夜に考えごとが増える傾向について、どう感じますか？',
])
def test_open_and_state_conditional_questions_survive(text):
    kept,rejected=m.filter_grounded_candidates(choices(text),CTX)
    assert len(kept)==3 and rejected==[]

def test_literal_current_fact_supported_but_trend_does_not_entail_now():
    import copy
    ctx=copy.deepcopy(CTX)
    ctx['push_state']['profile']['profile_summary']='今、頭の中に浮かんでいるのは昨日の会議です。'
    kept,rejected=m.filter_grounded_candidates(choices('今、頭の中に浮かんでいるのはどんな場面ですか？'),ctx)
    assert len(kept)==3 and rejected==[]
    ctx['push_state']['profile']['profile_summary']='今、頭の中に浮かんでいる場面を考える傾向がある。'
    kept,rejected=m.filter_grounded_candidates(choices('今、頭の中に浮かんでいるのはどんな場面ですか？'),ctx)
    assert [c['id'] for c in kept]==['b','n']

def test_all_question_candidates_removed_yields_none_only():
    cs=choices('今、頭の中に浮かんでいるのはどんな場面ですか？')
    cs[1]['text']='最近の面接で何を感じましたか？'
    kept,rejected=m.filter_grounded_candidates(cs,CTX)
    assert len(rejected)==2 and kept==[dict(id='n',kind='none',text='',grounds=[],probability=1.0)]
