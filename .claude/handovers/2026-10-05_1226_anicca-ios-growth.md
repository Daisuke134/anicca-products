# ANICCA iOS Growth — latest handover

最終readback: 2026-10-05 12:26 JST。full goalはactiveのまま。残TODOの唯一の正本はGrowth plan。

## 正本とGit routing

- Repo: `Daisuke134/anicca-products`
- Worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- Branch/upstream/push: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- Handover作成前のverified clean HEAD/upstream/remote: `47d8da19f0900be42561cbfa9424f6ab1b6edbed`; handover追加commitが次のbranch tip。再開時はfetchして確認する。
- Spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- 唯一のTODO/order SSOT: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の `タスク一覧`。
- `/Users/anicca/Projects/life-manager-main` shared checkoutは`capafy/podcast-clip-hook-lab-offline-20261005`, HEAD `7f90ebc20cce7e514fc66efc801679cd3e565b57`, mainより11 behind、untracked `.claude/skills/` と `skills/capafy/catalog/tiktok-shop-hook-lab/`。触らない。

## 現在位置

順序はTask 2a runtime/build gate → Task 1残り → Task 2/3 → Task 4 → Task 5 → Task 6。Growth docsにTask 2aのcompile failureと復旧試行を記録済み。

Life Manager latest mainは`3f11ad0b8be553914215aa3263fe8d48cf0f763d`。専用feature branch `fix/anicca-paywall-view-dedupe-20261005` はmain同期済み（merge `c1d67a0e6aa37e0316e51e60167b01895e7943f2`）、HEAD `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`, main ahead 0 / feature ahead 3, clean, pushed, PRなし。BranchにはPaywallVariantBViewのredundant direct event sender削除と、mainのcompiler blocker `SingularManager.swift`への`import Singular`のみ。`verify-source-boundary.sh`, `git diff --check`, `swiftc -frontend -parse SingularManager.swift` PASS。

Task 2aのbuild/runtime acceptanceは未完了。Xcode 26.6 / iOS 26.5 runtime installed、target simulator `Shutdown`。9 SPM packagesは`/Users/anicca/Library/Developer/Xcode/SourcePackages`にresolved (1.7 GiB)。ignored `Staging.xcconfig`/`Production.xcconfig`はexample由来の`REPLACE_ME` valuesのみ、mode 0600。arm64 buildでSingular import以前のREDは`/Users/anicca/.local/state/life-manager/xcode-task2a-build-20261005T030810Z.log` (SHA `7c78200590b9e93318448f9a3472570009e405a0a006b54206eca38b49c6c7b6`)。import後buildはdisk thresholdでcancelされ、再clean後の12:26 JST Data freeは444 MiB、DerivedData 135 MiB、xcodebuildなし。test target/appは起動せず、provider/analytics eventは送っていない。もう一度compileする前にdisk headroomを安全に確保する必要がある。`.xcresult`や他ownerのdataを削除して空きを作らない。

Task 1は9 items open。最新persisted Anicca rowはbusiness date 10/04 / observed `2026-10-04T22:25:29.147406Z`; event countsはraw totalsで、unique cohortやpaid conversionではない。App Store Sales unavailable/provider_query_failed、PostHog read credential不足、RevenueCat source availableだがsettled/net amountは未確認。CFO/Mobile ownerへの既存evidence/test-route依頼に返信なし、liveness unknown。他lanes/source/provider stateを引き取らない。

Task 2=6, Task 3=12, Task 4=11, Task 5=8, Task 6=4。ASC listは24 records/6 READY_FOR_DISTRIBUTION、Anicca 1.9.4→build390 (expired), 1.9.5 rejected→build365 (expired)。$10K MRRは未達・未検証。

## 次の安全な作業

1. Disk headroom復旧の既存owner-approved手段か、隔離build hostを特定する。Xcode cacheは既に1.7 GiB、DerivedDataは135 MiBで、最近のarm64 compileは1 GiB未満まで容量を減らした。削除コマンドでreview制約を回避しない。
2. その後feature branch `ee0d651...` でfocused build-for-testingを完了し、provider trafficを避けたone-view/one-event runtime proofを取る。production Mixpanel/RevenueCat credentialは使わない。
3. Task 1はMobile ownerから`Page view` collector regression/Detailed report same-request refsを受けてread-onlyで反映し、Growth内の残り9項目をplan順に続ける。

## 新sessionでユーザーが送る`/goal`

```text
/goal 公開済みANICCA iOSを最初のケースとして、distribution→App Store impression/page view→first-time install→同一user onboarding/value/paywall→server-confirmed paid→renewal/refund→同期間CFO net economicsを公式データで接続し、反復可能な成長手順を実装してANICCAを検証済み$10K MRRまで育て、その後に再現性のある施策を他の公開iOS appへ展開する。Doneは、獲得・課金cohortとofficial receipt/proceeds/refund/fee/payout/actual costが同じ期間・通貨・定義で結ばれ、net economicsを算出でき、ASO/distribution/onboarding/paywallの各施策を前後cohortで評価でき、ANICCAの$10K MRRを公式データで確認すること。未達の$10Kを達成と報告せず、MRR/provider snapshot/client event/gross sales/estimateをsettled profitと混ぜない。最初にこのhandover/spec/planを読み、git/runtime/provider/owner stateを再確認し、planのTODO順とlane境界を守ってDoneまで進める。現在唯一の書込routeはDaisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream/push origin/docs/anicca-ios-growth-plan-20261004、handover作成前に検証したsnapshot commit 47d8da19f0900be42561cbfa9424f6ab1b6edbed。編集前にfetchし、HEAD/upstream/dirty stateを確認する。Life Manager source branch `fix/anicca-paywall-view-dedupe-20261005` (HEAD `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`)以外のMobile Metrics/CFO branchやshared checkoutはread-onlyとし、必要ならlatest main由来の専用worktreeを使う。ASC metadata/price/public post/runtime/provider stateを変える前にeffect境界を確認し、未確認の外部効果を再送しない。高リスク財務結論は`spawn_agent`でfresh read-only reviewし、source変更はfocused test・runtime/official readback・replay-zero等の該当受入れが揃うまでmerge/releaseしない。重要な不足証拠はspecにowner/source/再開条件付きで記録し、資源や承認が本当に外部依存で安全な操作が残らない時だけその事実を報告する。
```

新Codex sessionで送ればgoalを起動できる。現在のsessionのgoalはactive。
