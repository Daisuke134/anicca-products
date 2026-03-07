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
xcodebuild test -scheme <AppName> -destination "platform=iOS Simulator,id=$UDID_69" || { echo "GATE FAIL: tests broken"; exit 1; }
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

# .xcstrings 内容検証（MANDATORY — Fix #2: %% タイポ防止）
# Source: Apple Developer Documentation
# https://developer.apple.com/documentation/xcode/localizing-and-varying-text-with-a-string-catalog
# 核心の引用: 「Use a string catalog to translate text」
# → .xcstrings は JSON 形式で % をそのまま書く。String(localized:) は %% エスケープ不要。
XCSTRINGS=$(find . -name "*.xcstrings" -not -path "*/build/*" | head -1)
if [ -n "$XCSTRINGS" ]; then
  DOUBLE_PCT=$(grep -c '%%' "$XCSTRINGS" 2>/dev/null || echo "0")
  if [ "$DOUBLE_PCT" -gt 0 ]; then
    echo "❌ FAIL: $DOUBLE_PCT occurrences of %% found in $XCSTRINGS"
    echo "String(localized:) does not require %% escaping. Auto-fixing..."
    sed -i '' 's/%%/%/g' "$XCSTRINGS"
    echo "✅ AUTO-FIXED: %% → %"
  fi
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
| iPhone 16 Pro Max | 1320x2868 | IPHONE_69 | 常に必須（6.9" 提出で全サイズ自動スケール） |

Source: Apple ASC Help — Screenshot specifications (2026)
https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
核心の引用: 「6.5" Display — Required if screenshots for 6.9" display aren't provided」
核心の引用: 「If screenshots with the accepted sizes aren't provided, scaled screenshots for 6.9" displays are used」
→ 6.9" を提出すれば 6.5"/6.3"/6.1" は Apple が自動スケーリング。1台で全カバー。
Verified: `asc screenshots upload --device-type IPHONE_69` が 1320x2868 を受付（2026-03-08 テスト済み）

- ❌ IPHONE_61 / IPHONE_65 は不要（6.9" が全てカバー）
- ❌ iPad スクショは不要（TARGETED_DEVICE_FAMILY: "1" = iPhone only の場合）

### 1a: シミュレータ準備 + アプリインストール

```bash
export ASC_BYPASS_KEYCHAIN=true

# 6.9" シミュレータのみ使用（Apple が 6.5"/6.3"/6.1" を自動スケール）
UDID_69=$(xcrun simctl list devices available | grep "iPhone16ProMax-69\|iPhone 16 Pro Max\|iPhone 17 Pro Max" | head -1 | grep -oE '[A-F0-9-]{36}')
if [ -z "$UDID_69" ]; then
  RUNTIME=$(xcrun simctl list runtimes | grep "iOS" | tail -1 | grep -oE 'com.apple[^ ]+')
  UDID_69=$(xcrun simctl create "iPhone16ProMax-69" "com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro-Max" "$RUNTIME")
fi
xcrun simctl boot $UDID_69 2>/dev/null || true

# Maestro パス（$HOME が空になる場合があるため絶対パス指定）
MAESTRO="/Users/anicca/.maestro/bin/maestro"
[ -x "$MAESTRO" ] || MAESTRO=$(which maestro 2>/dev/null || echo "maestro")

# アプリビルド + インストール
XCODE_DIR=$(find . -name "*.xcodeproj" -maxdepth 2 | head -1 | xargs dirname)
xcodebuild build -project "$XCODE_DIR"/*.xcodeproj -scheme * \
  -destination "platform=iOS Simulator,id=$UDID_69" -derivedDataPath build/
APP_PATH=$(find . -path "*/Debug-iphonesimulator/*.app" -not -path "*/DerivedData/SourcePackages/*" | head -1)
[ -n "$APP_PATH" ] || { echo "FAIL: .app not found after build"; exit 1; }
xcrun simctl install $UDID_69 "$APP_PATH"
```

### 1b: en-US キャプチャ（4画面）

⚠️ CRITICAL: 画面遷移は `axe tap --label` を使う（`axe swipe` は PageTabViewStyle のみ有効）
Source: AXe GitHub (https://github.com/cameroncooke/AXe)
> 「axe tap --label "Button Label" — Tap by accessibility label (preferred)」
> 「Prefer --label for tapping when possible (more resilient to layout changes)」

```bash
mkdir -p screenshots/raw-69/en-US screenshots/raw-69/ja

# ⚠️ MANDATORY: UserDefaults キー名はアプリのコードから確認する（パッチD）
# hasCompletedOnboarding / has_completed_onboarding / isOnboardingComplete 等はアプリごとに異なる
ONBOARDING_KEY=$(grep -rh "completedOnboarding\|isOnboarding\|onboardingDone\|hasCompleted" \
  --include="*.swift" . 2>/dev/null | head -1 | grep -oE '"[^"]*[Oo]nboard[^"]*"' | tr -d '"' | head -1)
[ -z "$ONBOARDING_KEY" ] && ONBOARDING_KEY="hasCompletedOnboarding"  # fallback
echo "Detected onboarding key: $ONBOARDING_KEY"

# en-US ロケール設定 + 完全リセット
# ⚠️ "Domain not found" / "Invalid device" は正常（キーが存在しない = 期待通り）。リトライ不要。
xcrun simctl terminate $UDID_69 $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID_69 defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLocale "en_US"
xcrun simctl uninstall $UDID_69 $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID_69 "$APP_PATH"
xcrun simctl launch $UDID_69 $BUNDLE_ID
sleep 5

# screen1: オンボーディング画面1
# まず describe-ui で画面構造を確認
axe describe-ui --udid "$UDID_69"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_69" --output-dir "./screenshots/raw-69/en-US" --output json

# screen2: 次のオンボーディング画面に遷移
# ⚠️ axe swipe ではなく axe tap --label でボタンを押して遷移する
# describe-ui の出力から「Next」「Continue」「Get Started」等のボタンラベルを見つけてタップ
# ボタンが見つからない場合は axe tap --id でaccessibilityIdentifierを使う
axe tap --udid "$UDID_69" --label "Next" || axe tap --udid "$UDID_69" --label "Continue" || axe tap --udid "$UDID_69" --label "Get Started"
sleep 2
axe describe-ui --udid "$UDID_69"  # 画面が変わったか確認
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_69" --output-dir "./screenshots/raw-69/en-US" --output json

# screen3: メイン機能画面（使用状態 — Paywallはプロダクトページスクショに含めない）
# Fix #1: Paywallスクショはプロダクトページに含めない（DL率低下のため）
# Source: RevenueCat SOSA 2025 — https://www.revenuecat.com/blog/growth/sosa-2025-launch-sub-club/
# 核心の引用: 「your paywall should be part of your onboarding experience... you get one shot」
# → Paywallはアプリ内体験であってスクショに見せるものじゃない
# ※ Paywall（review screenshot用）は Step 1h で IAP レビュースクショとして別途撮影する
xcrun simctl spawn "$UDID_69" defaults write "$BUNDLE_ID" "$ONBOARDING_KEY" -bool true
xcrun simctl terminate "$UDID_69" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_69" "$BUNDLE_ID"
sleep 3
axe describe-ui --udid "$UDID_69"  # メイン機能画面が表示されているか確認
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_main_feature" --udid "$UDID_69" --output-dir "./screenshots/raw-69/en-US" --output json

# screen4: Home（使い込まれた状態 — ダミーデータセット）
# Fix #5: 0 breaks 初期状態ではなく、使い込んだ状態にする
# Source: Uptech MVP Guide — https://www.uptech.team/blog/build-an-mvp
# 核心の引用: 「Solve one core problem. Focus on what matters most to your users」
# → スクショは「アプリが解決する問題の結果」を見せるべき
xcrun simctl spawn "$UDID_69" defaults write "$BUNDLE_ID" "$ONBOARDING_KEY" -bool true
# ダミーデータセット（CC は prd.json の features を読み、適切な UserDefaults キーをセットせよ）
# 例: todayBreakCount, totalSessions, streakDays, completedTasks 等
xcrun simctl terminate "$UDID_69" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_69" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_69" --output-dir "./screenshots/raw-69/en-US" --output json
```

**⚠️ 画面遷移ルール:**
- `axe swipe` は使用禁止（NavigationStack / switch ベースのオンボーディングでは効かない）
- `axe tap --label` でボタンを押して遷移する
- 遷移後は必ず `axe describe-ui` で画面が変わったか確認する
- ボタンラベルがわからない場合は `axe describe-ui` の出力から探す

### 1c: ja キャプチャ（4画面 — 1b と同じ axe tap --label 手順）

```bash
# ja ロケール切替 + 完全リセット
# Source: Stack Overflow — "NSUserDefaults not cleared after app uninstall on simulator"
# https://stackoverflow.com/questions/24985825/nsuserdefaults-not-cleared-after-app-uninstall-on-simulator
# → `defaults delete` + uninstall + 再インストールが最も確実
xcrun simctl terminate $UDID_69 $BUNDLE_ID 2>/dev/null
xcrun simctl spawn $UDID_69 defaults delete $BUNDLE_ID 2>/dev/null || true
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLanguages -array "ja"
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLocale "ja_JP"
xcrun simctl uninstall $UDID_69 $BUNDLE_ID 2>/dev/null || true
xcrun simctl install $UDID_69 "$APP_PATH"
xcrun simctl launch $UDID_69 $BUNDLE_ID
sleep 3

# 同じ 4 画面を撮影（1b と同一の axe tap --label + capture 手順）
# ⚠️ ja ロケールではボタンラベルが日本語になる可能性がある
# describe-ui で確認してから tap する
axe describe-ui --udid "$UDID_69"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen1_welcome" --udid "$UDID_69" --output-dir "./screenshots/raw-69/ja" --output json

# 遷移（ボタンラベルは describe-ui で確認。日本語 or 英語両方試す）
axe tap --udid "$UDID_69" --label "Next" || axe tap --udid "$UDID_69" --label "次へ" || axe tap --udid "$UDID_69" --label "Continue" || axe tap --udid "$UDID_69" --label "続ける"
sleep 2
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen2_features" --udid "$UDID_69" --output-dir "./screenshots/raw-69/ja" --output json

# screen3: メイン機能画面（Fix #1: Paywallではなくメイン機能）
xcrun simctl spawn "$UDID_69" defaults write "$BUNDLE_ID" "$ONBOARDING_KEY" -bool true
xcrun simctl terminate "$UDID_69" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_69" "$BUNDLE_ID"
sleep 3
axe describe-ui --udid "$UDID_69"
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen3_main_feature" --udid "$UDID_69" --output-dir "./screenshots/raw-69/ja" --output json

# screen4: Home（Fix #5: ダミーデータセット）
xcrun simctl spawn "$UDID_69" defaults write "$BUNDLE_ID" "$ONBOARDING_KEY" -bool true
xcrun simctl terminate "$UDID_69" "$BUNDLE_ID"
sleep 1
xcrun simctl launch "$UDID_69" "$BUNDLE_ID"
sleep 3
asc screenshots capture --bundle-id "$BUNDLE_ID" --name "screen4_home" --udid "$UDID_69" --output-dir "./screenshots/raw-69/ja" --output json
```

### 1d: en-US に戻す（後続ステップのため）

```bash
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLanguages -array "en"
xcrun simctl spawn $UDID_69 defaults write NSGlobalDomain AppleLocale "en_US"
```

### 1e: MD5 検証（MUST — 2段階チェック）

```bash
# チェック1: en-US vs ja が異なること（ロケール適用確認）
EN_MD5=$(/usr/bin/openssl dgst -md5 screenshots/raw-69/en-US/screen1_welcome.png | awk '{print $2}')
JA_MD5=$(/usr/bin/openssl dgst -md5 screenshots/raw-69/ja/screen1_welcome.png | awk '{print $2}')
[ "$EN_MD5" != "$JA_MD5" ] || { echo "FAIL: en/ja screenshots identical — locale not applied"; exit 1; }

# チェック2: 同一ロケール内の重複がないこと（画面遷移確認）
# ⚠️ これが前回欠けていた。3/4枚が同じ画面だったのに検出できなかった
EN_DUPES=$(/usr/bin/openssl dgst -md5 screenshots/raw-69/en-US/*.png | awk '{print $2}' | sort | uniq -d | wc -l | tr -d ' ')
JA_DUPES=$(/usr/bin/openssl dgst -md5 screenshots/raw-69/ja/*.png | awk '{print $2}' | sort | uniq -d | wc -l | tr -d ' ')
[ "$EN_DUPES" -eq 0 ] || { echo "FAIL: $EN_DUPES duplicate screenshots in en-US — axe tap navigation failed, screens didn't change"; exit 1; }
[ "$JA_DUPES" -eq 0 ] || { echo "FAIL: $JA_DUPES duplicate screenshots in ja — axe tap navigation failed, screens didn't change"; exit 1; }

echo "✅ MD5 checks passed: en≠ja, no same-locale duplicates"
```

### 1f: デバイスフレーム + ヘッドライン合成 — ⚠️ DISABLED (2026-03-07)

**このセクション（1f）は無効。スキップすること。**
生スクショ（screenshots/raw/）をそのまま ASC にアップロードする（セクション 1f2 に進め）。
Koubou / `kou generate` は使わない。

~~Source: Koubou v0.14.0 — pip install koubou==0.14.0~~
~~Verified: 2026-03-07 Mac Mini — `kou generate` でフレーム合成成功~~

```bash
# kou が PATH にあることを確認
export PATH="/Users/anicca/Library/Python/3.9/bin:$PATH"
which kou || { pip3 install koubou==0.14.0 && echo "✅ Koubou installed"; }

# ヘッドライン生成ルール（Fix #9 — MANDATORY）:
# 1. スクショのヘッドラインはアプリ内テキストのコピーではなく「価値提案」を書く
# 2. 各スクショのヘッドラインは異なるベネフィットをハイライトする
# 3. パターン: screen1=主要価値提案, screen2=機能ハイライト, screen3=使用結果, screen4=CTA
# 4. PRD の tagline + value_proposition + key_features から導出する
# 5. アプリ内テキストとヘッドラインが同じ文言にならないこと
#
# 例:
#   ❌ "Your Eyes Need Breaks"（アプリ内テキストのコピー）
#   ✅ "The 20-20-20 Rule, Automated"（価値提案）

# PRIMARY_COLOR は PRD の design_system.primary から取得する
PRIMARY_COLOR=$(python3 -c "import json; d=json.load(open('prd.json')); print(d.get('designSystem',{}).get('primaryColor','#0A7AFF'))" 2>/dev/null || echo "#0A7AFF")

# CC が PRD から4つのヘッドライン（en + ja）を生成し、Koubou YAML を作成する
# デバイスフレーム名は色を含む正式名が必要:
#   ✅ "iPhone 16 Pro - Black Titanium - Portrait"
#   ❌ "iPhone 15 Pro Portrait"（エラーになる）
# kou list-frames で利用可能なフレーム名を確認すること

cat > koubou-config.yaml << YAML
project:
  name: $APP_NAME
  device: "iPhone 16 Pro - Black Titanium - Portrait"
  output_dir: screenshots/framed/en-US
  output_size: iPhone6_7

defaults:
  background:
    type: linear
    colors: ["$PRIMARY_COLOR", "#1a1a2e"]
    direction: 180

screenshots:
  screen1:
    content:
      - type: text
        content: "<HEADLINE_1_EN>"
        position: ["50%", "10%"]
        size: 48
        weight: bold
        color: "#FFFFFF"
      - type: image
        asset: screenshots/raw-69/en-US/screen1_welcome.png
        frame: true
        position: ["50%", "58%"]
        scale: 0.55
  screen2:
    content:
      - type: text
        content: "<HEADLINE_2_EN>"
        position: ["50%", "10%"]
        size: 48
        weight: bold
        color: "#FFFFFF"
      - type: image
        asset: screenshots/raw-69/en-US/screen2_features.png
        frame: true
        position: ["50%", "58%"]
        scale: 0.55
  screen3:
    content:
      - type: text
        content: "<HEADLINE_3_EN>"
        position: ["50%", "10%"]
        size: 48
        weight: bold
        color: "#FFFFFF"
      - type: image
        asset: screenshots/raw-69/en-US/screen3_main_feature.png
        frame: true
        position: ["50%", "58%"]
        scale: 0.55
  screen4:
    content:
      - type: text
        content: "<HEADLINE_4_EN>"
        position: ["50%", "10%"]
        size: 48
        weight: bold
        color: "#FFFFFF"
      - type: image
        asset: screenshots/raw-69/en-US/screen4_home.png
        frame: true
        position: ["50%", "58%"]
        scale: 0.55
YAML

kou generate koubou-config.yaml
echo "✅ Framed screenshots generated in screenshots/framed/en-US/"

# ja 用にも同様の YAML を生成（ヘッドラインを日本語に変更）
# 6.5" 用は output_size: iPhone6_7 のまま（ASCが自動リサイズ）
# iPad 用は device: "iPad Pro 13 (M4) - Silver" + output_size: iPadPro13 に変更
```

### 1f2: ASC アップロード（フレーム付きスクショ）

```bash
# version-localization ID 取得
EN_LOC_ID=$(asc localizations list --version "$VERSION_ID" --output json \
  | jq -r '.data[] | select(.attributes.locale=="en-US") | .id')
JA_LOC_ID=$(asc localizations list --version "$VERSION_ID" --output json \
  | jq -r '.data[] | select(.attributes.locale=="ja") | .id')
# ⚠️ ja が存在しない場合は REST API で作成:
# POST /v1/appStoreVersionLocalizations { locale: "ja", appStoreVersion: { id: VERSION_ID } }

# 6.9" のみアップロード（Apple が 6.5"/6.3"/6.1" を自動スケール）
# Verified: asc screenshots upload --device-type IPHONE_69 accepts 1320x2868 (2026-03-08)
asc screenshots upload \
  --version-localization "$EN_LOC_ID" \
  --path "./screenshots/raw-69/en-US" \
  --device-type "IPHONE_69"

asc screenshots upload \
  --version-localization "$JA_LOC_ID" \
  --path "./screenshots/raw-69/ja" \
  --device-type "IPHONE_69"
```

**⚠️ 正しいフラグ（2026-03-08 実証済み）:**

| フラグ | 値 | 説明 |
|--------|-----|------|
| `--version-localization` | LOC_ID | ロケール別の version-localization ID |
| `--path` | ディレクトリパス | ファイルではなくディレクトリを指定 |
| `--device-type` | `IPHONE_69` | iPhone 16 Pro Max 1320×2868 |

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
xcrun simctl terminate "$UDID_69" "$BUNDLE_ID" 2>/dev/null
xcrun simctl spawn "$UDID_69" defaults delete "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl uninstall "$UDID_69" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl install "$UDID_69" "$APP_PATH"
xcrun simctl launch "$UDID_69" "$BUNDLE_ID"; sleep 3

# オンボーディング最終画面（= Paywall）まで axe tap --label で遷移
# ⚠️ axe swipe は使わない（NavigationStack ベースのオンボーディングでは効かない）
# describe-ui でボタンを見つけてタップで遷移する
axe describe-ui --udid "$UDID_69"
# 最大 10 回タップ（余分なタップは Paywall に到達後無害）
for i in $(seq 1 10); do
  axe tap --udid "$UDID_69" --label "Next" 2>/dev/null || \
  axe tap --udid "$UDID_69" --label "Continue" 2>/dev/null || \
  axe tap --udid "$UDID_69" --label "Get Started" 2>/dev/null || \
  axe tap --udid "$UDID_69" --label "次へ" 2>/dev/null || \
  axe tap --udid "$UDID_69" --label "続ける" 2>/dev/null || \
  true
  sleep 0.5
done
sleep 1
# describe-ui で Paywall が表示されているか確認
axe describe-ui --udid "$UDID_69"

# Fix #4: offerings ロード待ち + Annual プラン選択してからキャプチャ
# Source: Apple App Review Guidelines §3.1.2 — https://developer.apple.com/app-store/review/guidelines/#in-app-purchase
# 核心の引用: 「clearly describe what users are buying」
# → レビュースクショでプランが選択可能に見えてないとレビュアーが疑う
sleep 5  # uiPreviewMode での offerings ロード待ち
axe describe-ui --udid "$UDID_69"  # プランが表示されてるか確認
# Annualプランをタップ（ボタンラベルはアプリ依存 — describe-ui で確認）
axe tap --udid "$UDID_69" --label "Annual" 2>/dev/null || \
axe tap --udid "$UDID_69" --label "Yearly" 2>/dev/null || \
axe tap --udid "$UDID_69" --id "paywall_plan_yearly" 2>/dev/null || \
true
sleep 1
axe describe-ui --udid "$UDID_69"  # プランが選択状態か確認

# Paywall 画面をキャプチャ
xcrun simctl io "$UDID_69" screenshot /tmp/paywall-review.png

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
- ⛔ Koubou / `kou generate` 禁止（DISABLED 2026-03-07）。生スクショをそのままアップロードすること
- ⛔ Home 画面を Review Screenshot にアップロードするな（Paywall 画面を撮れ）
- ⛔ Paywall 画面をプロダクトページスクショに含めるな（Fix #1: レビュースクショ用の Step 1h でのみ使う）

## Step 2: Metadata Sync（asc localizations upload で一括）

Verified: `asc localizations upload --dry-run` テスト済み（2026-03-08）

```bash
# .strings ファイル生成（CC が PRD から内容を生成）
mkdir -p metadata/app-info metadata/version

# app-info (name, subtitle, privacyPolicyUrl) — 全ロケール
cat > metadata/app-info/en-US.strings << 'STREOF'
"name" = "<APP_NAME>";
"subtitle" = "<SUBTITLE>";
"privacyPolicyUrl" = "https://aniccafactory.com/privacy";
STREOF

cat > metadata/app-info/ja.strings << 'STREOF'
"name" = "<APP_NAME_JA>";
"subtitle" = "<SUBTITLE_JA>";
"privacyPolicyUrl" = "https://aniccafactory.com/privacy";
STREOF

# version (description, keywords, supportUrl, whatsNew) — 全ロケール
cat > metadata/version/en-US.strings << 'STREOF'
"description" = "<DESCRIPTION>";
"keywords" = "<KEYWORDS>";
"supportUrl" = "https://aniccafactory.com/support";
"whatsNew" = "Initial release";
STREOF

cat > metadata/version/ja.strings << 'STREOF'
"description" = "<DESCRIPTION_JA>";
"keywords" = "<KEYWORDS_JA>";
"supportUrl" = "https://aniccafactory.com/support";
"whatsNew" = "初回リリース";
STREOF

# 一括アップロード（2コマンドで全ロケール完了）
asc localizations upload --app "$APP_ID" --type app-info --path metadata/app-info/
asc localizations upload --version "$VERSION_ID" --path metadata/version/
```
CRITICAL: Privacy Policy URL は en-US AND ja 両方必須（Rule 7）

## Step 3: Build + Upload (Fix #6: xcodebuild + ASC API Key auth)

Source: Apple Developer Documentation — xcodebuild
https://developer.apple.com/documentation/xcode/distributing-your-app-for-testing-and-release
核心の引用: 「xcodebuild supports authentication via App Store Connect API keys using -authenticationKeyPath, -authenticationKeyID, and -authenticationKeyIssuerID」

```bash
source ~/.config/mobileapp-builder/.env

# Archive（xcodebuild + ASC API Key auth — headless CI 向け正規手順）
xcodebuild archive \
  -project *.xcodeproj -scheme "$SCHEME" \
  -archivePath build/app.xcarchive \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM="$TEAM_ID"

# Export
cat > build/exportOptions.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><true/>
  <key>compileBitcode</key><false/>
</dict></plist>
PLIST

xcodebuild -exportArchive \
  -archivePath build/app.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist build/exportOptions.plist \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$ASC_KEY_PATH" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

# Upload
IPA_PATH=$(find build/export -name "*.ipa" | head -1)
xcrun altool --upload-app -f "$IPA_PATH" -t ios \
  --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
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

## Step 8: Validate + Submit（asc release run）

Verified: `asc release run --dry-run` テスト済み（2026-03-08）
Source: ASC CLI v0.37.2 PR #849 — "Release orchestration command"

```bash
# Prerequisites（asc release run の前に完了すること）:
# - Copyright: asc versions update --version-id $VERSION_ID --copyright "$(date +%Y) Daisuke Kobayashi"
# - Age Rating: asc age-rating set --app $APP_ID ...（全22項目）
# - Review Details: asc review details-create --app $APP_ID --version-id $VERSION_ID --demo-account-required false
# - Category: asc categories set --app-info $APP_INFO_ID --primary HEALTH_AND_FITNESS
# - Availability: asc availability set --app $APP_ID --territories ALL
# - Encryption: asc encryption set ... --uses-non-exempt-encryption false
# - Content Rights: asc content-rights set ... --uses-third-party-content false

# metadata-dir for asc release run (JSON format — asc metadata pull で取得)
asc metadata pull --app "$APP_ID" --version "1.0" --dir metadata/release/

# ビルド待ち
BUILD_ID=$(asc builds latest --app "$APP_ID" --output json | jq -r '.data.id')
asc builds wait --app "$APP_ID" --build "$BUILD_ID" --timeout 30m

# プレビュー（MANDATORY — 本番前に必ず dry-run）
asc release run \
  --app "$APP_ID" \
  --version "1.0" \
  --build "$BUILD_ID" \
  --metadata-dir "metadata/release/" \
  --dry-run --pretty

# Errors = 0 を確認してから本番実行:
asc release run \
  --app "$APP_ID" \
  --version "1.0" \
  --build "$BUILD_ID" \
  --metadata-dir "metadata/release/" \
  --confirm
```

⚠️ `asc release run` がカバーしないもの（上の Prerequisites で個別設定）:
Copyright, Age Rating, Review Details, Category, Availability, Pricing, Encryption, Content Rights

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
- Screenshots uploaded to ASC for en-US and ja — IPHONE_69 (6.9" only, Apple auto-scales smaller sizes)
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
