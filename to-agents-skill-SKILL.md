---
name: to-agents-skill
description: "x402スキル量産工場。to-agents-learning.mdの学びを型に変換し、新しいx402スキルを自律的に生産する。Use when: skill production, factory run, build new x402 skill, produce skill, discover next skill, measure skill performance."
metadata: {"openclaw":{"emoji":"🏭","os":["darwin","linux"]}}
---

# to-agents-skill（x402スキル量産工場）

## 概要

このスキルは3つのモードで動作する:

| モード | トリガー | 動作 |
|--------|---------|------|
| `produce` | `mode=produce skill_name=<name>` | スキルを実際に作って公開する |
| `discover` | `mode=discover`（毎日 cron） | カタログから次スキルを提案→承認待ち |
| `measure` | `mode=measure`（週次） | パフォーマンス計測→改善提案 |

## 保存先（Mac Mini フルパス）

| 種類 | パス |
|------|------|
| 学びの蓄積 | `/Users/anicca/.openclaw/workspace/to-agents/to-agents-learning.md` |
| 提案記録 | `/Users/anicca/.openclaw/workspace/to-agents/proposals.json` |
| メトリクス | `/Users/anicca/.openclaw/workspace/to-agents/metrics.json` |
| 生成スキル | `/Users/anicca/.openclaw/skills/<skill_name>/SKILL.md` |
| スキルテンプレ | `/Users/anicca/.openclaw/skills/to-agents-skill/templates/skill-template.md` |

## リポジトリ情報

| 項目 | 値 |
|------|-----|
| API リポジトリ | `https://github.com/Daisuke134/anicca`（Private） |
| API エンドポイント dir | `apps/api/src/routes/x402/` |
| Staging URL | `https://anicca-proxy-staging.up.railway.app` |
| Production URL | `https://anicca-proxy-production.up.railway.app` |

---

## MODE: produce（スキル生産）

**入力**: `skill_name`, `description`, `usecase`

**必須不変条件**:
1. `awal x402 pay` が 200 OK を返すまで clawhub publish を実行しない
2. 失敗時は即座に halt して #metrics にエラー報告する
3. to-agents-learning.md は append のみ（上書き禁止）

### Step 1: to-agents-learning.md を読む

```
cat /Users/anicca/.openclaw/workspace/to-agents/to-agents-learning.md
```

最新のパターン・失敗教訓を確認する。

### Step 2: 重複チェック

```bash
clawhub search <skill_name>
```

既に存在する → `"already exists"` を #metrics に報告して終了。

### Step 3: Railway エンドポイントを追加（git + push）

**MacBook に SSH して作業する**: `ssh cbns03@100.108.140.123`

```bash
# 1. dev ブランチに checkout
cd /Users/cbns03/Downloads/anicca-project
git checkout dev && git pull origin dev

# 2. ハンドラファイルを作成（buddhistCounsel.js を型に）
# apps/api/src/routes/x402/<skillName>.js を作成
# - スキル固有のシステムプロンプトを設定
# - 入出力スキーマを定義（zod で検証）
# - sanitizeInput を再利用
# - Prisma audit log: eventType = 'x402_<skill_name>'

# 3. index.js に追加
# paymentMiddleware の routes オブジェクトに:
#   'POST /<skill_name>': { accepts: { scheme: 'exact', price: '$0.01', network, payTo: PAY_TO }, ... }
# router.use('/<skill_name>', <skillName>Router) を追加

# 4. コミット＆push
git add apps/api/src/routes/x402/
git commit -m "feat(x402): add <skill_name> endpoint"
git push origin dev
```

Railway staging が自動デプロイされる（2-3分待機）。

### Step 4: awal でテスト（必須ゲート）

```bash
npx awal@2.0.3 x402 pay https://anicca-proxy-staging.up.railway.app/api/x402/<skill_name> \
  -X POST \
  -d '<skill-specific JSON>'
```

**200 OK でなければ即 halt**。#metrics にエラー報告して終了。

### Step 5: SKILL.md を生成

`/Users/anicca/.openclaw/skills/to-agents-skill/templates/skill-template.md` を読み、
`<SKILL_NAME>`, `<DESCRIPTION>`, `<USECASE>` 等を置換して:

```
mkdir -p /Users/anicca/.openclaw/skills/<skill_name>
```

に SKILL.md を作成する。

### Step 6: clawhub publish

```bash
cd /Users/anicca/.openclaw/skills/<skill_name>
clawhub publish
```

出力から `clawhub_id` を記録する。失敗したら1回リトライ。2回失敗したら halt + #metrics エラー報告。

### Step 7: Moltbook 宣伝

moltbook-interact スキルに以下を指示する:

```
Use moltbook-interact to post a promotional message for the new x402 skill:
- Name: <skill_name>
- Description: <description>
- Endpoint: https://anicca-proxy-production.up.railway.app/api/x402/<skill_name>
- Price: $0.01 USDC
Post to Moltbook feed. Return the post_id.
```

`post_id` を記録する。失敗しても halt しない（warning のみ）。

### Step 8: to-agents-learning.md に追記

```
/Users/anicca/.openclaw/workspace/to-agents/to-agents-learning.md の末尾に以下を append:

## Run: <skill_name> (<today's date>)

| Field | Value |
|-------|-------|
| skill_name | <skill_name> |
| endpoint_url | https://anicca-proxy-production.up.railway.app/api/x402/<skill_name> |
| clawhub_id | <clawhub_id> |
| moltbook_post_id | <post_id> |
| awal_result | 200 OK |
| notes | <learnings from this run> |
```

ファイル全体を上書きしない。`>>` で追記のみ。

### Step 9: #metrics 完了報告

Slack `#metrics`（channel ID: `C091G3PKHL2`）に送信:

```
✅ to-agents-skill produce 完了

スキル: <skill_name>
エンドポイント: https://anicca-proxy-production.up.railway.app/api/x402/<skill_name>
ClawHub ID: <clawhub_id>
Moltbook Post ID: <post_id>
awal テスト: 200 OK ✅
```

---

## MODE: discover（次スキル提案）

**実行タイミング**: 毎日 10:00 JST（cron: `0 1 * * *` UTC）

### Step 1: カタログ確認

```
cat /Users/anicca/.openclaw/workspace/to-agents/to-agents-learning.md
```

スキルカタログ（10スキル）から「未着手」（Run エントリなし）のスキルを特定する。

スキルカタログ（優先順位順）:
1. emotion-detector
2. focus-coach
3. grief-support
4. crisis-detector
5. motivation-booster
6. clarity-coach
7. habit-debugger
8. self-compassion
9. values-compass
10. acceptance-guide

### Step 2: 重複チェック

```bash
clawhub search <next_skill_name>
```

既に存在する → リストの次のスキルへ。

### Step 3: proposals.json 確認

```
cat /Users/anicca/.openclaw/workspace/to-agents/proposals.json
```

`status=pending` のエントリがある → 既に提案済み。今回はスキップ（二重提案禁止）。

### Step 4: Slack に提案

Slack `#metrics` に送信:

```
🏭 to-agents-skill: 次のスキル提案

スキル候補: <skill_name>
説明: <description>
理由: <rationale>

✅ リアクションで production 開始
❌ リアクションで却下（次候補へ）
```

### Step 5: proposals.json に記録

```json
{
  "proposal_id": "<uuid>",
  "skill_name": "<skill_name>",
  "description": "<description>",
  "slack_ts": "<slack_message_timestamp>",
  "status": "pending",
  "proposed_at": "<ISO8601>",
  "expires_at": "<ISO8601 + 48h>"
}
```

`proposals.json` の配列に append（上書き禁止）。

**STOP**: 承認なしに produce は実行しない。

---

## MODE: measure（パフォーマンス計測）

**実行タイミング**: 週次（手動トリガーまたは週1回 cron）

### Step 1: 生きているスキルを列挙

```
cat /Users/anicca/.openclaw/workspace/to-agents/to-agents-learning.md
```

全 `## Run:` エントリを収集する。

### Step 2: 簡易コール数計測（v1）

各スキルについて、`clawhub search <skill_name>` でダウンロード数を確認する（v1 はシンプルカウント）。

### Step 3: 閾値判定

| 条件 | アクション |
|------|-----------|
| ダウンロード増加なし 7日 | 改善提案を #metrics に送信 |
| ダウンロード 0 かつ 14日経過 | 廃止提案を #metrics に送信 |

### Step 4: #metrics に報告

```
📊 to-agents-skill measure レポート

対象スキル: <skill_name>
状態: ⚠️ 7日間コールなし
改善提案: <具体的な1つの提案>

✅ 承認で改善実施
❌ 廃止を提案
```

---

## エラーハンドリング

| エラー | 対応 |
|--------|------|
| awal 非200 | 即 halt。ClawHub publish 禁止。#metrics にエラー報告 |
| clawhub publish 失敗 | 1回リトライ。失敗 → halt + #metrics エラー |
| Moltbook 失敗 | warning のみ。halt しない |
| to-agents-learning.md 書き込み失敗 | warning のみ。halt しない |
| git push 失敗 | halt + #metrics エラー |
| 既存スキル名 | skip + #metrics に「already exists」報告 |
