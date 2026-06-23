# PATCH — JP 価格改定 + Lifetime(買い切り) 3プラン paywall

**目標**: ① JP のサブスク価格を 月¥1,500→**¥500** / 年¥6,000→**¥2,000** に値下げ ② **Lifetime(買い切り) IAP を新設**（JP **¥5,000** / US **$99.99**）③ ライブ paywall(`PaywallVariantBView`) に **3枚目の Lifetime カード**を追加 ④ Maestro E2E ⑤ App Store スクショ更新。US の 月$9.99/年$39.99 は **据置**。

**根拠**: affirmation 2大アプリ(I Am / ThinkUp) は揃って「月+年+買い切り」3プラン。I Am JP = 月¥1,500/年¥2,100/lifetime¥6,000 → 全プランをアンダーカット。

**SSOT 事実（このセッションで実測, asc 2.0.0 + RevenueCat API + コード）**:
| 項目 | 値 |
|---|---|
| App Store app id | `6755129214`（bundle `ai.anicca.app.ios`） |
| ライブ offering(RevenueCat) | `ofrngb357e8cdb3`（lookup_key `anicca_variant_b`, is_current=true） |
| ライブ paywall View | `aniccaios/aniccaios/Onboarding/PaywallVariantBView.swift`（`OnboardingBibleViews.swift:719` で提示, hard paywall）。`PlanSelectionStepView.swift` は**未使用**（触らない） |
| entitlement id | `entlb820c43ab7`（Prod/Staging 共通, `Configs/Production.xcconfig:4`） |
| RevenueCat app_id(Apple) | `app511ef26659` |
| sub id: monthly.b | `6769264298`（`ai.anicca.app.ios.monthly.b`, prod `prodd6e68bd651`） |
| sub id: yearly.b | `6762049696`（`ai.anicca.app.ios.yearly.b`, prod `prodecbf22e88d`） |
| sub id: weekly.b | `6762049888`（非表示。今回触らない） |
| 新 lifetime product id | `ai.anicca.app.ios.lifetime`（新規, NON_CONSUMABLE） |

---

## PHASE 0 — worktree + SDD 準備（`~/anicca-project` は worktree 必須）

```bash
cd /Users/anicca/anicca-project
git fetch origin && git checkout dev && git pull
git worktree add ../anicca-jp-pricing -b feature/jp-pricing-lifetime
cd ../anicca-jp-pricing
# baseline build を1回（緑確認）
cd aniccaios && xcodebuild -scheme aniccaios -destination "generic/platform=iOS Simulator" -quiet build CODE_SIGNING_ALLOWED=NO ; cd ..
```
SDD 順: この patch.md = spec+plan → RED(Maestro 失敗を先に) → GREEN(コード) → adversary review(vcsdd) → NO-MOCK E2E(Maestro + sandbox 購入) → converge。

---

## PHASE 1 — App Store Connect 価格（asc 2.0.0, read済で確定）

### 1-1. JP 月額 ¥1,500 → ¥500
```bash
asc subscriptions pricing prices set --subscription-id 6769264298 --price "500" --territory JP --preserved
# 検証
asc subscriptions pricing summary --app 6755129214 --territory JP | python3 -c "import json,sys;[print(s['productId'],s['currentPrice']) for s in json.load(sys.stdin)['subscriptions'] if s['productId']=='ai.anicca.app.ios.monthly.b']"
# 期待: {'amount':'500','currency':'JPY'}
```
（厳密 price-point 指定が要る場合 JP¥500 = `eyJzIjoiNjc2OTI2NDI5OCIsInQiOiJKUE4iLCJwIjoiMTAwNDYifQ` → `--price-point` で代替可）

### 1-2. JP 年額 ¥6,000 → ¥2,000
```bash
asc subscriptions pricing prices set --subscription-id 6762049696 --price "2000" --territory JP --preserved
asc subscriptions pricing summary --app 6755129214 --territory JP | python3 -c "import json,sys;[print(s['productId'],s['currentPrice']) for s in json.load(sys.stdin)['subscriptions'] if s['productId']=='ai.anicca.app.ios.yearly.b']"
# 期待: {'amount':'2000','currency':'JPY'}
```
> US は変更しない（月$9.99/年$39.99 据置）。`--preserved` で他テリトリ価格を保持。

### 1-3. Lifetime(買い切り) IAP 新設 — NON_CONSUMABLE
JP を base にして¥5,000を確実化（他テリトリは自動均等化）:
```bash
asc iap setup --app 6755129214 --type NON_CONSUMABLE \
  --reference-name "Anicca Lifetime" \
  --product-id "ai.anicca.app.ios.lifetime" \
  --locale "ja-JP" --display-name "買い切り" --description "アニッチャ プレミアムを永久に。" \
  --price "5000" --base-territory "Japan"
# → 返る IAP id を控える（例: 67XXXXXXXX）= $IAP_ID
```
英語ローカライズ追加 + US を $99.99 に手動上書き:
```bash
asc iap localizations create --iap-id "$IAP_ID" --locale "en-US" --display-name "Lifetime" --description "Anicca Premium, forever. One-time purchase."
# US の $99.99 price-point を引く
asc iap pricing price-points list --iap-id "$IAP_ID" --territory USA | python3 -c "import json,sys;[print(p['id'],p['attributes'].get('customerPrice')) for p in json.load(sys.stdin)['data'] if p['attributes'].get('customerPrice') in ('99.99','100')]"
# → 出た price-point id を $US_PP に。 JP¥5,000 の point も同様に取得 → $JP_PP
asc iap pricing schedules create --iap-id "$IAP_ID" --base-territory "Japan" \
  --prices "$JP_PP:2026-06-24" --prices "$US_PP:2026-06-24"
# 検証
asc iap pricing summary --iap-id "$IAP_ID" --territory JP   # ¥5,000
asc iap pricing summary --iap-id "$IAP_ID" --territory USA  # $99.99
```
Family Sharing を付けるなら setup に `--family-sharable true`（取り消し不可）。
> Lifetime は次アプリバージョンと一緒に審査提出（`asc iap submit --id "$IAP_ID" --confirm` か version に紐付け）。

---

## PHASE 2 — RevenueCat（MCP, project `projbb7b9d1b`）

```
1) create-product:
   project_id=projbb7b9d1b, app_id=app511ef26659, type=non_consumable,
   store_identifier="ai.anicca.app.ios.lifetime", display_name="Anicca Lifetime"
   → 返る product id = $RC_LIFETIME_PROD

2) create-packages:
   project_id=projbb7b9d1b, offering_id=ofrngb357e8cdb3,
   lookup_key="$rc_lifetime", display_name="Lifetime", position=3
   → 返る package id = $RC_LIFETIME_PKG

3) attach-products-to-package:
   package_id=$RC_LIFETIME_PKG,
   products=[{product_id:$RC_LIFETIME_PROD, eligibility_criteria:"all"}]

4) attach-products-to-entitlement:
   entitlement_id=entlb820c43ab7, product_ids=[$RC_LIFETIME_PROD]
```
検証: `list-offerings expand=items.package.product` で `ofrngb357e8cdb3` に `$rc_lifetime` が出る + `get-products-from-entitlement entlb820c43ab7` に lifetime が含まれる。

---

## PHASE 3 — iOS コード diff（全て `aniccaios/aniccaios/`）

### 3-1. `Onboarding/PaywallVariantBView.swift`

**(a) lifetimePackage 追加** — 22行目の直後:
```diff
     private var monthlyPackage: Package? { packages.first { $0.packageType == .monthly } }
+    private var lifetimePackage: Package? { packages.first { $0.packageType == .lifetime } }
```

**(b) Lifetime カード描画** — `planCards` 内, monthly カードブロック(130–137行)の直後 / 138行 `}` の前:
```diff
                 if let monthly = monthlyPackage {
                     planCard(
                         package: monthly,
                         priceLabel: monthly.localizedPriceString + String(localized: "paywall_b_per_month"),
                         badge: trialBadge(for: monthly),
                         dailyPriceLabel: nil
                     )
                 }
+
+                if let lifetime = lifetimePackage {
+                    planCard(
+                        package: lifetime,
+                        priceLabel: lifetime.localizedPriceString + String(localized: "paywall_b_per_lifetime"),
+                        badge: String(localized: "paywall_b_lifetime_badge"),
+                        dailyPriceLabel: nil
+                    )
+                }
```

**(c) localizedPlanTitle に lifetime ケース** — 291行 `.weekly` の直後:
```diff
         case .weekly: return String(localized: "paywall_b_plan_weekly")
+        case .lifetime: return String(localized: "paywall_b_plan_lifetime")
         default: return package.storeProduct.localizedTitle
```

> trialBadge/hasTrialEligibility は lifetime を `.annual||.monthly` 以外として既に除外 → lifetime 選択時 CTA は自動で「no_trial」表示(=`paywall_b_cta_no_trial`)。変更不要。
> 既定選択(75行 `yearlyPackage ?? monthlyPackage`)は据置（年が既定で良い）。

### 3-2. `Services/SubscriptionManager.swift`（lifetime の status 表示修正）

`extension SubscriptionInfo.init(info:)` 内, 289–296行を修正（lifetime は willRenew=false でも "active"）:
```diff
         let willRenew = entitlement?.willRenew ?? false
+        let isLifetime = productId == "ai.anicca.app.ios.lifetime"
         let isTrial = entitlement?.periodType == .trial
         let statusString: String
         if entitlement?.isActive == true {
-            statusString = isTrial ? "trialing" : (willRenew ? "active" : "canceled")
+            statusString = isTrial ? "trialing" : (willRenew || isLifetime ? "active" : "canceled")
         } else {
             statusString = "expired"
         }
```

### 3-3. Localizable.strings（新キー3つ × 6言語）

**`Resources/en.lproj/Localizable.strings`** — 1440行 `paywall_b_trial_badge` の直後に追加:
```diff
 "paywall_b_trial_badge" = "3 DAYS FREE";
+"paywall_b_plan_lifetime" = "Lifetime";
+"paywall_b_per_lifetime" = " · one-time";
+"paywall_b_lifetime_badge" = "BEST VALUE";
```

**`Resources/ja.lproj/Localizable.strings`** — 1439行 `paywall_b_trial_badge` の直後:
```diff
 "paywall_b_trial_badge" = "3日間無料";
+"paywall_b_plan_lifetime" = "買い切り";
+"paywall_b_per_lifetime" = " · 一回のみ";
+"paywall_b_lifetime_badge" = "一番お得";
```

**`de` / `es` / `fr` / `pt-BR`** — 各 `paywall_b_trial_badge` 行の直後に同3キー（暫定 EN 文言でも可, 推奨訳）:
- de: `"Lifetime"` / `" · einmalig"` / `"BESTER WERT"`
- es: `"De por vida"` / `" · pago único"` / `"MEJOR VALOR"`
- fr: `"À vie"` / `" · paiement unique"` / `"MEILLEUR PRIX"`
- pt-BR: `"Vitalício"` / `" · pagamento único"` / `"MELHOR VALOR"`

### 3-4. `Anicca.storekit`（シミュレータ/Xcode 動作確認用）
非消費型 `ai.anicca.app.ios.lifetime` を `nonRenewing`/`nonConsumable` セクションに追加（displayPrice JP ¥5,000 / 既定 $99.99, localizations ja/en）。実機 sandbox 購入は StoreKit config OFF で ASC を使う（fastlane では IAP テスト不可 = [[feedback_fastlane_cannot_test_paywall]] → Dais の Xcode ▶ Run + sandbox tester）。

---

## PHASE 4 — TOBE 画面（PaywallVariantBView, 3カード）

```
┌──────────────────────────────┐
│        静かな心、毎日に。       │   paywall_b_title
│  20のテーマ、200のことば。      │   paywall_b_subtitle
│  ✓ 1日1〜4通の通知             │
│  ✓ 8種類の手描き背景           │   featureList(据置)
│  ✓ ウォーターマーク無し         │
│  ✓ 広告ゼロ / ✓ いつでも解約     │
│ ┌──────────────────────────┐ │
│ │ 年額プラン [3日間無料] ●   │ │ ← 既定選択(枠ハイライト)
│ │ ¥2,000/年                 │ │   JP: ¥2,000  US: $39.99
│ │ 1日あたりたった¥5          │ │
│ ├──────────────────────────┤ │
│ │ 月額プラン [3日間無料] ○   │ │   JP: ¥500   US: $9.99
│ │ ¥500/月                   │ │
│ ├──────────────────────────┤ │
│ │ 買い切り [一番お得] ○      │ │ ← NEW 3枚目
│ │ ¥5,000 · 一回のみ          │ │   JP: ¥5,000 US: $99.99
│ └──────────────────────────┘ │
│ [   無料で始める / 今すぐ旅を   ]│ ← CTA(年/月=trial文言, 買い切り=no_trial)
│  3日間無料、その後 ¥2,000…      │   trustText
│  復元 · 利用規約 · プライバシー   │
└──────────────────────────────┘
```
変化点 = カードが **2枚→3枚**、買い切り選択時のみ CTA が「今すぐ旅を始める(無料トライアル無し)」に切替。

---

## PHASE 5 — Maestro E2E（NO-MOCK）

`aniccaios/maestro/paywall_lifetime.yaml`（新規）:
```yaml
appId: ai.anicca.app.ios
---
- launchApp:
    clearState: true
- runFlow: flows/onboarding_to_paywall.yaml   # 既存の onboarding 突破フローを再利用
- assertVisible: "年額プラン"
- assertVisible: "月額プラン"
- assertVisible: "買い切り"          # ← 3枚目が出ることの検証(=RED→GREEN の核)
- assertVisible: "一番お得"
- tapOn: "買い切り"
- assertVisible:
    text: "今すぐ旅を始める"          # 買い切り選択で no-trial CTA
- tapOn:
    id: "paywall-plan-cta"
- assertVisible: "Sign In"            # StoreKit/sandbox 購入シート(sandbox tester で完了)
```
実行: `cd aniccaios && maestro test maestro/paywall_lifetime.yaml`
RED を先に（カード追加前は `assertVisible: "買い切り"` で失敗）→ コード後 GREEN。
> sandbox 実購入の最終確認は Dais の Xcode ▶ Run + sandbox tester `keiodaisuke@gmail.com`（fastlane 不可）。

---

## PHASE 6 — App Store スクショ更新（新 scroll UI + 3プラン）

- 新 UI（緑スクロール）+ 3プラン paywall を反映したスクショを EN/JA で用意（Dais が手動 or `asc-shots-pipeline`）。
- アップロード: `asc screenshots ...`（version 紐付け）。Lifetime IAP と JP 価格変更は**この version 提出と同時**に審査へ。

---

## PHASE 7 — finish（superpowers）

```bash
cd ../anicca-jp-pricing
git add -A && git commit -m "feat(paywall): add lifetime plan + JP price cut (¥500/¥2,000/¥5,000)"
git push -u origin feature/jp-pricing-lifetime
gh pr create --base dev --title "JP pricing + Lifetime 3-plan paywall" --body "..."
# adversary review(vcsdd) PASS + Maestro green + Dais 実機 sandbox 購入OK 後に dev→main
cd /Users/anicca/anicca-project && git worktree remove ../anicca-jp-pricing
```

---

## 検証チェックリスト（DONE 定義 = 4-D 収束）
- [ ] asc: JP monthly.b=¥500 / yearly.b=¥2,000（summary で確認）
- [ ] asc: lifetime IAP `ai.anicca.app.ios.lifetime` JP¥5,000 / US$99.99（pricing summary）
- [ ] RevenueCat: `ofrngb357e8cdb3` に `$rc_lifetime` package + entitlement `entlb820c43ab7` に lifetime product
- [ ] コード: PaywallVariantBView に3枚目カード描画 / 6言語 strings / status 修正
- [ ] Maestro: `買い切り` カード assertVisible 緑
- [ ] Dais 実機: sandbox で lifetime 購入→entitlement=pro 反映
- [ ] App Store: 新スクショ + version 提出（価格/IAP 同梱）

## 既知の注意
- 月¥500 ある為 年¥2,000 が「月4ヶ月分」=年が割安。意図通り(囲い込み)。前倒し現金重視なら paywall で年/買い切りを主役配置。
- Lifetime は global offering に入る為 **全テリトリ表示**（US も $99.99 で表示）。JP 限定にしたい場合は RevenueCat placement/targeting 追加が別途必要（今回は global 表示を採用）。
</content>
