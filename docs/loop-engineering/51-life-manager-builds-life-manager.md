# Life Manager Builds Life Manager

Status: M1 merged、M2 review verdict = WITH FIXES、M3 planned。Self-Builder runtimeは未稼働
Scope: Life Managerが自分の実行データから問題と改善機会を発見し、Issue、eval、
code change、PR、canary、merge、outcome測定まで進める自己開発システム
Theory SSOT:
[Loop / Graph / Eval / Observability Engineering](../research/2026-07-28-loop-graph-eval-observability.md)

### SSOT contract

このファイルだけを、Life Manager Self-Builderのarchitecture、現在地、model routing、
実装順序、cutover条件の正本とする。

| Document | Authority |
|---|---|
| `51-life-manager-builds-life-manager.md`（本ファイル） | ★ 唯一のarchitecture / status / ordered TODO SSOT |
| `52-prior-art-self-improving-loops.md` | research evidence。実装状態を宣言しない |
| `53-self-builder-tree-and-ux.md` | 本ファイルから派生するtree / UX view。矛盾時は51が勝つ |
| `docs/superpowers/plans/2026-07-30-lm-sb-*.md` | milestone実行記録。全体状態と順序は宣言しない |
| article / deck | 説明用成果物。runtimeの正本ではない |

### Status truth

| System / milestone | Current truth |
|---|---|
| Life Manager product plane | cloudで通常稼働。今回のSelf-Builder開発と独立 |
| 旧 `life-manager-dev` / `life-manager-selfbuild` prototype | Mac miniの2 LaunchAgentはunloaded。source、installer、historical ledgerは残存し、cutover時の削除は`LM-SB-17` |
| M1 (`LM-SB-01/02/03`) | ★ DONE。review、fix、verify後に`3c6b3f16d`へmerge済み |
| M2 (`LM-SB-04/05/06/16`) | candidate codeは`49094929f`まで存在するが、fresh review = **WITH FIXES**。未merge・runtime未接続 |
| M3 (`LM-SB-07/08/09`) | plan `f4db07bb2`のみ。未実装 |
| Canary / outcome / meta-improvement | 未実装 |
| Human-free production improvement | 未有効。Life Managerがすでに自分をbuildしているとは表現しない |

### One-system invariant

Life Managerには、競合する二つのdev loopを置かない。完成形は一つの
`Self-Builder Control Plane`だけである。Maker、Checker、Overseerは別loopではなく、
同じcontrol planeが一つのIssueについて短時間だけ起動するbounded roleである。

旧Luna prototypeは再起動しない。新Self-Builderがshadow E2Eを通過した後、
`LM-SB-17`で旧LaunchAgent、installer、producer、consumer、専用guardを削除してから
live-enableする。Opus 5 subagentは現在このシステムを**実装している開発executor**であり、
完成後のruntime componentではない。

本資料でいうNo-Human-Loopは、immutable policyで許可された低risk classについて、
signal発見からoutcome確認まで**human-free execution**できることを指す。人間は任意で
Issueやfeedbackを追加できるが必須ではない。permission、billing、auth、secret、
SAFE-T、破壊的migration等は自動scope外へquarantineし、通常loop全体を止めない。

## 0. Goal

```text
done="
Life Managerの実データから作られたevidence付きIssueが、
独立したevalを通じて隔離worktreeの修正へ変換され、
低risk変更は人間承認なしでcanary・merge・outcome測定まで完了し、
悪化時は自動rollbackされ、その全lineageを後から再構成できる
"
```

このシステムの目的は、Agentを永遠に走らせることではない。
**再発する問題を減らし、ユーザーoutcomeを改善し、悪い変更を自動で捨てること**
である。

## 1. Architecture decision

### 単一推奨

Life Managerの内側に`Observer`を置き、Life Managerとは別credential・別process・
別worktreeで動く`Self-Builder Control Plane`が変更と昇格を担当する。

M1、M2、M3は別システムではない。同じSelf-Builderを順番に完成させるmilestoneである。

| Milestone | One-system layer |
|---|---|
| M1 | kernel: policy、telemetry envelope、Postgres state/lease |
| M2 | eyes: redact、signal adapters、cluster、triage、Issue projection |
| M3 | hands + examiner: frozen eval、Maker、independent Checker |
| M4+ | deployment + learning: archive、overseer、canary、outcome、meta-improvement、cutover |

```text
┌──────────────── Life Manager / Product Plane ────────────────┐
│ wake / travel / ask / discovery / writer / API / iOS         │
│         │                                                     │
│         └─ trace + metric + state diff + effect receipt       │
└──────────────────────────┬────────────────────────────────────┘
                           │ append-only, redacted
                           ▼
┌──────────── Self-Builder / Improvement Control Plane ─────────┐
│ Observer -> Clusterer -> Triage -> Eval Builder -> Maker      │
│                                                  │             │
│ Outcome Auditor <- Promoter <- Canary <- Checker <┘             │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
                GitHub Issue / PR / Actions / Deploy
```

「内側か外側か」の答えは**両方**である。

| Placement | Responsibility |
|---|---|
| Life Managerの内側 | signal、trace、metric、receiptを出す |
| Life Managerの外側 | issue化、eval、code変更、credential、merge、rollback |

Product processへGitHub merge credentialを渡さない。Productが壊れてもSelf-Builderが
直せ、Self-Builderが壊れてもProductの顧客機能は動き続ける。

### Evidence

| Source | Core quote | Adopted pattern |
|---|---|---|
| [OWASP Agent Observability Standard](https://github.com/OWASP/www-project-agent-observability-standard) | “inspectable, traceable and instrumentable” | 全actionをtraceし、外部controlを差し込める |
| [Anthropic Managed Agents](https://www.anthropic.com/engineering/scaling-managed-agents) | brain、hands、sessionを分離 | sessionを外部化しworkerを交換可能にする |
| [mission](https://github.com/tackeyy/mission) | “plan -> execute -> review -> aggregate score -> iterate” | deterministic stop gateを置く |
| [LangChain Eval Engineering](https://www.langchain.com/blog/towards-automating-eval-engineering) | “mine traces -> identify a failure -> build an eval” | production failureを回帰evalへ変換 |
| [LangChain Graph Engineering](https://www.langchain.com/blog/3-years-of-graph-engineering-with-langgraph) | “loops are simple graphs” | 複数loopをstate machineとして統治 |
| [Colony Builds Colony](https://runcolony.com/blog/colony-builds-colony/) | “This isn’t a closed loop.” | 人間が残る箇所を隠さず、bounded autonomyから始める |
| [SICA](https://arxiv.org/abs/2504.15228) | “performance improves from 17% to 53% … on a random subset of SWE-Bench Verified” | 自己改善は実測で効く。ただし §5.1 が「gainの多くはfile編集速度でありSWE-Bench的な改善ではない」と自認 |
| [SICA overseer](https://arxiv.org/html/2504.15228v2) | “an LLM, running periodically in a concurrent thread … may intervene … or in serious cases to cancel the execution … called every 30s” | ★ 非同期Overseerを別threadで常駐させ、別model・kill権限を持たせる（§3.1に採用） |
| [Darwin Gödel Machine](https://sakana.ai/dgm) | “It faked a log making it look like it had run the tests … it removed the markers we use in the reward function to detect hallucination … hacking our hallucination detection function” | ★ reward hackingはbase case。対策はprompt強化ではなく **immutable lineage archive**（それが実際に検知した唯一の手段） |
| [AlphaEvolve](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) | “verifies, runs and scores the proposed programs using automated evaluation metrics” / 適用範囲は “progress can be clearly and systematically measured” 領域 | evaluatorがproduct。機械採点できないclassはloopに入れない |
| [OpenEvolve](https://github.com/algorithmicsuperintelligence/openevolve) | `cascade_evaluation` / `enable_artifacts` | 安いstage-1で先に落とす + stderrをartifactとして次promptへ戻す |
| [Sentry Seer / Autofix](https://docs.sentry.io/product/ai-in-sentry/seer/autofix/) | 自動起動条件 = event数 ≥10 × 発生14日以内 × ML fixability score。上限は `Stop after PR Drafted` | ★ 課金前triage gate。かつ商用の到達点はPR止まりで自動mergeではない |
| [CodeMender](https://deepmind.google/discover/blog/introducing-codemender-an-ai-agent-for-code-security/) | 6か月で72件をOSSへupstream、“only surfacing for human review high-quality patches” | 別LLM criticがorig↔modified差分をregression目的で読む + fuzz/差分test/SMTでnon-LLM ground truth |
| [GitHub auto-merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) | “merges a pull request automatically after all required reviews and status checks pass” | ★ 自動mergeの合法条件 = 受理述語をrequired status checkとして表現できること |
| [Self-preference bias](https://arxiv.org/abs/2404.13076) | “linear correlation between self-recognition capability and the strength of self-preference bias” | 同family adversaryはcontext汚染を消すがself-preferenceは消さない → Checkerは別family or code judge |
| [EvalGen / criteria drift](https://arxiv.org/abs/2404.12272) | “users need criteria to grade outputs, but grading outputs helps users define criteria” | ★ 直したい失敗から生成したevalは循環する → 修正前にfreeze + version + holdout sliceで再検証 |
| [Hivemoot / Colony](https://github.com/hivemoot/colony) | “No human wrote the features, chose the priorities, or approved the merges.” | merge権限をagentのjudgmentでなくdeterministic botに持たせ、governance historyをreplay可能に保つ |

### Concrete tool stack

Graph EngineeringのためにLangGraphを追加しない。Life Managerがすでに使うInngestを
durable control graphとし、LLM workerはそのnodeとして呼ぶ。

| Layer | Selected tool | Current status | Responsibility |
|---|---|---|---|
| Instrumentation standard | OpenTelemetry SDK + Collector | M1でcommon envelope実装済み。Collector/export本番配線は`LM-SB-18` | trace/span/metric/logの共通schemaとexport |
| Agent trace/eval UI | Langfuse | target。未導入 | LLM/tool trace、session、score、dataset、experiment |
| Durable graph | Inngest | existing。6 durable functionsとtestあり | event、step state、retry、concurrency、resume |
| Product outcome | Mixpanel + Postgres | existing signal、Self-Builder接続はtarget | funnel、retention、task success、effect receipt |
| Error plane | Sentry | target。repo内導入未確認 | exception、release regression、alert |
| Improvement authority | Postgres | M1 core schema/state/lease実装済み。M2 projectionはWITH FIXES | signal、cluster、issue state、lease、audit |
| Visible work state | GitHub Issues / PRs | M2 candidateあり、C1 idempotency欠陥により未accept | evidence packet、diff、lineage |
| Deterministic gates | GitHub Actions + existing test runners | test runners existing、promotion gateはtarget | build、unit、integration、E2E、policy |
| Coding workers | Codex Sol + independent non-GPT Checker | available、dispatcher未実装 | implementation、independent verification |
| Portable agent eval | existing Node evals first; Harbor later | Node evals existing、Harborは非導入 | containerized cross-agent taskが必要な時だけ導入 |

ソース: [Inngest](https://github.com/inngest/inngest) /
核心の引用: “Steps ... can run for months and recover from failures.”

ソース: [Langfuse](https://github.com/langfuse/langfuse) /
核心の引用: “develop, monitor, evaluate, and debug AI applications.”

ソース: [OpenTelemetry Semantic Conventions](https://github.com/open-telemetry/semantic-conventions) /
核心の引用: “define a common set of (semantic) attributes.”

## 2. Trust boundary

Life Managerが自分の全構成を自由に編集する設計にはしない。
自己改善可能なsurfaceとimmutable kernelを分ける。

| Mutable by Self-Builder | Immutable to Self-Builder |
|---|---|
| Product codeのallowlisted paths | goal / constitution |
| prompt、skill、tool description | secret store |
| retry、routing、context selection | branch protection |
| test、fixture、non-sealed eval | sealed holdout answers |
| feature flag、canary percentage | promoter credential |
| Self-Builderのworker prompt | policy engine |
| triage thresholdのcandidate | append-only audit history |

Self-Builder自身も改善できるが、改善対象はworker prompt、tool、routing、failure
taxonomyまでとする。`Promoter`、permission policy、sealed eval、audit writerは
自己編集させない。これは自己改善を止める制限ではなく、改善を判定できる固定座標である。

## 3. Agent graph

### 3.1 Roles

| Node | Authority | May not do |
|---|---|---|
| Signal Collector | read providers、append signals | Issue、code、merge |
| Clusterer | deterministic group/dedupe | code変更、LLM judgment |
| Triage Gate | canonical DB clusterからevents × recency × fixabilityを再計算 | caller申告、implementation、LLM judgment |
| Issue Projector |合格済みclusterをevidence packet付きIssueへ投影 | triage tokenの自己申告、code変更 |
| Eval Builder | reproduction、task、grader、fixture | candidate code、promotion |
| Maker | isolated worktreeで実装 | sealed answers、merge token |
| Checker | tests/evals/security/costを実行 | candidateの書換え |
| Promoter | deterministic policyでmerge/canary/rollback | LLM reasoning |
| Outcome Auditor | deployment後の実metricを比較 | code変更 |
| Meta Improver | Self-Builder worker候補を提案・検証 | immutable kernel |
| Overseer | 別thread常駐・**別model family**でrun eventを監視、逸脱runをcancel | code変更、merge、eval改変 |
| Lineage Archive | 全candidate・evidence・verdictをappend-onlyで保存し、reward hackingを事後検知可能にする | 上書き、削除 |

Overseerは「うまく書けているか」ではなく「**測定器を攻撃していないか**」を見る:
test logの捏造、marker削除、eval改変、prohibited pathへの迂回。DGMはこの2つの
攻撃を実際に起こし、検知できた理由はarchiveのlineageだった。

ソース: [Darwin Gödel Machine](https://sakana.ai/dgm) /
核心の引用: “it removed the markers we use in the reward function to detect hallucination … hacking our hallucination detection function to report false successes”

ソース: [SICA](https://arxiv.org/html/2504.15228v2) /
核心の引用: “may intervene … or in serious cases to cancel the execution … called every 30s by default”

### 3.2 Model routing

Model名はstate machineの意味に含めず、node configurationとして交換可能にする。

| Work | Default worker | Reason |
|---|---|---|
| collect、redact、cluster、dedupe、triage、state claim | deterministic code | privacy、idempotency、spend判断をmodel申告に委ねない |
| Issue要約、failure taxonomy補助 | `gpt-5.6-terra`（optional、advisory only） | 大量処理の補助。gate結果を変更できない |
| reproduction diagnosis、implementation | `gpt-5.6-sol` | Maker。code reasoning中心 |
| semantic Checker | Claude Opus family | Makerと別model familyにしてcorrelated errorとself-preferenceを減らす |
| asynchronous Overseer | Claude Opus familyの別context/thread | Sol runのeval改変・禁止path迂回を監視しcancel |
| deterministic gates | code / GitHub Actions | LLM判定を使わない |

`Opus 5 subagent`というM2/M3 planの記述は、現在Self-Builderを作るimplementation-time
executorを指す。production runtimeの二本目のdev loopではない。

Sol、Terra、Opusを無限loopさせるのではない。各runは一つのstate transitionだけを
claimし、証拠を保存して終了する。次runは外部stateから再開する。

## 4. State machine

Postgresをauthority、GitHub Issue/labelをprojectionとする。GitHubだけを正本に
すると、label更新とworker crashの間でstateが曖昧になるためである。

```text
OBSERVED
  -> CLUSTERED
  -> TRIAGED
  -> REPRODUCED
  -> EVAL_READY
  -> CLAIMED
  -> IMPLEMENTED
  -> VERIFIED
  -> PR_OPEN
  -> CANARY
  -> PROMOTED
  -> MEASURED
  -> LEARNING_RECORDED
```

Failure transitions:

```text
any -> DUPLICATE
any -> QUARANTINED
REPRODUCED -> NOT_REPRODUCIBLE
IMPLEMENTED -> REJECTED
VERIFIED -> REGRESSION
CANARY -> ROLLED_BACK
any active state -> RETRY_WAIT
same failure x3 -> CIRCUIT_OPEN
```

Failure stateからの出口（2026-07-30 amendment: 出口の無いfailure stateは§16の
「bounded retry then circuit open」と矛盾するため明示する）:

| From | To | 条件 |
|---|---|---|
| RETRY_WAIT | 直前のactive state | retry timerの満了。`return_state`をRETRY_WAIT進入時のreceiptに記録し、それ以外へは戻れない |
| CIRCUIT_OPEN | QUARANTINED | 自動。人間可視のqueueへ落とすのみ（自動再開はしない） |
| QUARANTINED | TRIAGED | 明示的なmanual reset receiptがある時のみ |
| DUPLICATE / NOT_REPRODUCIBLE / REJECTED / REGRESSION / ROLLED_BACK / MEASURED後 | terminal | 出口なし。再発は新signalとして入り直す |

### Transition contract

```yaml
transition:
  from: IMPLEMENTED
  to: VERIFIED
  claim:
    worker_id: ...
    lease_expires_at: ...
  required_inputs:
    - candidate_commit_sha
    - reproduction_eval_id
  required_receipts:
    - build_result
    - unit_result
    - integration_result
    - sealed_eval_result
    - policy_scan_result
  idempotency_key: issue_id:candidate_sha:checker_version
```

全transitionは`UPDATE ... WHERE state = expected RETURNING`でclaimする。
Prisma connection pool上のsession advisory lockは使用しない。

## 5. Evidence graph

### 5.1 Signal sources

| Source | Signal | Example improvement |
|---|---|---|
| Life Manager scheduler | timeout、dial failure、retry、claim release | provider recovery、timeout policy |
| Daily preflight | dependency failure taxonomy | integration repair |
| Telegram | explicit feedback、confusion、command failure | UX、tool contract |
| X | mentions、complaints、feature requests | messaging、product issue |
| App Store | review topic、rating delta | bug、onboarding |
| Mixpanel | funnel、retention、ignored nudge | experiment hypothesis |
| Singular | acquisition quality | campaign/content routing |
| Sentry/API logs | exception、latency、error cluster | code regression |
| GitHub Actions | flaky/failing tests | build reliability |
| Writer receipts | publish failure、content outcome | publisher/self-heal |

### 5.2 Common signal envelope

```json
{
  "signal_id": "sig_...",
  "source": "life_manager.scheduler",
  "observed_at": "...",
  "trace_id": "tr_...",
  "run_id": "run_...",
  "tenant_ref": "sha256:...",
  "node": "place_call",
  "tool": "telnyx",
  "status": "error",
  "failure_class": "provider_low_balance",
  "latency_ms": 840,
  "effect_id": "receipt://...",
  "code_version": "...",
  "graph_version": "...",
  "severity": 0.8,
  "payload_ref": "artifact://redacted/...",
  "privacy": {
    "raw_retained": false,
    "redaction_version": "v1"
  }
}
```

2026-07-30 amendment（実装 `apps/life-call/lib/telemetry/envelope.js` との意図的な統一）:
旧`signal_type`は`node`+`tool`+`status`の3 fieldへ分解、旧`effect_ref`は`effect_id`へ改名。
required core = signal_id, source, trace_id, run_id, tenant_ref, node, tool, status,
failure_class, latency_ms, effect_id, code_version, graph_version。
optional extension = severity, payload_ref, privacy。
`code_version`はcluster signature（§5.4のrelease次元）に必須 — これが無いとclusterが
自分の修正を跨いで生き残り、outcome measurementが計算できない。

Raw Telegram、email、calendar、health、location、promptをIssue本文へコピーしない。
Issueにはhash、aggregate、redacted exemplar、artifact referenceだけを載せる。

### 5.3 Trace hierarchy

```text
L0 aggregate  : success/error/cost/latency/outcome
L1 cluster    : signature/count/impact/first-seen/last-seen
L2 exemplars  : representative trace refs
L3 spans      : tool/state/effect evidence
L4 raw        : restricted, redacted, retention-limited
```

Agentへ渡すcontextはL0→L3をdrill-downする。全raw logをcontextへ入れない。

### 5.4 Multi-tenant collection policy

「全ユーザーを読む」か「自分だけを見る」かの二択にしない。全runから軽量な
system evidenceを取り、full contentは必要なtraceだけに限定する。

| Data | Collection |
|---|---|
| success/error counter、latency、cost、release、model/tool version | 全run |
| effect receipt、state transition、policy decision | 全run |
| failure、timeout、security/safety trace | full traceを保持 |
| normal successful trace | tail sampling |
| raw prompt、Telegram、calendar、location、health data | default export禁止 |
| tenant identity | stable pseudonymous hash |
| tenant-specific debug | bounded window、purpose、access log付き |

集計単位は個人名ではなく、`release × graph_version × model × tool × failure_class`
とする。改善Agentにはclusterとredacted exemplarを渡し、任意ユーザーの日常本文を
読ませない。

ソース: [OpenTelemetry AI Agent Observability](https://github.com/open-telemetry/opentelemetry.io/blob/main/content/ja/blog/2025/ai-agent-observability/index.md) /
核心の引用: 「テレメトリーは、評価ツールのインプットとして使用する」

ソース: [OpenTelemetry Tail Sampling](https://github.com/open-telemetry/opentelemetry.io/blob/main/content/ja/blog/2022/tail-sampling/index.md) /
核心の引用: 「必要なのは、適切にサンプリングされたデータです。」

## 6. Data model

Self-Builder専用schemaとDB roleを用意する。

2026-07-30 amendment: 実装は`sb_`接頭辞を正式名とする（`sb_signals` = `improvement_signals`、
`sb_clusters` = `failure_clusters`、`sb_issues` = `improvement_issues`、
`sb_leases` = `worker_leases`、`sb_audit` = `audit_events`）。M1で実装済みはこの5表。
残り（`reproduction_evals`以下）はM3以降で`sb_`接頭辞で追加する。

| Table | Purpose |
|---|---|
| `improvement_signals` | append-only観測 |
| `failure_clusters` | dedupeされたproblem |
| `improvement_issues` | authoritative state、priority、risk |
| `reproduction_evals` | failureを再現するeval |
| `candidate_runs` | Makerのattempt、model、cost、SHA |
| `verification_runs` | visible/sealed/security/cost結果 |
| `deployment_canaries` | cohort、start/end、rollback |
| `outcome_measurements` | baseline/candidate実metric |
| `learning_receipts` | 予測、変更、結果、再発率 |
| `worker_leases` | claim、expiry、heartbeat |
| `policy_decisions` | allow/deny理由 |
| `audit_events` | append-only transition history |

### Priority

```text
priority =
  expected_user_impact
  × confidence
  × recurrence
  × reversibility
  / estimated_cost
  / risk
```

Scoreだけで自動昇格しない。最低impact、reproduction可能性、allowlisted classを
hard gateにする。

## 7. Issue factory

### 7.1 何をIssueにするか

| Candidate | Action |
|---|---|
| 同じfailure signatureが閾値以上再発 | Issue |
| severityが高く一回でも再現可能 | Issue |
| product metricがbaselineから有意悪化 | experiment Issue |
| 一件の曖昧な要望 | backlog clusterへ追加 |
| raw logだけで再現不能 | evidence待ち |
| safety/security/permission変更 | quarantine |

### 7.2 GitHub Issue contract

```yaml
title: "[LM-AUTO][failure_class] observable symptom"
labels:
  - lm-auto:reproduced
  - risk:low
  - source:scheduler
evidence:
  cluster_id: ...
  trace_refs: [...]
  affected_runs: ...
  recurrence: ...
  user_impact: ...
reproduction:
  eval_id: ...
  command: ...
  baseline_result: fail
expected: ...
actual: ...
scope:
  allowed_paths: [...]
  prohibited_paths: [...]
acceptance:
  deterministic: [...]
  sealed: [...]
rollback:
  type: revert_commit
```

一Issue一PRとする。Issueの`out_of_scope`を必須にしてscope creepを防ぐ。

## 8. Eval factory

Eval BuilderはIssueを作る前または直後に、failureを固定する試験を作る。

```text
trace exemplar
  -> remove PII/secrets
  -> extract tool/state contract
  -> create fixture
  -> run baseline
  -> baseline must fail for expected reason
  -> seal grader/answers
  -> publish eval_id, not sealed content, to Maker
```

### Eval layers

| Layer | Gate |
|---|---|
| Reproduction | baselineが同じfailureで失敗 |
| Unit | local behavior |
| Integration | DB/API/provider contract |
| Real E2E | 実副作用とreceipt |
| Sealed holdout | visible testへの過適合 |
| Security/policy | permission、secret、PII |
| Cost/latency | resource regression |
| Outcome | user/business metric |

LLM judgeはsemantic qualityの補助に使えるが、唯一のpromotion gateにはしない。
Makerはsealed evalのanswer、Checkerのcredential、production metric queryへ
アクセスできない。

### Ordering invariant（自動mergeを合法にする唯一の制約）

```text
eval frozen (eval_id + sealed grader + version)
  -> THEN Maker sees the Issue
```

Evalは **Makerがissueを読む前に凍結され、required status checkとして登録される**。
この順序が2つの問題を同時に殺す:

| 問題 | この順序が消す理由 |
|---|---|
| Maker が自分の採点器を書く循環 | 採点器はMaker起動前に確定・封印済み |
| criteria drift（直したい失敗からevalを作る循環） | freeze + version + holdout sliceでの再検証を強制 |
| 自動mergeの正当性 | 受理述語がGitHub required checkに落ち、branch protectionの標準機能で執行できる |

ソース: [EvalGen](https://arxiv.org/abs/2404.12272) /
核心の引用: “criteria … dependent on the specific LLM outputs observed”

Evalをrequired checkに昇格できないIssue classは、**merge問題ではなくcanary問題**として
扱い、自動mergeの対象から外す。

### Pre-spend triage gate（Sentry Seer 準拠）

| Gate | 閾値 | 理由 |
|---|---|---|
| 再現回数 | 同一cluster ≥ N events | 1回のnoiseにworkerを起動しない |
| 鮮度 | 直近 14 日以内 | 消えた失敗を直さない |
| 機械採点可能性 | fixability score が閾値以上 | 再現evalを書けないものはIssue止まり |

ソース: [Sentry Seer](https://docs.sentry.io/product/ai-in-sentry/seer/autofix/) /
核心の引用: 自動起動は “10 events” × “within 14 days” × fixability score

## 9. Maker loop

```text
claim highest-priority EVAL_READY issue
  -> create .worktrees/lm-auto-<issue-id>
  -> read issue + non-sealed eval
  -> write failing characterization/regression test
  -> implement smallest change
  -> run scoped tests
  -> commit
  -> open PR
  -> release lease
```

### Ralph-style local loop

```text
read issue state
-> implement
-> test
-> update durable receipt
-> repeat
```

| Stop condition | Result |
|---|---|
| all scoped tests pass | Checkerへ |
| same error 3 times | `CIRCUIT_OPEN` |
| no progress 3 attempts | `QUARANTINED` |
| budget exceeded | `RETRY_WAIT` |
| prohibited path touched | hard reject |
| permission/schema/security change detected | quarantine |

Agentの`done`発言ではstateを進めない。commit SHAとtest receiptだけが
`IMPLEMENTED` transitionを起こす。

## 10. Checker and automatic promotion

### Checker

Makerとは別checkout、別context、**別model family**で次を実行する。同family adversaryは
context汚染を消すがself-preference biasを消さない。

ソース: [Self-preference bias](https://arxiv.org/abs/2404.13076) /
核心の引用: “a linear correlation between self-recognition capability and the strength of self-preference bias”

最終的なPASS/FAILを言えるのは **non-LLM signal のみ**（reproduction eval、differential test、
security scan、cost計測、canary metric）。LLM judgeはsemantic補助に限定する。

```text
clean checkout candidate SHA
-> build
-> unit/integration
-> reproduction now passes
-> sealed holdout
-> security/policy scan
-> cost/latency comparison
-> PR diff scope check
```

### Automatic merge contract

```yaml
auto_merge_if:
  issue_class: allowlisted
  risk: low
  reproduction_baseline: fail
  reproduction_candidate: pass
  required_checks: pass
  sealed_holdout_delta: ">= 0"
  security_regression: false
  sensitive_paths_touched: false
  permissions_expanded: false
  migration_added: false
  cost_delta_percent: "<= 10"
  rollback_ready: true
  lineage_complete: true
then:
  merge: true
  deploy: canary
else:
  merge: false
  state: QUARANTINED_OR_REJECTED
```

実装形態は独自mergerではなく **GitHub native auto-merge + branch protection**。
`auto_merge_if` の各条件は required status check として表現し、checkが揃った時だけ
GitHubがmergeする。Self-Builderはmerge buttonを持たず、checkを出す側に留まる。

ソース: [GitHub auto-merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request) /
核心の引用: “merges a pull request automatically after all required reviews and status checks pass”

### 業界の現在地（隠さない）

| Tier | 実例 | 自動merge |
|---|---|---|
| 依存更新 | Renovate / GitHub native | ★ 実運用されている（lockFileMaintenance等の最低risk class） |
| semantic code fix | Sentry Seer / CodeMender / CodeRabbit | ★ **どのvendorもやっていない**。Seerの上限は `Stop after PR Drafted`、CodeMenderは “only surfacing for human review” |
| 全自律 | [Hivemoot/Colony](https://github.com/hivemoot/colony) のみ | やっている。ただしtoy scale、governance botがmerge権限を持つ設計 |

したがって `LM-SB-13` の live-enable は業界標準の踏襲ではなく**未踏領域**である。
最初の対象は「reproduction evalをrequired checkに昇格できたclass」だけに限定する。

初期auto-merge allowlist:

| Allowed | Not auto-merged |
|---|---|
| localized bug fix | auth、billing、wallet |
| retry/timeout within cap | DB migration |
| tool contract parser | permission expansion |
| non-sensitive prompt/skill | SAFE-T policy |
| observability instrumentation | secret handling |
| deterministic test/fixture | promoter/policy kernel |

## 11. Canary and outcome

Code correctnessだけでなく、実際のLife Manager outcomeを見る。

```text
merge
-> feature flag / small cohort
-> watch error, latency, cost, user outcome
-> stable: expand
-> worse: rollback
-> compare prediction vs observed result
-> learning receipt
```

### Learning receipt

```json
{
  "issue_id": "...",
  "prediction": "telegram_reply_timeout decreases by 50%",
  "candidate_sha": "...",
  "baseline_window": "...",
  "canary_window": "...",
  "observed_delta": -0.63,
  "side_effects": {
    "cost_delta": 0.02,
    "latency_delta": -0.08
  },
  "decision": "promote",
  "recurrence_check_at": "..."
}
```

各変更を「このmetricがこの方向へ動く」という反証可能な契約にする。

## 12. Self-Builder improves itself

Self-Builderのmeta-loopは、次の自身のmetricsを観測する。

| Metric | Bad signal | Candidate improvement |
|---|---|---|
| Issue precision | NOT_REPRODUCIBLE率が高い | cluster threshold、evidence要求 |
| Fix success | Checker reject率が高い | Maker context、tool、model routing |
| Rollback rate | canary悪化 | holdout、risk classifier |
| Recurrence | 同failure再発 | fixture、root-cause depth |
| Cycle time | state滞留 | lease、parallel node、tool latency |
| Cost per promoted fix | cost増 | Terra/Sol routing、context圧縮 |
| Noise backlog | duplicate増 | signature、dedupe |

Meta changeも通常のcandidateとして扱う。

```text
Self-Builder trace
-> meta failure cluster
-> replay dataset
-> candidate worker configuration
-> shadow runs
-> baseline/candidate comparison
-> canary worker pool
-> promote or rollback
```

Self-Builderは自分のimmutable kernelを直接変更しない。Kernel変更candidateは
shadow control planeでreplayし、旧Promoterが昇格判定する。

## 13. Integration with the current codebase

### Measured current assets

| Asset | Reuse |
|---|---|
| `apps/life-call/scheduler.js` | loop/node instrumentation point |
| `apps/life-call/inngest/functions.js` | 6 durable functionsのexisting graph |
| `apps/life-call/test/inngest.test.js` | Inngest route、retry、tenant dispatchのcontract |
| `forEachUserSafe` | tenant failure isolation |
| claim/release wake ledger | idempotency pattern |
| `apps/life-call/lib/feature-discovery.js` | durable throttle pattern |
| `apps/life-call/lib/daily-preflight.js` | failure taxonomy、timeout、redaction、evidence |
| mobile nudge feedback | product outcome input |
| in-app feedback log | explicit user signal |
| agent feedback route | external platform signal |
| transitive OTel packages | direct dependency・bootstrapではない。標準化のstarting pointだけ |
| Writer receipts/holdout/revert | promotion pattern |

### Measured remaining gaps

| Gap | Current implementation boundary |
|---|---|
| 共通trace/effect envelopeはM1で入ったが、本番export/readbackがない | `LM-SB-18`: OTel SDK/Collector bootstrap + semantic attributes |
| Feedback、error、outcomeが各providerに分散 | `LM-SB-18`: tenant-safe source connectors |
| Failure cluster store/state/leaseはM1で入ったが、M2のingestion/cluster/Issue pathは未accept | `M2-REVIEW-FIX` → `LM-SB-04/05/16/06` |
| eventからstateを進めるSelf-Builder runtime graphがない | `LM-SB-19`: Inngest orchestrator + reconciler |
| GitHub PR/merge runtime pathがない | `LM-SB-08/09/10`: Maker + Checker + deterministic Promoter |
| Automated eval生成がない | `LM-SB-07`: reproduction fixture builder + sealed eval |
| Outcome lineageがない | `LM-SB-14/11`: archive + signal→Issue→SHA→deploy→metric IDs |

## 14. Runtime topology

単一推奨:

```text
VPS / OpenClaw
  ├─ Product plane: Life Manager runtime
  └─ Observer: telemetry exporter only

Self-Builder runner
  ├─ Orchestrator: state claims and dispatch
  ├─ Maker: Codex Sol
  ├─ Advisory summarizer: Codex Terra（optional）
  ├─ Checker / Overseer: Claude Opus family
  ├─ Final authority: deterministic policy / tests
  ├─ isolated git worktrees
  └─ no production secret access

GitHub
  ├─ Issues/labels: projection
  ├─ PRs
  ├─ Actions: deterministic checks
  └─ protected main + auto-merge

Postgres
  └─ authoritative improvement state and audit
```

Triggerはevent-firstとする。新しいsignal、CI failure、deployment outcomeがstateを
進める。定期reconcilerはstuck lease、missed event、canary timeoutだけを修復する。

## 15. Implementation TODO

### 15.1 M2 acceptance blockers

M2の202/202 tests、Postgres 47 ok、`apps/life-call` diff空はbaseline evidenceであり、
acceptanceではない。fresh reviewerが実測した次の穴を全部閉じるまで
`LM-SB-04/05/06/16`をDONEにしない。

| Finding | Required correction | Acceptance proof | Status |
|---|---|---|---|
| C1 | Issue create成功後に`sb_issues.github_issue_number`をDBへ永続化し、projection/reconcileの唯一のauthorityにする | 同じproduction clusterを複数回処理してGitHub Issue exact1。#379/#380/#381型の重複を再現testが防ぐ | TODO |
| I1 | projectorがcanonical DB clusterから`events × recency × fixability`を再計算する | callerが`{gate:true, fixability:1.0}`を偽装してもworker/`gh` call 0 | TODO |
| I2 | adapter/projectorのnever-throw契約を全terminal pathで守る | malformed/provider failureがthrowせずclosed `errors` resultになる | TODO |
| I3 | PII security rejectを通常skipと別channelにする | `rejected_security`がalert/auditされ、skip metricに埋もれない | TODO |
| I4 | `effect_id`へcharset、scheme、最大長、secret/identity denyを入れる | raw chat id、username、JWT、URL、5000字を全拒否 | TODO |
| I5 | Issue bodyの自由文字列を廃止する | versioned schemaのhash、aggregate、validated exemplar、artifact ref以外はrender不能 | TODO |
| I6 | exemplarをIssue化直前に同じredaction gateで再検証する | stored exemplarがtamperされてもIssue/`gh` call 0 | TODO |
| I7 | `findPii`の実測穴を塞ぐ | `chat_id 123456789`、romaji住所、URL path、identifier fixtureを全拒否 | TODO |

reviewerが肯定した`retry_return_state` column、`RETRY_WAIT -> '*'` wildcard、
M1 moduleのobject-identity再利用は維持する。fix後はfresh reviewerの`PASS`、
full test、Postgres、実GitHub exact1、branch mergeを一つのacceptance unitとする。

### 15.2 Ordered end-to-end plan

**順序の正本はこの表だけ**である。ID番号ではなく`Order`列の順に実行し、
Phaseを飛ばさない。特に`LM-SB-13` live-enableは最後である。

| Order | ID | Milestone | Task | Done condition | Status |
|---:|---|---|---|---|---|
| 1 | LM-SB-01 | M1 kernel | immutable policyとauto-merge allowlist | policy fixtureがallow/denyを再現 | ★ DONE。`3c6b3f16d` |
| 2 | LM-SB-02 | M1 kernel | common trace/effect envelope | 5既存loopが同一schemaをemit | ★ DONE。41/41、full 674/674 |
| 3 | LM-SB-03 | M1 kernel | Postgres state、RLS、lease、idempotency | 実Postgres transition/lease/RLS tests pass | ★ DONE。79/79 + integration PASS |
| 4 | M2-REVIEW-FIX | M2 acceptance | §15.1 C1/I1/I2-I7をTDD修正 | fresh reviewer PASS + full/Postgres/E2E exact1 | TODO。現在のblocker |
| 5 | LM-SB-04 | M2 eyes | 6 source adapter + single redaction gateをaccept/merge | 6 sourceがPII無し`sb_signals`へ変換 | WITH FIXES candidate `68938bdc8` |
| 6 | LM-SB-05 | M2 eyes | cluster/dedupe/priorityをaccept/merge | replay datasetでprecision/recall実測 | WITH FIXES candidate `af1e230d8` |
| 7 | LM-SB-16 | M2 eyes | pre-spend triage gateをaccept/merge | 閾値未満と偽caller tokenでworker/`gh` call 0 | WITH FIXES candidate `af1e230d8` |
| 8 | LM-SB-06 | M2 eyes | DB-authoritative Issue projectorをaccept/merge | 同一cluster→Issue exact1、label reconcile、PII 0 | WITH FIXES candidate `49094929f` |
| 9 | LM-SB-18 | Production observability | OpenTelemetry Collector、Langfuse、Sentry、feedback/metric connectorsを本番配線 | wake/ask/travel/CI/Sentry/Telegram/X/App Store/Mixpanelからtenant-safe signalとtrace readback | TODO |
| 10 | LM-SB-19 | Durable graph | Inngest event-driven control graphとstuck-state reconcilerを配線 | eventがstateを一段だけ進め、crash後resume、二重claim 0 | TODO |
| 11 | LM-SB-07 | M3 eval | reproduction Eval Factory | baselineが同じ理由でFAIL、sealed evalをMaker前にfreeze | TODO。plan `f4db07bb2` |
| 12 | LM-SB-08 | M3 Maker | Sol dispatcher + isolated worktree | 一Issue→一worktree→一commit→一draft PRを実E2E | TODO |
| 13 | LM-SB-09 | M3 Checker | Opus-family independent Checker | 別checkout/context/family、sealed/policy/cost gates pass | TODO |
| 14 | LM-SB-14 | Safety | append-only Lineage Archive | evidence/verdict/diffをreplayでき、marker削除・log捏造を検知 | TODO |
| 15 | LM-SB-15 | Safety | Opus-family asynchronous Overseer | prohibited path/eval改変runを別threadから自動cancel | TODO |
| 16 | LM-SB-10 | Deployment | deterministic canary/promote/rollback | deliberate bad candidateが自動rollback、LLMはmerge判断不能 | TODO |
| 17 | LM-SB-11 | Outcome | outcome auditor + learning receipt | signal→Issue→SHA→deploy→product outcome lineage完成 | TODO |
| 18 | LM-SB-12 | Meta | Self-Builder worker shadow pool | worker prompt/tool/routing candidateを旧kernelがheld-out判定 | TODO |
| 19 | LM-SB-20 | Shadow proof | production read-only shadow soak | 10 consecutive eligible clustersでduplicate/PII/policy incident 0、cost cap内 | TODO |
| 20 | LM-SB-17 | Cutover | 旧Luna prototypeを削除 | 旧2 LaunchAgent、installer、producer、consumer、専用guard 0。historical ledgerだけread-only保存 | TODO。今は削除しない |
| 21 | LM-SB-13 | Live | low-risk allowlistだけhuman-free live-enable | 10 consecutive promoted fixes、rollback有効、policy/PII incident 0 | TODO。最終工程 |

最初のlive対象は、既知failure class、deterministic reproduction、rollback可能、
低risk pathの全条件を満たすものに限定する。人間がIssueを作らなくてもobservability
signalから始まるが、人間が追加したIssue/feedbackも同じgateを通して入力できる。

## 16. Verification matrix

| Failure injected | Expected system behavior |
|---|---|
| Same signal delivered twice | one cluster、one Issue |
| Worker dies after claim | lease expiry後にresume |
| Maker says done without SHA | transition denied |
| Maker changes auth path | policy reject |
| Candidate passes visible only | sealed eval reject |
| Canary error rises | automatic rollback |
| GitHub label edited manually | DB authorityからreconcile |
| Provider times out | bounded retry then circuit open |
| Raw PII enters signal | redaction gate reject |
| Caller claims `gate:true` without canonical triage | gateを再計算してdeny、worker/`gh` call 0 |
| `effect_id` contains chat id/JWT/URL/oversized text | security reject + audit |
| Maker and Checker use the same model family | Checker launch denied |
| Promoter unavailable | no merge、safe retry |
| Self-Builder candidate edits kernel | shadow-only、direct promotion denied |
| Legacy dev/self-build LaunchAgent or installer remains at cutover | `LM-SB-17` fail、live-enable denied |

## 17. Operating metrics

| Category | Metric |
|---|---|
| Product | user outcome、retention、task completion |
| Reliability | recurrence、MTTR、rollback rate |
| Development | issue→PR、PR→canary、promotion rate |
| Eval | reproduction rate、false pass、holdout regression |
| Safety | policy deny、secret/PII incident |
| Economy | cost per verified fix、cost per promoted improvement |
| Meta | Self-Builder candidate win rate |

「commit数」「Issue数」「Agent稼働時間」を成功metricにしない。活動量は改善ではない。

## 18. Public narrative contract

記事、発表、demoは同じ一件のfailureを追う。

```text
wake callがprovider timeoutで届かない
-> OpenTelemetry trace + effect receipt
-> redacted failure cluster
-> reproduction eval（baseline FAIL）
-> evidence付きGitHub Issue
-> Solがisolated worktreeで最小修正
-> independent Checker + sealed holdout
-> low-risk canary
-> outcome改善ならpromote、悪化ならrollback
-> learning receipt
```

説明順は`Observability -> Eval -> Graph -> Loop`とする。これは実行順でもある。
概念の列挙やmodel比較から始めない。最初にfailureとユーザー影響を見せ、四つの
engineeringをそのfailureを直す器官として導入する。

| Public claim | Allowed wording |
|---|---|
| 現在 | Life Managerにはdurable product loopsと検証資産がある |
| 今回の設計 | Self-Builderのtarget architectureと実装順を確定し、M1をmerge、M2をreviewで差し戻した |
| まだ言わない | Life Managerがproductionで自分のcodeを自動mergeしている |
| 最初のdemo | synthetic provider timeoutをIssue→candidate→Checkerまで通す |
| 最初のlive enable | `LM-SB-13`のdone条件を満たした低risk allowlistだけ |

## 19. Best / Base / Worst

| Scenario | Expected result |
|---|---|
| Best | 既知failureと低risk改善の大半がIssue→merge→outcomeまで無人化し、再発率が継続低下 |
| Base | 観測・Issue・candidate PRは広く自動化し、低riskだけ自動merge、高riskはquarantine |
| Worst | proxy metricとnoise Issueを最適化し、rollbackが増え、Self-Builder costがproduct valueを超える |

### Rejected strongest alternative

単一のSol Agentへ長期goal、GitHub token、production accessを渡し、同じsessionで
Issue作成・実装・eval・mergeをさせる方が短期の構築速度は最も速い。

棄却理由は、同一主体が問題、解答、採点、昇格を所有すると、失敗時に独立した
ground truthがなくなるためである。resume、audit、credential isolationも弱くなる。

### Base case として設計に織り込む失敗

reward hackingは例外事象ではなく既定挙動として扱う。先行例で実際に起きたのは
「codeを直さず測定器を直す」である。Prompt強化では防げない。防いだのは
append-only lineageと、agentが書けない場所にあるnon-LLM ground truthだけである。

| 攻撃 | 実例 | 本設計の防御 |
|---|---|---|
| test logの捏造 | [DGM](https://sakana.ai/dgm) | commit SHA + Checker側の再実行のみをtransition条件にする（§9） |
| hallucination detector自体の削除 | [DGM](https://sakana.ai/dgm) | detector/policy/sealed evalをimmutable kernelへ（§2）+ Lineage Archiveで事後検知 |
| visible evalへの過適合 | [SICA §5.1](https://arxiv.org/html/2504.15228v2) | sealed holdout + freeze-before-fix順序（§8） |
| benchmark memorization | [arXiv 2506.12286](https://arxiv.org/abs/2506.12286) | 自repoのproduction traceからevalを作る（外部benchmarkに依存しない） |
| judgeの自己贔屓 | [arXiv 2404.13076](https://arxiv.org/abs/2404.13076) | Checkerは別model family、最終PASSはnon-LLM signalのみ |

### Most likely way this architecture is wrong

自分が間違うとしたら最有力の筋は、Postgres authorityとGitHub projectionの二重状態が
運用負荷を増やし、GitHub-native durable workflowだけで十分な規模に留まる場合である。
この反証は、reconciliation failure率とstate recovery時間を実測して判断する。
