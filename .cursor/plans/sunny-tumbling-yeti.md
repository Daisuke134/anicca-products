# Token Cost Tracking + US-010 X Post + Model Switching

## Context

$200 Max プラン (20x) の使用量を可視化・追跡する仕組みがない。
ralph.sh のログには全 usage データがあるが、自動集計していない。
「1アプリあたり何%消費」を常に把握し、日次出荷の持続可能性を担保する。

## 実測データ（FrostDip, 2026-03-07）

| 項目 | 値 | ソース |
|------|-----|--------|
| 5h窓 推定サイズ | ~85M tokens | /usage 30% ≈ 25M から逆算 |
| FrostDip 9iter (7/20 US) | 19.3M tokens | ログ解析 |
| FrostDip 5h窓% | ~23% | 19.3M / 85M |
| 全20US完成 推定 | ~50M tokens | 比例計算 |
| 1アプリ 5h窓% | ~59% | 50M / 85M |
| 1アプリ weekly% | ~16% | /usage比例 |
| 1日1アプリ + 日常CC | 余裕あり | 5h窓の~70%で収まる |

> Source: intuitionlabs.ai — 「Max 20x: ~900 msgs/5h, reset every ~5 hours」
> Source: macaron.im — 「Anthropic's pricing is paying for compute capacity」
> Anthropic は公式トークン枠を非公開。上記は /usage + 実測からの推定。

## 成果物

### 1. `token-report.sh` — ログからトークン自動集計

**場所:** `.claude/skills/mobileapp-builder/token-report.sh`（新規）

**動作:**
- `$APP_DIR/logs/iteration-*.log` の `"type":"result"` JSON から `usage` 抽出
- iteration 別 + 合計の input/output/cache tokens を集計
- 5h窓% と weekly% を算出（5h窓 ≈ 85M tokens 基準）
- prd.json から app名 + US完了状況を取得
- `$APP_DIR/token-report.json` に出力
- Slack に要約通知

**出力フォーマット:**
```json
{
  "app": "FrostDip",
  "iterations": 30,
  "us_completed": ["US-001","US-002",...],
  "us_total": 20,
  "tokens": {
    "input": 349,
    "output": 155255,
    "cache_create": 758877,
    "cache_read": 18374490,
    "grand_total": 50000000
  },
  "usage": {
    "five_hour_pct": 59,
    "weekly_pct": 16
  }
}
```

**Slack 通知:**
```
📊 FrostDip トークンレポート
━━━━━━━━━━━━━━━━━━━
🔢 50M tokens | 30 iterations
📈 US: 20/20
💰 5h: 59% / weekly: 16%
━━━━━━━━━━━━━━━━━━━
```

### 2. `us-010-report.md` — X 投稿 + コストレポート

**場所:** `.claude/skills/mobileapp-builder/references/us-010-report.md`（新規）

**フロー:**
1. token-report.sh 実行 → token-report.json 生成
2. token-report.json + screenshots/raw/ から4枚選択
3. X投稿テキスト生成
4. Blotato API で投稿（build-in-public スキルのパターン再利用）
5. progress.txt に追記

**X 投稿フォーマット:**
```
🏭 FrostDip → App Store 🧊

Cold plunge timer & breathing guide
Built with Claude Code in 3h 45m

📊 50M tokens / 30 iterations
💰 5h: 59% / weekly: 16%

1 app/day, fully automated.

[スクショ 4枚]

#buildinpublic #ios #ai
```

**prd.json テンプレートに追加:**
```json
{
  "id": "US-010",
  "title": "Cost report + X post (build-in-public)",
  "acceptanceCriteria": [
    "token-report.json exists with valid data",
    "X post published with app name + cost + screenshots",
    "Slack notified with cost summary"
  ],
  "priority": 10,
  "passes": false,
  "notes": ""
}
```

### 3. ralph.sh: `--model opusplan` + token-report.sh 自動実行

**モデル: `opusplan`（CC 公式組み込み機能）**

> Source: code.claude.com/docs/en/model-config
> 「`opusplan` — In plan mode: Uses opus for complex reasoning and architecture decisions. In execution mode: Automatically switches to sonnet for code generation and implementation. This gives you the best of both worlds.」

> Source: code.claude.com/docs/en/costs
> 「Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning.」

> Source: anthropic.com/news/claude-sonnet-4-6
> 「Opus 4.6 remains the strongest option for tasks that demand the deepest reasoning, such as codebase refactoring」
> 「Users preferred Sonnet 4.6 to Opus 4.5, 59% of the time」

> Source: anthropic.com/claude/sonnet — Rakuten
> 「Claude Sonnet 4.6 produced the best iOS code we've tested for Rakuten AI」

**変更 A:** `--model opus` → `--model opusplan`

**変更 B:** ralph.sh 末尾に token-report.sh 呼び出し追加:
```bash
if [ -f "$SCRIPT_DIR/token-report.sh" ]; then
  echo "📊 token-report.sh 実行中..."
  chmod +x "$SCRIPT_DIR/token-report.sh"
  "$SCRIPT_DIR/token-report.sh" "$APP_DIR" || echo "⚠️ token-report.sh failed"
fi
```

## ファイル変更一覧

| # | ファイル | 操作 |
|---|---------|------|
| 1 | `.claude/skills/mobileapp-builder/ralph.sh` | `--model opusplan` + 末尾 token-report.sh |
| 2 | `.claude/skills/mobileapp-builder/token-report.sh` | 新規：ログ解析 → JSON + Slack |
| 3 | `.claude/skills/mobileapp-builder/references/us-010-report.md` | 新規：X投稿手順 |
| 4 | `.claude/skills/mobileapp-builder/prd.json` | US-010 追加 |
| 5 | `.claude/skills/mobileapp-builder/CLAUDE.md` | US-010 Slack フォーマット追加 |

## 検証

1. FrostDip のログで `token-report.sh` 手動実行 → token-report.json 正しく生成されるか
2. ralph.sh の `--model opusplan` 変更後、次回ビルドで opusplan 動作確認
3. US-010 の X 投稿フローは次のアプリ完了時にテスト
