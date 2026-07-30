# Plan: LM-SB M2 signal → cluster → Issue (LM-SB-04 / 05 / 06 / 16 + I6 recovery)

Spec 正本: `docs/loop-engineering/51-life-manager-builds-life-manager.md`
UX/配置: `docs/loop-engineering/53-self-builder-tree-and-ux.md`
前提: M1 merged (`3c6b3f16d`) — policy engine / telemetry envelope / sb_* schema が動いている。

## 開発環境

| 項目 | 値 |
|---|---|
| Worktree | `.worktrees/lm-sb-m2/` |
| Branch | `feature/lm-sb-m2-signal-to-issue` |
| Base | `feature/x-deep-research-20260727` HEAD (`31a745a3f`) |
| Executor | Opus 5 subagent |
| 触るファイル境界 | `apps/self-builder/**` のみ（`collect/`, `cluster/`, `issue/`, `state/`, `migrations/`, `test/`）。★ `apps/life-call/**` は触らない（M1 で emit 済み、読むだけ） |

## Task 0 — I6 recovery: failure state の出口

**Done**: `RETRY_WAIT → 直前 active state` と `CIRCUIT_OPEN → QUARANTINED`、
`QUARANTINED → TRIAGED`（manual reset receipt 必須）が JS と SQL seed の両方に入り、
parity test が green のまま。spec §4 amendment（2026-07-30）と 1:1。

| Step | File |
|---|---|
| 1. RED: `legalTargets("RETRY_WAIT")` が `return_state` receipt に従って直前 active state を返すテスト。`CIRCUIT_OPEN → QUARANTINED` のテスト。`QUARANTINED → TRIAGED` は `manual_reset_receipt` 無しで deny | `state/transitions.test.js` |
| 2. `RETRY_WAIT` 進入時に `return_state` を receipt へ必須記録（それ以外へは戻れない） | `state/transitions.js` |
| 3. SQL seed へ同じ行を追加（parity test が両者一致を保証） | `migrations/2026-07-30-...-core.sql` に追記 migration ではなく **新規** `2026-07-31-sb-failure-exits.sql` + rollback |
| 4. integration script に「RETRY_WAIT から別の active state へは行けない」を実 DB で追加 | `test/postgres/` |

## Task 1 — LM-SB-04: signal adapters + redaction gate

**Done**: 6 source が同一 `sb_signals` 行へ変換され、raw PII が 1 byte も入らないテストが green。

| Step | File |
|---|---|
| 1. `redact.js`: **全 adapter が必ず通る唯一の gate**。email/phone/住所/URL query/生 user id を検出して reject（M1 の `envelope.js` の PII 判定を再実装せず、共通ロジックを self-builder 側に独立実装 — product 側の validation を信頼しない二重防御） | `collect/redact.js` |
| 2. adapter interface: `adapt(raw) → {signals: [], skipped: [], errors: []}` 純関数。IO は呼び出し側 | `collect/adapter-contract.js` |
| 3. adapters（各 100 行以下、fixture 駆動）: `telemetry-jsonl.js`（M1 の JSONL を読む）/ `lm-wake-log.js` / `lm-ask-log.js` / `lm-travel-log.js` / `github-actions.js`（`gh run list --json` の実 shape）/ `sentry.js`（webhook payload shape） | `collect/adapters/*.js` |
| 4. RED first: 各 adapter に「正常 → signal」「PII 混入 → reject（signal 0件）」「malformed → errors に入るが throw しない」の 3 テスト最低 | `collect/adapters/*.test.js` |
| 5. fixture は実 shape から。`lm_wake_log` / `lm_ask_log` / `lm_travel_log` の列は `apps/life-call/migrations/*.sql` を読んで一致させる（推測禁止） | `collect/fixtures/*.json` |
| 6. `ingest.js`: adapter 出力 → `sb_signals` INSERT（M1 の `lease.js::ingestSignal` を再利用、重複実装しない） | `collect/ingest.js` |

## Task 2 — LM-SB-05: cluster / dedupe / priority / triage gate

**Done**: replay dataset で dedupe precision を実測し、triage gate 未満の cluster が
worker を起動しないことがテストで示される。

| Step | File |
|---|---|
| 1. `signature.js`: M1 の `lease.js::SIGNATURE_FIELDS` を正本として参照（再定義禁止）。`model` 軸が signal に無い場合の扱いを明示 | `cluster/signature.js` |
| 2. `priority.js`: 影響（affected tenant 数）× 頻度（events/日）× 確実性（再現可能性）。純関数、閾値は data | `cluster/priority.js` |
| 3. `triage-gate.js` = **LM-SB-16**: `events >= MIN_EVENTS` かつ `最新 <= 14日` かつ `fixability >= 閾値`。fixability は「機械採点できるか」の判定（deterministic な signal が揃っているか）で、LLM 判定を使わない | `cluster/triage-gate.js` |
| 4. RED first: ① 同 signature 2発 → cluster 1 ② 別 release → cluster 2（spec §5.4 の release 軸） ③ events 不足 → `gate: false, reason: "insufficient_events"` ④ 15日前のみ → `stale` ⑤ 再現不能 → `not_fixable` | `cluster/*.test.js` |
| 5. replay dataset: 実 shape の signal 50件（うち意図的に 3 group の重複）を fixture に置き、cluster 数と precision/recall を assert | `cluster/fixtures/replay-50.json` |

## Task 3 — LM-SB-06: Issue projector + reconcile

**Done**: DB state が GitHub Issue/label に投影され、label を手で書き換えても DB から
復元される（spec §16「GitHub label edited manually → DB authorityからreconcile」）。

| Step | File |
|---|---|
| 1. `projector.js`: cluster + priority + evidence packet → Issue body（**hash / aggregate / redacted exemplar / artifact ref のみ**。raw を載せたら reject）。`gh` CLI を実行する層と body を組む純関数を分離 | `issue/projector.js` |
| 2. `issue-body.js`: 純関数。テストは body 文字列を assert（PII が入らないことも assert） | `issue/issue-body.js` |
| 3. `labels.js`: state → label の写像（`sb:OBSERVED` … `sb:PROMOTED`、`sb:risk-low` 等）。DB state が authority | `issue/labels.js` |
| 4. `reconcile.js`: GitHub の label 集合と DB state を比較し、差分は **DB を正として GitHub を直す**（逆方向は絶対にしない） | `issue/reconcile.js` |
| 5. RED first: ① 同 cluster 2回 projection → Issue 1（idempotency: `sb_issues.github_issue_number` で判定） ② body に email/phone を入れた evidence → reject ③ label 手編集 → reconcile が GitHub 側を直す（fake gh client で） | `issue/*.test.js` |
| 6. 実 E2E: `gh` で **実 Issue を 1 件** `Daisuke134/anicca-products` に作成し、label が付き、2回目で重複しないことを確認 → 確認後 `gh issue close` で閉じる（削除はしない。lineage を残す） | 手動 verify、結果を plan の進捗に記録 |

## 制約（executor への hard rules）

1. TDD 厳守: production code の前に failing test。RED/GREEN の実出力を報告に含める。
2. 依存追加禁止（`node:test` + `gh` CLI + `psql` のみ。npm package を1つも足さない）。
3. `apps/life-call/**` を **1 byte も変更しない**（読むのは可）。
4. M1 の既存 module を再利用する。`SIGNATURE_FIELDS`・`ingestSignal`・`transition` を
   再実装したら違反（重複は drift の温床）。
5. **テストは自分が実行した保証のみ主張する**（M1 review の教訓。SQL 文言 grep のテストに
   挙動を主張する名前を付けるな。挙動は `test/postgres/` の integration で実行する）。
6. Immutability: 入力を mutate しない。純関数 + IO 分離。
7. 各 Task 完了ごとに commit。push はしない。
8. `gh` を使う実 E2E は Task 3 step 6 のみ。それ以外のテストは fake client で。
9. file は 400 行以下を目安、800 行上限。

## Done 判定（親が実行して確認する exit proof）

| 検証 | コマンド |
|---|---|
| self-builder 全体 | `cd apps/self-builder && npm test` → fail 0 |
| 実 DB | `npm run test:postgres` → PASS（新 migration 込み） |
| life-call 無変更 | `git diff --stat feature/x-deep-research-20260727...HEAD -- apps/life-call` → 空 |
| E2E dedupe | synthetic provider timeout を 2 発 ingest → `sb_clusters` 1行 / `sb_issues` 1行 / GitHub Issue 1件 |
| 実 Issue | `gh issue view <n>` で label と body（PII 無し）を目視 |

## 進捗

| Task | Status |
|---|---|
| 0 I6 failure exits | TODO |
| 1 LM-SB-04 adapters | TODO |
| 2 LM-SB-05 cluster + LM-SB-16 gate | TODO |
| 3 LM-SB-06 Issue projector | TODO |
| Code review (fresh reviewer) | TODO |
| Merge + spec 更新 | TODO |
