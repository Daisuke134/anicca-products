# ANICCA iOS Growth — latest handover

最終readback: 2026-10-05 12:38 JST。full goalはactiveのまま。残TODOの正本はGrowth plan。

## 正本とGit routing

- Repo: `Daisuke134/anicca-products`
- Worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- Branch/upstream/push: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- Handover作成前のverified clean HEAD/upstream/remote: `77bb5063c6e6b24bef8973c89337894119af8611`; handover追加commitが次のbranch tip。再開時はfetchして確認する。
- Spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- 唯一のTODO/order SSOT: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の `タスク一覧`。
- Shared `/Users/anicca/Projects/life-manager-main` はdirty、Capafy offline branch、HEAD `7f90ebc20cce7e514fc66efc801679cd3e565b57`, mainより25 behind、untracked `.claude/skills/` と`skills/capafy/catalog/tiktok-shop-hook-lab/`。触らない。

## 現在位置

Growthの順序はTask 2a build/runtime gate → Task 1残り → Task 2/3 → Task 4 → Task 5 → Task 6。Task 2a source branch `fix/anicca-paywall-view-dedupe-20261005` はlatest main `3f11ad0b8be553914215aa3263fe8d48cf0f763d`と同期済み、HEAD `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`, main ancestor 0/candidate ahead 3, pushed, clean, PRなし。変更はPaywallVariantBViewのredundant direct sender除去と`SingularManager.swift`に`import Singular`を追加したcompile prerequisite。

`verify-source-boundary.sh`, `git diff --check`, Swift parseはPASS。実際のbuild-for-testingは2回disk thresholdで中断し、3回目は`SingularManager.swift`のmissing importでexit 65となった。missing import fix後のcompileは438 MiBで中断し、runtime event countは未確認。最後のXcode clean後、12:38 JST Data free 604 MiB、task DerivedData absent、SourcePackages 1.7 GiB、Simulator `Shutdown`、xcodebuild processなし。appは起動せず、provider/analytics eventは送信していない。

Task 2aのテスト環境にはignored Staging/Production xcconfigがexample由来の`REPLACE_ME`値で存在する。Xcode app-hosted testsはAppDelegateでMixpanelを初期化する。テストのsafe analytics sinkは未実装で、実イベント数・課金cohort・CFO net economicsを示すreceiptはまだない。低disk条件が続く間は再buildせず、別の安全なbuild routeまたはheadroom回復を探す。

最新persisted Anicca rowはbusiness date 10/04 / observed `2026-10-04T22:25:29.147406Z`。Product Analyticsの`paywall_plan_selection_viewed=2`等はraw totalsであり、unique cohort/conversion/purchaseではない。Sales source unavailable/provider_query_failed、PostHog read credential不足、RevenueCat amountはsettled/netと未確認。24 ASC records中6件にREADY_FOR_DISTRIBUTION版あり。$10K MRRは未達・未検証。

Task 1は9 items open、Task 2=6、Task 3=12、Task 4=11、Task 5=8、Task 6=4。CFO/Mobile ownerへの既存テスト経路とreadback refs照会に返信なし、liveness unknown。owner branch/provider requestは引き取らず、Page View collectorも自laneから編集しない。

## 次の作業

1. disk headroomを安全に確保できるowner-approved経路か既存isolated build hostを特定し、Task 2aのfocused build-for-testingを完了する。`.xcresult`削除や別owner cacheの除去で回避しない。
2. app起動時にproduction Mixpanelへ送らないtest pathを確立し、PaywallVariantBViewのone-view/one-event runtime countを確認する。利用可能なreceipt以外をconversionと扱わない。
3. そのgateの待ち時間に、Mobile ownerからPage View Detailed report/raw segment/focused regression refsを受け取り、Task 1をplan順にread-onlyで進める。

## 新しいCodex sessionでユーザーが送る`/goal`

```text
/goal 公開済みANICCA iOSを最初のケースとして、distribution→App Store impression/page view→first-time install→同一user onboarding/value/paywall→server-confirmed paid→renewal/refund→同期間CFO net economicsを公式データで接続し、反復可能な成長手順を実装してANICCAを検証済み$10K MRRまで育て、その後に再現性のある施策を他の公開iOS appへ展開する。Doneは、獲得・課金cohortとofficial receipt/proceeds/refund/fee/payout/actual costが同じ期間・通貨・定義で結ばれ、net economicsを算出でき、ASO/distribution/onboarding/paywallの各施策を前後cohortで評価でき、ANICCAの$10K MRRを公式データで確認すること。未達の$10Kを達成と報告せず、MRR/provider snapshot/client event/gross sales/estimateをsettled profitと混ぜない。最初にこのhandover/spec/planを読み、git/runtime/provider/owner stateを再確認し、planのTODO順とlane境界を守ってDoneまで進める。現在唯一の書込routeはDaisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream/push origin/docs/anicca-ios-growth-plan-20261004、handover作成前に検証したsnapshot commit 77bb5063c6e6b24bef8973c89337894119af8611。編集前にfetchし、HEAD/upstream/dirty stateを確認する。Life Manager source branch `fix/anicca-paywall-view-dedupe-20261005`は`ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`でlatest main `3f11ad0b8be553914215aa3263fe8d48cf0f763d`に同期済み。他のMobile Metrics/CFO branchとshared checkoutはread-onlyとする。ASC metadata/price/public post/runtime/provider stateを変える前にeffect境界を確認し、未確認の外部効果を再送しない。高リスク財務結論は`spawn_agent`でfresh read-only reviewし、source変更はfocused test・runtime/official readback・replay-zero等の該当受入れが揃うまでmerge/releaseしない。重要な不足証拠はspecにowner/source/再開条件付きで記録し、資源や承認が本当に外部依存で安全な操作が残らない時だけその事実を報告する。
```

このgoalは新しいCodex sessionでユーザーが送って起動する。現在のsessionのgoalはactive。
