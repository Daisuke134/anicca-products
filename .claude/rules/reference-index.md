# 参照先インデックス

## `.claude/rules/`（毎セッション自動読み込み）

`coding-style.md`, `git-workflow.md`, `testing-strategy.md`, `security.md`, `skill-subagent-usage.md`, `dev-workflow.md`, `worktree.md`, `deployment.md`, `spec-writing.md`, `tool-usage.md`, `persona.md`, `mcp-openclaw.md`, `serena-usage.md`, `api-compatibility.md`, `session-management.md`, `reference-index.md`, `skill-authoring.md`

## `.cursor/plans/reference/`（自動読み込みなし — 必要時にReadで参照）

| ファイル | 内容 | いつ読む |
|---------|------|---------|
| `secrets.md` | GitHub Secrets、Railway環境変数詳細、DB Proxy URL | デプロイ・Secret設定時 |
| `infrastructure.md` | Cronジョブ構成、Railway運用・サービス名・URL、1.5.0教訓 | インフラ・Railway作業時 |
| `openclaw-learnings.md` | OpenClaw スキル作成ルール、ツール使い分け、失敗から学んだこと | OpenClaw 作業時（必読） |
| `openclaw-anicca.md` | **Anicca OpenClaw 現在の状態・機能・スキル・壊れてるもの一覧** | **OpenClaw 作業時（必読）。変更後は必ず更新** |
| `daily-metrics.md` | Daily Metrics Report設定、ASC API Key、KPI目標 | メトリクス作業時 |
