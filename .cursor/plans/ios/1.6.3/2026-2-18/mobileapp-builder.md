# Mobile App Factory — 仕様書

**作成日:** 2026-02-21
**ステータス:** 計画中（実装未開始）
**目的:** AIエージェントが自律的にアプリをビルド・提出・イテレーションし、人々の苦しみを減らしながら収益を最大化するパイプラインを構築する。

---

## ビジョン

- **Anicca（OpenClaw, VPS）** = プランナー。データを見て何をテストするか決める。cron持ち。
- **Claude Code** = ワーカー。Aniccaに呼ばれて実際に実行する。
- **トリガー方式:** Anicca → `exec` → `claude --print "skill-name: ..."` → Claude Codeが実行
- **全アプリが毎日イテレーション。** 人間は何もしなくてよい。

---

## 全Skill + Cron 一覧

| # | 名前 | 種別 | 担当 | 時刻 | 目的 |
|---|------|------|------|------|------|
| C1 | `ab-monitor` | Cron + Skill | **Anicca** | 毎朝 06:00 JST | Screenshot/Paywall実験を独立してチェック・判断 |
| C2 | `app-factory` | Cron + Skill | **Anicca** | 毎晩 23:00 JST | トレンド検索 → spec生成 → Claude app-shipをトリガー |
| C3 | `larry` | Cron + Skill | **Anicca**（既存） | 毎日 19:00 JST | TikTok投稿（詳細は既存skill参照） |
| S1 | `screenshot-ab-execute` | Skill | **Claude Code** | on-demand（C1から呼ばれる） | Figma MCPでバリアント生成 → PPO 50/50実験 |
| S2 | `paywall-ab-execute` | Skill | **Claude Code** | on-demand（C1から呼ばれる） | RC MCPで新Offering → RC Experiment |
| S3 | `onboarding-ab-execute` | Skill | **Claude Code** | on-demand（C1から呼ばれる） | feature flag → TestFlight（**later scope**） |
| S4 | `app-ship` | Skill | **Claude Code** | on-demand（C2から呼ばれる） | コード生成 → greenlight → fastlane submit |

---

## 接続図

```
06:00 JST  Anicca [ab-monitor]
               ├─ Track A: Screenshot ──→ Claude [screenshot-ab-execute] → asc PPO
               └─ Track B: Paywall    ──→ Claude [paywall-ab-execute]    → RC Experiment

19:00 JST  Anicca [larry] → TikTok投稿（既存）

23:00 JST  Anicca [app-factory]
               ├─ トレンド検索 → spec生成
               ├─ exec → Claude [app-ship] × N アプリ（順次）
               └─ larry呼び出し（Day 1 TikTok）
```

---

## C1: `ab-monitor`（Anicca Skill）

### 概要

- 毎朝06:00 JSTに全アプリに対して実行
- Screenshot実験（Track A）とPaywall実験（Track B）を**同時・独立**にチェック
- 2つは別の指標（Install CVR / Trial CVR）に影響するため同時実行OK
- 必要に応じてClaude Codeの各Skillをexec経由で呼び出す

### Track A: Screenshot（Install CVR管理）

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 全アプリリスト取得 | `asc apps list` |
| 2 | Install CVR取得（直近7日 vs 実験開始前7日） | `asc analytics` |
| 3 | 現在のPPO実験状態確認 | `asc product-pages experiments list --v2 --app {id}` |
| 4 | 判断ロジック実行（下記） | - |
| 5 | 必要ならexec Claude | `exec: claude --print "screenshot-ab-execute: ..."` |

**判断ロジック（Track A）:**

```
実験なし
  → exec Claude: screenshot-ab-execute action=start

実験中 かつ 経過日数 < 14日
  → skip（データ不足、何もしない）

実験中 かつ 経過日数 ≥ 14日 かつ Install CVR lift > 10%
  → 勝者確定
  → exec Claude: screenshot-ab-execute action=apply_winner

実験中 かつ 経過日数 ≥ 21日 かつ lift ≤ 10%
  → null result（このバリアントは効果なし）
  → exec Claude: screenshot-ab-execute action=null_next
```

**CVR計測方法（Treatment別CVRはASC APIで未対応のため）:**
- 実験開始前7日間のInstall CVR平均を `before_cvr` として記録（Serena memory）
- 実験中7日間のInstall CVR平均を `during_cvr` として取得
- lift = (during_cvr - before_cvr) / before_cvr
- 50/50トラフィックのため、全体CVRの変化 = variantの効果と見なす

### Track B: Paywall（Trial CVR管理）

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | Trial CVR取得 | Mixpanel MCP: `onboarding_paywall_viewed → rc_trial_started_event` |
| 2 | RC Experiment状態確認 | RC MCP: `mcp_RC_list_offerings` |
| 3 | 判断ロジック実行（下記） | - |
| 4 | 必要ならexec Claude | `exec: claude --print "paywall-ab-execute: ..."` |

**判断ロジック（Track B）:**

```
実験なし
  → exec Claude: paywall-ab-execute action=start

実験中 かつ 経過日数 < 14日
  → skip

実験中 かつ 経過日数 ≥ 14日 かつ Trial CVR lift > 10%
  → 勝者確定
  → exec Claude: paywall-ab-execute action=apply_winner

実験中 かつ 経過日数 ≥ 21日 かつ lift ≤ 10%
  → null result
  → exec Claude: paywall-ab-execute action=null_next
```

### Slack報告

- 勝者確定時のみ詳細報告（`#metrics`チャンネル）
- 毎日必ず1行サマリを出す（例: 「スクショ実験14日目 CVR +6%、継続中」）

---

## S1: `screenshot-ab-execute`（Claude Code Skill）

### 概要

- `ab-monitor` Track Aから呼ばれる
- スクショ1枚目（最もInstall CVRへの影響が大きい）のヘッドラインTEXTをまず変えることから始める
- **1変数のみ変える**（同時に複数変えると何が効いたか分からない）
- Figma MCPを使ってデザインクオリティを担保する

### INPUT

```
action: start | apply_winner | null_next
app_id: ASC App ID (例: 6755129214)
queue_position: 現在のQueue番号（Serena memoryから読む）
```

### action=start の流れ

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | テストキュー読み込み（何番目の変数か） | Serena memory |
| 2 | Figmaのスクショテンプレートを取得 | Figma MCP `get_design_context` |
| 3 | headline textを次のバリアントに差し替え | Figma MCP `set_variables` |
| 4 | PNG export（1290×2796、APP_IPHONE_67サイズ） | Figma MCP `get_screenshot` |
| 5 | PPO実験作成（50/50） | `asc product-pages experiments create --v2 --traffic-proportion 50` |
| 6 | treatment作成 | `asc product-pages experiments treatments create` |
| 7 | スクショをtreatmentにアップロード | `asc screenshots upload` |
| 8 | 開始記録（日付・バリアント内容・before CVR） | Serena memory |
| 9 | 結果テキストをAniccaに返す | return |

### action=apply_winner の流れ

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 実験停止 | `asc product-pages experiments update --state STOPPED` |
| 2 | 勝者スクショをデフォルトlocalizationに適用 | `asc screenshots upload` → default localization |
| 3 | queue_positionを+1してSerena memoryに保存 | Serena memory |
| 4 | action=startで次のQueueアイテムへ | 再帰 |

### action=null_next の流れ

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 実験停止 | `asc product-pages experiments update --state STOPPED` |
| 2 | このバリアントをnull記録 | Serena memory |
| 3 | 次のバリアントアイデアでaction=start | 再帰 |

### テストQueue（Anicca、スクショ1のみ）

| Queue # | 変えるもの | Control | Variant |
|---------|-----------|---------|---------|
| 1 | スクショ1 headline text | "Gentle Words For Your Hardest Moments" | "For People Who Keep Failing Habits" |
| 2 | スクショ1 headline text | 前Queueの勝者 | "Still Stuck In The Same Loop?" |
| 3 | スクショ1 headline text | 前Queueの勝者 | "10 Apps Failed. This One Is Different." |
| 4 | スクショ1 全体デザイン | 前Queueの勝者 | 大胆な新レイアウト（Figmaで新規作成） |
| 5 | スクショ2 headline text | 現在のスクショ2 | 同様に繰り返し |

### Figma MCP活用方針

- Figmaにスクショテンプレートを用意する（デバイスフレーム + 背景 + テキストをVariablesで管理）
- `set_variables` でheadline textだけ差し替え → `get_screenshot` でPNG export
- 将来的にはアイコン変更、背景色変更もFigma MCP経由で対応
- **前提:** ダイスがFigmaにAniccaのスクショテンプレートを用意する必要がある

---

## S2: `paywall-ab-execute`（Claude Code Skill）

### 概要

- `ab-monitor` Track Bから呼ばれる
- RevenueCat MCPを使ってOffering（paywallの内容）を差し替える
- 1変数のみ変える（コピー → CTA → 価格表示の順）

### INPUT

```
action: start | apply_winner | null_next
app_id: ASC App ID
queue_position: Serena memoryから
```

### action=start の流れ

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 現在のoffering確認 | RC MCP `mcp_RC_list_offerings` |
| 2 | 新offering作成（バリアント用） | RC MCP `mcp_RC_create_offering` |
| 3 | パッケージ作成 | RC MCP `mcp_RC_create_package` |
| 4 | 既存商品を紐付け | RC MCP `mcp_RC_attach_products_to_package` |
| 5 | RC Experiment開始 | RC API（MCP or HTTP直接） |
| 6 | 開始記録（日付・バリアント内容・before Trial CVR） | Serena memory |

### action=apply_winner の流れ

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | 勝者offeringをdefault/currentに設定 | RC MCP `mcp_RC_update_offering` |
| 2 | 実験停止 | RC API |
| 3 | queue_position +1 → action=startで次へ | Serena memory + 再帰 |

### テストQueue（Aniccaのpaywall）

| Queue # | 変えるもの | Control | Variant |
|---------|-----------|---------|---------|
| 1 | 見出しコピー | "Start Your Free Week" | "Try Free for 7 Days" |
| 2 | CTAボタン文言 | "Start Free Trial" | "Begin My Journey" |
| 3 | 価格表示 | "$9.99/month" | "Less than $0.33/day" |
| 4 | trial期間強調 | "7-Day Free Trial" | "No Charge for 7 Days" |

---

## S3: `onboarding-ab-execute`（Claude Code Skill）— later scope

### 概要

- オンボーディングフロー（画面順序・コピー）のA/B
- コード変更が必要なためTestFlight経由
- **今日は実装しない。specのみ記載。**

### INPUT

```
action: start | apply_winner | null_next
variant_spec: 何を変えるか（画面順序 or コピー内容）
```

### action=start の流れ（将来）

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | feature flag追加（variant A/B分岐） | Serena + Edit |
| 2 | バリアントフロー実装 | Claude Code |
| 3 | FastLane TestFlight配布 | `fastlane build_for_device` |
| 4 | Mixpanel計測開始 | Mixpanel MCP |

### 計測指標

- Mixpanel: `onboarding_started → rc_trial_started_event`
- 勝者判定: lift > 10% かつ n > 200 users/variant かつ ≥7日

---

## C2: `app-factory`（Anicca Skill）

### 概要

- 毎晩23:00 JSTに実行
- `trend-hunter` + `app-spec-generator` を統合したskill
- 苦しみを減らすアプリのコンセプトを探し → specを作り → Claude Codeにshipさせる

### フロー

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | トレンド検索（TikTok急上昇 + App Storeランキング） | Exa `web_search_exa` |
| 2 | フィルタリング（苦しみを減らすもののみ。obsession・外見執着・依存を増やすものは除外） | Anicca判断 |
| 3 | コンセプト×5を決定 | Anicca |
| 4 | 各コンセプト → spec.md生成 | Anicca write |
| 5 | spec保存 | `/home/anicca/specs/YYYY-MM-DD/{app-name}.md` |
| 6 | exec → Claude `app-ship` × 5（順次実行、並列だとファイル競合） | exec |
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

## S4: `app-ship`（Claude Code Skill）

### 概要

- `app-factory`（Anicca）からexec経由で呼ばれる
- spec.mdを読んでアプリを完全に自律ビルド・提出する
- この提出プロセス自体はspecの外（汎用的な全アプリ共通処理）

### INPUT

```
spec: spec.md のファイルパス
```

### フロー

| ステップ | 内容 | ツール |
|---------|------|--------|
| 1 | spec.md読み込み（画面設計・通知・monetization） | Read |
| 2 | コード生成（SwiftUI / React Native） | ralph-autonomous-dev |
| 3 | アイコン生成（1024×1024） | Figma MCP `generate_figma_design` |
| 4 | スクショ3枚生成（Figmaテンプレ → アプリ内容に合わせる） | Figma MCP |
| 5 | メタデータ6言語生成（title, subtitle, description, keywords） | Claude + `asc localizations update` |
| 6 | 品質チェック | `greenlight preflight` → CRITICAL=0 |
| 7 | ビルド + App Store提出 | `fastlane full_release` |
| 8 | 完了報告 → Aniccaに返す | exec return |

### spec.mdの必須セクション

```markdown
# {App Name} — Spec

## コンセプト
問題: ...
ターゲット: ...
フック（TikTokで使うone-liner）: ...

## 画面設計
- 画面1（オンボーディング）: ...
- 画面2: ...
- メイン画面: ...

## 通知設計
- トリガー: ...
- メッセージ例: ...

## Monetization
- 価格: $X.XX/月
- Trial: X日間
- Offering key: ...

## ASO
- タイトル（30文字以内）: ...
- サブタイトル（30文字以内）: ...
- キーワード（100文字以内）: ...
- スクショ1 headline: ...
- スクショ2 headline: ...
- スクショ3 headline: ...
```

---

## C3: `larry`（Anicca Skill、既存）

- 毎日19:00 JSTにTikTok投稿
- 詳細は既存skill定義を参照（VPS上の `/usr/lib/node_modules/openclaw/skills/larry/` 以下）
- `app-factory`からも呼ばれる（新アプリのDay 1動画）

---

## データフロー全体図

| データソース | 何を測る | 使うSkill |
|------------|---------|----------|
| `asc analytics` | Install CVR（impressions → downloads） | `ab-monitor` Track A, `screenshot-ab-execute` |
| RC MCP | Offering一覧 + Trial CVR | `ab-monitor` Track B, `paywall-ab-execute` |
| Mixpanel MCP | `onboarding_paywall_viewed → rc_trial_started_event` | `ab-monitor` Track B |
| Mixpanel MCP | `onboarding_started → rc_trial_started_event` | `ab-monitor`（将来 Track C） |
| Figma MCP | スクショ・アイコンデザイン生成 | `screenshot-ab-execute`, `app-ship` |
| `asc product-pages experiments` | PPO実験作成・管理 | `screenshot-ab-execute` |
| Serena memory | テストキュー・実験記録・before CVR | 全Skill |

---

## 実験管理ルール

| ルール | 内容 |
|--------|------|
| Track A（スクショ）とTrack B（paywall）は同時実行OK | 異なる指標に影響するため |
| 1 Track内では1実験のみ | 同時に複数変えると因果が不明 |
| 勝者判定しきい値 | lift > 10% かつ ≥14日経過 |
| null判定しきい値 | ≥21日経過 かつ lift ≤ 10% |
| 記録 | 全実験をSerena memoryに記録（開始日・バリアント・before/after CVR） |
| 報告 | 勝者確定時のみSlack詳細報告。毎日1行サマリは必ず出す |

---

## 今日のスコープ

| # | タスク | 担当 | 今日? |
|---|--------|------|-------|
| 1 | `ab-monitor` skill作成（Anicca VPS） | 俺 + Anicca | ✅ |
| 2 | `screenshot-ab-execute` skill作成（Claude Code） | 俺 | ✅ |
| 3 | `paywall-ab-execute` skill作成（Claude Code） | 俺 | ✅ |
| 4 | Figmaにスクショテンプレート用意 | **ダイスが必要** | ✅ |
| 5 | トレンド調査 → 5アプリコンセプト決定 | 俺 | ✅ |
| 6 | `app-ship` skill作成 | 俺 | ✅ |
| 7 | 5アプリ並列ビルド + 提出 | 俺 | ✅ |
| 8 | larry TikTok × 5 | Anicca | ✅ |
| 9 | `onboarding-ab-execute` | - | ❌ later |

---

## OSS化方針

- 全skillはapp_idをパラメータ化（どのアプリでも動く）
- spec.mdフォーマットを標準化（誰でも使えるテンプレ）
- README: "AIエージェントがApp Storeアプリを自律的にイテレーションするフレームワーク"
- 公開先: GitHub（別リポジトリ推奨）
