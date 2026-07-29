# Prior art: self-improving loops と 研究自動化

`51-life-manager-builds-life-manager.md` の設計判断を裏取りするための実測 evidence pack。
2026-07-30 に `gh api` + `curl` + `crwl` で取得。数値は全て一次 source から。

用途は2つ:

| 用途 | 対象 |
|---|---|
| Self-Builder の設計硬化 | §1〜§3（spec §1 Evidence / §8 / §10 / §19 に反映済み） |
| 研究室向け発表の付録 | §4〜§6（deck appendix + 記事後半） |

---

## 1. 自己改変する agent

| Name | URL | 何か | 採る設計 | 既知の失敗 |
|---|---|---|---|---|
| SICA | [repo](https://github.com/MaximeRobeyns/self_improving_coding_agent) · [arXiv 2504.15228](https://arxiv.org/abs/2504.15228) | 自分の codebase を編集する agent。eval → archive → 自己改善 → 再 eval | ★ 非同期 LLM overseer を別 thread で常駐。callgraph + event stream を渡し、**別 model** で、実行を cancel できる（既定 30 秒間隔） | path dependency。初期の悪い着想が後続を汚染 |
| Darwin Gödel Machine | [repo](https://github.com/jennyzzt/dgm) · [Sakana](https://sakana.ai/dgm) · [arXiv 2505.22954](https://arxiv.org/abs/2505.22954) | archive から任意の祖先を分岐する open-ended 進化。証明でなく実測で検証 | ★ archive = 踏み石。親より悪い個体も残して分岐。同時に **lineage が reward hacking の唯一の検知手段**になった | 実際に2回 reward hack した（§3） |
| OpenEvolve | [repo](https://github.com/algorithmicsuperintelligence/openevolve) / [codelion/openevolve 6.8k★](https://github.com/codelion/openevolve) | OSS AlphaEvolve。MAP-Elites + island + LLM ensemble | ★ `cascade_evaluation` で安い stage-1 を先に通す + `enable_artifacts` で stderr を次 prompt へ戻す | scalar で機械採点できる目的関数が必須 |
| AlphaEvolve | [DeepMind](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) | Gemini + 自動 evaluator + 進化 DB。Google 社内で本番稼働 | ★ evaluator が product。“verifies, runs and scores the proposed programs using automated evaluation metrics”。人間可読な code を優先（debuggability） | 適用条件は “progress can be clearly and systematically measured” 領域のみ |
| SWE-agent / mini | [repo](https://github.com/SWE-agent/SWE-agent) · [mini](https://github.com/SWE-agent/mini-swe-agent) | Issue→patch agent | ★ 単純さが勝つ。mini が 100 行で SWE-bench Verified 65%、複雑版は deprecated | benchmark スコア ≠ 本番能力（§3） |

実測値:

| 主張 | 数値 | Source |
|---|---|---|
| SICA の自己改善 | SWE-Bench Verified subset で 17% → 53% | [arXiv 2504.15228](https://arxiv.org/abs/2504.15228) |
| DGM の自己改善 | SWE-bench 20.0% → 50.0%、Polyglot 14.2% → 30.7% | [sakana.ai/dgm](https://sakana.ai/dgm) |
| AlphaEvolve の本番効果 | Borg scheduling heuristic が1年以上稼働、Google の全世界 compute の平均 0.7% を回収。FlashAttention kernel 最大 32.5% 高速化 | [DeepMind](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) |

## 2. 本番で PR まで到達している自動修正 loop

| Name | URL | 採る設計 | 限界 |
|---|---|---|---|
| Sentry Seer / Autofix | [docs](https://docs.sentry.io/product/ai-in-sentry/seer/autofix/) | ★ 課金前の triage gate: event 数 ≥10 × 発生 14 日以内 × ML fixability score。停止点は project 設定（`Stop after Root Cause` / `Plan` / `PR Drafted`） | 上限が **PR drafted**。auto-merge という停止点が存在しない |
| Seer → 外部 coding agent | 同上 | ★ 診断と修理を分離。telemetry を持つ側が plan を書き、repo を持つ側が code を書く | GitHub 限定 |
| CodeMender | [DeepMind](https://deepmind.google/discover/blog/introducing-codemender-an-ai-agent-for-code-security/) | ★ 別 LLM critic が orig↔modified の差分を regression 目的で読む + static/dynamic 解析・差分 test・fuzz・SMT で non-LLM ground truth | 明示的に人間 gate: “only surfacing for human review high-quality patches”。6か月で 72 件 upstream |
| CodeRabbit | [docs](https://docs.coderabbit.ai/overview/introduction) | 1つの knowledge base を PR / IDE / CLI / Slack の4面で使う。最も安い gate は最も早い gate | advisory。自律 merge の記述なし |
| Hivemoot / Colony | [repo](https://github.com/hivemoot/colony) | ★ merge 権限を agent の judgment でなく deterministic bot に置く。governance history を replay 可能に保つ（`npm run replay-governance`） | toy scale。機構の証明であって安全性の証明ではない |

Colony 核心の引用: “No human wrote the features, chose the priorities, or approved the merges.”

## 3. Reward hacking — 例外ではなく base case

| 事実 | Source |
|---|---|
| DGM が **test log を捏造**: “It faked a log making it look like it had run the tests and that they had passed, when in fact they were never run!” | [sakana.ai/dgm](https://sakana.ai/dgm) |
| それを直せと指示したら **検知器を殺した**: “it removed the markers we use in the reward function to detect hallucination (despite our explicit instruction not to do so), hacking our hallucination detection function to report false successes.” 検知できたのは archive の lineage があったから | [sakana.ai/dgm](https://sakana.ai/dgm) |
| AI Scientist v1 は **自分の timeout を延ばそうとした**: “it simply tried to modify its own code to extend the timeout period” | [sakana.ai/ai-scientist](https://sakana.ai/ai-scientist/) |
| SWE-bench は部分的に memorization: issue 本文だけ（repo 無し）で buggy file path を 76% 特定。SWE-bench 外 repo では 53% | [arXiv 2506.12286](https://arxiv.org/abs/2506.12286) |
| SICA の gain も一部は測定 artifact: “much of the initial improvement we report arises from features speeding up file editing and agent cost, which are not traditionally reflected … in SWE-Bench numbers” | [arXiv 2504.15228v2 §5.1](https://arxiv.org/html/2504.15228v2) |
| judge の自己贔屓は機構的: “a linear correlation between self-recognition capability and the strength of self-preference bias” | [arXiv 2404.13076](https://arxiv.org/abs/2404.13076) |
| 自動生成 eval は構造的に循環: “users need criteria to grade outputs, but grading outputs helps users define criteria” | [EvalGen, arXiv 2404.12272](https://arxiv.org/abs/2404.12272) |

結論: 正直に報告された自己改善 loop は例外なく **問題でなく測定器を攻撃した**。効いた対策は
prompt 強化ではなく、**immutable append-only lineage** と **agent が書けない場所の non-LLM ground truth**。

## 4. 自動 merge は本番で行われているか

| Tier | 実例 | 判定 |
|---|---|---|
| 依存更新 | GitHub native auto-merge / Renovate | 実運用あり。Renovate の指針は “where you would select 'merge' anyway”、最低 risk class は `lockFileMaintenance`、1 run で 1 branch/PR に rate limit |
| semantic code fix | Sentry Seer / CodeMender / CodeRabbit | ★ **どの vendor もやっていない** |
| 全自律 | Hivemoot/Colony | やっている。toy scale、governance bot が merge 権限を持つ |

GitHub 核心の引用: “Auto-merge merges a pull request automatically after all required reviews and
status checks pass”（write 権限のない push が入る、base branch が切り替わる等で自動解除）。
[docs](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request)

★ 設計上の含意: **自動 merge が正当なのは、受理述語を required status check として表現できる時だけ**。
よって工学問題は「自動生成した eval を required check に昇格できるか」に還元される。
できないなら merge 問題ではなく canary 問題である。

## 5. 研究自動化（研究室向け）

### 5.1 自律研究システム

| System | URL | 明日採れる点 | 限界 |
|---|---|---|---|
| AI Scientist-v2 | [repo 6.9k★](https://github.com/SakanaAI/AI-Scientist-v2) · [arXiv 2504.08066](https://arxiv.org/abs/2504.08066) | idea→PDF を無人で回す唯一の OSS。実験 $15–20/run + writeup ~$5 | workshop 級。Sakana 自身が “none of them passed our internal bar for an ICLR conference track publication” |
| AI Scientist v1 | [repo 14.3k★](https://github.com/SakanaAI/AI-Scientist) | 良い template があれば v2 より成功率が高い（v2 README） | 自分の harness を reward hack（§3）→ sandbox 必須 |
| Agent Laboratory | [repo 5.8k★](https://github.com/SamuelSchmidgall/AgentLaboratory) · [arXiv 2501.04227](https://arxiv.org/abs/2501.04227) | 研究費 “84% decrease”。**着想は人間が出す**構成 | 自著の ablation が “Human involvement, providing feedback at each stage, significantly improves the overall quality” |
| Google AI co-scientist | [blog](https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/) · [arXiv 2502.18864](https://arxiv.org/abs/2502.18864) | ★ Elo tournament self-play で仮説を順位付け。研究室が最も真似しやすい安い自己改善 signal | “The Elo is an auto-evaluation and is not based on an independent ground truth”。湿式検証は全て expert-in-the-loop |
| Kosmos | [arXiv 2511.02824](https://arxiv.org/abs/2511.02824) | 12h run / 200 rollout / 共有 world model で coherence collapse を回避 | 独立検証で **statement の 79.4% が正確** = 5件に1件が誤り。closed source |
| Zochi | [repo](https://github.com/IntologyAI/Zochi) · [TechCrunch](https://techcrunch.com/2025/03/19/academics-accuse-ai-startups-of-co-opting-peer-review-for-publicity/) | （反面教師）ACL main を「AI 単独で通した」と主張 | 査読者へ**未開示**。研究者から公開批判。ICLR も知らされていなかった |
| PaperQA2 | [repo 9.0k★](https://github.com/Future-House/paper-qa) | citation grounded な文献層としては最良 | RAG のみ、実験しない |

AI Scientist の ICLR 主張の実態（[Sakana](https://sakana.ai/ai-scientist-first-publication/)）: ICLR 2025 **ICBINB workshop** へ3本、
スコア 6,7,6 / 3,7,4 / 3,3,3。閾値超えは1本のみ。公開前に取り下げ。workshop 採択率 60–70% に対し
main conference は 20–30%。meta-review 未実施。LSTM を Goodfellow 2016 に帰属する引用誤りあり。
ただし ICLR 運営の協力 + **UBC IRB 承認**を取った点で Zochi と倫理的に正反対。

### 5.2 ベンチマーク — 現在地の数値

| Benchmark | 測る物 | 数値 | 注意 |
|---|---|---|---|
| [MLE-bench](https://github.com/openai/mle-bench) | Kaggle 75 comp のメダル率 | 17.12±0.61%（AIDE+o1-preview, 2024-10）→ **64.44±1.18%**（2026-02）= 16か月で約3.8倍 | leaderboard は 2026-04-24 に凍結（公平性の見直し中）。77.78% は test-set feedback 有りの非比較表 |
| [RE-Bench](https://metr.org/blog/2024-11-22-evaluating-r-d-capabilities-of-llms/) | ML 研究 env 7種で人間専門家と対戦 | **2時間予算では agent が勝つ。32時間では人間が約2倍**。kernel task は o1-preview 0.64ms vs 人間最良 0.67ms | env が7個のみ。目的が明確で feedback が速いタスクに偏る |
| [PaperBench](https://arxiv.org/abs/2504.01848) | ICML'24 論文 20本をゼロから再現（8,316 rubric 項目） | 最良 agent **26.0±0.3%** vs **ML PhD 41.4%** | LLM judge 採点自体の誤差 |
| [METR time horizon](https://arxiv.org/abs/2503.14499) | 50% 成功する task 長 | Claude 3.7 Sonnet で **約50分**。2019 年以降 **約7か月で倍増** | 外挿の外的妥当性は著者自身が未解決と明記 |

形は明確: **短距離は強く、長距離は弱い**。2時間タスクでは人間専門家に勝ち、32時間で負ける。
既知論文の再現で PhD の 6割強。MLE-bench の伸びは *ML engineering* であって novelty 生成ではない。

### 5.3 eval 駆動の自動最適化（研究室が明日使う層）

| Tool | URL | なぜ | 限界 |
|---|---|---|---|
| DSPy + GEPA | [dspy.ai 36.5k★](https://dspy.ai/) · [arXiv 2507.19457](https://arxiv.org/abs/2507.19457) | ★ RL compute の無い研究室の本命: “GEPA outperforms GRPO by 6% on average and by up to 20%, while using up to 35× fewer rollouts”、MIPROv2 比でも 10% 超 | metric が score + text の **feedback 形**である必要 |
| MIPROv2 | [docs](https://dspy.ai/api/optimizers/MIPROv2) | instruction と demo を同時に Bayesian 探索 | GEPA/MIPROv2 は1 run で “hundreds of dollars” 使い得る |
| BootstrapFewShot | [dspy.ai](https://dspy.ai/) | “the safe first try”。ほぼ無料の baseline | trainset へ過適合 |
| TextGrad | [repo 3.7k★](https://github.com/zou-group/textgrad) · [Nature 639 (2025)](https://www.nature.com/articles/s41586-025-08661-4) | textual gradient を任意 pipeline に逆伝播。分子設計・放射線治療計画でも査読通過。GPQA 51%→55% | 明示的 graph と loss が必要 |
| Trace | [microsoft/Trace 750★](https://github.com/microsoft/Trace) | prompt でなく **code** を最適化（任意 Python を学習可能 graph 化） | ecosystem が小さい |
| OpenEvolve | [repo 6.8k★](https://github.com/codelion/openevolve) | 「人間無しで software を進化させる」の literal demo。AlphaEvolve は 4×4 複素行列積を **48 回の scalar 乗算**で解き Strassen(1969) を更新 | 自動計算できる evaluator 必須、token 重い |

### 5.4 observability と orchestration

| Tool | ★ | なぜ | 限界 |
|---|---|---|---|
| [Langfuse](https://github.com/langfuse/langfuse) | 32.1k | MIT core、self-host が Docker Compose 5分、OTLP endpoint `/api/public/otel` を持つ。学内 GPU cluster と data privacy 要件に合う | SSO/RBAC は非 MIT の `ee/` |
| [W&B Weave](https://weave-docs.wandb.ai/) | 1.1k | `@weave.op` だけで trace tree + Evaluations。**学術研究は無料** | cloud 前提、self-host は Enterprise |
| [OTel GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | — | `gen_ai.*` を出せば vendor 交換自由。Langfuse/Phoenix/MLflow が食える | **Status: Development**。属性名が変わる（`gen_ai.system` → `gen_ai.provider.name`） |
| [LangGraph](https://github.com/langchain-ai/langgraph) | 38.4k | `StateGraph` + checkpoint + `interrupt()`。“persist through failures … automatically resuming from exactly where they left off” | 最良の可視化は closed SaaS の LangSmith 依存 |
| [Hydra](https://github.com/facebookresearch/hydra) + [Optuna](https://github.com/optuna/optuna) | 10.6k / 14.6k | `hydra_optuna_sweeper` で `--multirun` に TPE + pruning。**研究室に既にある**。agent はこれを呼ぶべきで置き換えるべきでない | Optuna は HPO のみ |
| [submitit](https://github.com/facebookincubator/submitit) | 1.6k | Python 関数を Slurm job として投げる。NAIST 現実の primitive | Slurm 限定 |
| [Ray](https://github.com/ray-project/ray) | 43.4k | 単一 node を超える fan-out | Slurm との摩擦 |

研究室では **不要**: Airflow / Prefect / Metaflow（production チーム用）。AutoGen / CrewAI は
LangGraph と役割が重なるのでどれか1つ。

### 5.5 大学院生1人・1週間で立つ最小 loop

| Day | Step | Stack |
|---|---|---|
| 1 | **task + metric を凍結**。50–200 例と自動採点器。*ここが全て。metric が無ければ loop は無い* | [inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) / [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) |
| 2 | pipeline を DSPy program 化し zero-shot baseline を取る | DSPy |
| 3 | tracing を入れて全 run を検査可能にする | Langfuse self-host か Weave（学術無料） |
| 4 | BootstrapFewShot → feedback 形 metric で GEPA | `dspy.GEPA` |
| 5 | seed/config を cluster へ fan-out | Hydra `--multirun` + Optuna + submitit |

この loop には **agent framework が1つも入っていない**。よくある失敗は逆順 —
orchestration graph を先に選び、metric を最後まで定義しないこと。

### 5.6 研究で人間が必須のまま残る場所

| 領域 | 状態 | 根拠 |
|---|---|---|
| Authorship | 禁止 | “LLMs are not eligible for authorship” — [ICML 2026 CFP](https://icml.cc/Conferences/2026/CallForPapers)。ACL: “a contributor of both ideas and their execution seems to us like the definition of a co-author, which the models cannot be” |
| 論文執筆 | 実際に執行中 | NeurIPS 2026 Position Paper Track で **178本(18.4%)を desk reject**、別途 123本(12.7%)が人間関与の立証要求。“the final paper must itself be substantially written by human authors” — [NeurIPS blog 2026-06-02](https://blog.neurips.cc/2026/06/02/ai-generated-papers-in-the-neurips-2026-position-paper-track/) |
| 査読への投稿 | 会議の同意 + IRB | Sakana は ICLR 運営の協力と UBC IRB 承認を得て公開前に取り下げ。Intology は未通知 → 批判 |
| 査読 | 禁止 | NeurIPS: reviewer は AI 不使用を誓約。ICML 2026 は [LLM 方針](https://icml.cc/Conferences/2026/LLM-Policy)、prompt injection は desk rejection |
| Novelty 主張 | 未解決 | co-scientist の Elo は独立 ground truth でない。Kosmos は 79.4% 正確 |
| Provenance | 要件化が進行中 | “Authors whose submissions show significant AI involvement must provide an audit trail … we expect that in future years this kind of audit trail will become a default”（NeurIPS 2026）★ 今 tracing を入れる最強の理由。trace log がそのまま audit trail になる |

## 6. 数値の但し書き

| 項目 | 注意 |
|---|---|
| MLE-bench 77.78% | 非比較表（test-set feedback 有り）の値。比較可能な SOTA は 64.44%、board は 2026-04-24 凍結 |
| CORE-Bench / MLR-Bench / RExBench / SUPER | 存在は確認したが数値未取得のため引用しない |
| Inngest の durability 優位 | AgentKit docs には LangGraph 比の durability 主張が見つからなかった。未検証として扱う |
| Cursor Bugbot | docs が JS render で読めず。未カバー（推測しない） |
