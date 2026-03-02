# RevenueCat Factory Setup Spec

## プロジェクト構成ルール

Source: RevenueCat Staff (Andy) — https://community.revenuecat.com/general-questions-7/project-vs-app-1899

> "One typical scenario is that you want to share subscriptions across Android and iOS versions of the same app, but you don't want to share the subscription for different apps. In this case, you'd have one project per app."

> "apps in the same project share user IDs"

### 判断: 1プロジェクトに全アプリ + entitlement をアプリ名プレフィックスで分離

- RC MCP に create_project ツールがないため、新プロジェクト作成は手動
- 毎回 Dais に手動でプロジェクト作成を頼むのは非現実的（1日1アプリ × 365日）
- 対処: Anicca プロジェクト内に全アプリを入れ、entitlement の lookup_key を {appname}_premium にする
- 注意: これはワークアラウンド。ベストプラクティスは 1アプリ = 1プロジェクト

## CC が RC MCP でやること (US-005)

### Step 1: アプリ作成
mcp_RC_create_app(project_id: "projbb7b9d1b", name: "{APP_NAME}", type: "app_store", bundle_id: "{BUNDLE_ID}")

### Step 2: 公開APIキー取得
mcp_RC_list_public_api_keys(project_id, app_id) → appl_xxx → MicroMoodApp.swift にハードコード

### Step 3: プロダクト作成
mcp_RC_create_product(project_id, store_identifier: "{bundle_id}.premium.monthly", type: "subscription", app_id)
mcp_RC_create_product(project_id, store_identifier: "{bundle_id}.premium.annual", type: "subscription", app_id)

### Step 4: Entitlement 作成 + 紐付け
mcp_RC_create_entitlement(project_id, lookup_key: "{appname}_premium", display_name: "{APP_NAME} Premium")
mcp_RC_attach_products_to_entitlement(project_id, entitlement_id, product_ids: [monthly_id, annual_id])

### Step 5: Offering + Package 作成
mcp_RC_create_offering(project_id, lookup_key: "{appname}_default", display_name: "{APP_NAME} Default")
mcp_RC_create_package × 2 ($rc_monthly, $rc_annual) + attach products

### Step 6: Slack 通知 (手動作業依頼)
"⚠️ RC In-App Purchase Key を設定してください:
1. https://app.revenuecat.com/projects/bb7b9d1b/apps/{RC_APP_ID}
2. In-app purchase key configuration タブ
3. .p8: AuthKey_AY9BT5R8NU.p8 / Key ID: AY9BT5R8NU / Issuer ID: f53272d9-c12d-4d9d-811c-4eb658284e74
4. Save → Valid credentials 確認 → touch .rc-iap-key-done"

## Dais 手動作業 (2回)

1. In-App Purchase Key 設定 (US-005 後) → touch .rc-iap-key-done
2. App Privacy 設定 (US-009 前) → touch .app-privacy-done

## スキル評価

- revenuecat (公式, revenuecat/revenuecat-skill): SDK実装コード例のみ。MCP/プロジェクト作成/IAP key 未カバー
- MCP セットアップのスキルは存在しない → SKILL.md に直接記載

## AXe (本物) インストール

brew install cameroncooke/axe/axe
# shim 上書きされてたら:
mv /opt/homebrew/bin/axe /opt/homebrew/bin/axe-shim-backup
brew link axe --overwrite
axe --version  # v1.4.0

## AXe スクショ手順 (実証済み)

UDID="$(xcrun simctl list devices booted | grep -oE '[A-F0-9-]{36}' | head -1)"
axe describe-ui --udid "$UDID"  # Tab Bar frame 確認
# Tab coordinates: x = (width/8), (3w/8), (5w/8), (7w/8), y = tab center
axe tap -x $X -y $Y --udid "$UDID" && sleep 1
axe screenshot --output screenshots/raw/screen_N.png --udid "$UDID"
# Paywall: axe tap --label "Upgrade to Pro..." → screenshot

## RC 定数

REVENUECAT_PROJECT_ID=projbb7b9d1b
REVENUECAT_V2_SECRET_KEY=sk_YTtULZGUcQuIepNzNOasKQYsKmZJX
IAP_KEY_ID=AY9BT5R8NU
ASC_API_KEY_ID=D637C7RGFN
ISSUER_ID=f53272d9-c12d-4d9d-811c-4eb658284e74
