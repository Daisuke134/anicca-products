# US-005b: Monetization (IAP + Pricing + RevenueCat)

依存: US-005a（APP_ID が .env に記録済みであること）

Source: rudrankriyam asc-ppp-pricing + asc-subscription-localization skills
Verified: 2026-03-04 実機テスト済み（APP_ID 6759990837）

## Skills to Read (IN THIS ORDER)
1. `.claude/skills/asc-ppp-pricing/SKILL.md` — rudrankriyam: 175カ国 pricing
2. `.claude/skills/asc-subscription-localization/SKILL.md` — rudrankriyam: IAP + locale

## Quality Gate (MANDATORY — US-005a の成果物検証)
```bash
test -n "$APP_ID" || { echo "GATE FAIL: APP_ID not set"; exit 1; }
```

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

### 6.3: ローカリゼーション（グループ + サブスク、en-US + ja）

```bash
# グループローカリゼーション
asc subscriptions groups localizations create --group-id $GROUP_ID --locale en-US --name "<AppName> Premium"
asc subscriptions groups localizations create --group-id $GROUP_ID --locale ja --name "<AppName> プレミアム"

# サブスクローカリゼーション
asc subscriptions localizations create --subscription-id $MONTHLY_ID --locale en-US --name "Monthly Premium" --description "Full access."
asc subscriptions localizations create --subscription-id $MONTHLY_ID --locale ja --name "月額プレミアム" --description "全機能にアクセス。"
asc subscriptions localizations create --subscription-id $ANNUAL_ID --locale en-US --name "Annual Premium" --description "Full access. Save 50%."
asc subscriptions localizations create --subscription-id $ANNUAL_ID --locale ja --name "年額プレミアム" --description "全機能にアクセス。50%お得。"
```

### 6.4: availability 設定（全175テリトリー、pricing の前に必須！）

```bash
TERRITORIES=$(asc pricing territories list --paginate --output json | python3 -c "import sys,json;print(','.join(t['id'] for t in json.load(sys.stdin)['data']))")
asc subscriptions availability set --id $MONTHLY_ID --territory "$TERRITORIES" --available-in-new-territories
asc subscriptions availability set --id $ANNUAL_ID --territory "$TERRITORIES" --available-in-new-territories
```

### 6.5: 175カ国価格設定（availability の後！）

equalization API → CSV → `prices import` で一括設定。
Verified: 2026-03-04 テスト済み — 174カ国 Created=174 Failed=0

```bash
for SUB_ID in $MONTHLY_ID $ANNUAL_ID; do
  TARGET_PRICE=$([ "$SUB_ID" = "$MONTHLY_ID" ] && echo "4.99" || echo "29.99")

  # USA の target price point ID を取得
  PP_ID=$(asc subscriptions price-points list --subscription-id $SUB_ID --territory USA --paginate --output json | python3 -c "
import sys, json
for pp in json.load(sys.stdin)['data']:
    p = pp['attributes'].get('customerPrice')
    if p and abs(float(p) - $TARGET_PRICE) < 0.01:
        print(pp['id']); break
")

  # 174カ国の等価価格 → CSV
  asc subscriptions price-points equalizations --id "$PP_ID" --paginate --output json | python3 -c "
import sys, json, base64
print('territory,price,price_point_id')
for pp in json.load(sys.stdin)['data']:
    raw = pp['id']
    padded = raw + '=' * (4 - len(raw) % 4) if len(raw) % 4 else raw
    decoded = json.loads(base64.b64decode(padded).decode())
    price = pp['attributes'].get('customerPrice', '0')
    print(f'{decoded[\"t\"]},{price},{pp[\"id\"]}')
" > /tmp/\${SUB_ID}-prices.csv

  # 174カ国一括インポート
  asc subscriptions prices import --id $SUB_ID --input /tmp/\${SUB_ID}-prices.csv

  # USA を追加（equalization に含まれないため）
  asc subscriptions prices add --id $SUB_ID --price "$TARGET_PRICE" --territory "USA"
done
```

### 6.6: IAP Review Screenshot（必須！）

Source: submission-checklist.md D6-D7
Source: https://developer.apple.com/documentation/appstoreconnectapi/subscription_review_screenshots

```bash
xcrun simctl io booted screenshot /tmp/paywall-review.png

asc subscriptions review-screenshots create \
  --subscription-id $MONTHLY_ID \
  --file /tmp/paywall-review.png

asc subscriptions review-screenshots create \
  --subscription-id $ANNUAL_ID \
  --file /tmp/paywall-review.png
```

### PROHIBITED
- ⛔ Review Screenshot なしで US-005b を passes:true にするな
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
RC_SECRET_KEY="<sk_... from Slack>"
RC_BASE="https://api.revenuecat.com/v2"
AUTH="Authorization: Bearer $RC_SECRET_KEY"
CT="Content-Type: application/json"
```

### 7.2: RC App 作成
```bash
RC_APP_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/apps" \
  -H "$AUTH" -H "$CT" \
  -d "{\"app_name\":\"<app_name>\",\"type\":\"app_store\",\"bundle_id\":\"com.anicca.<slug>\"}" \
  | jq -r '.app.id')
```

### 7.3: Entitlement 作成
```bash
RC_ENT_ID=$(curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/entitlements" \
  -H "$AUTH" -H "$CT" \
  -d '{"lookup_key":"premium","display_name":"Premium"}' \
  | jq -r '.entitlement.id')
```

### 7.4: Product 作成 + Entitlement 紐付け
```bash
for pid in "com.anicca.<slug>.monthly" "com.anicca.<slug>.annual"; do
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

for pid in "com.anicca.<slug>.monthly" "com.anicca.<slug>.annual"; do
  curl -s -X POST "$RC_BASE/projects/$RC_PROJECT_ID/offerings/$RC_OFF_ID/packages" \
    -H "$AUTH" -H "$CT" \
    -d "{\"lookup_key\":\"$pid\",\"display_name\":\"$(echo $pid | sed 's/.*\.//')\",\"product_id\":\"$pid\"}"
done
```

### 7.6: SPM 依存追加
RevenueCat + RevenueCatUI を Xcode プロジェクトに追加。

## 次のステップ
US-005b 完了後、US-006（実装）に進む。
