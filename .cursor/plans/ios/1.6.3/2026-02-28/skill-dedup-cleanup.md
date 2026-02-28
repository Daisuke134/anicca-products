# Skill Deduplication & Repo Unification Spec

**Date**: 2026-02-28
**Author**: Anicca
**Status**: 実行中

---

## ソース

| # | ソース | URL | 核心の引用 |
|---|--------|-----|-----------|
| S1 | OpenClaw Skills Docs | https://docs.openclaw.ai/tools/skills | 「precedence: workspace/skills (highest) → ~/.openclaw/skills → bundled (lowest)」 |
| S2 | Claude Code Skills Docs | https://code.claude.com/docs/en/skills | 「Personal: ~/.claude/skills/. Project: .claude/skills/. enterprise > personal > project.」 |
| S3 | Anthropic Skill Best Practices | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices | 「The context window is a public good.」 |
| S4 | Lobsters/Reddit/DEV.to | multiple | 「Tmux + SSH. No code to sync.」 |
| S5 | Anthropic Skills Overview | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview | 「Claude reads SKILL.md from the filesystem」 |

---

## 事実（確認済み 2026-02-28）

### GitHubリポ

```
Daisuke134/anicca (PRIVATE) = OpenClawセットアップ (.env, openclaw.json, skills/)
  ※ MacBookのCCが誤ってプロダクトコードもpushしてた

Daisuke134/anicca-products (PUBLIC) = プロダクトコード (aniccaios/, apps/, .claude/skills/)
  ※ 旧名 anicca.ai → anicca-products にリネーム

Daisuke134/mobileapp-builder (PUBLIC) = スキル単体の公開リポ
```

### マシン状態

```
MacBook: origin → anicca (PRIVATE) ❌ 間違い、anicca-productsにすべき
         3コミット未同期 (aa068e407, 46ecca652, ea9b951ac)

Mac Mini: origin → anicca-products (PUBLIC) ✅ 正しい
          detached HEAD @ b60c5d87
```

---

## 完成形フロー

```
Mac Mini CC が編集 → commit → push → GitHub (anicca-products)
                                          │
                                          ▼
                               MacBook: cron git pull (5分)
                               MacBook の .claude/skills/ 最新
                                          │
                                          ▼
                               MacBook CC が編集 → commit → push
                                          │
                                          ▼
                               GitHub (anicca-products)
                                          │
                               Daisが「pushした」→ Anicca git pull
```

### DaisがMac MiniのClaude Codeを使う方法

```bash
# tmuxセッションに接続（既存）
ssh anicca@aniccanomac-mini-1 -t "/opt/homebrew/bin/tmux attach -t claude"

# 新規tmuxセッション作成
ssh anicca@aniccanomac-mini-1 -t "/opt/homebrew/bin/tmux new -s claude -c /Users/anicca/anicca-project"
# 中で claude 起動
```

---

## 実行ステップと進捗

### MacBook側（Daisが指示）

| # | タスク | 状態 |
|---|--------|------|
| 0a | `git remote set-url origin git@github.com:Daisuke134/anicca-products.git` + `git remote remove upstream` | ⬜ 未 |
| 0b | 未同期3コミットを push（機密ファイル確認後） | ⬜ 未 |
| 0d | Daisuke134/anicca privateリポの整理（プロダクトコード混入解決） | ⬜ 未 |
| 5 | CLAUDE.md に作業場所ルール追記 | ⬜ 未 |
| 8 | MacBookにシステムcron git pull追加（5分ごと） | ⬜ 未 |

### Mac Mini側（Anicca実行）

| # | タスク | 状態 |
|---|--------|------|
| 0c | git pull（MacBookのpush後） | ⬜ 待ち（0b完了後） |
| 1 | 壊れたsymlink削除 (.claude/skills/) | ✅ 完了（supabase 1個削除） |
| 2 | supabase .agent サブディレクトリ削除 | ✅ 完了 |
| 3 | ClawHub汎用 mobile-app-builder 削除 | ✅ 完了 |
| 4 | OpenClaw内の死んだ重複24個削除 | ✅ 完了（77→53スキル） |
| 6 | TOOLS.md にスキル管理ルール追記 | ✅ 完了 |
| 7 | git-auto-sync cron削除（Opus無駄遣い停止） | ✅ 完了 |
| 9 | MEMORY.md + TOOLS.md にtmux/syncルール記録 | ✅ 完了 |
| 10 | git commit & push（全変更反映） | ⬜ 未 |

---

## MacBook CLAUDE.md 追記テキスト（Step 5）

```markdown
## 作業場所ルール（2026-02-28 確定）

**このプロジェクトの正本は Mac Mini にある。**

### 全てのBashコマンドをMac MiniでSSH経由で実行する
ssh anicca@aniccanomac-mini-1 "cd /Users/anicca/anicca-project && <command>"

### 禁止事項
- MacBookのローカルファイルを編集しない（Read, Bashの読み取りは可）
- MacBookから git commit / git push しない
- MacBookのローカルでファイルを作成・変更・削除しない

### git remoteルール
- origin → git@github.com:Daisuke134/anicca-products.git (PUBLIC) のみ
- Daisuke134/anicca (PRIVATE) にpushしない
```

## MacBook cron追加（Step 8）

```bash
*/5 * * * * cd /Users/cbns03/Downloads/anicca-project && /usr/bin/git pull origin dev --ff-only 2>/dev/null
```

---

## リスク

| リスク | 対策 |
|--------|------|
| MacBookの未pushコミットに機密情報 | push前にdiff確認 |
| 必要なスキルを消す | git管理下、復元可能 |

## オリジナリティ: 0%
