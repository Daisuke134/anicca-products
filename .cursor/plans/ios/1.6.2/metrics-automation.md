# Metrics Automation — Trinity Sync System

> **目的**: Claude, Anicca, ユーザーの三位一体（Trinity）が毎日同じデータを見て、同じ文脈を持ち、即座に意思決定できる状態を作る。

**作成日**: 2026-02-08
**データソース**: Mixpanel MCP, RevenueCat MCP, App Store Connect MCP, iOS コード解析

---

## 目次

1. [Golden Output — 理想の日次メトリクスレポート](#1-golden-output)
2. [イベント精度分析 — 3つの質問への回答](#2-イベント精度分析)
3. [現状 vs 理想のギャップ — 何を直す必要があるか](#3-現状-vs-理想のギャップ)
4. [実装ロードマップ](#4-実装ロードマップ)
5. [生データアーカイブ](#5-生データアーカイブ)

---

## 1. Golden Output

これが毎朝 #metrics チャンネルに届く理想のレポート。

```
📊 Weekly Metrics Report
📅 2026-02-01 → 2026-02-08 (7 days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASC Downloads (7d):       108
  JP: 101 | US: 5 | Other: 2
TikTok Ad Spend (7d):     ¥3,559
TikTok CPI:               ¥8,304 (SKAN)
App Deletes (7d):          31 (60.8% delete rate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 ONBOARDING FUNNEL (in-app)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step                         Count    Rate     Drop
─────────────────────────────────────────────────
1. onboarding_started         144    100.0%      -
2. struggles_completed        105     72.9%   -27.1%
3. live_demo_completed         14      9.7%   -63.2%  ⚠️
4. notifications_completed     --       --       --
5. onboarding_completed       107     74.3%      --
6. paywall_viewed              39     27.1%   -47.2%  🔴
7. paywall_dismissed_free       6      4.2%      -
8. paywall_purchased            9      6.3%      -
9. rc_trial_started (RC)        1      0.7%      -    🔴

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ KEY CONVERSION RATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                          Actual    Goal     Status
─────────────────────────────────────────────────
Paywall Rate               27.1%    80%      🔴 CRITICAL
(paywall_viewed / started)

Initial Conversion Rate     2.6%    10%      🔴 CRITICAL
(rc_trial / paywall_viewed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 REVENUE (RevenueCat)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MRR:                $17
Active Subs:          2
Active Trials:        1
New Customers (28d): 389

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 TREND (vs last week)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Downloads:    108  (前週比 +XX%)
Paywall Rate: 27.1% (前週比 XX pp)
Trial Rate:   2.6%  (前週比 XX pp)
```

### なぜこのフォーマットか

| セクション | 理由 |
|-----------|------|
| **DISTRIBUTION** | TikTok広告 → ASCダウンロードの因果関係を毎日見る |
| **ONBOARDING FUNNEL** | どのステップで何%落ちてるか一目でわかる |
| **KEY CONVERSION RATES** | 最重要KPI 2つ + 目標との差分 |
| **REVENUE** | RevenueCatのリアルタイム収益データ |
| **TREND** | 前週との比較で改善/悪化を検知 |

---

## 2. イベント精度分析

### 質問1: `onboarding_started` は正確か？

**結論: 正確。「初回アプリ起動」のマザーメトリクスとして使える。**

| 項目 | 詳細 |
|------|------|
| **コード定義** | `OnboardingFlowView.swift:46` |
| **発火条件** | `if step == .welcome { AnalyticsManager.shared.track(.onboardingStarted) }` |
| **タイミング** | OnboardingFlowViewの`onAppear`で、step == .welcomeの時のみ発火 |
| **初回のみ？** | YES — オンボーディングは初回起動時のみ表示される |
| **再インストール** | 再インストール時は再度発火する（UserDefaultsがリセットされるため） |
| **`app_opened`との違い** | `app_opened`は毎回の起動で発火（既存ユーザー含む）。ファネルには使えない |

**ASCダウンロード数との比較検証:**

| 期間 | ASC Downloads (Type 1) | onboarding_started | 差分 |
|------|:---:|:---:|:---:|
| 30日間 | 204 | 413 | +102% |
| 今週 (Feb 1-6) | 108 | 144 | +33% |

差分の理由:
- **再インストール**: ユーザーが削除→再インストールするとASCにはカウントされないがonboarding_startedは再発火
- **タイムゾーン**: ASC=UTC、Mixpanel=デバイスTZ
- **ASCデータ欠損**: 一部日のレポートが404

**結論**: `onboarding_started`は正確。ASCより多いのは再インストール分で正常。変更不要。

---

### 質問2: `rc_trial_started_event` は正確か？なぜMixpanelで0に見えるのか？

**結論: 正確だが、30日間でたった1件しかない。Mixpanelで0に見えたのは期間の問題。**

| 項目 | 詳細 |
|------|------|
| **コード定義** | iOSコードには**存在しない** — RevenueCat webhook → Mixpanel（サーバーサイド） |
| **フロー** | ユーザー購入 → RevenueCat検知 → Webhook → Mixpanel |
| **Sandbox除外** | Sandbox Token未設定のため、本番トランザクションのみ |
| **RevenueCatとの一致** | RC: Active Trials = 1（Feb 1開始）、Mixpanel: rc_trial_started_event = 1（Feb 1）→ **完全一致** |

**重要: `onboarding_paywall_purchased` との混同に注意**

| イベント | 今週カウント | 含むもの | 正確性 |
|---------|:---:|---------|--------|
| `rc_trial_started_event` | 1 | 本番トライアルのみ | 最も正確 |
| `onboarding_paywall_purchased` | 9 | サンドボックス + デバッグ + 本番 | 不正確（水増し） |

**`onboarding_paywall_purchased`の9件はほぼ全てサンドボックステスト。** 本番トライアルは1件のみ。

**リネーム提案**: `rc_trial_started_event` → `onboarding_trial_started` に変更するかどうかについて:
- RevenueCat webhookのイベント名は変更可能だが、Mixpanel側でイベント名を変える必要がある
- 現状のままでも機能的には問題ない。ただしファネル上の一貫性のため、Mixpanelダッシュボード上で表示名を変更するのが最もリスクが低い

---

### 質問3: `onboarding_paywall_viewed` と `onboarding_paywall_dismissed` は何を計測しているか？45%ドロップの正体は？

**`onboarding_paywall_viewed`:**

| 項目 | 詳細 |
|------|------|
| **コード定義** | `OnboardingFlowView.swift:71` |
| **発火条件** | `fullScreenCover`の`onAppear`コールバック内 |
| **タイミング** | ペイウォール画面が**表示された瞬間**に発火 |
| **正確性** | 正確 — ペイウォールが画面に表示された = このイベントが発火 |

**`onboarding_paywall_dismissed`:**

| 項目 | 詳細 |
|------|------|
| **コード定義** | `AnalyticsManager.swift:161` に定義あり |
| **実際の使用** | **コード内で一度も呼ばれていない（デッドコード）** |
| **代替イベント** | `onboarding_paywall_dismissed_free`（`OnboardingFlowView.swift:142`）が実際に使われている |
| **Mixpanelデータ** | `dismissed` = Jan 30以降ゼロ、`dismissed_free` = Feb 6から6件 |

**45%ドロップの正体:**

ファネルの数字を細かく見ると:

| ステップ | カウント | 前ステップからの残存率 |
|---------|:---:|:---:|
| onboarding_started | 144 | 100% |
| onboarding_completed | 107 | 74.3% |
| onboarding_paywall_viewed | 39 | **36.4%** (対completed) |

**onboarding_completed（107人）→ paywall_viewed（39人）で63.6%が消えている。**

これが「45%ドロップ」の正体。考えられる原因:

| 仮説 | 可能性 | 詳細 |
|------|:---:|------|
| **オンボーディング完了直後にアプリを閉じる** | 高 | `onboarding_completed`が発火した後、`fullScreenCover`が表示される前にアプリをバックグラウンドに |
| **通知許可ダイアログで離脱** | 中 | 通知許可を求められた瞬間にアプリを閉じるユーザー |
| **ペイウォール表示のタイミングラグ** | 低 | fullScreenCoverの表示に時間がかかり、その間に離脱 |
| **`live_demo_completed`の影響** | 高 | Feb 6から新ステップ追加。14件しか完了していない → ほとんどがここで離脱 |

**最も深刻な発見: `onboarding_live_demo_completed` が14件しかない**

Feb 6に追加された新ステップだが、144人中14人しか完了していない（9.7%）。これは：
- liveDemo画面で90%以上が離脱している
- OR: liveDemoのイベント発火ロジックにバグがある
- OR: liveDemoがFeb 6以降のユーザーのみ（39人中14人=35.9%）

**→ Feb 6以降のデータだけで見ると:**

| ステップ | Feb 6-8 | Rate |
|---------|:---:|:---:|
| onboarding_started | 39 | 100% |
| live_demo_completed | 14 | 35.9% |
| onboarding_completed | 27 | 69.2% |
| paywall_viewed | 18 | 46.2% |

liveDemoで64%が離脱している。これはクリティカル。

---

## 3. 現状 vs 理想のギャップ

### 3.1 データ収集の問題

| 問題 | 深刻度 | 現状 | 修正内容 |
|------|:---:|------|---------|
| `onboarding_paywall_dismissed` がデッドコード | 中 | 定義されてるが呼ばれない。30日で75件 → 0件に急変 | `dismissed_free`に統合するか、`dismissed`を正しく実装 |
| `onboarding_live_demo_completed` が少なすぎる | 高 | 144人中14人(9.7%)。バグか実際の離脱か要調査 | コードを確認し、発火タイミングが正しいか検証 |
| `onboarding_notifications_completed` のデータなし | 中 | Mixpanelクエリで取得していないが、コードには存在 | ファネルに追加して全ステップ可視化 |
| RevenueCat Charts API 権限不足 | 中 | `charts_metrics:charts:read` スコープなし | RevenueCat Dashboard → API Keys でスコープ追加 |
| 前週比トレンドの計算 | 低 | 現在のCronジョブは前週データを保持していない | Cronプロンプトに前週データ取得ロジック追加 |

### 3.2 Cronジョブの拡張

現在の`daily-metrics-reporter`（毎朝5:00 JST）を拡張する必要がある。

| 項目 | 現状 | 理想 |
|------|------|------|
| **ASC Downloads** | 7日間合計のみ | 7日間 + 国別内訳 |
| **Mixpanel ファネル** | なし | 全ステップのカウント + ドロップ率 |
| **Key Conversion Rates** | Paywall Rate + Trial Rate（手計算） | 自動計算 + 目標との比較 |
| **RevenueCat** | MRR + Subs + Trials | 同じ + 前週比 |
| **TikTok Ad** | なし | 支出 + CPI（TikTok API連携必要） |
| **前週比トレンド** | なし | 各KPIの前週比 |

### 3.3 実装に必要なもの

| # | 必要なアクション | 担当 | 難易度 |
|---|----------------|------|:---:|
| 1 | VPS Cronプロンプトを新ファネルフォーマットに更新 | Claude (OpenClaw設定) | 低 |
| 2 | Mixpanelセグメンテーションクエリをプロンプトに追加 | Claude (OpenClaw設定) | 低 |
| 3 | RevenueCat API Key にcharts_metrics:charts:readスコープ追加 | ユーザー (RC Dashboard) | 低 |
| 4 | `onboarding_live_demo_completed` の発火ロジック検証 | Claude (コード調査) | 中 |
| 5 | `onboarding_paywall_dismissed` のデッドコード整理 | Claude (コード修正) | 低 |
| 6 | `onboarding_notifications_completed` をファネルに追加 | Claude (Cronプロンプト) | 低 |
| 7 | 前週データの保存・比較ロジック追加 | Claude (VPSスクリプト) | 中 |
| 8 | TikTok Ads API連携（将来） | 要調査 | 高 |

---

## 4. 実装ロードマップ

### Phase 1: 即座にできること（Cronプロンプト更新のみ）

**所要時間: 30分**

Anicca（OpenClaw）の`daily-metrics-reporter` Cronプロンプトを更新して、Golden Outputフォーマットで出力させる。

現在のCronジョブはすでにASC + RC + Mixpanelデータを取得している。フォーマットとMixpanelクエリの追加だけで大部分が実現可能。

追加するMixpanelクエリ:
- `onboarding_started` (7d)
- `onboarding_struggles_completed` (7d)
- `onboarding_live_demo_completed` (7d)
- `onboarding_notifications_completed` (7d)
- `onboarding_completed` (7d)
- `onboarding_paywall_viewed` (7d)
- `onboarding_paywall_dismissed_free` (7d)
- `onboarding_paywall_purchased` (7d)
- `rc_trial_started_event` (7d)

### Phase 2: データ精度の修正（コード変更）

**所要時間: 1-2時間**

| タスク | 内容 |
|--------|------|
| `live_demo_completed` 検証 | 発火タイミングが正しいか確認。9.7%は低すぎる |
| `dismissed` デッドコード整理 | 未使用の`onboarding_paywall_dismissed`を削除 or 正しく実装 |
| `notifications_completed` 検証 | ファネルに含めるべきか確認 |

### Phase 3: トレンド比較（VPSスクリプト拡張）

**所要時間: 2-3時間**

- 前週データをVPSローカルに保存（JSON）
- 翌週のレポート生成時に前週データと比較
- pp（パーセントポイント）での変化を表示

### Phase 4: Trinity Sync基盤（MDファイル + Serenaメモリ）

**所要時間: 1時間**

- 毎日のメトリクスデータをMDファイルに追記（ログ）
- Serenaメモリに最新KPIを保存
- Claude / Anicca / ユーザーが同じデータを参照できる状態

### Phase 5: 全チャネル統合（将来）

- TikTok Ads API連携
- Meta Ads API連携（将来）
- ASO A/Bテスト結果の自動取得
- Newsletter metrics（将来）

---

## 5. 生データアーカイブ

### 5.1 Mixpanel — 今週ファネル (Feb 1-8, 2026)

| ステップ | イベント名 | カウント | Rate (対started) | ステップ間ドロップ |
|:---:|---------|:---:|:---:|:---:|
| 1 | `onboarding_started` | 144 | 100.0% | - |
| 2 | `onboarding_struggles_completed` | 105 | 72.9% | -27.1% |
| 3 | `onboarding_live_demo_completed` | 14 | 9.7% | -63.2% |
| 4 | `onboarding_completed` | 107 | 74.3% | - |
| 5 | `onboarding_paywall_viewed` | 39 | 27.1% | -47.2% |
| 6 | `onboarding_paywall_dismissed_free` | 6 | 4.2% | - |
| 7 | `onboarding_paywall_purchased` | 9 | 6.3% | - |
| 8 | `rc_trial_started_event` | 1 | 0.7% | - |

**注意**: `live_demo_completed`はFeb 6以降のみ発火（新ステップ）。`onboarding_completed`と順序が矛盾して見えるのは、Feb 1-5のユーザーにはliveDemo画面がなかったため。

### 5.2 Mixpanel — 日別ブレイクダウン (Feb 1-8)

| 日付 | started | struggles | live_demo | completed | paywall_viewed | dismissed_free | purchased | rc_trial |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 02-01 | 20 | 17 | 0 | 17 | 15 | 0 | 4 | 1 |
| 02-02 | 5 | 5 | 0 | 5 | 2 | 0 | 1 | 0 |
| 02-03 | 11 | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| 02-04 | 22 | 17 | 0 | 16 | 3 | 0 | 2 | 0 |
| 02-05 | 47 | 34 | 0 | 34 | 1 | 0 | 0 | 0 |
| 02-06 | 23 | 17 | 9 | 23 | 15 | 3 | 2 | 0 |
| 02-07 | 14 | 6 | 4 | 4 | 3 | 3 | 0 | 0 |
| 02-08 | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |

### 5.3 Mixpanel — 30日間サマリー (Jan 9 - Feb 8)

| イベント | カウント |
|---------|:---:|
| `app_opened` | 907 |
| `onboarding_started` | 413 |
| `onboarding_paywall_viewed` | 170 |
| `onboarding_paywall_dismissed` | 75 (Jan 30以降 0 — デッドコード化) |
| `rc_trial_started_event` | 1 |

### 5.4 RevenueCat (Feb 8, 2026)

| 指標 | 値 |
|------|-----|
| Active Trials | 1 |
| Active Subscriptions | 2 |
| MRR | $17 |
| Revenue (28d) | $9 |
| New Customers (28d) | 389 |
| Active Users (28d) | 397 |

### 5.5 App Store Connect — Downloads (Feb 1-6)

| 日付 | DL数 | 国別 |
|------|:---:|------|
| 02-06 | 11 | JP: 11 |
| 02-05 | 73 | JP: 73 (スパイク) |
| 02-04 | 11 | JP: 10, HR: 1 |
| 02-03 | 3 | JP: 3 |
| 02-02 | 4 | JP: 3, RO: 1 |
| 02-01 | 6 | JP: 6 |
| **合計** | **108** | JP: 101 (93.5%) |

### 5.6 App Store Connect — トラフィックソース

| ソース | First-time DL | シェア |
|--------|:---:|:---:|
| App referrer (TikTok) | 61 | 79.2% |
| App Store search | 12 | 15.6% |
| App Store browse | 4 | 5.2% |

### 5.7 App Store Connect — 削除データ (Feb 1-7)

| 指標 | 値 |
|------|-----|
| First-time downloads | 51 |
| Deletes | 31 |
| **Delete Rate** | **60.8%** |

### 5.8 TikTok Ads (Dec 1, 2025 - Jan 31, 2026)

| 指標 | 値 |
|------|-----|
| Campaign | anicca-install-1 |
| Budget | ¥300,000 |
| Spend | ¥24,911 |
| Impressions | 13,466 |
| Clicks | 115 |
| CTR | 0.85% |
| CPC | ¥217 |
| CPM | ¥1,850 |
| Conversions (SKAN) | 3 |
| CPI (SKAN) | ¥8,304 |

---

## 6. Mixpanel 全イベント一覧 (36件)

| # | イベント名 | カテゴリ | 現行使用 |
|---|-----------|---------|:---:|
| 1 | `app_opened` | アプリ | YES |
| 2 | `onboarding_started` | オンボーディング | YES |
| 3 | `onboarding_struggles_completed` | オンボーディング | YES |
| 4 | `onboarding_live_demo_completed` | オンボーディング | YES (Feb 6~) |
| 5 | `onboarding_notifications_completed` | オンボーディング | YES |
| 6 | `onboarding_completed` | オンボーディング | YES |
| 7 | `onboarding_paywall_viewed` | Paywall | YES |
| 8 | `onboarding_paywall_dismissed` | Paywall | **NO (デッドコード)** |
| 9 | `onboarding_paywall_dismissed_free` | Paywall | YES (Feb 6~) |
| 10 | `onboarding_paywall_purchased` | Paywall | YES (サンドボックス含む) |
| 11 | `rc_trial_started_event` | RevenueCat | YES (本番のみ) |
| 12 | `rc_trial_converted_event` | RevenueCat | YES |
| 13 | `rc_renewal_event` | RevenueCat | YES |
| 14 | `rc_cancellation_event` | RevenueCat | YES |
| 15-36 | 旧オンボーディング + Nudge + Session | 各種 | 一部YES |

---

## 7. 結論と次のアクション

### 最優先で解決すべきこと

| # | 問題 | インパクト | 対応 |
|---|------|-----------|------|
| 1 | **Paywall Rate 27.1%（目標 80%）** | 最大 | オンボーディングフロー改善（特にliveDemo画面の離脱調査） |
| 2 | **Trial Rate 2.6%（目標 10%）** | 最大 | ペイウォールデザイン・コピー改善 |
| 3 | **live_demo_completed 9.7%** | 高 | バグか離脱か要調査。Feb 6以降データのみで再計算必要 |
| 4 | **Delete Rate 60.8%** | 中 | アプリ初期体験の改善 |

### Trinity Sync のためにまずやること

| # | アクション | 担当 |
|---|-----------|------|
| 1 | Cronプロンプトを Golden Output フォーマットに更新 | Claude → OpenClaw |
| 2 | RevenueCat API Key にcharts スコープ追加 | ユーザー |
| 3 | `live_demo_completed` のコード検証 | Claude |
| 4 | Serenaメモリに最新KPIを保存する運用開始 | Claude + Anicca |
| 5 | 週次メトリクスMDログの自動更新 | Anicca (Cron) |
