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

## 1. 8フェーズ — 入力/出力チェーン

ソース: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md

### Phase 0: IDEA DISCOVERY
- スキル: idea-generator（rshankras、完コピ）
- 入力: なし（スキルが自分で検索する）
- プロセス（rshankras idea-generator SKILL.md そのまま）:
  1. **Developer Profile Elicitation** — Technical skills, domain interests, platform preference, time availability, constraints
  2. **5 Brainstorming Lenses**（各 Lens 5-8 個のアイデア生成）:
     - Lens 1: Skills & Interests — What can you uniquely build given what you know?
     - Lens 2: Problem-First — What took 30 seconds today that should take 5?
     - Lens 3: Technology-First — Which Apple frameworks have few indie apps?
     - Lens 4: Market Gap — App Store カテゴリの穴を探す
       → rshankras デフォルト: WebSearch
       → 置換: **App Store Scraper スキル**（App Store 直接データ）+ **apify(google-trends-scraper)**（Google Trends）
       → 置換理由 — ManaLabs: 「Dedicated research agents scan Reddit, X, and App Store categories for pain points」
     - Lens 5: Trend-Based — マクロトレンドから新アプリ機会を発見
       → rshankras デフォルト: WebSearch
       → 置換: **x-research スキル**（X）+ **tiktok-research スキル**（TikTok）
       → 置換理由 — ManaLabs: 同上（専用ソースから直接データを引く）
  3. **Feasibility Filtering**（rshankras そのまま、5基準）: Solo Dev Scope, Platform API Fit, Monetization Viability, Competition Density, Technical Complexity
  4. **Scoring and Ranking**（rshankras そのまま、5次元 1-10 スケール、Solo Dev Scope と Technical Fit は 1.5x 重み付け）
  5. **Shortlist Output** — 3-5 アイデア、各アイデアに: one-liner, lens, problem_statement, target_user, feasibility scores, overall_score, monetization_model, competition_notes, mvp_scope, next_step
- 出力: `daily-apps/<name>/spec/01-trend.md`
  - rshankras idea-generator の出力フォーマットを .md で記述
  - フィールド: rank, idea, one_liner, lens, platform, problem_statement, target_user, feasibility (5基準), overall_score, monetization_model, competition_notes, mvp_scope, next_step, ideas_filtered_out, recommendation

### Phase 1: PRODUCT PLANNING
- スキル: product-agent（rshankras）
- 入力: `daily-apps/<name>/spec/01-trend.md`（Rank 1 のアイデア）
- コマンド: product-agent run --idea "..." --interactive
- 4 agents: Problem Discovery Agent → MVP Scoping Agent → Positioning Agent → ASO Optimization Agent
- 出力: `daily-apps/<name>/product-plan.md`
- 所要時間: 5-10 min（rshankras）

### Phase 2: MARKET RESEARCH
- スキル: competitive-analysis + market-research（rshankras）
- 入力: `daily-apps/<name>/spec/01-trend.md` + `daily-apps/<name>/product-plan.md`
- 出力:
  - `daily-apps/<name>/competitive-analysis.md`
  - `daily-apps/<name>/market-research.md`
- 所要時間: 10-15 min（rshankras）

### Phase 3: SPECIFICATION GENERATION
- スキル: implementation-spec（rshankras orchestrator）
- 入力: spec/01-trend.md + product-plan.md + competitive-analysis.md + market-research.md
- 6 sub-phases:
  - 3.1: prd-generator → docs/PRD.md（app_name, bundle_id, prices, metadata, screens 全部ここ）
  - 3.2: architecture-spec → docs/ARCHITECTURE.md（技術設計）
  - 3.3: ux-spec → docs/UX_SPEC.md, docs/DESIGN_SYSTEM.md
  - 3.4: implementation-guide → docs/IMPLEMENTATION_GUIDE.md（タスクリスト含む）
  - 3.5: test-spec → docs/TEST_SPEC.md
  - 3.6: release-spec → docs/RELEASE_SPEC.md
- 出力: `daily-apps/<name>/docs/` に 7 ファイル
- 所要時間: 10-15 min（rshankras）

### Phase 4: IMPLEMENTATION
- スキル: rshankras/generators/* (52), AvdLee/swiftui-expert-skill, kylehughes/building-apple-platform-products, conorluddy/ios-simulator-skill
- 入力: `daily-apps/<name>/docs/IMPLEMENTATION_GUIDE.md` + `docs/PRD.md`
- rshankras: "Claude-Assisted Implementation — Ask Claude to implement specific components"
- IMPLEMENTATION_GUIDE.md に従い 1 機能ずつ実装（Anthropic: incremental progress）
- 品質ゲート（ManaLabs）: 別 reviewer agent が独立レビュー、6-point quality gates、8/10 未満 → リトライ、3回失敗 → Slack #metrics に人間レビュー依頼
- 出力: `daily-apps/<name>/<AppName>ios/`（Xcode プロジェクト一式）
- 所要時間: 4-8 weeks（rshankras、人間ペース）/ 数時間（自動）

### Phase 5: TESTING
- スキル: rshankras/testing/* (8), conorluddy/ios-simulator-skill
- 入力: `daily-apps/<name>/docs/TEST_SPEC.md` + ソースコード
- TEST_SPEC.md に従う: Unit + Integration + UI + Accessibility + Performance
- 出力: `daily-apps/<name>/<AppName>ios/<AppName>Tests/`
- 所要時間: 2-3 weeks（rshankras、人間ペース）/ 数時間（自動）

### Phase 6: APP STORE RELEASE
- 入力: `daily-apps/<name>/docs/RELEASE_SPEC.md` + `docs/PRD.md` + ソースコード
- 各ステップのソース = 対応するスキルの SKILL.md
- 順序のソース = 各スキルの Preconditions（依存関係）

| Step | スキル | やること | 入力 | 出力 |
|------|--------|---------|------|------|
| 6.1 | rshankras/legal/privacy-policy | Privacy Policy + Terms 生成 | docs/PRD.md（データ収集情報） | privacy-policy.md, terms.md → GitHub Pages デプロイ |
| 6.2 | asc-signing-setup (rudrankriyam) | 証明書 + Provisioning Profile | Apple Developer Account | .signing/ に証明書 + profile |
| 6.3 | asc-app-create-ui (rudrankriyam) | ASC にアプリ作成 | docs/PRD.md（app_name, bundle_id） | APP_ID, VERSION_ID |
| 6.4 | asc-subscription-localization (rudrankriyam) | IAP 作成 + 全 locale ローカライズ | APP_ID + docs/PRD.md（prices） | IAP 作成済み + 全 locale 設定済み |
| 6.5 | asc-ppp-pricing (rudrankriyam) | 175カ国 pricing | IAP IDs | 全 territory pricing 設定済み |
| 6.6 | RC 公式ドキュメント | RevenueCat Offerings Setup | APP_ID + IAP product IDs | RC に Offerings 設定済み |
| 6.7 | asc-xcode-build (rudrankriyam) | アーカイブ + export | ソースコード + .signing/ | .ipa ファイル |
| 6.8 | Pencil MCP + asc-shots-pipeline (rudrankriyam) | スクショ生成 + フレーム + アップロード | シミュレータ上のアプリ | screenshots/raw/ + screenshots/framed/ → ASC アップロード済み |
| 6.9 | asc-metadata-sync (rudrankriyam) | メタデータ同期 | docs/PRD.md（metadata） | ASC メタデータ設定済み |
| 6.10 | asc-release-flow (rudrankriyam) | TestFlight アップロード | .ipa | TestFlight にビルド配布済み |
| 6.11 | asc-testflight-orchestration (rudrankriyam) | TestFlight 配布 | BUILD_ID + GROUP_ID | ★人間テスト |
| 6.12 | asc-submission-health (rudrankriyam) | Preflight 7項目チェック | APP_ID + VERSION_ID | 全チェック PASS |
| 6.13 | ★人間★ | App Privacy 手動設定 | ASC Web | App Privacy 設定完了（API で設定不可） |
| 6.14 | asc-release-flow (rudrankriyam) | Submit for Review | APP_ID + VERSION + BUILD_ID | WAITING_FOR_REVIEW |

- CRITICAL RULES（mobileapp-builder SKILL.md の 40 個）は全ステップで参照する（Apple ルール + 実機確認済みの事実）
- 出力: App Store に提出済み（WAITING_FOR_REVIEW）

### Phase 7: POST-LAUNCH
- スキル: rshankras/growth/* (5), rudrankriyam/asc-crash-triage
- 入力: App Store で公開中のアプリ
- Monitor crash reports and reviews → Release v1.0.1 bug fixes → Iterate
- 出力: 継続的改善

---

## 2. Ralph Loop による自律実行

ソース: snarktank/ralph (GitHub)
URL: https://github.com/snarktank/ralph
引用: 「Instead of building complex graphs, agent swarms, or multi-phase planners, he uses just a for/while loop that calls Claude Code on the same project multiple times」

OpenClaw 用スキル: ralph-loop-agent (clawhub)
URL: ~/.openclaw/skills/ralph-loop-agent/SKILL.md
引用: 「The agent calls exec tool with the coding agent command. Uses pty: true to provide TTY. Uses background: true for monitoring capabilities. Uses process tool to monitor progress and detect completion.」

### コンポーネント（snarktank/ralph 完コピ）

| コンポーネント | 役割 | ソース |
|-------------|------|--------|
| prd.json | バックログ（各 US に passes: true/false） | snarktank/ralph skills/ralph/SKILL.md |
| progress.txt | イテレーション間の記憶 | snarktank/ralph CLAUDE.md |
| CLAUDE.md | Claude Code Opus への指示 | snarktank/ralph CLAUDE.md |

### 完了シグナル

ソース: snarktank/ralph CLAUDE.md
引用: 「If ALL stories are complete and passing, reply with: <promise>COMPLETE</promise>」

### prd.json（8 ユーザーストーリー）

ソース: snarktank/ralph skills/ralph/SKILL.md
引用: 「Each story must be completable in ONE Ralph iteration (one context window)」
引用: 「Acceptance criteria must be verifiable, not vague」
引用: 「Always include 'Typecheck passes' as final criterion」

```json
{
  "project": "mobileapp-factory",
  "branchName": "ralph/daily-app",
  "description": "Build and submit one iOS app to App Store",
  "userStories": [
    {
      "id": "US-001",
      "title": "Trend research + idea selection",
      "acceptanceCriteria": [
        "spec/01-trend.md exists",
        "Contains: rank, idea, one_liner, platform, problem_statement, target_user, feasibility, overall_score, monetization_model, competition_notes, mvp_scope, next_step",
        "At least 5 ideas evaluated, top 1 selected",
        "Sources cited for each trend"
      ],
      "priority": 1, "passes": false, "notes": ""
    },
    {
      "id": "US-002",
      "title": "Product planning",
      "acceptanceCriteria": [
        "product-plan.md exists",
        "Contains: target user, problem, solution, monetization, MVP scope",
        "All claims cite external sources"
      ],
      "priority": 2, "passes": false, "notes": ""
    },
    {
      "id": "US-003",
      "title": "Market research",
      "acceptanceCriteria": [
        "competitive-analysis.md exists with 5+ competitors analyzed",
        "market-research.md exists with TAM/SAM/SOM"
      ],
      "priority": 3, "passes": false, "notes": ""
    },
    {
      "id": "US-004",
      "title": "Spec generation",
      "acceptanceCriteria": [
        "docs/PRD.md exists",
        "docs/ARCHITECTURE.md exists",
        "docs/UX_SPEC.md exists",
        "docs/DESIGN_SYSTEM.md exists",
        "docs/IMPLEMENTATION_GUIDE.md exists",
        "docs/TEST_SPEC.md exists",
        "docs/RELEASE_SPEC.md exists"
      ],
      "priority": 4, "passes": false, "notes": ""
    },
    {
      "id": "US-005",
      "title": "iOS implementation",
      "acceptanceCriteria": [
        "<AppName>ios/ directory exists with App/, Views/, Models/, Services/, Resources/",
        "xcodebuild -scheme <AppName> build succeeds",
        "Typecheck passes"
      ],
      "priority": 5, "passes": false, "notes": ""
    },
    {
      "id": "US-006",
      "title": "Testing",
      "acceptanceCriteria": [
        "xcodebuild test succeeds",
        "Unit tests exist for Models and Services",
        "All tests pass"
      ],
      "priority": 6, "passes": false, "notes": ""
    },
    {
      "id": "US-007",
      "title": "App Store preparation (6.1-6.12)",
      "acceptanceCriteria": [
        "privacy-policy.md exists and deployed to GitHub Pages",
        ".ipa file built successfully",
        "App created in ASC via asc-app-create-ui (browser automation, no 2FA)",
        "Screenshots generated and uploaded to ASC",
        "Metadata synced to ASC via asc-metadata-sync",
        "TestFlight build uploaded and distributed",
        "Preflight 7 checks all pass (asc-submission-health)",
        "Slack #metrics notified: TestFlight ready"
      ],
      "priority": 7, "passes": false, "notes": ""
    },
    {
      "id": "US-008",
      "title": "App Store submission (6.13-6.14)",
      "acceptanceCriteria": [
        "Slack #metrics notified: need App Privacy setup",
        ".app-privacy-done file exists (human created after ASC Web setup)",
        "asc submit create returns WAITING_FOR_REVIEW",
        "Slack #metrics notified: WAITING_FOR_REVIEW"
      ],
      "priority": 8, "passes": false, "notes": ""
    }
  ]
}
```

### 実行パターン（ralph.sh — snarktank/ralph 完コピ）

ソース: https://github.com/snarktank/ralph/blob/main/ralph.sh
引用: 「for i in $(seq 1 $MAX_ITERATIONS); do
  OUTPUT=$(claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md" 2>&1 | tee /dev/stderr) || true
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then exit 0; fi
  sleep 2
done」

Anicca（Opus）が以下を実行:

```
Step 1: prd.json + CLAUDE.md を daily-apps/<name>/ に生成
Step 2: tmux 内で ralph.sh を実行

  tmux new-session -d -s factory -c "daily-apps/<name>/" \
    "source ~/.config/mobileapp-builder/.env && ./ralph.sh --tool claude 20"

  ralph.sh が自動で:
  - for ループで最大 20 回繰り返す
  - 毎回 claude --print < CLAUDE.md を実行
  - 1 iteration = 1 US = 1 セッション
  - tee /dev/stderr でリアルタイム出力（tmux で見れる）
  - <promise>COMPLETE</promise> 検出で終了
  - sleep 2 して次の iteration

Step 3: ralph.sh 終了 → notifyOnExit で Anicca が起きる → Slack 完了報告

ソース: OpenClaw Docs "Exec Tool"
URL: https://docs.openclaw.ai/tools/exec
引用: 「tools.exec.notifyOnExit (default: true):
  when true, backgrounded exec sessions enqueue a system event and request a heartbeat on exit.」
```

MacBook から見る: `ssh anicca@100.99.82.95 -t "tmux attach -t factory"`
tmux スクロール: `Ctrl+B → [ → 上下矢印 → q で戻る`

### App Privacy 待ち（US-008）

1. US-007 完了時: Claude Code が Slack に「App Privacy 設定してください」通知
2. US-008 開始時: Claude Code が .app-privacy-done ファイルを確認
3. ファイルがない → passes:false のまま → 次の iteration で再チェック
4. Dais が ASC Web で設定 → Slack で「完了」と投稿
5. Anicca（Sonnet）が Slack メッセージを受信
6. Anicca が daily-apps/<name>/.app-privacy-done を作成（touch）
7. 次の iteration で Claude Code が検出 → asc submit create → WAITING_FOR_REVIEW

ソース: snarktank/ralph CLAUDE.md
引用: 「If there are still stories with passes: false, end your response normally (another iteration will pick up the next story)」

### 品質ゲート（ManaLabs）

ソース: https://manalabs.wtf/appfactory
引用: 「A separate reviewer agent independently verifies every file for crash risks, missing features, and code quality — because the model that wrote the code will cut corners reviewing its own work. Then 6 automated checks run. Score below 8/10? It retries. Three failures? Flagged for human review.」

Phase 4（US-005）完了後:
1. Builder agent が実装
2. 別の Reviewer agent が独立レビュー
3. 6-point quality gates 実行
4. Score < 8/10 → リトライ
5. 3回失敗 → Slack #metrics に人間レビュー依頼

---

## 3. フォルダ構成（アプリ誕生時 → 完成時）

```
daily-apps/<app-name>/
├── spec/
│   └── 01-trend.md              ← Phase 0 出力（rshankras idea-generator フォーマット）
├── product-plan.md              ← Phase 1 出力（rshankras product-agent）
├── competitive-analysis.md      ← Phase 2 出力（rshankras competitive-analysis）
├── market-research.md           ← Phase 2 出力（rshankras market-research）
├── claude-progress.txt          ← 全セッション共有（Anthropic 公式）
├── docs/                        ← Phase 3 出力（rshankras implementation-spec）
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── UX_SPEC.md
│   ├── DESIGN_SYSTEM.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── TEST_SPEC.md
│   └── RELEASE_SPEC.md
├── .asc/                        ← Phase 6 設定（asc-shots-pipeline）
│   ├── shots.settings.json
│   └── screenshots.json
├── screenshots/                 ← Phase 6 出力（asc-shots-pipeline）
│   ├── raw/
│   └── framed/
├── .signing/                    ← Phase 6 出力（asc-signing-setup）
└── <AppName>ios/                ← Phase 4 出力
    ├── <AppName>.xcodeproj/
    ├── <AppName>/
    │   ├── App/
    │   ├── Views/
    │   ├── Models/
    │   ├── Services/
    │   └── Resources/
    ├── <AppName>Tests/          ← Phase 5 出力
    └── fastlane/
```

---

## 4. ビジュアルフロー

```
cron 07:00 JST
    │
    ▼
┌─ SESSION 1 (Phase 0-3: Research + Specs) ──────────────────────────┐
│                                                                     │
│  Phase 0: idea-generator                                           │
│    Lens 4: App Store Scraper + apify(google-trends)                │
│    Lens 5: x-research + tiktok-research                            │
│    → spec/01-trend.md                                              │
│      ↓                                                             │
│  Phase 1: product-agent → product-plan.md (5-10 min)               │
│      ↓                                                             │
│  Phase 2: competitive-analysis + market-research (10-15 min)       │
│      ↓                                                             │
│  Phase 3: implementation-spec → docs/ 7 files (10-15 min)          │
│      ↓                                                             │
│  → claude-progress.txt 更新                                        │
│  → git commit                                                      │
│  → Slack #metrics に報告                                           │
│  → openclaw system event "Phase 0-3 complete for <name>"           │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (自動トリガー)
                           ▼
┌─ SESSION 2 (Phase 4: Implementation) ──────────────────────────────┐
│  coding-agent pty:true background:true                              │
│                                                                     │
│  → claude-progress.txt 読む                                        │
│  → IMPLEMENTATION_GUIDE.md に従い 1 機能ずつ                       │
│  → generators/*, swiftui-expert, ios-simulator 使用                │
│  → 各機能: git commit + claude-progress.txt 更新                   │
│  → reviewer agent が独立レビュー (ManaLabs)                        │
│  → 8/10 未満 → リトライ、3回失敗 → Slack                          │
│  → openclaw system event "Phase 4 complete for <name>"             │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (自動トリガー)
                           ▼
┌─ SESSION 3 (Phase 5: Testing) ─────────────────────────────────────┐
│  coding-agent pty:true background:true                              │
│                                                                     │
│  → claude-progress.txt 読む                                        │
│  → TEST_SPEC.md に従う                                             │
│  → Unit + Integration + UI + Accessibility + Performance            │
│  → openclaw system event "Phase 5 complete for <name>"             │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (自動トリガー)
                           ▼
┌─ SESSION 4 (Phase 6: App Store Release) ───────────────────────────┐
│  coding-agent pty:true background:true                              │
│                                                                     │
│  6.1  rshankras/legal       → Privacy Policy + Terms → GitHub Pages│
│  6.2  asc-signing-setup     → 証明書 + Provisioning Profile        │
│  6.3  asc-app-create-ui     → ASC にアプリ作成                     │
│  6.4  asc-subscription-loc  → IAP + 全 locale ローカライズ         │
│  6.5  asc-ppp-pricing       → 175カ国 pricing                      │
│  6.6  RC 公式ドキュメント   → RevenueCat Offerings Setup           │
│  6.7  asc-xcode-build       → アーカイブ + .ipa export            │
│  6.8  Pencil MCP + asc-shots → スクショ生成 + アップロード         │
│  6.9  asc-metadata-sync     → メタデータ同期                       │
│  6.10 asc-release-flow      → TestFlight アップロード              │
│  6.11 asc-testflight-orch   → TestFlight 配布 ★人間テスト         │
│  6.12 asc-submission-health → Preflight 7項目チェック              │
│  6.13 ★人間★               → App Privacy 手動設定                  │
│  6.14 asc-release-flow      → Submit → WAITING_FOR_REVIEW          │
│                                                                     │
│  → openclaw system event "Phase 6 complete for <name>"             │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ (App Store 承認後)
                           ▼
┌─ SESSION 5 (Phase 7: Post-Launch) ─────────────────────────────────┐
│                                                                     │
│  → asc-crash-triage → クラッシュ監視                               │
│  → rshankras/growth/* → レビュー監視                               │
│  → v1.0.1 bug fixes → v1.1.0 feature update                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
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
| AC7 | Phase 6 で App Store に提出（WAITING_FOR_REVIEW） | rshankras WORKFLOW.md |

---

## 7. ソース一覧

| # | ソース | URL | 何をコピーしたか |
|---|--------|-----|----------------|
| S1 | rshankras/claude-code-apple-skills WORKFLOW.md | https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md | 8フェーズ定義、所要時間、Activation Phrases、ファイル構成 |
| S2 | rshankras/idea-generator SKILL.md | https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/idea-generator/SKILL.md | Phase 0 出力フォーマット、5 Lenses、Feasibility Filtering、Scoring |
| S3 | Anthropic "Effective harnesses for long-running agents" | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | initializer + coding agent、incremental progress、claude-progress.txt |
| S4 | OpenClaw coding-agent SKILL.md | https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md | pty:true + background:true、openclaw system event |
| S5 | ManaLabs Auto App Factory | https://manalabs.wtf/appfactory | reviewer agent、6-point quality gates、8/10 threshold |
| S6 | rudrankriyam/asc-release-flow | https://github.com/rudrankriyam/app-store-connect-cli-skills | Phase 6 ステップ順序、TestFlight + Submit フロー |
| S7 | rudrankriyam/asc-shots-pipeline | 同上 | スクショフォルダ構成（screenshots/raw + framed）、.asc/ 設定 |
| S8 | rudrankriyam/asc-submission-health | 同上 | Preflight 7項目チェックリスト |
| S9 | rudrankriyam/asc-subscription-localization | 同上 | IAP ローカライズ手順 |
| S10 | rudrankriyam/asc-ppp-pricing | 同上 | 175カ国 pricing 手順 |
| S11 | rudrankriyam/asc-workflow | 同上 | .asc/workflow.json による自動化 |
| S12 | rshankras/legal/privacy-policy | https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/legal/privacy-policy/SKILL.md | Privacy Policy 生成、ホスティングガイダンス |
| S13 | RevenueCat 公式ドキュメント | https://www.revenuecat.com/docs/getting-started/entitlements | Offerings Setup 手順 |
| S14 | greenstevester/fastlane-skill | https://github.com/greenstevester/fastlane-skill | fastlane setup, match, snapshot, beta, release |
| S15 | conorluddy/ios-simulator-skill | https://github.com/conorluddy/ios-simulator-skill | シミュレータ操作 21 スクリプト |
| S16 | kylehughes/apple-platform-build-tools | https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin | ビルドツール |
| S17 | AvdLee/SwiftUI-Agent-Skill | https://github.com/AvdLee/SwiftUI-Agent-Skill | SwiftUI ベストプラクティス |
| S18 | App Store Scraper | https://mcpmarket.com/tools/skills/app-store-scraper | App Store データ抽出（Lens 4 用） |
| S19 | mobileapp-builder CRITICAL RULES | ローカル: /Users/anicca/.claude/skills/mobileapp-builder/SKILL.md | 40個の実機確認済み Apple ルール（事実） |
| S20 | rudrankriyam/asc-app-create-ui | https://github.com/rudrankriyam/app-store-connect-cli-skills/tree/main/skills/asc-app-create-ui | ブラウザ自動化でASCアプリ作成（REST API未提供のため） |
| S21 | snarktank/ralph ralph.sh | https://github.com/snarktank/ralph/blob/main/ralph.sh | Ralph Loop（for ループ + --print + tee + COMPLETE検出） |
| S22 | snarktank/ralph CLAUDE.md | https://github.com/snarktank/ralph/blob/main/CLAUDE.md | 1 US per iteration + progress.txt + prd.json パターン |
| S23 | fastlane docs ASC API | https://docs.fastlane.tools/app-store-connect-api/ | 「produce — API Key: No」= アプリ作成はAPI Key不可 |
| S24 | Apple公式 | asc apps create --help | 「App creation requires Apple ID authentication (not API key)」|

---

## 8. Slack レポート頻度

各フェーズ完了時 + 30分ごとの進捗報告:
- Phase 0-3 完了: アイデア + スペック + ファイルパス
- Phase 4 進捗: 30分ごと（何を実装中か）
- Phase 4 完了: 実装完了 + reviewer スコア
- Phase 5 完了: テスト結果
- Phase 6 各ステップ: 6.1-6.14 の各完了時
- Phase 6 完了: WAITING_FOR_REVIEW 🎉

通知先: Slack #metrics (C091G3PKHL2)

---

## 9. 人間ストップ（1回のみ — ファクトリーは止まらない）

ファクトリーは一切止まらない。全フェーズを連続実行する。
人間の操作が必要な箇所は Slack で通知するが、待たない。

### ファクトリーのフロー（止まらない）

Phase 0-3: 完全自動 → Slack 報告 → Phase 4 へ
Phase 4: 完全自動 → Slack 報告 → Phase 5 へ
Phase 5: 完全自動 → Slack 報告 → Phase 6 へ
Phase 6:
  6.1-6.10: 完全自動
  6.11: TestFlight アップロード完了 → Slack 通知「TestFlight で確認できます」→ 止まらず続行
  6.12: submission-health preflight → 自動
  6.13: ★ここだけ止まる ★
        → Slack: 「App Privacy を ASC Web で設定してください」
        → Dais が設定完了を Slack で報告
        → ファクトリー再開 → 6.14 submit
  6.14: asc submit create → WAITING_FOR_REVIEW → Slack 報告

### 人間がやること（まとめ）

| # | いつ | 何をするか | 止まるか | どこで |
|---|------|-----------|---------|-------|
| 1 | Phase 6.11 後 | TestFlight テスト | ❌ 止まらない（後で見ればいい） | iPhone TestFlight |
| 2 | Phase 6.13 | App Privacy 設定 | ✅ ここだけ止まる（API で設定不可） | ASC Web |
| 3 | リジェクト時 | 審査対応 | - （事後） | ASC Web |

### なぜ App Privacy だけ止まるか

mobileapp-builder CRITICAL RULE #18:
「App Privacy（データの使用方法）は ASC API で設定不可。
/v1/apps/{id}/appDataUsages は 404 を返す。」

これは Apple の制限。CLI でも API でも設定できない。
ASC Web で人間が手動で設定するしかない。
設定しないと submit が通らない。

### TestFlight は止まらない理由

TestFlight テストは「後で見ればいい」。
ファクトリーは TestFlight にアップロードした後、
Dais の確認を待たずに 6.12 → 6.13 → 6.14 と進む。
もし後で TestFlight で問題が見つかったら、
Phase 7（POST-LAUNCH）で v1.0.1 として修正する。

---

## 10. Anicca（Sonnet）の監視・報告サイクル

ソース: ralph-loop-agent SKILL.md (clawhub)
引用: 「Uses process tool to monitor progress and detect completion」

### 監視ループ

ralph.sh（snarktank/ralph）がループ管理を自動で行う:

1. ralph.sh が for ループで claude --print < CLAUDE.md を実行
2. 1 iteration = 1 US = 1 セッション（コンテキストリセット）
3. progress.txt で前 iteration の学びを引き継ぎ
4. <promise>COMPLETE</promise> 検出で自動終了
5. ralph.sh 終了 → notifyOnExit → Anicca 起動 → Slack 完了報告

Anicca の役割:
- ralph.sh 起動前: prd.json + CLAUDE.md 生成、Slack に起動報告
- ralph.sh 終了後: Slack に完了報告
- App Privacy 待ち: Slack 通知 → Dais 完了 → .app-privacy-done 作成 → ralph.sh 再起動

### Slack 報告タイミング

| タイミング | 報告内容 |
|-----------|---------|
| Factory 起動時 | 「🏭 Factory 起動。今日のアプリを作ります」 |
| 各 iteration 開始 | 「🏭 Iteration N: US-XXX 開始」 |
| 各 iteration 完了 | 「✅ US-XXX 完了: [成果物]」 |
| US-005 実行中 | 30分ごとにログから進捗抜粋 |
| US-007 完了 | 「📱 TestFlight 配布完了。確認してください」 |
| App Privacy 必要 | 「⏸️ App Privacy 設定してください」 |
| Dais が「完了」→ submit | 「🎉 提出完了！WAITING_FOR_REVIEW」 |
| エラー時 | 「❌ US-XXX 失敗: [エラー内容]」 |

### App Privacy 待ちの仕組み

1. US-007 完了 → Anicca が Slack に通知
2. Dais が ASC Web で App Privacy 設定
3. Dais が Slack #metrics で「完了」と投稿
4. Anicca が Slack メッセージを受信（OpenClaw が自動ルーティング）
5. Anicca が `touch daily-apps/<name>/.app-privacy-done` を exec で実行
6. Anicca が次の iteration を起動（US-008 再試行）
7. Claude Code が .app-privacy-done を検出 → asc submit create
8. WAITING_FOR_REVIEW → Slack 報告

---

## 11. Dais が見る方法

MacBook Pro から Mac Mini の Claude Code セッションを見る:

```bash
# セッション一覧
ssh anicca@AniccanoMac-mini.local -t "tmux ls"

# セッションにアタッチ（リアルタイム閲覧 + 介入可能）
ssh anicca@AniccanoMac-mini.local -t "tmux attach -t factory"
```

Anicca が Claude Code を起動する時は tmux セッション名 `factory` で起動する。

---

## 12. OSS 化（github.com/Daisuke134/mobileapp-builder）

ファイル構成:
- SKILL.md — v3 spec ベースの実行手順
- README.md — 8フェーズ説明 + ビジュアルフロー
- SETUP.md — 6リポインストール + 環境変数設定
- check-prerequisites.sh — 全依存チェックスクリプト

ユーザー体験: git clone → SETUP.sh → "build me an app" → App Store に提出

---

## 13. cron 設定

本番: 毎日 07:00 JST（= 14:00 PST）
テスト: 実装完了 2 分後に 1 回だけ実行（検証用）

cron コマンド（本番）:
```
openclaw cron add --schedule "0 7 * * *" --timezone "Asia/Tokyo" --prompt "Execute mobileapp-factory skill. Read /Users/anicca/.openclaw/skills/mobileapp-factory/SKILL.md and follow it."
```

cron コマンド（テスト — 1回限り）:
```
openclaw cron add --schedule "<実装完了2分後>" --timezone "America/Los_Angeles" --prompt "Execute mobileapp-factory skill. Read /Users/anicca/.openclaw/skills/mobileapp-factory/SKILL.md and follow it." --once
```

---

## 14. スキル役割分担

### mobileapp-factory（監督 — Sonnet が実行）

ralph-loop-agent パターンに従う。

やること:
1. prd.json を daily-apps/<name>/ に生成
2. CLAUDE.md を daily-apps/<name>/ に生成
3. exec で Claude Code Opus を起動（pty:true, background:true）
4. process tool で 30秒ごと監視
5. ログを読んで Slack #metrics に報告（message tool）
6. Claude Code 終了 → prd.json チェック → 次の iteration 起動
7. Dais が Slack で「完了」→ .app-privacy-done を touch → iteration 起動
8. 全 passes:true → 完了報告

中身: prd.json 生成 + CLAUDE.md 生成 + exec/process ループ + Slack 報告

### mobileapp-builder（選手 — Claude Code Opus が実行）

やること:
1. CLAUDE.md を読む → prd.json の次の未完了 US を実行
2. CRITICAL RULES 40個を遵守
3. Pencil MCP でスクショ生成
4. asc-* スキルで ASC 操作
5. 完了時: prd.json の passes を true に更新
6. progress.txt に記録
7. git commit
8. 全 US 完了なら <promise>COMPLETE</promise>

中身: Phase 0-7 全手順 + CRITICAL RULES + フォルダ構成

### rshankras WORKFLOW.md について

rshankras/claude-code-apple-skills の WORKFLOW.md は各 Phase を人間が手動トリガーする前提。
自律ループ機能はない。
→ Ralph Loop（snarktank/ralph）で自律化する。
→ rshankras の各スキル（Phase 0-7 の中身）はそのまま使う。

### フロー図

```
cron 07:00 JST
    │
    ▼
mobileapp-factory (Opus/Anicca)
    │ prd.json + CLAUDE.md を生成
    │ tmux 内で ralph.sh 起動
    │
    ▼
ralph.sh (for ループ — snarktank/ralph 完コピ)
    │
    ├─ Iteration 1: claude --print < CLAUDE.md
    │  → US-001 実行 → passes:true → progress.txt → git commit → 終了
    │  sleep 2
    ├─ Iteration 2: claude --print < CLAUDE.md
    │  → US-002 実行（progress.txt から前回の学びを読む）
    │ ...
    ▼
Iteration 7 ──────────────────▶ US-007 実行（TestFlight）
    │ Slack: 「TestFlight 確認してください」
    ▼
Iteration 8 ──────────────────▶ US-008 試行
    │ .app-privacy-done なし → passes:false のまま
    │
    │ Slack: 「App Privacy 設定してください」
    │ ★ Dais が ASC Web で設定 ★
    │ Dais が Slack で「完了」
    │ Anicca が touch .app-privacy-done
    │
    ▼
Iteration 9 ──────────────────▶ US-008 再試行
    │ .app-privacy-done あり!
    │ asc submit create → WAITING_FOR_REVIEW
    │ <promise>COMPLETE</promise>
    │
    ▼
Slack: 「🎉 提出完了！」
完了
```

---

## 15. 2FA とアプリ作成の真実（2026-03-01 更新）

### Apple の制限（変更不可）

ソース: asc CLI help
引用: 「NOTE: App creation requires Apple ID authentication (not API key).」

ソース: Apple 2FA trusted device docs
URL: https://support.apple.com/en-us/102660
引用: 「After you sign in the first time, you won't be asked for a verification code on that device again unless you sign out completely.」

### 結論

- **アプリ「作成」だけ**: Apple ID + パスワード + 2FA が必要。REST API（JWT）では不可。
- **それ以外**: API Key（JWT）で全て 2FA 不要。
  - builds upload, submit create, metadata, screenshots, TestFlight — 全部 API Key。

### アプリ作成フロー（PHASE 4 に反映する内容）

#### Step 0: Playwright クッキー有効期限チェック

```bash
COOKIE_META=~/.asc/playwright-auth.json
if [ -f "$COOKIE_META" ]; then
  EXPIRES=$(python3 -c "import json;print(json.load(open('$COOKIE_META'))['expires_at'])")
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  if [[ "$NOW" < "$EXPIRES" ]]; then
    echo "✅ クッキー有効。Step 1 へ。"
  else
    echo "⚠️ クッキー期限切れ。Step 0b へ。"
  fi
else
  echo "❌ クッキーなし。Step 0b へ。"
fi
```

#### Step 0b: Playwright 再ログイン

```bash
node ~/.claude/skills/asc-app-create-ui/scripts/asc-login.js
# → 2FA コード1回（system event で要求）
# → ~/.asc/playwright-cookies.json 保存
# → ~/.asc/playwright-auth.json 更新:
#   {"last_login":"2026-03-01T00:00:00Z","expires_at":"2026-03-29T00:00:00Z"}
```

#### Step 1: asc apps create（2FA なし）

クッキーが有効なら 2FA を聞かれない。

```bash
asc apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --primary-locale en-US
```

#### Step 1 失敗時フォールバック: Slack に手動作成依頼

```
system event → Slack:

📱 ASC でアプリを手動作成してください（30秒）

https://appstoreconnect.apple.com → + → 新規App

コピペ情報:
  プラットフォーム: iOS
  名前: <app_name>
  プライマリ言語: English (U.S.)
  バンドルID: <bundle_id>
  SKU: <slug>
  ユーザアクセス: アクセス制限なし

完了したら「完了」と送ってください。
```

#### ⚠️ 現状（2026-03-01）

Playwright は未実装。実装されるまで Step 0/0b をスキップしてフォールバック（Slack 手動作成依頼）を使う。
