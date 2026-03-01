# mobileapp-factory v3 — 外部スキル100%、8フェーズ完コピ

**Date**: 2026-02-28
**Author**: Anicca
**Status**: ⬜ 未実行
**オリジナリティ**: 0%

---

## 0. なぜ v3 か

v2（オリジナル14 PHASE）は失敗した。v3 は:
- 8フェーズを rshankras/product/WORKFLOW.md から完コピ
- セッション分割を Anthropic 公式パターンから完コピ
- 完了トリガーを OpenClaw coding-agent SKILL.md から完コピ
- 品質ゲートを ManaLabs Auto App Factory から完コピ
- 実行の中身を 6リポ 175スキルで 100% カバー

---

## 1. 8フェーズ（rshankras WORKFLOW.md 完コピ）

ソース: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md

### Phase 0: IDEA DISCOVERY
- スキル: idea-generator
- 入力: trend-hunter cron (05:00 JST) の出力
- プロセス: Developer profile elicitation → 5 brainstorming lenses → Feasibility filtering and scoring → Ranked shortlist of 3-5 ideas
- 出力: idea-shortlist.json

### Phase 1: PRODUCT PLANNING
- スキル: product-agent
- コマンド: product-agent run --idea "..." --interactive
- 4 agents: Problem Discovery Agent → MVP Scoping Agent → Positioning Agent → ASO Optimization Agent
- 出力: product-plan-*.md
- 所要時間: 5-10 min（rshankras）

### Phase 2: MARKET RESEARCH
- スキル: competitive-analysis + market-research
- 出力: competitive-analysis.md, market-research.md
- 所要時間: 10-15 min（rshankras）

### Phase 3: SPECIFICATION GENERATION
- スキル: implementation-spec（orchestrator）
- 6 sub-phases:
  - 3.1: prd-generator → docs/PRD.md
  - 3.2: architecture-spec → docs/ARCHITECTURE.md
  - 3.3: ux-spec → docs/UX_SPEC.md, docs/DESIGN_SYSTEM.md
  - 3.4: implementation-guide → docs/IMPLEMENTATION_GUIDE.md
  - 3.5: test-spec → docs/TEST_SPEC.md
  - 3.6: release-spec → docs/RELEASE_SPEC.md
- 出力: docs/ に 7 ファイル
- 所要時間: 10-15 min（rshankras）

### Phase 4: IMPLEMENTATION
- rshankras: "Claude-Assisted Implementation — Ask Claude to implement specific components"
- IMPLEMENTATION_GUIDE.md に従い 1 機能ずつ実装（Anthropic: incremental progress）
- 使うスキル: rshankras/generators/* (52), AvdLee/swiftui-expert-skill, kylehughes/building-apple-platform-products, conorluddy/ios-simulator-skill
- 品質ゲート（ManaLabs）: 別 reviewer agent が独立レビュー、6-point quality gates、8/10 未満 → リトライ、3回失敗 → Slack に人間レビュー依頼
- 所要時間: 4-8 weeks（rshankras、人間ペース）

### Phase 5: TESTING
- TEST_SPEC.md に従う
- Unit tests for all models and ViewModels
- Integration tests for data layer
- UI tests for critical user journeys
- Accessibility testing
- Performance benchmarking
- 使うスキル: rshankras/testing/* (8), conorluddy/ios-simulator-skill
- 所要時間: 2-3 weeks（rshankras、人間ペース）

### Phase 6: APP STORE RELEASE
- RELEASE_SPEC.md に従う
- Prepare App Store assets (icon, screenshots, video)
- Create Privacy Manifest (PrivacyInfo.xcprivacy)
- Fill App Store Connect metadata
- Submit for review
- 使うスキル: greenstevester/fastlane-skill (5), rudrankriyam/asc-* (27), rshankras/app-store/* (7), rshankras/legal/* (2)
- 所要時間: 1-2 weeks（rshankras、人間ペース）

### Phase 7: POST-LAUNCH
- Monitor crash reports and reviews
- Release v1.0.1 bug fixes (1-2 weeks after launch)
- Implement deferred features
- Release v1.1.0 first feature update
- Iterate based on user feedback
- 使うスキル: rshankras/growth/* (5), rudrankriyam/asc-crash-triage

---

## 2. セッション分割（Anthropic公式パターン）

ソース: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
引用: 「an initializer agent that sets up the environment on the first run, and a coding agent that is tasked with making incremental progress in every session, while leaving clear artifacts for the next session」

### セッション間引き継ぎ

ソース: Anthropic 公式
引用: 「a claude-progress.txt file that keeps a log of what agents have done, and an initial git commit that shows what files were added」

各セッション完了時に:
1. claude-progress.txt に進捗を書く
2. git commit する（descriptive message）
3. openclaw system event で次セッションをトリガー

### 完了トリガー

ソース: OpenClaw coding-agent SKILL.md（公式）
URL: https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md
引用: 「For long-running background tasks, append a wake trigger to your prompt so OpenClaw gets notified immediately when the agent finishes」

### セッション構成

| セッション | フェーズ | トリガー | 所要時間（rshankras） |
|-----------|---------|---------|---------------------|
| Session 1 | Phase 0-3 (Research + Specs) | cron 07:00 JST | 25-40 min |
| Session 2 | Phase 4 (Implementation) | Session 1 完了 → openclaw system event | 4-8 weeks (人間) / 数時間 (自動) |
| Session 3 | Phase 5 (Testing) | Session 2 完了 → openclaw system event | 2-3 weeks (人間) / 数時間 (自動) |
| Session 4 | Phase 6 (Ship) | Session 3 完了 → openclaw system event | 1-2 weeks (人間) / 数時間 (自動) |
| Session 5 | Phase 7 (Post-Launch) | App Store 承認後 | ongoing |

### 実行パターン

Session 1 (Phase 0-3): OpenClaw が直接実行（短いため）
Session 2-4: coding-agent SKILL.md パターン（pty:true + background:true）

ソース: coding-agent SKILL.md
引用: 「Always use pty:true — coding agents are interactive terminal applications that need a pseudo-terminal」

### 品質ゲート（ManaLabs）

ソース: https://manalabs.wtf/appfactory
引用: 「A separate reviewer agent independently verifies every file for crash risks, missing features, and code quality — because the model that wrote the code will cut corners reviewing its own work. Then 6 automated checks run. Score below 8/10? It retries. Three failures? Flagged for human review.」

Phase 4 完了後:
1. Builder agent が実装
2. 別の Reviewer agent が独立レビュー
3. 6-point quality gates 実行
4. Score < 8/10 → リトライ
5. 3回失敗 → Slack #metrics に人間レビュー依頼

---

## 3. インストールするスキル（6リポ）

### 3-1. rshankras/claude-code-apple-skills（140スキル）
- ソース: https://github.com/rshankras/claude-code-apple-skills
- セキュリティ: 🟢 Benign（MIT）
```bash
cd /tmp && git clone --depth 1 https://github.com/rshankras/claude-code-apple-skills.git
cp -r /tmp/claude-code-apple-skills/skills/* /Users/anicca/.claude/skills/
```

### 3-2. rudrankriyam/app-store-connect-cli-skills（27スキル）
- ソース: https://github.com/rudrankriyam/app-store-connect-cli-skills
- セキュリティ: 🟢 Benign（MIT）
```bash
cd /tmp && git clone --depth 1 https://github.com/rudrankriyam/app-store-connect-cli-skills.git
cp -r /tmp/app-store-connect-cli-skills/skills/* /Users/anicca/.claude/skills/
```

### 3-3. greenstevester/fastlane-skill（5スキル）
- ソース: https://github.com/greenstevester/fastlane-skill
- セキュリティ: 🟢 Benign（MIT）
```bash
cd /tmp && git clone --depth 1 https://github.com/greenstevester/fastlane-skill.git
cp -r /tmp/fastlane-skill/skills/* /Users/anicca/.claude/skills/
```

### 3-4. conorluddy/ios-simulator-skill（1スキル、21スクリプト）
- ソース: https://github.com/conorluddy/ios-simulator-skill
- セキュリティ: 🟢 Benign（MIT）
```bash
cd /tmp && git clone --depth 1 https://github.com/conorluddy/ios-simulator-skill.git
cp -r /tmp/ios-simulator-skill/ios-simulator-skill /Users/anicca/.claude/skills/
```

### 3-5. kylehughes/apple-platform-build-tools（1スキル+1サブエージェント）
- ソース: https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin
- セキュリティ: 🟢 Benign（MIT）
```bash
cd /tmp && git clone --depth 1 https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin.git
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/skills/* /Users/anicca/.claude/skills/
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/agents/* /Users/anicca/.claude/agents/ 2>/dev/null || true
```

### 3-6. AvdLee/SwiftUI-Agent-Skill（1スキル）
- ソース: https://github.com/AvdLee/SwiftUI-Agent-Skill
- セキュリティ: 🟢 Benign（MIT、SwiftLee）
```bash
cd /tmp && git clone --depth 1 https://github.com/AvdLee/SwiftUI-Agent-Skill.git
cp -r /tmp/SwiftUI-Agent-Skill/swiftui-expert-skill /Users/anicca/.claude/skills/
```

---

## 4. ビジュアルフロー

```
cron 07:00 JST
    │
    ▼
┌─ SESSION 1 (Phase 0-3: Research + Specs) ─────────────────┐
│                                                            │
│  Phase 0: idea-generator → idea-shortlist.json             │
│      ↓                                                     │
│  Phase 1: product-agent → product-plan-*.md (5-10 min)     │
│      ↓                                                     │
│  Phase 2: competitive-analysis + market-research (10-15min)│
│      ↓                                                     │
│  Phase 3: implementation-spec → docs/ 7 files (10-15 min)  │
│      ↓                                                     │
│  → claude-progress.txt 更新                                │
│  → git commit                                              │
│  → Slack #metrics に報告                                   │
│  → openclaw system event "Phase 0-3 complete"              │
│                                                            │
└────────────────────────┬───────────────────────────────────┘
                         │ (自動トリガー)
                         ▼
┌─ SESSION 2 (Phase 4: Implementation) ─────────────────────┐
│  coding-agent pty:true background:true                     │
│                                                            │
│  → claude-progress.txt 読む                                │
│  → IMPLEMENTATION_GUIDE.md に従い 1 機能ずつ               │
│  → generators/*, swiftui-expert, ios-simulator 使用        │
│  → 各機能: git commit + claude-progress.txt 更新           │
│  → 完了後: reviewer agent が独立レビュー (ManaLabs)        │
│  → 6-point quality gates: < 8/10 → リトライ               │
│  → 3回失敗 → Slack 人間レビュー                           │
│  → openclaw system event "Phase 4 complete"                │
│                                                            │
└────────────────────────┬───────────────────────────────────┘
                         │ (自動トリガー)
                         ▼
┌─ SESSION 3 (Phase 5: Testing) ────────────────────────────┐
│  coding-agent pty:true background:true                     │
│                                                            │
│  → claude-progress.txt 読む                                │
│  → TEST_SPEC.md に従う                                    │
│  → Unit + Integration + UI + Accessibility + Performance   │
│  → rshankras/testing/*, ios-simulator-skill 使用           │
│  → openclaw system event "Phase 5 complete"                │
│                                                            │
└────────────────────────┬───────────────────────────────────┘
                         │ (自動トリガー)
                         ▼
┌─ SESSION 4 (Phase 6: App Store Release) ──────────────────┐
│  coding-agent pty:true background:true                     │
│                                                            │
│  → claude-progress.txt 読む                                │
│  → RELEASE_SPEC.md に従う                                 │
│  → fastlane-skill: setup → match → snapshot → beta → release│
│  → asc-*: metadata-sync, shots-pipeline, ppp-pricing      │
│  → asc-submission-health (preflight check)                 │
│  → Submit for review                                       │
│  → openclaw system event "Phase 6 complete"                │
│                                                            │
└────────────────────────┬───────────────────────────────────┘
                         │ (App Store 承認後)
                         ▼
┌─ SESSION 5 (Phase 7: Post-Launch) ────────────────────────┐
│                                                            │
│  → Monitor crash reports (asc-crash-triage)                │
│  → Monitor reviews (rshankras/growth/*)                    │
│  → Release v1.0.1 bug fixes                               │
│  → Iterate based on user feedback                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. 手動モード（rshankras WORKFLOW.md）

rshankras WORKFLOW.md の Activation Phrases をそのまま使える:

| Phase | How to Activate |
|-------|-----------------|
| Idea Discovery | "I don't know what to build" or "give me app ideas" |
| Product Planning | product-agent run --idea "..." --interactive |
| Competitive Analysis | "analyze competitors" |
| Market Research | "market research" or "market sizing" |
| Generate All Specs | "generate implementation specifications" |
| Generate PRD only | "generate PRD" |

→ 自動（cron）でも手動（会話）でも同じスキルが動く。

---

## 6. 受け入れ条件

| # | 条件 | ソース |
|---|------|--------|
| AC1 | 6リポ全スキルが /Users/anicca/.claude/skills/ にコピー済み | - |
| AC2 | Phase 0-3 が 1 セッションで動き、docs/ に 7 ファイル生成 | rshankras WORKFLOW.md |
| AC3 | Phase 4 が coding-agent pty+bg で起動し、incremental progress | Anthropic 公式 |
| AC4 | 各セッション完了時に claude-progress.txt + git commit | Anthropic 公式 |
| AC5 | openclaw system event で次セッション自動トリガー | coding-agent SKILL.md |
| AC6 | Phase 4 完了後に reviewer agent が独立レビュー | ManaLabs |
| AC7 | Phase 6 で App Store に提出（Waiting for Review） | rshankras WORKFLOW.md |

---

## 7. ソース一覧

| # | ソース | URL | 何をコピーしたか |
|---|--------|-----|----------------|
| S1 | rshankras/claude-code-apple-skills WORKFLOW.md | https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md | 8フェーズ定義、所要時間、Activation Phrases、ファイル構成 |
| S2 | Anthropic "Effective harnesses for long-running agents" | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | initializer + coding agent、incremental progress、claude-progress.txt、git commit |
| S3 | OpenClaw coding-agent SKILL.md | https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md | pty:true + background:true、openclaw system event wake trigger |
| S4 | ManaLabs Auto App Factory | https://manalabs.wtf/appfactory | 3 macro phases (Research → Build → Market)、reviewer agent、6-point quality gates、8/10 threshold |
| S5 | OpenClaw FAQ | https://docs.openclaw.ai/help/faq | 「split into phases and use sub agents for parallel work」 |
| S6 | "Best OpenClaw Setup" | https://dev.to/operationalneuralnetwork/best-openclaw-setup-optimizing-agents-for-efficiency-and-effectiveness-27hk | orchestrator pattern、40% token reduction |
| S7 | Ralph Loop (OpenClaw Discussion #10320) | https://github.com/openclaw/openclaw/discussions/10320 | autonomous multi-hour sessions、session continuity、error recovery |
| S8 | rudrankriyam/app-store-connect-cli-skills | https://github.com/rudrankriyam/app-store-connect-cli-skills | 27 asc スキル |
| S9 | greenstevester/fastlane-skill | https://github.com/greenstevester/fastlane-skill | 5 fastlane スキル |
| S10 | conorluddy/ios-simulator-skill | https://github.com/conorluddy/ios-simulator-skill | 1スキル（21スクリプト） |
| S11 | kylehughes/apple-platform-build-tools | https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin | 1スキル + 1サブエージェント |
| S12 | AvdLee/SwiftUI-Agent-Skill | https://github.com/AvdLee/SwiftUI-Agent-Skill | 1 SwiftUI BP スキル |
| S13 | Claude Code Best Practices | https://code.claude.com/docs/en/best-practices | Agent Teams、context management |
