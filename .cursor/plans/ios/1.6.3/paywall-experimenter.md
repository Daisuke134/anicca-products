# Paywall Experiment Loop Spec

Version: 1.0
Created: 2026-02-12
Status: Draft

---

## 概要

RevenueCat Experiments を使った Paywall コピーの自動 A/B テストループ。
週次で結果を評価し、勝者を昇格、次の実験を自動開始する。

## 目的

1. Paywall CVR を継続的に改善
2. 人間の介入なしで実験サイクルを回す
3. Candle 原則に基づくコピー生成

---

## As-Is (現状)

```
- Paywall コピー固定
- A/B テストなし
- 変更は手動デプロイのみ
- データに基づく改善なし
```

## To-Be (目標)

```
┌──────────────────────────────────────────────────────────────────┐
│                   PAYWALL EXPERIMENT LOOP                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [paywall-experiment-loop]                                       │
│   cron: 0 9 * * 1 (毎週月曜9時 JST)                              │
│                                                                  │
│   1. RevenueCat API → 現在の Experiment 結果取得                 │
│   2. 統計的有意差チェック (p < 0.05, 最低 N=200)                 │
│   3. 有意差あり → 勝者を default に昇格                          │
│   4. 次のコピー案を LLM で生成 (Candle原則)                      │
│   5. 新 Offering 作成 → 新 Experiment 開始                       │
│   6. Slack #metrics に報告                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Candle 原則（コピー生成ルール）

### ❌ 訴求しない: コアバリュー
ユーザーは 7日間トライアルで体験済み。

- "Personalized nudges for your pain"
- "Exact-time reminders at difficult times"
- "Daily reminders"
- "Get full access to all features"

### ✅ 訴求する: 深さ・進捗・カスタマイズ
トライアル後に価値が積み重なるもの。

| カテゴリ | 例 |
|---------|-----|
| 深さ | 行動パターン分析、30日インサイト、詳細レポート |
| 進捗 | 成長グラフ、ストリーク、目標達成率 |
| カスタマイズ | Nudge タイミング変更、頻度調整、テーマ |

---

## 技術仕様

### 必要な環境変数

| Key | Description |
|-----|-------------|
| `REVENUECAT_V2_SECRET_KEY` | RevenueCat API v2 シークレット |
| `REVENUECAT_PROJECT_ID` | プロジェクト ID (projbb7b9d1b) |
| `OPENAI_API_KEY` | LLM コピー生成用 |
| `SLACK_BOT_TOKEN` | #metrics 投稿用 |

### RevenueCat API エンドポイント

```bash
# 実験結果取得
GET https://api.revenuecat.com/v2/projects/{project_id}/experiments/{experiment_id}
Authorization: Bearer $REVENUECAT_V2_SECRET_KEY

# Offering 一覧
GET https://api.revenuecat.com/v2/projects/{project_id}/offerings

# Offering 作成
POST https://api.revenuecat.com/v2/projects/{project_id}/offerings

# 実験作成
POST https://api.revenuecat.com/v2/projects/{project_id}/experiments
```

### 判定ロジック

```typescript
interface ExperimentResult {
  variantA: { users: number; conversions: number };
  variantB: { users: number; conversions: number };
}

function evaluate(result: ExperimentResult): Decision {
  const totalUsers = result.variantA.users + result.variantB.users;
  
  // 1. サンプル数チェック
  if (totalUsers < 200) {
    return { action: "continue", reason: "insufficient_sample" };
  }
  
  // 2. CVR 計算
  const cvrA = result.variantA.conversions / result.variantA.users;
  const cvrB = result.variantB.conversions / result.variantB.users;
  
  // 3. 統計的有意差 (chi-squared test)
  const pValue = chiSquaredTest(result);
  
  if (pValue >= 0.05) {
    return { action: "continue", reason: "not_significant", pValue };
  }
  
  // 4. 勝者決定
  const winner = cvrB > cvrA ? "B" : "A";
  return { 
    action: "promote_and_start_new", 
    winner,
    cvrA,
    cvrB,
    pValue,
    confidence: (1 - pValue) * 100
  };
}
```

### LLM Prompt (次の Variant 生成)

```
あなたは Paywall コピーライターです。

## 背景
- アプリ: Anicca (習慣化・行動変容)
- 7日間無料トライアル → 月額 $9.99

## Candle 原則
- コアバリュー（Nudge、リマインダー）は訴求しない
  → ユーザーはトライアルで体験済み
- 深さ・進捗・カスタマイズを訴求する
  → トライアル後に価値が積み重なるもの

## 現在の実験結果
- Variant A (現行): CVR {a_cvr}%
- Variant B: CVR {b_cvr}% {winner_mark}

## 勝者の良い要素
{winner_copy}

## タスク
次の Variant C を作成してください。

要件:
1. 勝者の良い要素を保持
2. 新しい「深さ/進捗/カスタマイズ」の切り口を追加
3. フォーマット:
   - タイトル (5語以内)
   - 3つの bullet point (各20文字以内)
   - CTA は "Try Free For 1 Week" 固定

出力形式:
```json
{
  "title": "...",
  "bullets": ["...", "...", "..."],
  "cta": "Try Free For 1 Week"
}
```
```

---

## Cron 設定

```json
{
  "name": "paywall-experiment-loop",
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1",
    "tz": "Asia/Tokyo"
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Run paywall-experiment-loop skill."
  },
  "delivery": {
    "mode": "announce",
    "channel": "C091G3PKHL2"
  }
}
```

---

## Slack 投稿フォーマット

### パターン A: サンプル不足

```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {end_date} ({days}日間)
ステータス: 🟡 継続中

サンプル数:
  Variant A (現行): {a_users} users
  Variant B ({b_label}): {b_users} users
  合計: {total} / 最低200 必要

CVR (参考値):
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users})

判定: サンプル不足のため継続
次回チェック: {next_check_date}
```

### パターン B: 有意差なし

```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {end_date} ({days}日間)
ステータス: 🟡 継続中

サンプル数:
  Variant A (現行): {a_users} users
  Variant B ({b_label}): {b_users} users
  合計: {total} ✅

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users})

統計検定:
  差分: {diff}%
  p-value: {p_value} (有意水準 0.05)
  結果: ❌ 有意差なし

判定: 継続、{weeks}週後に再評価
次回チェック: {next_check_date}
```

### パターン C: 勝者決定

```
📊 Paywall A/B テスト週次レポート

実験: {experiment_name}
期間: {start_date} - {end_date} ({days}日間)
ステータス: ✅ 完了

サンプル数:
  Variant A (現行): {a_users} users
  Variant B ({b_label}): {b_users} users
  合計: {total} ✅

CVR:
  A: {a_cvr}% ({a_conv}/{a_users})
  B: {b_cvr}% ({b_conv}/{b_users}) ⭐ 勝者

統計検定:
  差分: +{diff}%
  p-value: {p_value} ✅ (< 0.05)
  信頼度: {confidence}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 アクション実行:

1. ✅ Variant B を default に昇格
   RevenueCat Offering "{winner_offering}" → default

2. 🆕 新実験 {new_experiment_name} を開始
   Variant A: 現勝者 ({b_label})
   Variant B: {c_label} (新)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 新 Variant B コピー:

タイトル: "{c_title}"

{c_bullets}

CTA: "Try Free For 1 Week"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 次回チェック: {next_check_date}
```

---

## Test Cases

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | サンプル不足 | A:45, B:52 | action: continue, reason: insufficient_sample |
| 2 | 有意差なし | A:112 (5%), B:108 (5.1%), p=0.89 | action: continue, reason: not_significant |
| 3 | B勝利 | A:167 (4.2%), B:171 (6.4%), p=0.032 | action: promote_and_start_new, winner: B |
| 4 | A勝利 | A:180 (7.1%), B:175 (4.8%), p=0.041 | action: promote_and_start_new, winner: A |
| 5 | LLMコピーにコアバリュー | - | コピーに "nudge", "reminder" 含まない |
| 6 | RevenueCat API エラー | 500 | Slack にエラー通知、リトライなし |

---

## 初期セットアップ手順

### 1. RevenueCat で初回 Experiment 作成

1. RevenueCat Dashboard → Experiments
2. "New Experiment" → Type: "Paywall design"
3. Variant A: 現行 Offering
4. Variant B: Candle原則に基づく新 Offering 作成
   - タイトル: "Your Growth Companion"
   - Bullets:
     - 📈 30日間の成長をグラフで確認
     - 🎯 行動パターンから最適なタイミングを提案
     - ⚙️ Nudge の頻度とスタイルをカスタマイズ
5. Traffic split: 50/50
6. Start experiment

### 2. VPS スキル作成

```bash
mkdir -p /home/anicca/.openclaw/workspace/skills/paywall-experiment-loop
# SKILL.md を作成
```

### 3. Cron 登録

```bash
openclaw cron add paywall-experiment-loop
```

---

## 成功指標

| Metric | 目標 |
|--------|------|
| Paywall CVR | 4.2% → 8% (6ヶ月) |
| 実験サイクル | 2-3週/実験 |
| 人間介入 | 月1回のレビューのみ |

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| RevenueCat API 変更 | エラー時 Slack 通知、手動フォールバック |
| LLM がコアバリュー含むコピー生成 | 禁止ワードリストでフィルタ |
| 長期間有意差出ない | 3週間後に別切り口で新実験提案 |
| CVR 悪化 | 前回勝者にロールバック可能な設計 |

---

---

## Figma → RC 連携の正しいやり方（2026-02-24 追記）

### 問題の根本原因

| 問題 | 原因 |
|------|------|
| HTML → Figma キャプチャが 1502×932 になる | ブラウザ viewport 全体をキャプチャする。CSS `width: 430px` はウィンドウを変えない |
| RC Figma plugin が動かない | HTML-to-Figma キャプチャは**フラットな視覚レンダリング**を作る。Figma Auto Layout がない。RC plugin は Auto Layout 必須 |

ソース: RevenueCat公式 / 「Your paywall designs must use Figma auto layout to be imported correctly.」

### 正しいアプローチ

**CSS flexbox → Figma Auto Layout 変換を利用する。**

html-to-design スクリプトは CSS `display: flex; flex-direction: column` を Figma Auto Layout に変換する。これが正しく動けば RC plugin が認識できる構造になる。

加えて、**HTML の `id` 属性が Figma のレイヤー名**になる。RC plugin は以下の特殊レイヤー名を必須とする:

| RC コンポーネント | Figma レイヤー名 | HTML に必要な id |
|-----------------|----------------|----------------|
| Purchase Button | `Purchase Button` | `id="Purchase Button"` |
| Footer | `Footer` | `id="Footer"` |
| Package | `Package` | `id="Package"` |
| Text, Image, Stack | 自動認識（命名不要） | - |

### 修正済み HTML の要件

1. `.paywall` div に `display: flex; flex-direction: column` (✅ 既に実装済み)
2. CTA ボタン div に `id="Purchase Button"` を追加
3. フッター（terms行）に `id="Footer"` を追加
4. キャプチャ URL に `&figmaselector=.paywall` を付けて 430×932 に絞る

### サイズについて

RC Figma plugin はフレームの**絶対ピクセルサイズを気にしない**。コンポーネントツリーと Auto Layout のみを読む。ただし 430×932 で揃えると Figma 上のプレビューが正確になる。

## Changelog

- 2026-02-12: v1.0 初版作成
- 2026-02-24: Figma → RC 連携の根本問題と正しいアプローチを追記
