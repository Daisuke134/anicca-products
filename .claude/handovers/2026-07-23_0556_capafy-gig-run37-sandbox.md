# Handover — Capafy/Gig TODO #2 run37 sandbox integration

## SSOT

- Spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-17-capafy-10k-mrr-two-loop-spec.md`
- 残TODOの正本: 上記spec `§17 CURRENT SSOT` の「残 TODO（順序の正本）」表と直後の `Current execution`。順序は #1 IFU外部承認後gate → #2 delivery-first self-improvement → #3 Gig全収益行動 → #4 provider-agnostic fleet → #5 no-synthetic-warmup marketing engine → #6 Capafy fresh-account full cycle + 14日 → #7 cleanup analyzer + 14日。
- Spec remote SSOT: `anicca-products` branch `feature/clip-rewards`。再開前にremoteと照合し、最新commitから専用のrepo内worktreeで更新する。

## Current item and verified state

- Active itemは TODO #2 run37。`profitable-claude origin/main` は `cdaea0a763f3993c937c5cc8d127d55702575113`。clean builder worktreeは `/Users/anicca/profitable-claude/.worktrees/gig-paid-transaction-run37-builder`、branch `fix/gig-paid-transaction-run37`、HEAD=origin/main。transaction 10/10、Python 101/101、shell 12/12、fresh verifier blocker 0。validatorはhost直実行せずread-only/network-none Docker内だけで起動し、Docker/image/validator failureはrollback + quarantineする。
- `anicca-gig origin/main` は `c34d8dd0af53354e9b1fca4c95555041d3fab3c2`。Sunai v7はloopが作成・検証・buyer-visible提出・REFLECT/heartbeatまで完走済み。artifact SHA `cbc7efb2133129c441dd0727bad83e0cd2fc313410d01c9591120519c4c95ac5`、formal OFF、buyer実機承認待ち。同一v7を再送しない。IFU v3は承認待ちで未公開、Fkimuraはformal後の外部確認待ち。
- Docker image `openclaw-sandbox:bookworm-slim` は `sha256:4798ee88e2f955a66a65046f1ed6b1263f9abf8721c877bf9e274ee0e81839df`。OpenClaw agent `gig-paid-builder`はworkspace `/Users/anicca/gig/projects`、model `google/gemini-3.1-pro-preview`、sandbox all/docker/rw、exec host=sandbox、elevated disabled。`sandbox explain` は `sessionIsSandboxed=true`。
- Google model metadataだけを追加しgateway healthを維持したが、real Google probeはprovider HTTP 401でtool実行前に失敗したため再試行しない。専用agentへCLI model override `openai/gpt-5.4`を渡したreal probe `runtime-sandbox-probe-openai-run39-a1` は `sandbox_exec` 1回・failure 0で、`/workspace/5167108/state.json`読取、nonce write/read/remove、workspace sibling・host home・`/root`・docker.sock・host marker非露出を実証した。containerはnetwork none、read-only rootfs、capabilities ALL drop、no-new-privileges、唯一のRW mount `/Users/anicca/gig/projects`→`/workspace`を維持する。
- Diskは158 MiBまで低下後、削除なしで回復し、再開時は1.6 GiB。Docker images 762.9 MB。recoverability未確認だった546 MB・2,078 filesの`gig-v5-evidence.LYO2zN`は削除せず、同一filesystem renameで`/Users/anicca/gig/evidence/gig-v5-evidence.LYO2zN`へ保全した。
- Live `/Users/anicca/profitable-claude` は別Codexのspeedy-reply lane、branch `deploy/gig-speedy-reply-cutover`、commit `bab7b51e152770402bd4036e7c44cdbbc785d318`、clean。`cdaea0a`は未配備で、主runtime blobはDIFF、`paid_work_validation_contract.py`は不存在。blind checkout/copy禁止。clean integration worktreeでspeedy-replyとrun37を統合する。launchd `ai.anicca.hf-gig-pass` は読み取り時 `not running / runs=21 / last exit=0`。

## First safe resume action

1. run37のhigh-value OpenClaw候補を、real sandbox probe済みの`openai/gpt-5.4`へRED→GREENで変更する。Google 401は再試行せず、sandbox/transaction/validator契約を緩めない。
2. `cdaea0a` + `bab7b51` をrepo内のclean integration worktreeで統合・全回帰・pushし、worker/lock idle中にexact deployする。
3. 失敗transactionのrollback/quarantineと成功transactionのproject validate→promote→buyer-visible progress→REFLECT/heartbeatをproduction E2Eで取得し、specを更新する。

## Dirty-state boundaries

- `/Users/anicca/gig` はruntime/evidenceで大量のdirty/untrackedがある。stage/restore/clean禁止。
- `/Users/anicca/anicca-project` の`work/bug-bounty-743`、既存handovers、settings backup、`.claude/sol-orders/`、既存iOS/landing変更は無関係。stage/restore禁止。handover/spec専用worktreeは `/Users/anicca/anicca-project/.worktrees/capafy-handover-20260723-root`。handover・goal・execution notes・email body・active implementation worktreeをOS temp領域へ作らない。
- 意味のある編集は対象pathだけcommit/push。specは実測と同じturnに更新する。

## User-sendable `/goal`

最新のuser-sendable `/goal` はhandover実行時に必ず共有`goal-setter` skillで再生成・4,000文字以内を検証する。handover内の固定promptを正本にせず、上記SSOTと実測stateから生成する。

## Fallback discuss-first prompt

`Read /Users/anicca/anicca-project/.worktrees/capafy-handover-20260723-root/.claude/handovers/2026-07-23_0556_capafy-gig-run37-sandbox.md and /Users/anicca/anicca-project/docs/superpowers/specs/2026-07-17-capafy-10k-mrr-two-loop-spec.md. Verify the current git/runtime state read-only, list ALL remaining TODOs in canonical order, draw the TO-BE end-state ASCII, then stop and wait for discussion. Do not fix anything yet.`
