# US-005: Infrastructure (ASC + IAP + RC)

Source: rshankras WORKFLOW.md Phase 6 + rudrankriyam asc-* skills

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/privacy-policy/SKILL.md` — rshankras: Privacy Policy + Terms
2. `.claude/skills/asc-signing-setup/SKILL.md` — rudrankriyam: 証明書
3. `.claude/skills/asc-app-create-ui/SKILL.md` — rudrankriyam: ASC アプリ作成
4. `.claude/skills/asc-subscription-localization/SKILL.md` — rudrankriyam: IAP + locale
5. `.claude/skills/asc-ppp-pricing/SKILL.md` — rudrankriyam: 175カ国 pricing

## Quality Gate (MANDATORY — US-004 の成果物検証)
```bash
# 前 US の acceptance criteria を再検証。gate fails → この US を実行しない。
test -f docs/PRD.md || { echo "GATE FAIL: docs/PRD.md missing"; exit 1; }
test -f docs/ARCHITECTURE.md || { echo "GATE FAIL"; exit 1; }
test -f docs/IMPLEMENTATION_GUIDE.md || { echo "GATE FAIL"; exit 1; }
grep -q "bundle_id" docs/PRD.md || { echo "GATE FAIL: no bundle_id in PRD"; exit 1; }
```

## Step 1: Privacy Policy + Terms
- rshankras/legal/privacy-policy スキル
- Input: docs/PRD.md（データ収集情報）
- Output: privacy-policy.md, terms.md → GitHub Pages デプロイ

## Step 2: PrivacyInfo.xcprivacy (PATCH 7)
Source: Apple WWDC23 (https://developer.apple.com/videos/play/wwdc2023/10060/)
> 「Third-party SDK developers can include a privacy manifest by creating PrivacyInfo.xcprivacy」

```bash
cat > <AppName>ios/<AppName>/PrivacyInfo.xcprivacy << 'PRIVEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array/>
  <key>NSPrivacyAccessedAPITypes</key><array/>
</dict>
</plist>
PRIVEOF
```

## Step 3: ITSAppUsesNonExemptEncryption (PATCH 8)
Source: Apple Developer (https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption)
> 「A Boolean value indicating whether the app uses encryption」

```bash
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" <AppName>ios/<AppName>/Info.plist
```

## Step 4: Keychain Unlock (PATCH 3)
Source: 12-Factor App (https://12factor.net/config)
> 「stores config in environment variables」

```bash
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db
```
KEYCHAIN_PASSWORD is in `~/.config/mobileapp-builder/.env`


## Step 4.5: Bundle ID 登録（API Key認証 — 完全自動）

```bash
~/bin/asc bundle-ids create \
  --identifier "<bundle_id>" \
  --name "<app_name>" \
  --platform IOS --output json
```

**人間介入不要。** API Key認証で常に自動実行される。

## Step 5: ASC App Creation（~/bin/asc apps create — iris セッション）

### 5.1: アプリ作成（通常は完全自動）
```bash
APP_RESULT=$(~/bin/asc apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --platform IOS \
  --output json 2>&1)

if echo "$APP_RESULT" | jq -e '.data.id' > /dev/null 2>&1; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  echo "APP_ID=$APP_ID" >> .env
  echo "✅ ASC App created: $APP_ID"
else
  # iris セッション切れの場合のみ WAITING_FOR_HUMAN
  echo "WAITING_FOR_HUMAN: 2FA code needed"
  cat >> progress.txt << 'MSG'
⏸️ iris セッション切れ。
iPhone に届く 6 桁のコードを Slack で返信してください。
エージェントが --two-factor-code 付きで再実行します。
MSG
  exit 1
fi
```

### セッション管理
- セッションキャッシュ: `~/.asc/iris/`（ファイルベース）
- 通常運用: セッションが生きている限り **完全自動**（2FA不要）
- 有効期限: Apple サーバー側管理（定期使用で延長される）
- 期限切れ時のみ: Dais は Slack で 6桁コード返すだけ
- APP_ID は自動取得 → .env に自動書き込み → 次のステップへ自動続行

## Step 6: IAP Creation + Localization + Availability + Pricing

**順序が超重要！** availability → pricing の順。逆だと Apple API が 500 を返す。

### 6.1: サブスクリプショングループ作成
```bash
GROUP_ID=$(asc subscriptions groups create --app $APP_ID --ref-name "<AppName> Premium" 2>&1 | jq -r '.data.id')
```

### 6.2: サブスクリプション作成
```bash
MONTHLY_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Monthly" --product-id "com.anicca.<slug>.monthly" --period ONE_MONTH 2>&1 | jq -r '.data.id')
ANNUAL_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Annual" --product-id "com.anicca.<slug>.annual" --period ONE_YEAR 2>&1 | jq -r '.data.id')
```

### 6.3: ローカライゼーション追加
```bash
asc subscriptions localizations create --subscription-id $MONTHLY_ID --locale en-US --name "Monthly Premium" --description "Full access."
asc subscriptions localizations create --subscription-id $ANNUAL_ID --locale en-US --name "Annual Premium" --description "Full access. Save 50%."
```

### 6.4: availability 設定（pricing の前に必須！）
```bash
asc subscriptions availability set --id $MONTHLY_ID --territory "USA,CAN,GBR,DEU,FRA,JPN,AUS"
asc subscriptions availability set --id $ANNUAL_ID --territory "USA,CAN,GBR,DEU,FRA,JPN,AUS"
```

### 6.5: 価格設定（availability の後！）
Source: end.md Q2.B
> 「asc subscriptions prices add --id SUB_ID --price-point PP_ID --territory TER」

```bash
# 月額 $4.99 の price-point ID 取得
MONTHLY_PP=$(asc subscriptions price-points list --subscription-id $MONTHLY_ID 2>&1 | \
  jq -r '.data[] | select(.attributes.customerPrice == "4.99") | .id' | head -1)

# 年額 $29.99 の price-point ID 取得  
ANNUAL_PP=$(asc subscriptions price-points list --subscription-id $ANNUAL_ID 2>&1 | \
  jq -r '.data[] | select(.attributes.customerPrice == "29.99") | .id' | head -1)

# USA 基準で価格設定（equalizations で他国に自動展開）
asc subscriptions prices add --id $MONTHLY_ID --price-point "$MONTHLY_PP"
asc subscriptions prices add --id $ANNUAL_ID --price-point "$ANNUAL_PP"
```

### 6.6: 40ロケール一括ローカライズ
Source: end.md Q2.C
> 「asc subscriptions localizations create --subscription-id SUB_ID --locale xx --name "..."」

```bash
LOCALES="ar-SA ca cs da de-DE el en-AU en-CA en-GB en-US es-ES es-MX fi fr-CA fr-FR he hi hr hu id it ja ko ms nl-NL no pl pt-BR pt-PT ro ru sk sv th tr uk vi zh-Hans zh-Hant"

for locale in $LOCALES; do
  asc subscriptions localizations create --subscription-id $MONTHLY_ID --locale "$locale" --name "Monthly Premium" 2>/dev/null || true
  asc subscriptions localizations create --subscription-id $ANNUAL_ID --locale "$locale" --name "Annual Premium" 2>/dev/null || true
done
```


### 6.7: IAP Review Screenshot（必須！）

Source: submission-checklist.md D6-D7
> "Monthly: App Review Screenshot 添付済み"
> "Annual: App Review Screenshot 添付済み"

Source: Apple ASC API — Subscription Review Screenshots
https://developer.apple.com/documentation/appstoreconnectapi/subscription_review_screenshots
> "A screenshot to submit with the subscription for App Review."

```bash
# シミュレーターで Paywall 画面を開いた状態でスクリーンショット撮影
xcrun simctl io booted screenshot /tmp/paywall-review.png

# 両サブスクリプションに添付
asc subscriptions review-screenshots create \
  --subscription-id $MONTHLY_ID \
  --file /tmp/paywall-review.png

asc subscriptions review-screenshots create \
  --subscription-id $ANNUAL_ID \
  --file /tmp/paywall-review.png

# 確認
asc subscriptions app-store-review-screenshot get --subscription-id $MONTHLY_ID
asc subscriptions app-store-review-screenshot get --subscription-id $ANNUAL_ID
```

### PROHIBITED
- ⛔ Review Screenshot なしで US-005 を passes:true にするな
- ⛔ `asc subscriptions images create` を使うな（プロモーショナル画像用、間違い）

## Step 7: RC Setup

### 7.1: RC プロジェクト作成（人間介入 — URLを返すだけ）
CC は progress.txt に以下を書いて WAITING_FOR_HUMAN:
```
WAITING_FOR_HUMAN: RC Project Creation
📱 RC プロジェクト作成（1分）:
1. https://app.revenuecat.com → + Create new project
2. プロジェクト名: <app_name>
3. + App → App Store → Bundle ID: <bundle_id>
4. プロジェクトURLを Slack で返信
   例: https://app.revenuecat.com/projects/976e8639/overview

それだけでOK。Offering/Package作成はMCPで自動実行します。
```

### 7.2: RC Offering 作成（MCP 自動）
Source: end.md Q2.A
> 「RC_create_offering → RC_create_package → RC_attach_products_to_package」

Dais が URL を返信したら:
```bash
# URL から project_id 抽出
RC_URL="<received_url>"
RC_PROJECT_ID="proj$(echo $RC_URL | grep -oE '[a-f0-9]{8}' | head -1)"

# MCP 経由で Offering 作成
# STEP 1: Offering 作成
mcp_call RC_create_offering '{
  "project_id": "'$RC_PROJECT_ID'",
  "lookup_key": "'$APP_SLUG'_default",
  "display_name": "'$APP_NAME' Default"
}'

# STEP 2: Monthly Package 作成
mcp_call RC_create_package '{
  "project_id": "'$RC_PROJECT_ID'",
  "offering_id": "'$OFFERING_ID'",
  "lookup_key": "$rc_monthly",
  "display_name": "Monthly"
}'

# STEP 3: Annual Package 作成
mcp_call RC_create_package '{
  "project_id": "'$RC_PROJECT_ID'",
  "offering_id": "'$OFFERING_ID'",
  "lookup_key": "$rc_annual",
  "display_name": "Annual"
}'

# STEP 4: Product 紐付け
mcp_call RC_attach_products_to_package '{
  "project_id": "'$RC_PROJECT_ID'",
  "package_id": "'$MONTHLY_PKG_ID'",
  "products": [{"product_id": "'$BUNDLE_ID'.monthly", "eligibility_criteria": "all"}]
}'

mcp_call RC_attach_products_to_package '{
  "project_id": "'$RC_PROJECT_ID'",
  "package_id": "'$ANNUAL_PKG_ID'",
  "products": [{"product_id": "'$BUNDLE_ID'.annual", "eligibility_criteria": "all"}]
}'
```

URL から project_id を抽出したら:
- `.env` に RC_PROJECT_ID を書く（MCP が Offering/Package を自動作成）
- SPM dependency: RevenueCat + (RevenueCatUI は禁止)

## Step 8: SPM + Info.plist
- Package.swift に RevenueCat SDK 追加
- Info.plist に RC public key + Mixpanel token 追加

## Acceptance Criteria
- privacy-policy.md exists and deployed to GitHub Pages
- App created in ASC (APP_ID in progress.txt)
- asc subscriptions groups list --app $APP_ID returns 1+ groups
- asc subscriptions list --group $GROUP_ID returns monthly + annual
- RC dashboard shows 2 products + 1 offering
- SPM dependency on RevenueCat added (NOT RevenueCatUI)
- PrivacyInfo.xcprivacy exists
- Info.plist contains ITSAppUsesNonExemptEncryption = NO
