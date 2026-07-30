# Plan: LM-SB M1 foundation (LM-SB-01 / 02 / 03)

Spec 正本: `docs/loop-engineering/51-life-manager-builds-life-manager.md`
Evidence 正本: `docs/loop-engineering/52-prior-art-self-improving-loops.md`

## 開発環境

| 項目 | 値 |
|---|---|
| Worktree | `.worktrees/lm-sb-m1/` |
| Branch | `feature/lm-sb-m1-foundation` |
| Base | `feature/x-deep-research-20260727` HEAD (`32cdf2601`) |
| Executor | Opus 5 subagent |
| 触るファイル境界 | `apps/self-builder/**`（新規）、`apps/life-call/lib/telemetry/**`（新規）、既存 loop への emit 差し込みは `apps/life-call/lib/` 内の該当 5 file のみ |

## Task 1 — LM-SB-01: machine-readable policy

**Done**: policy fixture が spec §10 の `auto_merge_if` contract と §2 immutable kernel の
allow/deny を deterministic に再現するテストが green。

| Step | File |
|---|---|
| 1. policy を YAML でなく JS module + JSON schema で定義（runtime 依存を増やさない。yaml parser 追加禁止 — 既存依存に無い） | `apps/self-builder/policy/policy.js` |
| 2. immutable kernel 定義: goal/constitution, secret store, branch protection, sealed holdout, promoter credential, policy engine, audit history → 全て `mutable: false` | 同上 |
| 3. auto-merge allowlist: localized bug fix / retry-timeout cap / tool contract parser / non-sensitive prompt / observability / deterministic test。deny: auth, billing, wallet, DB migration, permission expansion, SAFE-T, secret handling, promoter kernel | 同上 |
| 4. `evaluate(candidate)` 純関数: input = {issue_class, paths_touched, diff_stats, checks} → output = {merge: bool, reason: string[]}。mutation 禁止（coding-style rule） | `apps/self-builder/policy/evaluate.js` |
| 5. RED first: fixture 12 件（allow 6 / deny 6、spec §10 の表と 1:1）で `node --test` | `apps/self-builder/policy/evaluate.test.js` |
| 6. sensitive path 判定は glob list（`lib/billing.js`, `migrations/**`, `lib/panel-auth.js` 等実在 path で） | `apps/self-builder/policy/sensitive-paths.js` |

## Task 2 — LM-SB-02: common trace/effect envelope

**Done**: 既存 5 loop（wake scheduler / daily-preflight / ask / travel / feature-discovery）が
同一 schema の envelope を emit し、schema validation test が green。

| Step | File |
|---|---|
| 1. envelope schema: spec §5.2 の common signal envelope（trace_id, run_id, tenant_ref=sha256, graph_version, node, tool, status, failure_class, latency_ms, effect_id）。純関数 `createEnvelope(fields)` + `validateEnvelope(obj)` | `apps/life-call/lib/telemetry/envelope.js` |
| 2. RED first: 必須 field 欠落 / PII 混入（email, phone 正規表現）/ 生 tenant id → reject のテスト | `apps/life-call/lib/telemetry/envelope.test.js` |
| 3. emitter: append-only JSONL + 将来 OTLP 差し替え可能な interface。`emit(envelope)` は fail-open（emit 失敗で product を殺さない） | `apps/life-call/lib/telemetry/emitter.js` |
| 4. 5 loop へ差し込み: scheduler.js の claim/dial 点、daily-preflight.js の final 点、ask.js の reply 点、travel.js の notice 点、feature-discovery.js の discovery 点。各 1 emit、既存挙動を変えない | 各既存 file 最小 diff |
| 5. 検証: `node --test` 新規 + 既存 full `npm test` regression 0 | — |

## Task 3 — LM-SB-03: self-builder Postgres schema

**Done**: transition / lease / idempotency のテストが green。

| Step | File |
|---|---|
| 1. migration: `sb_signals`（append-only）、`sb_clusters`、`sb_issues`（state machine §4: OBSERVED..MEASURED + failure states）、`sb_leases`（worker claim, expiry）、`sb_audit`（append-only, no UPDATE/DELETE grant） | `apps/self-builder/migrations/2026-07-30-self-builder-core.sql` |
| 2. rollback migration | `...rollback.sql` |
| 3. state transition 関数: 合法遷移表を data として持つ `transition(issue_id, from, to, receipt)`。receipt（commit SHA / test result / eval_id）無しの遷移は reject（spec §4 transition contract） | `apps/self-builder/state/transitions.js` |
| 4. lease: claim → expiry → 再 claim。同一 signal 二重配送 → 1 cluster 1 issue の idempotency | `apps/self-builder/state/lease.js` |
| 5. RED first: 「Maker says done without SHA → transition denied」「Same signal delivered twice → one cluster, one Issue」「Worker dies after claim → lease expiry後にresume」（spec §16 の該当 3 行） | `apps/self-builder/state/*.test.js` |
| 6. DB 無し環境でも走る fixture 層（life-call の test-support pattern を踏襲）+ Postgres integration script（`test/postgres/` pattern 踏襲、実行は DATABASE_URL ある時のみ） | `apps/self-builder/test-support/` |

## 制約（executor への hard rules）

1. TDD 厳守: production code の前に failing test。skip = やり直し。
2. 依存追加禁止（inngest / stripe / ws / node:test で完結。yaml parser も ORM も入れない）。
3. `apps/life-call` の既存テストを 1 本も壊さない（`npm test` full run で確認）。
4. 境界外の file を触らない。
5. 各 Task 完了ごとに commit（push は親がレビュー後）。
6. Immutability: mutation でなく新 object を返す。
7. 完了報告には実行した test コマンドと実出力の要約を含める。自己申告 "done" は無効。

## 進捗

| Task | Status |
|---|---|
| 1 LM-SB-01 policy | DONE — `cd apps/self-builder && node --test` → tests 26 / pass 26 / fail 0 |
| 2 LM-SB-02 envelope | DONE — `node --test lib/telemetry/*.test.js` → tests 39 / pass 39 / fail 0。life-call full `npm test` = 633/633 pass, EXIT 0（baseline と同一）|
| 3 LM-SB-03 schema | DONE — `cd apps/self-builder && npm test` → tests 62 / pass 62 / fail 0。`npm run test:postgres` → 実 Postgres 16 (docker) で §16 の 3 行 + append-only + rollback まで PASS |
| Adversary review | ROUND 1 完了 — C1/C2/C3 + I1-I5,I7-I10 + M1/M3/M5 を全修正（commits 5358fcf8e, c7564be7f, eac4f6f98, 229420c3d, f2368b140）。I6 は spec 修正待ちで対象外（coordinator 指示）|
| Merge + spec 更新 | TODO（親）|

### M1 検証コマンド（再現手順）

| 対象 | コマンド | 実測結果（review round 1 修正後）|
|---|---|---|
| self-builder 全体 | `cd apps/self-builder && npm test` | tests 79 / pass 79 / fail 0 |
| telemetry | `cd apps/life-call && node --test lib/telemetry/*.test.js` | tests 41 / pass 41 / fail 0 |
| life-call full（telemetry 込み）| `cd apps/life-call && npm test` | tests 674 / pass 674 / fail 0, exit 0（baseline 633 + telemetry 41）|
| Postgres 実機 | `cd apps/self-builder && npm run test:postgres` | PASS (mode=docker) / PASS (mode=url, CI と同経路) |
| CI | `.github/workflows/self-builder.yml` | paths: apps/self-builder/** で npm test + test:postgres (postgres:16 service) |
