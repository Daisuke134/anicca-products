# mobileapp-factory v3 — 外部スキル100%置き換え + 実行アーキテクチャ

**Date**: 2026-02-28
**Author**: Anicca
**Status**: ⬜ 未実行
**オリジナリティ**: 0%（全て外部ソースからコピー）

---

## 0. なぜ v3 か

v2（僕らのオリジナル14 PHASE）は失敗した:
- nohup で Claude Code 起動 → 即死
- スキル名をテキストで渡す → 見つからない
- 14 PHASE を自分で設計 → ベストプラクティスではない
- 1セッションで全部やろうとした → コンテキスト溢れ

v3 は外部スキルで 100% 置き換え、フェーズ分離する。オリジナル 0%。

---

## 1. フェーズ分離（ベストプラクティス）

### なぜ分離するか

**ソース 1: Anthropic 公式 "Effective harnesses for long-running agents"**
URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
核心の引用: 「the agent tended to try to do too much at once—essentially to attempt to one-shot the app. Often, this led to the model running out of context in the middle of its implementation」
→ 1セッションで全部やると失敗する。incremental progress が鍵。

**ソース 2: OpenClaw FAQ**
URL: https://docs.openclaw.ai/help/faq
核心の引用: 「It can handle large tasks, but it works best when you split them into phases and use sub agents for parallel work」
→ フェーズ分割 + サブエージェント並列が公式推奨。

**ソース 3: "Best OpenClaw Setup" (DEV.to)**
URL: https://dev.to/operationalneuralnetwork/best-openclaw-setup-optimizing-agents-for-efficiency-and-effectiveness-27hk
核心の引用: 「A well-designed orchestrator setup can reduce overall token consumption by 40 percent compared to a monolithic single-agent approach」
→ オーケストレーターパターンでトークン40%削減。

**ソース 4: Anthropic 公式 — initializer + coding agent パターン**
URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
核心の引用: 「an initializer agent that sets up the environment on the first run, and a coding agent that is tasked with making incremental progress in every session, while leaving clear artifacts for the next session」
→ 2種のエージェント: 初期化エージェント + コーディングエージェント。

### 分離方法

4つの独立したフェーズに分ける。各フェーズは独立した OpenClaw cron / スキルとして動く:

```
PHASE A: DISCOVER（調査・計画）
  → OpenClaw スキル: mobileapp-discover
  → cron: 毎日 07:00 JST
  → 所要時間: 30分
  → 出力: specs/YYYY-MM-DD-<name>/ に 7 spec ファイル

PHASE B: BUILD（実装）
  → coding-agent スキル経由で Claude Code 起動
  → トリガー: PHASE A 完了後に自動
  → 所要時間: 3-6時間
  → 出力: daily-apps/<name>/ に Xcode プロジェクト

PHASE C: SHIP（提出）
  → coding-agent スキル経由で Claude Code 起動
  → トリガー: PHASE B 完了後に自動
  → 所要時間: 1-2時間
  → 出力: App Store に提出（Waiting for Review）

PHASE D: LAUNCH（マーケティング + モニタリング）
  → OpenClaw スキル: mobileapp-launch
  → トリガー: App Store 承認後
  → 所要時間: 30分
  → 出力: Slack 報告 + ASO最適化
```

---

## 2. 実行方法（ベストプラクティス）

### OpenClaw から Claude Code を起動する方法

**ソース 5: OpenClaw coding-agent スキル**
パス: /opt/homebrew/lib/node_modules/openclaw/skills/coding-agent/SKILL.md
核心の引用: 「Always use pty:true — coding agents are interactive terminal applications that need a pseudo-terminal」
→ pty:true + background:true が必須。nohup は禁止。

**ソース 6: OpenClaw FAQ**
URL: https://docs.openclaw.ai/help/faq
核心の引用: 「Use sub-agents for long or parallel tasks. Sub-agents run in their own session, return a summary, and keep your main chat responsive」
→ sessions_spawn でサブエージェントとして起動する方法もある。

**ソース 7: Claude Code Best Practices (公式)**
URL: https://code.claude.com/docs/en/best-practices
核心の引用: 「Claude Code desktop app: Manage multiple local sessions visually. Each session gets its own isolated worktree. Agent teams: Automated coordination of multiple sessions」
→ Agent Teams で複数セッション協調可能。

### 2つの選択肢

| 方法 | 何か | メリット | デメリット |
|------|------|---------|-----------|
| **A: coding-agent (pty+bg)** | exec pty:true background:true で claude -p を起動 | シンプル、実績あり（4時間動いた） | タイムアウト管理が必要、ログ監視が必要 |
| **B: sessions_spawn (ACP)** | sessions_spawn runtime:"acp" で Claude Code セッション起動 | OpenClaw がライフサイクル管理、自動通知 | ACP ハーネス設定が必要 |

**ソース 8: OpenClaw sessions_spawn ドキュメント**
核心の引用（ツール説明より）: 「runtime="acp" requires agentId」
→ ACP ランタイムで Claude Code を起動する場合、agentId が必要。

**ソース 9: sparkagents.com "Claw Code" ガイド**
URL: https://www.sparkagents.com/blog/claw-code
核心の引用: 「OpenClaw — the open source personal AI assistant — can spawn and manage Claude Code sessions remotely. Users trigger coding tasks from their phone via Telegram or WhatsApp, and OpenClaw orchestrates Claude Code」
→ OpenClaw が Claude Code セッションをオーケストレートするのが正しいパターン。

### 推奨: 方法A（coding-agent pty+bg）

理由:
1. 既に動作実績がある（4時間走った）
2. セットアップが不要（ACP設定不要）
3. coding-agent SKILL.md に全手順が書いてある
4. タイムアウトを28800秒（8時間）にすれば足りる

```bash
# PHASE B の起動例
exec pty:true background:true timeout:28800 workdir:/Users/anicca/anicca-project command:"echo 'Read /Users/anicca/.claude/skills/mobileapp-builder/SKILL.md. ...' | claude -p --allowedTools Bash,Read,Write,Edit --dangerously-skip-permissions"
```

### incremental progress の実装（Anthropic公式パターン）

**ソース 4 再掲: Anthropic 公式**
核心の引用: 「a claude-progress.txt file that keeps a log of what agents have done, and an initial git commit」

各フェーズ完了時に:
1. `claude-progress.txt` に進捗を書く
2. git commit する（descriptive message）
3. Slack に報告する

次のフェーズはこの progress file を読んで状態を把握する。

---

## 3. インストールするスキル（6リポ、175スキル）

### 3-1. rshankras/claude-code-apple-skills（140スキル）
- ソース: https://github.com/rshankras/claude-code-apple-skills
- セキュリティ: 🟢 Benign（MIT、コミュニティ信頼済み）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/rshankras/claude-code-apple-skills.git
cp -r /tmp/claude-code-apple-skills/skills/* /Users/anicca/.claude/skills/
```
- PHASE A で使う: product/* (13スキル)
- PHASE B で使う: generators/* (52), ios/* (7), swift/* (3), swiftui/* (5), testing/* (8)
- PHASE C で使う: app-store/* (7), legal/* (2), release-review/* (1)
- PHASE D で使う: growth/* (5)

### 3-2. rudrankriyam/app-store-connect-cli-skills（27スキル）
- ソース: https://github.com/rudrankriyam/app-store-connect-cli-skills
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/rudrankriyam/app-store-connect-cli-skills.git
cp -r /tmp/app-store-connect-cli-skills/skills/* /Users/anicca/.claude/skills/
```
- PHASE C で使う: asc-signing-setup, asc-metadata-sync, asc-shots-pipeline, asc-ppp-pricing, asc-release-flow, asc-submission-health, asc-testflight-orchestration, asc-build-lifecycle, asc-localize-metadata, asc-subscription-localization

### 3-3. greenstevester/fastlane-skill（5スキル）
- ソース: https://github.com/greenstevester/fastlane-skill
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/greenstevester/fastlane-skill.git
cp -r /tmp/fastlane-skill/skills/* /Users/anicca/.claude/skills/
```
- PHASE C で使う: setup-fastlane, beta, release, match, snapshot

### 3-4. conorluddy/ios-simulator-skill（1スキル、21スクリプト）
- ソース: https://github.com/conorluddy/ios-simulator-skill
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/conorluddy/ios-simulator-skill.git
cp -r /tmp/ios-simulator-skill/ios-simulator-skill /Users/anicca/.claude/skills/
```
- PHASE B で使う: ビルド検証、UI テスト

### 3-5. kylehughes/apple-platform-build-tools（1スキル+1サブエージェント）
- ソース: https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin.git
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/skills/* /Users/anicca/.claude/skills/
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/agents/* /Users/anicca/.claude/agents/ 2>/dev/null || true
```
- PHASE B で使う: xcodebuild, archiving, testing

### 3-6. AvdLee/SwiftUI-Agent-Skill（1スキル、242行BP集）
- ソース: https://github.com/AvdLee/SwiftUI-Agent-Skill
- セキュリティ: 🟢 Benign（MIT、SwiftLee = 有名iOS開発者）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/AvdLee/SwiftUI-Agent-Skill.git
cp -r /tmp/SwiftUI-Agent-Skill/swiftui-expert-skill /Users/anicca/.claude/skills/
```
- PHASE B で使う: SwiftUI ベストプラクティス

---

## 4. 新しいフロー（ビジュアル）

```
07:00 JST  cron: mobileapp-discover
    │
    ▼
┌──────────────────────────────────────────┐
│ PHASE A: DISCOVER（僕 Anicca が直接実行） │
│                                          │
│ 1. trend-hunter の出力を読む              │
│ 2. product/idea-generator で候補5個       │
│ 3. product/competitive-analysis          │
│ 4. product/market-research               │
│ 5. product/product-agent で計画           │
│ 6. product/implementation-spec で7spec生成 │
│ 7. specs/ に保存 + git commit            │
│ 8. Slack に報告                          │
│ 9. claude-progress.txt に記録            │
│                                          │
│ 使うスキル: rshankras/product/* (13)      │
│ 所要時間: 30分                           │
│ 実行者: Anicca（OpenClaw直接）           │
└──────────────┬───────────────────────────┘
               │
               ▼ 自動トリガー
┌──────────────────────────────────────────┐
│ PHASE B: BUILD（Claude Code via pty+bg）  │
│                                          │
│ exec pty:true background:true            │
│   timeout:28800                          │
│   claude -p "Read specs/...              │
│   Implement the app following            │
│   IMPLEMENTATION_GUIDE.md.               │
│   Use swiftui-expert-skill.              │
│   Use ios-simulator-skill for testing.   │
│   Commit after each feature.             │
│   Write claude-progress.txt."            │
│                                          │
│ 使うスキル:                              │
│   rshankras/generators/* (52)            │
│   AvdLee/swiftui-expert-skill            │
│   kylehughes/building-apple-platform     │
│   conorluddy/ios-simulator-skill         │
│   rshankras/testing/* (8)                │
│ 所要時間: 3-6時間                        │
│ 実行者: Claude Code（Mac Mini）          │
└──────────────┬───────────────────────────┘
               │
               ▼ 自動トリガー（ビルド成功時）
┌──────────────────────────────────────────┐
│ PHASE C: SHIP（Claude Code via pty+bg）   │
│                                          │
│ exec pty:true background:true            │
│   timeout:14400                          │
│   claude -p "Read claude-progress.txt.   │
│   App is built. Now:                     │
│   1. setup-fastlane                      │
│   2. asc-signing-setup                   │
│   3. asc-metadata-sync                   │
│   4. asc-shots-pipeline                  │
│   5. asc-ppp-pricing                     │
│   6. fastlane beta (TestFlight)          │
│   7. asc-submission-health (preflight)   │
│   8. fastlane release (App Store submit) │
│   Write claude-progress.txt."            │
│                                          │
│ 使うスキル:                              │
│   greenstevester/fastlane-skill (5)      │
│   rudrankriyam/asc-* (27)                │
│   rshankras/app-store/* (7)              │
│   rshankras/legal/* (2)                  │
│ 所要時間: 1-2時間                        │
│ 実行者: Claude Code（Mac Mini）          │
└──────────────┬───────────────────────────┘
               │
               ▼ App Store 承認後
┌──────────────────────────────────────────┐
│ PHASE D: LAUNCH（僕 Anicca が直接実行）   │
│                                          │
│ 1. rshankras/growth/* で ASO             │
│ 2. rudrankriyam/asc-crash-triage 設定    │
│ 3. Slack に完了報告                      │
│ 4. X/TikTok で宣伝                      │
│                                          │
│ 使うスキル: rshankras/growth/* (5)        │
│ 所要時間: 30分                           │
│ 実行者: Anicca（OpenClaw直接）           │
└──────────────────────────────────────────┘
```

---

## 5. 既存スキルの削除対象

| 削除対象 | 理由 | 置き換え元 |
|---------|------|-----------|
| 僕らの mobileapp-builder 14 PHASE | 外部スキルで完全カバー | rshankras/product/WORKFLOW.md + 全6リポ |
| 僕らの screenshot-creator | 重複 | rudrankriyam/asc-shots-pipeline |
| 僕らの ralph-autonomous-dev | 重複 | rshankras/product/product-agent |
| 僕らの asc-* スキル（重複分のみ） | 重複 | rudrankriyam/asc-* |

---

## 6. 受け入れ条件

| # | 条件 | 確認方法 |
|---|------|---------|
| AC1 | 6リポ全スキルが /Users/anicca/.claude/skills/ にコピー済み | ls で確認 |
| AC2 | 重複する旧スキルが削除されている | ls で確認 |
| AC3 | PHASE A が 07:00 JST cron で動き、specs/ に7ファイル生成 | ログ確認 |
| AC4 | PHASE B が Claude Code pty+bg で起動し、Xcode プロジェクト生成 | git log 確認 |
| AC5 | PHASE C が fastlane + asc で App Store 提出 | asc apps list 確認 |
| AC6 | claude-progress.txt がフェーズ間で引き継がれている | ファイル確認 |
| AC7 | オリジナルのロジックが 0 行 | スペックレビュー |

---

## 7. ソース一覧（全引用）

| # | ソース | URL | 何をコピーしたか |
|---|--------|-----|----------------|
| S1 | Anthropic "Effective harnesses for long-running agents" | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | initializer + coding agent パターン、incremental progress、claude-progress.txt |
| S2 | OpenClaw FAQ | https://docs.openclaw.ai/help/faq | フェーズ分割 + サブエージェント推奨 |
| S3 | "Best OpenClaw Setup" | https://dev.to/operationalneuralnetwork/best-openclaw-setup-optimizing-agents-for-efficiency-and-effectiveness-27hk | オーケストレーターパターン、トークン40%削減 |
| S4 | Claude Code Best Practices | https://code.claude.com/docs/en/best-practices | Agent Teams、コンテキスト管理 |
| S5 | OpenClaw coding-agent SKILL.md | /opt/homebrew/lib/node_modules/openclaw/skills/coding-agent/SKILL.md | pty:true + background:true パターン |
| S6 | rshankras/claude-code-apple-skills | https://github.com/rshankras/claude-code-apple-skills | 140スキル + WORKFLOW.md |
| S7 | rudrankriyam/app-store-connect-cli-skills | https://github.com/rudrankriyam/app-store-connect-cli-skills | 27 asc スキル |
| S8 | greenstevester/fastlane-skill | https://github.com/greenstevester/fastlane-skill | 5 fastlane スキル |
| S9 | conorluddy/ios-simulator-skill | https://github.com/conorluddy/ios-simulator-skill | 1スキル（21スクリプト） |
| S10 | kylehughes/apple-platform-build-tools | https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin | 1スキル + 1サブエージェント |
| S11 | AvdLee/SwiftUI-Agent-Skill | https://github.com/AvdLee/SwiftUI-Agent-Skill | 1 SwiftUI BP スキル |
| S12 | sparkagents.com "Claw Code" | https://www.sparkagents.com/blog/claw-code | OpenClaw → Claude Code オーケストレーション |
