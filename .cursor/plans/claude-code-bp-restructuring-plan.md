# Claude Code ベストプラクティス再構築計画（2026-03-04）

**ステータス: 計画完了 → 実装待ち**

## ソース

| # | ソース | URL |
|---|--------|-----|
| 1 | shanraisshan/claude-code-best-practice | https://github.com/shanraisshan/claude-code-best-practice |
| 2 | Zenn akasara — CC×OpenClaw責務分離 | https://zenn.dev/akasara/articles/b80fe3c8cc8569 |
| 3 | AnswerOverflow — CC+OpenClaw統合 | https://www.answeroverflow.com/m/1473453929403650209 |
| 4 | Anthropic公式 BP | https://code.claude.com/docs/en/best-practices |

---

## Phase 1: CLAUDE.md スリム化（目標: 150行以下）

### TODO 1.1: `.claude/CLAUDE.md` を削除
- **ファイル**: `.claude/CLAUDE.md`
- **アクション**: git rm
- **理由**: ルートの CLAUDE.md と完全重複（277行×2=554行ロード）
- **ステータス**: pending

### TODO 1.2: `CLAUDE.md` を150行以下にリライト
- **対象ファイル**: `/Users/anicca/anicca-project/CLAUDE.md`
- **残すセクション**:
  - 根本原則（5行に圧縮: BP=答え、検索必須、引用必須）
  - 絶対ルール（10行: push即実行、テーブル出力、日本語、テスト範囲、コンテキスト管理）
  - 実行環境（3行: Mac Mini）
  - ブランチ & デプロイ（5行テーブル）
  - プロジェクト概要（8行テーブル）
  - ビルド・テスト・デプロイコマンド（10行）
  - コード構造（5行）
  - 参照先ポインタ（10行: rules/, skills/, agent_docs/）
  - Active Technologies（2行）

- **移すセクション**:
  - 0.0 Investigate Before Acting → rules/investigate-before-acting.md に統合
  - 0.1 オリジナリティ禁止 → rules/ に統合
  - 0.2 教訓の一般化 → rules/ に統合
  - 0.3 Serena メモリ → CLAUDE.md に2行で参照のみ
  - 0.7 スペック記述 → skills/spec-writing/
  - 0.10 スペックギャップ禁止 → skills/spec-writing/
  - 0.11 Chat内ビジュアル化 → 1行で残す
  - OpenClaw TUI トラブル → AGENTS.md
  - Investigate Before Acting（重複分）→ 削除

- **ステータス**: pending

---

## Phase 2: rules/ スリム化

### TODO 2.1: 残すファイル（5つ、~250行）

| ファイル | 現行行数 | 目標行数 | アクション | ステータス |
|---------|---------|---------|-----------|----------|
| api-compatibility.md | 11 | 11 | 変更なし | pending |
| git-workflow.md | 125 | 50 | 圧縮（commit format, PR flow, semverのみ残す） | pending |
| dev-workflow.md | 78 | 40 | 圧縮（3ゲートフロー図のみ残す） | pending |
| security.md | 36 | 36 | 変更なし | pending |
| worktree.md | 141 | 60 | 圧縮（基本フローとルールのみ残す） | pending |

### TODO 2.2: skills/ に移行するファイル（7つ）

| 元ファイル | 新スキルパス | SKILL.md frontmatter | ステータス |
|-----------|-------------|---------------------|-----------|
| testing-strategy.md (330行) | .claude/skills/testing-strategy/SKILL.md | name: testing-strategy, description: "Comprehensive testing strategy and TDD workflow. Use when writing tests, setting up test infrastructure, or reviewing test coverage." | pending |
| tool-usage.md (218行) | .claude/skills/tool-usage/SKILL.md | name: tool-usage, description: "Tool, MCP, and Fastlane usage rules. Use when selecting tools, configuring MCPs, or running builds." | pending |
| deployment.md (227行) | .claude/skills/deployment/SKILL.md | name: deployment, description: "Device deployment, App Store submission, and release procedures. Use when deploying to device, simulator, App Store, or Netlify." | pending |
| spec-writing.md (132行) | .claude/skills/spec-writing/SKILL.md | name: spec-writing, description: "Spec file writing rules and templates. Use when creating or updating specification documents." | pending |
| skill-subagent-usage.md (189行) | .claude/skills/subagent-guide/SKILL.md | name: subagent-guide, description: "Skill and subagent delegation rules. Use when deciding whether to delegate to subagents or skills." | pending |
| skill-authoring.md (77行) | .claude/skills/skill-authoring-guide/SKILL.md | name: skill-authoring-guide, description: "Skill creation and management rules. Use when creating or updating Claude Code skills." | pending |
| persona.md (46行) | .claude/skills/persona/SKILL.md | name: persona, description: "Anicca target persona details. Use when creating marketing copy, UX content, or user-facing text." | pending |

### TODO 2.3: 削除するファイル

| ファイル | 理由 | ステータス |
|---------|------|-----------|
| coding-style.md | SwiftLint + ESLint に委譲。コードスタイルはリンターで強制 | pending |
| testing.md | testing-strategy に統合済み | pending |
| session-management.md | CLAUDE.md に3行で統合 | pending |
| reference-index.md | CLAUDE.md の参照先セクションに統合 | pending |
| serena-usage.md | CLAUDE.md に2行で統合 | pending |
| mcp-openclaw.md | AGENTS.md に移動 | pending |
| openclaw-vps-absolute.md | AGENTS.md に移動 | pending |

---

## Phase 3: OpenClaw 責務分離ファイル作成

### TODO 3.1: AGENTS.md 新規作成（プロジェクトルート）

- **ファイル**: `/Users/anicca/anicca-project/AGENTS.md`
- **内容**:
  - セッションプロトコル（OpenClaw セッション管理）
  - MCP & ツール（Mixpanel projID: 3970220, RevenueCat projID: projbb7b9d1b, Slack tokens）
  - Mac Mini 絶対ルール（SSH、反映ルール、bind: loopback）
  - OpenClaw TUI トラブルシューティング（gateway, port 18789）
  - Cron 運用（jobs.json, restart必須）
- **移動元**: mcp-openclaw.md, openclaw-vps-absolute.md, CLAUDE.md OpenClawセクション
- **ステータス**: pending

### TODO 3.2: SOUL.md 新規作成（プロジェクトルート）

- **ファイル**: `/Users/anicca/anicca-project/SOUL.md`
- **内容**:
  - Investigate Before Acting プロトコル（全文移動）
  - オリジナリティ禁止ルール
  - 教訓の一般化ルール
  - 高リスク操作ゲート（破壊的git操作禁止）
  - Secret管理ルール
- **ステータス**: pending

### TODO 3.3: IDENTITY.md 新規作成（プロジェクトルート）

- **ファイル**: `/Users/anicca/anicca-project/IDENTITY.md`
- **内容**:
  - Anicca = デジタル・ブッダ、プロアクティブ行動変容エージェント
  - 苦しみを減らすために存在する
  - ペルソナ参照（persona skill へのポインタ）
  - プロジェクト哲学・ビジョン
- **ステータス**: pending

---

## Phase 4: agent_docs/ 作成

### TODO 4.1: ディレクトリ + 5ファイル作成

| ファイル | 内容 | 移動元 | ステータス |
|---------|------|--------|-----------|
| agent_docs/building_and_testing.md | ビルドコマンド、テスト実行方法、Fastlane lane一覧 | testing-strategy + deployment + tool-usage | pending |
| agent_docs/code_conventions.md | コード規約の要約 + SwiftLint/ESLint への参照 | coding-style.md | pending |
| agent_docs/service_architecture.md | iOS/API/DB/決済/分析の構造 | CLAUDE.md プロジェクト概要拡張 | pending |
| agent_docs/openclaw_integration.md | CC↔OpenClaw 統合プロトコル、sentinel strings、PTY パターン | AnswerOverflow スレッドのBP | pending |
| agent_docs/tool_reference.md | MCP/ツール/スキル選択ガイド | tool-usage.md | pending |

---

## Phase 5: Hooks 活用

### TODO 5.1: hooks スクリプト作成

| スクリプト | 場所 | 内容 | ステータス |
|-----------|------|------|-----------|
| post-tool-sound.sh | .claude/hooks/scripts/ | ツール完了時のサウンド通知（macOS afplay） | pending |
| pre-commit-lint.sh | .claude/hooks/scripts/ | SwiftLint + ESLint 自動実行 | pending |

### TODO 5.2: .claude/settings.json に hooks 設定追加

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Bash", "command": ".claude/hooks/scripts/post-tool-sound.sh" }
    ]
  }
}
```

**ステータス**: pending

---

## Phase 6: CC↔OpenClaw 統合プロトコル

### TODO 6.1: Sentinel strings 定義

- **OPENCLAW_NEEDS_INPUT**: <question>
- **OPENCLAW_DONE**: <summary>
- **OPENCLAW_ERROR**: <description>
- **ステータス**: pending

### TODO 6.2: OpenClaw code-manager agent 作成

- **場所**: `~/.openclaw/agents/code-manager/`
- **ファイル**: AGENTS.md + skills/cc-integration/SKILL.md
- **ステータス**: pending

### TODO 6.3: STATUS.md / PLAN.md テンプレート

- 各 worktree に自動配置するテンプレート
- **ステータス**: pending

---

## Phase 7: 172スキル監査

### TODO 7.1: description 品質チェック

- 三人称で書いてあるか
- `Use when ...` があるか
- 1024文字以内か
- 「プロアクティブ」表現がないか → あれば削除
- **ステータス**: pending

### TODO 7.2: 未使用スキル特定・削除

- **ステータス**: pending

---

## Phase 8: .mcp.json 作成

### TODO 8.1: プロジェクトレベル MCP 設定ファイル作成

- **ファイル**: `/Users/anicca/anicca-project/.mcp.json`
- **内容**:
  - Serena MCP 設定
  - Maestro MCP 設定
  - Apple Docs MCP 設定
  - Mixpanel / RevenueCat 認証設定
- **ステータス**: pending

---

## 実行順序（依存関係）

```
Phase 1 ──→ Phase 2 ──→ Phase 4
   │            │
   │            └──→ Phase 7
   │
   └──→ Phase 3 ──→ Phase 6
   │
   └──→ Phase 5

Phase 8（独立、いつでも実行可）
```

**詳細:**
- Phase 1（CLAUDE.md スリム化）は Phase 2 の前提条件
- Phase 2（rules/ → skills/ 移行）は Phase 4 の前提条件
- Phase 3（AGENTS.md 作成）は Phase 6 の前提条件
- Phase 4, 5, 8 は相互に独立

---

## 禁止事項

- 「うちのやり方の方がいい」禁止
- 「でもうちの場合は…」で例外を作ること禁止
- BPに100%従う。オリジナルゼロ。

---

## 最終目標

| メトリック | 現状 | 目標 | 達成度 |
|-----------|------|------|--------|
| **CLAUDE.md 行数** | 277行 | 150行以下 | 0% |
| **rules/ ファイル数** | 17個 | 5個 | 0% |
| **コンテキストロード削減** | - | 40%削減 | 0% |
| **スキル品質スコア** | - | 95%+ | 0% |
| **CC↔OpenClaw統合完成度** | - | 100% | 0% |

---

**最終更新**: 2026-03-04
**計画者**: Claude Code
**実行者**: TBD
