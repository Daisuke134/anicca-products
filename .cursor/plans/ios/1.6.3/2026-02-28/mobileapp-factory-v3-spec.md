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
| Session 2 | Phase 4 (Implementation) | Session 1 完了 → openclaw system event | 数時間（自動） |
| Session 3 | Phase 5 (Testing) | Session 2 完了 → openclaw system event | 数時間（自動） |
| Session 4 | Phase 6 (Ship) | Session 3 完了 → openclaw system event | 数時間（自動） |
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

## 9. 人間ストップ（3回のみ）

| # | いつ | 何をするか | どこで |
|---|------|-----------|-------|
| 1 | Phase 6.11 | TestFlight テスト | iPhone の TestFlight アプリ |
| 2 | Phase 6.13 | App Privacy 手動設定 | ASC Web (appstoreconnect.apple.com) |
| 3 | リジェクト時 | Apple 審査対応 | ASC Web |

それ以外は全自動。

---

## 10. セッション間チェーン（openclaw system event）

ソース: OpenClaw coding-agent SKILL.md + OpenClaw docs (https://docs.openclaw.ai/cli/system) + Reddit r/ClaudeAI (https://reddit.com/r/ClaudeAI/comments/1r4jqyc/)

仕組み:
1. Claude Code が完了時に `openclaw system event --text "Phase N complete for <name>" --mode now` を実行
2. OpenClaw の heartbeat が即座にトリガー（--mode now）
3. Anicca のセッションに System メッセージとして届く
4. Anicca が次の Claude Code セッションを coding-agent pty+bg で起動

前提条件: heartbeat が有効であること（現在: 1h 間隔 ✅）
引用: 「openclaw system event --mode now doesn't wake the agent if no heartbeat is configured at all」

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
