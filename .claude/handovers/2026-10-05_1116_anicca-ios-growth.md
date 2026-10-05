# ANICCA iOS Growth — restart handover

最終readback: 2026-10-05 11:11 JST。これは再開用の索引であり、残TODOの正本はplanです。

## 正本とGit routing

- Repo: `Daisuke134/anicca-products`
- Worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- Branch/upstream/push: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- このhandover作成前の検証済みclean HEAD: `f6921659b60f5b421f3e2d1d87cde398f53f2131`。このhandover追加commitが次のbranch tipになる。再開時はfetchしてHEAD/upstream/dirty stateとremote tipを検証する。
- Spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- 唯一のTODO/order SSOT: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の `タスク一覧`。
- Shared checkout `/Users/anicca/Projects/life-manager-main` は `capafy/podcast-clip-hook-lab-offline-20261005`, HEAD `7f90ebc20cce7e514fc66efc801679cd3e565b57`, mainより11 behind、untracked `.claude/skills/` と `skills/capafy/catalog/tiktok-shop-hook-lab/` がある。触らない。

## 現在位置

ASC CLI 5.9.2は既存Anicca profileをKeychain bypassでread-only利用できる。24 ASC app recordsのうち6件が`READY_FOR_DISTRIBUTION`。Anicca 1.9.4は公開版でbuild 390、1.9.5はrejectedでbuild 365。両buildはexpired。安全な投影と正確なhashはspec §2026-10-05 11:06 JSTにある。ASC metadata変更・提出・公開はしていない。

Growthの順序はTask 2a runtime gate → Task 1残り → Task 2/3 → Task 4 → Task 5 → Task 6。Task 2a source fix commit `3fee4d6cec74fdd469237a30b880106411c46f26` は未統合・未releaseで、focused runtime testとone-view/one-eventの受入れは未実施。11:11 JSTはiOS 26.5 runtime installed、simulator `Shutdown`、Data volume free 1.7 GiB / capacity 100%、xcodebuildなし。次は依存packageのローカル状態とproduction Mixpanel telemetryを避ける実行条件を確認し、安全ならfocused testを実行する。空き容量だけで成功/失敗を推定しない。

その後のTask 1は9 items open。最初はMobile Metrics ownerのApple event `Page view` とcollector predicate `Page View` の修正・focused regression・同一request ref。Mobile candidate `/Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003`, branch `feat/lm-mobile-metrics-20261003`, HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`, `origin/main=2a8d40e68f306105c59fa21631f6b9bf01ab5c90`, 33 main-only / 34 candidate-only, PRなし, issue #6547 OPEN。ここはread-onlyで、source fixを引き取らない。

Paywall候補worktree `/Users/anicca/Projects/life-manager-main/.worktrees/anicca-paywall-view-dedupe-20261005`, branch `fix/anicca-paywall-view-dedupe-20261005`, HEAD `3fee4d6cec74fdd469237a30b880106411c46f26`, latest mainより9 behind / 1 ahead、PRなし。今はread-onlyとし、実装が必要なら最新main由来の専用worktreeを作る。

CFO primary `codex-money-printer` とowner `lm-cfo-observability-1002`へ既存の公式readback参照のみをAGMSGで依頼済み。11:11 JST inboxに返信なし、相手の稼働状態は不明。利益・settlement・$10K達成は未確認。provider再取得やCFO source/state変更を重ねない。

Task 1 checklistは9件、Task 2は6件、Task 3は12件、Task 4は11件、Task 5は8件、Task 6は4件。詳細順序・既存証拠・不足sourceはplan/specを読む。$10K MRRは未達を達成として扱わない。

## First resume actions

1. このファイルとspec/planを読み、上記Git/runtime/ASC/owner stateを再readbackする。
2. Task 2aのfocused validationがproduction telemetryを汚さず実行できるか調べる。diskやtelemetry境界が不明なら無理に起動せず、具体的な失敗境界を記録し、順序を変えずに独立して進められるTask 1 owner-ref workへ進む。
3. CFO/Mobile laneはAGMSGで既存artifact path/hashを受け取ってread-only接続する。担当branch・provider request・effect fenceを引き取らない。
4. Meaningfulな証拠/計画更新はspec/planへ記録し、このdocs branchにcommit/pushする。財務結論がDone判断を変える場合はfresh read-only reviewを通す。

## 新しいCodex sessionで使うgoal

```text
/goal 公開済みANICCA iOSを最初のケースとして、distribution→App Store impression/page view→first-time install→同一user onboarding/value/paywall→server-confirmed paid→renewal/refund→同期間CFO net economicsを公式データで接続し、反復可能な成長手順を実装してANICCAを検証済み$10K MRRまで育て、その後に再現性のある施策を他の公開iOS appへ展開する。Doneは、獲得・課金cohortとofficial receipt/proceeds/refund/fee/payout/actual costが同じ期間・通貨・定義で結ばれ、net economicsを算出でき、ASO/distribution/onboarding/paywallの各施策を前後cohortで評価でき、ANICCAの$10K MRRを公式データで確認すること。未達の$10Kを達成と報告せず、MRR/provider snapshot/client event/gross sales/estimateをsettled profitと混ぜない。最初にこのhandover/spec/planを読み、git/runtime/provider/owner stateを再確認し、planのTODO順とlane境界を守ってDoneまで進める。現在唯一の書込routeはDaisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004、upstream/push origin/docs/anicca-ios-growth-plan-20261004、handover作成前に検証したsnapshot commit f6921659b60f5b421f3e2d1d87cde398f53f2131。編集前にfetchし、HEAD/upstream/dirty stateを確認する。Life Manager Mobile Metrics candidate、paywall candidate、CFO worktree/source/stateおよび共有checkoutはread-onlyとし、実装が必要なら最新main由来の新しい専用worktreeを作る。ASC metadata/price/public post/runtime/provider stateを変える前にeffect境界を確認し、未確認の外部効果を再送しない。高リスク財務結論は`spawn_agent`でfresh read-only reviewし、source変更はfocused test・runtime/official readback・replay-zero等の該当受入れが揃うまでmerge/releaseしない。重要な不足証拠はspecにowner/source/再開条件付きで記録し、資源や承認が本当に外部依存で安全な操作が残らない時だけその事実を報告する。
```

このgoalは新しいCodex sessionへ貼り付けて起動する。現在のsessionではgoalを再設定していない。
