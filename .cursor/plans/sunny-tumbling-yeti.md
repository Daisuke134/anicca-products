# US-010 Build Report + Model Switching

## Context

$200 Max プラン (20x) の使用量を可視化 + Build-in-Public X投稿を自動化。
ralph.sh のログから自動集計 → build-report.json → Slack + X。
Blotato は 2026-02-28 解約済み → Postiz API を使用。

## 調査結果

| 項目 | 状態 | 詳細 |
|------|------|------|
| Postiz API key | `~/.openclaw/.env` にある | `POSTIZ_API_KEY`, `POSTIZ_X_INTEGRATION_ID` |
| Blotato | 解約済み（2026-02-28） | Postiz に移行完了 |
| スクショパス | `screenshots/raw-65/en-US/` | US-008 spec と一致。US-008 未完了時は空 |
| prd.json US-010 | 実装済み（commit 75726a0d） | — |
| CLAUDE.md US-010 行 | 実装済み（commit 75726a0d） | — |
| us-010-report.md | 実装済みだが修正必要 | 下記参照 |
| ralph.sh model | 未変更（`--model opus`） | → `--model opusplan` |
| token-report.sh | 不要 | us-010-report.md の Step 1 Python で直接計算 |

## 修正箇所

### 1. `us-010-report.md` 修正（6箇所）

**ファイル:** `.claude/skills/mobileapp-builder/references/us-010-report.md`

| # | 箇所 | 現状 | 修正後 |
|---|------|------|--------|
| A | Step 5 Slack webhook | `https://hooks.slack.com/services/$SLACK_WEBHOOK_PATH` | `$SLACK_WEBHOOK_AGENTS` |
| B | Step 6 X投稿先 | Postiz 2アカウント（JP+EN） | **@aniccaxxx のみ**（英語テキスト） |
| C | Step 6 Postiz env source | `~/.config/mobileapp-builder/.env` | `~/.openclaw/.env` も source（フォールバック） |
| D | `appSlogan` フィールド | prd.json に存在しない | `description` に統一 |
| E | Step 6 X投稿テキスト | 日本語 + EN両方 | 英語のみ、シンプル形式 |
| F | BLOTATO_API_KEY 未設定時 | エラーで停止 | X投稿スキップ + Slack で報告 |

### 2. `ralph.sh` L195 モデル変更

**ファイル:** `.claude/skills/mobileapp-builder/ralph.sh`

```diff
- --model opus
+ --model opusplan
```

### 3. `~/.config/mobileapp-builder/.env` に Postiz keys 追加

```bash
# ~/.openclaw/.env からコピー
POSTIZ_API_KEY=48b04b54c995031d2ebe65aee9cd1436a8220a3805c2133e2e4c1d87e2983720
POSTIZ_X_INTEGRATION_ID=cmm6d7m5703rwpr0yr5vtme3w
```

## 投稿内容（確定）

### Slack（#agents、`$SLACK_WEBHOOK_AGENTS`）

```
🏭 {APP_NAME} → App Store

📱 {DESCRIPTION}
💰 ~${COST} / $200 plan
⏱️ {ITERATIONS} iterations | {DURATION}min
📊 {TOKENS}M tokens | 5h: {W5}% | weekly: {WK}%

#BuildInPublic
```

全値は `build-report.json` から動的取得。ハードコードなし。

### X（@aniccaxxx のみ、英語テキスト、Postiz API）

```
🏭 {APP_NAME} → App Store

{DESCRIPTION}

💰 ~${COST} / $200 plan
📊 {TOKENS}M tokens
⏱️ 5h: {W5}% | weekly: {WK}%

#BuildInPublic
```

+ スクショ4枚（`screenshots/raw-65/en-US/*.png`、Postiz media API でアップロード）

### Slack vs X の違い

| | Slack | X |
|---|-------|---|
| 送信先 | #agents (webhook) | @aniccaxxx (Postiz) |
| iterations/duration | あり | なし（文字数節約） |
| スクショ | なし | 4枚 |

## コスト計算ロジック

```python
WEEKLY_CAP = 560_000_000  # 推定: 5h窓 85M × 平日稼働
MONTHLY_CAP = WEEKLY_CAP * 4
cost_in_plan = (total_tokens / MONTHLY_CAP) * 200
weekly_pct = (total_tokens / WEEKLY_CAP) * 100
window_pct = (total_tokens / 90_000_000) * 100  # 5h窓
```

us-010-report.md Step 1 の既存 Python コードをそのまま使用。

## ファイル変更一覧

| # | ファイル | 操作 |
|---|---------|------|
| 1 | `.claude/skills/mobileapp-builder/references/us-010-report.md` | 修正: 6箇所（上記A-F） |
| 2 | `.claude/skills/mobileapp-builder/ralph.sh` L195 | `--model opus` → `--model opusplan` |
| 3 | `~/.config/mobileapp-builder/.env` | Postiz keys 追加 |

**実装済み（変更不要）:**
- `prd.json` US-010 エントリ（commit 75726a0d）
- `CLAUDE.md` US-010 行（commit 75726a0d）

**不要と判断:**
- `token-report.sh` — us-010-report.md の Step 1 Python で直接計算するため別スクリプト不要
- ralph.sh 末尾の token-report.sh 呼び出し — 同上

## 検証

1. `~/.config/mobileapp-builder/.env` に Postiz keys が入っているか確認
2. Postiz API でテスト投稿: `curl -s https://api.postiz.com/public/v1/posts -H "Authorization: Bearer $POSTIZ_API_KEY"` → 200
3. ralph.sh の `--model opusplan` → 次回ビルドで動作確認
4. us-010-report.md の修正後、FrostDip logs で build-report.json 生成テスト
