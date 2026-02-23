# Mobile App Factory — 仕様書

**作成日:** 2026-02-21
**更新日:** 2026-02-23
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
06:00 JST  Anicca [screenshot-ab] → 自己完結（asc analytics download + Reve + ASC API）
06:01 JST  Anicca [paywall-ab]    → 自己完結（Mixpanel segmentation + RC API）

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
- スクショ生成: **Phase 1 = asc-shots-pipeline + Reve**（ベーススクショにヘッドラインを差し替え）、**Phase 2 = Pencil MCP**（Phase 1で改善しない場合、全体デザイン刷新）
- CVR計測: `asc analytics download` で Impression / Tap を毎日自動取得。手動判断不要。
- 停止基準: Treatment CVR が Control CVR より20%以上高い状態が7日継続 → 自動 winner 判定

### スキル構成

| スキル | 役割 | 参照 |
|--------|------|------|
| `asc-shots-pipeline` | simctl スクショ + Koubou フレーム追加 + アップロード | ローカルに既にある |
| `ai-image-generation` (Reve) | ベーススクショにヘッドラインを合成 | ローカルに既にある |
| `asc analytics download` | Impression / Tap のCSV自動取得 | 実稼働確認済み（2026-02-22） |
| Pencil MCP | Phase 2: 全体デザイン刷新 | MCP内蔵 |

### CVR計算式（確定）

```
install CVR = Tap / Impression × 100

ベースライン（実験開始前 / 2026-02-22 全体）:
  Impression: 5,760
  Page view:  5,361
  Tap:          119
  before_CVR: 119 / 5760 = 2.1%

PPO実験中（Control vs Treatment の分割）:
  → asc analytics download では取れない（Overall のみ）
  → asc product-pages experiments treatments list --experiment-id "..." で取得する
  → experiments list でExperiment ID を確認してから取得

判定ロジック:
  Treatment CVR / Control CVR > 1.2（20%以上向上） かつ 7日以上継続 → 自動 winner
```

### スクショ生成方式（確定: PIL）

```
Reve（text-to-image）→ 実アプリUIを捏造する → Apple審査NG → 使わない
PIL → 実simctlスクショのヘッドライン部分だけ書き換える → 実画面保持 → 正解

フロー:
  xcrun simctl io booted screenshot raw.png
  → asc screenshots frame（Koubou: デバイスフレーム追加）
  → PIL: ヘッドラインエリアを背景色で塗り潰し → 新ヘッドラインを描画
  → asc screenshots upload
```

### ヘッドライン生成方式（改善案）

```
現状: Queue テーブルにハードコード（ダイスが手書き）
改善: Anicca が Claude で毎回生成
  入力: before_CVR / 前回負けたヘッドライン / ペルソナ定義 / AppRadar BP
  出力: 新しいヘッドライン3本
```

### memory 構造（Anicca memory）

```json
{
  "experiment_id": "ppo_abc123",
  "start_date": "2026-02-21",
  "queue_position": 0,
  "phase": "Reve",
  "control_label": "現在のデフォルトスクショ3枚",
  "treatment_label": "Queue 0: ペイン直撃ヘッドライン",
  "before_cvr": 2.1,
  "analytics_request_id": "04c74879-547f-4e35-b231-1fafd485801d"
}
```

### フロー

```
06:00 起動
 │
 ├─ Anicca memory 読む
 │    └─ experiment_id / start_date / queue_position / phase / analytics_request_id
 │
 ├─ asc analytics download → 最新のImression/Tap CSVを取得
 │    Control CVR  = Tap(control) / Impression(control) × 100
 │    Treatment CVR = Tap(treatment) / Impression(treatment) × 100
 │
 ├─ ASC API で実験状態確認
 │    GET /v2/appStoreVersionExperiments/{id}
 │    └─ state: RUNNING / STOPPED / なし
 │
 ├─ 経過日数計算（today - start_date）
 │
 ├─ 判断
 │    experiment_id なし                           → START
 │    7日未満                                      → skip
 │    Treatment CVR > Control CVR × 1.2 かつ 7日+ → 自動 WINNER
 │    Treatment CVR <= Control CVR かつ 14日+      → 自動 NULL
 │    90日経過（Apple上限）                         → 自動 NULL → 次へ
 │
 ├─ [WINNER]
 │    勝者をASCのdefaultスクショに適用 → PPO実験停止
 │    → queue_position +1 → START
 │
 ├─ [NULL]
 │    PPO実験停止 → queue_position +1 → START
 │
 ├─ [START]
 │    Phase Reve: ベーススクショ3枚 + ヘッドライン差し替え（ai-image-generation）
 │    Phase Pencil: 全体デザイン刷新（Pencil MCP）
 │    → asc screenshots upload → PPO実験作成（50/50）→ memory更新
 │
 └─ Slack サマリ投稿（CVR数字付き）
```

### Slack 日次レポート（output）

```
[screenshot-ab] Day 14 🔬
Queue 0 / Phase Reve: "6 Years. 10 Apps. Still Nothing Changed."
実験ID: ppo_abc123 | 開始: 2026-02-21
Control CVR: 1.2% | Treatment CVR: 1.8% | +50% ↑
→ まだ7日。継続中。
```

### Phase 1: Reve でスクショ3枚を生成する流れ

ソース: AppRadar / 「Screenshots are the real decision point (users scan in <5s). Lead with clear benefit/result → social proof → core flow.」

**考え方: ベーススクショ（Apple審査通過済みの実画面）の上にヘッドラインを差し替えるだけ。アプリの実画面はApple要件上必須。**

```
1. xcrun simctl io booted screenshot raw_screen.png
   └─ シミュレータからアプリの実画面を取得

2. asc screenshots frame --input raw_screen.png --device iphone-air
   └─ Koubouがデバイスフレームを追加（1290×2796）

3. infsh app run falai/reve --input '{
     "prompt": "App Store screenshot, dark gradient background,
                bold white headline at top: [HEADLINE_TEXT],
                iPhone device frame with app UI screenshot centered,
                1290x2796, marketing style, no additional text"
   }'
   └─ Reve がヘッドラインを画像に合成

4. スクショ1・2・3を同様に生成（ヘッドラインだけ変える）

5. asc screenshots upload → PPO実験作成（50/50）

6. Anicca memory 更新（experiment_id / start_date / before_cvr）
```

### Phase 2: Pencil MCP でスクショ3枚を生成する流れ（Phase 1で改善しない場合）

```
1. Pencil MCP open_document("new")
2. Pencil MCP get_guidelines("mobile")
3. Pencil MCP batch_design → スクショ1・2・3のレイアウトをゼロからデザイン
4. Pencil MCP get_screenshot → PNG export（1290×2796）× 3枚
5. asc screenshots upload → PPO実験作成（50/50）
6. Anicca memory 更新（phase: "Pencil"）
```

### テストQueue

ソース: AppRadar / 「Lead with clear benefit/result → social proof → core flow」（AIDA フレームワーク）

| Queue # | Phase | 変えるもの | スクショ1（benefit） | スクショ2（social proof） | スクショ3（core flow） |
|---------|-------|-----------|---------------------|------------------------|----------------------|
| 0 | Reve | ヘッドラインのみ | "6 Years. 10 Apps. Still Nothing Changed." | "3,000+ People Finally Broke The Loop" | アプリのメイン画面 |
| 1 | Reve | ヘッドラインのみ | "Why Do You Keep Failing The Same Habit?" | "Your Brain Isn't Broken. Your App Is." | アプリのメイン画面 |
| 2 | Reve | ヘッドライン + 背景色 | "What If Day 1 Didn't Feel Like Day 1 Again?" | "AI That Texts You Before You Give Up" | アプリのメイン画面 |
| 3 | Pencil MCP | 全体デザイン刷新 | 新レイアウト・新配色 | 新レイアウト | 新レイアウト |

---

## C2: `paywall-ab`（Anicca Cron + Skill、自己完結）

### 概要

- 毎朝06:01 JSTに自動起動
- 実験は常に走っている（空白期間なし）
- RevenueCat Experiment で Offering を差し替える
- CVR計測: Mixpanel で `onboarding_paywall_viewed` → `rc_trial_started_event` を RC実験プロパティでセグメント分け → Trial CVR 自動計算。手動判断不要。
- 停止基準: Treatment Trial CVR が Control Trial CVR より20%以上高い状態が7日継続 → 自動 winner 判定

### スキル構成

| スキル | 役割 | 参照 |
|--------|------|------|
| `paywall-upgrade-cro` | Paywall CRO ベストプラクティス知識 | skill.sh（7,700 installs） |
| `mcp__revenuecat__*` | Offering作成・Experiment管理 | MCP内蔵 |
| Mixpanel MCP | Trial CVR per variant 取得 | MCP内蔵 |

### CVR計算式（確定）

```
Trial CVR = rc_trial_started_event / onboarding_paywall_viewed × 100
（Mixpanel セグメントキー: RC Experiment property → "control" / "treatment"）

実測値（Anicca 2026-02-22）:
  onboarding_paywall_viewed: 92
  rc_trial_started_event:      1
  Trial CVR: 1 / 92 = 1.1%

A/Bテストの判定:
  Treatment Trial CVR / Control Trial CVR > 1.2（20%以上向上） かつ 7日以上継続 → winner
  Treatment Trial CVR <= Control Trial CVR かつ 14日+               → null
```

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
 ├─ Mixpanel API で Trial CVR per variant 取得（直近7日）
 │    セグメントキー: RC Experiment property
 │    Control Trial CVR  = rc_trial_started_event(control) / paywall_viewed(control) × 100
 │    Treatment Trial CVR = rc_trial_started_event(treatment) / paywall_viewed(treatment) × 100
 │
 ├─ RC API で実験状態確認
 │
 ├─ 経過日数計算（today - start_date）
 │
 ├─ 判断
 │    experiment_id なし                                    → START
 │    7日未満                                               → skip
 │    Treatment CVR > Control CVR × 1.2 かつ 7日+          → 自動 WINNER
 │    Treatment CVR <= Control CVR かつ 14日+               → 自動 NULL
 │    90日経過（Apple上限）                                  → 自動 NULL → 次へ
 │
 ├─ [WINNER]
 │    勝者OfferingをRC defaultに設定 → 実験停止 → queue +1 → START
 │
 ├─ [NULL]
 │    実験停止 → queue +1 → START
 │
 ├─ [START]
 │    RC API で新Offering作成 → パッケージ作成 → 既存商品紐付け
 │    RC Experiment開始（50/50）→ memory更新
 │
 └─ Slack サマリ投稿（CVR数字付き）
```

### Slack 日次レポート（output）

```
[paywall-ab] Day 14 🔬
Queue 0: "Try Free for 7 Days" vs "Start Your Free Week"
実験ID: rc_exp_abc123 | 開始: 2026-02-21
Control Trial CVR: 1.0% | Treatment Trial CVR: 1.5% | +50% ↑
→ まだ7日。継続中。
```

### テストQueue（Aniccaのpaywall）

ソース: paywall-upgrade-cro（skill.sh 7,700 installs）/ CRO原則「見出しコピーのテストが最も高インパクト。次にCTA文言、価格フレーミング。」

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
| 3 | アイコン生成（1024×1024） | `ai-image-generation`（FLUX Dev LoRA） |
| 4 | スクショ3枚生成（simctl → Koubou フレーム → Reve ヘッドライン合成） | `asc-shots-pipeline` + `ai-image-generation`（Reve） |
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
| `asc analytics download` | install CVR（Impression / Tap）per variant | `screenshot-ab` |
| ASC API `/v2/appStoreVersionExperiments/{id}` | 実験state・開始日 | `screenshot-ab` |
| Mixpanel API（RC実験プロパティでセグメント） | Trial CVR（paywall_viewed → trial_started）per variant | `paywall-ab` |
| RC API | Offering一覧・Experiment状態 | `paywall-ab` |
| `xcrun simctl` | アプリ実画面PNG（審査通過済み実画面） | `screenshot-ab`, `app-ship` |
| `asc-shots-pipeline`（Koubou） | デバイスフレーム追加（1290×2796） | `screenshot-ab`, `app-ship` |
| `ai-image-generation`（Reve） | ヘッドライン合成（テキストレンダリング特化） | `screenshot-ab`（Phase 1）, `app-ship` |
| `ai-image-generation`（FLUX Dev LoRA） | アイコン生成（1024×1024） | `app-ship` |
| Pencil MCP | 全体デザイン刷新（Phase 2） | `screenshot-ab`（Queue 3以降） |
| Anicca memory | 実験記録（id・開始日・queue・before CVR・analytics_request_id） | 全Cron |

---

## 実験管理ルール

| ルール | 内容 | ソース |
|--------|------|--------|
| Track A（スクショ）とTrack B（paywall）は同時実行OK | 異なる指標に影響するため | Apple公式 |
| 1 Track内では1実験のみ | 同時に複数変えると因果が不明 | Apple公式 |
| 停止基準（スクショ） | Treatment install CVR > Control × 1.2 かつ 7日+ → 自動winner。asc analytics downloadで自動取得 | 実装済み |
| 停止基準（paywall） | Treatment Trial CVR > Control × 1.2 かつ 7日+ → 自動winner。Mixpanel segmentで自動取得 | 実装済み |
| 最短実行期間 | 7日（7日単位で判断） | Apple公式 |
| 最長実行期間 | 90日（Appleのハードリミット） | Apple公式 |
| 常に実験を回す | 実験終了後は即座に次を開始。空白期間なし | - |
| Phase 1 | asc-shots-pipeline（Koubou）+ Reve でヘッドライン差し替え。実画面必須（Apple審査要件） | - |
| Phase 2 | Phase 1で改善しない場合のみ Pencil MCP で全体デザイン刷新 | - |

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
