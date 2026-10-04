# ANICCA iOS 成長計画の再開メモ

## 正確な再開先

- repository: `https://github.com/Daisuke134/anicca-products`
- worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- branch/upstream: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- 今回のhandover更新直前branch HEAD: `9383729fc2592fd28fbf435f77d75c1683323592`。再開時に`git fetch`してHEAD/upstreamを再確認する。
- spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- TODO/orderの唯一の正本: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の「タスク一覧」
- source baseline: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`

## 継続目標とcursor

継続目標は、公開ANICCA iOSでdistribution→store conversion→初回価値/onboarding→paid→retention→CFO同期間net economicsを実測し、ポートフォリオ合算$10K MRRへ再現可能な方法を作ること。その後、実績のあるwinnerを需要のある公開アプリへ移す。目標到達を保証したり、未取得値を0/実績として扱ったりしない。

現在cursorは**Task 1**。Task 3のread-only配信記録調査はTask 1/2と並行。次の作業は、既存mobile ownerの公開build/source・live offering・unique funnel refsを再利用するとともに、10/01のRork ASC Analytics readbackと新しいlocal Discovery/Downloads reportの数値差をmetric定義/segment単位で照合すること。provider取得を重複させず、率を作らない。新artifactのevidence SHAはDiscovery `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`、Downloads `8004c761579cf82a7d0fd03198918fbf578c357685f26a0d651ae81df070d45f`。Task 3では既存post ID→official reach/view/click→ASC期間のsample pathを進めるが、`life-manager-instagram-metrics` / `life-manager-tiktok-metrics` の`resource_effect_unknown` fenceをwake/replay/closeしない。現在のfence ownerがreceipt/readbackを確認する。

計画に記録済みの状態:

- 6つのpublished targetをowner資料から確認。Aniccaは10/01共通ASC窓で0 first-time downloads / 5 unique impressions / 0 page views。page-view conversionは分母不足。
- RevenueCat owner chartはUSD $20.34 / complete period 2026-10-02。settled proceeds/profitではない。10/03保存rowはcurrency/revenue_definition欠落。
- local analytics raw countsはapp_opened=5 / onboarding_started=1 / paywall_primer_viewed=4。unique cohortではなくconversion計算へ使わない。PostHog read credentialは未確認。
- 28日local marketing journalにAnicca-tagged published post ID 567件（IG234/TikTok236/YouTube97）。reach/click/store installへのofficial joinはない。既存ownerの配信cadenceは維持し、計測前に本数を増やさない。
- 依頼者は全アプリで約3 installs/日と申告。期間・app別sourceが未照合のため公式baselineではない。
- 2026-10-04T11:00:23Z `crwl` readbackのUS listingはtitle `Daily Affirmations - Anicca`、subtitle `Affirmations, Calm & Self-Love`、public version 1.9.4 (Jun 25)、rating overviewなし。IAP欄には6件の名称/価格があるが、live ASC/RevenueCat offeringや実checkoutの証拠ではない。specに詳細と次の照合を記録した。
- 2026-10-04T10:56:36.419433Zの`business-outcomes.jsonl` rowはproduct_analytics 5/1/4、RC chart MRR20.34/Actives5（10/03 period、currency/revenue_definitionなし）、App Store Sales `provider_query_failed`、PostHog `missing_project_read_credential`。同rowが参照するDiscovery report (9/30–10/02) は10/01 Impression counts20/Page view counts5、Downloads reportは10/01 restore1/10/02 first-time download1 (App Store search)。前回Rork Analytics common-window 0/5 unique impressions/0 unique page viewsとの照合が必要で、conversionは未算出。

## 境界と既存成果

Growth laneはこのspec、plan、handoverだけを編集する。ASC/RevenueCat/mobile analytics/CFO producerとfenced distribution readersはそれぞれ既存ownerが所有する。Life Manager全体のTODOはprimaryの統合SSOTを正本とし、このplanはANICCA growth内の順序だけを管理する。

Paywall duplicate-eventのsource-only修正は別worktree/branch `/Users/anicca/anicca-project/.worktrees/anicca-paywall-event-dedupe-growth`、branch `fix/anicca-paywall-event-dedupe-20261004-growth`、commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`。syntax parseとdiff checkはPASS、Xcode buildはiOS 26.5 destination未解決でcompile前exit 70、event-count regression/public binary mapping/production event readbackは未確認。PR/merge/releaseはない。

AGMSG: Life Manager rootで`join.sh lm lm-ios-growth-1004 codex`はexit 0、`identities.sh`にもseatが現れる。delivery modeは`off`（手動inbox）に設定。`send.sh`で`codex-money-printer`へbranch/cursor/owner境界と既存refs共有を依頼し、`history.sh`で10:58:45Zと11:09:02Zの送信記録を確認。2回目はASC source差分と最新evidence SHAを共有した。11:09Zのinboxは新着なし。`team.sh lm --json`はseatを表示しない一方、identity listとsend/historyはseatを認識しているため、roster readback discrepancyを残す。新しいreplyを受けるまでは同一依頼を重ねて送らない。

## 再開手順

1. 上記worktreeで`git fetch origin`、branch/HEAD/upstream/cleanを確認する。
2. specの「継続調査の基準表」とplanの「タスク一覧」を読む。現在cursorはTask 1、Task 3はread-only並行調査。
3. 既存ownerから公式refs/hashを照合する。未取得なら不足するfile/ref・owner・期間をtaskに記録し、別のprovider取得を始めない。
4. Task 2以降はplanの依存・acceptance順で進める。source変更は最新main由来の専用worktreeを用い、Taskの必要範囲だけ修正・検証する。
5. spec/plan/handoverのmeaningful editごとにこの専用branchへcommit/pushし、remote objectを確認する。plan文書のPASSを製品/収益のPASSと混同しない。
