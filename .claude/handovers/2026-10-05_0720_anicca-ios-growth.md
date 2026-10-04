# ANICCA iOS Growth lane handover

Verified: 2026-10-05 JST

## Durable routing

- Repository: https://github.com/Daisuke134/anicca-products
- Writable worktree: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan
- Branch/upstream: docs/anicca-ios-growth-plan-20261004 / origin/docs/anicca-ios-growth-plan-20261004
- Verified spec/plan commit: 0b5eb52599f4f7fbc1a36d916a497b06fd93f1ed
- Spec: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md
- Sole Growth TODO/order SSOT: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md, section タスク一覧.
- The spec/plan commit is pushed. Immediately before creating this handover the worktree was clean; this handover artifact is currently untracked and must be committed and pushed before it is used as a restart anchor.
- Fresh origin/main in the docs repository is 825802052a. Its three-file delta from the previously recorded 48e2cbd417c46623802aca863148c6716c41e5dc contains Capafy article data only; no Anicca target code changed.

## Cursor and verified state

Growth cursor remains Task 1. Task 1 is NOT complete: 11 checklist items remain. The first open item is confirming live private ASC keywords, promotional text, metadata update time, localized screenshots, and PPO history from existing owner refs or an authorized readback. The last shared-tab 2FA observation is 2026-10-04T17:59:33Z and is historical only. This run did not inspect the shared browser or issue an ASC API query. AGMSG inbox had no new reply at 2026-10-05 07:19 JST; at 07:14 JST a request was sent to codex-money-printer for existing read-only ASC refs/hashes and current access status, without asking for a duplicate query. The team roster has no addressable pane, so the other session's live status is unverified. Do not call the metadata blocker cleared without new evidence.

Task 1 has useful partial evidence: the Mobile Metrics owner’s saved official FINANCE_DETAIL/Z1 readback maps Apple Identifier 6762049696 and SKU ai.anicca.app.ios.yearly.b to the approved Anicca Annual subscription under app 6755129214; it records one JPY 4,250 partner-share sale settled 2026-09-12. Growth uses Z1 as the one canonical proceeds row and FINANCIAL/ZZ only as non-additive corroboration because a shared transaction/order identity has not been established. This is not CFO import, full refund coverage, net profit, an install-to-paid cohort, or completion of Task 1.

The last saved Anicca product observation in the plan is business date 2026-10-04, observed 2026-10-04T19:01:37.388004Z. It records Discovery Standard Counts 20/14/22 impressions for 10/01–10/03, 5 page-view counts and 1 tap on 10/01/10/02, and one first-time download on 10/02 from App Store Search / DE / iPhone / version 1.9.4. These daily totals do not join to the 0/5 unique-metric owner readback, the separate 09/30–10/02 CFO aggregate, a user cohort, or a settled paid event. RevenueCat MRR and older Apple purchase/proceeds reports remain provider observations with incomplete same-user/settlement joins.

Task 2a paywall-view dedupe source correction is committed and independently reviewed, but it has not been merged or released. Its focused runtime event/build check remains open: at 2026-10-05 07:11 JST Xcode 26.6 had no installed Simulator runtime, disk free was 312 MiB, and no xcodebuild process was running. Do not retry the build until disk/runtime conditions change. Task 2 has six remaining items and Task 3 has twelve. Task 3's Instagram/TikTok readers remain fenced with resource_effect_unknown and no official receipt; do not wake, replay, or close the fence from Growth.

Remaining task counts from the canonical plan: Task 2a 1 runtime gate; Task 1 11; Task 2 6; Task 3 12; Task 4 11; Task 5 8; Task 6 4. Preserve the plan order: Task 2a runtime gate, Task 1 remaining evidence, Task 2 and Task 3 in parallel, then Task 4, Task 5, Task 6. Task 4's public screenshot audit is partial; PPO and onboarding work are not started. Task 5 paywall tests and Task 6 portfolio expansion are not started. The $10K MRR figure is a target, never a completed result without verified revenue evidence.

## Ownership and side effects

Continue in parallel with Mobile Metrics; do not take over its branch. Its read-only candidate worktree is /Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003, branch feat/lm-mobile-metrics-20261003, HEAD/upstream 1f045eff3d27cfec3945cd8d2dff64f06928c834. Tasks 1–3 are source/test complete only in that candidate; the branch has 24 main-only and 34 candidate-only commits, no PR, and issue 6547 remains OPEN with no comments. Production CFO integration, release/readback, and same-user paid attribution remain unproven.

The paywall source candidate is read-only at /Users/anicca/Projects/life-manager-main/.worktrees/anicca-paywall-view-dedupe-20261005, branch fix/anicca-paywall-view-dedupe-20261005, HEAD/upstream 3fee4d6cec74fdd469237a30b880106411c46f26.

Do not touch the shared checkout /Users/anicca/Projects/life-manager-main: its verified state is branch capafy/podcast-clip-hook-lab-offline-20261005, HEAD 7f90ebc20cce7e514fc66efc801679cd3e565b57, behind origin/main by 2 with untracked .claude/skills/ and skills/capafy/catalog/tiktok-shop-hook-lab/. Do not reset, clean, switch, or edit it. Any necessary source change must use a separate worktree from freshly fetched Life Manager origin/main and a non-overlapping owner boundary.

This run changed only the Growth spec/plan and sent one internal AGMSG request. It made no ASC/RevenueCat request, shared-browser action, listing change, production/runtime mutation, source-code edit, PR, merge, or release.

## First safe resume action

Fetch and verify HEAD/upstream/dirty state in the writable Growth worktree. Read this handover and the plan's タスク一覧. Check AGMSG inbox for the requested existing ASC refs; consume only those refs, without issuing a duplicate provider query. If no ref arrives, record the exact missing fields and owner/access condition, then continue only with plan-ordered work that does not cross that owner boundary. Resume the Task 2a Xcode gate only after a real Simulator runtime and sufficient free disk are available.

## User-sendable goal

/goal まずANICCA iOSの成長ループを公式証拠で完成させ、distribution→App Store page→初回価値/onboarding/paywall→server-confirmed paid cohort→retention/refunds→同期間CFO net economicsを測定して反復できる状態にする。検証済み$10K MRRへの実測経路を作り、勝ち筋は公開済みiOSアプリへ一つずつ展開する。$10K MRRは目標であり、同一定義・通貨・期間の公式収益証拠と実測cohort/unit economicsが揃うまで到達を主張しない。最初にこのhandoverとplan/specを読み、current git/runtime/provider/owner stateを再readbackしてから、planの順序を変えずに継続し、証拠・欠損・分母を正本へ更新する。ASC/RevenueCat/CFO/metrics/distribution ownerの既存refsを優先し、同じprovider request、共有browser、fenced loopを重複操作しない。文書編集はrepo Daisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream origin/docs/anicca-ios-growth-plan-20261004、spec/plan commit 0b5eb52599f4f7fbc1a36d916a497b06fd93f1edで行い、編集前にfetchとHEAD/upstream/dirty確認をする。共有checkout /Users/anicca/Projects/life-manager-mainとMobile Metrics/paywall candidate worktreesはread-onlyで扱う。source実装が必要ならfresh Life Manager origin/main由来の専用worktreeでowner境界を切る。意味のある文書更新はcommit/pushしてremote objectを確認する。高リスクな財務・課金結論はfresh read-only reviewを通し、外部証拠が得られない場合だけ不足source/owner/再開条件を明記して止め、未確認を0や達成へ置き換えない。
