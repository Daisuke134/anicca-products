# US-006: iOS Implementation

Source: rshankras WORKFLOW.md Phase 4
> "Claude-Assisted Implementation — Ask Claude to implement specific components"


## Step 0: Greenlight Loop (MANDATORY — 最初に実行)

Source: Greenlight SKILL.md
> "Keep looping until the output shows GREENLIT status (zero CRITICAL findings)"

Source: Greenlight README — GitHub Actions Example
> "Fail the pipeline if critical issues found"

**実装が完了したら、GREENLIT になるまでループ:**

```bash
while true; do
  XCODE_DIR=$(find . -name "*.xcodeproj" -maxdepth 2 | head -1 | xargs dirname)
  GL_OUTPUT=$(greenlight preflight "$XCODE_DIR" --format json 2>&1)
  GL_CRITICAL=$(echo "$GL_OUTPUT" | jq '.summary.critical // 999')

  if [ "$GL_CRITICAL" -eq 0 ]; then
    echo "GREENLIT — zero CRITICAL findings"
    break
  fi

  echo "CRITICAL=$GL_CRITICAL — fixing issues..."

  # Greenlight の出力を読んで CRITICAL を修正
  # 修正後、このループの先頭に戻る
done
```

### PROHIBITED
- CRITICAL > 0 で passes:true にするな
- 「後で直す」でスキップするな
- 1 回だけ実行して終わりにするな

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/implementation-guide/SKILL.md` — rshankras
2. `.claude/skills/ios-ux-design/SKILL.md` — UI/UX デザイン（HIG + SwiftUI パターン統合。これ1つでUI全般カバー）

## Quality Gate (MANDATORY — US-005b の成果物検証)

Source: snarktank/ralph SKILL.md
> 「Story Ordering: Dependencies First. Wrong order: UI component (depends on schema that does not exist yet)」

```bash
# xcodegen プロジェクトでは Package.swift は存在しない。project.yml を検証する
grep -q "RevenueCat" project.yml || { echo "GATE FAIL: no RevenueCat in project.yml"; exit 1; }
echo "Quality Gate PASS"
```

**注意:** xcodegen プロジェクトでは `Package.swift` は存在しない。SPM 依存は `project.yml` の `packages:` セクションで管理する。

## Step 0.5: PrivacyInfo.xcprivacy + ITSAppUsesNonExemptEncryption（US-005a から延期）

> **US-005a で延期された必須タスク。iOS プロジェクト作成直後に実行すること。**

### 0.5.1: PrivacyInfo.xcprivacy 追加

Source: Apple WWDC23 (https://developer.apple.com/videos/play/wwdc2023/10060/)
> 「Third-party SDK developers can include a privacy manifest by creating PrivacyInfo.xcprivacy」

Source: Apple Developer (https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
> 「Apps and third-party SDKs need to include a privacy manifest if they use required reason APIs.」

**UserDefaults は Required Reason API。CA92.1（アプリ自身のデータアクセス）を必ず申告する。**

```bash
cat > <AppName>ios/<AppName>/PrivacyInfo.xcprivacy << 'PRIVEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
PRIVEOF
```

### 0.5.2: ITSAppUsesNonExemptEncryption

Source: Apple Developer (https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption)
> 「A Boolean value indicating whether the app uses encryption」

**Info.plist に追加（xcodegen の `info:` ブロックで自動生成する場合は不要）:**

```bash
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" <AppName>ios/<AppName>/Resources/Info.plist
```

### 検証
```bash
[ -f "<AppName>ios/<AppName>/PrivacyInfo.xcprivacy" ] || { echo "FAIL: PrivacyInfo.xcprivacy missing"; exit 1; }
grep -q "CA92.1" "<AppName>ios/<AppName>/PrivacyInfo.xcprivacy" || { echo "FAIL: CA92.1 reason missing"; exit 1; }
echo "Privacy + Encryption OK"
```

## Step 1: project.yml（xcodegen）セットアップ

Source: xcodegen ProjectSpec.md (https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md)
> 「info: An info plist to auto-generate. This automatically generates and sets INFOPLIST_FILE and GENERATE_INFOPLIST_FILE.」

Source: Apple Observation Framework (https://developer.apple.com/documentation/observation)
> 「@Observable macro — Available: iOS 17.0+」

### 1.1: Deployment Target 決定マトリクス

| 条件 | iOS Minimum | 根拠 |
|------|------------|------|
| `@Observable` 使用（推奨） | **17.0** | Observation framework = iOS 17+ |
| `ObservableObject` のみ | 15.0 | Combine ベース、iOS 15+ |

**mobileapp-builder のデフォルト: iOS 17.0**（`@Observable` を使うため）

### 1.2: project.yml テンプレート

Source: xcodegen ProjectSpec.md — info block
> 「properties: A dictionary of info plist keys and values. If the key starts with INFOPLIST_KEY_, it will be treated as a build setting.」

```yaml
name: <AppName>
options:
  bundleIdPrefix: com.aniccafactory
  deploymentTarget:
    iOS: "17.0"
  xcodeVersion: "16.0"
settings:
  base:
    SWIFT_VERSION: "5.9"
    MARKETING_VERSION: "1.0.0"
    CURRENT_PROJECT_VERSION: "1"
packages:
  RevenueCat:
    url: https://github.com/RevenueCat/purchases-ios-spm.git
    from: 5.0.0
targets:
  <AppName>:
    type: application
    platform: iOS
    sources:
      - <AppName>
    resources:
      - <AppName>/Resources
    info:
      path: <AppName>/Resources/Info.plist
      properties:
        CFBundleDevelopmentRegion: $(DEVELOPMENT_LANGUAGE)
        CFBundleExecutable: $(EXECUTABLE_NAME)
        CFBundleIdentifier: $(PRODUCT_BUNDLE_IDENTIFIER)
        CFBundleInfoDictionaryVersion: "6.0"
        CFBundleName: $(PRODUCT_NAME)
        CFBundlePackageType: $(PRODUCT_BUNDLE_PACKAGE_TYPE)
        CFBundleShortVersionString: $(MARKETING_VERSION)
        CFBundleVersion: $(CURRENT_PROJECT_VERSION)
        ITSAppUsesNonExemptEncryption: false
        LSRequiresIPhoneOS: true
        UIApplicationSceneManifest:
          UIApplicationSupportsMultipleScenes: false
        UILaunchScreen: {}
        UISupportedInterfaceOrientations:
          - UIInterfaceOrientationPortrait
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.aniccafactory.<appname>
        CODE_SIGN_STYLE: Automatic
        DEVELOPMENT_TEAM: TM3HR9L4R6
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
    dependencies:
      - package: RevenueCat
        product: RevenueCat
  <AppName>Tests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - <AppName>Tests
    dependencies:
      - target: <AppName>
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.aniccafactory.<appname>.tests
        GENERATE_INFOPLIST_FILE: YES
        ENABLE_TESTABILITY: YES
```

### 1.3: SPM 設定ルール

Source: xcodegen ProjectSpec.md — Package Dependencies
> 「from: The minimum version of the package. e.g. 5.0.0」

Source: RevenueCat iOS Installation (https://www.revenuecat.com/docs/getting-started/installation/ios)
> 「You can also use our SPM-specific repository for faster package resolution: purchases-ios-spm.git」

| ルール | 値 | 根拠 |
|--------|-----|------|
| SPM URL | `purchases-ios-spm.git`（ミラー） | RC公式推奨。メインリポよりSPM解決が速い |
| バージョン構文 | `from: 5.0.0` | xcodegen 構文。`majorVersion:` は非推奨 |
| Configuration 制限 | Debug + Release のみ | SPM は custom configuration をサポートしない |

### 1.4: .gitignore に .xcodeproj を追加

Source: xcodegen README (https://github.com/yonaskolb/XcodeGen)
> 「The project can be generated on demand and not checked in to the source code repository.」

```bash
echo "*.xcodeproj/" >> .gitignore
```

### 1.5: ディレクトリ作成

**非インタラクティブシェルでは brace expansion `{A,B,C}` が動作しない。個別に mkdir する。**

```bash
cd <AppName>ios
mkdir -p <AppName>/App
mkdir -p <AppName>/Views
mkdir -p <AppName>/Models
mkdir -p <AppName>/Services
mkdir -p <AppName>/Resources/Assets.xcassets/AppIcon.appiconset
mkdir -p <AppName>Tests/Models
mkdir -p <AppName>Tests/Services
```

### 1.6: xcodegen 実行 + ビルド確認

```bash
cd <AppName>ios && xcodegen generate

# シミュレータ名を動的に検出（ハードコード禁止）
SIM_NAME=$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed 's/^ *//' | sed 's/ (.*//')
xcodebuild build -project <AppName>.xcodeproj -scheme <AppName> -destination "platform=iOS Simulator,name=$SIM_NAME" | tail -5
```

## Step 1b: IMPLEMENTATION_GUIDE.md に従う
docs/IMPLEMENTATION_GUIDE.md をそのまま実行。1 機能ずつ。

### Data Model ルール

Source: Apple Swift Codable (https://developer.apple.com/documentation/swift/codable)
> 「Codable is a type alias for the Encodable and Decodable protocols.」

| ルール | 値 |
|--------|-----|
| プロトコル | `Codable`（`Decodable` 単体ではなく） |
| ID | `Identifiable` 準拠 |
| JSON Key Mapping | `CodingKeys` enum で snake_case → camelCase |

### テストフレームワーク

Source: Apple Swift Testing (https://developer.apple.com/documentation/testing/)
> 「Swift Testing provides a modern, expressive testing API using macros like @Test and #expect.」

| フレームワーク | いつ使う |
|--------------|---------|
| **Swift Testing**（`@Test`, `#expect`） | Xcode 16+ の新規テスト（推奨） |
| XCTest（`XCTestCase`, `XCTAssert*`） | 既存テスト、Xcode 15以下 |

## Step 2: 自前 PaywallView（RevenueCatUI.PaywallView 禁止）

Source: Josh Holtz (RC DevRel) — https://gist.github.com/joshdholtz/48aa8be3d139381b5eee1c370f407fd8

パターン:
1. `let offering = try await Purchases.shared.offerings().current`
2. `ForEach(offering.availablePackages)` で商品ボタン表示
3. `try await Purchases.shared.purchase(package: package)` で購入
4. `customerInfo.entitlements.active["premium"]` でアンロック確認
5. `Purchases.shared.customerInfoStream` でリアルタイム反映

### Accessibility Identifiers（必須 5要素 — Maestro E2E 用）
paywall_plan_monthly / paywall_plan_yearly / paywall_cta / paywall_skip / paywall_restore

## PROHIBITED
- `import RevenueCatUI` 禁止
- `RevenueCatUI.PaywallView` 禁止
- Mock/Placeholder コード禁止
- 存在しない機能を Paywall コピーに書く禁止（Rule 11）
- **Mixpanel/Firebase Analytics/Amplitude 禁止** — Greenlight が CRITICAL 検出（ATT 必須になる）
- **AppTrackingTransparency 禁止** — Paywall スクショ撮影を妨害する
- **NSUserTrackingUsageDescription 禁止** — ATT と同じ
- **UserDefaults キー名 `hasCompletedOnboarding` を全アプリで統一**。オンボーディング完了フラグは必ずこのキー名を使う。US-008a のスクショキャプチャが依存
- **AI API / AI モデル / 外部 AI サービス禁止** — Rule 21（月額収益 $29 vs API コスト $300+。Apple FoundationModels も iOS 26+ のみでユーザーベース皆無）

## Mock ゼロ検証 (PATCH 9)
```bash
MOCK_COUNT=$(grep -r 'Mock' --include='*.swift' . | grep -v 'Tests/' | grep -v '.build/' | wc -l)
[ "$MOCK_COUNT" -eq 0 ] || { echo "FAIL: $MOCK_COUNT Mock references in production code"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Acceptance Criteria: Must Be Verifiable. Each criterion must be something Ralph can CHECK」

## Acceptance Criteria
- <AppName>ios/ directory exists with App/, Views/, Models/, Services/, Resources/
- xcodebuild build succeeds (simulator name dynamically detected)
- grep -r 'Mock' (excl Tests/) = 0
- grep -r 'import RevenueCat' > 0
- No RevenueCatUI imports
- PaywallView has 5 accessibilityIdentifiers
- AppIcon.appiconset contains 1024.png (1024x1024)
- AppIcon.appiconset/Contents.json uses `"idiom": "universal"` with single 1024x1024 image
- PrivacyInfo.xcprivacy contains CA92.1 reason code
- GENERATE_INFOPLIST_FILE: YES in test target settings
- No AI API / AI model imports (grep -rE 'OpenAI|Anthropic|GoogleGenerativeAI' = 0)

## Step 3: App Icon Generation (CRITICAL)

Source: Apple Human Interface Guidelines — App Icons (https://developer.apple.com/design/human-interface-guidelines/app-icons)
> "Provide a single 1024×1024 px image... Starting in Xcode 16, the default is a single-size app icon."

**Xcode 16+ のデフォルト: 単一 1024x1024 画像 + `"idiom": "universal"`。個別サイズ生成は不要。**

### 3.1: ソースアイコン作成
```bash
# PIL で 1024x1024 アイコン生成（アプリテーマに合わせた色とシンボル）
python3 << 'EOF'
from PIL import Image, ImageDraw

img = Image.new('RGBA', (1024, 1024), (30, 30, 60, 255))  # アプリテーマ色
draw = ImageDraw.Draw(img)
# アプリのシンボルを描画（例: 月、星、ハートなど）
img.save('1024.png')
EOF
```

### 3.2: Contents.json 生成（Xcode 16+ 単一サイズ方式）

Source: Apple Xcode 16 Release Notes
> "The default is a single-size app icon for all platforms."

```json
{
  "images": [
    {
      "filename": "1024.png",
      "idiom": "universal",
      "platform": "ios",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
}
```

### PROHIBITED
- 個別サイズ（icon-60@2x.png 等）の生成は不要（Xcode 16+ が自動リサイズ）
- `filename` フィールド省略禁止
- アイコンファイル生成しないで Contents.json だけ作る禁止

### 検証
```bash
# 必須ファイル存在チェック
ICON_DIR="Resources/Assets.xcassets/AppIcon.appiconset"
[ -f "$ICON_DIR/1024.png" ] || { echo "FAIL: missing 1024x1024 icon"; exit 1; }
grep -q '"filename"' "$ICON_DIR/Contents.json" || { echo "FAIL: Contents.json missing filename"; exit 1; }
grep -q '"universal"' "$ICON_DIR/Contents.json" || { echo "FAIL: must use universal idiom for Xcode 16+"; exit 1; }
echo "App Icon OK"
```
