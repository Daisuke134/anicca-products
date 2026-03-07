# Token Cost Tracking + US-010 X Post + Model Switching

## Context

EyeRest (20260307) で 18.4M tokens を消費し、$200 Max プランの週枠を使い切った。
ログには全 usage データが記録されているが、自動集計・可視化する仕組みがない。
ビジネスとして「投入コスト vs 収益」を常に追跡する必要がある。

## 成果物

### 1. `token-report.sh` — ログからコスト自動集計

**場所:** `.claude/skills/mobileapp-builder/token-report.sh`

**動作:**
- `$APP_DIR/logs/iteration-*.log` を全て読み込み
- 各 iteration の `"type":"result"` JSON から `usage` を抽出
- iteration 別 + 合計の input/output/cache tokens を集計
- Max $200 プラン換算コストを計算:
  - **$200/月 = $50/週 = 週枠100%**
  - 実際の API 換算コスト (Opus: input $15/M, output $75/M) も算出
  - 「この1アプリで週枠の X% を消費」と表示
- `$APP_DIR/token-report.json` に出力
- Slack に要約を通知

**出力フォーマット例:**
```json
{
  "app": "EyeRest",
  "date": "2026-03-07",
  "model": "opus",
  "iterations": 7,
  "us_completed": ["US-001","US-002","US-003","US-004a","US-004b","US-004-R"],
  "tokens": {
    "input": 18296169,
    "output": 146052,
    "cache_read": 0,
    "cache_creation": 0,
    "total": 18442221
  },
  "cost": {
    "api_equivalent_usd": 285.45,
    "max_plan_weekly_pct": 94
  }
}
```

### 2. `us-010-report.md` — US-010 リファレンス (X 投稿 + コストレポート)

**場所:** `.claude/skills/mobileapp-builder/references/us-010-report.md`

**動作 (CC が実行):**
1. `token-report.sh` を実行して `token-report.json` 生成
2. `token-report.json` を読み込み
3. X 投稿テキスト生成:
   - アプリ名 + one-liner
   - 消費トークン数 + API換算コスト
   - スクリーンショット 4枚（`screenshots/raw/` から）
4. Blotato API で X に投稿（build-in-public スキルのパターン再利用）
5. `progress.txt` に追記

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

### 3. ralph.sh にモデル切替ロジック追加

**根拠 (全て引用付き):**

| ソース | 引用 |
|--------|------|
| Claude Code Docs - costs | "Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning." |
| Rakuten AI (Sonnet 4.6 発表) | "Claude Sonnet 4.6 produced the best iOS code we've tested for Rakuten AI." |
| Anthropic (Sonnet 4.6 発表) | "Users even preferred Sonnet 4.6 to Opus 4.5, our frontier model from November, 59% of the time." |
| Anthropic (Opus 4.6) | "Opus 4.6 remains the strongest option for tasks that demand the deepest reasoning, such as codebase refactoring" |
| Claude Code Docs - agent teams | "Use Sonnet for teammates. It balances capability and cost." |

**結論: 全 US を Sonnet 4.6 でやるべき。**

Sonnet 4.6 は Opus 4.5 より59%の時間で好まれ、iOS コード品質でRakutenから「テスト済み最高」と評価され、ドキュメント生成で1633 Elo（全モデルトップ）。SWE-bench でも Opus との差は7%のみでコストは1/5。

**変更:** ralph.sh の `--model opus` → `--model sonnet` に変更。

### 4. ralph.sh 完了後に token-report.sh を自動実行

**場所:** ralph.sh の最後（COMPLETE 検出後 + MAX_ITERATIONS 到達時の両方）

```bash
# Token report: auto-generate after ralph.sh completes
if [ -f "$SCRIPT_DIR/token-report.sh" ]; then
  echo "📊 token-report.sh 実行中..."
  chmod +x "$SCRIPT_DIR/token-report.sh"
  "$SCRIPT_DIR/token-report.sh" || echo "⚠️ token-report.sh failed"
fi
```

## ファイル変更一覧

| ファイル | 操作 |
|---------|------|
| `.claude/skills/mobileapp-builder/token-report.sh` | 新規作成 |
| `.claude/skills/mobileapp-builder/references/us-010-report.md` | 新規作成 |
| `.claude/skills/mobileapp-builder/prd.json` | US-010 追加 |
| `.claude/skills/mobileapp-builder/ralph.sh` | `--model sonnet` + 完了後 token-report.sh 呼び出し |
| `.claude/skills/mobileapp-builder/CLAUDE.md` | US-010 Slack report フォーマット追加 |

## 検証

1. EyeRest のログで `token-report.sh` を手動実行 → `token-report.json` が正しく生成されるか確認
2. ralph.sh の `--model sonnet` 変更後、次回ビルドでSonnet動作確認
3. US-010 の X 投稿フローは次のアプリ完了時にテスト
