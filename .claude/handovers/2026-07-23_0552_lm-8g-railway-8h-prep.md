# Handover — Life Manager 8g Railway blocker / 8h isolated prep

## Objective and authority

- Objective: canonical spec §10 の未完 atomic TODO を上から全件、実 side-effect evidence 付き `done` にし、対象変更を commit/push する。
- Planner/orchestrator/main session: spec・発注書・裁定・監視・独立 final check。product 実装をしない。
- Sol workers: isolated worktree で build・execute・verify・VCSDD・scoped commit/push。material gate は fresh artifact-only reviewer。
- SSOT: `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` の §9/§9.5/§10/§10.0/§10.2。planning branch=`docs/lm-core8d-review-order`。

## Current live state

### §10 row 8g PANEL-a — pending, external deployment blocker

- Score implementation/review is green: fresh implementation review `PASS / finding 0`; final hardening ratio=`66049 pairs / 198147 evaluations / generated 10000`; focused score/UI=`14/14 + 14/14`; full exit 0; eval=`21/21 + 12/12 + 12/12 + 27/27`; real PostgreSQL=`roles 3 / snapshot_sessions 2 / complete 20000 / overflow 20001`.
- Git release is merged: feature=`bc444136aef9df457f2db948dc884d3abb37ecff`; PR #344→dev=`bc323916e5ffc02197b62a0e90cf7ff7f19c1596`; PR #345→main/origin-main=`5a61251e35b0cc3eaaa79354e352fd371ba39b11`; calendar-eval SUCCESS.
- Production `life-call` config drift is restored to last-known-good: rootDirectory unchanged; builder=`NIXPACKS`; railway config=`/apps/life-call/railway.toml`; start=`node server.js`.
- Railway control plane still blocks a new image/instance. Failed methods and false hypotheses are recorded in §10 row 8g. Latest attempted deployment=`1e5064a8-bcfd-43cf-bac4-c22ff61efe1b`, `INITIALIZING`, `deploymentStopped=true`, instances/image digest absent. Old healthy deployment=`ea570232-fd20-4614-b2c8-084cb9d3256c`, commit=`d04c522…`, image=`sha256:b7d56d…f9078eb0`, remains SUCCESS and untouched.
- Evidence, all mode `0600`:
  - `/Users/anicca/.codex/evidence/panel-8g-railway-production-pre-config.json`, SHA-256 `69d203443191f63ce7f7ea0760ece5777a8a1e9f4ce4ab79d7ce29a473215983`
  - `/Users/anicca/.codex/evidence/panel-8g-railway-production-post-config.json`, SHA-256 `39647143a307ef558b17c4f88fb97d58ca1329a58361e7fcafe7a28b05ab769c`
  - `/Users/anicca/anicca-project/.claude/sol-orders/logs/panel-8g-collab-progress.log`
- Not done: migration/postflight, exact-main production SUCCESS, Dais permanent personalized `/panel` L3, UI=API=independent DB recomputation, mobile/desktop screenshots, final evidence JSON. Never mark 8g done until these exist.

### §10 row 8h PANEL-b — isolated preparation in progress

- Order: `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/.claude/sol-orders/order-panel-8h-ux-privacy.md`.
- Worktree=`/Users/anicca/anicca-project/.worktrees/sol-panel-8h-ux-privacy`; branch=`sol/panel-8h-ux-privacy`; base=`origin/main@5a61251e`.
- Heartbeat=`/Users/anicca/anicca-project/.claude/sol-orders/logs/panel-8h-collab-progress.log`, mode `0600`.
- Current measured state: VCSDD initialized; Phase 1 spec review iteration 1 FAIL with 2 material findings; iteration 2 also FAIL with 1 material finding (`FIND-003`: retained contract allowlist is referenced as existing but is not self-contained, so closed inventory/complete negative-case proof is missing). Product code is not yet changed; branch has only uncommitted VCSDD working files. Root executor is intentionally interrupted after receiving this verdict so a restart cannot create concurrent writes.
- HARD release boundary: 8g production L3 PASSまで、8hはspec/eval/RED/build/GREEN/review/commit/pushのみ。PR/merge/deploy/provider/prod/TG/email/call/L3は禁止。

## Restart first checks

1. Re-read §10 and this handover; do not trust conversation memory.
2. Check active agents before spawning a duplicate writer. Then inspect both heartbeat deltas and exact worktree/upstream status.
3. Read-only poll Railway `life-call`. If an exact-main deployment has image+instance and SUCCESS, finish 8g migration/postflight and controlled production L3 through a fresh Sol. Otherwise keep 8g pending and continue only the isolated 8h preparation allowed above.
4. Preserve all unrelated dirty work. Meaningful scoped changes must pass fresh checks, then fetch, explicit stage, commit, push, and remote-SHA verification.

## Restart `/goal`

```text
/goal Life Manager を、正本 §10 の未完 atomic TODO がすべて実証済み `done` になるまで完遂する。最初に `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/docs/superpowers/specs/2026-07-19-anicca-one-repo-consolidation-spec.md` の §9・§9.5・§10・§10.0・§10.2 と `/Users/anicca/anicca-project/.worktrees/lm-spec-sync-core8d/.claude/handovers/2026-07-23_0552_lm-8g-railway-8h-prep.md` を読み、active agent、worktree、heartbeat、remote、Railway をfresh実測してから再開する。§10だけをlive stateとし、main sessionはplanner/orchestrator/spec writer/final verifierに限定、product実装はせず、各build/execute/verify/VCSDD/commit/pushをfresh Solのspawn_agentへ委任し、material gateだけfresh artifact-only reviewerで独立検証する。同じworktreeへduplicate writerを置かない。

現在8gはcode/review/PR mergeまでPASSしmain=`5a61251e35b0cc3eaaa79354e352fd371ba39b11`だが、Railway外部停止でexact-SHA production build/image/instance、migration、Dais本人永久`/panel` L3が未完。3手法以上のFAILとfalse hypothesesは§10 row 8gに記録済みなので、追加deployを無限反復せずread-onlyで回復を監視する。exact-main deploymentがimage+instance付きSUCCESSになればfresh Solでmigration postflight→health→Dais本人のpersonalized panel→UI/API/独立DBのscore一致→mobile/desktop→zero unintended side effectを実測して8gを裁定する。未回復中はNO-STALLとして8hのisolated branch `sol/panel-8h-ux-privacy` をspec/eval/RED/build/GREEN/review/commit/pushまで進めてよいが、8g L3 PASS前の8h PR/merge/deploy/provider/prod/TG/email/callは禁止する。その後も§10の上から順に同じbounded loop（observe→choose→act→verify→record）で進める。

Doneは§10全行がfixtureや自己申告でなく、該当する録音・実TG readback・実メールMessage-ID・実投稿URL・authenticated browser/API/DB・deployment exact SHA・on-chain tx等のL3証拠、eval 100%、関連回帰、fresh review、spec更新、scoped commit/pushを備えること。DBフラグだけは証拠にしない。REPORT-DON'T-ASKを守り、AIから人間への電話はuser本人callのみ。承認外broadcast、Dais walletからの外部送金、prod schema破壊、課金経路変更は行わず、13d送金は13a-c証拠後だけ。§9.11 copy変更は提案まで。X/Slack launch素材はDais本人投稿で代行しない。

同一atomicが3つの独立手法で同じ失敗なら、false hypothesisと証拠を§10へ記録して次の独立atomicの準備へ進み、待機報告だけで止まらない。objective/Done/evidence/scopeを黙って変えず、真の権限・安全 blockerだけ停止する。進捗はtool evidenceのみで報告し、意味ある編集は関連検証後に対象だけstage、fetch、commit、push、remote SHA確認まで終える。最終報告は全行Doneの実証、残 blocker 0、主要commit/PR/deployment/evidenceを日本語で示す。
```
