# ANICCA iOS 成長改善の実行計画

> 実行担当者: 継続目標はこの計画を順に進め、ANICCA iOSの獲得・収益改善ループを実測で成立させる。現在cursorはTask 2aのprovider-isolated runtime event gate。source fixと全app/test targetの`build-for-testing`は最新main同期branch上でPASSしたが、アプリ/testは起動しておらずone-view/one-event runtime proofは未実施。Task 1は9件残り、Task 3はeffect fenceとstore/paid attribution未解決。各Taskの変更範囲とowner境界を守り、計画文書の更新を製品成果や$10K達成と扱わない。

**Goal:** 公開済みANICCAで獲得・初回価値・課金・継続を測り、売上を改善する反復手順を作る。

**Architecture:** ASC、Mixpanel、RevenueCatの既存構成を再利用する。計測と配信を並行し、ASO、価値体験、課金方式を一変数ずつ改善する。収益の正本は実取引とし、クライアントイベントを二重に数えない。

**Tech Stack:** SwiftUI、Mixpanel、PostHog、RevenueCat、ASC CLI、Apple PPO/CPP。

**Spec:** `docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`

## Global Constraints

- 継続目標は公開ANICCAの成長ループを一つずつ改善すること。Growthの正本cursorはこの計画で管理し、ownerのprovider/stateを重ねない。
- Growth spec/plan/handoverは `Daisuke134/anicca-products` に置き、ANICCA iOS sourceはLife Managerの `Daisuke134/life-manager/apps/mobile/anicca-ios` を唯一のcode authorityとする。ソース変更は最新 `life-manager origin/main` 由来の専用worktreeで行う。
- ASC metadata、購読条件、広告、公開投稿、稼働中の配信loopは、現owner/effect状態とTaskの範囲を確認せずに変更・再送しない。
- 共有checkout `/Users/anicca/anicca-project` の他者変更を戻さない。
- 将来の実装はその時点の最新main由来の専用worktree/branchに置く。この文書branchを製品リリースに使わない。
- Codexの計画/調査/レビューは `gpt-6.1-sol` / `medium`、実装は `gpt-6-luna` / `max`。generic subagentを使う場合はモデルとeffortを明示する。
- 一実験の主要仮説は一つ。国、言語、版、期間、コホートをそろえる。
- 購入正本はサーバー取引。Sandbox、restore、pending、cancelを新規有料購入に数えない。
- MRR、年額売上、買い切り、Developer Proceeds、入金、利益を分ける。
- 低標本の結果を勝者扱いしない。未取得を0としない。
- mobile collector/ASC・RC取得/Finance Detail/CFO接続は既存 `lm-cfo-observability-1002` の成果を再利用し、同じ実装・provider操作・shared state書込を重複させない。

## Review Focus

1. 再表示・再起動・購読delegate更新で表示や新規購入を二重に数えない。Task 2が所有。
2. offeringsの空/通信失敗時に購入不能のまま閉じ込めない。Task 5が所有。
3. restore/取消/pendingと実課金の区別、既存有料ユーザーの権利を保つ。Task 2/5が所有。
4. soft-dismiss後の無料範囲と再課金、通知拒否後の継続が整合する。Task 4/5が所有。
5. 匿名ID/版変更/再訪でコホートや実験割当が重複・変更しない。Task 2/5が所有。

## タスク一覧 — 残作業の正本

### レーン分担と最新readback（2026-10-05）

#### 最新の公式readback・実行cursor（2026-10-05 11:06 JST）

- 文書repoは`Daisuke134/anicca-products`、worktree `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`、branch `docs/anicca-ios-growth-plan-20261004`。fetch後の編集前HEAD/upstreamは`51570824875232275070e512deaafa896e610456`で一致、clean。docs `origin/main=825802052acbcb543f22927579ae4ae5e620d7ac`。
- Daisの明示依頼により、既存CLI資格情報を使った`ASC_BYPASS_KEYCHAIN=1 asc --read-only --profile Anicca`の公式API readbackを実施した。ASC CLI 5.9.2。認証は成功し、Keychain経由ではない。ASC app recordは24件、`READY_FOR_DISTRIBUTION` filterは6件。安全な投影JSONは`/Users/anicca/.local/state/life-manager/asc-readbacks/anicca-app-roster-20261005T020355Z/`に保存し、directory 0700 / files 0600。`apps.json` SHA-256 `bcdd098673fa997ee02fca7c429755b2c6ec8c43a34a069e07d265c4c0c2eb38`、`ready.json` SHA-256 `5438ea81f8743974be811d942fac87c3e87423f82913647b7befa7232fe2c4a8`。
- App Store VersionからBuildへの直接relationshipをread-onlyで取得した。1.9.4=`READY_FOR_DISTRIBUTION`/`READY_FOR_SALE`, build 390 (`VALID`, 2026-09-21 expired); 1.9.5=`REJECTED`/`REJECTED`, build 365 (`VALID`, 2026-10-02 expired)。response path `/Users/anicca/.local/state/life-manager/asc-readbacks/anicca-build-relation-20261005T015748Z/versions.json`, SHA-256 `04f6fdeac0d8ad09efe771486a4887f04b376a302023b8942e344b1f4033b99f`。現公開versionは1.9.4。これはversion/build対応の証拠であり、現在の購入checkout/offeringやsource buildの公開を証明しない。
- 最新のLife Manager `main=2a8d40e68f306105c59fa21631f6b9bf01ab5c90`。Mobile Metrics候補worktreeはclean、HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`、main-only 33 / candidate-only 34、PRなし。Issue #6547はOPEN、comments 0、updated `2026-10-03T22:42:08Z`。最新mainでもcollectorは`Event === "Page View"`のまま、保存済みApple Standard reportは`Page view`。Page View修正はMobile Metrics ownerの範囲であり、このlaneは編集しない。
- Task 2a source branch `/Users/anicca/Projects/life-manager-main/.worktrees/anicca-paywall-view-dedupe-20261005`, branch `fix/anicca-paywall-view-dedupe-20261005`, HEAD `3fee4d6cec74fdd469237a30b880106411c46f26`, clean / upstream一致 / PRなし。latest mainのactive `PaywallVariantBView`はdirect event + helperの二経路、candidate branchはredundant direct callを除いた一経路。source correction/reviewは完了、runtime acceptance・main integration・releaseは未完。
- Xcode 26.6でiOS 26.5 runtimeがあり、`AniccaGrowthTask2a` simulator (UDID `2DD080F2-F9F3-45DA-99E3-BAF4F1C60C1C`)はBooted。11:04 JST disk readbackは880 MiB free、xcodebuild processなし。今回はbuild/testを開始していないため、Task 2a one-view/one-event runtime proofは未確認。ブロッカーはmissing runtimeから低disk headroomへ変わった。
- CFO照会はprimary `codex-money-printer`とCFO owner `lm-cfo-observability-1002`へAGMSG送信済み。11:06 JST inboxはno new messages。team rosterでは相手のaddressable paneを確認できず、稼働状態はunknown。既存CFO refs待ちであり、provider再取得・CFO source変更はしていない。
- **Order ruling:** 正本順はTask 2a runtime gate → Task 1残り → Task 2/3並行 → Task 4 → Task 5 → Task 6のまま。Daisの依頼に基づく後続のASC app/build read-only証拠を先行取得して該当checkboxだけを閉じたが、TODO順は変更していない。Task 2aはdisk条件のため安全に進められず、現在実行可能なcursorはTask 1最初の未完項目であるMobile ownerのPage View predicate/fixture修正とfocused regression。Task 1は9件残る。

#### 2026-10-05 11:11 JST Xcode/runtime resource refresh

- Fresh readback: data volume has 1.7 GiB available and reports 100% capacity; iOS 26.5 runtime remains installed, `AniccaGrowthTask2a` simulator is currently `Shutdown`, and no xcodebuild process is running. This supersedes the earlier 11:04 observation of 880 MiB with the simulator Booted.
- Read-only directory sizing found 132 MiB under `~/Library/Developer/Xcode` and 754 MiB under `~/Library/Developer/CoreSimulator`; protected cache directories caused permission-denied lines in the broader `du` call. No cleanup or deletion was performed. These values do not establish that a test build will fit.
- **Current ordered cursor remains Task 2a's focused Xcode/runtime acceptance**, which is open rather than blocked. Before running it, inspect local package availability and ensure the one-view/one-event check cannot send production Mixpanel telemetry; then run only if disk/telemetry conditions are safe. If not, record the exact failed boundary and continue the independent Task 1 Page View owner/ref work without changing order.

#### 2026-10-05 11:33 JST saved-funnel and test-input refresh

- The newest persisted Anicca row in `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/state/business-outcomes.jsonl` has `business_date=2026-10-04`, `observed_at=2026-10-04T22:25:29.147406Z`. The earlier 19:01Z row is historical, not current.
- In the new row, official ASC Discovery is available for 2026-10-01..10-03 (43 rows, processing 10-04, evidence SHA `98ce6116378dfd1b7fc3921491dfb0fc5ed443b0ac0a3eb671f8ce65f00a5084`); Downloads is available (1 row, processing 10-04, SHA `b49f392b5fa9c70de77d9b6c1716b8dcf0afaa6b56ef58d04490410b1bd81f73`); Purchases is 1 row for 09-07 (processing 09-18, SHA `eb0c76a76ee18112173fc57bd0f1b809fc3de86e7f1232d206159cea9488201c`); Subscription Events is 1 row for 09-12 (processing 09-15, SHA `c338d96d24ff7dcc77475bb18ba597c97a5ead185e77c477e843971942078068`); Subscription State is 81 rows for 10-01..10-03 (processing 10-04, SHA `cf183ec6c45044282bc53d2ea356b4a0f0a91c6fd8e82e327acf72b53fc6caf5`). These are reports/windows, not a same-user funnel or bank-settled net.
- The same row's Product Analytics raw event counts are `app_opened=5`, `onboarding_started=2`, `onboarding_step_advanced=12`, `onboarding_completed=1`, `onboarding_insight_completed=1`, `onboarding_struggle_depth_completed=1`, `paywall_primer_viewed=3`, `paywall_plan_selection_viewed=2`, and rating prompt counts 1/1/1. They are event totals, not unique-user conversion or purchase evidence. RevenueCat is `available` with evidence SHA `072dc08196165b6851e0e04f1cf41a1ed159ee772fd90057c0b12df1cc42c2fb` but its current amounts/definitions are not promoted to verified net revenue. `app_store_sales` remains `unavailable/provider_query_failed`; PostHog remains `unavailable/missing_project_read_credential`.
- Task 2a test inputs are absent in both the candidate and shared checkout: `Configs/Staging.xcconfig` and `Configs/Production.xcconfig` do not exist; only examples containing placeholder tokens and an invalid example API host exist. The Xcode project references the ignored files. Its `Package.resolved` pins nine remote packages; Xcode `DerivedData` and `SourcePackages` caches are empty. Existing `test_analytics_paywallPlanSelectionViewed_exists` only checks the event's raw string. The UI E2E launches the app, `AppDelegate` initializes Mixpanel from `MIXPANEL_TOKEN`, and there is no test-only analytics sink. Therefore no safe end-to-end event-count test or build has been run; do not fill config from production credentials or emit test analytics into production.
- A focused AGMSG follow-up asking the Mobile/CFO owner for an existing isolated test path and current Page View regression/readback refs was sent at 11:28 JST; the 11:33 JST inbox has no reply. Current ordered cursor remains Task 2a's safe test/config gate. While that owner/resource boundary is unresolved, continue independent Task 1 read-only evidence work; Task 1 remains 9 items open.

#### 2026-10-05 12:00 JST Xcode build attempts and resource boundary

- Official SPM resolution completed successfully for all 9 pinned dependencies and populated `/Users/anicca/Library/Developer/Xcode/SourcePackages` (1.7 GiB). Only ignored build configs were materialized from checked-in examples; they contain placeholder `REPLACE_ME` keys and invalid example endpoints, mode 0600. No real credential was copied.
- Attempt 1: generic iOS Simulator `xcodebuild build-for-testing`, staging scheme, 1 job, code signing disabled. It reached framework compilation, then was interrupted after free disk fell to 977 MiB; exit 75 is deliberate cancellation, not a code/test result. No app or UI test launched.
- The first `xcodebuild clean` omitted `-clonedSourcePackagesDirPath`, attempted a duplicate RevenueCat clone inside DerivedData, and failed with `No space left on device` (exit 74). A corrected Xcode-native clean using the existing package cache succeeded and reduced task-specific DerivedData to 709 MiB.
- Attempt 2: arm64-only simulator-targeted `build-for-testing`, code signing disabled. It reached RevenueCatUI/ComponentsKit compilation and was interrupted at 984 MiB. No test target completed or app launched. A final Xcode-native clean using the existing cache succeeded; 12:00 JST readback is Data free 1.3 GiB, task DerivedData 718 MiB, SourcePackages 1.7 GiB, simulator Shutdown, no xcodebuild process. Tracked source branch remains clean.
- **Task 2a remains open.** There is no successful build/test or one-view/one-event proof. Do not rerun a full compile below the 1 GiB floor; no `.xcresult` or unrelated user data was deleted. Continue independent Task 1 owner/ref work without changing order.

#### 2026-10-05 12:11 JST compile-error diagnosis

- The arm64 build-for-testing failed with exit 65. Private mode-0600 log: `/Users/anicca/.local/state/life-manager/xcode-task2a-build-20261005T030810Z.log`, SHA-256 `7c78200590b9e93318448f9a3472570009e405a0a006b54206eca38b49c6c7b6`. It reports `SingularManager.swift:19:28 cannot find SingularConfig in scope` and `:30:9 cannot find Singular in scope`.
- Latest Life Manager main is `3f11ad0b8be553914215aa3263fe8d48cf0f763d`; the paywall candidate is 23 main-only / 1 candidate-only. `SingularManager.swift`, project wiring, and package pin are identical on both trees. The file imports Foundation/UIKit/OSLog but not `Singular`; the Xcode target links that SPM product, whose wrapper exports the `Singular` module. The compiler error is pre-existing in main and is unrelated to the paywall-view deletion.
- **Ruling:** after syncing the existing dedicated feature branch with latest main, add only `import Singular` to `Services/SingularManager.swift` as a compile prerequisite within Task 2a. It changes no runtime behavior. Cost if wrong: another independent compile failure may remain; it still will not prove event delivery.
- 12:11 JST state after the canceled build: Data free 1.2 GiB, task DerivedData 1.3 GiB, SourcePackages 1.7 GiB, simulator Shutdown, no active xcodebuild. App and test target did not finish, and no provider event was sent.

#### 2026-10-05 12:26 JST source sync and compile-fix readback

- Latest Life Manager main is `3f11ad0b8be553914215aa3263fe8d48cf0f763d`. The dedicated candidate branch now includes it (merge commit `c1d67a0e6aa37e0316e51e60167b01895e7943f2`) plus `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`, adding only `import Singular` to `Services/SingularManager.swift`. Branch `fix/anicca-paywall-view-dedupe-20261005` is pushed and clean, 0 main-only / 3 candidate-only commits, no PR. Its only source diff from main is the paywall direct-call deletion plus the compile import.
- `bash scripts/verify-source-boundary.sh`, `git diff --check`, and `xcrun swiftc -frontend -parse apps/mobile/anicca-ios/aniccaios/Services/SingularManager.swift` PASS. These checks do not establish a linked Xcode build.
- Post-import `build-for-testing` was interrupted at 438 MiB free (exit 130); no test result. Xcode-native clean using the existing package cache succeeded. Fresh 12:26 JST state is Data free 444 MiB, DerivedData 135 MiB, SourcePackages 1.7 GiB, simulator Shutdown, no xcodebuild process. The dedicated ignored configs are placeholders only, mode 0600; no credentials or provider event.
- **Task 2a remains open.** The compile prerequisite is now in the pushed feature branch but is not confirmed by an Xcode build; the one-view/one-event runtime acceptance is still absent. Preserve the 500 MiB floor and continue independent Task 1 owner/ref work without changing order.

#### 2026-10-05 12:35 JST after compile-fix verification attempt

- Source branch `fix/anicca-paywall-view-dedupe-20261005` is synchronized with main `3f11ad0b8be553914215aa3263fe8d48cf0f763d` and pushed at `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3` (0 main-only / 3 candidate-only, no PR). The only candidate changes are the paywall direct-send removal and the missing `import Singular` compile prerequisite.
- After import, focused arm64 `build-for-testing` was interrupted at 438 MiB (exit 130); no compile result. A scoped Xcode clean restored 444 MiB, but the latest 12:35 readback is Data free 602 MiB, no task DerivedData, package cache 1.7 GiB, simulator Shutdown, no xcodebuild process. `verify-source-boundary`, `git diff --check`, and Swift parse pass; they are not a linked build.
- **Current ordered cursor remains Task 2a build/runtime acceptance.** Do not start another build below the 500 MiB floor. No app/test/provider event or main integration has occurred; Task 1 remains 9 open items and can proceed only through its owner/read-only evidence path while this gate is open.

#### 2026-10-05 12:38 JST branch/owner refresh

- Current Life Manager main remains `3f11ad0b8be553914215aa3263fe8d48cf0f763d`. Paywall feature branch remains clean/pushed at `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3` (main ancestor, feature ahead 3), no PR. It contains the one-view sender correction and compile-only Singular import; build/runtime acceptance remains open.
- Mobile Metrics candidate remains clean at `1f045eff3d27cfec3945cd8d2dff64f06928c834`, now 47 main-only / 34 candidate-only, no PR. Issue #6547 remains OPEN with 0 comments, last updated `2026-10-03T22:42:08Z`. Its source is owner-read-only; do not resolve the Page View mismatch by editing that branch.
- Shared `/Users/anicca/Projects/life-manager-main` remains dirty on `capafy/podcast-clip-hook-lab-offline-20261005`, HEAD `7f90ebc20cce7e514fc66efc801679cd3e565b57`, 25 behind main with the two known untracked paths; do not touch. AGMSG inbox has no new reply and teammate liveness is unknown.
- 12:38 JST Data free 604 MiB, package cache 1.7 GiB, task DerivedData absent, simulator Shutdown, no xcodebuild. No test/app/provider event ran. Keep Task 2a open and continue Task 1 within its read-only owner boundary.

#### 2026-10-05 12:43 JST Singular module typecheck

- The `SingularManager.swift` compile prerequisite now passes a focused `xcrun swiftc -typecheck` against the iOS 26.5 simulator SDK and the pinned `Singular.xcframework`. This checks module/API visibility for that file only; it does not prove the app or test target links.
- Feature branch remains `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`, synced to latest main, pushed and clean. The previous full `build-for-testing` was canceled at 438 MiB; no subsequent Xcode build or app launch ran.
- Latest 12:43 JST Data free is 496 MiB; the full-task DerivedData directory is absent, the small standalone typecheck module cache is 47 MiB, shared SourcePackages is 1.7 GiB, simulator Shutdown, and no xcodebuild process is active. Keep the full build/runtime gate open; do not conflate this isolated typecheck with PASS.

#### 2026-10-05 12:32 JST post-clean resource readback

- The current source candidate remains clean/pushed at `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3` on latest main `3f11ad0b8be553914215aa3263fe8d48cf0f763d`, 0 main-only / 3 candidate-only commits, no PR. The branch contains the existing paywall-view dedupe and the one-line Singular import prerequisite.
- `xcodebuild build-for-testing` after the import was canceled at 438 MiB; the dedicated Xcode `clean` with the shared SPM cache succeeded afterward. Fresh 12:32 JST readback: Data free 658 MiB, task DerivedData absent, SourcePackages 1.7 GiB, simulator Shutdown, no xcodebuild process. No test target or app launch completed, and no provider event was sent.
- The full acceptance remains open. Do not re-run the build below the 500 MiB floor; continue unrelated Task 1 read-only owner/ref work until safe headroom is available.

#### 最新の作業・blocker再readback（2026-10-05 07:19 JST）

- Growth文書repoはDaisuke134/anicca-products、worktree /Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan、branch docs/anicca-ios-growth-plan-20261004。fresh fetch後、編集着手前のworktreeはcleanで、HEAD/upstreamは583a137d2e1c4356b6f39ecde2c9daaa77871434で一致。最新origin/mainは825802052a。前回確認点48e2cbd417c46623802aca863148c6716c41e5dcからの差分3ファイルはCapafy記事データのみで、Anicca対象コード差分はない。
- Mobile Metrics候補worktree /Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003 はclean。branch feat/lm-mobile-metrics-20261003 / HEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834、origin/main 82d31995e68a5220b7a288318a893866a24c7ea6。candidate固有34/main固有24 commits、PRなし。Tasks 1–3は候補branch上のsource/test完了のまま、main統合・production readback・same-user paid cohortは未完。issue #6547もOPEN、comments 0、PR一覧は空。
- AGMSG lm inboxは07:19 JST時点で新着なし。07:14 JSTにcodex-money-printerへ既存ASC read-only refs/hashと2FA/access gateの状態だけを尋ね、新規queryは重ねないよう依頼したが、返答は未着。team.shはmember一覧を返すが相手のaddressable paneなし。稼働中かは観測不能。Growthのdocs-only owner範囲とMobile Metricsのbackend/CFO source範囲は分離しており、現在も引き継ぎで統合せず並行継続が妥当。ASC/RevenueCatの同一provider操作は重ねない。
- Task 1は未完了。最初の未完itemはASC hidden keywords/promo text/metadata update time/localized screenshots/PPO historyをlive refで確定する項目。2026-10-04T17:59:33ZのApple 2FA画面は歴史的観測であり、本readbackではshared browserもprovider APIも触れていない。owner inboxにも新しいofficial refがないため、現在アクセスできる・blocker解消済みとは扱わない。Task 1 checklistは11件未完で、完了済みのZ1/FINANCE_DETAIL mappingはその一部の証拠に限られる。
- 07:11 JSTのXcode readbackでは26.6を選択中だがxcrun simctl list runtimesは空、空き容量312 MiB、実行中xcodebuildなし。Task 2aはsource修正・review完了だが、focused test/runtime one-view/one-eventは未検証。容量・runtime条件が変わるまでbuild/testを再試行しない。過去のbuild失敗はinstall/build acceptanceにしない。
- したがって最初の再開操作は、同じASC queryを再発行せず、Mobile ownerからprivate metadataの既存read-only ref/hashと現在のアクセス可否だけを受け取ること。refがなく2FA待ちならその正確な状態と必要なprovider refを記録する。Task 2aのXcode gateはruntime/容量がそろった後に再開する。

#### 2026-10-05 08:24 JST blocker再確認

- 編集着手前のGrowth文書branchはclean、HEAD/upstreamはf88558d1c8a3fc99469d73d86630488c721686b6。fresh fetch後のorigin/mainは825802052acbcb543f22927579ae4ae5e620d7acで、前回確認以降のAnicca対象差分はない。
- 08:18 JSTに登録済みCDPのtab listをread-onlyで確認した。唯一のASC pageはhttps://appstoreconnect.apple.com/login。遷移・click・API requestは行っていないため、2FA完了やprivate metadata accessは確認できていない。
- credential SSOT /Users/anicca/.local/share/anicca/credentials.json はmode 0600。JSON key名のread-only scanでApple/ASCに一致するfieldは0件で、値は表示していない。asc auth doctor --output jsonはhelpがKeychain availabilityも検査すると示した。出力がないまま中断し、--fixなし、credential値の取得なし、ASC API requestなし。local ASC auth状態はunknownのままなので同診断を再試行しない。
- AGMSG inboxは08:24 JST時点で新着なし。08:18 JSTにcodex-money-printerへ既存official private-metadata refs/hashかaccess解除状態だけを依頼し、重複queryをしないよう明記した。相手のaddressable paneは依然確認できず、実稼働状態はunknown。
- Xcode 26.6の08:18 JST readbackはdisk free 1.5 GiBまで回復したが、Simulator runtimeは空、xcodebuild processなし。容量は改善したがruntime gateは未解消のためTask 2a focused test/runtime event proofは未実施。
- Task 1は11件未完でcursorは変わらない。最初の条件を閉じる証拠は既存ownerのsaved official refs、または本人が既存ASC loginで認証を完了した後の安全なread-only取得。これが揃うまでkeywords等のlive値を推測せず、ASC APIを重複照会しない。2a runtime gateはsource fixをmain統合する前に別途閉じる。

#### 2026-10-05 08:28 JST 再開前の3回目readback

- 08:28 JSTのdirect CDP tab inventoryでも唯一のASC pageはappstoreconnect.apple.com/login。navigation/click/API requestなし。AGMSG inboxも新着なしで、08:18 JSTのowner照会へのreplyは未着。
- Xcode 26.6の同時点readbackはdisk free 456 MiB、simulator runtimesなし、xcodebuild processなし。08:18 JSTの1.5 GiBから容量が減っており、runtime gateは未解消。
- Growth文書worktreeは編集前clean、HEAD/upstream 9ab863283ee6be036c4b200ce0b9c93f73228885で一致。origin/mainは825802052acbcb543f22927579ae4ae5e620d7ac。cursorは引き続きTask 1、11件未完。
- ASC login/access conditionは07:19、08:24、08:28 JSTのfresh readbackで同じまま。safe continuationに必要な外部状態は、既存ownerのofficial metadata refs/hashか、open ASC sessionへのauthorized sign-in/2FA完了。OTP/passwordをchatへ送らず、owner不明中は同じprovider queryを重ねない。

#### 2026-10-05 10:20 JST Anicca ASC metadata evidence

- Daisの指摘を受けcredential SSOTのarray recordsを再検査した。credentials.jsonは72 recordで、record 71のservice metadataがAppleに一致しpassword fieldを持つ。値は表示していない。ASC CLIの /Users/anicca/.asc/config.json はmode 0600で、profile Anicca (default) とAniccaFactoryを持つ。ASC_BYPASS_KEYCHAIN=1 + profile Aniccaでread-only API readsに成功。前回の「ASC credentialがない」というkey-name-only結論は誤りで、browser loginページはAPIアクセスを妨げない。
- app 6755129214: version1.9.4はREADY_FOR_DISTRIBUTION / READY_FOR_SALE (createdDate 2026-06-23); version1.9.5はREJECTED / UNRESOLVED_ISSUES (createdDate 2026-07-04, latest review submission 2026-07-04T12:34:16Z)。現在のpublic/live versionは1.9.4。
- v1.9.4 live keywordsは7 localesに存在し、6 tracked Fastlane candidatesのいずれとも一致しない。v1.9.5 rejected-version current localizationsでは6候補すべて一致し、pt-PTはpt-BRと同じkeyword hashだがsource candidate fileなし。pt-PTを含む全値はApple公式100-character上限内。Exact July 4 submission payloadは現在のeditable localizationから復元できず、候補sourceは2026-09-17に追加されたため、current v1.9.5値を当時のsubmitted payloadと同一視しない。
- Local metadata pullsはprivate state下に保存: /Users/anicca/.local/state/life-manager/asc-readbacks/anicca-6755129214-v1.9.4-20261005T100319 と /Users/anicca/.local/state/life-manager/asc-readbacks/anicca-6755129214-current-20261005T101049。directory 0700、files 0600、14 files each。JSON pullには7 localeいずれもpromotionalText propertyがなく、localization update timestamp fieldもない。Version createdDate/submission dateをmetadata edit timestampに置き換えない。Six public app-info name/subtitle snapshots match the ASC records.
- Screenshot API SHA-256 v1.9.4 cba63ca145841b5bcafcbbc62082c90cf70c873c7b20af0353e57a6b8812af33、v1.9.5 f30dfef03116560603e469432b320ae42312ef8969c64f83b2f9e7121267f806。Both versions have 7 locales, one set per locale, 4 screenshots per set. PPO v2 response SHA-256 5f90a32b8423012cde4e494a74d51681143bb1643864c54cfed95c1b9f1af958: 7 experiments, all STOPPED, earliest start 2025-12-15 and latest end 2026-05-02; none active.
- Review history response SHA-256 261154b49e9e33bef1bdeac405154dcca21fdbc02d8c869d2d7c05f456c51f72 has 11 entries and 1.9.5's 2026-07-04 unresolved/rejected submission. Review Doctor SHA-256 ec715a6797b1c0f06ff132059b2fb699f182853c7fd62a77a422b33c72a1fd2c reports four current blockers (two age-rating checks, expired build, unresolved prior review) plus keyword duplicate-name/subtitle warnings; these are current readiness diagnostics, not the historical rejection reason.
- Mobile Metrics branch remains clean at 1f045eff3d27cfec3945cd8d2dff64f06928c834, with 30 main-only / 34 candidate-only commits against origin/main 30386440a50db8e9d0d2331c3be9d2d395a22555, no PR, issue #6547 OPEN. Both current main and candidate still filter Event == "Page View", while the saved official report uses Event="Page view". No source change is made in Growth.
- The private-metadata evidence item is complete as a current-state/gap readback, so Task 1 has 10 open items. The next open cursor is the Mobile Metrics owner's Page View normalization and focused regression. Current owner asks were sent via AGMSG; no reply by 10:20 JST. Xcode 26.6 still has no Simulator runtime; at 10:20 JST disk free was 3.5 GiB, so Task 2a's runtime event gate remains open.

#### 2026-10-05 10:29 JST Mobile owner refresh

- Fresh Life Manager origin/main is c90b7ca6b9c8790214ccb2dde1d841102c89b75f. Mobile Metrics worktree remains clean at 1f045eff3d27cfec3945cd8d2dff64f06928c834, 32 main-only / 34 candidate-only commits, no PR, issue #6547 OPEN. Diff under apps/mobile/anicca-ios is empty.
- Current main and candidate still use Event="Page View"; the saved official report uses Event="Page view". At 10:29 JST the Growth AGMSG inbox has no reply to the Page View regression/ref request. The source remains owned by Mobile Metrics; Growth does not edit it.
- Task 1 remains current with 10 open items. The ASC private-metadata current-state/gap readback is complete; next open item is the owner-local Page View normalization and focused regression.

#### 2026-10-05 10:20 JST authenticated ASC metadata snapshot

- 前回の「Apple/ASC credentialなし」というkey-name-only scanの結論は誤りだった。credentials.jsonは72 recordのarrayでrecord 71のservice metadataがAppleに一致しpassword fieldを持つ。値は一切表示していない。さらに /Users/anicca/.asc/config.json (0600) にAnicca (default) とAniccaFactory profileがある。ASC_BYPASS_KEYCHAIN=1 とprofile Aniccaでread-only API取得に成功し、Keychainは使っていない。
- ASC app 6755129214の1.9.4はREADY_FOR_DISTRIBUTION / READY_FOR_SALE、createdDateは2026-06-23 (metadata update timeではない)。1.9.5はREJECTED / UNRESOLVED_ISSUESで、review historyの唯一の1.9.5 submissionは2026-07-04T12:34:16Z。公開中のASC versionは1.9.4。
- Fastlane candidateのsource commit 0e0758d7f7は2026-09-17。現ASCの1.9.5 rejected-version localizationsには6 candidate localeのcurrent text hashが完全一致する。pt-PTもpt-BRと同じkeyword hashだが、source candidate fileはない。live 1.9.4の7 locale keywordはcandidateと全6 localeで不一致、pt-PTはcandidateなし。7 localeすべて100 Unicode-character limit内（jaは45 chars / 117 UTF-8 bytes、pt-PTは97 chars / 103 bytes）。Apple公式上限は100 charactersでありbyte countでは判定しない。7/4 submission時のexact metadata snapshotは残っていないため、現在のrejected draftのcandidate文字列がそのsubmissionに含まれたかは未確定。9/17以降のsubmission historyはない。
- ASC metadata pullのprivate artifacts: live 1.9.4は /Users/anicca/.local/state/life-manager/asc-readbacks/anicca-6755129214-v1.9.4-20261005T100319、default current editableは1.9.5で /Users/anicca/.local/state/life-manager/asc-readbacks/anicca-6755129214-current-20261005T101049。両directoryは0700、14 filesはすべて0600。raw metadata valuesはrepo/chatへ出さず、per-locale keyword hashes, counts, candidate equalityのみを正本へ記録する。metadata pull JSONの7 localeすべてでpromotionalText propertyはabsent、localization update timestamp fieldもない。absentを独立に確認したblank stateやmetadata-update日時に読み替えない。6 public localeのapp-info name/subtitleは保存済みpublic snapshotと一致する。
- Screenshot readbackはversion 1.9.4 response SHA-256 cba63ca145841b5bcafcbbc62082c90cf70c873c7b20af0353e57a6b8812af33、version 1.9.5 SHA-256 f30dfef03116560603e469432b320ae42312ef8969c64f83b2f9e7121267f806。双方7 localeすべてに1 set / 4 screenshots。PPO v2 response SHA-256 5f90a32b8423012cde4e494a74d51681143bb1643864c54cfed95c1b9f1af958は7 experimentsを返し、全件STOPPED。履歴は2025-12-15 startから2026-05-02 latest endまででactive experimentなし。
- Review history response SHA-256 261154b49e9e33bef1bdeac405154dcca21fdbc02d8c869d2d7c05f456c51f72は11 entries。1.9.4は2026-06-23 approved、1.9.5は2026-07-04 unresolved/rejected。review doctor response SHA-256 ec715a6797b1c0f06ff132059b2fb699f182853c7fd62a77a422b33c72a1fd2cは4 blocking checks（age-rating missingの2 checks、expired build、unresolved review）とkeyword duplicate-name/subtitle warningsを出す。これは現行readiness診断であり、過去のrejection causeとは断定しない。
- Mobile Metrics owner laneはfresh origin/main 30386440a50db8e9d0d2331c3be9d2d395a22555に対しHEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834でmain-only 30 / candidate-only 34、PRなし、issue #6547 OPEN。apps/mobile/anicca-iosのdiffなし。最新mainとcandidate双方のmarketing-asc-acquisition.jsはEvent === "Page View"を採用するが、保存済みApple Standard reportはEvent="Page view"。Growth laneはsource ownerへ変更を依頼し、コードを重複編集しない。AGMSG inboxは10:09 JST時点で新着なし。
- Task1のofficial private-metadata readback itemは証拠と欠損を確定したので完了とする。Task1全体は未完で、checklistは10件残り、次cursorはMobile ownerのPage View raw-enum fix / focused regression。Task 2aはdisk free 3.5 GiBまで回復したがXcode 26.6のSimulator runtimeが0件なので、そのintegration gateは別途未完。

- 2026-10-05に最新refを再確認した。Mobile Metrics worktree `/Users/anicca/Projects/life-manager-main/.worktrees/lm-mobile-metrics-20261003` はcleanで、HEADは `1f045eff3d27cfec3945cd8d2dff64f06928c834`（2026-10-04）。Life Manager `origin/main=82d31995e68a5220b7a288318a893866a24c7ea6` に対し、main-only 24 / candidate-only 34 commits、PRなし。Issue #6547はOPENで、Daisuke134の+1 reactionは `2026-10-04T01:11:20Z`。一方、candidate planのcursorは+1 pendingのままなので、担当者がapproval記載を整合する。clean worktreeは未commit差分がない証拠であり、agent seatが稼働中かどうかまでは示さない。
- **担当判断: 並行継続とし、Mobile Metrics作業を止めず、引き継がない。** 相手はCFO/backend candidateとTask 8の受入れ・promotionを担当する。このGrowth laneは正本計画とread-only evidence接続を担当する。ファイル変更は重ならない。公式provider readとproduction/runtime操作はownerを一人に保ち、このlaneは取得済みrefsを読み、同じrequestを繰り返さない。

- 2026-10-05 order ruling。旧順序: Task 1全体→Task 2/Task 3並行→Task 4→5→6。新順序: Task 2a canonical paywall event dedupe→Task 1残項目→Task 2残り/Task 3並行→Task 4→5→6。Task 1先頭のASC private metadataはApple 2FA待ちだが、active PaywallVariantBViewの同一event二重送信は確認済みで、source修正はASC/providerに依存せずonboarding conversion計測の信頼性を上げる。Task 2aのsource atomは完了し、現cursorはTask 1残項目。Xcode runtime event testはmain integration前のgateとして保持。
- 別のMobile Metrics計画のTasks 1–3は、branch feat/lm-mobile-metrics-20261003 / HEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834上でsource/test実装が完了している。内容はASC store rateの分母保護（install_to_paidはunavailable）、ASC proceedsとRevenueCat chart observationの分離、CFO summaryのfunnel/source status表示。これは候補branch上のsource完了であり、Growth Task 1、本番反映、同一ユーザーの課金帰属、settled net revenueの完了ではない。
- 最新比較ではLife Manager origin/mainは82d31995e6。候補branchはmain固有24 commitsが未取り込みで、候補固有34 commitsがある。PRなし。apps/mobile/anicca-iosにはmainとの差分がない。変更はacquisition/Financial Manager/CFO backend側なので、Growth文書やnative source branchへコピー・mergeしない。
- Task 8の前回whole-branch reviewにはImportant findingが残る。Financial Managerがpositive unassigned_row_countをpartial coverageとして表示しない。issue #6547はopen・comments 0だが、Daisuke134（repository admin）の+1があり、maintainer approval条件は満たす。partial-coverage修正、最新main同期、同期後の受入れ、fresh ship reviewは未完。candidate planの「maintainer +1 pending」は古い記述。
- 所有範囲は維持する。Mobile Metrics ownerはapps/life-manager、skills/cfo、producer/CFO integration、issue #6547を担当する。このlaneは既存refsから公式証拠をread-onlyで接続し、不足証拠を特定する。ASC/RevenueCat collectorやFinance Detail作業は重ねない。native onboarding/paywall sourceはcanonical iOS ownerの範囲。GrowthはTask 2aのpaywall analytics重複送信という一file fixのみ専用worktreeで担当し、CFO collectorsとuser-level funnel integrationは既存ownerへ残す。
- Task 2a source atomはcommit 3fee4d6cec74fdd469237a30b880106411c46f26としてpushされ、read-only review Approved。次のGrowth cursorはTask 1の最初の未完項目: ASC hidden keywords/promo text/metadata update/PPO history。CloakBrowser ASC tabはApple 2FA待ちで、Daisがtabで完了するかMobile ownerがofficial read-only refsを渡すまで未確認。Task 2a runtime test/public event receiptはmain integration前のgateとして保持。FINANCIAL/FINANCE_DETAILは同一取引identity未証明で二重計上しない。Task 3 fenceにwake/replay/fence-closeしない。

現在cursorは **Task 1: 公開build/offerings/同一ユーザーファネルの不足証拠を照合**。Task2aのsource修正は完了したが、Xcode runtime gateはmain統合前に残す。前回Anicca local `business-outcomes.jsonl` rowはbusiness date 2026-10-03 / observed `2026-10-04T15:00:23.470913Z`。保存済みDiscovery Standard reportはwindow 2026-09-30..10-02 (processed 10-03)で、10/01にImpression 12 rows / total Counts20、Page view 3 rows / total Counts5（1/3/1）。保存済みDownloads Standard report (processed 10-04)は10/02 first-time download1、App Store search、DE/iPhone、App Version1.9.4で、restore/redownloadなし。保存済みPurchases Standard reportは09/07にAnicca app ID6755129214 / content ID6762049696のpurchase1、Sales USD31.40 / report Proceeds USD26.69を記録し、Subscription Event Standardは09/12 full-price start activation1。同じuser/settlement periodとは結ばず、current MRRへ加えない。US/JP/DE public pagesでJPは47 ratings、各localeのコピーとIAP表示が異なる。current source mainは1.9.5/build365だが公開pageと実測download rowは1.9.4で、ASC build mappingは未確認。別ownerのRork Analytics common window 10/01は0 first-time downloads / 5 unique impressions / 0 unique page views。指標/segment/windowが違うためCVRは作らない。RevenueCat rowは10/03 MRR20.34/Actives5だがcurrency/revenue_definitionなし。Mixpanel raw event countsは5/1/4でuser cohort/purchase eventなし、PostHog credential unavailable。現行sourceではpaywall前に`onboarding_completed`が発火し、初回onboardingは未ログインでも表示される。PostHogはRevenueCat appUserID、Mixpanelはcredentials更新後にidentifyされ、両IDの明示的alias/cross-source bridgeは見えない。したがって匿名起点から購入までの同一user cohortはsource証拠で確立できない。ASC Sales snapshotはavailableだがrow_count0・proceeds object emptyでありsettled zeroとは扱わない。CFO aggregateは別combined window 09/30–10/02でDL1/impressions16/unique11/page views0、unattributed/campaign unavailable。これらの欠損が埋まるまでinstall→purchase rateやnet MRRは未算出。Task 3 previous accepted strict rolling 28d readback (cutoff `2026-10-04T14:26:22Z`)は557 unique platform provider IDs（IG229/TikTok231/YouTube97）、93 exact metrics joins。397 mature posts中46件にin-window 168h checkpoint（32 measured/14 unavailable）あり、46/46 raw hashesとpublication-identity native IDsを一致確認した。Measured 168h posts: IG10 (per-post reach sum8,331/views11,586), TikTok8 (views311), YouTube14 (views7)。click/ASC install/paid joinは未取得。Task 2にはpaywall view重複送信のsource-only修正branch/commitがあるが、実イベントcount、build、公開版への反映は未確認。既存owner cadenceは維持し、成果計測なしに追加volumeを増やさない。

Task 3の前回readback（receipts 11:34Z / metrics 11:33:50Z）は562 IDs / 399 mature / 52 checkpointsだった。前回受入れ済みstrict rolling 28d readback（cutoff 2026-10-04T14:26:22Z）は557 unique provider IDsで、97 metrics posts中93件がpublished receiptのprovider IDとexact joinした。成熟済み投稿397件のうち46件に168hのin-window checkpoint（32 measured/14 unavailable）がある。46 raw hashはprovider-response journalと、46 native IDは最新resolved publication-identity rowと一致した。測定値はInstagram10 posts（per-post reach sum8,331/views11,586）、TikTok8 posts（views311）、YouTube14 posts（views7）。合計は投稿別valuesでdeduplicated audienceではない。Impressionsはnull、click fieldはschemaになく、ASC install/paid joinもない。14:17–14:23Zのowner journalをread-only確認し、fenced metric readerには触れていない。

Task 1 persisted report check: existing official `App Store Discovery and Engagement Standard` artifact `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/evidence/business/2026-10-03/anicca-ios/6755129214-discovery.json` has `evidence_sha256` (canonical JSON evidence) `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`; file-byte SHA256 is `46e3e18e47cf0c7c28f78a18164374d9572be6df9027eadd7ffec12062977d44`. It contains 2026-10-01 `Event="Page view"` in 3 rows with `Counts` 1/3/1 (sum 5); `Impression` appears in 12 rows with Counts sum20. This confirms the static enum mismatch against owner source `row.Event === "Page View"`; it is the Standard report, not a persisted same-request Detailed report response. Therefore the mobile owner's focused regression and Detailed request fresh readback remain open, and the Analytics unique page-view value 0 is not treated as user behavior.

CFO/Mobile lane evidence consumed without duplicate provider reads: CFO §87-B's production `collectProduct()` aggregate is 2026-09-30..10-02, processing 10/03, DL1/total impressions16/unique11/page views0, `unattributed`, campaign unavailable; report-level source windows are absent, so it does not reconcile with the separate 10/01 Standard report. CFO §87-Q records Anicca MRR JPY3,196.91 for 10/03 (USD query20.34) and September RevenueCat proceeds JPY3,363.77; these are provider metrics, not settled bank/net receipts. Mobile Task 9's private D7 0/1 sample and Task 10's campaign/purchase-denominator gaps are also recorded in the spec's cross-lane evidence table; none completes Growth's same-user funnel.

Task 3の保存journal診断（cutoff 2026-10-04T16:14:47Z、read-only）: status=published / product_id=anicca-ios / provider_post_idで個別receipt JSONを集計すると557 IDs（IG229/TT231/YT97）で、前回と同じ。親のmarketing/receipts.jsonlは別単位のsummaryで、provider_post_idを含まない。現在のpost-metrics stateはAniccaのunique Postiz IDが98件、うち94件がprovider_post_idとexact joinする。target-168h / in-windowの候補checkpointは57件（39 measured / 18 unavailable）、そのうち53件（37/16）がpublished receipt IDと結合し、53/53 raw hashがprovider-response journalと一致、53/53 native IDがlatest resolved publication-identity rowと一致した。前回の受入れ済み14:26Z snapshotは46件（32/14）、hash/identity 46/46だった。metrics/provider-response filesは15:22Z、identity fileは16:11Zに前回cutoff後のmtimeがあり、per-row ingestion timestampがないため旧・新のcountを同一snapshotとして比較できない。遅延追加またはidentity更新が原因かは確定できていない。追加の6h Instagram readbackでは、既存の10:01Z投稿を16:02Zに観測し、reach291 / views401 / likes2 / shares0 / saves1、impressionsはnull。response hashとnative identityは一致するが、これは1投稿の配信値でASC install/paidには結びつかない。このlaneから公開、provider API call、wake、replay、fence closeは行っていない。

15:47ZのInstagramと15:53ZのTikTok statusはloaded-idle / exit75 / resource_effect_unknownでprovider receiptなし。Instagramはreadback adapterなし、TikTokはdiagnostic fieldsが揃ったがreceiptなし。ownerの公式履歴/effect reconciliationが取れるまでreaderを再試行しない。

Task 4 preliminary ASO readback: screenshot visual auditは2026-10-04のUS listingでiPhone 6.7-inch screenshot 4枚を確認。2026-10-04T18:30ZのUS/JP/DE metadata再readbackでも公開version1.9.4のまま、JP47 ratings、US/DEはrating overview表示なし。順に「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目は似たaffirmation-card構成で、3枚目の8 themesはlisting descriptionの13 self-care themesと不一致。title 27 characters / subtitle 30 charactersでAppleの各30文字上限内。これはpublic-page観測とvisual assessmentで、表示可能theme数・機能の誤りやPPO upliftの証明ではない。Task 1〜3のgate、実機能確認、PPO標本可能性を通るまで素材公開やonboarding変更をしない。

順序はTask 2a→Task 1残項目→Task 2残りとTask 3並行→Task 4→Task 5→Task 6とする。まず現状と計測の信頼性を確かめつつ、Task 3では既存配信のreadbackを前進させる。distributionは最初の成長施策だが、reach→store→installの測定前に投稿本数や広告費だけを増やさない。Task 4ではスクリーンショット/PPOを先に検証し、その後に初回カード体験を別実験にする。Life Manager全体のTODO/orderはprimaryの統合SSOTであり、この表はANICCA growth lane内の作業順である。

| Task | 成果 | 状態 | 依存 |
|---|---|---|---|
| 2a | canonical paywall view one-event source correction | **source correction plus compile prerequisite are pushed on a current-main-synced branch.** Latest commit `ee0d6514`; source-boundary/parse/diff checks pass. `SingularManager.swift` passes isolated `swiftc -typecheck` against the pinned simulator framework; full app/test build and runtime event remain unverified. Latest 12:43 JST Data free is 496 MiB. No app/test/event ran, PR/main integrationなし. | Restore safe disk headroom, complete focused build and isolated one-view/one-event acceptance; Task 1 Page View follows |
| 1 | 公開版/build/課金経路/現状値の証拠 | **進行中（9 checklist items remain）.** Official ASC API read succeeded via the Anicca profile with Keychain bypass. Live 1.9.4 is READY_FOR_SALE/READY_FOR_DISTRIBUTION; editable 1.9.5 is REJECTED. App Store Version→Build mapping is confirmed (1.9.4→390, 1.9.5→365); both uploaded builds are expired. Live 1.9.4 keywords differ from six Fastlane candidates; rejected 1.9.5 current localization matches those six candidates, while pt-PT has no source file. Exact July 4 submission payload is unproven. 7 locale screenshots and 7 STOPPED PPO experiments read back; promotionalText/update timestamp are absent from metadata pull output. | First executable item is Mobile Metrics owner Page View normalization/regression; then exact report segment/windows, checkout/offering, paid cohort and CFO receipt gaps. |
| 2 | 信頼できるコホートと課金ファネル | Task 2a source fix plus compile import are pushed in a branch synced to current main, but runtime event delivery remains unverified. Latest 12:43 JST: Data free 496 MiB, isolated typecheck cache 47 MiB, shared package cache 1.7 GiB, simulator Shutdown. No app/test or provider event ran. Mobile Metrics backend Tasks 1–3 remain separate owner changes. User-level ID/purchase/refund/D35 cohort remains incomplete. |
| 3 | 配信別の獲得と改善記録 | 部分進行。前回受入れ済み14:26Z readbackは557 published provider IDs、93 exact post-metrics joins、397 mature、46 D7 checkpoint（32/14）、46/46 hash/identity match。16:14Zの現local-state diagnosticではID 557・metrics 98 IDs/94 joinsだが、D7は53 receipt-bound checkpoint（37/16）、latest identity exact join 53/53となり前回の46/46と同一snapshotとして再現できない。journal file mtimeがcutoff後、per-row ingestion timestampなしのため前回値は歴史的readbackとして保持し、ownerの同一query/immutable snapshotで原因を照合する。click/ASC install/paid joinは未接続。Latest native-metrics summary at 17:26Z has eligible835/ledger905/new_rows0; read-only planner at 17:38Z has due0/missed0 across all products, not an Anicca D7/CVR result. Current reader status remains effect_unknown/no receipt. | owner fence official readbackを待つ。metrics readerはwake/replay/fence-closeしない。current cutoff・window・file hashを記録し、D7 count差を解消する。existing cadenceは維持 |
| 4 | ストア訴求と初回カード体験の改善 | 部分進行。US listingの4 screenshots/title/subtitleをread-only監査済み。素材の反復と8-vs-13 themes不一致を確認。実機能/locale/build照合・PPO/onboarding実験は未着手 | Task 1〜3の基準と十分な標本可能性。ASO/PPOの後にonboardingを別実験 |
| 5 | 訴求→hard/softの比較とD35 economics | 未着手 | live offering、計測可能なcohort、標本見積り。renewal/refundは最初の有料cohortから追跡 |
| 6 | 他の公開アプリへ再利用 | 未着手 | ANICCAで獲得・課金・継続・CFO ownerのnet unit economicsを実測 |

### $10Kの運用モデル

- 長期構想は公開アプリをそれぞれ$10K MRRへ育てること。最初はportfolio $10Kを目標にし、再現性があり需要と採算を確認できたwinnerへ投資する。全appへ均等投資せず、成功を先に仮定しない。
- Portfolio $10Kは1 app×$10K、2 apps×$5K、5 apps×$2Kなどの構成で実現できる。均等分布は仮定しない。
- 月換算$10 MRR/paid subscriberなら1 appあたり1,000 active paid subscribersが$10K目安。月次解約10%仮定で月100 new paid subscriberを補充する。
- RevenueCat D35 cohort conversionを感度分析に使う。月100 new paidに約4,762 DL (2.1%), 2,000 DL (5%), 935 DL (10.7%)。2.1%/10.7%はRevenueCatで異なるmodel群のmedian、5%は仮定。live Anicca conversionとはしない。
- 目標の途中段階は$100→$1K→$3K→$10K MRRとし、各段階で必要な有料会員・解約補充分・installを実測値で更新する。$10/人・月次解約10%・D35 conversion 5%の仮定では、$10K段階の維持だけで1,000 active paid、月100 replacement paid、月2,000 install（約67/日）が必要。成長分の純増installは別に足す。
- 現状はこのunit-economics入力値が未確定。最初の業務成果は$10K到達を予測することではなく、投稿reach→ASC acquisition→unique onboarding cohort→server-confirmed paid→renewal/refund→CFO同期間net economicsの一本を読めるようにすること。
- 継続率は後工程まで放置しない。MRRは解約で減るため、first paid cohortからrenewal/refundを保護指標として追う。利益の最終判定はgrowth側で推定せずCFO ownerのofficial proceeds/cost refsへ委ねる。
- CFO direct RevenueCat readback is a provider MRR point for 2026-10-03 (Anicca JPY3,196.91; USD query20.34) and September proceeds metric JPY3,363.77. It is not Apple/bank settlement or net profit; chart unit labels conflict for the JPY query and the local 10/03 business-outcomes row still lacks currency/revenue_definition. Do not call this verified net MRR.
- 先行指標は対象reach→ASC impression/page view/first-time download→unique onboarding cohort→value/paywall→paid→renewal/refund。利益判断は別途同期間のApple proceeds/fees, refunds, variable compute/infra, ad CACを必要とする。
- 前回受入れ済みstrict-window 168h sample（cutoff 2026-10-04T14:26:22Z）はInstagram10 measured posts、TikTok8、YouTube14。TikTokの8 measured carousel postsは同じmedia/caption hash、views sum311（median39.5/max58）。次の候補は既存owner cadence内の次slotで、同じ承認済み日本語affirmation/caption/CTAを15〜30秒9:16 short video形式に再構成するformat test（詳細とTikTok公式creative guidanceはspec「最初のTikTokテスト案」）。投稿時刻/audience/CTAを固定し、既存`experiment_id` fieldでvariantを記録する。1本はscreeningに留め、historical baselineよりよければ新assetを2本追加してからdirectional callをする。TikTok for Business guidanceは広告向けなのでorganic liftを保証しない。click/ASC install/paid join前にcadenceや広告費は増やさない。
- 反復順は課題/配信仮説→同一window獲得→初回価値/課金→成熟D35 paid→renewal/contribution→横展開。実測で1st gateが未達なら次app複製や大規模有料獲得はしない。

## Task 2a: Paywall view event dedupe (priority atom before Task 1)

**Status:** latest main `32370e730c7c021917f80d35454bc5545e189b05` has two event-send paths; the dedicated feature branch removes the redundant direct call and adds the Singular module import. `SingularManager.swift` isolated typecheck and full `build-for-testing` both pass. The simulator app/test have not run, so provider-isolated one-view/one-event runtime proof is still open. At 13:14 JST free space is 3.3 GiB and the installed iOS 26.5 simulator is Shutdown. The branch is pushed, with no PR or release.

**Files:** canonical `apps/mobile/anicca-ios/aniccaios/Onboarding/PaywallVariantBView.swift`; compile prerequisite `apps/mobile/anicca-ios/aniccaios/Services/SingularManager.swift` for the diagnosed missing module import; related `OnboardingV2Tests.swift` only if a meaningful test can observe the active path without provider traffic.

**Behavior:** one first appearance emits exactly one `paywall_plan_selection_viewed`. Keep existing `hasTracked` and `AnalyticsManager.trackPaywallViewed()` because the helper emits the event and updates SKAN conversion value 2. Change no purchase, price, offering, ASC, RevenueCat, or public release behavior.

- [x] Initial source-boundary check on origin/main `82d31995e68a5220b7a288318a893866a24c7ea6` confirmed the active `PaywallFlowContainer` path and duplicate sender; dedicated worktree check PASS.
- [x] Fresh read-only check of latest main `2a8d40e68f306105c59fa21631f6b9bf01ab5c90`: active `PaywallVariantBView` still sends the event directly and through the helper; candidate branch emits one path. Source evidence only, not runtime event-count proof.
- [x] 2026-10-05 12:11 JST current-main refresh `3f11ad0b8be553914215aa3263fe8d48cf0f763d` still has the duplicate PaywallVariantBView path. Compiler log `xcode-task2a-build-20261005T030810Z.log` proves `SingularManager.swift` also fails on the unchanged main tree because its `SingularConfig`/`Singular` symbols are used without `import Singular`; the package product is linked. Candidate diff from main includes only the paywall view, so this is a separate existing compile blocker, not a regression from the dedupe change.
- [x] Removed only the redundant direct `.track(.paywallPlanSelectionViewed)` call; helper and `hasTracked` remain. Commit 3fee4d6cec74fdd469237a30b880106411c46f26.
- [x] Synced the dedicated feature branch to latest main `3f11ad0b8be553914215aa3263fe8d48cf0f763d` (merge `c1d67a0e6aa37e0316e51e60167b01895e7943f2`) and added the compiler prerequisite `import Singular` (commit `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`). `verify-source-boundary.sh`, diff-check and Swift parse PASS; branch is pushed, no PR.
- [x] 2026-10-05 12:43 JST: `xcrun swiftc -typecheck -target arm64-apple-ios15.0-simulator` passed for `SingularManager.swift` against the pinned simulator SDK/framework. This proves only that file typechecks; full target build remains open.
- [x] 2026-10-05 13:14 JST: `xcodebuild -project apps/mobile/anicca-ios/aniccaios.xcodeproj -scheme aniccaios-staging -destination 'platform=iOS Simulator,id=2DD080F2-F9F3-45DA-99E3-BAF4F1C60C1C' -derivedDataPath /Users/anicca/Library/Developer/Xcode/DerivedData/AniccaGrowthTask2a -clonedSourcePackagesDirPath /Users/anicca/Library/Developer/Xcode/SourcePackages -jobs 1 CODE_SIGNING_ALLOWED=NO build-for-testing` exited 0 with `** TEST BUILD SUCCEEDED **`; both `aniccaios.app` and `aniccaiosTests.xctest` exist. This compiles the app and test target only. No test/app launch or provider event occurred.
- [ ] Execute a provider-isolated one-view/one-event runtime check. The current app startup initializes Mixpanel and there is no test-only event sink; do not run the app/test against a real provider. The ignored local Staging/Production xcconfigs were materialized from checked-in examples, are mode 0600, and use placeholder/`.invalid` endpoints only. Establish a local sink or existing isolated test route before app launch; never send test events to production.
- [x] Commit/push readback confirms branch `fix/anicca-paywall-view-dedupe-20261005` HEAD `8c2d9ec3a1fc17e08bb3c09c13c711c3c5e28e57` equals origin and includes latest main `32370e730c7c021917f80d35454bc5545e189b05`; worktree is clean, no PR. Fresh reviewer found no Critical/Important issue. `PlanSelectionStepView` has no active callsite; leave the unused view unchanged. Do not merge/release until runtime and full Growth outcome gates pass.

#### 2026-10-05 12:56 JST mobile revenue and acquisition refresh

- Growth docs worktree was fetched before editing: branch `docs/anicca-ios-growth-plan-20261004`, HEAD/upstream `be936e106867cc867d5a4e7605454c6bc9ecfdcb`, latest `origin/main=825802052acbcb543f22927579ae4ae5e620d7ac`; the branch was 84 commits ahead and 2 behind current main. Those 2 main-only commits touch only Capafy article data and are merged at `265aa21077ce57e2a00eb1f12cefd7ad81210bdf`. The previous 12:43 handover was untracked and removed; this refresh updates the canonical spec and TODO record only.
- Read only the existing saved `business-outcomes.jsonl` and the committed CFO RevenueCat/ASC readbacks; no RevenueCat, ASC, Stripe, Moneytree, Mixpanel, or PostHog provider query was repeated. Independent read-only financial review: provider MRR/proceeds and the mapped Anicca Z1 row are reportable with dates/definitions; bank settlement and net profit remain HOLD.
- Latest saved RevenueCat point: Anicca JPY 3,196.91 / USD 20.34 and Honne AI JPY 0, latest complete period 2026-10-03; all six configured iOS apps total JPY 3,196.91. Anicca's September RevenueCat `proceeds` metric is JPY 3,363.77, not an Apple payout or bank deposit. Apple FINANCE_DETAIL/Z1 contains one mapped Anicca Annual partner-share row of JPY 4,250, settled 2026-09-12. The separate ASC Purchases report has Anicca 2026-09-07 Sales USD 31.40 / Proceeds USD 26.69 and Honne 2026-09-21 Sales USD 38.03 / Proceeds USD 32.33; do not add these reports across unmatched transaction identities or call them bank cash.
- Saved ASC App Store Discovery and Engagement Standard for 2026-10-01..10-03: Anicca 56 impressions / 5 page views / 1 tap (43 rows; report SHA `98ce6116378dfd1b7fc3921491dfb0fc5ed443b0ac0a3eb671f8ce65f00a5084`), Honne 92 / 3 / 2 (52 rows; SHA `85f1f5932746c1471712fc2a9670adb1fc6baaacf9d706beeff14532a72ea149`). The daily Downloads reports each show one first-time download on 10/02 (Anicca from App Store Search; Honne from App Referrer). These are aggregate report counts, not a joined user-level conversion or paid cohort. Latest Anicca product analytics has 2 onboarding starts and 1 completion, also raw event counts.
- CFO's existing worktree is concurrently dirty on its unified CFO SSOT; it owns settlement/net/cost changes and was not edited. Mobile Metrics candidate stays read-only; Page View collector mismatch and focused regression remain its owner task. No source branch/PR/runtime or external delivery was changed here.
- Fresh 12:56 JST runtime: Data volume free 269 MiB, Xcode 26.5 simulator runtime installed, `AniccaGrowthTask2a` Shutdown, no xcodebuild process. This is below the 500 MiB no-run floor and 1 GiB full-build headroom; do not retry full `build-for-testing` yet. Source candidate remains clean/pushed at `ee0d65143f51bd9aed5c66ddc48a8bf0be6877c3`, latest Life Manager main `3f11ad0b8be553914215aa3263fe8d48cf0f763d`, no PR; isolated Singular typecheck passes, whole-app/runtime event check does not.
- Remaining checklist counts are unchanged: Task 2a 1, Task 1 9, Task 2 6, Task 3 12, Task 4 11, Task 5 8, Task 6 4. Current order stays Task 2a build/runtime gate → Task 1 owner/readback gaps → Task 2 + Task 3 → Task 4 → Task 5 → Task 6. No $10K MRR or net-profit result is achieved.

#### 2026-10-05 13:14 JST Xcode build acceptance

- Data free recovered to 4.4 GiB before the build and is 3.3 GiB after it. The iOS 26.5 runtime is installed; `AniccaGrowthTask2a` remains Shutdown, with no xcodebuild process after completion.
- The Life Manager source branch was synced to latest `origin/main=32370e730c7c021917f80d35454bc5545e189b05` and pushed at `8c2d9ec3a1fc17e08bb3c09c13c711c3c5e28e57`; the only branch-specific source changes remain the redundant paywall event call removal and `import Singular`. The full `build-for-testing` passed as recorded in Task 2a. No app, UI test, external provider event, PR, main integration or release occurred.
- Missing ignored Xcode configs were copied from checked-in `.example` files in the dedicated source worktree with mode 0600. The token fields are `REPLACE_ME` and the backend endpoint is `.invalid`; no production credential was used. They are not tracked by Git.
- The runtime event gate remains open because launching the app initializes Mixpanel and the branch has no test-only analytics sink. Current `build-for-testing` result does not count as the one-view/one-event check. Task 2a is now 1 open / 8 complete; Task 1 remains 9 open. Current TODO order remains Task 2a runtime gate → Task 1 → Task 2/3 → Task 4 → Task 5 → Task 6. Goal remains active and $10K MRR is not achieved.

#### 2026-10-05 13:20 JST external case update

- Added an evidence-labeled summary of the user-provided Prayer Lock X article to the canonical Growth spec. The article's volume and revenue are self-reported and sponsored; its transferable hypothesis is an ICP-led creative test followed by paid amplification only for measured organic winners. The 200–300 videos/month suggestion is not adopted as an Anicca target. Existing Task 3 already covers a bounded creative test and post→store→paid attribution, so TODO order and counts do not change.

## Task 1: 公開版と現状値の証拠を再確認する

**Files:** このspecの「現状の証拠」、この計画のタスク状態。製品コードは読取のみ。

**Interfaces:** ASC app `6755129214` / bundle `ai.anicca.app.ios`、既存取得ownerのASC/RevenueCat refs/hash、Mixpanel project、投稿担当の実績を読む。出力は取得時点/期間/取得元/分母/欠損付きの基準表と公開build対応表。公式APIの再取得は既存ownerと共有し、同じ取得を並走しない。

- [x] 既存mobile設計のProvider observationsから24登録/6公開アプリ、旧未公開rosterとの違いを取り込み、根拠SHA/hashをspecへ記録する。私による公式API再取得とは扱わない。
- [x] 最新anicca-products mainのUX/分析コードと、既存business-outcomesのproduct_analytics/PostHog statusを読んで部分基準表を記録する。raw件数を離脱率へ変換しない。
- [x] current mainの`ContentView`→`OnboardingFlowView`→`PaywallFlowContainer`→`PaywallVariantBView`、event trigger、Mixpanel/PostHog/RevenueCat identity call sitesをread-only traceする。初回は未ログインでもonboarding/paywallへ進み、`onboarding_completed`はpaywall前。購入client eventsはserver-settled truthではなく、anonymous→RC cross-source bridgeもsource上で証明されないと記録する。
- [x] 2026-10-05T00:00 JSTに最新Anicca business-outcomes rowをread-only再確認し、row observed_at 2026-10-04T15:00:23.470913Zとsource statuses/report hashesを記録する。raw user rowsを使わずowner APIは重複取得しない。
- [x] 2026-10-05T04:01 JSTに最新persisted Anicca rowをread-only再確認する。business_dateは10/04、observed_atは`2026-10-04T19:01:37.388004Z`。Discovery Standardは10/01–03・43 rows（Counts: Impression 20/14/22、10/01 Page view 5、10/02 Tap 1、evidence_sha256 `98ce6116378dfd1b7fc3921491dfb0fc5ed443b0ac0a3eb671f8ce65f00a5084`）。Downloads Standardは10/02 first-time download 1（App Store search / DE / iPhone / version 1.9.4）。Product-analytics raw event countsはapp_opened 3 / onboarding_started 1 / onboarding_step_advanced 2 / paywall_primer_viewed 1。raw countsのみでunique-user cohortやpurchase eventではない。RevenueCat chartはMRR 20.34 / Actives 5だがcurrency/revenue_definitionなし。app_store_salesは`provider_query_failed`、PostHogは`missing_project_read_credential`。同じbusiness_dateの18:39Z snapshotからASC hashes/source statuses/raw event countsは変わっていない。欠損を0・settled proceeds・conversionへ変換しない。
- [x] CFO laneのread-only provider artifactsをGrowth baselineへ別sourceとして取り込む。§87-B/ASC readbackはcombined 2026-09-30..10-02, processing 10-03でDL1 / total impressions16 / unique11 / page views0 / unattributed、campaign unavailable。§87-Q/RevenueCatは2026-10-03 Anicca MRR JPY3,196.91 (USD query20.34)とSeptember proceeds JPY3,363.77。どちらも同一user cohort・settled Apple/bank netではない。
- [x] Mobile owner Task8/9/10 planとCFO candidate Task1-3/8A evidenceをread-onlyで比較し、FINANCE_DETAIL crosswalk・private D7 sample・日次財務receiptの再利用境界をspecへ記録する。Growth laneはowner source/stateを変更しない。
- [x] Mobile Metrics branch Tasks 1–3とTask 8のreadbackを2026-10-05に更新する。candidate source/testsは完了だがnot merged/production。issue #6547はopen・comments 0、Daisuke134 adminの+1がありmaintainer-approval signalは成立。partial-coverage fix、main sync、再受入れ、fresh reviewは残る。Growth laneはsource implementationを引き取らない。
- [x] 保存済みASC `FINANCIAL/ZZ` artifactのAnicca Annual rowをread-onlyで抽出し、FINANCE_DETAIL/Z1 owner evidenceと期間・子ID・SKU・title・partner shareを比較する。値はfiscal period 2026-08-30–2026-09-26、quantity 1、sale、customer price JPY5,000 / partner share JPY4,250。fresh read-only reviewerは共通transaction/order/return identityとZ1 raw full-row/refund-adjustment evidenceがないため「同一取引」と主張するのをHOLD。field comparisonは済んだが、取引identityの確定・CFO計上・Task 1完了を意味しない。
- [x] Mobile ownerの保存済みofficial Z1 readbackからAnicca Annualへのapp mappingを確定する。`Apple Identifier 6762049696` + SKU `ai.anicca.app.ios.yearly.b` が、`asc subscriptions list --app 6755129214`のAPPROVED subscription recordへ一致する。Z1 report SHA-256は`cbe1dc9242aca2cf049b7ced284a08601bddcef7eafa0a0c4553ea5e53957070`、settlement dateは2026-09-12、partner shareはJPY4,250。これは保存済みowner readbackの消費で、providerを再取得していない。raw report/refund範囲・共通transaction identity・CFO importは別gate。
- [x] 共通transaction/order/return identityが確認できない現状では、Z1を唯一のcanonical settled-proceeds rowとし、FINANCIAL/ZZは非加算の期間/product corroborationにする。二重計上はしない。これはsource選択の記録であり、B7/Financial Managerへの計上完了ではない。
- [x] Fresh read-only reviewはこの限定的なsource classificationを承認した。reviewerは財務計上・net profitの承認とは区別し、Growth側のsource選択とCFO ownerの採用・importを明記するよう指摘した。provider照会・外部effectなし。
- [x] mobile owner feature branchをread-only確認し、collector predicate/fixtureの`Page View`を特定する。Growth laneのcollector sourceは変更しない。
- [x] 保存済みofficial Standard Discovery reportを読み、10/01の`Page view` 3行・Counts合計5、Impression 12行・Counts合計20を確認する。canonical `evidence_sha256`とfile-byte SHA256は区別してspecへ記録し、row-level Unique Countsをoverall audienceに合算しない。
- [x] mobile取得ownerとprimaryへ重複しない所有範囲と必要なrefs/hashを共有する。primaryの分離了承は受信済み、mobile owner本人の返信は未確認。
- [x] US/JP/DE App Store pageを2026-10-04T18:30Zに`crwl`でmetadata再readbackし、title/subtitle/version/category/languages/age/rating overview/IAP/legal subscription textを記録する。screenshotのvisual auditは2026-10-04分を保持する。掲載IAPをRevenueCat live offeringとは扱わない。
- [x] 2026-10-05 current public listingを再readbackし、version1.9.4が継続していることとASC Downloads Standard row/source `project.pbxproj`のversion差を照合する。公開1.9.4/download row 1.9.4とsource 1.9.5/build365のmapping gapを記録し、main sourceを公開済みbuildと見なさない。
- [x] 2026-10-05 US/JP/DE App Store public pagesをread-only比較し、JPの47 ratings、US/DE rating overview非表示、locale別title/subtitleと異なる掲載IAP価格を記録する。localization readbackはASC keywords、promo text、PPO historyやlocalized screenshotsを代替しない。
- [x] 2026-10-04T18:57ZにFR/ES/PT-BRのpublic pagesを`crwl`でread-only確認する。FRは`Affirmations IA - Anicca` / `Une phrase quand ça déborde`、ESは`Afirmaciones Diarias - Anicca` / `Una línea que te acompaña`、PT-BRは`Afirmações Diárias - Anicca` / `Uma linha que te acompanha`。3 localeともpublic versionは1.9.4 / June 25。FR/ESはlocale+5 languages表示、PT-BRも詳細欄にPortuguese+5 languagesとある。これはpublic text/readbackでASC private keywordsやPPO履歴ではない。
- [x] 既存Mobile owner plan/evidenceと保存済みlocal report inventoryを調べ、hidden keyword/promo/metadata timestamp/PPO historyのreadback refが存在しないことを確認した。codex-money-printerへ既存refをAGMSGで照会済み。2026-10-05のfollow-upでlive keyword/promo/PPO refsと共有ASC/browser requestの有無を尋ね、`send.sh`は送信成功。04:03 JST inbox readbackまで新着なし。ここではprovider queryを行わず、公開ページからprivate値を推測しない。
- [x] Life Manager `origin/main=82d31995e68a5220b7a288318a893866a24c7ea6`のtracked `fastlane/metadata`をread-only確認した。candidate `keywords.txt`はja 50 / en-US 95 / de-DE 94 / fr-FR 93 / es-ES 98 / pt-BR 97 Unicode code points。sourceはcommit `0e0758d7f7`（2026-09-17）で追加され、public 1.9.4のJune 25 listingより後。Fastlane `ios upload`は`skip_metadata: true`; `ios submit_review`は`deliver(skip_metadata: false)`、`full_release`はupload→wait→submit_reviewを呼ぶ。tracked source treeに`promotional_text.txt`はない。これは投入候補と可能な経路であり、実行履歴や現ASC値の証明ではない。
- [x] Appleの公式search guidanceと6 localeのpublic titles/subtitlesをcandidate keywordsと照合した。全localeでtitle/subtitleとの単語重複候補があり、ja/en-USでは各3 term、他localeにも1つ以上ある。Apple guidance上、duplicate/plural termsはkeywords slotを浪費する可能性がある。これはsource candidateの品質所見で、live ASCやrank effectの証明ではなく、Fastlane sourceはmobile ownerが所有するためGrowthは変更しない。
- [x] 2026-10-05 ASC private-metadata readback completed as an evidence disposition: compare live 1.9.4 and editable/rejected 1.9.5 keyword localizations, promo-field export, per-locale screenshots and PPO history to public six-locale snapshot. Current live/draft values and all unavailable fields are recorded in the 2026-10-05 10:20 JST readback below. The precise localization edit timestamp is not returned; 1.9.5 submission date predates the Fastlane source commit, so the exact payload of that historical submission remains unproven. No metadata mutation.
- [ ] mobile ownerが`Page view` raw enumに合うcollector predicate/fixtureを修正してfocused regressionを実行し、既存ASC requestのfresh readback refs/hashを共有する。Growth laneは変更を取り込まず、結果だけを消費する。
- [x] Mobile ownerの2026-10-04 11:56–11:57 JST saved official readbackはAniccaのaligned 2026-10-01 store rowを`0 downloads / 5 unique impressions / 0 unique page views`と記録し、page-view→installは`denominator_zero`、impression→installはaggregate `0/5`。これはcampaign/user-cohort rateではない。別のStandard Discovery rawで同じ日付のImpression total Counts20 / Page view total Counts5も確認済み。total Countsとunique metricsは異なる定義なので直接矛盾や率として混ぜない。
- [ ] Ownerから同じreport/instanceのraw segment/StoreKit filterを確認できるrefを受け取り、5/0 unique metricsとStandard Discovery total Countsの定義差・collector `Page View` mismatchをsource-levelで閉じる。combined 09/30..10/02 aggregateのsource別windowも別途照合し、同じ期間の値として合算しない。
- [ ] CFO `collectProduct` combined aggregate (09/30..10/02)とStandard raw report/Rork Analytics report-level `data_from/data_to`・event definitionsをowner refsでreconcileする。16 total vs Oct1 Standard row count20, page view total5 vs product total0を混ぜず、cohort conversionを作らない。
- [x] 2026-10-05 10:57 JSTにDaisのASC CLI read-only調査依頼に基づいて公開version/build対応を確定した。Official `asc versions list --app 6755129214 --version 1.9.4,1.9.5 --platform IOS --include build`はApp Store Version→Build relationshipsを返し、1.9.4→build 390 (`VALID`, expired 2026-09-21)、1.9.5→build 365 (`VALID`, expired 2026-10-02)を確認。1.9.4はREADY_FOR_DISTRIBUTION/READY_FOR_SALE、1.9.5はREJECTED。response path/SHAは直上の11:06 JST readbackに記録した。これは直接取得済みのASC API証拠で、checkout/offering/live source mappingは次項目のまま。
- [ ] 公開1.9.4 build metadata・actual checkout・current source pathを既存owner refsから照合する。ソースのcloseと別画面のPostHog設定だけでliveゲートを断定しない。
- [x] 保存済みASC Subscription State report（processing 2026-10-04 / data window 10/01–10/03 / 81 rows）とMobile Metrics owner planのRevenueCat project/product rosterをread-only照合する。Anicca Annual ID 6762049696、Anicca Monthly B 6769264298、Anicca Weekly 6762049888などASC product recordsがある。RevenueCat projectは8 app records / 21 products across six app IDs。いずれもcurrent checkout offeringを示す証拠ではない。
- [ ] Existing owner refsでcurrent RevenueCat offering→product/SKU→ASC subscription/app mapping、trial eligibility、実購入画面を確定する。Offer Type/NameがblankのASC state reportやUS page上の6 IAP recordからlive trial/offerを推定しない。
- [ ] Mobile/CFO ownerからraw report SHAを検証できるrow-level refとrefund/adjustment coverageをread-onlyで受け取る。CFO ownerによるcanonical採用後、Task 8 partial-coverage修正→最新main同期→受入れ/fresh review→release→natural import→same-occurrence official receipt/readbackを経て、Z1がB7/Financial Managerへ1回だけ入ることを確認する。Growth laneはsource/provider/stateを書き換えない。
- [x] Existing saved ASC Purchases/Subscription Event evidenceをAnicca app IDでread-only照合: 09/07 purchase row1 (content ID6762049696, Sales USD31.40 / report Proceeds USD26.69, paying users1); 09/12 subscription start count1. Preserve report/date separation; this is not a same-user join, current renewal, settlement, or bank receipt.
- [ ] 既存owner refsから最新Sales/Analytics期間とType1/1F download dataを照合し、app SKU/parent、通貨、期間、official receiptを記録する。必要な秘密情報はcredential SSOTで安全に解決し、値を文書へ書かない。
- [ ] Mixpanelのfirst-open/step別unique cohortと既存RC purchase/refund/updateを同期間で照合する。rawイベント、customer cohort、ASC install cohortを別分母として扱う。PostHog read権限不足はownerの既存経路で解決する。
- [x] specの新しいlocal/public observationに観測時点・source・window・分母を記録し、古いsnapshotは歴史的観測として分離する。生レポートを公開Gitへ載せない。
- [ ] 成功判定: liveゲートを証拠付きで記述でき、集計の欠損が見える。製品変更を必要としない。

## Task 2: 最小の計測整備

**進捗:** canonical Life Manager main 82d31995e6のactive PaywallVariantBViewは同じeventを2経路で送っていた。Growth Task2aはLife Manager branch fix/anicca-paywall-view-dedupe-20261005 / commit 3fee4d6cec74fdd469237a30b880106411c46f26で直接送信1行を削除し、helper/hasTracked/SKAN value 2を保持した。独立read-only reviewにCritical/Important findingsなし。Offline source-call-graphはorigin/main=2 paths、branch=1 path。swift parse/diff-check PASS。Xcode 26.6にSimulator runtimeなし、build-for-testing exit70、focused test dependency checkout exit74のためruntime event test/receiptは未確認。CFO/ASC/RC collectorとuser-level funnel integrationは既存ownerに残す。

**Files:** 将来の実装対象は `aniccaios/aniccaios/Services/AnalyticsManager.swift`、`Services/SubscriptionManager.swift`、`AppDelegate.swift`、`Onboarding/PaywallVariantBView.swift`、`Onboarding/OnboardingFlowView.swift`。実際に欠損がある箇所だけ変更する。`scripts/daily-metrics/*`は旧経路の読取参照にとどめ、既存Life Manager producerに対抗する別取得/集計loopを作らない。CFO/ASC/RCの接続修正は既存ownerが所有する。

**Interfaces:** 既存の `AnalyticsManager.track(_:properties:)`、`trackPaywallViewed()`、`trackPurchaseCompleted(productId:revenue:)`、RevenueCat user/transaction ID。出力は一ユーザーの段階表示/完了/購入を接続できるファネル。収益はRCの取引イベントへ寄せる。

- [ ] 同一取引の再受信→新規購入1回、restore→新規購入0、pending/取消→新規購入0を検証する。delegateのentitlement更新を取引発生の代用にしない。
- [ ] 既存IDを確認し、first-openコホート、app/onboarding version、step、experiment/variant、offering/productで不足する属性だけ追加する。悩みの自由記述は送らない。
- [ ] RevenueCat→MixpanelのID/更新/返金を照合し、Sandboxとproductionを分ける。取得できない指標を0へ埋めない。
- [ ] Existing mobile ownerから最新のmature D7 cohort source/refをread-onlyで受け取る。2026-09-26 Anicca n=3 cohortは2026-10-03 probe時点でunavailableだったため、mature後のfresh resultもprivate/experimental label付きで扱い、再取得を並走しない。
- [ ] 変更に関係する既存テストと新しい最小回帰を実行する。repo rootからXcode schemeは`aniccaios`、projectは`apps/mobile/anicca-ios/aniccaios.xcodeproj`。利用可能なSimulator IDを実測して `xcodebuild test -project apps/mobile/anicca-ios/aniccaios.xcodeproj -scheme aniccaios -destination 'platform=iOS Simulator,id=<実測ID>' -only-testing:aniccaiosTests/<対象クラス>` を実行する。
- [ ] 成功判定: one-view/one-eventと取引の重複防止を確認し、同コホートのファネルが読める。反映が依頼された場合のみ公開版の受信まで確認する。

## Task 3: 既存配信を測って改善する

**Files:** 既存配信担当のANICCA設定/投稿記録。正本の場所はTask 1の担当確認で特定し、別配信loopは作らない。この計画へ実際のownerと正本パスを記録する。

**Interfaces:** 投稿ID/URL、切り口、言語、reach、クリック、campaign/CPP集計。出力は週次の獲得比較と次の切り口。

- [x] 既存marketing receipt/jobs journalとmetrics runnerを発見する。specの「継続調査の基準表」に絶対パスを記録する。全product journal行数をAniccaの投稿数にしない。
- [x] 前回11:34Z cutoffのstrict rolling 28d snapshotは562 provider IDs（IG231/TT234/YT97）。歴史的cutoff値として記録し、後続windowのcurrent countと同一視しない。
- [x] 前回11:34Z sampleでは97 unique Postiz IDsのうち93件をpublished receipt provider IDへplatform別exact join。成熟post399件中52 checkpoint（37 measured/15 unavailable）、52 raw hash verified。後続cutoffは別readbackとして記録する。
- [x] 14:26Z in-window measured asset-hash群: Instagram10 posts / 4 groups (5/3/1/1), TikTok8 / 1 group, YouTube14 / 5 groups (5/5/2/1/1)。これは反復状況を示し、勝者の因果効果を示さない。
- [x] 2026-10-04T14:26Z strict rolling 28d refresh: 557 unique provider IDs (IG229/TT231/YT97)、93件のexact platform/provider-ID→post-metrics join。成熟投稿397件中46件にin-window 168h checkpoint（32 measured/14 unavailable）があり、46 raw hashと46 publication-identity native IDが一致した。cutoffとquery定義が異なるsnapshot間は直接比較しない。
- [x] 2026-10-04T16:14:47Z persisted-journal Task 3 diagnostic: per-receipt provider ID count 557, 98 Anicca metrics IDs/94 joins; D7 candidate 57, receipt-bound 53 (37 measured/16 unavailable), 53/53 response hash and latest identity joins. The prior 14:26Z 46/46 snapshot remains historical because journal files changed later and lack row ingestion timestamps; preserve the difference as unresolved until owner supplies the exact snapshot/query.
- [x] 2026-10-04T17:38Z read-only owner data refresh: native-metrics-latest observed 17:26:07Z reports eligible835/ledger905/new_rows0; native_metrics.py plan at 17:38:30Z reports due0/missed0 portfolio-wide, not Anicca D7/conversion. Current lm-loop status keeps Instagram (release 9a76dcc87dfe2e24958ef19f6a69f871df4dbef1) and TikTok (82d31995e6) loaded-idle/exit75/resource_effect_unknown with no receipt or readback. No API, wake, replay or fence-close was issued here.
- [x] 2026-10-04T16:12Z lm-loop statusをread-only更新: Instagramは15:47Z、TikTokは15:53Zにexit75 / resource_effect_unknown、双方loaded-idle・provider_receipt_id/official_readback_refなし。Instagramはno adapter、TikTokはdiagnostic fields completeだがreceiptなし。wake/replay/fence closeなし。
- [x] Instagram旧claim occurrence life-manager-instagram-metrics:18d9127d765110d8-47098（queued 2026-09-27T04:17:37Z）について、tg_user.pyでDais direct chat history（2026-09-27 03:30–06:00Zを含む）をread-only確認。history snapshotは2026-10-04T15:55:52Zまであり、該当windowにmessageなし。owner-report ledgerにもAnicca report rowは04:00–04:40Zにない。loopのLM_TELEGRAM_ALERT_CHAT_IDとdirect TELEGRAM_ALERT_CHAT_IDは設定をin-memory比較して一致したが、occurrence-bound provider receiptは発見できずeffectはunknownのまま。
- [ ] Owner/primaryが旧claimのofficial receipt/readbackをoccurrenceに結び、supported effect_reconcile adapterまたは保全されたprovider receiptでfence close可否を決める。こちらからwake/replay/fence closeしない。
- [x] Latest `lm-loop status` readback at 2026-10-04T16:12Z: Instagram last blocked at 15:47Z, TikTok at 15:53Z; both loaded-idle/exit75/resource_effect_unknown with no provider receipt/ref. Instagram has no reconciliation adapter; TikTok diagnostic is complete but receipt is absent. No wake/replay/fence close.
- [ ] Owner/primaryがdestination-matched negative history readbackを旧claim occurrenceに結び、occurrence-bound official receiptまたはsupported effect_reconcile evidenceを保存する。ownerがfence close可否を決めるまでこのlaneからwake/replay/fence closeしない。
- [x] Existing `marketing-owner-events` post-metrics sampleをread-onlyで取得。これは`life-manager-instagram-metrics`/`life-manager-tiktok-metrics` fenced readersのstatusを解消しない。sampleのimpressions値はnull、click fieldはschemaになく、store install/paidとも未接続。
- [ ] 配信ownerとTikTok format testを既存cadenceの次slotへ適用するか決める。候補: 同じ承認済みJapanese affirmation/caption/CTAを9:16・15〜30秒videoとして1本だけ制作し、同じ投稿時刻/対象者を保つ。投稿前に既存`experiment_id`へvariantを記録。外部post自体はまだ実施せず、captionは編集せず、既存ownerの承認済みcopy/approval pathを使う。
- [ ] 168hで同じmetrics sourceからviews/postと取れるlikes/shares/savesをreadbackする。8件のcarousel baseline（median 39.5 views、max58）はhistorical/nonrandomized controlで、1本のpilotから勝者を宣言しない。方向が良ければ次の既存slotで2本の独立assetを再確認し、cadence変更はASC click/install/paid linkが閉じるまでしない。
- [ ] post-level reach/viewsを同期間ASC source/page-view/first-time-download dataへ接続する。click/campaign identityがない分岐はunavailableのまま記録し、metrics reader effect fenceを自laneからwake/replay/closeしない。
- [ ] 既存ownerの予定済み配信 cadenceは維持する。計測が取れない状態で追加account/publisherや過剰なpost volumeを自作しない。sample pathが閉じたら、実測で勝ったcreativeを追加テストする。
- [ ] 最新の国別DLと実績を見て、日本/日本語を第一案とする。夜の考えすぎ、自己批判、先延ばしの切り口を比較する。
- [ ] 投稿別campaign linkを設計する。SNS reachとストアImpressionを混ぜず、個人単位の帰属ができるとは仮定しない。
- [ ] 既存ownerのcadenceと制作能力を確認し、計測可能な勝ち切り口が見つかった後に追加クリエイティブ案を増やす。実カード/通知を見せ、記事は勝った悩みを掘り下げる。週10本/週1記事は能力確認前の必達本数にしない。
- [ ] 毎週クリック→初回DL→購入→D35売上/インストールを比較し、取得不能な段は欠損として残す。
- [ ] 成功判定: 実投稿と獲得が比較でき、次に増やす切り口に証拠がある。単なる投稿数を成功としない。
- [ ] MRR/$10K目標はアプリ別とportfolio合計で分け、source windowと有料分母が揃うまで目標到達/転換率を宣言しない。

- [x] 2026-10-05T03:47 JST fresh read-only owner refresh: `native-metrics-latest.json` actual path is `/Users/anicca/.local/state/life-manager/marketing-owner-events/evidence/metrics/native-metrics-latest.json`, observed `2026-10-04T18:47:38Z`, SHA-256 `8ed71d699c5b3ba3e191e82c8f4bae6135af3d9f6266a5301a6be9314f0a7eed`; eligible835/ledger905/new_rows0, exclusions ambiguous2/error21/missing_identity0/not_published0/unresolved47. `post-metrics.jsonl` and `provider-responses.jsonl` remain 3042 rows at SHA-256 `527895f50996b18d62d433c0653caf7b5835e440b4fce50e5c68190c4f49a6aa` / `9696da4b6e10f38438668ecaf283d80f9b27f4597d781be3f9a90d6debfaea40`; `publication-identity.jsonl` remains 905 rows but was re-written at 18:47:33Z with SHA-256 `6465a3566df84d0bd3c7bed0331d647859ca37dfc3d9f1205c5eb4e654c19070`. No per-row ingestion timestamp exists, so don't combine these as a new same-snapshot D7 count.
- [x] Same read-only `lm-loop status`: Instagram loaded-idle, current exit78, installed release `9a76dcc87dfe2e24958ef19f6a69f871df4dbef1`; TikTok loaded-idle, current exit75, installed release `82d31995e68a5220b7a288318a893866a24c7ea6`. Both remain `resource_effect_unknown` with null provider receipt and official readback; fenced occurrences `life-manager-instagram-metrics:18d9127d765110d8-47098` and `life-manager-tiktok-metrics:18d9f8ffb829e890-94915` diagnose `cause_event_not_in_current_journal` / `no_adapter`. Registry has no `effect_reconcile` entry for either loop. No provider query, wake, replay or fence-close was issued.

## Task 4: ASOと初回価値体験を順に改善する

**Files:** ASCのANICCAスクショ/metadata、既存`.claude/skills/screenshot-ab/`資産、`Onboarding/OnboardingStep.swift`、`OnboardingFlowView.swift`、`PersonalizedInsightStepView.swift`、`ProcessingStepView.swift`、`NotificationPermissionStepView.swift`、既存カード描画、`Resources/{ja,en}.lproj/Localizable.strings`。

**Interfaces:** 既存 `next: () -> Void` とuserProfileの悩み/時間、カード表示。出力はストア訴求一案の実験、次に実カード体験の独立実験。両者を同時に変更しない。

- [x] 公開US listingのiPhone 6.7-inch screenshot 4枚と見出し、title/subtitle文字数をread-onlyで監査し、spec「公開ASO素材」に記録する。1/2/4枚目の視覚的反復、screenshotの8 themesとdescriptionの13 themesの差を「要確認」と記録する。
- [ ] Task 1で公開build/sourceと実際のtheme数、各localeの素材、live offeringを照合する。8-vs-13が解消するまでtheme数コピーを変更しない。未確認の個別化・AI機能・改善率を見出しへ足さない。
- [ ] Task 1〜3のsource/計測gate後、Apple PPOの対象version/locales、daily impressions/downloads、必要標本、期間、conversion定義を確認する。PPOは同時に1 testで最大90日なので、その期間内に必要な標本が見込めなければ実験を延期し、現行素材を維持する。[Apple PPO](https://developer.apple.com/app-store/product-page-optimization/)
- [ ] PPO treatmentを1案作り、先頭3枚を課題/得られる結果→使う場面→実在する製品体験として差別化する。現行に対しscreenshotsだけを変え、title/subtitleや価格を同時変更しない。
- [ ] Apple PPOでcontrol対1 screenshot treatmentを比較し、事前に定めたconversion measureとAppleが示す必要標本/90%以上confidenceで判定する。低trafficの小差は勝者としない。外部listing更新は既存ownerの申請/審査経路を使う。[Apple PPO](https://developer.apple.com/app-store/product-page-optimization/)
- [ ] 公開buildの実際のfirst-run画面とTask 2で測れる同一新規user cohortを照合し、first-open→step→初回実カード→paywall→server-confirmed purchaseのbaselineを記録する。raw event countをunique conversionにしない。
- [ ] onboarding案は歓迎→悩み選択→体験を変える場合だけ時間選択→実際に回答へ合うカード→通知の価値と適切な許可依頼→明確な料金/期間/trial/更新条件を示すpaywallの順に設計する。既存card UI/dataを再利用し、通知拒否でも続行可能にする。
- [ ] 「選んだ悩みが異なると表示カードも異なる」をfocused回帰で固定する。保存済み旧stepのmigrationと途中再開は実際に必要な範囲だけ扱う。
- [ ] onboardingの一変数treatmentを作り、価格・trial・paywall選択・store screenshotsを固定して同一new-user cohortで比較する。hard/softは現行実装だけで決めず、live paywall/offeringsと十分なsampleを見てTask 5で別比較する。
- [ ] 81%改善主張と引用レビューの根拠を調べ、根拠がなければ使わない。rate依頼の移動や段階削除は実離脱と用途から決める。
- [ ] Apple標準rating promptの利用条件を確認し、最初の実価値体験後の適切なmomentを候補化する。onboarding/paywallを遮らず、購入・高ratingの対価を付けない。
- [ ] 成功判定: product-page conversionと、初回価値到達→server-confirmed purchase/D35 revenue per first-time installを同じvariant/cohort単位で比較できる。価格を固定し、未成熟cohortは未確定のまま残す。

## Task 5: ペイウォールを一変数ずつ比較する

**Files:** 実際のlive経路の`OnboardingBibleViews.swift`/`PaywallVariantBView.swift`、RC offerings/experiments。使われていない`PlanSelectionStepView`だけ変更して実験開始としない。

**Interfaces:** 現価格、offering/product、匿名ID、固定variant。出力はまず訴求一案対現行、その後にhard/softの独立比較。

- [ ] Task 1のliveゲートをcontrolとし、価格/トライアルは固定する。初回は価値説明だけを変える。
- [ ] 現行hard/softの実動作は公開buildと購入経路を確認してから記録する。`PaywallFlowContainer`にclose buttonがあるsource観測だけで、公開体験や無料利用範囲を断定しない。
- [ ] offerings空/通信失敗→再読込/restore、購入取消/pending→購入計上0、既存有料→権利保持を最小検証する。
- [ ] 標本見積り後、softの無料範囲/再アップグレード契機とhardの復旧を定義する。既存Free/Pro実機能を確認してからコピーを作る。
- [ ] hard/soft比較を行う場合はその形式だけを変え、価格/trial/訴求を固定する。購入率だけでなくD35 revenue per first-time install、返金、利用、解約とrestoreを保護指標にする。
- [ ] 新規ユーザーのvariantは再起動後も固定し、比較中に価格やスクショを変えない。
- [ ] D35売上/インストールと購入率、返金、初回利用、購読解除を比較する。年額更新は短期では未確認とする。
- [ ] 成功判定: 同条件コホートで評価できる。trial startや少数購入だけで勝者としない。

## Task 6: 他の公開アプリへ展開する

- [ ] 仮説、変えた一点、母数、期間、結果、次の一点を既存の実験正本に記録する。
- [ ] ANICCAで有効な獲得と課金の組合せが再現できたら、最新の需要/売上を確認して次の公開アプリ一つを選ぶ。
- [ ] 計測と運用手順を再利用し、訴求はそのアプリの顧客に合わせる。
- [ ] 成功判定: アプリ別MRRと費用を区別して改善を評価できる。各アプリが自動で$10Kになるとは仮定しない。

## セルフレビューと保存時検証

- specの目的/現状/体験/計測/課金/展開はTask 1〜6で対応する。
- 外部値は前回観測、ソース所見は作成元main、とラベルを分ける。
- 文書だけの差分とリンク先存在を検査し、`git diff --check`を実行する。
- 実装テスト、課金、配信、MRR改善は今回未実施。文書保存のPASSと混ぜない。
