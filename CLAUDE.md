# Anicca プロジェクト - 開発ガイドライン

## 絶対ルール

### 0. 意思決定ルール（最重要）

曖昧なものは『AskUserQuestionTool』を使ってヒヤリング。**選択肢を出してユーザーに決めさせるのは禁止。**

どんな場合でも：1. ベストプラクティスを調べる → 2. 自分で判断して **1つに決める** → 3. その理由を述べる

### 0.1 自律的ベストプラクティス検索（絶対ルール）

**技術判断する前に、必ずベストプラクティスを検索する。ユーザーに言われなくても。**

| 判断カテゴリ | 例 |
|-------------|-----|
| アーキテクチャ変更（3ファイル以上） | サービス層追加、データフロー変更 |
| API設計・データモデル変更 | エンドポイント追加、スキーマ変更 |
| 外部依存ライブラリの選定・更新 | SDK選定、バージョンアップ |
| パフォーマンス・セキュリティ判断 | キャッシュ戦略、認証方式 |
| 新しいパターン導入 | 状態管理、テストフレームワーク |

検索手段（優先順）: `mcp__exa__web_search_exa` → `mcp__context7__query-docs` → `mcp__apple-docs__*` → `.claude/rules/`

### 0.2 Serena メモリ活用ルール（絶対ルール）

**プロジェクト知識は `.serena/memories/` に集約する。** 詳細: `.claude/rules/serena-usage.md`

### 0.4 git push ルール（絶対ルール）

**push時は `git add -A` で全ファイルをステージしてpushする。** 他エージェントの変更も含めて全部。

### 0.5 出力形式ルール

**説明・チェックリスト・比較・タスクリストは常にテーブル形式で出力する。箇条書きやリスト形式は禁止。**

### 0.6 テスト範囲ルール

**テストは実装した部分だけ。変更していないものはテストしない。** チェックリスト・手順はテーブル形式。

### 0.7 スペック記述ルール（絶対ルール）

**スペック・TODO・計画書に「任意」「optional」「中期」「推奨」等の曖昧表現を禁止。** 全て MUST。やらないなら書かない。詳細: `.claude/rules/spec-writing.md`

### 0.8 コンテキスト管理ルール（絶対ルール）

| ルール | 詳細 |
|--------|------|
| 手動 /compact | コンテキスト50%到達で `/compact` を手動実行。自動compactまで待たない |
| サブタスク上限 | サブタスクは50%コンテキスト以内で完了するサイズに分割する |
| タスク完了即コミット | タスク完了したら即座にコミットする。まとめてコミットしない |
| 小タスク = vanilla CC | 5行以下の変更にスキル/サブエージェント不要。詳細: `.claude/rules/skill-subagent-usage.md` |

### 0.9 OpenClaw / VPS 絶対ルール（絶対ルール）

**Anicca の実行環境は VPS。**「VPS に反映する」「VPS で確認する」と書いてあれば、エージェントが自分で `ssh anicca@46.225.70.241` を実行し、反映・確認まで完了する。

**絶対禁止:** (1)「VPS にアクセスできません」「SSH できません」と言い切ること (2) ユーザーにコマンドを叩かせること (3) ローカルだけで確認して「VPS も同じはず」とすること (4) ローカルで編集して「直りました」で終わること（VPS に反映して初めて完了） (5) ユーザーへの有罪推定的な質問 (6) 上記を破る言い訳。詳細: `.cursor/rules/openclaw-vps-absolute.md`

### 言語ルール

**回答は常に日本語**（ユーザーが英語でも日本語で返す）。CLAUDE.mdやドキュメントは日本語で記述。

### コンテンツ変更ルール

**変更を実装する前に、必ず Before/After をチャットで示す。** 承認後に実装。

### CLAUDE.md メンテナンスルール

| 判断 | 置き場所 |
|------|---------|
| 毎セッション必要？ | CLAUDE.md（**150行以下を維持**） |
| 特定ドメインのルール？ | `.claude/rules/` |
| 再利用ワークフロー？ | `.claude/skills/` |
| 低頻度の参照情報？ | `.cursor/plans/reference/` |

---

## ブランチ & デプロイ

| ブランチ | 役割 | Railway 環境 |
|---------|------|-------------|
| `main` | Production デプロイ済み | Production（自動デプロイ） |
| `release/x.x.x` | App Store 提出スナップショット | - |
| `dev` | 開発中（= trunk） | Staging（自動デプロイ） |

**フロー:** dev → テスト → main（Prod） → release/x.x.x → App Store。Backend先にデプロイ。

**Railway/後方互換の詳細:** `.cursor/plans/reference/infrastructure.md`, `.claude/rules/api-compatibility.md`

**マージ前の最終確認:** エージェントは勝手にマージしない。チェックリスト（テーブル形式）→ ユーザー「OK」待ち。

**ワークツリー:** 原則使う。ドキュメント変更のみdev直接コミット可。詳細: `.claude/rules/worktree.md`

**Fastlane（絶対）:** xcodebuild 直接実行禁止。`cd aniccaios && fastlane <lane>`。詳細: `.claude/rules/tool-usage.md`。**Ruby/Bundler・wait_for_processing・審査提出でハマった知見:** `.serena/memories/fastlane_app_store_submission_learnings_2026_02_14.md`

**Maestro E2E（絶対）:** テスト前に `.claude/skills/maestro-ui-testing/SKILL.md` を読む。

**自律開発モード:** 「終わるまでやれ」→ `.claude/skills/ralph-autonomous-dev/SKILL.md`

---

## プロジェクト概要

**Anicca** = 行動変容をサポートするiOSアプリ。AIを活用したプロアクティブな通知で、ユーザーの「苦しみ」に寄り添う。

| 項目 | 値 |
|------|-----|
| iOS | Swift/SwiftUI (iOS 15+, Xcode 16+) |
| API | Node.js/Express (Railway) |
| DB | PostgreSQL/Prisma (25テーブル) |
| 決済 | RevenueCat + Superwall ($9.99/月, 1週間トライアル) |
| 分析 | Mixpanel |
| AI | OpenAI (Commander Agent) |
| E2E | Maestro |
| VPS | OpenClaw (GPT-4o, Slack連携) |

**ディレクトリ:** `aniccaios/` iOS | `apps/api/` API | `apps/landing/` LP | `.cursor/plans/` 仕様書 | `.serena/memories/` メモリ

**Hook Card / 通知ペア（SSOT）:** `.cursor/plans/ios/1.6.3/ios-hook-card.md` にカード文言・バリアント・全通知→カードペア一覧がある。常時更新すること。

**ペルソナ:** 6-7年間習慣化に失敗し続けている25-35歳。詳細: `.claude/rules/persona.md`

### iOS実装状況（2026年2月9日時点）

| 項目 | 内容 |
|------|------|
| バージョン | 1.6.2 |
| メイン画面 | `MainTabView` → `MyPathTabView` + NudgeCard + Paywall |
| ローカライズ | 6言語 (ja, en, de, es, fr, pt-BR) |

**詳細:** `mcp__serena__read_memory("ios_app_architecture")`, `mcp__serena__read_memory("nudge_system")`

---

最終更新: 2026年2月14日
