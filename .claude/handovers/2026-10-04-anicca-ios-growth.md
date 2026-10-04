# ANICCA iOS 成長計画の再開メモ

## 正確な再開先

- repository: `https://github.com/Daisuke134/anicca-products`
- worktree: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan`
- branch: `docs/anicca-ios-growth-plan-20261004`
- upstream/push: `origin/docs/anicca-ios-growth-plan-20261004`
- source baseline commit: `081eeb2e6fc9b44087eb4439e81951fa30c2cb9c`
- 文書を保存するcommitはこのbranchのtip。開始時にfetchとHEAD/upstream比較で確認する。チャットにもpush後のSHAを報告する。
- spec: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`
- plan/TODO SSOT: `/Users/anicca/anicca-project/.worktrees/anicca-ios-growth-plan/docs/superpowers/plans/2026-10-04-anicca-ios-growth-plan.md` の「タスク一覧」

## 状態と境界

Task 1の既存資料/ソース/local rawイベント読取とTask 3の資料所在確認まで進む。specの「継続調査の基準表」と`$10K MRRの計算例`が部分結果を持ち、残作業は計画の「タスク一覧」に統一する。RevenueCat owner readbackはUSD20.34/2026-10-02 MRR chartだがsettled revenueではなく、10/03 saved rowのcurrency/revenue_definitionも欠落している。単位経済表の値はplanning assumptionであり現状実績としない。実装、ASC/RC/PostHog設定変更、投稿、広告、製品リリースは未実施。前回のraw外部レポートは一時保存で現存しない。今回は既存mobile ownerの公式refs/hashを再利用し、独自の二重provider取得を始めない。

Task 1のmeasurement-quality prerequisiteとしてpaywall view duplicate eventのsource-only修正を別branchへpushした: `Daisuke134/anicca-products` / `fix/anicca-paywall-event-dedupe-20261004-growth` / `76cf8b6e5968f958ee837318d68b6842386f4eb2`。Reviewerはactive flowの修正漏れなしと判断。Swift syntax parse PASS、Xcode buildはSimulator 26.5未導入でコンパイル前にexit70、実イベント回帰/public binary対応は未確認。PR/merge/releaseなし。ANICCA growth spec/plan branchは別管理する。

文書worktreeは文書だけのsparse checkout。作成時baselineはclean。アプリテストは今回実行していない。共有checkout `/Users/anicca/anicca-project` は `docs/affiliate-agent-architecture` に他者の変更が多数ある。切り替えや巻き戻しを禁止する。

AGMSGのこのセッションの名前は `lm/lm-ios-growth-1004`。別セッションはこの名前を取得せず、自分専用の名前で参加する。既存調整担当へ計画のみ・実装未着手を共有済み。送信と受信確認は別。このセッションのmonitor bridgeは未稼働、手動inboxのみ。

## 最初の安全な一手

1. このworktreeでbranch/HEAD/upstream/dirtyと文書3件を確認する。他端末ならoriginの同branchから別のworktreeへ復元する。
2. specとplanを読み、Task 1の不足証拠から再開する。取得ownerに照会済みの公開build/ソース対応、live hard/softとofferings、unique user funnelのrefs/hashを照合する。raw件数5/1/4を離脱率にしない。Task 3の既存投稿資料を並行して読める。
3. AGMSGで重複担当を確認する。製品変更はまだ依頼されていないため、実装に進まない。
4. 追加の実装依頼が届いた場合は、その時点の最新mainから別の専用worktree/branchを作る。計画/レビューはgpt-6.1-sol/medium、実装はgpt-6-luna/maxを使う。

メール送信、goal起動、別エージェントへの実装委譲は依頼されていない。
