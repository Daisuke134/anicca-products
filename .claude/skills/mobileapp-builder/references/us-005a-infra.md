# US-005a: Infrastructure (Privacy + ASC App Creation)

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

### 5.1: アプリ作成（通常は完全自動）
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
  # セッションキャッシュ切れの場合 2FA が必要になる可能性あり
  echo "WAITING_FOR_HUMAN: 2FA code needed"
  cat >> progress.txt << 'MSG'
⏸️ セッションキャッシュ切れ。
iPhone に届く 6 桁のコードを Slack で返信してください。
エージェントが --two-factor-code 付きで再実行します。
MSG
  exit 1
fi
```

### セッション管理
- セッションキャッシュ: `~/.asc/iris/`（ファイルベース）
- 通常運用: セッションが生きている限り **完全自動**（2FA不要、2026-03-04 実証済み）
- 有効期限: Apple サーバー側管理（定期使用で延長される）
- 期限切れ時のみ: Dais は Slack で 6桁コード返すだけ
- APP_ID は自動取得 → .env に自動書き込み → 次のステップへ自動続行

## 次のステップ
US-005a 完了後、`references/us-005b-monetization.md` に進む。
