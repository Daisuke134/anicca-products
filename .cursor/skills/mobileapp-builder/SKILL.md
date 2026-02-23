---
name: mobileapp-builder
description: Builds and ships a Swift/SwiftUI iOS app to the App Store from a spec.md file. Handles all 12 phases autonomously: Xcode scaffold → SwiftUI implementation → ASC subscription setup (175-territory pricing, localizations, review screenshots) → app assets → preflight gate → submission. Use when given a spec.md and told to build and ship an app, or when triggered by app-factory cron.
---

# mobileapp-builder

Given a `spec.md`, autonomously build and ship a Swift/SwiftUI iOS app to the App Store.

**Full spec:** `.cursor/plans/ios/1.6.3/mobileapp-builder-spec.md`

---

## INPUT

```
spec.md path (required fields: app_name, bundle_id, version, price_monthly_usd,
price_annual_usd, output_dir, concept, screens, paywall, metadata)
```

See `references/spec-template.md` for the full spec.md format.

---

## OUTPUT

`asc review submissions-list` → state = `WAITING_FOR_REVIEW`

---

## CRITICAL RULES (違反 = リジェクト確定)

| # | ルール |
|---|--------|
| 1 | **提出前に全サブスクが READY_TO_SUBMIT**。MISSING_METADATA のまま提出 → Guideline 2.1 拒否 |
| 2 | **IAP pricing は全175カ国**。US のみは Guideline 2.1 拒否 |
| 3 | **Superwall 使用禁止**。RevenueCat のみ |
| 4 | **xcodebuild 直接実行禁止**。Fastlane のみ |
| 5 | **PHASE 8 が STOP ゲート**。blocking=0 + READY_TO_SUBMIT でなければ絶対に次に進まない |

---

## 12 PHASES

### PHASE 1: VALIDATE INPUT
```
spec.md の必須フィールド確認
  - app_name, bundle_id, version, price_monthly_usd, price_annual_usd
  - output_dir, concept, paywall.cta_text, metadata.title_en
欠けていれば STOP + 不足フィールドを報告
```

### PHASE 2: SCAFFOLD
```bash
# 新規 Xcode プロジェクトを output_dir に作成
mkdir -p <output_dir>/<app_name>ios
# Bundle ID / バージョン / チーム ID を project.pbxproj に設定
# RevenueCat SDK を SPM で追加
# PrivacyInfo.xcprivacy を追加（必須）
```

### PHASE 3: BUILD
```
ralph-autonomous-dev で SwiftUI 実装
  - spec の画面構成・コア機能を実装
  - 通知: UserNotifications で APNs 登録 + 通知カタログ
  - Paywall: RevenueCat SDK のみ（Superwall 禁止）
  - Paywall の accessibilityIdentifier（必須 5要素）:
      paywall_plan_monthly / paywall_plan_yearly
      paywall_cta / paywall_skip / paywall_restore
  - Settings 画面: Privacy Policy リンク必須
```

### PHASE 4: ASC APP SETUP
```bash
asc apps create --bundle-id "<bundle_id>" --name "<app_name>" \
  --primary-locale en-US --sku "<sku>"

asc subscriptions groups create --app "<APP_ID>" --reference-name "Premium"

asc subscriptions create --group "<GROUP_ID>" --name "Monthly" \
  --product-id "<bundle_id>.premium.monthly" --period ONE_MONTH --level 1

asc subscriptions create --group "<GROUP_ID>" --name "Annual" \
  --product-id "<bundle_id>.premium.yearly" --period ONE_YEAR --level 2
```

### PHASE 5: IAP PRICING ★最重要
```bash
# US 価格ポイント ID を取得してから scripts/add_prices.py を実行
python3 .claude/skills/mobileapp-builder/scripts/add_prices.py \
  --annual-sub "<ANNUAL_ID>" \
  --annual-pp "<ANNUAL_US_PP_ID>" \
  --monthly-sub "<MONTHLY_ID>" \
  --monthly-pp "<MONTHLY_US_PP_ID>"

# 確認（175 でなければ STOP）
asc subscriptions prices list --id "<MONTHLY_ID>" --paginate | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d['data']))"
```

詳細手順 → `references/iap-bible.md` の「価格ポイント ID の取得方法」

### PHASE 6: IAP LOCALIZATION
```bash
asc subscriptions localizations create --subscription-id "<MONTHLY_ID>" \
  --locale "en-US" --name "<app_name> Monthly" \
  --description "Unlock all features with monthly subscription."

asc subscriptions localizations create --subscription-id "<MONTHLY_ID>" \
  --locale "ja" --name "<app_name> 月額プラン" \
  --description "月額プランで全機能を解放します。"

# Annual も同様（en-US + ja）
```

### PHASE 7: IAP REVIEW SCREENSHOT
```bash
# asc-shots-pipeline でペイウォール画面を撮影
# simctl 起動 → AXe で Paywall 画面まで操作 → RAWスクショ → paywall-review.png

# 1. シミュレータ起動 + アプリインストール・起動
xcrun simctl boot "<UDID>" || true
xcrun simctl install "<UDID>" "<APP_PATH>"
xcrun simctl launch "<UDID>" "<BUNDLE_ID>"

# 2. AXe で Paywall 画面まで操作してスクショ撮影
axe describe-ui --udid "<UDID>"   # UI 確認
axe tap --id "paywall_cta" --udid "<UDID>"  # または onboarding を進める
axe screenshot --output "./paywall-review.png" --udid "<UDID>"

# 3. Monthly + Annual それぞれにアップロード
asc subscriptions review-screenshots create \
  --subscription-id "<MONTHLY_ID>" --file "./paywall-review.png"

asc subscriptions review-screenshots create \
  --subscription-id "<ANNUAL_ID>" --file "./paywall-review.png"
# "already exists" エラー = 正常（既にアップロード済み）
```

### PHASE 8: IAP VALIDATE ★STOP GATE
```bash
# blocking=0 確認
asc validate subscriptions --app "<APP_ID>"
# blocking > 0 なら PHASE 5-7 に戻る

# READY_TO_SUBMIT 確認（両方必須）
asc subscriptions get --id "<MONTHLY_ID>"  # state = READY_TO_SUBMIT ?
asc subscriptions get --id "<ANNUAL_ID>"   # state = READY_TO_SUBMIT ?
# どちらかが MISSING_METADATA なら絶対に次に進まない
```

### PHASE 9: APP ASSETS
```bash
# アイコン（1024×1024）: infsh FLUX で生成（INFSH_API_KEY 使用）
INFSH_API_KEY="<INFSH_API_KEY>" infsh app run falai/flux-dev-lora --input '{
  "prompt": "<app_name> iOS app icon. Minimalist design. <concept_1_line>. Deep navy blue gradient background. No text. Square format. Premium, App Store ready.",
  "width": 1024,
  "height": 1024
}'
# → 出力 URL を curl でダウンロード → icon-1024.png として保存

# スクショ3枚（1290×2796）: asc-shots-pipeline で実画面撮影 → PIL でテキスト重ね

# Step 1: asc-shots-pipeline で実画面 RAW スクショ撮影（3画面）
xcrun simctl launch "<UDID>" "<BUNDLE_ID>"
axe screenshot --output "./screenshots/raw/screen1.png" --udid "<UDID>"  # メイン画面
# AXe で各画面に移動して screen2.png, screen3.png も撮影

# Step 2: PIL で marketing テキストを重ねて 1290×2796 に合成
# フォント: /System/Library/Fonts/ヒラギノ角ゴシック W6.ttc（日本語）
# フォント: /System/Library/Fonts/SFNS.ttf（英語）
# 1枚目: benefit（ペイン直撃コピー）+ screen1.png
# 2枚目: social proof + screen2.png
# 3枚目: core flow（screen3.png のみ）
# 背景: Deep navy (#0A0F28 → #1E3250 グラデーション)
# アクセント: Gold (#FFC107)

# メタデータ: asc localizations upload で EN + JA
```

### PHASE 10: BUILD & UPLOAD
```bash
cd <output_dir>/<app_name>ios
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane set_version version:<version>
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane release
# processingState = VALID になるまで待機
```

### PHASE 11: PREFLIGHT GATE
```bash
# GATE 1
greenlight preflight <app_dir>  # CRITICAL = 0 でなければ STOP

# GATE 2（references/submission-checklist.md の D6-D10 全件確認）
# D6: prices 175件 / D7: screenshot 存在 / D8: en-US localization
# D9: READY_TO_SUBMIT / D10: validate blocking=0
```

### PHASE 12: SUBMIT
```bash
VERSION_ID=$(asc versions list --app "<APP_ID>" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

BUILD_ID=$(asc builds list --app "<APP_ID>" --sort -uploadedDate --limit 1 | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

asc submit create --app "<APP_ID>" \
  --version-id "$VERSION_ID" --build "$BUILD_ID" --confirm

# 確認: state = WAITING_FOR_REVIEW ✅
asc review submissions-list --app "<APP_ID>"
```

---

## 参照ファイル

| ファイル | いつ読む |
|---------|---------|
| `references/iap-bible.md` | PHASE 4-8 の詳細手順・価格ポイント取得方法 |
| `references/spec-template.md` | PHASE 1 の INPUT 確認 |
| `references/submission-checklist.md` | PHASE 11 のゲートチェック全項目 |
| `scripts/add_prices.py` | PHASE 5 の価格設定実行 |
