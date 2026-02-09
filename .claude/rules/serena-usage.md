# Serena メモリ活用ルール

**プロジェクト知識は `.serena/memories/` に集約する。** CLAUDE.mdのコンテキスト圧迫を防ぐ。

## 使い方

| 場面 | アクション |
|------|-----------|
| セッション開始時 | 関連するSerenaメモリを `mcp__serena__read_memory` で読む |
| 新しい知見・設計判断が出た時 | `mcp__serena__write_memory` で記録 |
| 実装完了後 | 関連メモリを `mcp__serena__edit_memory` で更新 |
| ファイル編集（Swift/TS） | `mcp__serena__find_symbol` / `mcp__serena__replace_symbol_body` を活用 |
| コード探索 | `mcp__serena__get_symbols_overview` → `mcp__serena__find_symbol` で効率的に |

## 主要メモリ一覧

| メモリ名 | 内容 |
|---------|------|
| `ios_app_architecture` | iOS画面構成、オンボーディング、Nudge、サブスク、API連携 |
| `api_backend_architecture` | APIエンドポイント、Prismaテーブル、Cron、Railway構成 |
| `nudge_system` | Nudgeシステム全体設計（ルールベース+LLM、フィードバックループ） |
| `project_overview` | プロジェクト概要、技術スタック、リポジトリ構成 |
| `project_structure` | ディレクトリ構成、エントリーポイント |
| `closed_loop_ops_design` | 1.6.2 Closed-Loop Ops設計 |
| `openclaw-anicca-setup` | OpenClaw VPS設定・運用 |
| `daily_dhamma_development_workflow` | Daily Dhamma開発ワークフロー |
| `code_style_conventions` | コードスタイル規約 |
| `app_store_connect_workflow` | App Store Connect提出手順 |
| `user_preferences_decision_making` | ユーザー好み・意思決定パターン |
