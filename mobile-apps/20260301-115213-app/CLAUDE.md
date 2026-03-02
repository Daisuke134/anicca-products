# mobileapp-builder — CLAUDE.md
# Source: snarktank/ralph CLAUDE.md (https://github.com/snarktank/ralph/blob/main/CLAUDE.md)
# Source: Anthropic harness (https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

## Your Job

You are an autonomous iOS app builder. Each iteration, you:
1. Read progress.txt and git log to understand current state
2. Read prd.json to find the next story with passes: false
3. Complete that ONE story
4. Update prd.json (passes: true), write to progress.txt, git commit
5. Report via (BOTH required, curl FIRST):
   source ~/.config/mobileapp-builder/.env
   curl -s -X POST "$SLACK_WEBHOOK_AGENTS" -H 'Content-Type: application/json' -d '{"text":"🏭 US-XXX 完了: [summary]"}'
   openclaw system event --text "🏭 US-XXX 完了: [summary]" 2>/dev/null || true
   ⛔ curl は必須（source .env で SLACK_WEBHOOK_AGENTS を読む）。openclaw は optional。
   ⛔ US 開始時にも同様に報告: "🏭 US-XXX 開始: [title]"

If ALL stories have passes: true, reply with: <promise>COMPLETE</promise>

## Secrets (env vars — never hardcode)
# Source: Twelve-Factor App (https://12factor.net/config)

Before any signing/build:
```
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db
```

## Quality Gate (MANDATORY — run at start of every US)
# Source: SonarQube (https://docs.sonarsource.com/sonarqube-cloud/standards/managing-quality-gates/introduction-to-quality-gates)
# Quote: "It can be used to fail your CI pipeline if the quality gate fails"

Before starting any US, verify the previous US acceptance criteria:
- Read prd.json
- For each US with priority < current: verify passes: true
- If any prerequisite US is false: work on THAT US instead

## US → Skill Mapping

### US-001: Trend research
- Read: .claude/skills/idea-generator/SKILL.md (rshankras)
- Output: spec/01-trend.md

### US-002: Product planning
- Read: .claude/skills/product-agent/SKILL.md (rshankras)
- Input: spec/01-trend.md
- Output: product-plan.md
- MANDATORY — App 名の重複チェック（名前を決めた直後に実行）:
  ```bash
  curl -s "https://itunes.apple.com/search?term=\${APP_NAME}&entity=software&limit=10" | python3 -c "
  import json,sys; d=json.load(sys.stdin)
  matches=[r for r in d['results'] if r['trackName'].lower()=='\${APP_NAME}'.lower()]
  print(f'Exact matches: {len(matches)}')
  for r in matches: print(f'  {r["trackName"]} — {r["sellerName"]}')
  "
  ```
  同名アプリが 1 件でも存在 → 名前を変更してから product-plan.md に記載。
  Source: Apple App Review Guidelines §2.3.7 (developer.apple.com/app-store/review/guidelines/)
  Quote: "Choose a unique app name"
  Source: iTunes Search API (developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)

### US-003: Market research
- Read: .claude/skills/competitive-analysis/SKILL.md (rshankras)
- Read: .claude/skills/market-research/SKILL.md (rshankras)
- Input: spec/01-trend.md + product-plan.md
- Output: competitive-analysis.md + market-research.md

### US-004: Spec generation
- Read: .claude/skills/implementation-spec/SKILL.md (rshankras orchestrator)
- Input: all above
- Output: docs/ (7 files: PRD.md, ARCHITECTURE.md, UX_SPEC.md, DESIGN_SYSTEM.md, IMPLEMENTATION_GUIDE.md, TEST_SPEC.md, RELEASE_SPEC.md)
- CRITICAL: PRD.md MUST contain subscription prices. IMPLEMENTATION_GUIDE.md MUST reference RevenueCat SDK.

### US-005: ASC + IAP + RevenueCat (INFRASTRUCTURE FIRST)
# Source: ralph SKILL.md "Correct order: 1. Schema/database changes"
- Read: .claude/skills/asc-signing-setup/SKILL.md
- Read: .claude/skills/asc-subscription-localization/SKILL.md
- Read: .claude/skills/asc-ppp-pricing/SKILL.md
- Read: .claude/skills/mobileapp-builder/SKILL.md (CRITICAL RULES)
- Steps:
  1. Privacy Policy → GitHub Pages
  2. asc-signing-setup: certs + profiles
  3. ASC app creation — MANUAL (2FA required, cannot automate):
     Send to Slack via openclaw system event:
     ```
     🏭 US-005: ASC アプリ作成が必要です
     
     https://appstoreconnect.apple.com/apps → 左上「＋」→「新規App」
     
     以下をそのまま入力してください:
     
     プラットフォーム: ☑️ iOS
     名前: ${APP_NAME}
     プライマリ言語: English (U.S.)
     バンドルID: ${BUNDLE_ID} — Xcode Managed
     SKU: ${SKU}
     ユーザアクセス: アクセス制限なし
     
     「作成」を押したら、URLの数字（App ID）を Slack に送ってください。
     例: https://appstoreconnect.apple.com/apps/6761234567 → 6761234567
     ```
     Replace ${APP_NAME}, ${BUNDLE_ID}, ${SKU} with actual values from docs/PRD.md.
     After sending, check progress.txt for APP_ID= line. If not present, set passes:false and exit (next iteration will retry).
  4. Subscription group + monthly + annual IAP
  5. 175-country subscription pricing (price-point IDs, NOT --tier)
  6. RevenueCat: products + offering + packages (RC MCP or API)
  7. SPM: add RevenueCat + RevenueCatUI
  8. Add PrivacyInfo.xcprivacy (Apple WWDC23: developer.apple.com/videos/play/wwdc2023/10060/)
  9. Add ITSAppUsesNonExemptEncryption=NO to Info.plist (Apple: developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption)
  10. サブスクリプション全ロケール表示名設定（asc-subscription-localization SKILL.md に従う）
  11. サブスクリプション配信可否: availableInNewTerritories=true で175カ国配信
  12. サブスクリプション価格設定（asc-ppp-pricing SKILL.md に従う）:
      - Monthly: asc subscriptions price-points list --subscription-id <ID> --territory USA --paginate → $4.99 の price point ID → asc subscriptions prices add
      - Annual: asc subscriptions price-points list --subscription-id <ID> --territory USA --paginate → $29.99 の price point ID → asc subscriptions prices add
  13. サブスクリプショングループのローカライゼーション設定
  14. 検証（全部 PASS しないと passes:true にするな）:
      - asc subscriptions list → state ≠ MISSING_METADATA（Monthly + Annual 両方）
      - asc subscriptions prices list → count > 0（Monthly + Annual 両方）
      - ⛔ MISSING_METADATA で passes:true = validate.sh が自動リセットする
- Verify: asc validate subscriptions blocking=0 warnings=0

### US-006: iOS implementation
# Source: ralph SKILL.md "3. UI components that use the backend"
- Quality Gate: asc subscriptions groups list returns 1+ AND grep RevenueCat Package.swift > 0
- Read: .claude/skills/mobileapp-builder/SKILL.md (CRITICAL RULES)
- Read: docs/IMPLEMENTATION_GUIDE.md
- Use REAL RevenueCat SDK. NO Mock. NO stub. PaywallView from RevenueCatUI.
- Verify: grep Mock = 0, grep 'import RevenueCat' > 0

### US-007: Testing
- Read: .claude/skills/mobileapp-builder/SKILL.md (testing section)
- Read: docs/TEST_SPEC.md
- Verify: xcodebuild test succeeds

### US-008: App Store screenshots + metadata
- FIRST: Delete ALL existing screenshots (rm -rf screenshots/ docs/screenshots/)
- Read: .claude/skills/screenshot-planner/SKILL.md（どの画面をどの順番で見せるか計画）
- Read: .claude/skills/asc-shots-pipeline/SKILL.md（撮影→フレーム→アップロード全手順に従え）
- Read: .claude/skills/screenshot-optimization/SKILL.md（10スロット戦略参照）
- Read: .claude/skills/app-description-writer/SKILL.md（説明文）
- Read: .claude/skills/keyword-optimizer/SKILL.md（キーワード）
- Read: .claude/skills/asc-metadata-sync/SKILL.md（メタデータ同期）
- Read: .claude/skills/asc-xcode-build/SKILL.md（ビルド）
- Read: .claude/skills/asc-release-flow/SKILL.md（リリース）
- Read: .claude/skills/asc-submission-health/SKILL.md（提出前チェック）
- Steps:
  1. screenshot-planner で3枚のスクショ計画を立てる（どの画面 + ヘッドライン）
  2. スクショ撮影（3枚必須・5分以内）:
     - .asc/screenshots.json にキャプチャ計画を書く（asc-shots-pipeline Step 3）
     - AXe で画面遷移してスクショを撮る:
       axe describe-ui --udid "$UDID"
       axe tap --id "<element>" --udid "$UDID"
       axe screenshot --output screenshots/raw/screen_1.png --udid "$UDID"
     - 3枚の異なる画面を撮影する（Home、主要機能、Paywall等）
     - ⛔ 3枚未満で passes:true にするな
  3. デバイスフレーム合成（3枚全部）:
     - pip3 install koubou==0.13.0（未インストールなら）
     - asc screenshots frame --input screenshots/raw/screen_1.png --output-dir screenshots/framed --device iphone-air
     - asc screenshots frame --input screenshots/raw/screen_2.png --output-dir screenshots/framed --device iphone-air
     - asc screenshots frame --input screenshots/raw/screen_3.png --output-dir screenshots/framed --device iphone-air
  4. ASC にアップロード（en-US + ja）:
     - asc screenshots upload --version-localization <LOC_ID> --path screenshots/framed/ --device-type APP_IPHONE_67
  5. メタデータ同期（en-US + ja）
  6. Archive + .ipa export（security unlock-keychain -p "$KEYCHAIN_PASSWORD" first）
  7. Upload build, attach to version
  8. Age Rating, Review Details, Availability, Content Rights
  9. サブスク Review スクリーンショット添付（Apple §2.1 Guideline 拒否防止）:
     - Paywall画面のスクショを screenshots/raw/ から選ぶ（またはPaywallに遷移して撮影）
     - asc subscriptions review-screenshots create --subscription-id <MONTHLY_ID> --file screenshots/raw/paywall.png
     - asc subscriptions review-screenshots create --subscription-id <ANNUAL_ID> --file screenshots/raw/paywall.png
  10. asc validate → Errors=0（STOP GATE）
  11. Preflight checks（asc-submission-health）
  12. greenlight preflight → CRITICAL=0（STOP GATE）
- ⛔ Python/Pillow/ImageMagick/sips でスクショ加工禁止
- ⛔ asc screenshots frame 失敗 → passes:false
- ⛔ 3枚未満のスクショで passes:true にするな
- ⛔ サブスク Review スクショ未添付で passes:true にするな
- ⛔ greenlight CRITICAL > 0 で passes:true にするな
- Read: .claude/skills/asc-shots-pipeline/SKILL.md
- Read: .claude/skills/asc-metadata-sync/SKILL.md
- Read: .claude/skills/asc-xcode-build/SKILL.md
- Read: .claude/skills/asc-release-flow/SKILL.md
- Read: .claude/skills/asc-testflight-orchestration/SKILL.md
- Read: .claude/skills/asc-submission-health/SKILL.md
- Steps:
  1. Screenshots via asc screenshots frame (device-framed mockups)
  2. Upload screenshots to ASC (en-US + ja)
  3. Metadata sync (en-US + ja)
  4. Archive + .ipa export (unlock keychain first: security unlock-keychain -p "$KEYCHAIN_PASSWORD")
  5. Upload build, attach to version
  6. Age Rating (all 22 items)
  7. Review Details (--demo-account-required false)
  8. Availability (175 territories)
  9. Content Rights (DOES_NOT_USE_THIRD_PARTY_CONTENT)
  10. TestFlight distribution
  11. asc validate → Errors=0 (STOP GATE)
  12. Preflight 7 checks (asc-submission-health)
- Report: openclaw system event --text "⏸️ App Privacy を ASC Web で設定してください: https://appstoreconnect.apple.com/apps/$APP_ID/distribution/privacy"
curl -s -X POST -H 'Content-type: application/json' --data '{"text":"⏸️ App Privacy を ASC Web で設定してください: https://appstoreconnect.apple.com/apps/$APP_ID/distribution/privacy"}' "$SLACK_WEBHOOK_AGENTS"

### US-009: Pre-submission validation + Submit
- Read: .claude/skills/greenlight/SKILL.md
- Read: .claude/skills/asc-submission-health/SKILL.md
- Read: .claude/skills/mobileapp-builder/references/submission-checklist.md（全項目確認）
- Pre-submission checks（全 PASS 必須。1つでも FAIL → passes:false）:
  1. greenlight preflight . → CRITICAL=0
  2. greenlight scan --app-id $APP_ID --tier 1 → blocks=0
  3. asc subscriptions list → state ≠ MISSING_METADATA
  4. asc subscriptions prices list → count > 0（Monthly + Annual）
  5. screenshots/framed/ に >= 3 枚の PNG
  6. asc builds list → processingState=VALID
  7. submission-checklist.md の D1-D9（IAP checks）全 PASS
  8. submission-checklist.md の E1-E12（メタデータ checks）全 PASS
  9. .app-privacy-done file exists
  ⛔ 1つでも FAIL → passes:false。FAIL した項目を修正してから再挑戦
  ⛔ 修正が自分でできない場合（App Privacy等）→ Slack で報告して passes:false
- If ALL checks PASS:
  - asc submit create → WAITING_FOR_REVIEW
  - source ~/.config/mobileapp-builder/.env && curl -s -X POST "$SLACK_WEBHOOK_AGENTS" -H 'Content-Type: application/json' -d '{"text":"🎉 提出完了！WAITING_FOR_REVIEW"}'
  - Reply: <promise>COMPLETE</promise>

## CRITICAL RULES
- Read .claude/skills/mobileapp-builder/SKILL.md for all 46 CRITICAL RULES
- Every source file change → git commit with descriptive message
- Every US completion → update progress.txt + prd.json + git commit + system event
