# ANICCA iOS Growth lane handover

Verified: 2026-10-05 JST

## Durable routing

- Repository: https://github.com/Daisuke134/anicca-products
- Writable worktree: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan
- Branch/upstream: docs/anicca-ios-growth-plan-20261004 / origin/docs/anicca-ios-growth-plan-20261004
- Verified spec/plan commit: 0b5eb52599f4f7fbc1a36d916a497b06fd93f1ed
- Last verified Growth-branch checkpoint before the 2026-10-05 10:20 evidence edit: HEAD/upstream 1210b3b1262c112b6c55ed303fcc4868f9e62abf, clean. Later handover/spec commits advance the branch; fetch and verify current remote HEAD before resuming.
- Spec: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md
- Sole Growth TODO/order SSOT: /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md, section タスク一覧.
- Spec/plan commit 0b5eb52599f4f7fbc1a36d916a497b06fd93f1ed is pushed. This handover is versioned on the same remote branch; before use, fetch and verify that the remote contains this handover and that HEAD/upstream/dirty state are current.
- Fresh origin/main in the docs repository is 825802052a. Its three-file delta from the previously recorded 48e2cbd417c46623802aca863148c6716c41e5dc contains Capafy article data only; no Anicca target code changed.

## Cursor and verified state

Growth cursor remains Task 1 with 10 checklist items remaining. The ASC private-metadata current-state/gap readback is complete; the next open item is the Mobile Metrics owner's Page View normalization/focused regression. ASC API reads succeeded through the Anicca profile in ~/.asc/config.json with ASC_BYPASS_KEYCHAIN=1. The earlier browser login/2FA condition did not block the CLI API path. No raw credential or hidden keyword values were printed.

Task 1 has useful partial evidence: the Mobile Metrics owner’s saved official FINANCE_DETAIL/Z1 readback maps Apple Identifier 6762049696 and SKU ai.anicca.app.ios.yearly.b to the approved Anicca Annual subscription under app 6755129214; it records one JPY 4,250 partner-share sale settled 2026-09-12. Growth uses Z1 as the one canonical proceeds row and FINANCIAL/ZZ only as non-additive corroboration because a shared transaction/order identity has not been established. This is not CFO import, full refund coverage, net profit, an install-to-paid cohort, or completion of Task 1.

The last saved Anicca product observation in the plan is business date 2026-10-04, observed 2026-10-04T19:01:37.388004Z. It records Discovery Standard Counts 20/14/22 impressions for 10/01–10/03, 5 page-view counts and 1 tap on 10/01/10/02, and one first-time download on 10/02 from App Store Search / DE / iPhone / version 1.9.4. These daily totals do not join to the 0/5 unique-metric owner readback, the separate 09/30–10/02 CFO aggregate, a user cohort, or a settled paid event. RevenueCat MRR and older Apple purchase/proceeds reports remain provider observations with incomplete same-user/settlement joins.

Task 2a paywall-view dedupe source correction is committed and independently reviewed, but it has not been merged or released. Its focused runtime event/build check remains open: at 2026-10-05 10:20 JST Xcode 26.6 had no installed Simulator runtime and disk free was 3.5 GiB. No runtime acceptance is claimed. Task 2 has six remaining items and Task 3 has twelve. Task 3's Instagram/TikTok readers remain fenced with resource_effect_unknown and no official receipt; do not wake, replay, or close the fence from Growth.

Remaining task counts from the canonical plan: Task 1 has 10 items and is the current cursor; Task 2a has one Xcode runtime gate that must pass before its source fix can be integrated; Task 2 has 6 items; Task 3 has 12; Task 4 has 11; Task 5 has 8; Task 6 has 4. Preserve the plan order: finish Task 1 evidence, then continue Task 2 and Task 3 in parallel, then Task 4, Task 5, and Task 6. Keep the Task 2a runtime gate attached to its eventual integration decision; it does not reorder the current Task 1 evidence cursor. Task 4's public screenshot audit is partial; PPO and onboarding work are not started. Task 5 paywall tests and Task 6 portfolio expansion are not started. The $10K MRR figure is a target, never a completed result without verified revenue evidence.

## Ownership and side effects

Continue in parallel with Mobile Metrics; do not take over its branch. Its read-only candidate worktree is /Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003, branch feat/lm-mobile-metrics-20261003, HEAD/upstream 1f045eff3d27cfec3945cd8d2dff64f06928c834. Tasks 1–3 are source/test complete only in that candidate; the branch has 32 main-only and 34 candidate-only commits, current origin/main c90b7ca6b9c8790214ccb2dde1d841102c89b75f, no PR, and issue 6547 remains OPEN with no comments. Production CFO integration, release/readback, and same-user paid attribution remain unproven.

The paywall source candidate is read-only at /Users/anicca/Projects/life-manager-main/.worktrees/anicca-paywall-view-dedupe-20261005, branch fix/anicca-paywall-view-dedupe-20261005, HEAD/upstream 3fee4d6cec74fdd469237a30b880106411c46f26.

Do not touch the shared checkout /Users/anicca/Projects/life-manager-main: its verified state is branch capafy/podcast-clip-hook-lab-offline-20261005, HEAD 7f90ebc20cce7e514fc66efc801679cd3e565b57, behind origin/main by 10 with untracked .claude/skills/ and skills/capafy/catalog/tiktok-shop-hook-lab/. Do not reset, clean, switch, or edit it. Any necessary source change must use a separate worktree from freshly fetched Life Manager origin/main and a non-overlapping owner boundary.

This continuation updated Growth evidence docs, sent AGMSG owner requests, and made read-only ASC API pulls/status checks using the Anicca profile with ASC_BYPASS_KEYCHAIN=1. It did not use Keychain, change metadata, submit or publish a version, alter production/runtime, edit source code, open a PR, merge, or release.

## First safe resume action

Fetch and verify HEAD/upstream/dirty state in the writable Growth worktree. Read this handover and the canonical plan. The current cursor is the Mobile Metrics-owned Page View normalization/focused regression; ask the owner through AGMSG and do not edit that branch. Then continue Task 1 in order. ASC API access is available for targeted read-only evidence via the Anicca profile; keep hidden keyword values in private local state. Do not submit the rejected 1.9.5 metadata or change the App Store listing from this lane. Keep the Task 2a Xcode runtime gate before integration.

## 2026-10-05 08:28 JST latest blocker refresh

After the 08:24 JST update, another fresh readback at 08:28 JST still shows the ASC page at appstoreconnect.apple.com/login, no new AGMSG reply, no ASC provider request, and no browser navigation/click. The Mobile owner request from 08:18 JST is unanswered. Disk free is now 456 MiB, Xcode 26.6 still has no Simulator runtime, and no xcodebuild process is running. The Growth worktree was clean at HEAD/upstream 9ab863283ee6be036c4b200ce0b9c93f73228885 before this status edit. The same ASC access blocker has appeared in three fresh checks (07:19, 08:24, 08:28 JST); Task 1 remains the current cursor with 11 items open.

## 2026-10-05 10:29 JST Mobile Metrics owner refresh

Life Manager origin/main is c90b7ca6b9c8790214ccb2dde1d841102c89b75f; the Mobile Metrics candidate remains clean at 1f045eff3d27cfec3945cd8d2dff64f06928c834, 32 main-only / 34 candidate-only, no PR, issue #6547 OPEN. Current main and candidate both retain the Event="Page View" predicate, while the saved Apple Standard report has Event="Page view". The latest Growth request asks the owner to normalize the raw enum and provide a focused regression/same-request report ref; AGMSG inbox had no reply at 10:29 JST. Growth keeps this source owner boundary and does not patch the branch.

## 2026-10-05 10:20 JST ASC readback refresh

ASC credentials were found after a deeper SSOT inspection: credentials.json has 72 records and record 71 carries Apple service metadata plus a password field; no secret value was shown. The ASC CLI's Anicca profile in ~/.asc/config.json (0600) worked with ASC_BYPASS_KEYCHAIN=1, so no Keychain was used and read-only ASC API access is confirmed. The Growth lane now has official localization, screenshot, PPO, version, review-history, and review-doctor readbacks summarized in the plan/spec. The raw v1.9.4 and current editable v1.9.5 metadata pulls are private local artifacts under /Users/anicca/.local/state/life-manager/asc-readbacks/, with directory mode 0700 and files mode 0600.

Live v1.9.4 is READY_FOR_SALE; editable v1.9.5 is REJECTED. The v1.9.5 rejected-version current keywords match the six tracked Fastlane candidates, while live v1.9.4 does not. The only recorded v1.9.5 submission was 2026-07-04, before the candidate Fastlane files were added on 2026-09-17, so the exact submitted snapshot remains unknown. PromotionalText and localization update timestamps are absent from the pull output. Both versions have four screenshots in each of seven locale sets; all seven PPO experiments are stopped. Review Doctor has four current blockers plus keyword duplicate warnings; those are not asserted as the historical rejection cause.

Task 1 now has 10 remaining checklist items; the next cursor is the Mobile Metrics owner's Page View collector normalization/regression. The latest Life Manager main is 30386440a50db8e9d0d2331c3be9d2d395a22555; the candidate is clean HEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834, 30 main-only / 34 candidate-only commits, no PR, issue #6547 OPEN. Current main and candidate both still filter Event="Page View" while the saved Apple report uses Event="Page view". Keep source ownership with Mobile Metrics; Growth only consumes official refs. Xcode 26.6 still has no Simulator runtime, despite 3.5 GiB free disk.

This turn used only read-only ASC API pulls and one review-readiness query; metadata was not changed, no submission was created, and there was no public listing change, PR, merge, or release. Owner AGMSG requests remain unanswered.

ASC readback now distinguishes the live 1.9.4 listing from the rejected 1.9.5 draft: the draft localization matches six tracked Fastlane candidate files, but the only recorded 1.9.5 submission predates those files. Exact submission payload, promotionalText value, and localization edit time remain unverified. Screenshots/PPO and review readiness are summarized in the current spec section.

## 2026-10-05 10:29 JST owner refresh

Mobile Metrics origin/main is c90b7ca6b9c8790214ccb2dde1d841102c89b75f; its clean candidate is 1f045eff3d27cfec3945cd8d2dff64f06928c834, 32 main-only / 34 candidate-only, no PR, issue #6547 OPEN. Current main and candidate both retain the uppercase Page View predicate while the saved Apple report emits lowercase Page view. A concrete owner request for normalization/regression and same-request ref was sent; inbox has no reply as of 10:29 JST. Growth leaves owner source unchanged.

## User-sendable goal

/goal ANICCA iOSの成長ループを公式証拠で完成させ、distribution→App Store page→初回価値/onboarding/paywall→server-confirmed paid cohort→retention/refunds→同期間CFO net economicsを測定して反復できる状態にする。検証済み$10K MRRへの実測経路を作り、勝ち筋は公開済みiOSアプリへ一つずつ展開する。$10K MRRは目標であり、同一定義・通貨・期間の公式収益証拠と実測cohort/unit economicsが揃うまで到達を主張しない。最初に /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/.claude/handovers/2026-10-05_0720_anicca-ios-growth.md とplan/specを読み、current git/runtime/provider/owner stateを再readbackしてから、planの順序を変えずに継続し、証拠・欠損・分母を正本へ更新する。ASC/RevenueCat/CFO/metrics/distribution ownerの既存refsを優先し、同じprovider request、共有browser、fenced loopを重複操作しない。文書編集はrepo Daisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream origin/docs/anicca-ios-growth-plan-20261004、verified spec/plan snapshot commit 0b5eb52599f4f7fbc1a36d916a497b06fd93f1edを基点とし、編集前にfetchしてremote branch tip/HEAD/upstream/dirty stateを確認する。共有checkout /Users/anicca/Projects/life-manager-mainとMobile Metrics/paywall candidate worktreesはread-onlyで扱う。source実装が必要ならfresh Life Manager origin/main由来の専用worktreeでowner境界を切る。意味のある文書更新はcommit/pushしてremote objectを確認する。高リスクな財務・課金結論はfresh read-only reviewを通し、外部証拠が得られない場合だけ不足source/owner/再開条件を明記して止め、未確認を0や達成へ置き換えない。
