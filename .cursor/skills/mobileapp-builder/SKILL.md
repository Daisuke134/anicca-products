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
| 6 | **availability set は pricing の前**。順序を逆にすると全pricing call が Apple 500エラーで失敗する |
| 7 | **Privacy Policy URL は en-US AND ja 両方必須**。片方だけでは submit 時にエラー |
| 8 | **RC Offerings は TestFlight 前に設定必須**。未設定だと「Apple IAP key is invalid」エラーで課金不可 |
| 9 | **locale は `ja`（`ja-JP` は無効）**。ASC API は `ja-JP` を拒否する |
| 10 | **IAP key は同一 Apple Developer アカウントで使い回し**。新規作成不要。`AuthKey_AY9BT5R8NU.p8` を流用 |

---

## 12 PHASES

### PHASE 1: VALIDATE INPUT
```
spec.md の必須フィールド確認（全項目 MUST — 1つでも欠ければ STOP）

■ 技術
  - app_name, bundle_id, version, output_dir

■ 課金
  - price_monthly_usd, price_annual_usd
  - paywall.cta_text_en, paywall.cta_text_ja

■ App Store メタデータ（EN + JA 両方必須）
  - metadata.title_en, metadata.title_ja
  - metadata.subtitle_en, metadata.subtitle_ja
  - metadata.description_en, metadata.description_ja
  - metadata.keywords_en, metadata.keywords_ja

■ URL（アプリ専用 URL 必須 — 全アプリ共通 URL 禁止）
  - urls.privacy_en   例: "https://aniccaai.com/thankful/privacy/en"
  - urls.privacy_ja   例: "https://aniccaai.com/thankful/privacy/ja"
  - urls.terms        固定値: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
  - urls.landing      例: "https://aniccaai.com/thankful"

■ ローカライズ方針
  - localization: "os_language"  （日本語OS→日本語、その他→英語）
  - supported_locales: ["en", "ja"]

■ コンセプト
  - concept  （1行説明。スクショヘッドライン生成に使う）

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

■ 必須実装（1つでも欠ければ PHASE 11 で STOP）

  コア機能:
  - spec の画面構成・コア機能を実装
  - 通知: UserNotifications で APNs 登録 + 通知カタログ
  - Paywall: RevenueCat SDK のみ（Superwall 禁止）
  - Paywall の accessibilityIdentifier（必須 5要素）:
      paywall_plan_monthly / paywall_plan_yearly
      paywall_cta / paywall_skip / paywall_restore

  ローカライズ（OS言語対応 — 必須）:
  - Localizable.strings を EN + JA 両方作成
  - 表示言語は OS 言語に自動追従（Locale.current で判定）
  - 日本語 OS → 日本語 UI、その他 OS → 英語 UI
  - Paywall コピーも EN/JA 両対応（spec.md の paywall.cta_text_en/ja を使う）
  - ハードコード日本語・英語テキスト禁止。全て Localizable.strings 経由

  Settings 画面（必須）:
  - Privacy Policy リンク → spec.md の urls.privacy_en / urls.privacy_ja（OS言語で切替）
  - Terms of Use リンク → spec.md の urls.terms（Apple 標準 EULA 固定）
    URL: https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
```

### PHASE 4: ASC APP SETUP
```bash
asc apps create --bundle-id "<bundle_id>" --name "<app_name>" \
  --primary-locale en-US --sku "<sku>"

# Privacy Policy URL を en-US AND ja 両方に設定（片方だけでは submit 時にエラー）
# locale は必ず "ja"（"ja-JP" は ASC で無効）
APP_INFO_ID=$(asc apps info list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

TOKEN=$(python3 -c "
import jwt,time,pathlib
key=pathlib.Path.home().joinpath('Downloads/AuthKey_D637C7RGFN.p8').read_text()
payload={'iss':'f53272d9-c12d-4d9d-811c-4eb658284e74','iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':'D637C7RGFN','typ':'JWT'}))
")

# en-US Privacy URL
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<EN_LOC_ID>" \
  -d '{"data":{"type":"appInfoLocalizations","id":"<EN_LOC_ID>","attributes":{"privacyPolicyUrl":"https://aniccaai.com/privacy"}}}'

# ja Privacy URL（locale = "ja" 確認必須）
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<JA_LOC_ID>" \
  -d '{"data":{"type":"appInfoLocalizations","id":"<JA_LOC_ID>","attributes":{"privacyPolicyUrl":"https://aniccaai.com/privacy"}}}'

asc subscriptions groups create --app "<APP_ID>" --reference-name "Premium"

asc subscriptions create --group "<GROUP_ID>" --name "Monthly" \
  --product-id "<bundle_id>.premium.monthly" --period ONE_MONTH --level 2

asc subscriptions create --group "<GROUP_ID>" --name "Annual" \
  --product-id "<bundle_id>.premium.yearly" --period ONE_YEAR --level 1

# ★ availability を pricing の前に必ず設定（これなしでpricingは全件Apple 500エラー）
asc subscriptions availability set --id "<MONTHLY_ID>" \
  --available-in-new-territories --territory USA,JPN

asc subscriptions availability set --id "<ANNUAL_ID>" \
  --available-in-new-territories --territory USA,JPN
```

### PHASE 4.5: RC OFFERINGS SETUP（TestFlight 前に必須）
```
RC Dashboard → Thankful プロジェクト
  → Offerings → New Offering → identifier: "default"
  → Packages を追加:
      $rc_annual  → Apple Product ID: <bundle_id>.premium.yearly
      $rc_monthly → Apple Product ID: <bundle_id>.premium.monthly
  → Offering を Current に設定

確認: Offerings が "current" に設定されていること
未設定 = TestFlight で「Apple IAP key is invalid」エラー

IAP Key: AY9BT5R8NU（同一 Apple Developer アカウントで全アプリ共通、新規作成不要）
p8 file: ~/Downloads/AuthKey_AY9BT5R8NU.p8 を RC にアップロード済みであること確認
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

#### Step 1: アイコン生成
```bash
# infsh FLUX で 1024×1024 生成（INFSH_API_KEY 使用）
INFSH_API_KEY="<INFSH_API_KEY>" infsh app run falai/flux-dev-lora --input '{
  "prompt": "<app_name> iOS app icon. Minimalist design. <concept_1_line>. Deep navy blue gradient background. No text. Square format. Premium, App Store ready.",
  "width": 1024,
  "height": 1024
}'
# → 出力 URL を curl でダウンロード → icon-1024.png として保存
```

#### Step 2: スクショ生成（screenshot-ab パイプライン — EN + JA）
```
screenshot-ab スキルの Step 3〜4 をそのまま実行する（A/Bテストではなく新規生成として）

[EN スクショ]
1. recursive-improver でヘッドライン生成（英語）
   入力: spec.md の concept + ペルソナ
   出力: screen1/2/3 の英語キャプション（採点 8/10 以上で確定）

2. screenshots.yaml に英語キャプションを書き込む

3. make generate-store-screenshots 実行
   → シミュレータで実画面撮影（asc-shots-pipeline / simctl + AXe）
   → extract_screenshots.py → raw/
   → PIL で 1290×2796 に合成 → processed/en/

4. visual-qa で採点 → 8/10 未満なら Step 1 からやり直し

[JA スクショ]
5. recursive-improver でヘッドライン生成（日本語）
   同じ concept + ペルソナで日本語コピー生成

6. screenshots.yaml に日本語キャプションを書き込む

7. make generate-store-screenshots 実行
   → 同じ実画面に日本語テキストを重ねて合成 → processed/ja/

8. visual-qa で採点 → 8/10 未満なら Step 5 からやり直し
```

#### Step 3: ASC アップロード（EN + JA）
```bash
# EN スクショ（locale: en-US）
asc screenshots upload --app-id "<APP_ID>" --locale en-US \
  --files processed/en/screen1.png processed/en/screen2.png processed/en/screen3.png

# JA スクショ（locale: ja）
asc screenshots upload --app-id "<APP_ID>" --locale ja \
  --files processed/ja/screen1.png processed/ja/screen2.png processed/ja/screen3.png
```

#### Step 4: App Store メタデータ入力
```bash
# EN メタデータ
asc metadata update --app "<APP_ID>" --locale en-US \
  --title "<metadata.title_en>" \
  --subtitle "<metadata.subtitle_en>" \
  --description "<metadata.description_en>" \
  --keywords "<metadata.keywords_en>"

# JA メタデータ（locale は必ず "ja"。"ja-JP" は無効）
asc metadata update --app "<APP_ID>" --locale ja \
  --title "<metadata.title_ja>" \
  --subtitle "<metadata.subtitle_ja>" \
  --description "<metadata.description_ja>" \
  --keywords "<metadata.keywords_ja>"
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
# GATE 1: Greenlight
greenlight preflight <app_dir>  # CRITICAL = 0 でなければ STOP

# GATE 2: IAP（D6-D10）
# D6: prices 175件 / D7: screenshot 存在 / D8: en-US localization
# D9: READY_TO_SUBMIT / D10: validate blocking=0
asc validate subscriptions --app "<APP_ID>"

# GATE 3: コード品質チェック（自動）
grep -r "Lorem\|lorem\|placeholder\|TODO\|FIXME" <app_dir>/Sources/ && echo "FAIL" || echo "PASS"

# GATE 4: 外部リンク生死確認（自動）
curl -I "<urls.privacy_en>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_en URL dead"
curl -I "<urls.privacy_ja>" -o /dev/null -s -w "%{http_code}" | grep -q "200\|301\|302" || echo "FAIL: privacy_ja URL dead"
curl -I "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" -o /dev/null -s -w "%{http_code}" | grep -q "200" || echo "FAIL: EULA URL dead"

# GATE 5: スクショ確認（自動）
asc screenshots list --app "<APP_ID>" --locale en-US | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: EN screenshots <3')"
asc screenshots list --app "<APP_ID>" --locale ja | python3 -c "import sys,json;d=json.load(sys.stdin);print('PASS' if len(d['data'])>=3 else 'FAIL: JA screenshots <3')"

# GATE 1〜5 全て PASS でなければ STOP。1つでも FAIL → 修正して再実行
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
