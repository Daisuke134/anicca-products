# ANICCA iOS 成長計画の再開メモ

## 正確な再開先

- repository: `https://github.com/Daisuke134/anicca-products`
- worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- branch/upstream: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- latest spec/plan update commit: `3c3f9f7d47c888f782522f4919859123b9e7e7fd` on `origin/docs/anicca-ios-growth-plan-20261004` (`Daisuke134/anicca-products`)。handover update may be a later commit; re-fetch and verify branch HEAD/upstream before resuming.
- spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- TODO/orderの唯一の正本: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の「タスク一覧」
- source audit baseline: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`。latest `anicca-products origin/main` is `48e2cbd417c46623802aca863148c6716c41e5dc`, whose only delta from this baseline adds one unrelated Capafy article; targeted Anicca files are unchanged. Any new product-code worktree must start from 48e2cbd4.

## 継続目標とcursor

継続目標は、公開ANICCA iOSでdistribution→store conversion→初回価値/onboarding→paid→retention→CFO同期間net economicsを実測し、ポートフォリオ合算$10K MRRへ再現可能な方法を作ること。その後、実績のあるwinnerを需要のある公開アプリへ移す。目標到達を保証したり、未取得値を0/実績として扱ったりしない。

現在cursorは**Task 1: 公開build/offerings/同一ユーザーファネルの不足証拠照合**。最新Anicca `business-outcomes` rowはbusiness date 2026-10-03 / observed 2026-10-04T12:58:29Z。保存済みDiscovery Standardは09/30–10/02 window（processed 10/03）で、10/01はImpression 12 rows / Counts20、Page view 3 rows / Counts5（1/3/1）。Downloads Standard（processed 10/04）は10/02 first-time download 1、App Store search、version1.9.4、DE/iPhone。Rork Analytics common-window 10/01は0 first-time downloads / 5 unique impressions / 0 unique page views。CFO `collectProduct()`は別combined window 09/30–10/02でDL1/impressions16/unique11/page views0、unattributed/campaign unavailable。report/segment差がありCVRを作らない。`anicca-products origin/main`とLife Manager origin/mainのproject metadataはともに1.9.5/build365だが公開pageとdownload rowは1.9.4で、ASC build mapping未確認。US/JP/DE public page readbackではJPに47 ratings、localeごとにタイトル/サブタイトル/価格表示が異なる。最新RC local chartは10/03 MRR20.34/Actives5だがcurrency/revenue_definition欠落、Mixpanel raw events 5/1/4にpurchase/user denominatorなし、PostHog unavailable、ASC Sales row_count0/proceeds emptyはsettled zeroではない。詳細・hashはgrowth spec/planに記録。Task 3 current strict 28d readback at 14:26Z: 557 provider IDs (IG229/TT231/YT97), 93 exact metrics joins. 397 mature posts中46 in-window 168h checkpoints (32 measured/14 unavailable); 46/46 hashesとnative-ID identity joinsは一致。Measured per-post sums: IG10 reach8,331/views11,586; TikTok8 views311; YouTube14 views7. click/ASC install/paid joinは未接続。`resource_effect_unknown` distribution readersをwake/replay/closeしない。

Task 4の初回ASO readbackは完了したが、実験/変更は未着手。US pageの4 screenshotは「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目のvisual repetitionと8-vs-13 themes表記差は機能/claim owner確認待ち。JP page title/subtitleはローカライズ済みでratings 47、US pageはoverview表示に件数不足。US/JP/DEでIAP名/価格も異なるがlive offering/checkout mapping不明。title/subtitle文字数、PPO eligibility/sample、localized screenshot historyはplan/spec参照。実験/変更は未着手。

CFO/Mobile cross-lane reviewはspec「CFO・既存Mobile laneの成果とGrowth側の境界」に保存した。CFO candidate branch `docs/lm-cfo-cost-observability-spec-20261002` HEAD `9bf6abfd601eb9e2360524a1d0f157c2fb519d28`、Life Manager origin/main `7f90ebc20cce7e514fc66efc801679cd3e565b57`。candidate Task1–3/8A source/testはPASS扱いだがmain未統合、natural daily receipt/replay-zeroと7日観測は未完。B7は14/14 loops unknown、137/132 gaps、MRR/runway unknown。CFO next cursorは§87-AC queue-order fix→formal promotion path→natural receipt/replay-zero→7 days. Mobile branch `feat/lm-mobile-metrics-20261003` HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`にPRなし、issue #6547 open/OWNER +1、partial coverage fix/review/main/release/import待ち。Growthは両ownerのsource/state/provider requestを重複させない。

10/01 Standard report raw/evidence_sha256 and file-byte SHA256 are in the spec. Its `Page view` 1/3/1 enum is lower-case v; mobile owner source/fixture still require `Page View`. Same Detailed raw output, regression, and fresh readback are missing, so no CVR or causal closure. Current owner branch remains 1f045eff; no PR.

計画に記録済みの状態:

- 6つのpublished targetsをowner資料から確認。Aniccaの10/01 Rork common-windowは0 first-time downloads / 5 unique impressions / 0 unique page views。Downloads Standardは10/02 first-time download1 on v1.9.4。これらは別日付/分母でpage-view conversionは未算出。
- CFO §87-Qのdirect RevenueCat readbackは10/03 complete periodでAnicca MRR JPY 3,196.91（USD query USD 20.34）、September proceeds JPY 3,363.77。provider metricはApple/bank settlement・会社net profitではなく、JPY chartのsymbol-only unitは`$`と矛盾する。local 10/03 business-outcomes rowにはcurrency/revenue_definitionがまだない。
- CFO §87-BのASC aggregateは2026-09-30..10-02でAnicca DL1 / impressions16 / unique11 / page views0 / unattributed、campaign unavailable。§87-QのMRR/proceedsはprovider metricsでsettled cashではない。FINANCIAL/ZZとFINANCE_DETAIL/Z1 crosswalk、Mobile T9/10 attributionとproduct cohortは未完。詳しい別period/owner境界はgrowth specのcross-lane evidence table参照。
- 最新local analytics raw countsはapp_opened=5 / onboarding_started=1 / paywall_primer_viewed=4。unique cohortではなくconversion計算へ使わない。RevenueCat local rowはMRR20.34/Actives5だがcurrency/revenue_definitionなし。App Store Sales row_count0/proceeds emptyはsettled zeroではなく、PostHog read credentialも未取得。
- 28d historical count 567 was a different query basis; the 11:34Z strict cutoff returned 562. Latest strict cutoff 14:26:22Z is 557 IDs (IG229/TT231/YT97), 93 exact metrics joins, 397 mature posts, and 46 in-window 168h checkpoints (32 measured/14 unavailable), with 46/46 response hashes and native identity joins matched. No click/ASC install/paid join.
- 依頼者は全アプリで約3 installs/日と申告。期間・app別sourceが未照合のため公式baselineではない。
- 2026-10-04T12:24Z `crwl` readbackのUS listingはtitle `Daily Affirmations - Anicca`、subtitle `Affirmations, Calm & Self-Love`、public version 1.9.4 (Jun 25)、Health & Fitness、13+、6言語。Appleはrating/review overview表示に件数不足と表示。6件のIAP価格はAnicca Pro Monthly/Annualというdescription内の契約表記と並ぶが、live ASC/RevenueCat offeringや実checkoutの証拠ではない。
- 2026-10-04T12:58:29Z latest `business-outcomes` rowはASC Discovery 09/30–10/02, Downloads 10/02 first-time1, source project1.9.5/build365, public/download version1.9.4, RC chart20.34/Actives5 without currency/definition, product analytics5/1/4, Sales empty, PostHog unavailable。CFO row/windowsとRork common-windowも別definitionsで保持する。Task1 owner request for version mapping/live offer/Detailed fix/current D7 remains pending.

## 境界と既存成果

Growth laneはこのspec、plan、handoverだけを編集する。ASC/RevenueCat/mobile analytics/CFO producerとfenced distribution readersはそれぞれ既存ownerが所有する。Life Manager全体のTODOはprimaryの統合SSOTを正本とし、このplanはANICCA growth内の順序だけを管理する。

Paywall duplicate-eventのsource-only修正は別worktree/branch `/Users/anicca/anicca-project/.worktrees/anicca-paywall-event-dedupe-growth`、branch `fix/anicca-paywall-event-dedupe-20261004-growth`、commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`。syntax parseとdiff checkはPASS、Xcode buildはiOS 26.5 destination未解決でcompile前exit 70、event-count regression/public binary mapping/production event readbackは未確認。PR/merge/releaseはない。

Source state: ANICCA source audit baseline `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`; latest `anicca-products origin/main` is `48e2cbd417c46623802aca863148c6716c41e5dc` (target ANICCA source unchanged). Life Manager `origin/main` is `7f90ebc20cce7e514fc66efc801679cd3e565b57`; CFO candidate `9bf6abfd601eb9e2360524a1d0f157c2fb519d28`; mobile candidate `1f045eff3d27cfec3945cd8d2dff64f06928c834`. Issue #6547 is open with zero comments and OWNER +1 from Daisuke134; mobile partial-coverage fix/release/import remain pending.

AGMSG: Life Manager rootで`join.sh lm lm-ios-growth-1004 codex`はexit 0、`identities.sh`にもseatが現れる。delivery modeは`off`（手動inbox）に設定。既存送信は`history.sh`で確認済み。12:36:20Zにprimaryへcommit `f2f838a2`とASO/Task4を共有。12:40:59Zにmobile ownerへTask1 statusと必要refsを照会。12:43:26ZにStandard report path/hash/countsとDetailed request未確認をownerへ送り、12:43:27Zに同じ根拠とowner境界をprimaryへ共有。13:29:50Zにprimaryとmobile ownerへcommit `3bddd5bf`のCFO evidence crosswalkとissue #6547 +1/current pending tasksを共有し、`history.sh`で確認。`team.sh lm --json`はseatを表示しない一方、identity listとsend/historyはseatを認識しているためroster readback discrepancyを残す。mobile owner/primaryのsource修正とfresh readbackを待ち、Growth laneはsourceを編集しない。

13:38:17Zにprimaryへ`b8607c36`、13:38:27Zにmobile CFO ownerへCFO/Growth boundaryを共有。14:05:49Zにmobile ownerへ公開build/ASC mapping・locales/metadata/PPO refs・Detailed Page view fix/same-request readback・mature D7 latest refsを照会。`history.sh`でsendを確認、14:33Zのinboxに新着なし。Task1 evidence commits `fee02c4d138f9aad657bc457e0f3916c74d7eb1a`, `085eb424c4b9b19e6defc36830bfb88783f55d5b`; Task3 current strict-window refresh is in spec/plan commit `3c3f9f7d47c888f782522f4919859123b9e7e7fd`.

## 再開手順

1. 上記worktreeで`git fetch origin`、branch/HEAD/upstream/cleanを確認する。
2. specの「継続調査の基準表」とplanの「タスク一覧」を読む。現在cursorはTask 1。Task 3はread-only調査が部分進行、Task 4のUS listing ASO監査は部分完了で、実験はTask 1〜3のgate後。
3. 既存ownerから公式refs/hashを照合する。未取得なら不足するfile/ref・owner・期間をtaskに記録し、別のprovider取得を始めない。
4. Task 2以降はplanの依存・acceptance順で進める。source変更は最新main由来の専用worktreeを用い、Taskの必要範囲だけ修正・検証する。
5. spec/plan/handoverのmeaningful editごとにこの専用branchへcommit/pushし、remote objectを確認する。plan文書のPASSを製品/収益のPASSと混同しない。
