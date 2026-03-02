# US-008: Release Preparation

Source: rshankras WORKFLOW.md Phase 6 + rudrankriyam asc-* skills

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/axe-ios-simulator/SKILL.md` — AXe UI navigation
2. `.claude/skills/asc-shots-pipeline/SKILL.md` — rudrankriyam: screenshot pipeline
3. `.claude/skills/release-review/SKILL.md` — rshankras: 5 checklists
4. `.claude/skills/asc-metadata-sync/SKILL.md` — rudrankriyam: metadata
5. `.claude/skills/asc-xcode-build/SKILL.md` — rudrankriyam: archive + export
6. `.claude/skills/asc-release-flow/SKILL.md` — rudrankriyam: upload + TestFlight
7. `.claude/skills/asc-submission-health/SKILL.md` — rudrankriyam: preflight 7 checks

## Quality Gate (MANDATORY — US-007 検証)
```bash
xcodebuild test -scheme <AppName> -destination "platform=iOS Simulator,id=$UDID" || { echo "GATE FAIL: tests broken"; exit 1; }
test -f Products.storekit || { echo "GATE FAIL: no StoreKit config"; exit 1; }
```


## Step 0: Greenlight ASC Scan (MANDATORY)

Source: Greenlight README
> "greenlight scan --app-id $APP_ID  # App Store Connect API checks"

**ASC メタデータが完全か確認:**

```bash
# Greenlight ASC scan を実行
GL_SCAN=$(greenlight scan --app-id $APP_ID --tier 1 --format json 2>&1)
GL_PASSED=$(echo "$GL_SCAN" | jq '.summary.passed // false')

if [ "$GL_PASSED" != "true" ]; then
  echo "❌ Greenlight ASC scan failed"
  echo "$GL_SCAN" | jq '.findings[] | select(.severity >= 2)'
  # 問題を修正して再実行
fi

echo "✅ Greenlight ASC scan passed"
```

### PROHIBITED
- ⛔ ASC scan が失敗したまま passes:true にするな

## Step 1: Screenshots (AXe + Koubou)

### 1a: AXe でシミュレータ操作 + スクリーンキャプチャ
```bash
# Boot simulator
xcrun simctl boot $UDID
# Install app
xcrun simctl install $UDID <path-to-.app>
# Launch
xcrun simctl launch $UDID <bundle_id>
sleep 3

# Screenshot each screen
for i in 1 2 3 4 5; do
  # Navigate using AXe (tab bar taps or swipes)
  axe tap $UDID <x> <y>
  sleep 1
  xcrun simctl io $UDID screenshot screenshots/raw/screen_$i.png
done
```

## 使用デバイス（固定）
- **iPhone 17 Pro** (1290×2796) — APP_IPHONE_67 対応 ✅
- ❌ iPhone 16e (1170×2532) は使用禁止（ASC サイズ不適合）

AXe tab bar coordinates (iPhone 17 Pro, 393×852pt): y=820, x=49/148/246/344
Source: Real AXe v1.4.0 (`brew install cameroncooke/axe/axe`)

### 1b: Koubou でフレーム（必須！スキップ禁止）

**⚠️ 生スクショの直接アップロードは禁止。必ず Koubou でフレーミングする。**
スキップしたら validate.sh GATE 4 で FAIL する。
```bash
asc screenshots frame \
  --input screenshots/raw/ \
  --output screenshots/framed/ \
  --device "iphone-17-pro"
```
Source: Koubou v0.14.0 (`asc screenshots frame`)

### 1c: sips リサイズ (必要な場合のみ)
```bash
# ASC requires exact dimensions
sips -z 2556 1179 screenshots/framed/*.png
```

### 1d: ASC アップロード
```bash
for file in screenshots/framed/*.png; do
  asc screenshots upload --app $APP_ID --version-id $VERSION_ID \
    --locale en-US --display-type APP_IPHONE_67 --file "$file"
done
# Repeat for ja locale
```

**PROHIBITED:**
- ⛔ screenshot-creator スキル禁止
- ⛔ Pencil MCP 禁止（壊れてる）
- ⛔ Python/Pillow/ImageMagick 禁止
- ⛔ axe-shim（偽物）禁止

## Step 2: Metadata Sync
```bash
# en-US + ja 両方
asc metadata sync --app $APP_ID --version-id $VERSION_ID \
  --name "<app_name>" --subtitle "<subtitle>" \
  --description "<description>" --keywords "<keywords>" \
  --locale en-US
# Repeat for ja
```
CRITICAL: Privacy Policy URL は en-US AND ja 両方必須（Rule 7）

## Step 3: Build + Upload
```bash
# Archive
xcodebuild archive -scheme <AppName> -archivePath build/<AppName>.xcarchive
# Export
xcodebuild -exportArchive -archivePath build/<AppName>.xcarchive \
  -exportPath build/ -exportOptionsPlist ExportOptions.plist
# Upload
xcrun altool --upload-app -f build/<AppName>.ipa -t ios \
  --apiKey $ASC_KEY_ID --apiIssuer $ASC_ISSUER_ID
```

## Step 4: Review Details (PATCH 4)
```bash
asc review details-create --app $APP_ID --version-id $VERSION_ID \
  --demo-account-required false
```
Source: Apple ASC API (https://developer.apple.com/documentation/appstoreconnectapi/create_an_app_store_review_detail)
> 「Add App Store review details including contact and demo account information」
CRITICAL: デフォルトが true → 明示的に false を指定しないとデモアカウント未入力で提出ブロック

## Step 5: Age Rating + Encryption + Content Rights
```bash
# Age Rating: all 22 items
asc age-rating set --app $APP_ID --version-id $VERSION_ID ...
# Encryption
asc encryption set --app $APP_ID --version-id $VERSION_ID --uses-non-exempt-encryption false
# Content Rights
asc content-rights set --app $APP_ID --version-id $VERSION_ID --uses-third-party-content false
```

## Step 6: Availability + Pricing
CRITICAL: availability BEFORE pricing（Rule 6）
```bash
# Availability first
asc availability set --app $APP_ID --territories ALL
# Then pricing (use price-point ID, NOT --tier 0)
asc pricing set ...
```

## Step 7: release-review 5 Checklists
Read `.claude/skills/release-review/SKILL.md` and execute all 5 checklists.

## Step 8: Validate (STOP GATE — PATCH 6)
```bash
asc validate --app "$APP_ID" --version-id "$VERSION_ID" --platform IOS --output table
# Errors = 0 でないと US-009 に進むな
```
Source: rudrankriyam asc-submission-health SKILL.md
> Pre-submission Checklist 7 items

## Step 9: TestFlight Upload + Distribution
```bash
# Attach build to version
asc builds attach --app $APP_ID --version-id $VERSION_ID --build-id $BUILD_ID

# Beta group 作成（存在しなければ）
GROUP_ID=$(asc testflight beta-groups create --app $APP_ID --name "External Testers" --public-link-enabled true 2>&1 | jq -r '.data.id' || echo "")
if [ -z "$GROUP_ID" ]; then
  GROUP_ID=$(asc testflight beta-groups list --app $APP_ID 2>&1 | jq -r '.data[0].id')
fi

# TestFlight distribution
asc testflight beta-builds add --group-id $GROUP_ID --build-id $BUILD_ID

# Public link 取得
TESTFLIGHT_URL=$(asc testflight beta-groups get --id $GROUP_ID 2>&1 | jq -r '.data.attributes.publicLink // empty')
if [ -z "$TESTFLIGHT_URL" ]; then
  TESTFLIGHT_URL="https://testflight.apple.com/join/PENDING"
fi
```

### Step 9.5: TestFlight テスター招待
Source: asc CLI docs
> 「asc testflight beta-testers add --email EMAIL --group-id GROUP_ID」

```bash
# 環境変数から Dais のメールを取得
source ~/.config/mobileapp-builder/.env
TESTER_EMAIL="${TESTER_EMAIL:-keiodaisuke@gmail.com}"

# テスター招待
asc testflight beta-testers add --email "$TESTER_EMAIL" --group-id $GROUP_ID --first-name "Dais" --last-name "Narita"
```


## Step 10: Slack TestFlight 報告

TestFlight ビルドの distribute 完了後、Slack に TestFlight リンクを報告する:

```bash
source ~/.config/mobileapp-builder/.env

# TestFlight リンク取得
TESTFLIGHT_URL=$(asc testflight builds get-link --app $APP_ID --build $BUILD_ID 2>/dev/null || echo "https://testflight.apple.com/join/<GROUP_PUBLIC_LINK>")

# Slack 報告
curl -s -X POST "$SLACK_WEBHOOK_AGENTS" -H 'Content-Type: application/json' \
  -d '{"text":"🧪 TestFlight 準備完了\nApp: <app_name>\nリンク: '"$TESTFLIGHT_URL"'\n↑タップしてテスト可能"}'
```

progress.txt にも記録:
```
TESTFLIGHT_LINK=$TESTFLIGHT_URL
```

## Acceptance Criteria
- Screenshots uploaded to ASC for en-US and ja (AXe + Koubou)
- Metadata synced (en-US + ja)
- .ipa uploaded (processingState = VALID)
- Build attached to version
- Age Rating set, Review Details set (demoAccountRequired=false)
- Availability + Pricing set (175 territories)
- Encryption + Content Rights set
- asc validate returns Errors=0
- release-review 5 checklists all pass
- TestFlight build distributed
- Slack #metrics notified
