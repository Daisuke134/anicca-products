# ANICCA iOS 成長計画の再開メモ

## 正確な再開先

- repository: `https://github.com/Daisuke134/anicca-products`
- worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- branch/upstream: `docs/anicca-ios-growth-plan-20261004` / `origin/docs/anicca-ios-growth-plan-20261004`
- この更新前のbranch HEAD: `6a9ec01e0413a275d314d77e00b6cb43371dbbc0`。再開時に`git fetch`してHEAD/upstreamを再確認する。
- spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- TODO/orderの唯一の正本: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の「タスク一覧」
- source baseline: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`

## 継続目標とcursor

継続目標は、公開ANICCA iOSでdistribution→store conversion→初回価値/onboarding→paid→retention→CFO同期間net economicsを実測し、ポートフォリオ合算$10K MRRへ再現可能な方法を作ること。その後、実績のあるwinnerを需要のある公開アプリへ移す。目標到達を保証したり、未取得値を0/実績として扱ったりしない。

現在cursorは**Task 1**。Task 3のread-only配信記録調査はTask 1/2と並行。次の作業は既存mobile ownerの公式refs/hashを再利用して公開build/source対応・live offering・unique user funnelの不足を照合すること。provider取得を重複させない。Task 3では既存post ID→official reach/view/click→ASC期間のsample pathを進めるが、`life-manager-instagram-metrics` / `life-manager-tiktok-metrics` の`resource_effect_unknown` fenceをwake/replay/closeしない。現在のfence ownerがreceipt/readbackを確認する。

計画に記録済みの状態:

- 6つのpublished targetをowner資料から確認。Aniccaは10/01共通ASC窓で0 first-time downloads / 5 unique impressions / 0 page views。page-view conversionは分母不足。
- RevenueCat owner chartはUSD $20.34 / complete period 2026-10-02。settled proceeds/profitではない。10/03保存rowはcurrency/revenue_definition欠落。
- local analytics raw countsはapp_opened=5 / onboarding_started=1 / paywall_primer_viewed=4。unique cohortではなくconversion計算へ使わない。PostHog read credentialは未確認。
- 28日local marketing journalにAnicca-tagged published post ID 567件（IG234/TikTok236/YouTube97）。reach/click/store installへのofficial joinはない。既存ownerの配信cadenceは維持し、計測前に本数を増やさない。
- 依頼者は全アプリで約3 installs/日と申告。期間・app別sourceが未照合のため公式baselineではない。

## 境界と既存成果

Growth laneはこのspec、plan、handoverだけを編集する。ASC/RevenueCat/mobile analytics/CFO producerとfenced distribution readersはそれぞれ既存ownerが所有する。Life Manager全体のTODOはprimaryの統合SSOTを正本とし、このplanはANICCA growth内の順序だけを管理する。

Paywall duplicate-eventのsource-only修正は別worktree/branch `/Users/anicca/anicca-project/.worktrees/anicca-paywall-event-dedupe-growth`、branch `fix/anicca-paywall-event-dedupe-20261004-growth`、commit `76cf8b6e5968f958ee837318d68b6842386f4eb2`。syntax parseとdiff checkはPASS、Xcode buildはiOS 26.5 destination未解決でcompile前exit 70、event-count regression/public binary mapping/production event readbackは未確認。PR/merge/releaseはない。

AGMSG: 前回文書には`lm/lm-ios-growth-1004`と記録があるが、今回このrepoでの`whoami`は複数identityを返し、team rosterにも当該名を確認できず、manual inboxはpane未解決となった。今回のAGMSG通知は送っていない。再開時は使用identityを正しく解決してからsendし、以前のhandover名を現状として仮定しない。

## 再開手順

1. 上記worktreeで`git fetch origin`、branch/HEAD/upstream/cleanを確認する。
2. specの「継続調査の基準表」とplanの「タスク一覧」を読む。現在cursorはTask 1、Task 3はread-only並行調査。
3. 既存ownerから公式refs/hashを照合する。未取得なら不足するfile/ref・owner・期間をtaskに記録し、別のprovider取得を始めない。
4. Task 2以降はplanの依存・acceptance順で進める。source変更は最新main由来の専用worktreeを用い、Taskの必要範囲だけ修正・検証する。
5. spec/plan/handoverのmeaningful editごとにこの専用branchへcommit/pushし、remote objectを確認する。plan文書のPASSを製品/収益のPASSと混同しない。
