# Mobile App Factory — 仕様書

**作成日:** 2026-02-21
**更新日:** 2026-02-22
**ステータス:** 計画中（実装未開始）
**目的:** AIエージェントが自律的にアプリをビルド・提出・イテレーションし、人々の苦しみを減らしながら収益を最大化するパイプラインを構築する。

---

## ビジョン

- **Anicca（OpenClaw, Mac Mini）** = プランナー。データを見て何をテストするか決める。cron持ち。
- **Claude Code** = ワーカー。Aniccaに呼ばれて実際に実行する。
- **トリガー方式:** Anicca → `exec` → `claude --print "skill-name: ..."` → Claude Codeが実行
- **全アプリが毎日イテレーション。** 人間は何もしなくてよい。

---

## 全Cron + Skill 一覧

| # | 名前 | 種別 | 担当 | 時刻 | 目的 |
|---|------|------|------|------|------|
| C1 | `screenshot-ab` | Cron + Skill | **Anicca** | 毎朝 06:00 JST | スクショA/B実験の監視・判断・実行（自己完結） |
| C2 | `paywall-ab` | Cron + Skill | **Anicca** | 毎朝 06:01 JST | PaywallA/B実験の監視・判断・実行（自己完結） |
| C3 | `app-factory` | Cron + Skill | **Anicca** | 毎晩 23:00 JST | トレンド検索 → spec生成 → Claude app-shipをトリガー |
| C4 | `larry` | Cron + Skill | **Anicca**（既存） | 毎日 19:00 JST | TikTok投稿（詳細は既存skill参照） |
| S1 | `app-ship` | Skill | **Claude Code** | on-demand（C3から呼ばれる） | コード生成 → greenlight → fastlane submit |
| S2 | `onboarding-ab-execute` | Skill | **Claude Code** | on-demand（later scope） | feature flag → TestFlight |

---

## 接続図

```
06:00 JST  Anicca [screenshot-ab] → 自己完結（PIL + ASC API）
06:01 JST  Anicca [paywall-ab]    → 自己完結（Mixpanel + RC API）

19:00 JST  Anicca [larry] → TikTok投稿（既存）

23:00 JST  Anicca [app-factory]
               ├─ トレンド検索 → spec生成
               ├─ exec → Claude [app-ship] × N アプリ（順次）
               └─ larry呼び出し（Day 1 TikTok）
```

---

## C1: `screenshot-ab`（Anicca Cron + Skill、自己完結）

### 概要

- 毎朝06:00 JSTに自動起動
- 実験は常に走っている（空白期間なし）
- スクショ生成: **Phase 1 = PIL**（テキスト・背景変更）、**Phase 2 = Pencil MCP**（PIL で改善しない場合、全体デザイン刷新）
- 停止基準: Apple公式 = 90%信頼水準（現在APIで取得不可 → 毎日Slackに報告し、ダイスが手動判断）
- ASC CLI update後に自動判断に切り替え予定

### memory 構造（Anicca memory）

```json
{
  "experiment_id": "ppo_abc123",
  "start_date": "2026-02-21",
  "queue_position": 0,
  "phase": "PIL",
  "control_label": "現在のデフォルトスクショ3枚",
  "treatment_label": "Queue 0: ペイン直撃 / PIL",
  "before_cvr": 1.2
}
```

### フロー

```
06:00 起動
 │
 ├─ Anicca memory 読む
 │    └─ experiment_id / start_date / queue_position / phase / before_cvr
 │
 ├─ ASC API で実験状態確認
 │    GET /v2/appStoreVersionExperiments/{id}
 │    └─ state: RUNNING / STOPPED / なし
 │
 ├─ 経過日数計算（today - start_date）
 │
 ├─ 判断（Apple公式: 停止基準 = 90%信頼水準）
 │    experiment_id なし → START
 │    7日未満             → skip
 │    7日以上             → Slack報告 → ダイスが手動で winner/null を memory に書く
 │    90日経過（Apple上限）→ 自動NULL → 次へ
 │
 ├─ [START]
 │    PIL Phase: テキスト・背景を変えてスクショ3枚生成
 │    Pencil Phase: 全体デザインを刷新してスクショ3枚生成
 │    → ASC PPO実験作成（50/50）→ アップロード → memory更新
 │
 ├─ [WINNER / NULL（ダイスが memory に書いた場合）]
 │    WINNER → 勝者をASCのdefaultに適用 → queue +1 → START
 │    NULL   → 実験停止 → queue +1 → START
 │
 └─ Slack 1行サマリ投稿
```

### Slack 日次レポート（output）

```
[screenshot-ab] Day 14 🔬
Queue 0 / Phase PIL: "6 Years. 10 Apps. Still Nothing Changed."
実験ID: ppo_abc123 | 開始: 2026-02-21 | before CVR: 1.2%
App Analytics で信頼水準を確認し、memory に winner or null を書いてください
```

### PIL でスクショ3枚を生成する流れ（Phase 1）

ソース: AppRadar / 「Screenshots are the real decision point (users scan in <5s). Lead with clear benefit/result → social proof → core flow.」

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | シミュレータからアプリの実画面を取得 | `xcrun simctl io booted screenshot app_screen.png` |
| 2 | 背景PNG（1290×2796）を読み込む | PIL |
| 3 | デバイスフレームPNGを重ねる | PIL |
| 4 | アプリ画面をフレーム内にリサイズして配置 | PIL |
| 5 | headline テキストを描画（白・太字・上部） | PIL ImageDraw |
| 6 | PNG出力（1290×2796） | PIL |
| 7 | スクショ1・2・3を同様に生成 | PIL |
| 8 | ASC PPO実験作成（50/50）+ 3枚アップロード | ASC API |
| 9 | memory更新（experiment_id・start_date・before_cvr） | Anicca memory |

### Pencil MCP でスクショ3枚を生成する流れ（Phase 2：PILで改善しない場合）

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 新規 .pen ファイル作成 | Pencil MCP `open_document("new")` |
| 2 | モバイルデザインガイドライン取得 | Pencil MCP `get_guidelines("mobile")` |
| 3 | スクショ1・2・3のレイアウトをデザイン | Pencil MCP `batch_design` |
| 4 | PNG export（1290×2796）× 3枚 | Pencil MCP `get_screenshot` |
| 5 | ASC PPO実験作成（50/50）+ 3枚アップロード | ASC API |
| 6 | memory更新 | Anicca memory |

### テストQueue

ソース: AppRadar / 「Lead with clear benefit/result → social proof → core flow」（AIDA フレームワーク）

| Queue # | Phase | 変えるもの | スクショ1（benefit） | スクショ2（social proof） | スクショ3（core flow） |
|---------|-------|-----------|---------------------|------------------------|----------------------|
| 0 | PIL | テキストのみ | "6 Years. 10 Apps. Still Nothing Changed." | "3,000+ People Finally Broke The Loop" | アプリのメイン画面 |
| 1 | PIL | テキストのみ | "Why Do You Keep Failing The Same Habit?" | "Your Brain Isn't Broken. Your App Is." | アプリのメイン画面 |
| 2 | PIL | 背景色 + テキスト | "What If Day 1 Didn't Feel Like Day 1 Again?" | "AI That Texts You Before You Give Up" | アプリのメイン画面 |
| 3 | Pencil MCP | 全体デザイン刷新 | 新レイアウト・新配色 | 新レイアウト | 新レイアウト |

---

## C2: `paywall-ab`（Anicca Cron + Skill、自己完結）

### 概要

- 毎朝06:01 JSTに自動起動
- 実験は常に走っている（空白期間なし）
- RevenueCat Experiment で Offering を差し替える
- 停止基準: Apple公式 = 90%信頼水準（現在APIで取得不可 → 毎日Slackに報告、ダイスが手動判断）

### memory 構造（Anicca memory）

```json
{
  "experiment_id": "rc_exp_abc123",
  "start_date": "2026-02-21",
  "queue_position": 0,
  "control_label": "Start Your Free Week",
  "treatment_label": "Queue 0: Try Free for 7 Days",
  "before_trial_cvr": 1.1
}
```

### フロー

```
06:01 起動
 │
 ├─ Anicca memory 読む
 │    └─ experiment_id / start_date / queue_position / before_trial_cvr
 │
 ├─ Mixpanel API で Trial CVR 取得（直近7日）
 │    onboarding_paywall_viewed → rc_trial_started_event
 │
 ├─ RC API で実験状態確認
 │
 ├─ 経過日数計算
 │
 ├─ 判断（Apple公式: 停止基準 = 90%信頼水準）
 │    experiment_id なし → START
 │    7日未満             → skip
 │    7日以上             → Slack報告 → ダイスが手動で winner/null を memory に書く
 │    90日経過            → 自動NULL → 次へ
 │
 ├─ [START]
 │    RC API で新Offering作成 → パッケージ作成 → 既存商品紐付け
 │    RC Experiment開始（50/50）→ memory更新
 │
 ├─ [WINNER]
 │    勝者OfferingをRC defaultに設定 → 実験停止 → queue +1 → START
 │
 ├─ [NULL]
 │    実験停止 → queue +1 → START
 │
 └─ Slack 1行サマリ投稿
```

### Slack 日次レポート（output）

```
[paywall-ab] Day 14 🔬
Queue 0: "Try Free for 7 Days" vs "Start Your Free Week"
実験ID: rc_exp_abc123 | 開始: 2026-02-21 | before Trial CVR: 1.1%
Mixpanel で Trial CVR を確認し、memory に winner or null を書いてください
```

### テストQueue（Aniccaのpaywall）

| Queue # | 変えるもの | Control | Variant |
|---------|-----------|---------|---------|
| 0 | 見出しコピー | "Start Your Free Week" | "Try Free for 7 Days" |
| 1 | CTAボタン文言 | "Start Free Trial" | "Begin My Journey" |
| 2 | 価格表示 | "$9.99/month" | "Less than $0.33/day" |
| 3 | trial期間強調 | "7-Day Free Trial" | "No Charge for 7 Days" |

---

## C3: `app-factory`（Anicca Skill）

### 概要

- 毎晩23:00 JSTに実行
- 苦しみを減らすアプリのコンセプトを探し → specを作り → Claude Codeにshipさせる

### フロー

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | トレンド検索（TikTok急上昇 + App Storeランキング） | Exa `web_search_exa` |
| 2 | フィルタリング（苦しみを減らすもののみ） | Anicca判断 |
| 3 | コンセプト×5を決定 | Anicca |
| 4 | 各コンセプト → spec.md生成 | Anicca write |
| 5 | spec保存 | `/Users/anicca/.openclaw/workspace/specs/YYYY-MM-DD/{app-name}.md` |
| 6 | exec → Claude `app-ship` × 5（順次実行） | exec |
| 7 | Day 1 TikTok → larry呼び出し | larry skill |

### アプリ選定基準

| OK（苦しみを減らす） | NG（苦しみを増やす） |
|--------------------|---------------------|
| 不安・ストレス軽減 | ルッキズム・外見への執着を増やすもの |
| 睡眠改善 | SNS依存を増やすもの |
| 先延ばし克服 | ギャンブル・課金依存 |
| マインドフルネス | 比較・競争を煽るもの |
| 人間関係改善 | 恐怖・怒りを利用したエンゲージメント設計 |

---

## S1: `app-ship`（Claude Code Skill）

### 概要

- `app-factory`（Anicca）からexec経由で呼ばれる
- spec.mdを読んでアプリを完全に自律ビルド・提出する

### INPUT

```
spec: spec.md のファイルパス
```

### フロー

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | spec.md読み込み（画面設計・通知・monetization） | Read |
| 2 | コード生成（SwiftUI） | ralph-autonomous-dev |
| 3 | アイコン生成（1024×1024） | DALL-E 3（`OPENAI_API_KEY`） |
| 4 | スクショ3枚生成（PIL + spec内容に合わせる） | PIL |
| 5 | メタデータ6言語生成（title, subtitle, description, keywords） | `asc localizations update` |
| 6 | 品質チェック | `greenlight preflight` → CRITICAL=0 |
| 7 | ビルド + App Store提出 | `fastlane full_release` |
| 8 | 完了報告 → Aniccaに返す | exec return |

---

## S2: `onboarding-ab-execute`（Claude Code Skill）— later scope

- オンボーディングフロー（画面順序・コピー）のA/B
- コード変更が必要なためTestFlight経由
- 今は実装しない

---

## データフロー全体図

| データソース | 何を測る | 使うSkill |
|------------|---------|----------|
| ASC API `/v2/appStoreVersionExperiments/{id}` | 実験state・開始日 | `screenshot-ab` |
| Mixpanel API | Trial CVR（paywall_viewed → trial_started） | `paywall-ab` |
| RC API | Offering一覧・Experiment状態 | `paywall-ab` |
| `xcrun simctl` | アプリ実画面PNG | `screenshot-ab` |
| PIL | スクショ合成（背景+フレーム+画面+テキスト） | `screenshot-ab`, `app-ship` |
| Pencil MCP | 全体デザイン刷新（Phase 2） | `screenshot-ab`（Queue 3以降） |
| Anicca memory | 実験記録（id・開始日・queue・before CVR） | 全Cron |

---

## 実験管理ルール

| ルール | 内容 | ソース |
|--------|------|--------|
| Track A（スクショ）とTrack B（paywall）は同時実行OK | 異なる指標に影響するため | Apple公式 |
| 1 Track内では1実験のみ | 同時に複数変えると因果が不明 | Apple公式 |
| 停止基準 | 90%信頼水準（現在手動）。ASC CLI更新後に自動化 | Apple公式 |
| 最短実行期間 | 7日（7日単位で判断） | Apple公式 |
| 最長実行期間 | 90日（Appleのハードリミット） | Apple公式 |
| 常に実験を回す | 実験終了後は即座に次を開始。空白期間なし | - |
| Phase 1 | PIL でテキスト・背景変更 | - |
| Phase 2 | PIL で改善しない場合のみ Pencil MCP で全体刷新 | - |

---

## スクショ設計原則（Best Practice）

ソース: AppRadar / 「Screenshots are the real decision point. Lead with clear benefit/result → social proof → core flow. No text overlay = instant swipe away.」

| スクショ | 役割 | 内容 |
|---------|------|------|
| 1枚目 | Attention（benefit/result） | ユーザーのペインを直撃するテキスト |
| 2枚目 | Interest + Desire（social proof） | 「○○人が変わった」等の証拠 |
| 3枚目 | Action（core flow） | アプリの実際の画面 |

---

## OSS化方針

- 全skillはapp_idをパラメータ化（どのアプリでも動く）
- spec.mdフォーマットを標準化（誰でも使えるテンプレ）
- README: "AIエージェントがApp Storeアプリを自律的にイテレーションするフレームワーク"
- 公開先: GitHub（別リポジトリ推奨）
