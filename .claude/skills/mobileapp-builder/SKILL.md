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

Build and ship one iOS app per day to the App Store. 詳細は各 references/us-XXX.md を参照。

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
| US-001 | Idea Discovery | Trend research + idea selection | `idea-generator` | `references/us-001-trend.md` |
| US-002 | Product Planning | Problem validation + MVP + positioning | `prd-generator` | (output: product-plan.md) |
| US-003 | Market Research | Competitive analysis + TAM/SAM/SOM | `competitive-analysis` | `references/us-003-research.md` |
| US-004a | Core Spec | PRD, ARCH, IMPL, TEST, RELEASE 生成 | `implementation-spec` | `references/us-004-specs.md` |
| US-004b | UX Spec | UX_SPEC, DESIGN_SYSTEM 生成 | `ios-ux-design` | `references/us-004-specs.md` |
| US-004-R | Spec Review | 全7ドキュメントレビュー → CRITICAL=0 | code-quality-reviewer (subagent) | `references/us-004-specs.md` |
| US-005a | Infrastructure | Privacy Policy + ASC app creation | `asc-cli-usage` | `references/us-005a-infra.md` |
| US-005b | Monetization | IAP + pricing + RC project + offerings | `asc-ppp-pricing` | `references/us-005b-monetization.md` |
| US-006a | TDD Data Layer | xcconfig, Protocol DI, Models, Services | `tdd-feature` | `references/us-006-implement.md` |
| US-006b | TDD Onboarding + Monetization | MVVM分割, Onboarding, PaywallView | `tdd-feature` | `references/us-006-implement.md` |
| US-006c | TDD Core Screens | Timer, Settings, ProgressDashboard | `tdd-feature` | `references/us-006-implement.md` |
| US-006d | TDD Polish | DESIGN_SYSTEM tokens, a11y IDs, Localization | `tdd-feature` | `references/us-006-implement.md` |
| US-006-R | Code Review | 006a-d 全体レビュー → CRITICAL=0 | code-quality-reviewer (subagent) | `references/us-006-implement.md` |
| US-007 | Testing | Maestro E2E (6 flows + Fix Loop) | `maestro-ui-testing` (RC Test Store + Fix Loop) | `references/us-007-testing.md` |
| US-008a | Screenshots | Capture + upload + review screenshots (en-US + ja) | `asc-shots-pipeline` | `references/us-008-release.md` Steps 1a-1h |
| US-008b | Metadata | ASC metadata sync (en-US + ja) | `asc-metadata-sync` | `references/us-008-release.md` Step 2 |
| US-008c | Build + Upload | IPA build + upload + version attach | `asc-xcode-build` | `references/us-008-release.md` Step 3 |
| US-008d | Compliance | Age rating + encryption + rights + availability + pricing + review details | `asc-release-flow` | `references/us-008-release.md` Steps 4-6 |
| US-008e | Preflight + TF | release-review + validate + TestFlight + Slack | `release-review` | `references/us-008-release.md` Steps 7-10 |
| US-009 | Submit | App Privacy (auto: asc web privacy) + submit → WAITING_FOR_REVIEW | `asc-submission-health` | `references/us-009-submit.md` |


## Slack Interaction

WAITING_FOR_HUMAN の詳細は `references/us-005a-infra.md`（2FA）と `references/us-005b-monetization.md`（RC setup）を参照。


## CRITICAL RULES

| # | Rule |
|---|------|
| 1 | **提出前に全サブスクが READY_TO_SUBMIT**。MISSING_METADATA → Guideline 2.1 拒否 |
| 2 | **IAP pricing は全175カ国** |
| 3 | **Superwall 禁止。RevenueCat SDK のみ** |
| 4 | **ビルドは `fastlane build` / `fastlane test`。xcodebuild 直接禁止。提出後は ASC CLI のみ** |
| 5 | **validate.sh が STOP ゲート**。FAIL なら次に進まない |
| 6 | **availability set は pricing の前** |
| 7 | **Privacy Policy URL は en-US AND ja 両方** |
| 8 | **RC Offerings は TestFlight 前に設定** |
| 9 | **locale は `ja`（`ja-JP` 無効）** |
| 10 | **IAP key は同一アカウントで使い回し** |
| 11 | **Paywall コピーは実機能確認してから書く** |
| 12 | **アナリティクス SDK 禁止**。Mixpanel/Firebase Analytics 等は入れない（CLAUDE.md Rule 17 参照） |
| 13 | **(欠番 — 旧 Mixpanel 連携ルール削除済)** |
| 14 | **スクショは AXe 本物（`brew install cameroncooke/axe/axe`）。axe-shim 禁止** |
| 15 | **RC API キーは Info.plist から。環境変数禁止** |
| 16 | **screenshot-creator スキル禁止。Koubou（`asc screenshots frame`）のみ** |
| 17 | **自前 SwiftUI PaywallView 必須。RevenueCatUI.PaywallView 禁止** |
| 18 | **ATT 禁止** |
| 19 | **オンボーディング最終画面はソフトペイウォール** |
| 20 | **validate.sh / ralph.sh を CC が編集・削除禁止（外部品質ゲート）** |
| 40 | **テンプレート編集禁止**: `.claude/skills/mobileapp-builder/` 内の prd.json, SKILL.md, CLAUDE.md は CC 編集禁止。`$APP_DIR/prd.json` のみ編集可 |
| 21 | **1アプリ = 1 RC プロジェクト** Source: https://community.revenuecat.com/general-questions-7/project-vs-app-1899 |
| 22 | **AXe 座標タップでタブ切り替え**。Tab Bar の accessibility label がない場合 |
| 23 | **Maestro E2E テスト必須。サブスク購入フローを含む** |
| 24 | **release-review 5 checklists 必須（US-008e）** |
| 25 | **App Privacy は asc web privacy apply + publish で自動（US-009）** |
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
| 41 | **.pbxproj 直接編集禁止**。CC がファイル作成→手動で Xcode に追加。Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj 「Never let AI modify .pbxproj files. Create files with Claude Code, add them to Xcode manually.」 |
| 41 | **.pbxproj ファイルを CC が編集禁止**。Source: Kris Puckett (https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj) 核心の引用: 「Never let AI modify .pbxproj files. Create files with Claude Code, add them to Xcode manually.」 |
| 41 | **IAP は2-3プラン: monthly + annual OR weekly + monthly + annual**。Source: Adapty iOS Paywall Design Guide 2026 (https://adapty.io/blog/how-to-design-ios-paywall/) — 「2 products vs 1 product +61%; 3 products vs 2 products +44%」。RevenueCat State of Subscription Apps 2025 — "Weekly plans capturing 47% of total revenue" |
| 42 | **US-005a 開始時に iris セッション確認必須**。`asc web auth status` で authenticated=false なら即 WAITING_FOR_HUMAN。retry 禁止。Source: Internal — iris session expiry blocked 5+ factory runs |
| 43 | **XcodeBuildMCP使用（raw xcodebuild禁止）**。Never use raw xcodebuild commands. Always use MCP tool: `mcp__xcodebuildmcp__build_sim_name_proj`, `mcp__xcodebuildmcp__test_sim_name_proj`. Source: https://gist.github.com/joelklabo/6df9fa603bec3478dec7efc17ea44596 |
| 44 | **iOS Simulator Skill（自動検出・自動起動）**。シミュレータ起動・操作はios-simulator-skillに任せる。手動でsimctl起動しない。Claude Code automatically detects when to use this skill. Source: https://github.com/conorluddy/ios-simulator-skill |
| 45 | **フィードバックループを閉じる**。ビルド後は必ずシミュレータで起動し、動作確認を実施。エラーログをClaude Codeが直接読めるようにする。"Focus on closing the feedback loop, i.e., claude code does best when it can process the result of its changes in the most direct way possible." Source: https://plankenau.com/blog/post/claude-coding-an-ios-app |
| 46 | **.pbxprojファイルはClaude Codeに触らせない（CRITICAL）**。新規ファイル作成はClaude Codeで、Xcodeプロジェクトへの追加は手動で行う。.pbxprojの直接編集を絶対禁止。"Never let AI modify .pbxproj files. Create files with Claude Code, add them to Xcode manually." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 47 | **iOS 26対応 — 新age rating system**。iOS 26以降のage ratingを正しく設定。古いrating keyは使わない。"Ratings for all apps and games on the App Store have been automatically updated to align with our new age rating system" Source: https://developer.apple.com/news/upcoming-requirements/ |
| 48 | **xcodebuild -destination で複数デバイステスト**。xcodebuild test実行時に `-destination 'platform=iOS Simulator,name=iPhone 16 Pro'` で明示的にデバイス指定。Source: https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/testing_with_xcode/chapters/08-automation.html |
| 49 | **Kodeco iOS Build Automation Guide準拠**。ビルド→アーカイブ→エクスポート→アップロードの全自動化パイプラインをKodecoガイドに従って実装。Source: https://www.kodeco.com/books/ios-app-distribution-best-practices/v1.0/chapters/12-build-automation |
| 50 | **必ず plan mode で開始**。全タスク開始時に plan mode でインタビューし、段階的計画を立てる。"always start with plan mode. ask Claude to interview you; ask the user a question" Source: https://github.com/shanraisshan/claude-code-best-practice |
| 51 | **変更後は必ずテスト**。Clean build folder (Cmd+Shift+K) → run → console 確認。"Test after every change!! Catch issues before they compound." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 52 | **1コンポーネント限定**。1セッションで1コンポーネントのみ実装。"Don't ask to 'refactor the whole app' Smaller scope = better results." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 53 | **iOS gotcha を即記録**。iOS 26 API問題等は .claude/rules/platform-gotchas.md に即追記。"NO .background() before .glassEffect() saved me from repeating that mistake 50+ times." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 54 | **CLAUDE.md は200行以内**。超える場合は .claude/rules/ に分割。"CLAUDE.md should target under 200 lines per file. 60 lines in humanlayer" Source: https://github.com/shanraisshan/claude-code-best-practice |
| 55 | **/compact at 50% context**。context 50%到達で手動 /compact 実行。"avoid agent dumb zone, do manual /compact at max 50%." Source: https://github.com/shanraisshan/claude-code-best-practice |
| 56 | **Cross-model QA**。実装完了後 Codex で plan/code をレビュー。"use a cross-model for QA — e.g. Codex for plan and implementation review" Source: https://github.com/shanraisshan/claude-code-best-practice |
| 57 | **Feature flags for experimental**。新機能は feature flag で on/off。"Toggle new features on/off without rebuilding. Makes rolling back instant." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 58 | **Debug logging を必ず追加**。複雑なフローには Logger 追加。"Ask Claude Code to add Logger statements for complex flows." Source: https://www.linkedin.com/posts/kris-puckett-0109041b_if-youre-building-an-ios-app-with-claude-activity-7393778932807852032-Pkuj |
| 59 | **Paywall に微細アニメーション**。Button pulse、entrance effects、motion で conversion +12~18%。静止画面の 2.9 倍。Source: https://adapty.io/blog/how-to-design-ios-paywall/ — 「Animated paywalls produce 2.9× higher conversion rates than static designs」 |
| 60 | **Paywall で user name personalization**。"[Name], unlock your premium features" で conversion +17%。Source: https://adapty.io/blog/how-to-design-ios-paywall/ — 「Adding the user's name to paywall copy (increases conversions by 17%)」 |
| 61 | **Discount percentage を prominent 表示**。"Save 50%" badge + strikethrough price で conversion +20~30%。Source: https://www.revenuecat.com/blog/growth/paywall-conversion-boosters/ |
| 62 | **Free trial を複数箇所で強調**。Headline、CTA、pricing に繰り返し記載で conversion +15~25%。Source: https://adapty.io/blog/how-to-design-ios-paywall/ — 「Trial mentioned multiple times: +15% to +25%」 |
| 63 | **Benefit-driven CTA**。"Subscribe" → "{Start\|Get\|Unlock} {my\|your} {plan\|access}" で conversion 向上。Source: https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/ — 「Replace generic CTAs like "Subscribe" with benefit-driven ones」 |
| 64 | **Social proof を pricing 近くに配置**。Reviews、testimonials、logos を paywall に追加で trust 向上。Source: https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/ |
| 65 | **Price anchoring copy**。"Just 33¢ per day" または "Less than a coffee per week" で高額感を軽減。Source: https://www.revenuecat.com/blog/growth/paywall-conversion-boosters/ |
| 66 | **docs/ で禁止キーワードは代替表現**。Grep AC が FAIL する。RevenueCatUI → "RC-UI-package", Mixpanel → "tracking-SDK", FoundationModels → "Apple-FM-API"。Source: Internal — 5+ apps (20260307-202456, 20260309-005930) |
| 67 | **Availability BEFORE Pricing (ASC API)**。`asc subscriptions availability set` を `asc subscriptions prices add` より前に実行。逆だと Apple API 500 エラー。Source: Internal — 4 apps (20260304-105016, 20260307-202456) |
| 68 | **ASC API Key: Developer role は app create 不可**。`asc apps create` は Apple ID + 2FA 必須。API Key は bundle-ids create のみ。"Admin" or "App Manager" role が必要。Source: Internal — 3 apps (20260301-app, 20260304-070221) |
| 69 | **RevenueCat Package は mock 不可**。Unit test では guard path（empty packages）+ restore path をテスト。購入フローは E2E で検証。Source: Internal — 3 apps (20260307-002214, 20260308-070022) |
| 70 | **iTunes API exact match は jq フィルタ必須**。`term=` は partial match。`jq 'select(.trackName | ascii_downcase == "exact_name")'` で完全一致確認。Source: Internal — 4 apps (20260304-070221, 20260308-070022) |
| 71 | **iris session は ~7日で expire**。PREFLIGHT Check 6 で `asc web auth status` 確認必須。authenticated=false なら即 WAITING_FOR_HUMAN（2FA 必要）。Source: Internal — 4 apps (20260304-070221, 20260307-223953) |
| 72 | **Grep-based Gate check は context 確認**。"Don't use Mixpanel" も "Mixpanel" にマッチ。禁止記載時は代替表現を使う。Source: Internal — 3 apps (20260307-202456, 20260309-005930) |
| 73 | **Weekly subscription を primary option に**。Weekly = 55.5% of app revenue (2026)、install-to-trial 9.8% vs 1.8% annual。Weekly+trial が最高 LTV 成長率（636% vs annual 18.6%）。Source: https://adapty.io/blog/mobile-app-monetization-2026/ — 「Weekly subscriptions now generate 55.5% of all app revenue」 |
| 74 | **Paywall を onboarding 直後に配置**。89.4% の trial starts が Day 0。Day 1+ は single digits。Onboarding → Paywall が全体の trial acquisition strategy。Source: https://adapty.io/blog/mobile-app-monetization-2026/ — 「Your onboarding-to-paywall flow is essentially your entire trial acquisition strategy」 |
| 75 | **Locale tests を pricing tests より優先**。Translation/currency が最高 LTV uplift 62.3%。Price changes は 45.5%（最低）。Top 5 markets（日本、米国、英国、ドイツ、フランス）に localize。Source: https://adapty.io/blog/mobile-app-monetization-2026/ — 「Locale tests (translation and currency) deliver the highest LTV uplift at 62.3%」 |
| 76 | **A/B testing roadmap: Structure → Locale → Copy → Price**。Plan count/duration/trial が conversion +57~60% uplift。Price changes は最低（+28.3%）。Apps running 50+ experiments = 18.7x revenue vs 1 experiment。Source: https://adapty.io/blog/mobile-app-monetization-2026/ |
| 77 | **Consistent messaging: Ad → Onboarding → Paywall**。同じ価値提案、同じトーン、同じビジュアルで conversion 向上。Source: https://blog.funnelfox.com/effective-paywall-screen-designs-mobile-apps/ — 「Consistent messaging from ad to onboarding to paywall increases conversions」 |
| 78 | **Xcode 26 + iOS 26 SDK必須（2026年4月28日以降）**。Apps uploaded to App Store Connect must be built with Xcode 26 or later using an SDK for iOS 26, iPadOS 26, tvOS 26, visionOS 26. ビルド前にXcodeバージョンをチェック（26以上必須）。Source: https://medium.com/@thakurneeshu280/apple-app-store-submission-changes-april-2026-5fa8bc265bbe — 「The **April 2026** SDK requirements represent a significant but manageable update for Apple developers.」 |
| 79 | **Privacy透明性が2026年の最優先項目**。Apps must clearly disclose what data they collect, how it is used, and obtain consent before sharing it with third parties, especially AI services. PRD生成時に「どのデータを収集するか」を明確に定義し、Privacy Manifestを自動生成。Source: https://theapplaunchpad.com/blog/app-store-review-guidelines — 「**Privacy and data transparency are major priorities in 2026**」 |
| 80 | **Deprecated API警告を自動検出**。ビルド後にwarningログをスキャンし、"deprecated" キーワードを検出したら報告。iOS 26で多数のAPIが非推奨化されたため、リリース前に警告を検出しないと将来のSDKで動かなくなる。Source: https://medium.com/@saianbusekar/ios-26-migration-guide-update-your-legacy-apps-like-a-pro-f49b3a3aae9e — 「Check for deprecated APIs or features; Identify third-party dependencies that may need updates.」 |
| 81 | **Weekly + 3-day trial がデフォルト構成**。Weekly plan with 3-day free trial が1年LTV最高（annual比636%増）。LTV $7.40 → $54.50。Business/Productivity/Lifestyleではdirect buyers検討（trial CVRより高LTV）。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「The best setup by one-year LTV: Weekly plan with a 3-day free trial. This brings in 1.5x the average LTV of all other configurations... Adding a trial to a weekly plan takes LTV from $7.40 to $54.50 — a 636% increase.」 |
| 82 | **Onboarding完了率90-95%を目標**。90%未満ならフロー削減。Completion率1%向上 = Paywall到達率1%増 = 直接売上増。Source: https://adapty.io/blog/mobile-app-onboarding-vs-tutorials/ — 「Your app onboarding completion rate should hit 90-95%. That means 90-95% of users who start onboarding make it all the way to your first paywall... Improve your onboarding completion rate from 85% to 92%, and you just put 7% more users in front of your highest-converting paywall.」 |
| 83 | **Day 0に全集中**。90%のtrial starts、44.5%のpurchaseがDay 0。Day 1以降convert率single digits。Onboardingとpaywall一体設計。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「90% of trial starts happen on Day 0. 44.5% of all purchases happen on Day 0. Most users who don't convert during onboarding never come back to the paywall.」 |
| 84 | **Toggle trial UI を実装**。Paywall上でtrial on/off toggle配置。Upfront payment増 → ARPU 17-64%向上。Trial abuse削減。Source: https://www.revenuecat.com/blog/growth/paywall-redesigns-case-studies/ — 「Paywall 2 introduced a toggle for the free trial, allowing users to choose... The result was a 31% increase in install-to-trial conversions and a 64% uplift in revenue.」「resulted in a 17.02% boost in ARPU.」 |
| 85 | **Paywall直前5画面で価値提示**。Onboardingとpaywall一体設計。直前5画面が決める（paywallデザインではない）。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「The practical implication: the onboarding and the paywall are one funnel. What happens in the five screens before the paywall determines whether it converts — not the paywall design itself.」 |
| 86 | **Social proof を各画面に分散**。"Join 2M users" on screen 2、Testimonial on screen 5、Success metric on screen 8。Paywall最終画面のみでなく全体に散らす。Source: https://adapty.io/blog/mobile-app-onboarding-vs-tutorials/ — 「"Join 2M users" on screen 2. A testimonial on screen 5. A specific success metric on screen 8. Each reinforces that other people have solved this problem using your app.」 |
| 87 | **80%の売上は最初のpaywall**。ユーザーはプロダクト体験前にsubscribe。「使わせて良さを知ってもらう」は間違い。Onboarding = 購入意図構築フロー。Source: https://adapty.io/blog/mobile-app-onboarding-vs-tutorials/ — 「roughly 80% of subscription revenue comes from the first paywall shown after onboarding. Users haven't tried your core product yet.」 |
| 88 | **Hard vs Soft両方をA/Bテスト必須**。Hard = 21%高LTV、Soft = 50%高CVR。一方に固定は誤り。両方テストが最高leverage。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「Hard paywalls produce 21% higher LTV. Soft paywalls convert ~50% better. Both are true simultaneously, which is why picking one and sticking with it is the wrong approach.」 |
| 89 | **価格テストはLTV改善（CVRではない）**。Price test CVR win rate 28.3%（最低）、LTV lift 45.5%。高価格 = 高LTVユーザー獲得。12ヶ月未テストなら実施。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「Price tests rarely improve conversion — only a 28.3% win rate on conversion in the experiment data. But they lift LTV 45.5% of the time. Raising prices doesn't bring in more users; it brings in users worth more.」 |
| 90 | **年14.7実験が必須**。Top performerは平均14.7実験/年、40x売上差（vs 低実験企業）。Structure → Locale → Copy → Price順。Source: https://adapty.io/blog/high-performing-paywall-2026/ — 「Apps that run experiments consistently earn up to 40x more revenue. The average number of experiments among top performers is 14.7.」 |
| 91 | **Onboarding完了直後に星評価リクエスト**。プロダクト未使用でもOK（excited-to-use状態で5星付けやすい）。App Store CVR向上 → Install増 → Paywall到達増。Source: https://adapty.io/blog/mobile-app-onboarding-vs-tutorials/ — 「ask for a rating during or immediately after onboarding, before they've used the product... Most users who made it through onboarding are bought-in enough to give 5 stars. More ratings boost your App Store conversion.」 |
| 92 | **意味のある摩擦はcommitment向上**。Habit apps「5秒指押しcommit」等のインタラクティブ要素。Emotional categories（fitness/health/relationships）で有効。Source: https://adapty.io/blog/mobile-app-onboarding-vs-tutorials/ — 「Small amounts of friction — when they're meaningful — increase commitment. Not every screen needs to be frictionless. Sometimes you want users to pause and think.」 |
| 93 | **3日trial = 26%解約、30日trial = 51%解約**。Trial期間長い = 解約率高い。3日推奨（週次planとベストマッチ）。Source: https://www.businessofapps.com/data/app-subscription-trial-benchmarks/ — 「A three day trial on average will have 26% cancellations, while a 30 day one will have 51%」 |
| 94 | **高価格ほどtrial CVR高い**。$9.99+ subscription が mid/low-price比でtrial conversion高い。価格恐れるな、高めから開始。Source: https://www.businessofapps.com/data/app-subscription-trial-benchmarks/ — 「The higher the app subscription price, the higher the conversion rate for sub trials.」 |

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

ralph.sh posts to Slack #metrics via curl after each iteration.
CC does NOT post to Slack. ralph.sh (bash) does.

```bash
# In ralph.sh, after each iteration:
curl -s -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{"channel":"$SLACK_CHANNEL_ID","text":"🏭 Iteration $i done: $(head -3 progress.txt)"}"
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
| `CLAUDE.md` | Template for CC instructions |
| `prd.json` | Template for backlog |
| `references/us-001-trend.md` | US-001 detailed instructions |
| `references/us-004-specs.md` | US-004 detailed instructions |
| `references/us-005a-infra.md` | US-005a: Privacy + ASC app creation |
| `references/us-005b-monetization.md` | US-005b: IAP + pricing + RevenueCat |
| `references/us-006-implement.md` | US-006 detailed instructions |
| `references/us-007-testing.md` | US-007 detailed instructions |
| `references/us-008-release.md` | US-008a~e detailed instructions (single file, steps referenced by sub-US) |
| `references/us-009-submit.md` | US-009 detailed instructions |
| `references/rshankras-WORKFLOW.md` | rshankras original workflow (reference) |
