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

## Step 5: ASC App Creation (手動 — スキルなし)

ASC アプリ作成は API Key 不可（Apple ID + 2FA 必要）。
自動化するスキルは存在しない（asc-app-create-ui は未実装）。

Source: asc CLI help
> 「App creation requires Apple ID authentication (not API key)」

CC は progress.txt に以下を書いて passes:false で終了する:
```
WAITING_FOR_HUMAN: ASC app creation
📱 ASC でアプリを作成してください（30秒）
https://appstoreconnect.apple.com → + → 新規App
  プラットフォーム: iOS
  名前: <app_name>
  プライマリ言語: English (U.S.)
  バンドルID: <bundle_id>
  SKU: <slug>
  ユーザアクセス: 制限なし
完了したら APP_ID を Slack で返信してください。
```

ralph.sh が progress.txt の WAITING_FOR_HUMAN を検出 → Slack に投稿。
Dais が APP_ID を返信 → Anicca が progress.txt に追記 + .env に書く。
次の iteration で CC が読む → 続行。

## Step 6: IAP Creation + 175 Countries Pricing
- asc-subscription-localization スキル → IAP 作成 + 全 locale
- asc-ppp-pricing スキル → 175カ国 pricing
- CRITICAL: availability set BEFORE pricing（順序逆だと Apple 500エラー）

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
