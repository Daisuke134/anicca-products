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

## Step 1: Screenshots（ロケール別キャプチャ + ASC アップロード）

Source: asc-shots-pipeline SKILL.md（rudrankriyam）
Verified: 2026-03-04 Chi Daily 実機テスト済み — en-US 4枚 + ja 4枚 = 8枚 COMPLETE

### 使用デバイス（固定）
- **iPhone 17 Pro** (1290×2796) — APP_IPHONE_67 対応 ✅
- ❌ iPhone 16e (1170×2532) は使用禁止（ASC サイズ不適合）

### 1a: シミュレータ起動 + アプリインストール
```bash
xcrun simctl boot $UDID
xcrun simctl install $UDID <path-to-.app>
```

### 1b: en-US スクリーンショットキャプチャ
```bash
# en-US ロケール設定
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "en_US"
xcrun simctl shutdown $UDID && sleep 2 && xcrun simctl boot $UDID && sleep 3

# アプリ起動
xcrun simctl launch $UDID <bundle_id>
sleep 3

# en-US ディレクトリ作成 + キャプチャ
mkdir -p screenshots/raw/en-US
xcrun simctl io $UDID screenshot screenshots/raw/en-US/screen_1.png
# AXe swipe/tap で次画面に遷移 → キャプチャを繰り返す
axe swipe $UDID left
sleep 1
xcrun simctl io $UDID screenshot screenshots/raw/en-US/screen_2.png
# ... screen_3, screen_4 も同様
```

### 1c: ja スクリーンショットキャプチャ
```bash
# ja ロケール設定
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "ja"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "ja_JP"
xcrun simctl shutdown $UDID && sleep 2 && xcrun simctl boot $UDID && sleep 3

# アプリ起動
xcrun simctl launch $UDID <bundle_id>
sleep 3

# ja ディレクトリ作成 + キャプチャ
mkdir -p screenshots/raw/ja
xcrun simctl io $UDID screenshot screenshots/raw/ja/screen_1.png
axe swipe $UDID left
sleep 1
xcrun simctl io $UDID screenshot screenshots/raw/ja/screen_2.png
# ... screen_3, screen_4 も同様
```

### 1d: en-US に戻す（後続ステップのため）
```bash
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "en_US"
```

### 1e: MD5 検証（en-US ≠ ja 確認）
```bash
md5 screenshots/raw/en-US/*.png screenshots/raw/ja/*.png
# 全ファイルのハッシュが異なることを確認。同一ハッシュ = ロケール切替失敗 → やり直し
```

### 1f: ASC アップロード
```bash
# version-localization ID を取得
EN_LOC_ID=$(asc app-store-version-localizations list --version-id $VERSION_ID --output json | jq -r '.data[] | select(.attributes.locale=="en-US") | .id')
JA_LOC_ID=$(asc app-store-version-localizations list --version-id $VERSION_ID --output json | jq -r '.data[] | select(.attributes.locale=="ja") | .id')

# en-US アップロード
export ASC_BYPASS_KEYCHAIN=true
asc screenshots upload --version-localization $EN_LOC_ID --path screenshots/raw/en-US --device-type IPHONE_67

# ja アップロード
asc screenshots upload --version-localization $JA_LOC_ID --path screenshots/raw/ja --device-type IPHONE_67
```

**⚠️ 正しいフラグ（実証済み）:**
| フラグ | 値 | 説明 |
|--------|-----|------|
| `--version-localization` | LOC_ID | ロケール別の version-localization ID |
| `--path` | ディレクトリパス | ファイルではなくディレクトリを指定 |
| `--device-type` | `IPHONE_67` | iPhone 17 Pro 対応サイズ |

**❌ 存在しないフラグ（使うな）:** `--locale`, `--file`, `--app`, `--version-id`, `--display-type`

### 1g: アップロード検証
```bash
asc screenshots list --version-localization $EN_LOC_ID --output table
asc screenshots list --version-localization $JA_LOC_ID --output table
# 両方とも uploadOperationStatus = COMPLETE であること
```

### 1h: サブスクリプション Review Screenshot（IAP 審査用）

Source: Apple ASC API — Subscription Review Screenshots
依存: US-005b で $MONTHLY_ID, $ANNUAL_ID が .env に記録済み

**Paywall 画面をキャプチャして IAP 審査用にアップロード:**
```bash
# アプリで Paywall 画面を表示（オンボーディング最終画面 or 設定→Upgrade）
# AXe で Paywall まで遷移してからキャプチャ
xcrun simctl io $UDID screenshot /tmp/paywall-review.png

# Monthly + Annual 両方にアップロード
asc subscriptions review-screenshots create \
  --subscription-id $MONTHLY_ID \
  --file /tmp/paywall-review.png

asc subscriptions review-screenshots create \
  --subscription-id $ANNUAL_ID \
  --file /tmp/paywall-review.png
```

**⚠️ US-005b（モネタイズ）時点ではアプリ未ビルドなのでここで実行する。**

**PROHIBITED:**
- ⛔ screenshot-creator スキル禁止
- ⛔ Pencil MCP 禁止（壊れてる）
- ⛔ Python/Pillow/ImageMagick 禁止
- ⛔ axe-shim（偽物）禁止
- ⛔ Koubou（`asc screenshots frame`）禁止（バグあり、生スクショ直接アップロードで OK）
- ⛔ `--locale`, `--file`, `--display-type` フラグ禁止（存在しない）

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
Source: asc-testflight-orchestration skill (https://github.com/rudrankriyam/app-store-connect-cli-skills)

```bash
# Attach build to version
asc builds attach --app $APP_ID --version-id $VERSION_ID --build-id $BUILD_ID

# 9a: Beta group 作成（存在しなければ）
asc testflight beta-groups create --app $APP_ID --name "External Testers"
GROUP_ID=$(asc testflight beta-groups list --app $APP_ID --output json | jq -r '.data[0].id')

# 9b: ビルドをグループに配布
asc builds add-groups --build $BUILD_ID --group $GROUP_ID

# 9c: ベータレビュー提出（invite の前提条件）
asc testflight review submit --build $BUILD_ID --confirm
# externalBuildState が IN_BETA_TESTING になるまで待機（通常24-48時間）
# 確認: asc builds build-beta-detail get --build $BUILD_ID --output json

# 9d: テスター追加 + 招待（ベータレビュー通過後）
source ~/.config/mobileapp-builder/.env
TESTER_EMAIL="${TESTER_EMAIL:-$APPLE_ID}"
asc testflight beta-testers add --app $APP_ID --email "$TESTER_EMAIL" --group "External Testers"
asc testflight beta-testers invite --app $APP_ID --email "$TESTER_EMAIL"

# 9e: テストノート追加
asc builds test-notes create --build $BUILD_ID --locale "en-US" --whats-new "Initial beta test"

# 9f: Public link 取得
TESTFLIGHT_URL=$(asc testflight beta-groups list --app $APP_ID --output json | jq -r '.data[] | select(.attributes.publicLinkEnabled==true) | .attributes.publicLink // empty' | head -1)
if [ -z "$TESTFLIGHT_URL" ]; then
  TESTFLIGHT_URL="https://testflight.apple.com/join/PENDING"
fi
```

### CRITICAL: invite は WAITING_FOR_BETA_REVIEW 通過後でないと「no installable build」で失敗する
- ベータレビュー提出前に invite → 100% 失敗
- ベータレビュー中に invite → 100% 失敗
- ベータレビュー通過後（IN_BETA_TESTING）に invite → 成功


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
- Screenshots uploaded to ASC for en-US and ja (AXe + xcrun simctl io)
- Subscription review screenshots uploaded for Monthly + Annual
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
