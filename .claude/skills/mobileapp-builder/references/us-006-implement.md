# US-006: iOS Implementation

Source: rshankras WORKFLOW.md Phase 4
> "Claude-Assisted Implementation — Ask Claude to implement specific components"

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/implementation-guide/SKILL.md` — rshankras
2. `.claude/skills/ios-ux-design/SKILL.md` — UI/UX デザイン
3. `.claude/skills/mobile-ios-design/SKILL.md` — SwiftUI コード参照

## Quality Gate (MANDATORY — US-005 の成果物検証)
```bash
# RC offerings + SPM が存在しないと Mock を作ってしまう
asc subscriptions groups list --app $APP_ID | grep -q "group" || { echo "GATE FAIL: no IAP groups"; exit 1; }
grep -q "RevenueCat" Package.swift || { echo "GATE FAIL: no RevenueCat in SPM"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Story Ordering: Dependencies First. Wrong order: UI component (depends on schema that does not exist yet)」

## Step 1: IMPLEMENTATION_GUIDE.md に従う
docs/IMPLEMENTATION_GUIDE.md をそのまま実行。1 機能ずつ。

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

## Mock ゼロ検証 (PATCH 9)
```bash
MOCK_COUNT=$(grep -r 'Mock' --include='*.swift' . | grep -v 'Tests/' | grep -v '.build/' | wc -l)
[ "$MOCK_COUNT" -eq 0 ] || { echo "FAIL: $MOCK_COUNT Mock references in production code"; exit 1; }
```
Source: snarktank/ralph SKILL.md
> 「Acceptance Criteria: Must Be Verifiable. Each criterion must be something Ralph can CHECK」

## Acceptance Criteria
- <AppName>ios/ directory exists with App/, Views/, Models/, Services/, Resources/
- xcodebuild build succeeds
- grep -r 'Mock' (excl Tests/) = 0
- grep -r 'import RevenueCat' > 0
- No RevenueCatUI imports
- PaywallView has 5 accessibilityIdentifiers
- AppIcon.appiconset contains icon-60@2x.png (120x120)
- AppIcon.appiconset/Contents.json has filename fields, no "universal" idiom

## Step 3: App Icon Generation (CRITICAL)

Source: Apple Human Interface Guidelines — App Icons
> "You need to provide a 1024×1024 px App Store icon and device-specific sizes"

AppIcon.appiconset には以下が **全て** 必須:

### 3.1: ソースアイコン作成
```bash
# PIL で 1024x1024 アイコン生成（アプリテーマに合わせた色とシンボル）
python3 << 'EOF'
from PIL import Image, ImageDraw

img = Image.new('RGBA', (1024, 1024), (30, 30, 60, 255))  # アプリテーマ色
draw = ImageDraw.Draw(img)
# アプリのシンボルを描画（例: 月、星、ハートなど）
img.save('icon-1024.png')
EOF
```

### 3.2: 全サイズ生成
```bash
python3 << 'EOF'
from PIL import Image

sizes = [
    (1024, '1024.png'),
    (180, 'icon-60@3x.png'),    # iPhone @3x
    (120, 'icon-60@2x.png'),    # iPhone @2x
    (87, 'icon-29@3x.png'),     # Settings @3x
    (80, 'icon-40@2x.png'),     # Spotlight @2x
    (76, 'icon-76.png'),        # iPad
    (167, 'icon-83.5@2x.png'),  # iPad Pro
    (60, 'icon-60.png'),        # iPhone
    (58, 'icon-29@2x.png'),     # Settings @2x
    (40, 'icon-40.png'),        # Spotlight
    (29, 'icon-29.png'),        # Settings
    (20, 'icon-20.png'),        # Notification
]

img = Image.open('icon-1024.png')
for size, name in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(name)
EOF
```

### 3.3: Contents.json 生成
```json
{
  "images": [
    {"filename": "icon-60@2x.png", "idiom": "iphone", "scale": "2x", "size": "60x60"},
    {"filename": "icon-60@3x.png", "idiom": "iphone", "scale": "3x", "size": "60x60"},
    {"filename": "icon-76.png", "idiom": "ipad", "scale": "1x", "size": "76x76"},
    {"filename": "icon-83.5@2x.png", "idiom": "ipad", "scale": "2x", "size": "83.5x83.5"},
    {"filename": "1024.png", "idiom": "ios-marketing", "scale": "1x", "size": "1024x1024"}
  ],
  "info": {"author": "xcode", "version": 1}
}
```

### PROHIBITED
- ⛔ `"idiom": "universal"` 禁止（altool が reject する）
- ⛔ `filename` フィールド省略禁止
- ⛔ アイコンファイル生成しないで Contents.json だけ作る禁止

### 検証
```bash
# 必須ファイル存在チェック
ICON_DIR="Resources/Assets.xcassets/AppIcon.appiconset"
[ -f "$ICON_DIR/icon-60@2x.png" ] || { echo "FAIL: missing 120x120 icon"; exit 1; }
[ -f "$ICON_DIR/1024.png" ] || { echo "FAIL: missing 1024x1024 icon"; exit 1; }
grep -q '"filename"' "$ICON_DIR/Contents.json" || { echo "FAIL: Contents.json missing filename"; exit 1; }
! grep -q '"universal"' "$ICON_DIR/Contents.json" || { echo "FAIL: universal idiom not allowed"; exit 1; }
```
