# US-005b: Monetization (IAP + Pricing + RevenueCat)

依存: US-005a（APP_ID が .env に記録済みであること）

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/asc-ppp-pricing/SKILL.md` — rudrankriyam: 175カ国 pricing
2. `.claude/skills/asc-subscription-localization/SKILL.md` — rudrankriyam: IAP + locale

## Quality Gate (MANDATORY — US-005a の成果物検証)
```bash
source ~/.config/mobileapp-builder/.env
test -n "$APP_ID" || { echo "GATE FAIL: APP_ID not set"; exit 1; }
```

## Step 6: IAP Creation + Localization + Availability + Pricing

**順序が超重要！** availability → pricing の順。逆だと Apple API が 500 を返す。

### 6.1: サブスクリプショングループ作成
```bash
GROUP_ID=$(asc subscriptions groups create --app $APP_ID --reference-name "<AppName> Premium" --output json 2>&1 | jq -r '.data.id')
echo "GROUP_ID=$GROUP_ID" >> ~/.config/mobileapp-builder/.env
```

### 6.2: サブスクリプション作成

> `--ref-name` = ASC 内部管理名（ユーザーには見えない）。ユーザー表示名は Step 6.3 のローカリゼーションで設定する。

```bash
MONTHLY_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Monthly" --product-id "<bundle_id>.monthly" --subscription-period ONE_MONTH --output json 2>&1 | jq -r '.data.id')
echo "MONTHLY_ID=$MONTHLY_ID" >> ~/.config/mobileapp-builder/.env

ANNUAL_ID=$(asc subscriptions create --group $GROUP_ID --ref-name "Annual" --product-id "<bundle_id>.annual" --subscription-period ONE_YEAR --output json 2>&1 | jq -r '.data.id')
echo "ANNUAL_ID=$ANNUAL_ID" >> ~/.config/mobileapp-builder/.env
```

### 6.3: ローカリゼーション（グループ + サブスク、全37言語）

Source: asc-subscription-localization SKILL.md
> 「Each locale requires a separate create call. Creating a localization for a locale that already exists will fail; always check first.」

**en-US の名前を全言語にデフォルト設定し、ja だけ日本語に上書きする。**

```bash
# 全37 locale リスト
LOCALES="ar-SA ca cs da de-DE el en-AU en-CA en-GB en-US es-ES es-MX fi fr-CA fr-FR he hi hr hu id it ja ko ms nl-NL no pl pt-BR pt-PT ro ru sk sv th tr uk vi zh-Hans zh-Hant"

# --- グループローカリゼーション ---
for LOCALE in $LOCALES; do
  NAME="<AppName> Premium"
  [ "$LOCALE" = "ja" ] && NAME="<AppName> プレミアム"
  asc subscriptions groups localizations create --group-id $GROUP_ID --locale "$LOCALE" --name "$NAME" 2>&1 || true
done

# --- Monthly ローカリゼーション ---
for LOCALE in $LOCALES; do
  NAME="Monthly Premium"; DESC="Full access to all features."
  [ "$LOCALE" = "ja" ] && NAME="月額プレミアム" && DESC="全機能にアクセス。"
  asc subscriptions localizations create --subscription-id $MONTHLY_ID --locale "$LOCALE" --name "$NAME" --description "$DESC" 2>&1 || true
done

# --- Annual ローカリゼーション ---
for LOCALE in $LOCALES; do
  NAME="Annual Premium"; DESC="Full access. Save 50%."
  [ "$LOCALE" = "ja" ] && NAME="年額プレミアム" && DESC="全機能にアクセス。50%お得。"
  asc subscriptions localizations create --subscription-id $ANNUAL_ID --locale "$LOCALE" --name "$NAME" --description "$DESC" 2>&1 || true
done
```

### 6.4: availability 設定（全175テリトリー、pricing の前に必須！）

```bash
TERRITORIES=$(asc pricing territories list --paginate --output json 2>&1 | jq -r '[.data[].id] | join(",")')
asc subscriptions availability set --id $MONTHLY_ID --territory "$TERRITORIES" --available-in-new-territories
asc subscriptions availability set --id $ANNUAL_ID --territory "$TERRITORIES" --available-in-new-territories
```

### 6.5: 175カ国価格設定（availability の後！）

equalization API → CSV → `prices import` で一括設定。

**CSV フォーマット:** `territory,price,price_point_id`（3列必須。price_point_id があると CLI が price 解決をスキップし高速）

```bash
for SUB_ID in $MONTHLY_ID $ANNUAL_ID; do
  export TARGET_PRICE=$([ "$SUB_ID" = "$MONTHLY_ID" ] && echo "4.99" || echo "29.99")

  # USA の target price point ID を取得（export TARGET_PRICE でパイプ右側の Python にも渡る）
  PP_ID=$(asc subscriptions price-points list --subscription-id $SUB_ID --territory USA --paginate --output json 2>&1 \
    | python3 -c "
import sys, json, os
target = float(os.environ['TARGET_PRICE'])
for pp in json.load(sys.stdin)['data']:
    p = pp['attributes'].get('customerPrice')
    if p and abs(float(p) - target) < 0.01:
        print(pp['id']); break
")

  # 174カ国の等価価格 → CSV（stderr 混入防止: 2>/dev/null）
  asc subscriptions price-points equalizations --id "$PP_ID" --paginate --output json 2>/dev/null \
    | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)
print('territory,price,price_point_id')
for pp in data['data']:
    raw = pp['id']
    padded = raw + '=' * (4 - len(raw) % 4) if len(raw) % 4 else raw
    decoded = json.loads(base64.b64decode(padded).decode())
    print(f'{decoded[\"t\"]},{pp[\"attributes\"][\"customerPrice\"]},{raw}')
" > /tmp/${SUB_ID}-prices.csv

  # dry-run で検証（failed > 0 なら停止）
  asc subscriptions prices import --id $SUB_ID --input /tmp/${SUB_ID}-prices.csv --dry-run

  # 本番実行
  asc subscriptions prices import --id $SUB_ID --input /tmp/${SUB_ID}-prices.csv

  # USA を追加（equalization に含まれないため。既存なら skip）
  # --paginate 必須: デフォルト50件で切れるため USA が見つからない場合がある
  EXISTING_USA=$(asc subscriptions prices list --id $SUB_ID --paginate --output json 2>&1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('data', []):
    rels = p.get('relationships', {}).get('territory', {}).get('data', {})
    if rels.get('id') == 'USA':
        print('yes'); break
" 2>/dev/null)
  if [ "$EXISTING_USA" != "yes" ]; then
    asc subscriptions prices add --id $SUB_ID --price "$TARGET_PRICE" --territory "USA"
  else
    echo "✅ USA price already exists for $SUB_ID — skipping"
  fi
done
```

### 6.6: IAP Review Screenshot → US-008a Step 1h で実行

**⚠️ US-005b 時点ではアプリ未ビルド（US-006 が後）なので Paywall スクリーンショットは撮れない。**
**US-008a Step 1h でアプリビルド後に Paywall 画面をキャプチャしてアップロードする。**

ここでは何もしない。US-005b の passes:true 判定に Review Screenshot は不要。

## Step 7: RC Setup（RevenueCat API v2 — 全自動）

### 7.0: 人間に依頼（WAITING_FOR_HUMAN）

⛔ **SK Key を受け取るまで Step 7.1 以降に進むことを禁止する。** RC API Key なしで Product/Offering 作成は不可能。
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
source ~/.config/mobileapp-builder/.env
RC_SECRET_KEY="<sk_... from Slack>"
RC_BASE="https://api.revenuecat.com/v2"
AUTH="Authorization: Bearer $RC_SECRET_KEY"
CT="Content-Type: application/json"

# Project ID 取得（SK Key があれば自動）
RC_PROJECT_ID=$(curl -s "$RC_BASE/projects" -H "$AUTH" | jq -r '.items[0].id')
```

### 7.2: RC App 作成
```bash
RC_APP_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/apps" \
  -H "$AUTH" -H "$CT" \
  -d "{\"app_name\":\"<app_name>\",\"type\":\"app_store\",\"bundle_id\":\"<bundle_id>\"}" \
  | jq -r '.app.id')
```

### 7.2b: Public API Key 取得（自動 — WAITING_FOR_HUMAN 不要）
```bash
RC_PUBLIC_KEY=$(curl -s "$RC_BASE/projects/$RC_PROJECT_ID/apps/$RC_APP_ID/public_api_keys" \
  -H "$AUTH" | jq -r '.items[0].key')
echo "RC_IOS_PUBLIC_KEY=$RC_PUBLIC_KEY" >> ~/.config/mobileapp-builder/.env
```
⚠️ Public Key は App 作成時に自動生成される。Products/Offerings の前に取得可能。

### 7.3: Entitlement 作成
```bash
RC_ENT_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/entitlements" \
  -H "$AUTH" -H "$CT" \
  -d '{"lookup_key":"premium","display_name":"Premium"}' \
  | jq -r '.entitlement.id')
```

### 7.4: Product 作成 + Entitlement 紐付け
```bash
for pid in "<bundle_id>.monthly" "<bundle_id>.annual"; do
  PROD_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/products" \
    -H "$AUTH" -H "$CT" \
    -d "{\"store_identifier\":\"$pid\",\"app_id\":\"$RC_APP_ID\",\"type\":\"subscription\"}" \
    | jq -r '.product.id')

  curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/entitlements/$RC_ENT_ID/products" \
    -H "$AUTH" -H "$CT" \
    -d "{\"product_id\":\"$PROD_ID\"}"
done
```

### 7.5: Offering + Package 作成
```bash
RC_OFF_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/offerings" \
  -H "$AUTH" -H "$CT" \
  -d '{"lookup_key":"default","display_name":"Default"}' \
  | jq -r '.offering.id')

for pid in "<bundle_id>.monthly" "<bundle_id>.annual"; do
  curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/offerings/$RC_OFF_ID/packages" \
    -H "$AUTH" -H "$CT" \
    -d "{\"lookup_key\":\"$pid\",\"display_name\":\"$(echo $pid | sed 's/.*\.//')\",\"product_id\":\"$pid\"}"
done
```

### 7.6: SPM 依存追加
> ⚠️ **US-006 で実行。** Xcode プロジェクト作成後に RevenueCat SPM を追加する。US-005b ではスキップ。

RevenueCat を Xcode プロジェクトに追加（RevenueCatUI は使わない — Rule 20）。

## 次のステップ
US-005b 完了後、US-006（実装）に進む。
