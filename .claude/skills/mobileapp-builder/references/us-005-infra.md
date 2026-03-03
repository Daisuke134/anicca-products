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

## Step 5: ASC App Creation（~/bin/asc apps create — Apple ID 認証）

### 5.0: Bundle ID 存在確認（前提チェック）
```bash
# Bundle ID が Step 4.5 で登録済みか確認（未登録だと apps create が 500 エラーで死ぬ）
asc bundle-ids list --output json 2>&1 | jq -e --arg bid "<bundle_id>" '.data[] | select(.attributes.identifier == $bid) | .id' > /dev/null 2>&1 || {
  echo "❌ Bundle ID <bundle_id> not registered. Run Step 4.5 first."
  exit 1
}
echo "✅ Bundle ID confirmed"
```

### 5.1: アプリ作成（完全自動 — 2FA 不要）
```bash
APP_RESULT=$(ASC_WEB_PASSWORD="$APPLE_ID_PASSWORD" ~/bin/asc apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --platform IOS \
  --apple-id "$APPLE_ID" \
  --output json 2>&1)

if echo "$APP_RESULT" | jq -e '.data.id' > /dev/null 2>&1; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  echo "APP_ID=$APP_ID" >> .env
  echo "✅ ASC App created: $APP_ID"
else
  echo "❌ apps create failed:"
  echo "$APP_RESULT"
  exit 1
fi
```

**2FA は不要。** `--apple-id` + `ASC_WEB_PASSWORD` 環境変数で完全自動認証される（2026-03-04 実証済み）。
セッションキャッシュ: `~/.asc/iris/`（ファイルベース、自動管理）。

## Step 6: IAP Creation + Localization + Availability + Pricing

**順序が超重要！** availability → pricing の順。逆だと Apple API が 500 を返す。

### 6.1: サブスクリプショングループ作成
```bash
GROUP_ID=$(asc subscriptions groups create --app $APP_ID --reference-name "<AppName> Premium" 2>&1 | jq -r '.data.id')
```

### 6.2: サブスクリプション作成
```bash
MONTHLY_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Monthly" --product-id "com.anicca.<slug>.monthly" --subscription-period ONE_MONTH 2>&1 | jq -r '.data.id')
ANNUAL_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Annual" --product-id "com.anicca.<slug>.annual" --subscription-period ONE_YEAR 2>&1 | jq -r '.data.id')
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
# USA 基準で価格設定（--price フラグで直接指定、equalizations で他国に自動展開）
asc subscriptions prices add --id $MONTHLY_ID --price "4.99" --territory "USA"
asc subscriptions prices add --id $ANNUAL_ID --price "29.99" --territory "USA"
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

## Step 7: RC Setup（RevenueCat API v2 — 全自動）

### 7.0: 人間に依頼（WAITING_FOR_HUMAN）

CC は Slack で以下を送信:
```
WAITING_FOR_HUMAN: RC Setup
📱 RevenueCat セットアップをお願いします（2分）:
1. https://app.revenuecat.com → 「+ Create new project」 → プロジェクト名: <app_name>
2. 作成したプロジェクトの Settings → API Keys → 「+ New secret API key」
3. 権限を全て「Read & Write」に設定 → Generate
4. 生成された sk_... キーをこのチャットに貼り付けてください

それだけでOKです。残りは全て自動で行います。
```

### 7.1: SK Key 受信 → 変数準備

```bash
RC_SECRET_KEY="<Slackで受信した sk_... キー>"
BUNDLE_ID="com.anicca.<slug>"
APP_NAME="<app_name>"
APP_SLUG="<slug>"
APP_DIR="mobile-apps/<app_dir>"

RC_PROJECT_ID=$(curl -s "https://api.revenuecat.com/v2/projects" \
  -H "Authorization: Bearer $RC_SECRET_KEY" | jq -r '.items[0].id')
```

### 7.2: App Store アプリ追加

```bash
RC_APP_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/apps" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"'"$APP_NAME"'","type":"app_store","app_store":{"bundle_id":"'"$BUNDLE_ID"'"}}' | jq -r '.id')
```

### 7.3: Offering 作成

```bash
OFFERING_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/offerings" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lookup_key":"'"${APP_SLUG}_default"'","display_name":"'"$APP_NAME"' Default"}' | jq -r '.id')
```

### 7.4: Packages 作成

```bash
MONTHLY_PKG_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/offerings/$OFFERING_ID/packages" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lookup_key":"$rc_monthly","display_name":"Monthly","position":1}' | jq -r '.id')

ANNUAL_PKG_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/offerings/$OFFERING_ID/packages" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lookup_key":"$rc_annual","display_name":"Annual","position":2}' | jq -r '.id')
```

### 7.5: Products 作成

```bash
MONTHLY_PROD_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/products" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"store_identifier":"'"$BUNDLE_ID"'.monthly","app_id":"'"$RC_APP_ID"'","type":"subscription","display_name":"Monthly Premium"}' | jq -r '.id')

ANNUAL_PROD_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/products" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"store_identifier":"'"$BUNDLE_ID"'.annual","app_id":"'"$RC_APP_ID"'","type":"subscription","display_name":"Annual Premium"}' | jq -r '.id')
```

### 7.6: Products → Packages 紐付け

```bash
curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/packages/$MONTHLY_PKG_ID/actions/attach_products" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"products":[{"product_id":"'"$MONTHLY_PROD_ID"'","eligibility_criteria":"all"}]}'

curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/packages/$ANNUAL_PKG_ID/actions/attach_products" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"products":[{"product_id":"'"$ANNUAL_PROD_ID"'","eligibility_criteria":"all"}]}'
```

### 7.7: Entitlement 作成 + Products 紐付け

```bash
ENTITLEMENT_ID=$(curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/entitlements" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"lookup_key":"premium","display_name":"Premium"}' | jq -r '.id')

curl -s -X POST "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/entitlements/$ENTITLEMENT_ID/actions/attach_products" \
  -H "Authorization: Bearer $RC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"product_ids":["'"$MONTHLY_PROD_ID"'","'"$ANNUAL_PROD_ID"'"]}'
```

### 7.8: .env 保存 + 検証

```bash
cat >> $APP_DIR/.env << EOF
RC_PROJECT_ID=$RC_PROJECT_ID
RC_SECRET_KEY=$RC_SECRET_KEY
RC_APP_ID=$RC_APP_ID
RC_OFFERING_ID=$OFFERING_ID
RC_ENTITLEMENT_ID=$ENTITLEMENT_ID
RC_MONTHLY_PROD_ID=$MONTHLY_PROD_ID
RC_ANNUAL_PROD_ID=$ANNUAL_PROD_ID
EOF

echo "Offerings: $(curl -s "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/offerings" -H "Authorization: Bearer $RC_SECRET_KEY" | jq '.items | length')"
echo "Packages: $(curl -s "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/offerings/$OFFERING_ID/packages" -H "Authorization: Bearer $RC_SECRET_KEY" | jq '.items | length')"
echo "Monthly Prod: $(curl -s "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/packages/$MONTHLY_PKG_ID/products" -H "Authorization: Bearer $RC_SECRET_KEY" | jq '.items | length')"
echo "Annual Prod: $(curl -s "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/packages/$ANNUAL_PKG_ID/products" -H "Authorization: Bearer $RC_SECRET_KEY" | jq '.items | length')"
echo "Entitlement Prod: $(curl -s "https://api.revenuecat.com/v2/projects/$RC_PROJECT_ID/entitlements/$ENTITLEMENT_ID/products" -H "Authorization: Bearer $RC_SECRET_KEY" | jq '.items | length')"
```

期待値: Offerings=1, Packages=2, Monthly Prod=1, Annual Prod=1, Entitlement Prod=2

SPM dependency: RevenueCat を追加（RevenueCatUI は禁止）

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
