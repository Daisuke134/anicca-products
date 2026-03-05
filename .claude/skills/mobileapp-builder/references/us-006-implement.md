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
    echo "✅ GREENLIT — zero CRITICAL findings"
    break
  fi

  echo "❌ CRITICAL=$GL_CRITICAL — fixing issues..."

  # Greenlight の出力を読んで CRITICAL を修正
  # 修正後、このループの先頭に戻る
done
```

### PROHIBITED
- ⛔ CRITICAL > 0 で passes:true にするな
- ⛔ 「後で直す」でスキップするな
- ⛔ 1 回だけ実行して終わりにするな

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/implementation-guide/SKILL.md` — rshankras
2. `.claude/skills/ios-ux-design/SKILL.md` — UI/UX デザイン（HIG + SwiftUI パターン統合。これ1つでUI全般カバー）

## Quality Gate (MANDATORY — US-005b の成果物検証)

Source: snarktank/ralph SKILL.md
> 「Story Ordering: Dependencies First. Wrong order: UI component (depends on schema that does not exist yet)」

```bash
# xcodegen プロジェクトでは Package.swift は存在しない → project.yml を検証する
grep -q "RevenueCat" <AppName>ios/project.yml || { echo "GATE FAIL: no RevenueCat in project.yml"; exit 1; }

# ASC に IAP が存在するか（US-005b で作成済み）
source ~/.config/mobileapp-builder/.env
export ASC_BYPASS_KEYCHAIN=true
asc subscriptions groups list --app $APP_ID | grep -q "group" || { echo "GATE FAIL: no IAP groups"; exit 1; }
```

## Step 0.5: PrivacyInfo.xcprivacy + ITSAppUsesNonExemptEncryption（US-005a から延期）

> ⚠️ **US-005a で延期された必須タスク。iOS プロジェクト作成直後に実行すること。**

### 0.5.1: PrivacyInfo.xcprivacy 追加

Source: Apple WWDC23 (https://developer.apple.com/videos/play/wwdc2023/10060/)
> 「Third-party SDK developers can include a privacy manifest by creating PrivacyInfo.xcprivacy」

**🔴 UserDefaults を使う場合（ほぼ全アプリ該当）、CA92.1 理由コードが必須。**
Source: Apple Privacy Manifest (https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api)
> 「NSPrivacyAccessedAPICategoryUserDefaults — CA92.1: access info from same app or app group」

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

**xcodegen の `info:` ブロックに含める（Step 1 参照）。手動 PlistBuddy は不要。**

### 検証
```bash
[ -f "<AppName>ios/<AppName>/PrivacyInfo.xcprivacy" ] || { echo "FAIL: PrivacyInfo.xcprivacy missing"; exit 1; }
grep -q "CA92.1" "<AppName>ios/<AppName>/PrivacyInfo.xcprivacy" || { echo "FAIL: CA92.1 reason missing"; exit 1; }
echo "✅ Privacy + Encryption OK"
```

## Step 1: project.yml テンプレート（xcodegen — IMPLEMENTATION_GUIDE の前に適用）

Source: XcodeGen ProjectSpec.md (https://github.com/yonaskolb/XcodeGen/blob/master/Docs/ProjectSpec.md)
> 「The following properties are generated automatically if appropriate」

Source: XcodeGen Usage.md (https://github.com/yonaskolb/XcodeGen/blob/master/Docs/Usage.md)
> 「Swift Packages don't work in projects with configurations other than Debug and Release」

### 1.1: Deployment Target 決定マトリックス

Source: Apple Migration Guide (https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro)
> 「iOS 17.0+, iPadOS 17.0+, macOS 14.0+」

| IMPLEMENTATION_GUIDE の状態観察パターン | 必要な iOS バージョン | 理由 |
|----------------------------------------|---------------------|------|
| `@Observable` マクロ使用 | **iOS 17.0+**（MUST） | Observation framework は iOS 17 から |
| `ObservableObject` + `@Published` | iOS 15.0+ 可 | 旧パターンだが安定 |

**🔴 IMPLEMENTATION_GUIDE を読み、`@Observable` が使われていれば iOS 17.0+。それ以外は iOS 15.0+。**

### 1.2: project.yml テンプレート

```yaml
name: <AppName>
options:
  bundleIdPrefix: com.aniccafactory
  deploymentTarget:
    iOS: "17.0"  # @Observable 使用時。ObservableObject なら "15.0"
  xcodeVersion: "16.0"
  # 🔴 SPM は Debug/Release のみ対応。カスタム config 追加禁止
settings:
  base:
    SWIFT_VERSION: "5.9"
    MARKETING_VERSION: "1.0.0"
    CURRENT_PROJECT_VERSION: "1"
packages:
  RevenueCat:
    url: https://github.com/RevenueCat/purchases-ios-spm.git  # SPM ミラー（高速）
    from: 5.0.0  # 🔴 majorVersion ではなく from: を使う
targets:
  <AppName>:
    type: application
    platform: iOS
    sources:
      - <AppName>
    resources:
      - <AppName>/Resources
    info:
      # 🔴 info: ブロックで Info.plist を自動生成。手動 Info.plist 不要
      path: <AppName>/Resources/Info.plist
      properties:
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
        GENERATE_INFOPLIST_FILE: YES  # 🔴 テストターゲットに必須
```

Source: RevenueCat Package.swift (https://github.com/RevenueCat/purchases-ios/blob/main/Package.swift)
> 「.iOS(.v13)」— RC SDK は iOS 13+ 対応。deployment target は RC ではなく SwiftUI API で決まる

### 1.3: .gitignore に .xcodeproj を追加

Source: XcodeGen README (https://github.com/yonaskolb/XcodeGen)
> 「You can remove your .xcodeproj from git, which means no more merge conflicts!」

```bash
echo "*.xcodeproj" >> <AppName>ios/.gitignore
```

### 1.4: ディレクトリ作成（brace expansion 禁止）

**🔴 非インタラクティブシェルでは `{A,B,C}` brace expansion が動かない。個別に作成する。**

```bash
cd <AppName>ios
mkdir -p <AppName>/App
mkdir -p <AppName>/Views
mkdir -p <AppName>/Models
mkdir -p <AppName>/Services
mkdir -p <AppName>/Resources
mkdir -p <AppName>Tests/Models
mkdir -p <AppName>Tests/Services
```

### 1.5: xcodegen 実行

```bash
cd <AppName>ios && xcodegen generate
```

## Step 1.5: IMPLEMENTATION_GUIDE.md に従う

docs/IMPLEMENTATION_GUIDE.md をそのまま実行。1 機能ずつ。

### データモデル型安全ルール（IMPLEMENTATION_GUIDE の型を修正する場面）

**🔴 IMPLEMENTATION_GUIDE のモデルに以下の型が含まれていたら修正してから実装する:**

| 問題の型 | 修正後 | 理由 |
|---------|--------|------|
| `[Date: Int]`（Dictionary キー） | `[String: Int]`（ISO8601 文字列） | Date は Hashable だが JSON キー非対応 |
| `DateComponents` | `Int`（時:分を分に変換） | DateComponents は Codable 非準拠 |
| `Date` フィールド | `String`（ISO8601） | JSON シリアライズの安定性 |

Source: Swift Codable Best Practices
> モデルは JSON シリアライズ可能な型のみ使う: String, Int, Bool, Double, [T], [String: T]

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
- ⛔ `import RevenueCatUI` 禁止
- ⛔ `RevenueCatUI.PaywallView` 禁止
- ⛔ Mock/Placeholder コード禁止
- ⛔ 存在しない機能を Paywall コピーに書く禁止（Rule 11）
- ⛔ **Mixpanel/Firebase Analytics/Amplitude 禁止** — Greenlight が CRITICAL 検出（ATT 必須になる）
- ⛔ **AppTrackingTransparency 禁止** — Paywall スクショ撮影を妨害する
- ⛔ **NSUserTrackingUsageDescription 禁止** — ATT と同じ
- ⛔ **UserDefaults キー名 `hasCompletedOnboarding` を全アプリで統一**。オンボーディング完了フラグは必ずこのキー名を使う。US-008a のスクショキャプチャが依存
- ⛔ **AI API / 外部 API コスト禁止（Rule 21）** — OpenAI, Anthropic, Gemini, Apple FoundationModels 一切禁止。アプリは完全自己完結。ローカル・静的コンテンツのみ

## Mock ゼロ検証 (PATCH 9)
```bash
MOCK_COUNT=$(grep -r 'Mock' --include='*.swift' . | grep -v 'Tests/' | grep -v '.build/' | wc -l)
[ "$MOCK_COUNT" -eq 0 ] || { echo "FAIL: $MOCK_COUNT Mock references in production code"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Acceptance Criteria: Must Be Verifiable. Each criterion must be something Ralph can CHECK」

## Step 3: App Icon Generation (CRITICAL)

Source: Apple Human Interface Guidelines — App Icons (https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
> 「iOS apps can auto-generate all icon variations from a single 1024×1024 pixel image. This is the default behavior.」

**🔴 Xcode 16+ は単一 1024x1024 画像がデフォルト。個別サイズ生成は不要。**

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

### 3.2: Contents.json（Xcode 16+ 単一画像方式）
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
- ⛔ 個別サイズ（icon-60@2x.png 等）を手動生成するな — Xcode が自動生成する
- ⛔ `"idiom": "iphone"`, `"idiom": "ipad"` 等の個別指定禁止 — `"universal"` を使う
- ⛔ `filename` フィールド省略禁止
- ⛔ アイコンファイル生成しないで Contents.json だけ作る禁止

### 検証
```bash
ICON_DIR="Resources/Assets.xcassets/AppIcon.appiconset"
[ -f "$ICON_DIR/1024.png" ] || { echo "FAIL: missing 1024x1024 icon"; exit 1; }
grep -q '"universal"' "$ICON_DIR/Contents.json" || { echo "FAIL: must use universal idiom"; exit 1; }
grep -q '"filename"' "$ICON_DIR/Contents.json" || { echo "FAIL: Contents.json missing filename"; exit 1; }
echo "✅ AppIcon OK (single 1024x1024, universal idiom)"
```

## Step 4: テスト実行

### テストフレームワーク選択

Source: Apple Developer (https://developer.apple.com/documentation/xcode/adding-tests-to-your-xcode-project)
> 「Swift Testing, a newer, modern testing framework」
> 「Xcode 16 and later support Swift Testing」

**🔴 新規テストは Swift Testing（`@Test` / `#expect`）を推奨。XCTest も許容。**

```swift
// Swift Testing（推奨）
import Testing

@Test func testDecodeFromJSON() throws {
    let json = """{"id":"test","name":"Test"}""".data(using: .utf8)!
    let result = try JSONDecoder().decode(Model.self, from: json)
    #expect(result.id == "test")
}

// XCTest（許容）
import XCTest
@testable import AppName

final class ModelTests: XCTestCase {
    func testDecode() throws {
        // Arrange-Act-Assert パターン必須
    }
}
```

### シミュレータ動的検出

**🔴 シミュレータ名をハードコードするな。Xcode バージョンで利用可能デバイスが変わる。**

```bash
# 利用可能な iPhone シミュレータを動的に取得
SIMULATOR=$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed 's/^[[:space:]]*//' | sed 's/ (.*//')
echo "Using simulator: $SIMULATOR"
```

### ビルド & テスト（xcodegen プロジェクト）

```bash
cd <AppName>ios

# xcodegen でプロジェクト再生成（project.yml 変更後に必要）
xcodegen generate

# ビルド（シミュレータ向け）
xcodebuild build \
  -project <AppName>.xcodeproj \
  -scheme <AppName> \
  -destination "platform=iOS Simulator,name=$SIMULATOR" \
  CODE_SIGNING_ALLOWED=NO

# テスト
xcodebuild test \
  -project <AppName>.xcodeproj \
  -scheme <AppName>Tests \
  -destination "platform=iOS Simulator,name=$SIMULATOR" \
  CODE_SIGNING_ALLOWED=NO
```

## Acceptance Criteria

| # | 基準 | 検証コマンド |
|---|------|-------------|
| 1 | `<AppName>ios/` に App/, Views/, Models/, Services/, Resources/ がある | `ls <AppName>ios/<AppName>/` |
| 2 | xcodebuild build が成功する | 上記 Step 4 参照 |
| 3 | grep -r 'Mock' (excl Tests/) = 0 | Mock ゼロ検証参照 |
| 4 | grep -r 'import RevenueCat' > 0 | `grep -r 'import RevenueCat' --include='*.swift' .` |
| 5 | RevenueCatUI imports なし | `grep -r 'RevenueCatUI' --include='*.swift' . | wc -l` = 0 |
| 6 | PaywallView に 5 accessibilityIdentifiers | `grep -c 'accessibilityIdentifier' <AppName>ios/<AppName>/Views/PaywallView.swift` >= 5 |
| 7 | AppIcon: 1024.png 存在 + universal idiom | Step 3 検証参照 |
| 8 | PrivacyInfo.xcprivacy に CA92.1 が含まれる | `grep -q "CA92.1" <AppName>ios/<AppName>/PrivacyInfo.xcprivacy` |
| 9 | AI API / 外部 API の import なし（Rule 21） | `grep -rE 'import (OpenAI|GoogleGenerativeAI|Anthropic)' --include='*.swift' . | wc -l` = 0 |
