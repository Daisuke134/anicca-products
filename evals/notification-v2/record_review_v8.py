"""Persist primary's full-text reading decisions; not an automated quality judge."""
import json
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parent;out=ROOT/'output-v8/qwen'
audit=json.loads((out/'audit.json').read_text());rows=[]
reasons={
 (1,'a'):'希望する朝のペースを尋ね、現在の特定状態を断定しない。',
 (1,'b'):'優先したい事柄の開いた質問。v7の優先順位較正を維持する。',
 (1,'c'):'profileの夜の反すう傾向を「時」の質問にし、今反すう中とはしない。',
 (3,'a'):'今夜の過ごし方自体を仮定する。',
 (3,'b'):'考えが巡り始める状態そのものを「もし〜なら」で仮定する。',
 (3,'c'):'試したいことの有無を尋ね、現在の不眠や就床を断定しない。',
 (3,'d'):'眠れない日が続く場合の一般的な負担のreflectionと読む。今の身体消耗の断定とは読まない境界例。',
 (3,'e'):'任意の呼吸の提案。本人の現在の呼吸や過去行動を断定しない。',
 (6,'a'):'明記された自己否定発言の傾向に対する気持ちの質問。未提供の動機を答えとして断定しない。',
 (6,'b'):'褒められた場面を思い出す仮定。褒められること自体もprofile範囲内。',
 (6,'c'):'比較傾向は明記済み。知りたいことを開いて尋ねる。',
 (6,'d'):'優しい言葉をかける行動を仮定する。',
 (10,'b'):'自分の時間が取れること自体を明示仮定にする。',
 (10,'c'):'profileに明記された継続的な二つの気持ちへの質問。',
 (10,'d'):'明記された休日の疲れを条件に感覚を聞く。特定の現在の心身状態を答えとして断定しない。',
 (10,'e'):'三呼吸は提案回数で、本人の過去数量ではない。',
 (12,'b'):'自分の時間が取れること自体を明示仮定にする。',
 (12,'c'):'明記された二つの気持ちへの対応方針を尋ねる。',
 (12,'d'):'休む時間と休日の疲れは明記済み。一般的条件文としてのreflection。',
 (12,'f'):'明記された二つの気持ちについて一般的な考え方を提示する。',
 (16,'a'):'気分の開いた質問。現在の気分低下や具体的な気がかりを前提化しない。',
 (16,'b'):'気持ちが楽になることの存在自体を「あるとしたら」で仮定する。',
 (16,'d'):'任意の呼吸提案。',
 (20,'a'):'面接前の不安という明記された傾向への質問。今夜の面接実施は仮定しない。',
 (20,'b'):'自信低下は明記済み。評価する物差しを開いて尋ねる。',
 (20,'c'):'自分へかけたい言葉の開いた質問。',
 (23,'a'):'v7と同じ優先順位のPASS較正。今日の特定作業を捏造しない。',
 (23,'b'):'集中時間を作れること自体を明示仮定にする。',
 (23,'c'):'環境を変える仮定で工夫を尋ねる。',
 (23,'e'):'スマホの置き場所を変える実験の提案。現在の置き場所を断定しない。',
 (30,'a'):'運動か日記の選択自体を仮定する。',
 (30,'b'):'時間が作れること自体を明示仮定にする。',
 (30,'e'):'「今日の分の目標を…書き換える」は今日の具体的な目標が既に存在することを前提にする。profileは大きな目標を立てて挫折する傾向だけで、今日の目標は明記しない。「よければ」は提案への配慮で、その目標の存在自体の仮定ではない。',
 (31,'a'):'今日小さくやることを明示仮定にする。',
 (31,'b'):'続けることを考える仮定で負担の少ない形を聞く。',
 (31,'c'):'三日坊主の傾向は明記済み。変えたい部分の開いた質問。',
 (31,'e'):'明日の運動/日記の取り組みを小さくする将来の提案と読む。具体的な今日の既存目標の書換えは要求しない境界例。',
}
assert len(reasons)==len(audit['sendable_candidates'])==37
for c in audit['sendable_candidates']:
    key=(c['case'],c['id']);fail=key==(30,'e')
    rows.append(dict(c,status='FAIL' if fail else 'PASS',categories=['fabrication'] if fail else [],reason=reasons[key]))
(out/'judgments.json').write_text(json.dumps(dict(reviewer='Mac Codex primary full-text reading; AI judgment, not independent human review',rows=rows),ensure_ascii=False,indent=2))
filters=json.loads((out/'filter-reading.json').read_text())
proper={6,9,26,31,38,79}
for n,r in enumerate(filters):
    if n in proper:
        category='unsupported_current_presupposition';reason='現在の特定の気がかり/頭の反すうの存在を前提化する。profileの傾向は現在事実ではない。'
    elif n==93:
        category='unsupported_personal_history';reason='続けられた成功時点の存在はprofileにない。'
    elif n==64:
        category='unsupported_personal_quantity';reason='実際の就活行動が3つあるとの数量は明記しない。3回呼吸という将来提案回数と異なる。'
    elif n==69:
        category='unsupported_general_quantity';reason='集中が段取りで半分決まるという数量的教示は出所不明。安全な一般提案としての過剰棄却に数えない。'
    else:
        category='over_rejection';reason=('現在気がかりがあるかという存在自体を尋ねる質問であり、存在を断定しない。新マーカーの過剰棄却。' if n==82 else '一般教示/任意の提案/明示仮定/傾向の言い換え/開いた質問を既存の空grounds断定・数量スクリーンが保守的に除外する。')
    r.update(primary_category=category,primary_reason=reason)
summary=dict(counts=dict(Counter(r['primary_category'] for r in filters)),rows=filters)
(out/'filter-review.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('reviewed',len(rows),'filter review',summary['counts'])
