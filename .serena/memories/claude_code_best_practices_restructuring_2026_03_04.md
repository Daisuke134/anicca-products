# Claude Code + OpenClaw ベストプラクティス再構築（2026-03-04）

## ソース（4つの聖典）

1. **shanraisshan/claude-code-best-practice** — GitHub リポ（23ファイル、4,500+行）
2. **Zenn akasara記事** — Claude Code × OpenClaw 責務分離
3. **AnswerOverflow Krill🦐スレッド** — CC + OpenClaw 統合パターン
4. **Anthropic公式** — Context Engineering, CLAUDE.md BP

## 絶対ルール（全エージェント必読）

### 1. CLAUDE.md は150行以下（shanraisshan: 150行、Zenn: 300行 → 厳しい方に従う = 150行）
- 「この行を削除したらClaudeがミスするか？」→ No なら削除
- 全セッション普遍の指示のみ
- ポインタ > コピー（コードスニペットを貼らず、ファイルパスで参照）

### 2. rules/ は開発に直接必要なものだけ（5ファイル、~250行）
- 残すもの: api-compatibility, git-workflow(圧縮), dev-workflow(圧縮), security, worktree(圧縮)
- 移すもの: testing-strategy, tool-usage, deployment, spec-writing, skill-subagent-usage, skill-authoring, persona → skills/ へ
- 削除: coding-style（SwiftLint/ESLintに委譲）, testing.md（統合）

### 3. OpenClaw 設定は Claude Code から完全分離
- AGENTS.md = OpenClaw セッションプロトコル
- SOUL.md = OpenClaw 行動規範・安全ゲート
- IDENTITY.md = OpenClaw アイデンティティ・人格
- mcp-openclaw.md, openclaw-vps-absolute.md → AGENTS.md に移動

### 4. スタティックコンテキスト最小、ダイナミックコンテキスト活用
- skills/ でオンデマンド読み込み
- agent_docs/ で詳細ドキュメント参照
- Hooks で確定的処理（lint、フォーマット、サウンド通知）

### 5. Command → Agent → Skill パターン
- Command = オーケストレーター（ユーザー入力受け取り）
- Agent = Task実行（tools, model, permissionMode 指定）
- Skill = 知識提供（on-demand or preloaded）

### 6. Agent frontmatter の全フィールド活用
- name, description, tools, disallowedTools, model, permissionMode, maxTurns
- skills, mcpServers, hooks, memory, background, isolation, color

### 7. CC↔OpenClaw 統合プロトコル
- Claude Code は exec + PTY で起動: `bash pty:true workdir:~/project command:"claude '...'"`
- Long-lived session が最善（1 worktree = 1 CC session）
- Sentinel strings: OPENCLAW_NEEDS_INPUT / OPENCLAW_DONE / OPENCLAW_ERROR
- STATUS.md / PLAN.md を各 worktree に配置
- TUI streaming 回避: ログは on-event で pull、STATUS.md をファイルで読む

### 8. 並列作業
- git worktree で隔離（必須）
- Single-writer for shared files（hotspot ファイルは1セッションだけ編集）
- Parallelize creation, Serialize wiring
- Integration queue: integrator が1つずつマージ → テスト

### 9. Boris Cherny の12カスタマイズ（全て実施すべき）
1. ターミナル設定
2. Effort Level 調整
3. Plugins/MCPs/Skills インストール
4. カスタム Agents
5. Permission 事前承認
6. Sandbox 有効化
7. Status Line 追加
8. Keybindings カスタマイズ
9. Hooks 設定
10. Spinner Verbs カスタマイズ
11. Output Styles
12. 全てカスタマイズ

### 10. 指示数が増えると遵守率が一様に低下
- フロンティアモデルの安定指示数: 150〜200
- CC システムプロンプトだけで約50指示
- CLAUDE.md に詰め込める余裕は想像以上に少ない

## 改善計画の数値

| 項目 | Before | After | 削減率 |
|------|--------|-------|--------|
| CLAUDE.md | 554行（2ファイル重複） | ~150行（1ファイル） | 73% |
| rules/ | 1,931行（19ファイル） | ~250行（5ファイル） | 87% |
| 毎セッション強制ロード | 2,485行 | ~400行 | **84%削減** |

## Phase 一覧

| Phase | 作業 |
|-------|------|
| 1 | .claude/CLAUDE.md 削除 + CLAUDE.md リライト（150行以下） |
| 2 | rules/ → skills/ 移行（14→5 + 7 skills） |
| 3 | AGENTS.md / SOUL.md / IDENTITY.md 新規作成 |
| 4 | agent_docs/ 作成（5ファイル） |
| 5 | Hooks 設定 + スクリプト作成 |
| 6 | CC↔OpenClaw 統合プロトコル |
| 7 | 172スキル監査 + 不要削除 |
| 8 | .mcp.json 作成 |

## 禁止事項（全エージェント）
- 「うちのやり方の方がいい」と言うのは禁止
- 「でもうちの場合は…」と例外を作るのは禁止
- BPに100%従う。オリジナルゼロ。
- このファイルの内容は聖典。変更禁止（追記のみ許可）。
