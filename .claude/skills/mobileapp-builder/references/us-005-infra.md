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
  - urls.privacy_en   例: "https://example.com/myapp/privacy/en"（PRIVACY_POLICY_DOMAIN + slug で構成）
  - urls.privacy_ja   例: "https://example.com/myapp/privacy/ja"
  - urls.terms        固定値: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
  - urls.landing      例: "https://example.com/myapp"

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

### PHASE 2.5: SIGNING PREFLIGHT

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SIGNING PREFLIGHT — Distribution cert が有効でなければ PHASE 3 に進まない
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: 有効な Distribution cert を確認する
asc certificates list --type IOS_DISTRIBUTION --output json | python3 -c "
import sys,json
d=json.load(sys.stdin)
valid=[c for c in d['data'] if c['attributes'].get('certificateState')!='REVOKED']
if valid:
    print('✅ VALID cert exists:', valid[0]['attributes']['name'])
else:
    print('❌ NO VALID CERT — proceed to Step 2')
    exit(1)
"
→ VALID cert が存在すれば Step 3 へスキップ

Step 2: Distribution cert を新規作成する（REVOKED or 存在しない場合）
mkdir -p ~/Downloads/.signing
asc certificates csr generate ~/Downloads/.signing/dist.csr
# NOTE: openssl req 禁止 — Apple API が 409 で拒否する
asc certificates create --certificate-type IOS_DISTRIBUTION \
  --csr ~/Downloads/.signing/dist.csr \
  --output json | python3 -c "import sys,json;d=json.load(sys.stdin);print('CERT_ID:', d['data']['id'])"
# 発行された .cer を Keychain にインポート（asc が自動ダウンロード）

Step 3: Keychain の REVOKED 証明書を全て削除する
security find-identity -v -p codesigning | grep "REVOKED" | \
  awk '{print $3}' | while read hash; do
    security delete-certificate -Z "$hash"
    echo "Deleted REVOKED cert: $hash"
  done

Step 4: アプリ専用 Provisioning Profile を作成する
CERT_ID=$(asc certificates list --type IOS_DISTRIBUTION --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")
PROFILE_NAME="<app_name> AppStore Distribution"
asc profiles create \
  --profile-type IOS_APP_STORE \
  --bundle-id <BUNDLE_ID_RESOURCE_ID> \
  --certificate $CERT_ID \
  --name "$PROFILE_NAME" \
  --output json > /tmp/profile.json
PROFILE_UUID=$(python3 -c "import json;d=json.load(open('/tmp/profile.json'));print(d['data']['attributes']['uuid'])")
# Profile を ~/Library/MobileDevice/Provisioning Profiles/ にインストール
asc profiles download --id $(python3 -c "import json;d=json.load(open('/tmp/profile.json'));print(d['data']['id'])") \
  ~/Library/MobileDevice/Provisioning\ Profiles/

Step 5: Fastfile を manual signing テンプレートで更新する
# export_options に以下を設定（automatic signing 禁止）:
# signingStyle: "manual"
# signingCertificate: "iPhone Distribution: <Team Name> (<Team ID>)"
# provisioningProfiles: { "<bundle_id>" => "<PROFILE_UUID>" }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### PHASE 3: BUILD
```
【TDD 強制】tdd-workflow スキルを起動してから ralph-autonomous-dev でループ実行。
手順:
  1. `tdd-workflow` スキルを読み込む（テストファースト実装の強制）
  2. 各機能について RED → GREEN → REFACTOR を必ず通す
  3. ralph-autonomous-dev が fix_plan.md を読み → 実装 → テスト → ✅ のループを回す
  4. 全タスク `[x]` → EXIT_SIGNAL: true → PHASE 3 完了

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

  ■ PHASE 9 スクショ撮影 + Pencil MCP プロモ加工

  1. スクショ撮影（xcrun simctl io のみ・最大3枚・5分以内）
     ```bash
     xcrun simctl launch <UDID> <BUNDLE_ID> && sleep 3
     xcrun simctl io <UDID> screenshot screenshots/screen_1.png
     ```
     - Home画面1枚のみ必須。残り2枚はオプション
     - 画面遷移が必要な画面はスキップ
     - ⛔ XCUITest / ScreenshotTests.swift 禁止
     - ⛔ Maestro MCP / CLI での画面遷移禁止
     - ⛔ サブエージェントでの画面操作禁止
     - ⛔ xcrun simctl io sendEvent swipe/tap 禁止（iOS 17+ で動かない）
     - ⛔ 撮影に5分以上かけるな

  2. screenshot-creator SKILL.md の Step 1-7 に従って Pencil MCP でプロモ加工
     Read: /Users/anicca/anicca-project/.claude/skills/screenshot-creator/SKILL.md
     - Step 1: ヒアリング（product-plan.md からアプリ名・ターゲット・USP を取得）
     - Step 2: Pencil MCP でスタイルガイド取得
     - Step 3: コピー作成（ヘッドライン + サブヘッドライン × 3枚分）
     - Step 4: Pencil MCP で .pen ファイル作成（実スクショ埋め込み + テキスト配置）
     - Step 5: 技術仕様バリデーション
     - Step 6: 品質レビュー（10点満点）
     - Step 7: PNG エクスポート → ASC アップロード
     - ⛔ Python/Pillow/ImageMagick 禁止。Pencil MCP 失敗 → passes:false
```

### PHASE 3.5: PRIVACY POLICY & LANDING PAGE デプロイ
```
$PRIVACY_POLICY_DOMAIN/{slug}/ のページを作成してデプロイする。
PHASE 4 の前に必須（URL が死んでいると ASC Privacy URL 設定が通らない）。

■ 必要なページ（4つ）

  1. https://$PRIVACY_POLICY_DOMAIN/{slug}/             ← ランディングページ
     - アプリ名・コンセプト・App Store リンク（EN のみ可）

  2. https://$PRIVACY_POLICY_DOMAIN/{slug}/privacy/en  ← Privacy Policy（英語）
     - 収集データ: Device ID（Analytics）、Usage Data（Analytics）
     - RevenueCat: Purchase History（サブスク管理）
     - 収集しないデータ: 日記内容・アファメーション（ローカル保存のみ）

  3. https://$PRIVACY_POLICY_DOMAIN/{slug}/privacy/ja  ← Privacy Policy（日本語）
     - 同上の日本語版

  4. https://$PRIVACY_POLICY_DOMAIN/{slug}/terms       ← Terms（EULA リダイレクト）
     - https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ へリダイレクト

■ 推奨デプロイ方法（3択 — 自分のインフラに合わせて選ぶ）

  オプション A: GitHub Pages（無料・ドメイン持ちであれば最速）
    1. リポジトリに docs/ フォルダを作成して HTML ファイルを追加
    2. GitHub Settings → Pages → /docs を公開
    3. カスタムドメインを設定 → $PRIVACY_POLICY_DOMAIN を向ける

  オプション B: Vercel / Netlify（Next.js や静的サイトがあれば）
    1. プロジェクトに pages/{slug}/privacy/en.html 等を追加
    2. push → 自動デプロイ

  オプション C: 既存サーバー（VPS/Nginx/Apache）
    1. /var/www/html/{slug}/ にファイルを配置
    2. Nginx で location /{slug}/ { root /var/www/html; } を設定

■ Privacy Policy の最小テンプレート（EN）

  ```html
  <!DOCTYPE html><html><body>
  <h1>{app_name} Privacy Policy</h1>
  <p>We collect: Device identifiers (for analytics), usage data.</p>
  <p>We use RevenueCat for subscription management (purchase history).</p>
  <p>We do NOT collect: journal entries, affirmations, or any personal content.</p>
  <p>Contact: {your_email}</p>
  </body></html>
  ```

■ デプロイ後の確認（必須 — URL が死んでいると PHASE 11 GATE 4 で STOP）

  SLUG="{slug}"
  DOMAIN="$PRIVACY_POLICY_DOMAIN"
  curl -I "https://$DOMAIN/$SLUG/privacy/en" -s -o /dev/null -w "%{http_code}" | grep -q "200\|301\|302" \
    && echo "✅ EN privacy URL 生きています" || echo "❌ STOP: EN privacy URL が死んでいます"
  curl -I "https://$DOMAIN/$SLUG/privacy/ja" -s -o /dev/null -w "%{http_code}" | grep -q "200\|301\|302" \
    && echo "✅ JA privacy URL 生きています" || echo "❌ STOP: JA privacy URL が死んでいます"
  # 200/301/302 でなければ STOP。デプロイを確認してから PHASE 4 へ

■ ⚠️ Netlify CI クラッシュ警告（F6違反時 — 2026-02-26 実機確認）

  **F6ルール違反（worktree 未使用で main/dev に直接作業）すると Netlify CI が完全クラッシュする。**

  原因: aniccaai.com の Next.js プロジェクトは `.worktrees/main/apps/landing/` にある。
  worktree を使わず main ブランチや dev ブランチで作業すると、Netlify が
  Next.js ビルドを実行できず CI が失敗する。

  リカバリ手順（CI クラッシュ時）:
  ```bash
  cd /Users/cbns03/Downloads/anicca-project/.worktrees/main/apps/landing
  next build
  npx netlify deploy --dir=out --prod
  # → 手動で本番デプロイして CI をバイパスする
  ```

  予防: **必ず F6 に従い `git worktree add ~/Downloads/anicca-{slug} -b app-factory/{slug}` で隔離すること。**
```

### PHASE 4: ASC APP SETUP

> **✅ アプリ作成は `asc apps create` + `asc bundle-ids create` で全自動（ASC CLI 0.34.0 — 2026-02-26 更新）**
>
> fastlane produce は不要。ASC CLI 0.34.0 で `asc apps create` が追加された。

# Step 0: Bundle ID を作成（Apple Developer Portal に登録）
asc bundle-ids create --identifier "<bundle_id>" --name "<app_name>" --platform IOS

# Step 1: asc apps create でアプリを作成（App Store Connect に登録）
asc apps create --name "<app_name>" --bundle-id "<bundle_id>" --sku "<slug>" --primary-locale en-US
# ⚠️ fastlane produce create は使わない（CRITICAL RULE 4 — 禁止）
# 過去に試したが PRODUCE_USERNAME が必要で Spaceship が Apple ID ログインを要求する。
# ASC CLI 0.34.0 で asc apps create が追加されたため fastlane produce は不要になった。

# Step 2: 作成されたアプリの APP_ID を取得
APP_ID=$(asc apps list --bundle-id "<bundle_id>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")
echo "APP_ID: $APP_ID"

# Privacy Policy URL を en-US AND ja 両方に設定（片方だけでは submit 時にエラー）
# locale は必ず "ja"（"ja-JP" は ASC で無効）
APP_INFO_ID=$(asc apps info list --app "<APP_ID>" --output json | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

TOKEN=$(python3 -c "
import jwt,time,os,pathlib
key=pathlib.Path(os.environ['ASC_KEY_PATH']).read_text()
payload={'iss':os.environ['ASC_ISSUER_ID'],'iat':int(time.time()),'exp':int(time.time())+1200,'aud':'appstoreconnect-v1'}
print(jwt.encode(payload,key,algorithm='ES256',headers={'kid':os.environ['ASC_KEY_ID'],'typ':'JWT'}))
")

# en-US Privacy URL（spec.md の urls.privacy_en を使う）
PRIVACY_EN="<urls.privacy_en>"   # 例: https://example.com/myapp/privacy/en
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<EN_LOC_ID>" \
  -d "{\"data\":{\"type\":\"appInfoLocalizations\",\"id\":\"<EN_LOC_ID>\",\"attributes\":{\"privacyPolicyUrl\":\"$PRIVACY_EN\"}}}"

# ja Privacy URL（locale = "ja" 確認必須 / spec.md の urls.privacy_ja を使う）
PRIVACY_JA="<urls.privacy_ja>"   # 例: https://example.com/myapp/privacy/ja
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfoLocalizations/<JA_LOC_ID>" \
  -d "{\"data\":{\"type\":\"appInfoLocalizations\",\"id\":\"<JA_LOC_ID>\",\"attributes\":{\"privacyPolicyUrl\":\"$PRIVACY_JA\"}}}"

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

# ★★ primaryCategory 設定（CRITICAL RULE 35 — 未設定で INVALID_BINARY になる）
APP_INFO_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.appstoreconnect.apple.com/v1/apps/<APP_ID>/appInfos" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])")

# カテゴリ設定（アプリ内容に応じて変更: UTILITIES / PRODUCTIVITY / SOCIAL_NETWORKING / EDUCATION）
curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.appstoreconnect.apple.com/v1/appInfos/$APP_INFO_ID" \
  -d "{\"data\":{\"type\":\"appInfos\",\"id\":\"$APP_INFO_ID\",\"relationships\":{\"primaryCategory\":{\"data\":{\"type\":\"appCategories\",\"id\":\"UTILITIES\"}}}}}"

# 確認（id が返れば OK）
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.appstoreconnect.apple.com/v1/appInfos/$APP_INFO_ID/primaryCategory" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('primaryCategory:', d.get('data',{}).get('id','NOT SET'))"
```

### PHASE 4.5: RC OFFERINGS SETUP（TestFlight 前に必須）

**ベストプラクティス: 1アプリ = 1プロジェクト（RC Staff 公式回答）**
Source: https://community.revenuecat.com/general-questions-7/project-vs-app-1899

```
Step 1: Slack でプロジェクト作成を依頼（RC MCP に create_project がないため手動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 <app_name> の RC プロジェクトを作ってください:
1. https://app.revenuecat.com → + Create new project
2. プロジェクト名: <app_name>
3. 作成後、プロジェクトURLを貼ってください
   例: https://app.revenuecat.com/projects/proj______
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ 返信を待つ → URL から project_id を抽出（例: projbb7b9d1b）

Step 2: RC MCP でアプリ + プロダクト + offering を全て作成
  mcp_RC_create_app(project_id, name: "<app_name>", type: "app_store", bundle_id: "<bundle_id>")
  → app_id 取得
  mcp_RC_list_public_api_keys(project_id, app_id)
  → appl_xxx 取得 → アプリの Purchases.configure(withAPIKey:) にハードコード
  mcp_RC_create_product(project_id, store_identifier: "<bundle_id>.premium.monthly", type: "subscription", app_id)
  mcp_RC_create_product(project_id, store_identifier: "<bundle_id>.premium.annual", type: "subscription", app_id)
  mcp_RC_create_entitlement(project_id, lookup_key: "premium", display_name: "<app_name> Premium")
  mcp_RC_attach_products_to_entitlement(project_id, entitlement_id, product_ids: [monthly_id, annual_id])
  mcp_RC_create_offering(project_id, lookup_key: "default", display_name: "<app_name> Default")
  mcp_RC_update_offering(project_id, offering_id, is_current: true)
  mcp_RC_create_package(project_id, offering_id, lookup_key: "$rc_monthly", display_name: "Monthly")
  mcp_RC_create_package(project_id, offering_id, lookup_key: "$rc_annual", display_name: "Annual")
  mcp_RC_attach_products_to_package × 2（monthly + annual）

Step 3: Slack で IAP Key 設定を依頼
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RC セットアップ完了（app + products + entitlement + offering）
⚠️ IAP Key を設定してください:
1. <RC_APP_SETTINGS_URL> を開く
2.「In-app purchase key configuration」タブ
3. 入力:
   - .p8 ファイル: $ASC_PRIVATE_KEY_PATH の .p8
   - Key ID: $ASC_KEY_ID
   - Issuer ID: $ASC_ISSUER_ID
4. Save →「Valid credentials」確認
→ 完了したら「done」と返信
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ 返信を待つ（touch .rc-iap-key-done）

確認: RC Offerings が "current" に設定されていること
確認: IAP Key が valid であること
```
```

