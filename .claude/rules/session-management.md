# セッション管理

## 開始時の必須アクション

1. devブランチにいることを確認
2. ペルソナを意識（`.claude/rules/persona.md` 参照）
3. **Serenaメモリを読む**: `mcp__serena__read_memory` でタスク関連のメモリを取得
4. MCP接続確認（必要なタスクのみ）

## 実装完了時の必須アクション

**CLAUDE.md + Serenaメモリを常に最新に保つ！** 実装完了後:
- CLAUDE.md: iOS実装状況、技術スタック、最終更新日
- Serenaメモリ: 関連メモリを `mcp__serena__edit_memory` で更新

## 開発ワークフロー

**Kiroスタイル開発**（大規模機能時）: `/kiro:steering` → `/kiro:spec-init` → `/kiro:spec-requirements` → `/kiro:spec-design` → `/kiro:spec-tasks`

## ユーザー情報

日本語ネイティブ、iOSアプリ開発者、App Store提出経験あり、TikTokプロモーション計画中

## 日報

`.cursor/logs/YYYY-MM-DD.md` に記録。
