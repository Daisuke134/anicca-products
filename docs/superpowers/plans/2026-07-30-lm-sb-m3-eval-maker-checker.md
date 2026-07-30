# Plan: LM-SB M3 eval factory / Maker / Checker (LM-SB-07 / 08 / 09)

Spec 正本: `docs/loop-engineering/51-life-manager-builds-life-manager.md`（§8 Eval factory + Ordering invariant、§9 Maker loop、§10 Checker）
Evidence: `52-prior-art-self-improving-loops.md`（§3 reward hacking、§4 auto-merge の合法条件）
配置: `53-self-builder-tree-and-ux.md` §1 の `eval-factory/` `maker/` `checker/`
前提: M2 merged — signal → cluster → triage gate → GitHub Issue が動いている。

## 開発環境

| 項目 | 値 |
|---|---|
| Worktree | `.worktrees/lm-sb-m3/` |
| Branch | `feature/lm-sb-m3-eval-maker-checker` |
| Base | M2 merge 後の `feature/x-deep-research-20260727` HEAD |
| Executor | Opus 5 subagent（implementation-time worker。runtime Maker/Checker assignmentはSSOT §3.2） |
| 触るファイル境界 | `apps/self-builder/**` のみ。`apps/life-call/**` は read only |

## この milestone の一点の勝負所

★ **eval を Maker が issue を見る前に凍結する**（spec §8 Ordering invariant）。
この順序だけが「Maker が自分の採点器を書く循環」と「criteria drift」を同時に殺し、
自動 merge を GitHub required status check に還元する。実装がこの順序を守れているかを
テストで物理的に証明することが M3 の Done。

```text
eval frozen (eval_id + sealed grader + version + required check 登録)
   ─── THEN ───> Maker が issue を読む
```

## Task 1 — LM-SB-07: reproduction eval factory

**Done**: production signal から fixture を作り、**baseline が同じ理由で落ちる**ことを
固定し、grader を封印して `eval_id` を発行できる。Maker からは sealed 内容が読めない。

| Step | File |
|---|---|
| 1. `fixture-builder.js`: cluster の exemplar signal（redacted）→ 再現 fixture。純関数。入力に raw が混ざっていたら reject（M2 の `collect/redact.js` を再利用、再実装禁止） | `eval-factory/fixture-builder.js` |
| 2. `baseline-runner.js`: fixture を現行 code に対して実行し、**expected failure reason と一致するか**を判定。一致しなければ `NOT_REPRODUCIBLE`（spec §4） | `eval-factory/baseline-runner.js` |
| 3. `seal.js`: grader + expected answers を封印。公開されるのは `eval_id` と非 sealed 部分のみ。sealed content の hash を記録し、後から改変を検知できる（LM-SB-14 の前段） | `eval-factory/seal.js` |
| 4. `register-check.js`: `eval_id` を GitHub required status check 名に写像（`sb-eval/<eval_id>`）。実 API 呼び出し層と純関数を分離 | `eval-factory/register-check.js` |
| 5. migration: `sb_evals`（eval_id, cluster_id, fixture_ref, sealed_hash, version, created_at, baseline_result, required_check_name）+ rollback。sealed content 本体は DB に置かず `sb_evals.sealed_ref` で artifact 参照 | `migrations/2026-08-01-sb-evals.sql` |
| 6. RED first: ① raw PII 混入 fixture → reject ② baseline が落ちない → `NOT_REPRODUCIBLE` で eval を作らない ③ baseline が別理由で落ちる → reject ④ sealed content が `eval_id` 経由の公開 API から取れないことを assert（Maker 権限の shape で呼んで leak しない） ⑤ 同 cluster 2回 → eval 1件（idempotency） | `eval-factory/*.test.js` |
| 7. ★ 順序不変条件のテスト: `EVAL_READY` に到達していない issue を Maker が claim しようとしたら deny。`sb_evals` 行と `sealed_hash` が存在しない限り `CLAIMED` へ遷移できない（M1 の `transitions.js` の required_receipts に `eval_id` を追加） | `state/transitions.test.js` + 実 DB integration |

## Task 2 — LM-SB-08: Maker dispatcher

**Done**: 1 Issue = 1 worktree = 1 PR を E2E で実証。`done` 発言では state が進まず、
commit SHA + test receipt だけが `IMPLEMENTED` を起こす。禁止 path に触ったら hard reject。

| Step | File |
|---|---|
| 1. `dispatcher.js`: `EVAL_READY` の最高 priority issue を lease claim（M1 の `lease.js` 再利用）→ worktree 作成 → prompt 組立 → worker 起動 → 結果回収 → lease 解放。worker 起動は injectable な実行 client（テストは fake） | `maker/dispatcher.js` |
| 2. `worktree.js`: `.worktrees/lm-auto-<issue-id>/` を作る/消す。既存 worktree があれば再利用せず fail（並行 claim 検知） | `maker/worktree.js` |
| 3. `prompt.js`: Maker への指示を組む純関数。**含めてよいのは** issue body + 非 sealed eval + 触ってよい path の allowlist。**含めない**のは sealed answer、checker credential、production metric query | `maker/prompt.js` |
| 4. `stop-conditions.js`: spec §9 の表を data で（all pass → Checker / same error ×3 → CIRCUIT_OPEN / no progress ×3 → QUARANTINED / budget 超過 → RETRY_WAIT / prohibited path → hard reject / permission・schema・security 変更 → quarantine） | `maker/stop-conditions.js` |
| 5. RED first: ① worker が `done` と言うだけ（SHA なし）→ `IMPLEMENTED` へ進まない ② 同 error 3回 → CIRCUIT_OPEN ③ prompt に sealed answer が混ざらないことを assert ④ 禁止 path を触った diff → M1 `policy/evaluate.js` が deny（重複実装せず呼ぶ） ⑤ 同 issue の二重 claim → 2つ目が lease で弾かれる | `maker/*.test.js` |
| 6. 実 E2E: 自 repo の意図的な synthetic bug（`apps/self-builder/test/e2e/fixtures/` 内の壊れた module）に対して dispatcher を走らせ、worktree + commit + PR が1本できることを確認。PR は draft、確認後 close（削除しない） | `test/e2e/maker-one-pr.js`（`SB_REAL_GITHUB=1` guard 付き、bare `node --test` では skip） |

## Task 3 — LM-SB-09: independent Checker

**Done**: Maker とは別 checkout・別 context・**別 model family** で全 gate を実行し、
最終 PASS を non-LLM signal のみが言える。sealed holdout で visible-only 通過を落とす。

| Step | File |
|---|---|
| 1. `run-gates.js`: clean checkout → build → unit/integration → reproduction が今 pass するか → sealed holdout → security/policy scan → cost/latency 比較 → PR diff scope check。各 gate は独立関数、1つでも FAIL なら以降を走らせない（cascade。OpenEvolve の安い stage 優先） | `checker/run-gates.js` |
| 2. `verdict.js`: gate 結果 → `{pass: bool, gates: {...}, evidence: [...]}`。★ LLM 由来の score は `advisory` field に隔離し、`pass` の計算に**使えない構造**にする（型で禁止、テストで証明） | `checker/verdict.js` |
| 3. `model-family.js`: Checker の worker が Maker と別 family であることを起動時に検証し、同一なら実行を拒否（config だけでなく実行時 assert） | `checker/model-family.js` |
| 4. `sealed-eval.js`: sealed content を Checker のみが読める経路で取得。`sealed_hash` を照合し、改変されていたら FAIL（reward hacking 検知） | `checker/sealed-eval.js` |
| 5. RED first: ① visible eval のみ pass の candidate → sealed holdout で reject ② LLM advisory が満点でも deterministic gate が FAIL なら `pass: false` ③ Checker が candidate を書き換えようとしたら（write を試す fake）→ 拒否 ④ sealed_hash 不一致 → FAIL ⑤ Maker と同 model family → 起動拒否 ⑥ cost が閾値超 → FAIL | `checker/*.test.js` |
| 6. migration: `sb_verifications`（verification_id, issue_id, candidate_sha, gate 別結果, advisory_score, verdict, checker_version, model_family）+ rollback | `migrations/2026-08-01-sb-verifications.sql` |

## 制約（executor への hard rules）

1. TDD 厳守。RED/GREEN の実出力を報告に含める。
2. 依存追加禁止（`node:test` + `gh` + `psql` + `git` のみ）。
3. `apps/life-call/**` を 1 byte も変更しない。
4. M1/M2 の module を再利用する（`redact.js`・`lease.js`・`transitions.js`・`policy/evaluate.js`・`signature.js`）。再実装は違反。
5. テストは自分が実行した保証のみ主張する。SQL 文言 grep は「… DECLARES …」命名、挙動は `test/postgres/` で実行。
6. 実 network 操作は Task 2 step 6 の PR 1本のみ（`SB_REAL_GITHUB=1` guard 必須、bare `node --test` で skip されることを実証）。
7. 純関数 + IO 分離、入力を mutate しない、file ≤400 行目安。
8. 各 Task ごとに commit、push しない。

## Done 判定（親が実行する exit proof）

| 検証 | 期待 |
|---|---|
| `cd apps/self-builder && npm test` | fail 0（M2 の 202 + 新規） |
| `npm run test:postgres` | PASS（新 migration 2本込み） |
| `git diff --stat <base>...HEAD -- apps/life-call` | 空 |
| 順序不変条件 | `sb_evals` 行 + sealed_hash 無しで `CLAIMED` へ遷移不能（実 DB で raise） |
| sealed leak | Maker 権限 shape で sealed content が取得できない（テスト出力） |
| Maker E2E | synthetic bug → worktree 1 + commit 1 + PR 1、`done` だけでは state 不変 |
| Checker | visible-only candidate が sealed holdout で reject される実出力 |
| bare `node --test` | 実 GitHub 操作を skip |

## 進捗

| Task | Status |
|---|---|
| 1 LM-SB-07 eval factory | TODO |
| 2 LM-SB-08 Maker dispatcher | TODO |
| 3 LM-SB-09 independent Checker | TODO |
| Code review (fresh reviewer) | TODO |
| Merge + spec 更新 | TODO |
