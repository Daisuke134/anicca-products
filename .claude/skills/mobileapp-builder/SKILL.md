---
name: mobileapp-builder
description: Build and ship iOS apps to the App Store autonomously. Use when triggered by factory cron or told to "build an app", "run factory", "ship an app". Executes 9 user stories (US-001 to US-009) via ralph.sh loop, each as one Claude Code session.
allowed-tools: [Read, Write, Bash, Edit, Glob, Grep]
metadata:
  author: Anicca
  version: 3.0.0
  workflow-source: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md
  loop-source: https://github.com/snarktank/ralph
---

# mobileapp-builder

Build and ship one iOS app per day to the App Store. Zero manual work except 1 Slack interaction (RC project + keys).

## Architecture

Source: rshankras ProductAgent WORKFLOW.md + snarktank/ralph

- **ralph.sh** loops through 9 US (user stories) in prd.json
- **1 US = 1 CC session** (one context window)
- Each US reads its `references/us-00X-*.md` for detailed instructions
- Each US reads relevant rshankras skills from `.claude/skills/`
- **validate.sh** runs after each iteration as external quality gate

## 9 User Stories (ralph dependency order)

| US | Phase | What | Skills | Reference |
|----|-------|------|--------|-----------|
| US-001 | Idea Discovery | Trend research + idea selection | `idea-generator` + trend-hunter | `references/us-001-trend.md` |
| US-002 | Product Planning | Problem validation + MVP + positioning | `prd-generator` | (output: product-plan.md) |
| US-003 | Market Research | Competitive analysis + TAM/SAM/SOM | `competitive-analysis` + `market-research` | (output: competitive-analysis.md + market-research.md) |
| US-004 | Spec Generation | 7 docs (PRD, Architecture, UX, Design, Implementation, Test, Release) | `implementation-spec` orchestrator | `references/us-004-specs.md` |
| US-005 | Infrastructure | ASC app + IAP + RC project + offerings | `asc-cli-usage` + `revenuecat` + RC MCP | `references/us-005-infra.md` |
| US-006 | Implementation | Code the app following IMPLEMENTATION_GUIDE.md | `ios-ux-design` + `paywall-generator` + generators/* | `references/us-006-implement.md` |
| US-007 | Testing | Unit + Integration + Maestro E2E (subscription purchase) | `tdd-feature` + `test-spec` + `maestro-e2e` | `references/us-007-testing.md` |
| US-008 | Release Prep | Screenshots (AXe) + metadata + build + upload + release-review | `axe-ios-simulator` + `asc-shots-pipeline` + `release-review` | `references/us-008-release.md` |
| US-009 | Submit | App Privacy (manual) + submit → WAITING_FOR_REVIEW | `asc-submission-health` | `references/us-009-submit.md` |

## Slack Interaction (1回のみ, US-005)

CC sends to Slack #metrics:
```
📱 <app_name> の RC セットアップをお願いします（5分）:
1. https://app.revenuecat.com → + Create new project → 名前: <app_name>
2. + App → App Store → Bundle ID: <bundle_id>
3. アプリ設定 → In-app purchase key configuration →
   .p8: $ASC_PRIVATE_KEY_PATH の .p8 / Key ID: $ASC_KEY_ID / Issuer ID: $ASC_ISSUER_ID
   → Save →「Valid credentials」確認
4. 返信してください:
   a) プロジェクトURL（例: https://app.revenuecat.com/projects/proj______）
   b) V2 Secret Key: Project Settings → API Keys → + New → V2 → 全権限 → sk_
   c) Public iOS Key: API Keys の Apple App Store 横 → appl_
→「done」+ 3つのキーを返信
```

## CRITICAL RULES

| # | Rule |
|---|------|
| 1 | **提出前に全サブスクが READY_TO_SUBMIT**。MISSING_METADATA → Guideline 2.1 拒否 |
| 2 | **IAP pricing は全175カ国** |
| 3 | **Superwall 禁止。RevenueCat SDK のみ** |
| 4 | **ビルドは xcodebuild。提出後は ASC CLI のみ** |
| 5 | **validate.sh が STOP ゲート**。FAIL なら次に進まない |
| 6 | **availability set は pricing の前** |
| 7 | **Privacy Policy URL は en-US AND ja 両方** |
| 8 | **RC Offerings は TestFlight 前に設定** |
| 9 | **locale は `ja`（`ja-JP` 無効）** |
| 10 | **IAP key は同一アカウントで使い回し** |
| 11 | **Paywall コピーは実機能確認してから書く** |
| 12 | **Mixpanel 必須。paywall_viewed イベント送信** |
| 13 | **RC → Mixpanel 連携必須** |
| 14 | **スクショは AXe 本物（`brew install cameroncooke/axe/axe`）。axe-shim 禁止** |
| 15 | **RC/Mixpanel API キーは Info.plist から。環境変数禁止** |
| 16 | **screenshot-creator スキル禁止。Koubou（`asc screenshots frame`）のみ** |
| 17 | **自前 SwiftUI PaywallView 必須。RevenueCatUI.PaywallView 禁止** |
| 18 | **ATT 禁止** |
| 19 | **オンボーディング最終画面はソフトペイウォール** |
| 20 | **validate.sh を CC が編集・削除禁止（外部品質ゲート）** |
| 21 | **1アプリ = 1 RC プロジェクト** Source: https://community.revenuecat.com/general-questions-7/project-vs-app-1899 |
| 22 | **AXe 座標タップでタブ切り替え**。Tab Bar の accessibility label がない場合 |
| 23 | **Maestro E2E テスト必須。サブスク購入フローを含む** |
| 24 | **release-review 5 checklists 必須（US-008）** |
| 25 | **App Privacy は ASC API 不可。手動のみ（US-009）** |
| 26 | **demoAccountRequired = false を明示指定**。デフォルト true でデモアカ未入力だと提出ブロック |
| 27 | **PrivacyInfo.xcprivacy 必須**。Source: Apple WWDC23 |
| 28 | **ITSAppUsesNonExemptEncryption = NO を Info.plist に追加** |
| 29 | **KEYCHAIN_PASSWORD は env var から。ハードコード禁止**。Source: 12-Factor App |
| 30 | **availability set BEFORE pricing**。逆だと Apple 500 エラー |
| 31 | **asc validate Errors=0 必須（submit 前 STOP GATE）** |
| 32 | **提出コマンド: submissions-create + items-add + submissions-submit** |
| 33 | **Fastfile destination は UDID**。名前だと not found エラー |
| 34 | **RC delegate 名前衝突回避**。`RCPurchasesDelegate: NSObject, PurchasesDelegate` |
| 35 | **iOS 15: `Locale.current.language.languageCode` 禁止**。`Locale.current.languageCode` を使う |
| 36 | **iOS 15: `scrollContentBackground` 禁止**。ZStack + Color で代替 |
| 37 | **アイコンはビルド前に配置**。後から変更は version bump + 再ビルド |
| 38 | **SPM に RevenueCatUI を追加しない。RevenueCat のみ** |
| 39 | **毎 iteration = 新 CC プロセス（フレッシュ context）**。前回の学びは progress.txt のみ |

## Quality Gate Pattern

Source: SonarQube (https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates)
> "It can be used to fail your CI pipeline if the quality gate fails."

Each US starts by verifying the previous US acceptance criteria.
Gate fails → do not execute this US. Fix the previous US first.
See each `references/us-00X.md` for specific gate checks.

## Folder Structure

Source: v3 spec §3

```
mobile-apps/<app-name>/
├── spec/01-trend.md              ← US-001
├── product-plan.md               ← US-002
├── competitive-analysis.md       ← US-003
├── market-research.md            ← US-003
├── progress.txt                  ← shared across iterations
├── .env                          ← RC keys (written by Anicca)
├── .app-privacy-done             ← touch by Anicca after Dais confirms
├── docs/                         ← US-004
│   ├── PRD.md, ARCHITECTURE.md, UX_SPEC.md, DESIGN_SYSTEM.md
│   ├── IMPLEMENTATION_GUIDE.md, TEST_SPEC.md, RELEASE_SPEC.md
├── screenshots/raw/ + framed/    ← US-008
└── <AppName>ios/                 ← US-006
    ├── <AppName>.xcodeproj/
    ├── <AppName>/ (App/, Views/, Models/, Services/, Resources/)
    └── <AppName>Tests/           ← US-007
```

## Reporting (ralph.sh → Slack)

ralph.sh posts to Slack #metrics (C091G3PKHL2) via curl after each iteration.
CC does NOT post to Slack. ralph.sh (bash) does.

```bash
# In ralph.sh, after each iteration:
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{"channel":"C091G3PKHL2","text":"🏭 Iteration $i done: $(head -3 progress.txt)"}"
```
## Reviewer Agent (v2 で追加予定)
Source: ManaLabs (https://manalabs.wtf/appfactory)
> 「A separate reviewer agent independently verifies every file」
v1 では validate.sh が品質ゲート。v2 で独立 reviewer agent を追加する。

## User Decision Gates (自動化)
Source: rshankras WORKFLOW.md — 各 Phase で「User Decision: BUILD / DONT BUILD」ゲートがある。
Factory では自動化のため、Rank 1 アイデアを自動選択し User Decision をスキップする。
## Detailed Instructions

**各 US の詳細手順は `references/us-00X-*.md` を参照。**
SKILL.md のコア指示のみここに記載。詳細は references/ に移動済み。

Source: Anthropic "The Complete Guide to Building Skills for Claude"
> "Keep SKILL.md focused on core instructions. Move detailed documentation to references/ and link to it."

## Files

| File | Purpose |
|------|---------|
| `ralph.sh` | Loop executor (1 US = 1 CC session) |
| `validate.sh` | External quality gate (SonarQube pattern) |
| `CLAUDE.md.template` | Template for CC instructions |
| `prd.json.template` | Template for backlog |
| `references/us-001-trend.md` | US-001 detailed instructions |
| `references/us-004-specs.md` | US-004 detailed instructions |
| `references/us-005-infra.md` | US-005 detailed instructions |
| `references/us-006-implement.md` | US-006 detailed instructions |
| `references/us-007-testing.md` | US-007 detailed instructions |
| `references/us-008-release.md` | US-008 detailed instructions |
| `references/us-009-submit.md` | US-009 detailed instructions |
| `references/rshankras-WORKFLOW.md` | rshankras original workflow (reference) |
