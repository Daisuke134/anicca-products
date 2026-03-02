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
