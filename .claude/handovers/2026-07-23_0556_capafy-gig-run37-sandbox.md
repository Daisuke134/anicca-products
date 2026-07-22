# Handover — Capafy/Gig TODO #2 run37 sandbox integration

## SSOT

- Spec: `/Users/anicca/anicca-project/docs/superpowers/specs/2026-07-17-capafy-10k-mrr-two-loop-spec.md`
- 残TODOの正本: 上記spec `§17 CURRENT SSOT` の「残 TODO（順序の正本）」表と直後の `Current execution`。順序は #1 IFU外部承認後gate → #2 delivery-first self-improvement → #3 Gig全収益行動 → #4 provider-agnostic fleet → #5 no-synthetic-warmup marketing engine → #6 Capafy fresh-account full cycle + 14日 → #7 cleanup analyzer + 14日。
- Spec remote SSOT: `anicca-products` branch `feature/clip-rewards`。handover書き出し直前のspec commitは `f96d43c5f2ff813bec8215d1916e9887af34f923`。

## Current item and verified state

- Active itemは TODO #2 run37。`profitable-claude origin/main` は `cdaea0a763f3993c937c5cc8d127d55702575113`。clean builder worktreeは `/private/tmp/gig-paid-transaction-run37-builder`、branch `fix/gig-paid-transaction-run37`、HEAD=origin/main。transaction 10/10、Python 101/101、shell 12/12、fresh verifier blocker 0。validatorはhost直実行せずread-only/network-none Docker内だけで起動し、Docker/image/validator failureはrollback + quarantineする。
- `anicca-gig origin/main` は `c34d8dd0af53354e9b1fca4c95555041d3fab3c2`。Sunai v7はloopが作成・検証・buyer-visible提出・REFLECT/heartbeatまで完走済み。artifact SHA `cbc7efb2133129c441dd0727bad83e0cd2fc313410d01c9591120519c4c95ac5`、formal OFF、buyer実機承認待ち。同一v7を再送しない。IFU v3は承認待ちで未公開、Fkimuraはformal後の外部確認待ち。
- Docker image `openclaw-sandbox:bookworm-slim` は `sha256:4798ee88e2f955a66a65046f1ed6b1263f9abf8721c877bf9e274ee0e81839df`。OpenClaw agent `gig-paid-builder`はworkspace `/Users/anicca/gig/projects`、model `google/gemini-3.1-pro-preview`、sandbox all/docker/rw、exec host=sandbox、elevated disabled。`sandbox explain` は `sessionIsSandboxed=true`。
- Real probeは `models.providers.google.models[]` のmodel metadata不在でsandbox開始前 `Unknown model`。metadataは未書込み、probe file/host marker/containerは0、gatewayは稼働。config backups: `~/.openclaw/openclaw.json.bak`, `.bak.1`, `.last-good`。
- Diskは158 MiBまで低下後、削除なしで1.4 GiBへ回復しており不安定。Docker images 762.9 MB、`/private/tmp/gig-v5-evidence.LYO2zN` 546 MBはgit repoでなくrecoverability未確認のため削除禁止。
- Live `/Users/anicca/profitable-claude` は別Codexのspeedy-reply lane、branch `deploy/gig-speedy-reply-cutover`、commit `bab7b51e152770402bd4036e7c44cdbbc785d318`、clean。`cdaea0a`は未配備で、主runtime blobはDIFF、`paid_work_validation_contract.py`は不存在。blind checkout/copy禁止。clean integration worktreeでspeedy-replyとrun37を統合する。launchd `ai.anicca.hf-gig-pass` は読み取り時 `not running / runs=21 / last exit=0`。

## First safe resume action

1. `df` を複数回読み、容量増加元をread-onlyで特定する。protected artifact/evidenceは消さず、remoteから完全復元可能と実証できたtemporary worktree/cacheだけを回収する。
2. OpenClawにGoogle model metadataだけを追加しgateway healthを確認。real `gig-paid-builder` probeを1回実行し、`/workspace/5167108` read/write/remove、workspace外/host marker/home/docker.sock非露出を実証する。
3. `cdaea0a` + `bab7b51` をclean integration branchで統合・全回帰・pushし、worker/lock idle中にexact deploy。失敗transaction rollbackと成功transactionのproduction E2Eを取得し、specを更新する。

## Dirty-state boundaries

- `/Users/anicca/gig` はruntime/evidenceで大量のdirty/untrackedがある。stage/restore/clean禁止。
- `/Users/anicca/anicca-project` の`work/bug-bounty-743`、既存handovers、settings backup、`.claude/sol-orders/`、既存iOS/landing変更は無関係。stage/restore禁止。共有spec worktreeは別Codexがbranchを切り替えていたため再利用せず、remote SSOTから専用worktreeを作る。
- 意味のある編集は対象pathだけcommit/push。specは実測と同じturnに更新する。

## User-sendable `/goal`

`/goal 最初に /private/tmp/capafy-handover-20260723-root/.claude/handovers/2026-07-23_0556_capafy-gig-run37-sandbox.md と /Users/anicca/anicca-project/docs/superpowers/specs/2026-07-17-capafy-10k-mrr-two-loop-spec.md を読み、remote feature/clip-rewardsの最新spec・git/runtime/OpenClaw/launchd/diskと照合してから、specの「残 TODO（順序の正本）」を順番どおり全て完了させる。最終状態は、Coconala gig loopがGPT既定のmodel-agnostic runnerとlaunchdで毎回実案件を追跡し、有償案件の成果物を作成・毎feedback後すぐbuyer-visible提出・承認後だけformal・問合せ返信・提案・応募・出品・自己改善を人のbabysitなしで行い、Capafy/shared marketing loopがsynthetic warmupなしでfresh accountのsetup→official publish→public URL/reach計測→reportを14日自走し、cleanupがprotected artifactを消さずdisk reserveを維持すること。Doneはfixtureや手動代行ではなく、spec各行の実launchd/browser/API/artifact/hash/ledger/screenshot/24h・7d・14d証拠、全回帰、remote commitで判定する。rootはplanner・spec owner・最終verifierとし、spawn_agentで一度に1つの最小scopeをSOL builderへ任せ、safety/完了判定に関わる変更は別のread-only verifierが反例を探す。最初はdisk変動をread-only調査し、復元可能と証明したtemporary data以外を消さない。speedy-replyとrun37はclean worktreeで統合し、live dirty treeをcheckout/restore/cleanしない。validator/testを弱めず、案件ID・顧客・成果物種別をhardcodeせず、重複送信・未承認formal・未承認公開・架空metric・synthetic engagementを0にする。事実が変わるたびspecを更新し、対象pathだけcommit/push。外部承認待ちはそのsubgateだけ保留して他を続行する。同じ失敗が3つの異なる方法で続く、または必須認証/権限/外部承認がなければ代替をDoneとせず、証拠・試行・最小の次行動を残してそのみblockedとする。未完なのに計画やnext stepsだけで停まらない。`

## Fallback discuss-first prompt

`Read /private/tmp/capafy-handover-20260723-root/.claude/handovers/2026-07-23_0556_capafy-gig-run37-sandbox.md and /Users/anicca/anicca-project/docs/superpowers/specs/2026-07-17-capafy-10k-mrr-two-loop-spec.md. Verify the current git/runtime state read-only, list ALL remaining TODOs in canonical order, draw the TO-BE end-state ASCII, then stop and wait for discussion. Do not fix anything yet.`
