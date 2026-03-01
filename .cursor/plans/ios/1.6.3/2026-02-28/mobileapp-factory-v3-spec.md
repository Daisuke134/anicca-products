# mobileapp-factory v3 — 外部スキル100%置き換えスペック

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

v3 は外部スキルで 100% 置き換える。オリジナル 0%。

---

## 1. インストールするスキル（6リポ、175スキル）

### 1-1. rshankras/claude-code-apple-skills（140スキル）
- ソース: https://github.com/rshankras/claude-code-apple-skills
- セキュリティ: 🟢 Benign（MIT、コミュニティ信頼済み）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/rshankras/claude-code-apple-skills.git
cp -r /tmp/claude-code-apple-skills/skills/* /Users/anicca/.claude/skills/
```
- カバー範囲:
  - product/ (13スキル): idea-generator, market-research, competitive-analysis, prd-generator, architecture-spec, ux-spec, implementation-spec, implementation-guide, test-spec, release-spec, beta-testing, localization-strategy, product-agent
  - generators/ (52スキル): auth-flow, paywall-generator, analytics-setup, networking-layer, background-processing, app-extensions, data-export, logging-setup 等
  - ios/ (7スキル): code-review, ui-review, navigation, iPad, migration, accessibility, planning
  - testing/ (8スキル): TDD workflows, test infrastructure, snapshot tests
  - app-store/ (7スキル): ASO, descriptions, keywords, reviews, search ads, rejections, screenshots
  - growth/ (5スキル): analytics, press/media, community, indie business
  - legal/ (2スキル): privacy policies, terms of service
  - monetization/ (1スキル): pricing strategy
  - release-review/ (1スキル): pre-release audit
  - swift/ (3), swiftui/ (5), design/ (2), performance/ (2), security/ (2), core-ml/ (1), apple-intelligence/ (3), macos/ (8), watchos/ (1), visionos/ (1), swiftdata/ (1), mapkit/ (1), foundation/ (1), shared/ (1)

### 1-2. rudrankriyam/app-store-connect-cli-skills（27スキル）
- ソース: https://github.com/rudrankriyam/app-store-connect-cli-skills
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/rudrankriyam/app-store-connect-cli-skills.git
cp -r /tmp/app-store-connect-cli-skills/skills/* /Users/anicca/.claude/skills/
```
- カバー範囲: asc-cli-usage, asc-workflow, asc-app-create-ui, asc-xcode-build, asc-shots-pipeline, asc-release-flow, asc-signing-setup, asc-id-resolver, asc-metadata-sync, asc-localize-metadata, asc-submission-health, asc-testflight-orchestration, asc-build-lifecycle, asc-ppp-pricing, asc-subscription-localization, asc-notarization, asc-crash-triage, asc-wall-submit, gpd-* (Google Play 7スキル)

### 1-3. greenstevester/fastlane-skill（5スキル）
- ソース: https://github.com/greenstevester/fastlane-skill
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/greenstevester/fastlane-skill.git
cp -r /tmp/fastlane-skill/skills/* /Users/anicca/.claude/skills/
```
- カバー範囲: setup-fastlane, beta, release, match, snapshot

### 1-4. conorluddy/ios-simulator-skill（1スキル、21スクリプト）
- ソース: https://github.com/conorluddy/ios-simulator-skill
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/conorluddy/ios-simulator-skill.git
cp -r /tmp/ios-simulator-skill/ios-simulator-skill /Users/anicca/.claude/skills/
```
- カバー範囲: ビルド、テスト、セマンティックUI操作、アクセシビリティテスト

### 1-5. kylehughes/apple-platform-build-tools（1スキル+1サブエージェント）
- ソース: https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin
- セキュリティ: 🟢 Benign（MIT）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin.git
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/skills/* /Users/anicca/.claude/skills/
cp -r /tmp/apple-platform-build-tools-claude-code-plugin/agents/* /Users/anicca/.claude/agents/ 2>/dev/null || true
```
- カバー範囲: xcodebuild basics, archiving, testing, destinations, troubleshooting, SPM

### 1-6. AvdLee/SwiftUI-Agent-Skill（1スキル、242行BP集）
- ソース: https://github.com/AvdLee/SwiftUI-Agent-Skill
- セキュリティ: 🟢 Benign（MIT、SwiftLee = 有名iOS開発者）
- インストール:
```bash
cd /tmp && git clone --depth 1 https://github.com/AvdLee/SwiftUI-Agent-Skill.git
cp -r /tmp/SwiftUI-Agent-Skill/swiftui-expert-skill /Users/anicca/.claude/skills/
```
- カバー範囲: SwiftUI state management, view composition, performance, Liquid Glass

---

## 2. 新しいフロー（rshankras/product/WORKFLOW.md を完コピ）

ソース: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/WORKFLOW.md

```
Phase 0: IDEA DISCOVERY
  スキル: product/idea-generator
  入力: トレンドデータ（trend-hunter の出力）
  出力: idea-shortlist.json

Phase 1: PRODUCT PLANNING
  スキル: product/product-agent
  入力: アイデア
  出力: product-plan-*.md

Phase 2: MARKET RESEARCH（任意だが推奨）
  スキル: product/competitive-analysis + product/market-research
  出力: competitive-analysis.md, market-research.md

Phase 3: SPECIFICATION GENERATION
  スキル: product/implementation-spec（オーケストレーター）
  サブスキル: prd-generator, architecture-spec, ux-spec,
             implementation-guide, test-spec, release-spec
  出力: docs/ に7ファイル自動生成

Phase 4: IMPLEMENTATION
  スキル: generators/* (52スキル), swiftui-expert-skill,
         ios/*, building-apple-platform-products
  入力: docs/IMPLEMENTATION_GUIDE.md
  出力: Xcode プロジェクト

Phase 5: TESTING
  スキル: testing/* (8スキル), ios-simulator-skill
  入力: docs/TEST_SPEC.md
  出力: テスト済みアプリ

Phase 6: FASTLANE + 署名
  スキル: setup-fastlane, match, asc-signing-setup
  出力: Fastlane設定完了

Phase 7: APP STORE メタデータ + スクショ + 価格
  スキル: asc-metadata-sync, asc-localize-metadata,
         asc-shots-pipeline, asc-ppp-pricing,
         asc-subscription-localization, app-store/*,
         legal/* (プライバシーポリシー自動生成),
         monetization/*
  出力: メタデータ + スクショ + 価格設定完了

Phase 8: TESTFLIGHT + APP STORE 提出
  スキル: beta (fastlane), asc-testflight-orchestration,
         asc-submission-health, asc-release-flow,
         release (fastlane), release-review/*
  出力: App Store に提出完了（Waiting for Review）

Phase 9: POST-LAUNCH
  スキル: growth/*, asc-crash-triage
  出力: モニタリング + v1.0.1 準備
```

---

## 3. 既存スキルの削除対象

以下のオリジナルスキルは外部スキルで完全に置き換えられるため削除:

| 削除対象 | 置き換え元 |
|---------|-----------|
| 僕らの mobileapp-builder 14 PHASE | rshankras/product/WORKFLOW.md |
| 僕らの asc-* スキル（重複分） | rudrankriyam/asc-* |
| 僕らの screenshot-creator | rudrankriyam/asc-shots-pipeline |
| 僕らの ralph-autonomous-dev | rshankras/product/product-agent |

---

## 4. mobileapp-factory SKILL.md の書き換え

mobileapp-factory（OpenClaw cron から呼ばれるスキル）は以下だけにする:

1. Claude Code を coding-agent パターン（pty+background）で起動
   → ベストプラクティスは別途検索中（TODO: 結果をここに追記）
2. プロンプト: 「product/WORKFLOW.md の Phase 0 から開始して、Phase 8 まで全自動実行」
3. Slack #metrics に起動報告
4. 完了

---

## 5. 受け入れ条件

| # | 条件 | 確認方法 |
|---|------|---------|
| AC1 | 6リポ全スキルが /Users/anicca/.claude/skills/ に存在 | ls で確認 |
| AC2 | 重複する旧スキルが削除されている | ls で確認 |
| AC3 | mobileapp-factory cron が新フローで動く | 手動テスト |
| AC4 | Claude Code が product/WORKFLOW.md に従って Phase 0 を開始する | ログ確認 |
| AC5 | オリジナルのコードが 0 行 | スペックレビュー |

---

## 6. ソース一覧（全引用）

| ソース | URL | 何をコピーしたか |
|--------|-----|----------------|
| rshankras/claude-code-apple-skills | https://github.com/rshankras/claude-code-apple-skills | 140スキル + WORKFLOW.md |
| rudrankriyam/app-store-connect-cli-skills | https://github.com/rudrankriyam/app-store-connect-cli-skills | 27 asc スキル |
| greenstevester/fastlane-skill | https://github.com/greenstevester/fastlane-skill | 5 fastlane スキル |
| conorluddy/ios-simulator-skill | https://github.com/conorluddy/ios-simulator-skill | 1スキル（21スクリプト） |
| kylehughes/apple-platform-build-tools | https://github.com/kylehughes/apple-platform-build-tools-claude-code-plugin | 1スキル + 1サブエージェント |
| AvdLee/SwiftUI-Agent-Skill | https://github.com/AvdLee/SwiftUI-Agent-Skill | 1 SwiftUI BP スキル |
