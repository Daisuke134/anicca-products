# ANICCA iOS 成長計画の再開メモ

## 正確な再開先

- repository: `https://github.com/Daisuke134/anicca-products`
- worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- branch/upstream: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- latest spec/plan update commit: `043778032bc32ada20af7418408a6d386cfe8fa1` on `origin/docs/anicca-ios-growth-plan-20261004` (`Daisuke134/anicca-products`)。再開時に`git fetch`してcurrent branch HEAD/upstreamを再確認する。
- spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- TODO/orderの唯一の正本: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の「タスク一覧」
- source baseline: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`

## 継続目標とcursor

継続目標は、公開ANICCA iOSでdistribution→store conversion→初回価値/onboarding→paid→retention→CFO同期間net economicsを実測し、ポートフォリオ合算$10K MRRへ再現可能な方法を作ること。その後、実績のあるwinnerを需要のある公開アプリへ移す。目標到達を保証したり、未取得値を0/実績として扱ったりしない。

現在cursorは**Task 1**。Task 3のread-only配信記録調査はTask 1/2と並行。Appleの公式定義をreadbackし、Discovery reportの`Counts`はtotal events、`Unique Counts`はrow-level unique users、Discovery Impression eventはpage viewsを含まないと確認した。このため10/01の20 total impressionsとRork Analyticsの5 unique impressionsは直接矛盾せず、first-time downloads 0もDownloads reportと整合する。残るpage-view差について、mobile owner branch `feat/lm-mobile-metrics-20261003` / HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`に高確度なsource/test enum mismatch候補を発見した。TSV parserは値を保持する一方、collector predicateとfixtureは`Page View`を要求し、Apple raw enumは`Page view`。Detailed report rawで実際のenumを確認し、ownerがmapping/fixtureを直して同じrequestを再readbackするまで、この0を実利用者の値と解釈しない。Growth laneはsourceを編集せず、公開build/source・live offering・unique funnel refsも既存ownerから取得する。provider取得を重複させず、rateを作らない。evidence SHAはDiscovery `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`、Downloads `8004c761579cf82a7d0fd03198918fbf578c357685f26a0d651ae81df070d45f`。Task 3ではstrict rolling 28d windowに562 Anicca published receipt IDs（IG231/TT234/YT97、receipt cutoff 11:34Z）。owner post-metricsは97 unique Postiz IDs、93件をreceiptへexact join。7d measured sample37件はpublication-identity ledgerでもresolved/native_post_id一致。168h mature posts399件中52件にin-window checkpoint（37 measured/15 unavailable、raw hash52/52 verified）。7d measured sampleはIG14 postsでreach 12,342/views 17,037、TikTok8でviews311、YouTube15でviews7。数値はplatform別per-post valuesで、click/ASC install/paid attributionではない。creative hash groupはIG4（6/4/3/1）、TikTok1（8）、YouTube5（6/5/2/1/1）。metrics latest observedは11:33:50Z。`life-manager-instagram-metrics` / `life-manager-tiktok-metrics` の`resource_effect_unknown` fenceをwake/replay/closeしない。

Task 4の初回ASO readbackは完了したが、実験/変更は未着手。US pageの4 screenshotは「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目のvisual repetitionと、screenshot 8 themes vs description 13 themesの不一致を確認した。title 27/30、subtitle 30/30で上限内。公開ページscorecardは暫定38/100（rating overviewなしのためrubric上評価不能を0点扱い。actual conversion scoreではない）。PPOは最大90日・必要標本が見込める時だけ、Task1〜3のgate後にscreenshots一変数で行う。Task4詳細とonboarding案はplan/spec参照。

Task 1で保存済みofficial Standard reportもread-only確認した。`6755129214-discovery.json` SHA256 `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`は10/01に`Event="Page view"`を3行・Counts 1/3/1（合計5）、Impressionを12行・Counts合計20で記録する。owner collector source/testの`Page View`との差はStandard reportに対して確認済み。同じDetailed request outputは未取得なので、Rork 0への因果確定と修正判定はpending。owner branch remote HEAD `1f045eff3d27cfec3945cd8d2dff64f06928c834`、該当head PRはなし。12:45:57Z時点のAGMSG inboxに返信なし。

計画に記録済みの状態:

- 6つのpublished targetをowner資料から確認。Aniccaは10/01共通ASC窓で0 first-time downloads / 5 unique impressions / 0 page views。page-view conversionは分母不足。
- RevenueCat owner chartはUSD $20.34 / complete period 2026-10-02。settled proceeds/profitではない。10/03保存rowはcurrency/revenue_definition欠落。
- local analytics raw countsはapp_opened=5 / onboarding_started=1 / paywall_primer_viewed=4。unique cohortではなくconversion計算へ使わない。PostHog read credentialは未確認。
- 前回のAnicca 28d count 567件は別query basis。最新strict rolling 28d receipt filterは562件（IG231/TikTok234/YouTube97）。owner metricsの93 exact joinsと52件の168h checkpoint sampleは上記cursor参照。click/ASC install/paid joinはまだない。
- 依頼者は全アプリで約3 installs/日と申告。期間・app別sourceが未照合のため公式baselineではない。
- 2026-10-04T12:24Z `crwl` readbackのUS listingはtitle `Daily Affirmations - Anicca`、subtitle `Affirmations, Calm & Self-Love`、public version 1.9.4 (Jun 25)、Health & Fitness、13+、6言語。Appleはrating/review overview表示に件数不足と表示。6件のIAP価格はAnicca Pro Monthly/Annualというdescription内の契約表記と並ぶが、live ASC/RevenueCat offeringや実checkoutの証拠ではない。
- 2026-10-04T10:56:36.419433Zの`business-outcomes.jsonl` rowはproduct_analytics 5/1/4、RC chart MRR20.34/Actives5（10/03 period、currency/revenue_definitionなし）、App Store Sales `provider_query_failed`、PostHog `missing_project_read_credential`。同rowが参照するDiscovery report (9/30–10/02) は10/01 Impression counts20/Page view counts5、Downloads reportは10/01 restore1/10/02 first-time download1 (App Store search)。前回Rork Analytics common-window 0/5 unique impressions/0 unique page viewsとの照合が必要で、conversionは未算出。

## 境界と既存成果

Growth laneはこのspec、plan、handoverだけを編集する。ASC/RevenueCat/mobile analytics/CFO producerとfenced distribution readersはそれぞれ既存ownerが所有する。Life Manager全体のTODOはprimaryの統合SSOTを正本とし、このplanはANICCA growth内の順序だけを管理する。

Paywall duplicate-eventのsource-only修正は別worktree/branch `/Users/anicca/anicca-project/.worktrees/anicca-paywall-event-dedupe-growth`、branch `fix/anicca-paywall-event-dedupe-20261004-growth`、commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`。syntax parseとdiff checkはPASS、Xcode buildはiOS 26.5 destination未解決でcompile前exit 70、event-count regression/public binary mapping/production event readbackは未確認。PR/merge/releaseはない。

AGMSG: Life Manager rootで`join.sh lm lm-ios-growth-1004 codex`はexit 0、`identities.sh`にもseatが現れる。delivery modeは`off`（手動inbox）に設定。既存送信は`history.sh`で確認済み。12:36:20Zにprimaryへcommit `f2f838a2`とASO/Task4を共有。12:40:59Zにmobile ownerへTask1 statusと必要refsを照会。12:43:26ZにStandard report path/hash/countsとDetailed request未確認をownerへ送り、12:43:27Zに同じ根拠とowner境界をprimaryへ共有し、`history.sh`で両送信を確認。latest inbox 12:45:57Zは返信なし。`team.sh lm --json`はseatを表示しない一方、identity listとsend/historyはseatを認識しているためroster readback discrepancyを残す。mobile owner/primaryのsource修正とfresh readbackを待ち、Growth laneはsourceを編集しない。

## 再開手順

1. 上記worktreeで`git fetch origin`、branch/HEAD/upstream/cleanを確認する。
2. specの「継続調査の基準表」とplanの「タスク一覧」を読む。現在cursorはTask 1。Task 3はread-only調査が部分進行、Task 4のUS listing ASO監査は部分完了で、実験はTask 1〜3のgate後。
3. 既存ownerから公式refs/hashを照合する。未取得なら不足するfile/ref・owner・期間をtaskに記録し、別のprovider取得を始めない。
4. Task 2以降はplanの依存・acceptance順で進める。source変更は最新main由来の専用worktreeを用い、Taskの必要範囲だけ修正・検証する。
5. spec/plan/handoverのmeaningful editごとにこの専用branchへcommit/pushし、remote objectを確認する。plan文書のPASSを製品/収益のPASSと混同しない。
