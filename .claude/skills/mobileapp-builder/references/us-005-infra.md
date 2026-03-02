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


## Step 4.5: Bundle ID 登録（Developer Portal）

ASC でアプリを作成する前に、Apple Developer Portal で Identifier を登録する必要がある。

```bash
# Bundle ID が登録済みか確認
# asc CLI には identifiers コマンドがないので、ASC アプリ作成時に選択可能か確認する
```

CC は progress.txt に以下を書いて WAITING_FOR_HUMAN:
```
WAITING_FOR_HUMAN: Bundle ID registration
📱 Bundle ID の登録をお願いします（30秒）:
1. https://developer.apple.com → Certificates, Identifiers & Profiles
2. Identifiers → + → App IDs → Continue → App → Continue
3. Description: <app_name>
4. Bundle ID: Explicit → <bundle_id>
5. Capabilities: (必要に応じて選択)
6. Register
完了したら Slack で「done」と返信してください。
```

## Step 5: ASC App Creation (asc web apps create)

### 5.1: セッション有効性チェック
```bash
source ~/.config/mobileapp-builder/.env
LAST_LOGIN="${ASC_WEB_LAST_LOGIN:-1970-01-01}"
DAYS_SINCE=$(( ( $(date +%s) - $(date -j -f "%Y-%m-%d" "$LAST_LOGIN" +%s) ) / 86400 ))

if [ "$DAYS_SINCE" -gt 28 ]; then
  # 28日超過 → 2FA 必要
  echo "WAITING_FOR_HUMAN: 2FA required (session expired)"
  cat >> progress.txt << 'MSG'
⏸️ 2FA コード入力が必要です（セッション期限切れ）
asc web auth login --apple-id keiodaisuke@gmail.com --password-stdin
→ パスワード入力後、iPhone に届く 6 桁のコードを Slack で返信
MSG
  exit 1
fi
```

### 5.2: アプリ作成（自動）
```bash
APP_RESULT=$(asc web apps create \
  --name "<app_name>" \
  --bundle-id "<bundle_id>" \
  --sku "<slug>" \
  --apple-id "$APPLE_ID" \
  --output json 2>&1)

if echo "$APP_RESULT" | grep -q '"id"'; then
  APP_ID=$(echo "$APP_RESULT" | jq -r '.data.id')
  echo "APP_ID=$APP_ID" >> .env
  echo "✅ ASC App created: $APP_ID"
  
  # Update last login date
  sed -i '' "s/ASC_WEB_LAST_LOGIN=.*/ASC_WEB_LAST_LOGIN=$(date +%Y-%m-%d)/" ~/.config/mobileapp-builder/.env
else
  echo "❌ ASC App creation failed: $APP_RESULT"
  exit 1
fi
```

Dais が APP_ID を返信 → Anicca が progress.txt に追記 + .env に書く。
次の iteration で CC が読む → 続行。

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
```bash
# CSV で一括 import
cat > /tmp/monthly-prices.csv << 'EOF'
territory,price
USA,4.99
EOF
asc subscriptions prices import --id $MONTHLY_ID --input /tmp/monthly-prices.csv

cat > /tmp/annual-prices.csv << 'EOF'
territory,price
USA,29.99
EOF
asc subscriptions prices import --id $ANNUAL_ID --input /tmp/annual-prices.csv
```

## Step 7: RC Setup (人間介入)
CC は progress.txt に以下を書いて passes:false で終了する。
ralph.sh が検出して Slack に投稿する:
```
📱 <app_name> の RC セットアップをお願いします（5分）:
1. https://app.revenuecat.com → + Create new project
2. + App → App Store → Bundle ID: <bundle_id>
3. In-app purchase key → .p8 / Key ID / Issuer ID → Save
4. 返信: proj URL + sk_ + appl_
```

Keys を受け取ったら:
- `.env` に RC_SECRET_KEY, RC_PUBLIC_KEY を書く
- RC MCP で offerings + entitlements 作成
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
