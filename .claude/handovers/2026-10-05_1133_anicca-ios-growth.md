# ANICCA iOS Growth — latest handover

最終readback: 2026-10-05 11:33 JST。再開時は必ずspec/planとcurrent provider/git stateを読み直すこと。

## 正本・branch

- Repo: `Daisuke134/anicca-products`
- Worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- Branch/upstream/push: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- Handover作成前のcleanなHEAD/upstream/remote: `5e99723ac5f0c005b01aacd705e406bf5c7ed9e2`; このhandoverをcommitした後は新branch tipを再確認する。
- Spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- 唯一のremaining TODO/order SSOT: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の `タスク一覧`。
- `/Users/anicca/Projects/life-manager-main` shared checkoutはdirty、branch `capafy/podcast-clip-hook-lab-offline-20261005`, HEAD `7f90ebc20cce7e514fc66efc801679cd3e565b57`, origin/mainより11 behind、untracked `.claude/skills/` と `skills/capafy/catalog/tiktok-shop-hook-lab/`。触らない。

## Current cursorと証拠

正本順はTask 2a runtime gate → Task 1残り → Task 2/3 → Task 4 → Task 5 → Task 6。Task 2aのevent dedupe source fixはcommit `3fee4d6cec74fdd469237a30b880106411c46f26`でreview済みだが、未統合・未release。最新main `2a8d40e68f306105c59fa21631f6b9bf01ab5c90`ではdirect event + helperの2 sender、候補branchではhelperの1 sender。runtime one-view/one-event proofはまだない。

Task 2a test環境のread-only状態: iOS 26.5 runtime installed、simulator `Shutdown`、Data volume free 1.8 GiB / capacity 100%。候補worktreeとshared checkoutの両方で`Staging.xcconfig`/`Production.xcconfig`がなく、examplesはRC/Mixpanel `REPLACE_ME`。Xcode app projectは9 remote SPM packagesをpinするが、local `SourcePackages`と`DerivedData`は空。AppDelegateはpaywall前にMixpanelを構成し、既存unit testはevent raw stringだけをassertする。UI testのsafe test-mode/sinkは見つかっていない。build/testは実行していない。実イベント試験前にprovider/telemetry隔離とtest inputsを解決する。

最新persisted Anicca `business-outcomes.jsonl` rowはbusiness date 2026-10-04 / observed `2026-10-04T22:25:29.147406Z`。Discovery window 10-01..10-03 (43 rows, SHA `98ce6116378dfd1b7fc3921491dfb0fc5ed443b0ac0a3eb671f8ce65f00a5084`); Downloads report 1 row (SHA `b49f392b5fa9c70de77d9b6c1716b8dcf0afaa6b56ef58d04490410b1bd81f73`); purchases/subscription reports and hashes are recorded in the plan. Product Analytics raw events include `paywall_plan_selection_viewed=2`, `paywall_primer_viewed=3`, `app_opened=5`, onboarding started 2/step advanced 12/completed 1. These are raw counts, not unique-user conversion or purchases. `app_store_sales=unavailable/provider_query_failed`; PostHog is missing read credential; RevenueCat source is available but no amount is asserted as settled/net. `$10K MRR` remains unverified.

Task 1 has 9 open items; first is Mobile owner Page View enum normalization/regression and same-request report refs. Task 2=6, Task 3=12, Task 4=11, Task 5=8, Task 6=4. CFO/Mobile owner `lm-cfo-observability-1002` was asked at 11:28 JST for existing test path and refs; inbox at 11:33 had no reply, liveness unknown. Keep its branches and provider requests read-only; continue independent Task 1 evidence without changing order.

## Next actions

1. Inspect whether a standard isolated test configuration exists in the owner path or CI; do not copy production keys or emit Mixpanel events to production. If there is no safe existing route, design the smallest test-only event sink in a fresh latest-main-derived worktree, follow TDD, and preserve the one-event acceptance requirement.
2. While that gate is open, continue Task 1 by consuming owner-provided Page View/Detailed-report refs and by recording the newest local row above without converting raw counts into conversion.
3. Update this spec/plan with each material readback; commit/push meaningful docs changes. Code changes require latest main, dedicated branch, focused tests, review and the repository promotion path; do not merge/release from source-only or fixture evidence.

## User-sendable `/goal` for a new Codex session

```text
/goal 公開済みANICCA iOSを最初のケースとして、distribution→App Store impression/page view→first-time install→同一user onboarding/value/paywall→server-confirmed paid→renewal/refund→同期間CFO net economicsを公式データで接続し、反復可能な成長手順を実装してANICCAを検証済み$10K MRRまで育て、その後に再現性のある施策を他の公開iOS appへ展開する。Doneは、獲得・課金cohortとofficial receipt/proceeds/refund/fee/payout/actual costが同じ期間・通貨・定義で結ばれ、net economicsを算出でき、ASO/distribution/onboarding/paywallの各施策を前後cohortで評価でき、ANICCAの$10K MRRを公式データで確認すること。未達の$10Kを達成と報告せず、MRR/provider snapshot/client event/gross sales/estimateをsettled profitと混ぜない。最初にこのhandover/spec/planを読み、git/runtime/provider/owner stateを再確認し、planのTODO順とlane境界を守ってDoneまで進める。現在唯一の書込routeはDaisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream/push origin/docs/anicca-ios-growth-plan-20261004、handover作成前に検証したsnapshot commit 5e99723ac5f0c005b01aacd705e406bf5c7ed9e2。編集前にfetchし、HEAD/upstream/dirty stateを確認する。Life Manager Mobile Metrics candidate、paywall candidate、CFO worktree/source/stateおよび共有checkoutはread-onlyとし、実装が必要なら最新main由来の新しい専用worktreeを作る。ASC metadata/price/public post/runtime/provider stateを変える前にeffect境界を確認し、未確認の外部効果を再送しない。高リスク財務結論は`spawn_agent`でfresh read-only reviewし、source変更はfocused test・runtime/official readback・replay-zero等の該当受入れが揃うまでmerge/releaseしない。重要な不足証拠はspecにowner/source/再開条件付きで記録し、資源や承認が本当に外部依存で安全な操作が残らない時だけその事実を報告する。
```

このgoalは新しいCodex sessionでユーザーが送って起動する。現在のsessionでは別goalを作成していない。
