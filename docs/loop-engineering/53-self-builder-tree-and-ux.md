# Self-Builder: 理想 folder tree と 無人 UX

設計正本: `51-life-manager-builds-life-manager.md`（決定）
Evidence: `52-prior-art-self-improving-loops.md`
この文書: **どこに何を置くか** と **人間が寝ている間に何が起きるか** の絵。

---

## 1. 理想 folder tree

現状 M1 まで実装済みのものに ★、M2 以降で追加するものに ☐ を付ける。

```text
anicca-project/
├── apps/
│   ├── life-call/                          ← PRODUCT PLANE（顧客機能。merge tokenを持たない）
│   │   ├── scheduler.js                    ★ emit: wake claim / dial
│   │   ├── server.js
│   │   ├── inngest/functions.js               既存6 durable function = graph実体
│   │   ├── lib/
│   │   │   ├── telemetry/                  ★ ここがProduct→Self-Builderの唯一の出口
│   │   │   │   ├── envelope.js             ★ §5.2 schema + PII/生tenant拒否
│   │   │   │   ├── emitter.js              ★ fail-open。JSONL sink（後でOTLPに差替）
│   │   │   │   └── otlp-exporter.js        ☐ OTel Collectorへ
│   │   │   ├── daily-preflight.js          ★ emit: 依存failure taxonomy
│   │   │   ├── ask.js                      ★ emit: reply / 失敗path
│   │   │   ├── travel.js                   ★ emit: route失敗（実outcome由来）
│   │   │   └── feature-discovery.js        ★ emit: discovery
│   │   ├── migrations/                        product schema（lm_*）
│   │   └── eval/                              既存 product eval（calendar/late/score）
│   │
│   └── self-builder/                       ← CONTROL PLANE（別credential・別process）
│       ├── package.json                    ★ 依存ゼロ（node:testのみ）
│       ├── policy/                         ★ LM-SB-01
│       │   ├── policy.js                   ★ immutable kernel + auto-merge allowlist
│       │   ├── evaluate.js                 ★ 純関数 candidate → {merge, reasons}
│       │   ├── sensitive-paths.js          ★ allowlist + denylist 両建て
│       │   └── evaluate.test.js            ★ 32 fixtures（§10表と1:1 + git ls-files walk）
│       ├── migrations/                     ★ LM-SB-03
│       │   ├── 2026-07-30-self-builder-core.sql      ★ sb_signals/clusters/issues/leases/audit/transitions
│       │   └── ...rollback.sql             ★
│       ├── state/                          ★
│       │   ├── transitions.js              ★ 合法遷移をdataで持つ（SQL seedとparity test）
│       │   ├── lease.js                    ★ claim/expiry/resume + cluster signature
│       │   └── schema.test.js              ★ 「DECLARES」系（挙動はintegrationで）
│       ├── collect/                        ☐ LM-SB-04
│       │   ├── adapters/                   ☐ 1 source = 1 adapter（後述§2の表）
│       │   │   ├── telemetry-jsonl.js      ☐
│       │   │   ├── lm-wake-log.js          ☐
│       │   │   ├── lm-ask-log.js           ☐
│       │   │   ├── sentry.js               ☐
│       │   │   ├── telegram-feedback.js    ☐
│       │   │   ├── mixpanel-outcome.js     ☐
│       │   │   ├── app-store-reviews.js    ☐
│       │   │   └── github-actions.js       ☐
│       │   └── redact.js                   ☐ 全adapterが通る唯一のgate
│       ├── cluster/                        ☐ LM-SB-05
│       │   ├── signature.js                ☐ release × graph_version × model × tool × failure_class
│       │   ├── priority.js                 ☐ 影響 × 頻度 × 確実性
│       │   └── triage-gate.js              ☐ LM-SB-16 events≥N × 14日 × fixability
│       ├── issue/                          ☐ LM-SB-06
│       │   ├── projector.js                ☐ DB authority → GitHub Issue/label
│       │   └── reconcile.js                ☐ 手編集labelをDBから復元
│       ├── eval-factory/                   ☐ LM-SB-07
│       │   ├── fixture-builder.js          ☐ trace → 再現fixture
│       │   ├── seal.js                     ☐ ★ Makerが読む前に凍結 + version
│       │   └── register-check.js           ☐ ★ eval_id → GitHub required status check
│       ├── maker/                          ☐ LM-SB-08
│       │   ├── dispatcher.js               ☐ 1 issue = 1 worktree = 1 PR
│       │   └── worktree.js                 ☐ .worktrees/lm-auto-<issue-id>/
│       ├── checker/                        ☐ LM-SB-09（別model family）
│       │   ├── run-gates.js                ☐ build/unit/integration/sealed/security/cost
│       │   └── verdict.js                  ☐ 最終PASSはnon-LLM signalのみ
│       ├── promoter/                       ☐ LM-SB-10
│       │   ├── canary.js                   ☐ flag + cohort
│       │   └── rollback.js                 ☐
│       ├── outcome/                        ☐ LM-SB-11
│       │   ├── auditor.js                  ☐ baseline vs candidate 実metric
│       │   └── learning-receipt.js         ☐ 予測/変更/結果/再発率
│       ├── overseer/                       ☐ LM-SB-15
│       │   └── watch.js                    ☐ 別thread・別model・cancel権限（SICA型）
│       ├── archive/                        ☐ LM-SB-14
│       │   └── lineage.js                  ☐ append-only。reward hackingの事後検知
│       └── test/postgres/                  ★ 実DBで挙動を実行して確かめる層
│
├── .github/workflows/
│   ├── self-builder.yml                    ★ apps/self-builder/** で npm test + test:postgres
│   ├── life-call-eval.yml                     既存
│   └── sb-required-checks.yml              ☐ 自動生成evalをrequired checkとして走らせる
│
├── docs/loop-engineering/
│   ├── 51-...-life-manager.md              ★ 設計正本（決定）
│   ├── 52-prior-art-...md                  ★ evidence
│   └── 53-self-builder-tree-and-ux.md      ★ この文書
└── docs/superpowers/plans/                 ★ milestone毎のplan（執行）
```

置き場所の原則は1つだけ。

| 層 | 置く場所 | 持たないもの |
|---|---|---|
| Product | `apps/life-call/` | GitHub merge token、self-builder DB write権限 |
| Control | `apps/self-builder/` | production secret、顧客データのraw |
| 決定 | `docs/loop-engineering/5x` | 実装詳細 |
| 執行 | `docs/superpowers/plans/` | 決定の変更 |

---

## 2. どのログから bug を見つけるか（実在するものだけ）

`apps/life-call/migrations/*.sql` に実在する表と、M1で入れた telemetry が入力になる。

```text
   PRODUCT が既に書いているもの              SELF-BUILDER が読むもの
   ──────────────────────────              ────────────────────────
   lm_wake_log        起床call結果       ┐
   lm_ask_log         Q&A・reply失敗     │
   lm_travel_log      移動notice          │
   lm_api_cost        provider毎cost      ├──→ adapters/ ──→ redact.js ──→ sb_signals
   lm_score_outcomes  panel score        │        （1 source        （唯一のPII gate）
   lm_panel_command_receipts 実行receipt │         = 1 adapter）
   lm_stripe_events   課金               │
   telemetry JSONL/OTLP （★M1で新設）    ┘
   Sentry exception / GitHub Actions / Telegram feedback / Mixpanel / App Store review
```

★ 重要な非対称: **product は「自分が失敗した」と言えない**。`lm_wake_log` に
`status=done` と書いてあっても電話は鳴っていないことがある。だから
`effect_id`（receipt）と `status` を envelope で分離した。self-builder が信じるのは
receipt であって agent の自己申告ではない。

---

## 3. 無人 UX — 人間が寝ている 7 時間に何が起きるか

```text
07:00  ┌────────────────────────────────────────────────────────────┐
       │ PRODUCT: wake call。scheduler=DONE、provider=TIMEOUT、電話鳴らず │
       └───────────────────────────┬────────────────────────────────┘
                                   │ emit envelope
                                   │ {node:place_call, tool:telnyx,
                                   │  status:failure, failure_class:provider_timeout,
                                   │  effect_id:null, code_version:rel-42}
                                   ▼
07:00  OBSERVED     sb_signals にappend（redact通過。生の電話番号もemailも入らない）
                                   │
07:05  CLUSTERED    signature = rel-42 × lm-v4 × telnyx × provider_timeout
                    同じsignatureが既にあれば +1（新Issueは作らない = dedupe）
                                   │
       ┌───────────── TRIAGE GATE（LM-SB-16。ここで大半が止まる）─────────────┐
       │  events ≥ N ?    14日以内 ?    機械採点できる ?                      │
       │      NO → 記録だけして終了（worker起動なし = 課金ゼロ）               │
       └───────────────────────────┬────────────────────────────────────────┘
                                   │ YES
07:10  REPRODUCED   trace → fixture。baseline を走らせ **同じ理由で落ちる**ことを確認
                    落ちなければ NOT_REPRODUCIBLE（＝直す対象ではない）
                                   │
07:12  EVAL_READY   ★ grader を封印し eval_id を発行 → GitHub required check に登録
                    ★★ この順序が全て: Maker はまだ issue を見ていない ★★
                                   │
07:15  CLAIMED      Maker が lease を取り .worktrees/lm-auto-<id>/ を作る
                    Maker が読めるもの: issue本文 + 非sealed eval
                    読めないもの: sealed answer / checker credential / production metric
                                   │
07:40  IMPLEMENTED  commit SHA が出て初めて state が進む（"done" 発言では進まない）
                                   │
07:45  VERIFIED     Checker（別checkout・別context・**別model family**）が
                    build / unit / integration / sealed holdout / security / cost を実行
                    最終 PASS を言えるのは non-LLM signal のみ
                                   │
07:50  PR_OPEN      policy evaluate() が required check として結果を出す
                    受理述語が全部checkとして揃った時だけ GitHub native auto-merge
                                   │
07:55  CANARY       feature flag で小cohort。error/latency/cost/user outcome を監視
                    悪化 → ROLLED_BACK（自動）
                                   │
09:00  MEASURED     baseline vs candidate の実metric比較
                                   │
09:05  LEARNING_RECORDED
                    receipt: 「provider_timeout の再発率 4.2% → 0.3%、cost +1.1%、
                              予測と実測の差 -0.4pt」
                    Lineage Archive に append-only で保存（後から再生可能）
```

人間が朝見るのは**この receipt 1枚**だけ。承認は求められない。

失敗経路も無人で閉じる。

```text
Maker が同じerrorで3回失敗   → CIRCUIT_OPEN → QUARANTINED（人間可視queueへ）
Worker が claim後に死ぬ      → lease expiry → 別workerがresume
同じsignalが二重配送         → 1 cluster / 1 Issue（idempotency key）
Maker がauth pathを触った    → policy reject（allowlist外は即deny）
candidate がvisible evalのみ通過 → sealed holdoutでreject
canary でerror上昇           → 自動 rollback
Maker が測定器を改変しようとした → Overseer が run を cancel（別model・別thread）
```

---

## 4. Observability / Eval / Graph / Loop の役割分担（ASCII）

四つは別concept でなく、同じ体の器官である。

```text
        ┌──────────────────────── LOOP（継続） ────────────────────────┐
        │                                                              │
        │   OBSERVABILITY          EVAL              GRAPH             │
        │   「感じる」              「採点する」        「分岐する」       │
        │                                                              │
        │   何が起きたか        直ったと言えるか     次にどこへ行くか      │
        │   ─────────         ──────────       ──────────       │
        │   trace_id で run     baseline FAIL      state machine       │
        │   を1本に繋ぐ          candidate PASS     + receipt          │
        │   effect receipt で   sealed holdout     + 失敗時の戻り先     │
        │   「本当に起きた」を    security/cost      + resume           │
        │   証明する             canary outcome                        │
        │        │                    │                  │             │
        │        └────────┬───────────┴──────────┬───────┘             │
        │                 ▼                      ▼                     │
        │        「これは直す価値がある」   「この候補は昇格してよい」        │
        │                 └──────────┬───────────┘                     │
        │                            ▼                                 │
        │                   実世界の outcome を測る                      │
        │                            │                                 │
        └────────────────────────────┴─────────────────────────────────┘
                                     │
                          measure → observe に戻る
                     ★ loop が閉じるのは merge ではなく outcome ★
```

一つ抜けると何が壊れるか。

| 抜けるもの | 起きること |
|---|---|
| Observability | 何が壊れたか分からない。推測で直す |
| Eval | 直った証拠がない。PR数が成功metricになる |
| Graph | error・改善案・security を同じ経路に流す。crash後に再開できない |
| Loop | 一度直して終わり。次の失敗から学ばない |

そして **Graph の中に Loop がある**（`retry → verify` は graph の cycle）。
cron は trigger でしかなく、graph ではない。

```text
   CRON（trigger）                    GRAPH（state + receipt + 分岐）
   ─────────────                    ────────────────────────────
   3時間毎に agent を呼ぶ              現在どのstateか（DBに永続）
   結果は log に流れて消える            次へ進むには何のreceiptが必要か
   crash したら次のtickまで空白         失敗したらどこへ戻るか
   分岐がない                          crash後にleaseから再開する
```

---

## 5. 自己改善と自己編集の境界

```text
   ┌─── MUTABLE（Self-Builderが変えてよい）───┐  ┌─── IMMUTABLE KERNEL ───┐
   │ allowlisted product code paths           │  │ goal / constitution     │
   │ prompt / skill / tool description        │  │ secret store            │
   │ retry / routing / context selection      │  │ branch protection       │
   │ test / fixture / 非sealed eval           │  │ sealed holdout answers  │
   │ feature flag / canary percentage         │  │ promoter credential     │
   │ Self-Builder自身のworker prompt          │  │ policy engine           │
   │ triage閾値の候補（shadowで検証）           │  │ append-only audit       │
   └──────────────────────────────────────────┘  └─────────────────────────┘

   ★ 目的・採点器・昇格権を自己編集させると、問題・解答・採点・昇格が
     同一主体になる。DGMは実際に検知markerを削除した（52-prior-art §3）。
     No-Human-Loop = bounded human-free execution であって、
     「AIが自分のルールも書き換える」ではない。
```

---

## 6. 現在地（2026-07-30）

| 層 | 状態 |
|---|---|
| ★ 実装済 | policy engine / trace envelope（5 loop配線）/ sb_* schema + 合法遷移SQL + lease + append-only trigger + RLS |
| ☐ 未実装 | adapters / cluster / Issue projector / eval factory / Maker / Checker / canary / outcome / Overseer / Lineage Archive |
| 公開して良い主張 | 「Self-Builderのtarget architectureと基盤が動いている」 |
| まだ言わない | 「Life Managerがproductionで自分のcodeを自動mergeしている」 |
