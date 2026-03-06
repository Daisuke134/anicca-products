# US-008: Release Preparation

Source: rshankras WORKFLOW.md Phase 6 + rudrankriyam asc-* skills

## Source Skills (参考のみ — 読み込み不要。コマンドは下記各 Step にインライン)
元ネタ:
- US-008a (Screenshots): axe-ios-simulator, asc-shots-pipeline
- US-008b (Metadata): asc-metadata-sync
- US-008c (Build+Upload): asc-xcode-build
- US-008d (Compliance): asc-release-flow
- US-008e (Preflight+TF): release-review, asc-submission-health

## Quality Gate (MANDATORY — US-007 検証)
```bash
xcodebuild test -scheme <AppName> -destination "platform=iOS Simulator,id=$UDID" || { echo "GATE FAIL: tests broken"; exit 1; }
# StoreKit Configuration は不要（uiPreviewMode で代替。us-005b 参照）
test $(ls maestro/*.yaml 2>/dev/null | wc -l) -ge 6 || { echo "GATE FAIL: need 6+ Maestro flows"; exit 1; }
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

## Step 0b: Localization File Check (MANDATORY — before screenshots)

Source: Apple Developer Documentation
https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog
> 「Use a string catalog to translate text, handle plurals, and vary the text your app displays on specific devices.」

Source: fline.dev — The Missing String Catalogs FAQ
https://www.fline.dev/the-missing-string-catalogs-faq-for-xcode-15/
> 「Xcode automatically extracts any added localizations from your source code, the source of truth for your localizations is reversed here and lies in your code.」

**ja スクショが英語になる原因は `.xcstrings` が存在しないこと。**
`String(localized:)` を使っていても翻訳ファイルがなければフォールバック（= 英語）のまま。

```bash
# .xcstrings の存在チェック
XCODE_DIR=$(find . -name "*.xcodeproj" -maxdepth 2 | head -1 | xargs dirname)
XCSTRINGS=$(find "$XCODE_DIR" -name "*.xcstrings" -not -path "*/build/*" -not -path "*/.build/*" -not -path "*/SourcePackages/*" | head -1)

if [ -z "$XCSTRINGS" ]; then
  echo "⚠️ .xcstrings not found — ja screenshots will show English"
  echo "Creating Localizable.xcstrings with Japanese translations..."

  # 1. 全 String(localized:) キーを収集
  KEYS=$(grep -rh 'String(localized: "' "$XCODE_DIR" --include="*.swift" 2>/dev/null \
    | sed 's/.*String(localized: "\([^"]*\)".*/\1/' | sort -u)

  # 2. Localizable.xcstrings を生成（sourceLanguage: en, ja 翻訳付き）
  # CCが各キーの日本語翻訳を作成し、JSON形式で書き出す
  # 3. Xcode プロジェクトに追加（XcodeGen なら project.yml に追加 → xcodegen generate）
  # 4. 再ビルド + 再インストール
  echo "✅ Localizable.xcstrings created — rebuild required"
fi
```

### PROHIBITED
- ⛔ `.xcstrings` なしで ja スクショを撮って passes:true にするな
- ⛔ `.lproj/Localizable.strings` は使わない（Xcode 15+ は `.xcstrings` が標準）

## Step 1: Screenshots（ロケール別キャプチャ + ASC アップロード）

Source: asc-shots-pipeline SKILL.md Section 3-6
Verified: 2026-03-06 DeskStretch 実機テスト済み — en-US 4枚 + ja 4枚 = 8枚 COMPLETE

### スクショ保存先（明示）
```bash
# $APP_DIR = ralph.sh の作業ディレクトリ（例: mobile-apps/desk-stretch）
# スクショは $APP_DIR/screenshots/raw/{en-US,ja}/ に保存する（worktree内ではない）
SCREENSHOTS_DIR="$APP_DIR/screenshots/raw"
mkdir -p "$SCREENSHOTS_DIR/en-US" "$SCREENSHOTS_DIR/ja"
```

### 使用デバイス（固定）

Source: Apple ASC Help — Screenshot specifications
https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
> 6.5" Display: "Required if app runs on iPhone and screenshots for 6.9" display aren't provided"
> 13"/12.9" Display: "Required if app runs on iPad"

| デバイス | 解像度 | ASC device-type | 必須条件 |
|---------|--------|----------------|---------|
| iPhone 17 Pro | 1206x2622 | IPHONE_61 | 常に必須（ベース） |
| iPhone 14 Plus | 1284x2778 | IPHONE_65 | 6.9" 未提供時に必須（= 常に必須） |
| iPad Pro 13" (M4) | 2064x2752 | IPAD_PRO_3GEN_129 | UIDeviceFamily に 2 (iPad) 含む場合必須 |

- ❌ IPHONE_67 は間違い（シミュレータの実解像度は 1206×2622 = IPHONE_61）
- ❌ iPhone 16e (1170×2532) は使用禁止（ASC サイズ不適合）

### UIDeviceFamily チェック（iPad スクショ要否判定）
```bash
# Info.plist から UIDeviceFamily を取得
DEVICE_FAMILY=$(plutil -extract UIDeviceFamily json -o - "$XCODE_DIR"/*/Info.plist 2>/dev/null \
  || grep -A 5 UIDeviceFamily "$XCODE_DIR"/*/Info.plist | grep -o '[0-9]' | tr '\n' ',')
NEEDS_IPAD=false
echo "$DEVICE_FAMILY" | grep -q "2" && NEEDS_IPAD=true
echo "UIDeviceFamily: $DEVICE_FAMILY, NEEDS_IPAD: $NEEDS_IPAD"
```

### 1a: シミュレータ準備 + アプリインストール

```bash
export ASC_BYPASS_KEYCHAIN=true

# 6.1" シミュレータ起動
UDID_61=$(xcrun simctl list devices available | grep "iPhone 17 Pro" | head -1 | grep -oE '[A-F0-9-]{36}')
xcrun simctl boot $UDID_61 2>/dev/null || true

# 6.5" シミュレータ準備（1284x2778 = IPHONE_65）
# iPhone 14 Plus / iPhone 13 Pro Max / iPhone 12 Pro Max が対応
UDID_65=$(xcrun simctl list devices available | grep -E "iPhone 14 Plus|iPhone 13 Pro Max|iPhone 12 Pro Max" | head -1 | grep -oE '[A-F0-9-]{36}')
if [ -z "$UDID_65" ]; then
  # 存在しなければ作成
  RUNTIME=$(xcrun simctl list runtimes | grep "iOS" | tail -1 | grep -oE 'com.apple[^ ]+')
  DEVICE_TYPE=$(xcrun simctl list devicetypes | grep -E "iPhone 14 Plus|iPhone 13 Pro Max|iPhone 12 Pro Max" | head -1 | sed 's/.*(\(.*\))/\1/')
  UDID_65=$(xcrun simctl create "iPhone14Plus-Screenshots" "$DEVICE_TYPE" "$RUNTIME")
fi
xcrun simctl boot $UDID_65 2>/dev/null || true

# iPad シミュレータ準備（2064x2752 = IPAD_PRO_3GEN_129）
if [ "$NEEDS_IPAD" = "true" ]; then
  UDID_IPAD=$(xcrun simctl list devices available | grep -E "iPad Pro.*13" | head -1 | grep -oE '[A-F0-9-]{36}')
  if [ -z "$UDID_IPAD" ]; then
    DEVICE_TYPE_IPAD=$(xcrun simctl list devicetypes | grep -E "iPad Pro.*13" | head -1 | sed 's/.*(\(.*\))/\1/')
    UDID_IPAD=$(xcrun simctl create "iPadPro13-Screenshots" "$DEVICE_TYPE_IPAD" "$RUNTIME")
  fi
  xcrun simctl boot $UDID_IPAD 2>/dev/null || true
fi

# アプリビルド + インストール（全シミュレータ）
XCODE_DIR=$(find . -name "*.xcodeproj" -maxdepth 2 | head -1 | xargs dirname)
xcodebuild build -project "$XCODE_DIR"/*.xcodeproj -scheme * \
  -destination "platform=iOS Simulator,id=$UDID_61" -derivedDataPath build/
APP_PATH=$(find build/ -name "*.app" -path "*/Debug-iphonesimulator/*" | head -1)
xcrun simctl install $UDID_61 "$APP_PATH"
xcrun simctl install $UDID_65 "$APP_PATH"
[ "$NEEDS_IPAD" = "true" ] && xcrun simctl install $UDID_IPAD "$APP_PATH"
```

### 1b: en-US キャプチャ（4画面）

⚠️ CRITICAL: 画面遷移は `axe tap --label` を使う（`axe swipe` は PageTabViewStyle のみ有効）
Source: AXe GitHub (https://github.com/cameroncooke/AXe)
> 「axe tap --label "Button Label" — Tap by accessibility label (preferred)」
> 「Prefer --label for tapping when possible (more resilient to layout changes)」

```bash
mkdir -p screenshots/raw/en-US screenshots/raw/ja

# en-US ロケール設定 + 完全リセット
# Source: Stack Overflow — "NSUserDefaults not cleared after app uninstall on simulator"
# https://stackoverflow.com/questions/24985825/nsuserdefaults-not-cleared-after-app-uninstall-on-simulator
# ⚠️ `defaults write hasCompletedOnboarding -bool false` は効かないケースがある
# ⚠️ `simctl uninstall` しても UserDefaults が残る場合がある
# → `defaults delete $BUNDLE_ID` で全キー削除が最も確実
xcrun simctl terminate $UDID $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "en_US"
xcrun simctl uninstall $UDID $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID "$APP_PATH"
xcrun simctl launch $UDID $BUNDLE_ID
sleep 3

# screen1: オンボーディング画面1
# まず describe-ui で画面構造を確認
axe describe-ui --udid "$UDID"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID" --output-dir "./screenshots/raw/en-US" --output json

# screen2: 次のオンボーディング画面に遷移
# ⚠️ axe swipe ではなく axe tap --label でボタンを押して遷移する
# describe-ui の出力から「Next」「Continue」「Get Started」等のボタンラベルを見つけてタップ
# ボタンが見つからない場合は axe tap --id でaccessibilityIdentifierを使う
axe tap --udid "$UDID" --label "Next" || axe tap --udid "$UDID" --label "Continue" || axe tap --udid "$UDID" --label "Get Started"
sleep 2
axe describe-ui --udid "$UDID"  # 画面が変わったか確認
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID" --output-dir "./screenshots/raw/en-US" --output json

# screen3: Paywall画面に遷移
axe tap --udid "$UDID" --label "Next" || axe tap --udid "$UDID" --label "Continue"
sleep 2
axe describe-ui --udid "$UDID"  # PaywallViewが表示されているか確認
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID" --output-dir "./screenshots/raw/en-US" --output json

# screen4: Home（オンボーディングスキップ → 再起動）
xcrun simctl spawn "$UDID" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
xcrun simctl terminate "$UDID" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID" --output-dir "./screenshots/raw/en-US" --output json
```

**⚠️ 画面遷移ルール:**
- `axe swipe` は使用禁止（NavigationStack / switch ベースのオンボーディングでは効かない）
- `axe tap --label` でボタンを押して遷移する
- 遷移後は必ず `axe describe-ui` で画面が変わったか確認する
- ボタンラベルがわからない場合は `axe describe-ui` の出力から探す

### 1b2: en-US 6.5" キャプチャ（UDID_65 で同じ4画面を撮影）

```bash
# 6.5" シミュレータでも同じ手順で撮影
mkdir -p screenshots/raw-65/en-US screenshots/raw-65/ja

xcrun simctl terminate $UDID_65 $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID_65 defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID_65 defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID_65 defaults write NSGlobalDomain AppleLocale "en_US"
xcrun simctl uninstall $UDID_65 $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID_65 "$APP_PATH"
xcrun simctl launch $UDID_65 $BUNDLE_ID
sleep 3

# 1b と同じ axe tap --label + capture 手順（出力先だけ変更）
axe describe-ui --udid "$UDID_65"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_65" --output-dir "./screenshots/raw-65/en-US" --output json
axe tap --udid "$UDID_65" --label "Next" || axe tap --udid "$UDID_65" --label "Continue" || axe tap --udid "$UDID_65" --label "Get Started"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_65" --output-dir "./screenshots/raw-65/en-US" --output json
axe tap --udid "$UDID_65" --label "Next" || axe tap --udid "$UDID_65" --label "Continue"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID_65" --output-dir "./screenshots/raw-65/en-US" --output json
xcrun simctl spawn "$UDID_65" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
xcrun simctl terminate "$UDID_65" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_65" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_65" --output-dir "./screenshots/raw-65/en-US" --output json
```

### 1b3: en-US iPad キャプチャ（NEEDS_IPAD=true の場合のみ）

```bash
if [ "$NEEDS_IPAD" = "true" ]; then
  mkdir -p screenshots/raw-ipad/en-US screenshots/raw-ipad/ja

  xcrun simctl terminate $UDID_IPAD $BUNDLE_ID 2>/dev/null
  xcrun simctl spawn $UDID_IPAD defaults delete $BUNDLE_ID 2>/dev/null || true
  xcrun simctl spawn $UDID_IPAD defaults write NSGlobalDomain AppleLanguages -array "en"
  xcrun simctl spawn $UDID_IPAD defaults write NSGlobalDomain AppleLocale "en_US"
  xcrun simctl uninstall $UDID_IPAD $BUNDLE_ID 2>/dev/null || true
  xcrun simctl install $UDID_IPAD "$APP_PATH"
  xcrun simctl launch $UDID_IPAD $BUNDLE_ID
  sleep 3

  # 同じ axe tap --label + capture 手順
  axe describe-ui --udid "$UDID_IPAD"
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/en-US" --output json
  axe tap --udid "$UDID_IPAD" --label "Next" || axe tap --udid "$UDID_IPAD" --label "Continue" || axe tap --udid "$UDID_IPAD" --label "Get Started"
  sleep 2
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/en-US" --output json
  axe tap --udid "$UDID_IPAD" --label "Next" || axe tap --udid "$UDID_IPAD" --label "Continue"
  sleep 2
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/en-US" --output json
  xcrun simctl spawn "$UDID_IPAD" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
  xcrun simctl terminate "$UDID_IPAD" "$BUNDLE_ID"
  sleep 1
  xcrun simctl launch "$UDID_IPAD" "$BUNDLE_ID"
  sleep 3
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/en-US" --output json
fi
```

### 1c: ja キャプチャ（4画面 — 1b と同じ axe tap --label 手順）

```bash
# ja ロケール切替 + 完全リセット
# Source: Stack Overflow — "NSUserDefaults not cleared after app uninstall on simulator"
# https://stackoverflow.com/questions/24985825/nsuserdefaults-not-cleared-after-app-uninstall-on-simulator
# → `defaults delete` + uninstall + 再インストールが最も確実
xcrun simctl terminate $UDID $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "ja"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "ja_JP"
xcrun simctl uninstall $UDID $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID "$APP_PATH"
xcrun simctl launch $UDID $BUNDLE_ID
sleep 3

# 同じ 4 画面を撮影（1b と同一の axe tap --label + capture 手順）
# ⚠️ ja ロケールではボタンラベルが日本語になる可能性がある
# describe-ui で確認してから tap する
axe describe-ui --udid "$UDID"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID" --output-dir "./screenshots/raw/ja" --output json

# 遷移（ボタンラベルは describe-ui で確認。日本語 or 英語両方試す）
axe tap --udid "$UDID" --label "Next" || axe tap --udid "$UDID" --label "次へ" || axe tap --udid "$UDID" --label "Continue" || axe tap --udid "$UDID" --label "続ける"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID" --output-dir "./screenshots/raw/ja" --output json

axe tap --udid "$UDID" --label "Next" || axe tap --udid "$UDID" --label "次へ" || axe tap --udid "$UDID" --label "Continue" || axe tap --udid "$UDID" --label "続ける"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID" --output-dir "./screenshots/raw/ja" --output json

xcrun simctl spawn "$UDID" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
xcrun simctl terminate "$UDID" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID" --output-dir "./screenshots/raw/ja" --output json
```

### 1c2: ja 6.5" キャプチャ（UDID_65 で同じ4画面）

```bash
xcrun simctl terminate $UDID_65 $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID_65 defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID_65 defaults write NSGlobalDomain AppleLanguages -array "ja"
xcrun simctl spawn $UDID_65 defaults write NSGlobalDomain AppleLocale "ja_JP"
xcrun simctl uninstall $UDID_65 $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID_65 "$APP_PATH"
xcrun simctl launch $UDID_65 $BUNDLE_ID
sleep 3

axe describe-ui --udid "$UDID_65"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_65" --output-dir "./screenshots/raw-65/ja" --output json
axe tap --udid "$UDID_65" --label "Next" || axe tap --udid "$UDID_65" --label "次へ" || axe tap --udid "$UDID_65" --label "Continue" || axe tap --udid "$UDID_65" --label "続ける"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_65" --output-dir "./screenshots/raw-65/ja" --output json
axe tap --udid "$UDID_65" --label "Next" || axe tap --udid "$UDID_65" --label "次へ" || axe tap --udid "$UDID_65" --label "Continue" || axe tap --udid "$UDID_65" --label "続ける"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID_65" --output-dir "./screenshots/raw-65/ja" --output json
xcrun simctl spawn "$UDID_65" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
xcrun simctl terminate "$UDID_65" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_65" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_65" --output-dir "./screenshots/raw-65/ja" --output json
```

### 1c3: ja iPad キャプチャ（NEEDS_IPAD=true の場合のみ）

```bash
if [ "$NEEDS_IPAD" = "true" ]; then
  xcrun simctl terminate $UDID_IPAD $BUNDLE_ID 2>/dev/null
  xcrun simctl spawn $UDID_IPAD defaults delete $BUNDLE_ID 2>/dev/null || true
  xcrun simctl spawn $UDID_IPAD defaults write NSGlobalDomain AppleLanguages -array "ja"
  xcrun simctl spawn $UDID_IPAD defaults write NSGlobalDomain AppleLocale "ja_JP"
  xcrun simctl uninstall $UDID_IPAD $BUNDLE_ID 2>/dev/null || true
  xcrun simctl install $UDID_IPAD "$APP_PATH"
  xcrun simctl launch $UDID_IPAD $BUNDLE_ID
  sleep 3

  axe describe-ui --udid "$UDID_IPAD"
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/ja" --output json
  axe tap --udid "$UDID_IPAD" --label "Next" || axe tap --udid "$UDID_IPAD" --label "次へ" || axe tap --udid "$UDID_IPAD" --label "Continue" || axe tap --udid "$UDID_IPAD" --label "続ける"
  sleep 2
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/ja" --output json
  axe tap --udid "$UDID_IPAD" --label "Next" || axe tap --udid "$UDID_IPAD" --label "次へ" || axe tap --udid "$UDID_IPAD" --label "Continue" || axe tap --udid "$UDID_IPAD" --label "続ける"
  sleep 2
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_paywall" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/ja" --output json
  xcrun simctl spawn "$UDID_IPAD" defaults write "$BUNDLE_ID" hasCompletedOnboarding -bool true
  xcrun simctl terminate "$UDID_IPAD" "$BUNDLE_ID"
  sleep 1
  xcrun simctl launch "$UDID_IPAD" "$BUNDLE_ID"
  sleep 3
  asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_IPAD" --output-dir "./screenshots/raw-ipad/ja" --output json
fi
```

### 1d: en-US に戻す（後続ステップのため）

```bash
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID defaults write NSGlobalDomain AppleLocale "en_US"
```

### 1e: MD5 検証（MUST — 2段階チェック）

```bash
# チェック1: en-US vs ja が異なること（ロケール適用確認）
EN_MD5=$(/usr/bin/openssl dgst -md5 screenshots/raw/en-US/screen1_welcome.png | awk '{print $2}')
JA_MD5=$(/usr/bin/openssl dgst -md5 screenshots/raw/ja/screen1_welcome.png | awk '{print $2}')
[ "$EN_MD5" != "$JA_MD5" ] || { echo "FAIL: en/ja screenshots identical — locale not applied"; exit 1; }

# チェック2: 同一ロケール内の重複がないこと（画面遷移確認）
# ⚠️ これが前回欠けていた。3/4枚が同じ画面だったのに検出できなかった
EN_DUPES=$(/usr/bin/openssl dgst -md5 screenshots/raw/en-US/*.png | awk '{print $2}' | sort | uniq -d | wc -l | tr -d ' ')
JA_DUPES=$(/usr/bin/openssl dgst -md5 screenshots/raw/ja/*.png | awk '{print $2}' | sort | uniq -d | wc -l | tr -d ' ')
[ "$EN_DUPES" -eq 0 ] || { echo "FAIL: $EN_DUPES duplicate screenshots in en-US — axe tap navigation failed, screens didn't change"; exit 1; }
[ "$JA_DUPES" -eq 0 ] || { echo "FAIL: $JA_DUPES duplicate screenshots in ja — axe tap navigation failed, screens didn't change"; exit 1; }

echo "✅ MD5 checks passed: en≠ja, no same-locale duplicates"
```

### 1f: ASC アップロード（フレームなし — 生スクショ直接）

```bash
# version-localization ID 取得
EN_LOC_ID=$(asc localizations list --version "$VERSION_ID" --output json \
  | jq -r '.data[] | select(.attributes.locale=="en-US") | .id')
JA_LOC_ID=$(asc localizations list --version "$VERSION_ID" --output json \
  | jq -r '.data[] | select(.attributes.locale=="ja") | .id')
# ⚠️ ja が存在しない場合は REST API で作成:
# POST /v1/appStoreVersionLocalizations { locale: "ja", appStoreVersion: { id: VERSION_ID } }

# en-US アップロード（3デバイス）
asc screenshots upload \
  --version-localization "$EN_LOC_ID" \
  --path "./screenshots/raw/en-US" \
  --device-type "IPHONE_61"

asc screenshots upload \
  --version-localization "$EN_LOC_ID" \
  --path "./screenshots/raw-65/en-US" \
  --device-type "IPHONE_65"

if [ "$NEEDS_IPAD" = "true" ]; then
  asc screenshots upload \
    --version-localization "$EN_LOC_ID" \
    --path "./screenshots/raw-ipad/en-US" \
    --device-type "IPAD_PRO_3GEN_129"
fi

# ja アップロード（3デバイス）
asc screenshots upload \
  --version-localization "$JA_LOC_ID" \
  --path "./screenshots/raw/ja" \
  --device-type "IPHONE_61"

asc screenshots upload \
  --version-localization "$JA_LOC_ID" \
  --path "./screenshots/raw-65/ja" \
  --device-type "IPHONE_65"

if [ "$NEEDS_IPAD" = "true" ]; then
  asc screenshots upload \
    --version-localization "$JA_LOC_ID" \
    --path "./screenshots/raw-ipad/ja" \
    --device-type "IPAD_PRO_3GEN_129"
fi
```

**⚠️ 正しいフラグ（2026-03-04 実証済み）:**

| フラグ | 値 | 説明 |
|--------|-----|------|
| `--version-localization` | LOC_ID | ロケール別の version-localization ID |
| `--path` | ディレクトリパス | ファイルではなくディレクトリを指定 |
| `--device-type` | `IPHONE_61` | iPhone 17 Pro シミュレータ 1206×2622 |

**❌ 存在しないフラグ（使うな）:** `--locale`, `--file`, `--app`, `--display-type`

### 1g: アップロード検証（MUST — Evidence Over Assertion）

```bash
EN_COUNT=$(asc screenshots list --version-localization "$EN_LOC_ID" --output json | jq '.data | length')
JA_COUNT=$(asc screenshots list --version-localization "$JA_LOC_ID" --output json | jq '.data | length')
[ "$EN_COUNT" -ge 4 ] || { echo "FAIL: en-US has $EN_COUNT screenshots (need ≥4)"; exit 1; }
[ "$JA_COUNT" -ge 4 ] || { echo "FAIL: ja has $JA_COUNT screenshots (need ≥4)"; exit 1; }
echo "✅ Screenshots: en-US=$EN_COUNT, ja=$JA_COUNT"
```

### 1h: Subscription Review Screenshot（Paywall スクショ → IAP 審査用）

依存: US-005b で `$MONTHLY_ID`, `$ANNUAL_ID` が .env に記録済み
依存: US-006 で `hasCompletedOnboarding` キーが実装済み

⚠️ US-005b Step 6.6 から移動。アプリ実装後（US-006 完了後）でないと Paywall 画面が存在しない。

```bash
# Paywall 画面を表示するためオンボーディングを完全リセット
# ⚠️ `defaults write false` は効かない場合がある → `defaults delete` を使う
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null
xcrun simctl spawn "$UDID" defaults delete "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl uninstall "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"; sleep 3

# オンボーディング最終画面（= Paywall）まで axe tap --label で遷移
# ⚠️ axe swipe は使わない（NavigationStack ベースのオンボーディングでは効かない）
# describe-ui でボタンを見つけてタップで遷移する
axe describe-ui --udid "$UDID"
# 最大 10 回タップ（余分なタップは Paywall に到達後無害）
for i in $(seq 1 10); do
  axe tap --udid "$UDID" --label "Next" 2>/dev/null || \
  axe tap --udid "$UDID" --label "Continue" 2>/dev/null || \
  axe tap --udid "$UDID" --label "Get Started" 2>/dev/null || \
  axe tap --udid "$UDID" --label "次へ" 2>/dev/null || \
  axe tap --udid "$UDID" --label "続ける" 2>/dev/null || \
  true
  sleep 0.5
done
sleep 1
# describe-ui で Paywall が表示されているか確認
axe describe-ui --udid "$UDID"

# Paywall 画面をキャプチャ
xcrun simctl io "$UDID" screenshot /tmp/paywall-review.png

# 検証: 100KB 未満 = 空画面の可能性
PW_SIZE=$(stat -f%z /tmp/paywall-review.png)
[ "$PW_SIZE" -gt 100000 ] || { echo "FAIL: paywall screenshot too small ($PW_SIZE bytes)"; exit 1; }

# Monthly + Annual 両方にアップロード
source ~/.config/mobileapp-builder/.env
asc subscriptions review-screenshots create \
  --subscription-id "$MONTHLY_ID" \
  --file /tmp/paywall-review.png

asc subscriptions review-screenshots create \
  --subscription-id "$ANNUAL_ID" \
  --file /tmp/paywall-review.png

echo "✅ Review screenshots uploaded for MONTHLY=$MONTHLY_ID and ANNUAL=$ANNUAL_ID"
```

**検証済みコマンド（2026-03-04 Chi Daily で実証）:**

| コマンド | 用途 |
|---------|------|
| `asc subscriptions review-screenshots create --subscription-id $ID --file PATH` | review screenshot アップロード |
| `asc subscriptions review-screenshots get --id $SHOT_ID` | アップロード確認 |
| `asc subscriptions review-screenshots delete --id $SHOT_ID --confirm` | 既存削除（更新時のみ） |

**PROHIBITED:**
- ⛔ screenshot-creator スキル禁止
- ⛔ Pencil MCP 禁止
- ⛔ Python/Pillow/ImageMagick 禁止
- ⛔ axe-shim（偽物）禁止
- ⛔ `--locale` フラグ禁止（存在しない。`--version-localization LOC_ID` を使う）
- ⛔ `--file` フラグ禁止（screenshots upload では存在しない。`--path DIR` を使う）
- ⛔ Koubou / `asc screenshots frame` 禁止（asc 0.36.3 バグ。生スクショ直接アップロード）
- ⛔ Home 画面を Review Screenshot にアップロードするな（Paywall 画面を撮れ）

## Step 2: Metadata Sync
⚠️ `asc metadata sync` は存在しない。`asc localizations update` を使う。
```bash
# en-US + ja 両方
# app-info (name, subtitle, privacyPolicyUrl):
asc localizations update --type app-info --app $APP_ID \
  --locale en-US --name "<app_name>" --subtitle "<subtitle>" \
  --privacy-policy-url "<url>"
asc localizations update --type app-info --app $APP_ID \
  --locale ja --name "<app_name_ja>" --subtitle "<subtitle_ja>" \
  --privacy-policy-url "<url>"

# version (description, keywords, supportUrl):
asc localizations update --version $VERSION_ID \
  --locale en-US --description "<description>" --keywords "<keywords>" \
  --support-url "<url>"
asc localizations update --version $VERSION_ID \
  --locale ja --description "<description_ja>" --keywords "<keywords_ja>" \
  --support-url "<url>"
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

## Step 5: Copyright + Age Rating + Encryption + Content Rights

Source: Apple ASC Help — Required, localizable, and editable properties
https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties
> Platform version information: Copyright is a required field

Source: Apple ASC API — AppStoreVersion.Attributes
https://developer.apple.com/documentation/appstoreconnectapi/appstoreversion/attributes
> `copyright` — string attribute on AppStoreVersion

```bash
# Copyright (REQUIRED — 未設定だと提出時にエラー)
CURRENT_YEAR=$(date +%Y)
DEVELOPER_NAME="Daisuke Kobayashi"  # .env から取得可能にする
asc versions update --version-id "$VERSION_ID" --copyright "$CURRENT_YEAR $DEVELOPER_NAME"

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
# ⚠️ `asc builds attach` は存在しない。`asc versions attach-build` を使う:
# Source: asc CLI v0.36.3 `asc versions --help`
# Source: Apple ASC API — https://developer.apple.com/documentation/appstoreconnectapi/patch-v1-appstoreversions-_id_-relationships-build
# > 「Change the build that is attached to a specific App Store version.」
asc versions attach-build --version-id "$VERSION_ID" --build "$BUILD_ID"

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
- Screenshots uploaded to ASC for en-US and ja — IPHONE_61 + IPHONE_65 (AXe + asc screenshots capture)
- Screenshots uploaded for IPAD_PRO_3GEN_129 if UIDeviceFamily includes iPad
- Subscription review screenshots uploaded for Monthly + Annual
- Metadata synced (en-US + ja)
- Copyright set (REQUIRED field)
- .ipa uploaded (processingState = VALID)
- Build attached to version
- Age Rating set, Review Details set (demoAccountRequired=false)
- Availability + Pricing set (175 territories)
- Encryption + Content Rights set
- asc validate returns Errors=0
- release-review 5 checklists all pass
- TestFlight build distributed
- Slack #metrics notified
