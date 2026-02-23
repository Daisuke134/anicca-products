---
name: paywall-ab
description: "Anicca Paywall A/B テスト自動クローズドループ。RevenueCat Experiments を使い、Paywall コピーを継続改善する。新規実験セットアップ（Offering作成→Experiment作成→Cron登録）と週次自動評価ループ（統計判定→勝者昇格→新コピー生成→Slack報告）の両方を担う。Use when: paywall a/b test, paywall experiment, CVR改善, paywall コピー, RevenueCat experiment, paywall-ab, paywall loop."
user-invocable: true
---

# paywall-ab — Paywall A/B テスト自動クローズドループ

## 概要

RevenueCat Experiments を使った Paywall コピーの自動 A/B テストループ。
エージェントがこのスキルを読めば、セットアップから週次評価まで全て実行できる。

| モード | トリガー | やること |
|--------|---------|---------|
| `setup` | 「paywall A/B テストを開始して」 | Offering作成 → AI Paywall生成 → Daisにexperiment作成依頼 → experiment_id受取 → Cron登録 → Slack通知 |
| `evaluate` | cron: 毎週月曜 9:00 JST / 「evaluate」 | 結果取得 → 統計判定 → 勝者昇格 or 継続 → 新実験 → Slack報告 |

---

## 現在稼働中の実験（2026-02-24〜）

| 項目 | 値 |
|------|-----|
| experiment_id | `prexpbac56abf66` |
| Variant A (現行 default) | `ofrng78a01eb506` (anicca) |
| Variant B (AI生成 v2) | `ofrng586631f021` (anicca_paywall_ai_v2) |
| Paywall v2 | `pw5d8ebd3e8a674b3e` |
| cron | 毎週月曜 9:00 JST — Mac Mini 登録済み (`enabled: true`) |
| RC Dashboard | `https://app.revenuecat.com/projects/bb7b9d1b/experiments/prexpbac56abf66` |

---

## 環境変数（必須）

| Key | 値の場所 |
|-----|---------|
| `REVENUECAT_V2_SECRET_KEY` | Mac Mini `.env` |
| `REVENUECAT_PROJECT_ID` | `projbb7b9d1b`（固定） |
| `OPENAI_API_KEY` | Mac Mini `.env` |
| `SLACK_BOT_TOKEN` | Mac Mini `.env` |
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
| "Streaks / goal completion rate" | 実装されていない |
| "Get full access to all features" | 意味がない |
| "Early releases" / "Premium support" | アプリが提供していない |

### 訴求すべき本物の価値（実機能のみ）

| 訴求軸 | 具体的コピー例 |
|--------|-------------|
| AI生成の深さ | "AI-written nudges, crafted for your exact struggle" |
| フィードバック学習 | "Gets smarter with every reaction you give" |
| プロアクティブ配信 | "Reaches you at the moment you need it most" |
| 仏教の智慧 | "Rooted in centuries of Buddhist wisdom" |
| パーソナライズ | "Knows your specific pain — not generic advice" |

---

## MODE 1: セットアップ（新規実験を作る時）

**現行 default Offering:** `ofrng78a01eb506` (anicca) ← Variant A に使う
**月額 product ID:** `prod8eb90326e4` (ai.anicca.app.ios.monthly、7日トライアル付き)

### Step 1. 新 Offering 作成（エージェントが MCP 実行）

```
mcp__revenuecat__mcp_RC_create_offering:
  project_id: "projbb7b9d1b"
  lookup_key: "anicca_variant_{YYYYMMDD}"
  display_name: "Anicca Variant {date}"
```

### Step 2. パッケージ + Product 紐付け（エージェントが MCP 実行）

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

### Step 3. AI Paywall 自動生成（エージェントが MCP 実行）

```
mcp__revenuecat__mcp_RC_create_design_system_paywall_generation_job:
  project_id: "projbb7b9d1b"
  offering_id: "<Step1のoffering_id>"
  design_system: <Anicca デザインシステム JSON（下記参照）>
→ HTTP 202: { id: "pwj...", status: "queued" }
```

**⚠️ 409エラーが出た場合 → そのOfferingに既にpaywallが存在する。新しいOfferingを作成すること。**

60秒待機後に確認:
```bash
GET https://api.revenuecat.com/v2/projects/projbb7b9d1b/paywalls
→ offering_id が一致するエントリが出たら完了。paywall_id を記録する。
```

### Step 4. Dais に Experiment 作成を依頼（RC API 非対応のため人間のみ可能）

**RC API v2 に Experiment 作成エンドポイントは存在しない（確認済み: 404 resource_missing）。Dashboard のみ。**

エージェントは Slack #metrics に以下を投稿して Dais の操作を待つ:

```
🔧 Paywall A/B テスト準備完了

新しい Paywall が RC に生成されました。
以下の手順で Experiment を作成して、experiment_id をエージェントに教えてください。

1. https://app.revenuecat.com/projects/bb7b9d1b/experiments → New Experiment
2. Variant A: ofrng78a01eb506 (anicca — 現行 default)
3. Variant B: {new_offering_id} ({lookup_key})
4. Traffic split: 50/50 → Start
5. URL に表示される experiment_id (prexpXXXXXXXX) を Claude Code に送ってください

Paywall プレビュー:
https://app.revenuecat.com/projects/projbb7b9d1b/paywalls/{paywall_id}
```

### Step 5. experiment_id 受取 → Cron 登録（エージェントが SSH で実行）

Dais から `prexpXXXXXXXX` を受け取ったら即座に実行:

```bash
# SSH: ssh anicca@100.99.82.95
# ⚠️ ファイル全体上書き禁止。python3 で部分追加のみ。
python3 -c "
import json
with open('/Users/anicca/.openclaw/cron/jobs.json', 'r') as f:
    data = json.load(f)

# 既存チェック（重複防止）
if any(j['id'] == 'paywall-ab' for j in data['jobs']):
    print('ALREADY EXISTS — skip')
    exit(0)

data['jobs'].append({
  'id': 'paywall-ab',
  'agentId': 'anicca',
  'jobId': 'paywall-ab',
  'name': 'paywall-ab',
  'schedule': {'kind': 'cron', 'expr': '0 9 * * 1', 'tz': 'Asia/Tokyo'},
  'sessionTarget': 'isolated',
  'wakeMode': 'now',
  'payload': {
    'kind': 'agentTurn',
    'message': 'Run paywall-ab skill in evaluate mode. experiment_id: {EXPERIMENT_ID}. Variant A: ofrng78a01eb506 (anicca default). Variant B: {VARIANT_B_OFFERING_ID}. Post results to Slack #metrics (C091G3PKHL2).'
  },
  'delivery': {'mode': 'none'},
  'enabled': True,
  'state': {}
})

with open('/Users/anicca/.openclaw/cron/jobs.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print('DONE')
"
```

### Step 6. Slack #metrics に開始通知

```
📊 Paywall A/B テスト開始 🚀

実験ID: {experiment_id}
開始日: {today}

Variant A (現行): ofrng78a01eb506 (anicca)
Variant B (新AI生成): {new_offering_id}
Traffic split: 50/50

📅 初回チェック: {next_monday} 9:00 JST
毎週月曜 9:00 JST に自動評価します。
```

---

## MODE 2: 週次評価ループ（毎週月曜 9:00 JST 自動実行）

### Step 1. 実験結果を取得

**データソース: Mixpanel（RC Experiments は conversion data を API で返さない）**

```bash
# Mixpanel で offering_id ごとの rc_trial_started_event を集計
# project_id: 3970220
mcp__mixpanel__run_segmentation_query:
  project_id: 3970220
  event: "rc_trial_started_event"
  from_date: "{experiment_start_date}"
  to_date: "{today}"
  segment_by: "properties['offering_id']"
→ Variant A: ofrng78a01eb506 の件数 = a_conversions
→ Variant B: {variant_b_offering_id} の件数 = b_conversions
```

**ユーザー数（パイ分割）の取得:**
```bash
mcp__mixpanel__run_segmentation_query:
  event: "onboarding_paywall_viewed"
  segment_by: "properties['offering_id']"
→ Variant A 表示数 = a_users
→ Variant B 表示数 = b_users
```

**⚠️ RC API でのexperiment data取得は試みてもよいが、analytics返却が不安定:**
```bash
GET https://api.revenuecat.com/v2/projects/projbb7b9d1b/experiments/{experiment_id}
→ status/基本情報は返る。conversion dataが含まれる場合は優先使用。なければMixpanel。
```

### Step 2. 統計判定ロジック

```javascript
// /tmp/chi_test.js として作成して node で実行
function evaluate(aUsers, aConv, bUsers, bConv) {
  const total = aUsers + bUsers;

  // 1. サンプル数チェック（最低 200）
  if (total < 200) return { action: "continue", reason: "insufficient_sample" };

  const cvrA = aConv / aUsers;
  const cvrB = bConv / bUsers;

  // 2. Chi-squared test
  const totalConv = aConv + bConv;
  const exp_a = aUsers * totalConv / total;
  const exp_b = bUsers * totalConv / total;
  const chi2 = Math.pow(aConv - exp_a, 2) / exp_a + Math.pow(bConv - exp_b, 2) / exp_b;
  const pValue = 1 - (1 - Math.exp(-chi2 / 2));

  // 3. 有意差チェック（p < 0.05）
  if (pValue >= 0.05) return { action: "continue", reason: "not_significant", pValue, cvrA, cvrB };

  // 4. 勝者決定
  const winner = cvrB > cvrA ? "B" : "A";
  return { action: "promote_and_start_new", winner, cvrA, cvrB, pValue };
}
```

**判定基準まとめ:**

| 条件 | アクション |
|------|-----------|
| 合計ユーザー < 200 | 継続（サンプル不足） |
| p-value ≥ 0.05 | 継続（有意差なし） |
| p-value < 0.05 | 勝者を昇格 + 新実験開始 |
| 3週間経過してもp ≥ 0.05 | Daisに別切り口の実験を提案 |

### Step 3a. 「継続」の場合 → Slack 報告して終了

**パターン A: サンプル不足**
```
📊 Paywall A/B テスト週次レポート

実験: prexpbac56abf66
期間: {start_date} - {today} ({days}日間)
ステータス: 🟡 継続中

サンプル数:
  Variant A (現行): {a_users} users / {a_conv} trials
  Variant B (AI v2): {b_users} users / {b_conv} trials
  合計: {total} / 最低200 必要

判定: サンプル不足のため継続
次回チェック: {next_monday} 9:00 JST
```

**パターン B: 有意差なし**
```
📊 Paywall A/B テスト週次レポート

実験: prexpbac56abf66
期間: {start_date} - {today} ({days}日間)
ステータス: 🟡 継続中

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users})

統計検定:
  p-value: {p_value} (有意水準 0.05)
  結果: ❌ 有意差なし

判定: 継続
次回チェック: {next_monday} 9:00 JST
```

### Step 3b. 「勝者決定」の場合 → 昇格 + 新実験

**3b-1. 新コピーを LLM で生成（実機能のみ使用）**

```
プロンプト:
あなたは Paywall コピーライターです。

アプリ: Anicca（習慣化・行動変容、7日間無料トライアル → $9.99/月）
ユーザー: 6〜7年同じ悪習慣が抜けられない人。習慣アプリ10個全部3日で諦めた。

## 絶対ルール
❌ 訴求禁止（コードに存在しない）:
  - "30-day insight reports", "growth graph", "streaks", "frequency customization"
  - "nudge", "reminder", "notification", "daily reminders"（体験済みで刺さらない）

✅ 訴求すべき実機能（深さ × AI × 仏教）:
  - AI-written: Free はルールベース。Pro はその人の悩みに特化したAI生成
  - Adaptive: 👍/👎で次のNudgeが改善される（コードで確認済み）
  - Proactive: 固定時刻ではなくサーバー起点でその瞬間に届く
  - Buddhist depth: 何世紀にもわたる仏教の智慧

## 現在の実験結果
勝者 ({winner}): CVR {winner_cvr}%  ← この訴求軸が有効だった
敗者: CVR {loser_cvr}%

## 次の Variant 要件
1. 勝者の良い要素を保持
2. 新しい切り口（例: AIの深さ → 適応学習 → プロアクティブ配信）
3. フォーマット: タイトル(5語以内) + bullets×3(各20文字以内) + CTA固定

出力:
{
  "title": "...",
  "bullets": ["...", "...", "..."],
  "cta": "Try Free For 1 Week"
}

禁止ワード（含まれていたら再生成）: insight, graph, streak, nudge, reminder, notification, daily, frequency, customize
```

**3b-2. Slack 承認ゲート（slack-approval スキル）**

⚠️ **タイムアウトなし。Daisが押すまで永久に待機する。** 急かさない。

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
| `denied` | → 3b-1（新コピー再生成）に戻る（最大3回） |

**3b-3. 新 Offering + Paywall 作成（エージェントが MCP 実行）**

MODE 1 の Step 1〜3 を繰り返す。

**3b-4. Daisに新 Experiment 作成を依頼（Dashboard 操作 → Dais）**

MODE 1 Step 4 と同じパターンで Slack に投稿。

**3b-5. Slack #metrics に勝者レポート投稿**

```
📊 Paywall A/B テスト週次レポート

実験: prexpbac56abf66
期間: {start_date} - {today} ({days}日間)
ステータス: ✅ 完了

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users}) ⭐ 勝者

統計検定:
  p-value: {p_value} ✅ (< 0.05)
  信頼度: {confidence}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 アクション（Dais のみ実行可能）:
1. Variant {winner} を RC Dashboard で default に昇格
   https://app.revenuecat.com/projects/bb7b9d1b/offerings

2. 新実験を Dashboard で作成後、experiment_id をエージェントに送信

📝 新 Variant コピー（承認済み）:
タイトル: "{new_title}"
• {bullet_1}
• {bullet_2}
• {bullet_3}
CTA: "Try Free For 1 Week"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 次回チェック: {next_monday} 9:00 JST
```

---

## Paywall デザインシステム JSON（確定版 — 実機能のみ）

```json
{
  "app_context": {
    "app_name": "Anicca",
    "category": "Health & Fitness / Lifestyle",
    "one_line_description": "AI-powered nudges rooted in Buddhist wisdom to help you change your behavior."
  },
  "brand_identity": {
    "brand_mission": "Reduce suffering through Buddhist wisdom.",
    "brand_personality_archetype": "Sage — wise, calm, compassionate",
    "core_values": ["compassion", "impermanence", "wisdom", "presence"]
  },
  "target_audience": {
    "primary_user_persona": "25–35yo who has struggled with the same bad habit for 6–7 years. Tried 10+ habit apps, all failed.",
    "user_pain_points": [
      "Same struggle for years — can't wake up, stay up scrolling, no willpower",
      "Every habit app failed within 3 days",
      "Deeply low self-trust: 'I know I won't stick to it'"
    ],
    "user_needs_and_goals": [
      "Someone who understands their specific pain — not generic motivation",
      "Guidance that finds them, not something they have to remember to open",
      "Words that feel like they were written for their exact situation"
    ]
  },
  "problem_solution_fit": {
    "problem_statement": "Generic apps give the same advice to everyone. Users feel unseen and give up.",
    "solution_statement": "Anicca Pro uses AI to craft nudges for your exact struggle, learns from your reactions, and reaches you proactively at the right moment.",
    "unique_selling_propositions": [
      "AI writes each nudge for YOUR specific struggle — not copy-pasted advice",
      "Gets smarter with every 👍/👎 you give — adapts to what actually helps you",
      "Reaches you proactively when you need it most — not on a fixed schedule",
      "Grounded in centuries of Buddhist wisdom on suffering and change"
    ]
  },
  "visual_language": {
    "color_palette": {
      "primary_brand_color": "#C9B382",
      "secondary_brand_color": "#2C2A28",
      "accent_cta_color": "#C9B382",
      "background_colors": ["#F5F3ED", "#EDE9E0"],
      "palette_mood": "warm sand, zen rock garden, morning light"
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
    "secondary_tone": "warm and deeply personal",
    "communication_style_summary": "Speak like a wise, compassionate friend who understands suffering without judgment"
  },
  "content_strategy": {
    "premium_feature_highlights": [
      "AI-written nudges, crafted for your exact struggle — not generic advice",
      "Gets smarter every time you react — 👍/👎 shapes what you receive next",
      "Reaches you at the moment you need it most — proactive, not scheduled",
      "Rooted in centuries of Buddhist wisdom, personalized to your pain"
    ],
    "free_vs_pro_honest_difference": "Free: 3 rule-based nudges/day at fixed times. Pro: AI-generated nudges tailored to your specific struggle, adaptive learning from your reactions, proactive server-triggered delivery."
  },
  "ui_patterns": {
    "button_style": "full-width rounded pill, warm gold #C9B382, white bold text",
    "overall_layout_philosophy": "breathing room — generous padding, single focal point, no clutter"
  }
}
```

### 実績

| バージョン | Offering ID | Paywall ID | 備考 |
|-----------|------------|-----------|------|
| v1 (2026-02-24) | `ofrng4c8d1f9d48` | `pwd08b47e7c59f464d` | ❌ 嘘コピー含む（廃棄） |
| **v2 (2026-02-24)** | **`ofrng586631f021`** | **`pw5d8ebd3e8a674b3e`** | ✅ 実機能のみ（現行 Variant B） |

---

## RevenueCat 接続情報

| 項目 | 値 |
|------|-----|
| Project ID | `projbb7b9d1b` |
| API Base | `https://api.revenuecat.com/v2` |
| MCP ツール | `mcp__revenuecat__mcp_RC_*` |
| RC Dashboard | `https://app.revenuecat.com/projects/bb7b9d1b/` |

---

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| RC Paywall 409 (already exists) | **新しい Offering を作成する。既存 paywall の上書き不可。** |
| RC Experiment 404 (resource_missing) | RC API は Experiment 作成不可。Dashboard 操作のみ。Dais に依頼。 |
| LLM が禁止ワード含むコピー生成 | 禁止ワードチェック → 再生成（最大3回） |
| Mixpanel セグメント取得失敗 | `onboarding_paywall_viewed` と `rc_trial_started_event` で手動集計 |
| slack-approval が応答なし | タイムアウトなし。待つ。急かさない。 |
| 3週間以上有意差出ない | 別切り口の新実験を Slack で Dais に提案 |

---

## Changelog

- 2026-02-24: v1.0 初版作成
- 2026-02-24: v1.1 Figma approach 廃棄 → RC AI自動生成に一本化
- 2026-02-24: v1.2 アプリコード確認必須セクション追加。嘘コピー禁止リスト追加
- 2026-02-24: v1.3 v1 paywall廃棄。v2 paywall (`pw5d8ebd3e8a674b3e`) 再生成
- 2026-02-24: v1.4 Candle原則の嘘（30日分析/成長グラフ/頻度調整）を削除し実機能に置換。Mixpanelでのデータ取得フローを追加。slack-approvalタイムアウトなし明記。experiment_id=human操作フロー明確化。cron登録はpython3部分追加のみ（全体上書き禁止）。現在の実験状態セクション追加。
