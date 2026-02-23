---
name: paywall-ab
description: "Anicca Paywall A/B テスト自動クローズドループ。RevenueCat Experiments を使い、Paywall コピーを継続改善する。新規実験セットアップ（Offering作成→Experiment作成→Cron登録）と週次自動評価ループ（統計判定→勝者昇格→新コピー生成→Slack報告）の両方を担う。Use when: paywall a/b test, paywall experiment, CVR改善, paywall コピー, RevenueCat experiment, paywall-ab, paywall loop."
user-invocable: true
---

# paywall-ab — Paywall A/B テスト自動クローズドループ

## 概要

RevenueCat Experiments を使った Paywall コピーの自動 A/B テストループ。
エージェントがこのスキルを読めば、セットアップから週次評価まで全て実行できる。

**2つのモード:**

| モード | トリガー | やること |
|--------|---------|---------|
| `setup` | 「paywall A/B テストを開始して」 | Offering作成 → Experiment作成 → Cron登録 → Slack通知 |
| `evaluate` | cron: 毎週月曜 9:00 JST / 「evaluate」 | 結果取得 → 統計判定 → 勝者昇格 or 継続 → 新実験 → Slack報告 |

---

## 環境変数（必須）

| Key | 値の場所 |
|-----|---------|
| `REVENUECAT_V2_SECRET_KEY` | Mac Mini `.env` / `REVENUECAT_V2_SECRET_KEY` |
| `REVENUECAT_PROJECT_ID` | `projbb7b9d1b`（固定） |
| `OPENAI_API_KEY` | Mac Mini `.env` / `OPENAI_API_KEY` |
| `SLACK_BOT_TOKEN` | Mac Mini `.env` / `SLACK_BOT_TOKEN` |
| `SLACK_METRICS_CHANNEL` | `C091G3PKHL2`（#metrics） |

---

## ⚠️ 必須前提：Paywall作成前にアプリコードで実機能を確認すること

**Paywall コピーに嘘を書くことは罪。存在しない機能を訴求してはいけない。**

### 確認必須ファイル（Paywall作成時に必ず読む）

| ファイル | 確認する内容 |
|---------|------------|
| `aniccaios/aniccaios/Services/FreePlanService.swift` | Free の制限（本数・時刻） |
| `aniccaios/aniccaios/Services/LLMNudgeService.swift` | Pro の AI 機能の実体 |
| `aniccaios/aniccaios/Services/NudgeStatsManager.swift` | フィードバック学習の実体 |
| `aniccaios/aniccaios/Models/SubscriptionInfo.swift` | Free/Pro の差分定義 |

### Anicca の実際の Free vs Pro 差分（コードから確認済み）

| 機能 | Free | Pro |
|------|------|-----|
| Nudgeタイプ | ルールベース（事前定義文章） | AI生成（LLMNudgeService） |
| 1日の本数 | **3本固定（8:00/12:30/20:00）** | サーバー制御・高クォータ |
| タイミング | 固定時刻3回 | プロアクティブ配信（その瞬間に必要な時） |
| パーソナライズ | 苦しみカテゴリでローテーション | その人の具体的な悩みに特化したAI生成 |
| フィードバック学習 | なし | 👍/👎で次のNudgeが改善される |

### 訴求禁止リスト（存在しない機能）

| 禁止コピー | 理由 |
|----------|------|
| "30-day insight reports" | コードに存在しない |
| "Progress growth graph" | コードに存在しない |
| "Nudge frequency & timing customization" | ユーザーが手動設定できる機能はない |
| "Get full access to all features" | 意味がない |
| "Early releases" / "Premium support" | アプリが提供していない |

### 訴求すべき本物の価値

| 訴求軸 | 具体的コピー例 |
|--------|-------------|
| AI生成 | "AI-written nudges, crafted for your exact struggle" |
| フィードバック学習 | "Gets smarter with every reaction you give" |
| プロアクティブ配信 | "Reaches you at the moment you need it most" |
| 仏教の智慧 | "Rooted in centuries of Buddhist wisdom" |
| パーソナライズ | "Knows your specific pain — not generic advice" |

---

## MODE 1: セットアップ（完全自動 — エージェントが全て実行）

**現行 default Offering:** `ofrng78a01eb506` (anicca) ← Variant A に使う
**月額 product ID:** `prod8eb90326e4` (ai.anicca.app.ios.monthly、7日トライアル付き)

### Step 1. 新 Offering 作成（MCP）

```
mcp__revenuecat__mcp_RC_create_offering:
  project_id: "projbb7b9d1b"
  lookup_key: "anicca_variant_{YYYYMMDD}"
  display_name: "Anicca Variant {date}"
```

### Step 2. パッケージ + Product 紐付け（MCP）

```
mcp__revenuecat__mcp_RC_create_package:
  project_id: "projbb7b9d1b"
  offering_id: "<Step1のoffering_id>"
  lookup_key: "$rc_monthly"
  display_name: "Monthly Plan"

mcp__revenuecat__mcp_RC_attach_products_to_package:
  project_id: "projbb7b9d1b"
  package_id: "<package_id>"
  products: [{ product_id: "prod8eb90326e4", eligibility_criteria: "all" }]
```

### Step 3. AI Paywall 自動生成（MCP）

```
mcp__revenuecat__mcp_RC_create_design_system_paywall_generation_job:
  project_id: "projbb7b9d1b"
  offering_id: "<Step1のoffering_id>"
  design_system: <Anicca デザインシステム JSON（"Paywall デザイン"セクション参照）>
→ 非同期。30秒後に GET /v2/projects/projbb7b9d1b/paywalls でoffering_id一致エントリ確認
```

### Step 4. Experiment 作成（Dais が RC Dashboard で実行 — API 非対応）

**RC API v2 に Experiment 作成エンドポイントは存在しない。Dashboard のみ。**

1. `https://app.revenuecat.com/projects/bb7b9d1b/experiments` → New Experiment
2. Variant A: `ofrng78a01eb506`（現行 default）
3. Variant B: Step 1 で作った Offering
4. Traffic split: 50/50 → Start
5. URL から `experiment_id` を控えてエージェントに渡す（例: `exp_xxxxxxxx`）

### Step 5. Cron 登録（エージェントが Mac Mini に SSH して実行）

```bash
# SSH: ssh anicca@100.99.82.95
# 既存 jobs.json を確認してから部分追加（ファイル全体上書き禁止）
cat /Users/anicca/.openclaw/cron/jobs.json
```

追加するエントリ（差分のみ）:
```json
{
  "name": "paywall-ab",
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1",
    "tz": "Asia/Tokyo"
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Run paywall-ab skill in evaluate mode. experiment_id: {experiment_id}"
  },
  "delivery": {
    "mode": "none"
  }
}
```

### Step 6. Slack #metrics に開始通知（エージェントが実行）

```
📊 Paywall A/B テスト開始

実験: Paywall A/B — {variant_name}
開始日: {today}

Variant A (現行): ofrng78a01eb506 (anicca)
Variant B (新AI生成): {new_offering_id}
Traffic split: 50/50

初回チェック: {next_monday} 9:00 JST
```

---

## MODE 2: 週次評価ループ（Cron / 「evaluate」）

### Step 1. RevenueCat から実験結果を取得

```bash
GET https://api.revenuecat.com/v2/projects/projbb7b9d1b/experiments/{experiment_id}
Authorization: Bearer $REVENUECAT_V2_SECRET_KEY
Content-Type: application/json
```

レスポンスから以下を抽出:
- `variant_a.users`, `variant_a.conversions`
- `variant_b.users`, `variant_b.conversions`

### Step 2. 統計判定ロジック

```typescript
function evaluate(variantA, variantB): Decision {
  const totalUsers = variantA.users + variantB.users;

  // 1. サンプル数チェック（最低 200）
  if (totalUsers < 200) {
    return { action: "continue", reason: "insufficient_sample" };
  }

  const cvrA = variantA.conversions / variantA.users;
  const cvrB = variantB.conversions / variantB.users;

  // 2. Chi-squared test で p-value 計算
  const pValue = chiSquaredTest(variantA, variantB);

  // 3. 有意差チェック（p < 0.05）
  if (pValue >= 0.05) {
    return { action: "continue", reason: "not_significant", pValue };
  }

  // 4. 勝者決定
  const winner = cvrB > cvrA ? "B" : "A";
  return { action: "promote_and_start_new", winner, cvrA, cvrB, pValue };
}
```

**Chi-squared テストの実装（Node.js でスクリプト実行）:**

```javascript
// /tmp/chi_test.js として作成して node で実行
function chiSquared(a, b) {
  const total = a.users + b.users;
  const totalConv = a.conversions + b.conversions;
  const expected_a = a.users * totalConv / total;
  const expected_b = b.users * totalConv / total;
  const chi2 = Math.pow(a.conversions - expected_a, 2) / expected_a
             + Math.pow(b.conversions - expected_b, 2) / expected_b;
  // p-value 近似（chi2 with df=1）
  return 1 - (1 - Math.exp(-chi2 / 2));
}
```

### Step 3a. 「継続」の場合 → Slack 報告して終了

**パターン A: サンプル不足**
```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {today} ({days}日間)
ステータス: 🟡 継続中

サンプル数:
  Variant A (現行): {a_users} users
  Variant B: {b_users} users
  合計: {total} / 最低200 必要

CVR (参考値):
  A: {a_cvr}%  B: {b_cvr}%

判定: サンプル不足のため継続
次回チェック: {next_monday}
```

**パターン B: 有意差なし**
```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {today} ({days}日間)
ステータス: 🟡 継続中

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users})

統計検定:
  p-value: {p_value} (有意水準 0.05)
  結果: ❌ 有意差なし

判定: 継続
次回チェック: {next_monday}
```

### Step 3b. 「勝者決定」の場合 → 昇格 + 新実験

**3b-1. 勝者 Offering を default に昇格**

```bash
# RevenueCat Dashboard で手動: 勝者 Offering → Set as Default
# API での昇格は v2 では未サポート（Dashboard 操作必須）
# → Slack で Dais に通知して実行依頼
```

**3b-2. 新コピーを LLM で生成（Candle 原則）**

```
プロンプト:
あなたは Paywall コピーライターです。

アプリ: Anicca（習慣化・行動変容、7日間無料トライアル → $9.99/月）

## Candle 原則（必須）
- ❌ 訴求しない: "Nudge", "reminder", "daily reminders", "notifications"
  → ユーザーはトライアルで体験済み
- ✅ 訴求する: 深さ・進捗・カスタマイズ
  → 30日インサイト / 成長グラフ / Nudge頻度調整

## 現在の結果
- 勝者 ({winner}): CVR {winner_cvr}%
- 敗者: CVR {loser_cvr}%

## タスク
次の Variant を作成。要件:
1. 勝者の良い要素を保持
2. 新しい「深さ/進捗/カスタマイズ」の切り口
3. フォーマット: タイトル(5語以内) + bullets×3(各20文字以内) + CTA固定

出力:
{
  "title": "...",
  "bullets": ["...", "...", "..."],
  "cta": "Try Free For 1 Week"
}

禁止ワード（含まれていたら再生成）: nudge, reminder, notification, alert, daily
```

**3b-2.5. Slack 承認ゲート（slack-approval スキル）**

→ `.claude/skills/slack-approval/SKILL.md` を読んで `requestApproval()` を実行する

```javascript
const result = await requestApproval({
  channel: 'C091G3PKHL2',
  title:   '📝 新 Paywall コピー確認',
  detail:  `タイトル: ${title}\nbullets:\n  • ${bullets[0]}\n  • ${bullets[1]}\n  • ${bullets[2]}\nCTA: ${cta}\n\nこの内容で新 Offering を作成しますか？`
});
```

| 返答 | アクション |
|------|-----------|
| `approved` | → 3b-3（新 Offering 作成）へ |
| `denied`   | → 3b-2（新コピー再生成）に戻る |

**3b-3. 新 Offering を RC MCP で作成**

```bash
mcp__revenuecat__mcp_RC_create_offering:
  project_id: "projbb7b9d1b"
  lookup_key: "anicca_variant_{timestamp}"
  display_name: "{new_title}"
```

**3b-4. 新 Experiment を開始（Dashboard 操作 → Dais）**

エージェントは API で作成、50/50 設定は Dashboard で Dais が行う。

**3b-5. Slack #metrics に勝者レポート投稿**

```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {today} ({days}日間)
ステータス: ✅ 完了

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users}) ⭐ 勝者

統計検定:
  p-value: {p_value} ✅ (< 0.05)
  信頼度: {confidence}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 アクション:
1. Variant {winner} を default に昇格 → Dais が RC Dashboard で実行
2. 新実験 {new_experiment_name} を開始予定

📝 新 Variant コピー:
タイトル: "{new_title}"
• {bullet_1}
• {bullet_2}
• {bullet_3}
CTA: "Try Free For 1 Week"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 次回チェック: {next_monday}
```

---

## Paywall デザイン → RevenueCat 投入フロー（AI自動生成）

**エージェントが完全自動実行。Dais の GUI 操作ゼロ。**

### なぜ Figma アプローチを廃止したか

| 廃止理由 | 詳細 |
|---------|------|
| `html-to-design` が Auto Layout を生成しない | CSS flexbox → フラット絶対座標。RC plugin がエラー |
| Figma REST API は read-only | Auto Layout を API 経由で追加不可 |
| → Dais の手動 GUI 操作が必要 | 完全自動化できないため廃止 |

### 採用フロー: `mcp_RC_create_design_system_paywall_generation_job`

```
Step 1. [エージェント] 新 Offering 作成
  mcp__revenuecat__mcp_RC_create_offering:
    project_id: "projbb7b9d1b"
    lookup_key: "anicca_variant_{timestamp}"
    display_name: "{new_title}"

Step 2. [エージェント] パッケージ + Product 紐付け
  mcp__revenuecat__mcp_RC_create_package:
    offering_id: "<offering_id>"
    lookup_key: "$rc_monthly"
    display_name: "Monthly Plan"

  mcp__revenuecat__mcp_RC_attach_products_to_package:
    package_id: "<package_id>"
    products: [{ product_id: "prod8eb90326e4", eligibility_criteria: "all" }]
    # prod8eb90326e4 = ai.anicca.app.ios.monthly（7日トライアル付き）

Step 3. [エージェント] AI 自動生成ジョブを投入
  mcp__revenuecat__mcp_RC_create_design_system_paywall_generation_job:
    project_id: "projbb7b9d1b"
    offering_id: "<offering_id>"
    design_system: <Anicca デザインシステム JSON（下記）>
  → HTTP 202: { id: "pwj...", status: "queued" }

Step 4. [エージェント] ジョブ完了確認（30秒〜2分ポーリング）
  curl GET /v2/projects/projbb7b9d1b/paywalls
  → offering_id が一致するエントリが出たら完了

Step 5. [Dais] RC Dashboard でプレビュー確認 → Experiment 作成
  URL: https://app.revenuecat.com/projects/projbb7b9d1b/paywalls/{paywall_id}
```

### Anicca デザインシステム JSON（確定版）

```json
{
  "app_context": { "app_name": "Anicca", "category": "Health & Fitness / Lifestyle" },
  "brand_identity": { "brand_mission": "Reduce suffering through Buddhist wisdom." },
  "visual_language": {
    "color_palette": {
      "primary_brand_color": "#C9B382",
      "secondary_brand_color": "#2C2A28",
      "accent_cta_color": "#C9B382",
      "background_colors": ["#F5F3ED", "#EDE9E0"],
      "palette_mood": "warm sand, zen rock garden"
    },
    "typography": {
      "headline_font_family": "SF Pro Display",
      "body_font_family": "SF Pro Text"
    },
    "illustration_and_imagery_style": {
      "primary_style": "zen minimalism — stacked river stones, ripple rings in sand"
    }
  },
  "tone_of_voice": {
    "primary_tone": "calm and wise",
    "secondary_tone": "warm and encouraging"
  },
  "content_strategy": {
    "premium_feature_highlights": [
      "AI-written nudges, crafted for your exact struggle — not generic advice",
      "Gets smarter every time you react — 👍/👎 shapes what you receive next",
      "Reaches you at the moment you need it most — proactive, not scheduled",
      "Rooted in centuries of Buddhist wisdom, personalized to your pain"
    ],
    "free_vs_pro_honest_difference": "Free: 3 rule-based nudges/day at fixed times. Pro: AI-generated nudges, adaptive learning, proactive delivery."
  },
  "ui_patterns": {
    "button_style": "full-width rounded pill, gold #C9B382, white text",
    "overall_layout_philosophy": "breathing room — generous padding, single focal point"
  }
}
```

### 実績

| バージョン | Offering ID | Paywall ID | 備考 |
|-----------|------------|-----------|------|
| v1 (2026-02-24) | `ofrng4c8d1f9d48` (`anicca_paywall_ai_v1`) | `pwd08b47e7c59f464d` | ❌ 嘘コピー含む（廃棄） |
| **v2 (2026-02-24)** | **`ofrng586631f021` (`anicca_paywall_ai_v2`)** | **`pw5d8ebd3e8a674b3e`** | **✅ 実機能のみ訴求（現行）** |

**v2 RC Dashboard:** `https://app.revenuecat.com/projects/projbb7b9d1b/paywalls/pw5d8ebd3e8a674b3e`

**Variant B（A/Bテスト用）:** `ofrng586631f021`（v1の`ofrng4c8d1f9d48`は廃棄）

---

## Candle 原則（コピー生成の絶対ルール）

### ❌ 使ってはいけないコピー（コアバリュー）

ユーザーはトライアルで体験済みのため刺さらない。

- "Personalized nudges for your pain"
- "Exact-time reminders at difficult times"
- "Daily reminders"
- "Get full access to all features"

### ✅ 使うべきコピー（深さ・進捗・カスタマイズ）

| カテゴリ | 例 |
|---------|-----|
| 深さ | 30日間の行動パターン分析、インサイトレポート |
| 進捗 | 成長グラフ、ストリーク、目標達成率 |
| カスタマイズ | Nudge 頻度調整、タイミング設定、テーマ |

---

## RevenueCat 接続情報

| 項目 | 値 |
|------|-----|
| Project ID | `projbb7b9d1b` |
| API Base | `https://api.revenuecat.com/v2` |
| MCP ツール | `mcp__revenuecat__mcp_RC_*` |

---

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| RC API 500 | Slack にエラー通知。リトライなし |
| LLM が禁止ワード含むコピー生成 | 禁止ワードチェック → 再生成（最大3回） |
| 統計ライブラリ利用不可 | `/tmp/chi_test.js` を node で実行 |
| 3週間以上有意差出ない | 別切り口の新実験を Slack で Dais に提案 |

---

## Changelog

- 2026-02-24: v1.0 初版作成
- 2026-02-24: v1.1 Figma approach 廃止 → RC AI自動生成 (`mcp_RC_create_design_system_paywall_generation_job`) に一本化。初回生成実績記録
- 2026-02-24: v1.2 「アプリコード確認必須」セクション追加。嘘コピー（30-day insights, progress graph等）を禁止リストに追加。content_strategy を実際の機能に修正
- 2026-02-24: v1.3 v1 paywall（嘘コピー）廃棄。v2 paywall (`pw5d8ebd3e8a674b3e`) を実機能のみで再生成。Variant B は `ofrng586631f021` に更新
