# Factory Apps Resubmission Spec — 2026-04-15（R2）

**目標:** 9 アプリを App Store に再提出して **WAITING_FOR_REVIEW** に到達させる。

## 0. 現状サマリ（2026-04-15 確認済み）

| # | App | ASC ID | Version / State | Review State | 最大ブロッカー |
|---|-----|--------|-----------------|--------------|----------------|
| 1 | Thankful - Gratitude Journal | 6759514159 | 1.0.0 READY_FOR_DISTRIBUTION | COMPLETE | ロゴ差し替え + pricing + hard paywall → 1.0.1 |
| 2 | Dhamma Quotes | 6757726663 | 1.1.1 PREPARE_FOR_SUBMISSION | COMPLETE | JA スクショ英語のまま、EN スクショ緑バー、hard paywall、pricing |
| 3 | Cold Plunge Timer - FrostDip | 6760225278 | 1.0 **REJECTED** | UNRESOLVED_ISSUES | 2.1(b) IAP + 3.1.2(c) EULA + 2.1(b) purchase error |
| 4 | Zone2Daily | 6760271560 | 1.0 **REJECTED** | UNRESOLVED_ISSUES | 2.1(b) IAP + 3.1.2(c) EULA |
| 5 | Eye Break - EyeBreakIsland | 6760196743 | 1.0 **REJECTED** | UNRESOLVED_ISSUES | 2.1(b) IAP + **5.2.5 Dynamic Island** + 2.1(b) entitlement bug + 1.5 Support URL |
| 6 | Desk Stretch Timer | 6760048397 | 1.0 **REJECTED** | UNRESOLVED_ISSUES | 2.1(b) IAP + worktree 欠損 |
| 7 | Chi Daily: TCM Wellness Coach | 6759994539 | 1.0 PREPARE_FOR_SUBMISSION | — | 未提出。weekly なし。pricing 変更 |
| 8 | Micro-Mood | 6759877003 | 1.0 PREPARE_FOR_SUBMISSION | READY_FOR_REVIEW（inFlight=true） | **ソースが本リポに見つからない**。inFlight 中の submission を update |
| 9 | Affirm Well | 6759867998 | 1.0 PREPARE_FOR_SUBMISSION | READY_FOR_REVIEW（inFlight=true） | **サブスク 0 件**（IAP 未作成）。inFlight submission を update |

**共通ルートコーズ（Reject 4 件）:** 前回の factory 提出で `asc review items-add` が `appStoreVersions` だけを追加し、**IAP products を review submission に含めなかった**。今回は全アプリで items-add 時に in-app purchase product も追加する。

---

## 1. グローバル要件（9 アプリ全てに適用）

| 項目 | 値 |
|------|-----|
| サブスク構成 | **weekly $7.99 + annual $59.99 の 2 プランのみ** |
| Trial | **なし**。既存 Introductory Offer は全削除 |
| Paywall 種別 | **Hard paywall**。X / dismiss 禁止。Restore Purchases のみ許可 |
| 配置 | Onboarding 最終画面。`.interactiveDismissDisabled(true)` |
| Monthly | ASC 側は残してよいが **paywall / RC Offering に露出させない** |
| Screenshots | `app-store-screenshots` skill 必須。3 枚固定 × en-US + ja |
| EULA | **全アプリで Apple 標準 EULA リンクを App Description 末尾に追加**（`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`） |
| 審査用メモ | `asc review items-add` で **appStoreVersions に加えて subscription products も追加**。IAP App Review screenshot をアップロード |
| Support / Privacy URL | **全アプリで 200 を返すか検証必須**。404 なら anicca-products リポに HTML を追加して `gh` で push |
| ビルド | fastlane のみ。xcodebuild 直叩き禁止 |
| Xcode SDK | Xcode 26 + iOS 26 SDK |
| ITSAppUsesNonExemptEncryption | `NO` を Info.plist に（export compliance 自動化） |

---

## 2. Paywall 共通改修パッチ（SwiftUI アプリ用）

```diff
-    private enum PlanType { case monthly, annual }
+    private enum PlanType { case weekly, annual }
-    @State private var selectedPlan: PlanType = .annual
+    @State private var selectedPlan: PlanType = .annual

     var body: some View {
         VStack(spacing: 0) {
-            HStack {
-                Spacer()
-                Button { onDismiss() } label: {
-                    Image(systemName: "xmark.circle.fill")...
-                }
-                .accessibilityIdentifier("paywall_skip")
-            }
-            .padding(.horizontal, 20).padding(.top, 12)
+            // Hard paywall — no dismiss button
```

- `planCard(..., detail: L10n.annualTrial(...))` → `detail: nil`
- `L10n.annualPrice` → `"$59.99 / year"`、`L10n.weeklyPrice` → `"$7.99 / week"` を追加
- `RevenueCat.Offerings.current.availablePackages` から `weekly` と `annual` のみ pick
- Restore Purchases は残す（Apple 2.1 要件）
- Onboarding 最終画面の NavigationLink / sheet に `.interactiveDismissDisabled(true)`

### Entitlement bug（EyeBreak / FrostDip 向け）

```swift
// 購入成功後に customerInfo を再フェッチして UI を更新していない場合のパッチ
Purchases.shared.purchase(package: pkg) { _, customerInfo, _, _ in
    guard let info = customerInfo else { return }
    // BEFORE: `self.isPremium = info.entitlements["premium"]?.isActive == true` を呼んでなかった
    self.subscriptionManager.refresh(info)  // NEW: 同期的に isPremium を true に更新
    self.onPurchased()                       // NEW: paywall を閉じるではなく main 画面へ進む
}
```

---

## 3. IAP 共通オペレーション（全アプリ）

```bash
# 1. 既存サブスク確認
asc subscriptions pricing summary --app "$APP_ID"

# 2. グループ取得
asc subscriptions groups list --app "$APP_ID"

# 3. Weekly が未作成なら新規作成
asc subscriptions setup --app "$APP_ID" \
  --group-reference-name "Premium" \
  --reference-name "Weekly Premium" \
  --product-id "$PRODUCT_ID_WEEKLY" \
  --subscription-period ONE_WEEK \
  --locale "en-US" --display-name "Weekly" \
  --price "7.99" --price-territory USA \
  --territories all

# 4. Weekly 既存なら価格を 7.99 にアップデート
asc subscriptions pricing prices add --subscription-id "$WEEKLY_ID" --territory USA --price 7.99
asc subscriptions equalize-subscription-prices --subscription-id "$WEEKLY_ID"

# 5. Annual 価格を 59.99 にアップデート
asc subscriptions pricing prices add --subscription-id "$ANNUAL_ID" --territory USA --price 59.99
asc subscriptions equalize-subscription-prices --subscription-id "$ANNUAL_ID"

# 6. Introductory Offer（trial）全削除
asc subscriptions offers list --subscription-id "$ANNUAL_ID"
asc subscriptions offers delete --id "$INTRO_ID"
asc subscriptions offers list --subscription-id "$WEEKLY_ID"
asc subscriptions offers delete --id "$INTRO_ID"

# 7. IAP App Review screenshot アップロード（Reject 4 件で必須）
asc subscriptions review-screenshot upload --subscription-id "$WEEKLY_ID" --file ./iap-review.png
asc subscriptions review-screenshot upload --subscription-id "$ANNUAL_ID" --file ./iap-review.png

# 8. RevenueCat Offering を weekly + annual のみに再構成
mcp__revenuecat__list-offerings
mcp__revenuecat__attach-products-to-package  # weekly / annual
mcp__revenuecat__detach-products-from-package # monthly を外す
```

## 4. Review Submission 共通手順（IAP を必ず含める）

```bash
SUB=$(asc review submissions-create --app "$APP_ID" --platform IOS --json | jq -r .id)

# appStoreVersion を追加
asc review items-add --submission "$SUB" --item-type appStoreVersions --item-id "$VERSION_ID"

# ★ 前回漏れ ★ subscription products を追加
asc review items-add --submission "$SUB" --item-type subscriptions --item-id "$WEEKLY_ID"
asc review items-add --submission "$SUB" --item-type subscriptions --item-id "$ANNUAL_ID"

asc review submissions-submit --id "$SUB" --confirm
```

---

## 5. Screenshot 生成（3 枚固定 × 2 ロケール）

`/Users/anicca/anicca-project/.claude/skills/app-store-screenshots/` を使用。

1. 各アプリの `mobile-apps/<app>/screenshots-gen/` に Next.js scaffold
2. 実機/シミュレータ素材 PNG を `public/screenshots/{en,ja}/*.png` へ
3. `public/app-icon.png` にアイコン
4. `page.tsx` で 3 スライド（hero / differentiator / trust signal）
5. `?locale=en&theme=...&size=6.9` で export → 1320×2868
6. **Dhamma / Thankful の旧スクショは完全削除**。手撮り（モバイルホットスポット緑バー）禁止
7. `asc screenshots upload` で en-US / ja に各 3 枚

---

## 6. BLOCKING 前提条件（全作業前に解決）

1. ✅ **iris session**: `asc web auth status` → authenticated:true（2026-04-15 確認済）
2. ✅ **Rejection reasons 取得**: 4 件取得済（§7〜§10）
3. ⏳ **Micro-Mood ソース復旧**:
   ```bash
   find /Users -maxdepth 6 -type d -iname 'MicroMood*' 2>/dev/null
   find /Users -maxdepth 6 -type d -iname '*micromood*ios*' 2>/dev/null
   ssh cbns03@100.108.140.123 "find /Users/cbns03 -maxdepth 6 -type d -iname '*micromood*' 2>/dev/null"
   ```
4. ⏳ **DeskStretch worktree 復旧**:
   ```bash
   git worktree prune
   git worktree add /Users/anicca/anicca-deskstretch-fix -b feature/deskstretch-improvement origin/feature/deskstretch-improvement
   ```
5. ⏳ **anicca-products repo 取得**（support/privacy HTML 編集のため）:
   ```bash
   cd /Users/anicca && git clone git@github.com:Daisuke134/anicca-products.git
   ```
6. ⏳ **Keychain unlock**:
   ```bash
   source ~/.config/mobileapp-builder/.env && security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db
   ```

---

## 7. Cold Plunge Timer - FrostDip（REJECTED）

**ASC ID:** 6760225278 / **Version:** 1.0 / **Submission:** 938ac2bc-c4a4-40b9-82c2-3192fcaf3c3f
**Review date:** 2026-03-12 / **Device:** iPad Air 11-inch (M3) iPadOS 26.3.1
**Source:** `mobile-apps/20260307-223953-app/FrostDipios/` ✓

### Apple からの拒否理由（原文要約）

| # | Guideline | Issue |
|---|-----------|-------|
| 1 | **2.1(b) App Completeness** | "We are unable to complete the review of the app because one or more of the In-App Purchase products have not been submitted for review." |
| 2 | **3.1.2(c) Subscriptions** | "Missing: A functional link to the Terms of Use (EULA) in the App Description" |
| 3 | **2.1(b) App Completeness** | "The In-App Purchase products exhibited one or more bugs... we saw an error screen when trying to purchase in-app purchase product. (iPad Air 11, iPadOS 26.3.1)" |

### 現在の IAP

| product | period | price | state |
|---------|--------|-------|-------|
| com.aniccafactory.frostdip.weekly | 1W | $1.99 | READY_TO_SUBMIT |
| com.aniccafactory.frostdip.monthly | 1M | $6.99 | READY_TO_SUBMIT |
| com.aniccafactory.frostdip.annual | 1Y | $29.99 | READY_TO_SUBMIT |

### TODO

- [ ] **Paywall 改修** `Views/Onboarding/PaywallView.swift`: X 削除、weekly + annual 2 択、trial 削除、hard 化
- [ ] **Purchase bug 修正** `ViewModels/PaywallViewModel.swift`: iPad で発生した error screen の再現 → fix。RC SDK の `purchase(package:)` クロージャ内で `userCancelled` と error を切り分け、UI に `.alert` で表示。成功時は `subscriptionManager.refresh()` 呼び出し
- [ ] IAP: weekly $1.99→**$7.99**、annual $29.99→**$59.99**、monthly は paywall から外す
- [ ] Intro offer 全削除
- [ ] IAP App Review screenshot をアップロード（§3 step 7）
- [ ] **EULA リンクを App Description 末尾に追加**（en-US + ja）:
  ```
  Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
  Privacy Policy: https://daisuke134.github.io/anicca-products/frostdip/privacy-policy.html
  ```
- [ ] RC Offering: weekly + annual only
- [ ] Screenshots 再生成（3 枚 × 2 ロケール）
- [ ] `cd mobile-apps/20260307-223953-app/FrostDipios && fastlane ios release`
- [ ] `asc versions builds attach --version-id 291d2259-6d6a-45ff-8898-187bdb516810 --build-id $NEW`
- [ ] `asc screenshots upload` × 6
- [ ] `asc metadata push --app 6760225278 --version 1.0` で EULA 反映
- [ ] `greenlight preflight mobile-apps/20260307-223953-app` → CRITICAL=0
- [ ] `asc validate --app 6760225278` → Errors=0
- [ ] `asc review submissions-create` → items-add（version + 2 subs）→ `submissions-submit --confirm`
- [ ] **WAITING_FOR_REVIEW**

---

## 8. Zone2Daily（REJECTED）

**ASC ID:** 6760271560 / **Version:** 1.0 / **Submission:** a584a39d-bc60-4849-a23b-3d7fbb74fcc3
**Review date:** 2026-03-12 / **Device:** iPad Air 11-inch (M3)
**Source:** `mobile-apps/20260309-070017-app/zone2dailyios/` ✓

### Apple からの拒否理由

| # | Guideline | Issue |
|---|-----------|-------|
| 1 | **2.1(b)** | IAP products not submitted for review |
| 2 | **3.1.2(c)** | Missing EULA link in App Description |

### 現在の IAP

weekly $1.99 / monthly $4.99 / annual $29.99（全 READY_TO_SUBMIT）

### TODO

- [ ] Paywall 改修 `Views/Onboarding/PaywallView.swift`（§2）
- [ ] IAP: weekly **$7.99**、annual **$59.99**、intro 削除
- [ ] IAP App Review screenshot アップロード
- [ ] EULA リンクを en-US / ja 両方の App Description に追加
- [ ] Privacy Policy URL 404 チェック（404 なら anicca-products に追加）
- [ ] RC Offering: weekly + annual
- [ ] Screenshots 再生成
- [ ] fastlane ios release → builds attach
- [ ] `asc metadata push`
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 9. Eye Break - EyeBreakIsland（REJECTED — 最重症）

**ASC ID:** 6760196743 / **Version:** 1.0 / **Submission:** 3f28c788-4b36-477b-aa42-8bf1245f2efb
**Review date:** 2026-03-11 / **Device:** iPad Air 11 (M3) + iPhone 17 Pro Max
**Source:** `mobile-apps/20260307-002214-app/EyeBreakIslandios/` ✓

### Apple からの拒否理由（4 件）

| # | Guideline | Issue（確認済み） |
|---|-----------|-------------------|
| 1 | **2.1(b)** | IAP products not submitted for review |
| 2 | **5.2.5 IP** | "Terms for **Dynamic Island** in the app subtitle in an inappropriate manner" — **現 subtitle: `20-20-20 Rule, Dynamic Island` ← 確認済** |
| 3 | **2.1(b)** | "After successful purchase, we were still unable to access the locked features" — entitlement bug |
| 4 | **1.5 Safety** | Support URL https://daisuke134.github.io/anicca-products/eyebreakisland/support.html が **404**（確認済）|

### 現在の IAP

weekly $1.99 / monthly $4.99 / annual $29.99

### TODO

- [ ] **Subtitle 変更**: `20-20-20 Rule, Dynamic Island` → `20-20-20 Rule Eye Timer`（30 文字以内）
  ```bash
  # en-US + ja 両方
  asc metadata push --app 6760196743 --version 1.0
  ```
- [ ] **Description から "Dynamic Island" 削除**（"keeps the countdown in your Dynamic Island" 文言を `keeps the countdown always visible on your lock screen` に置換）
- [ ] **Support URL を 404 でなくする**: `anicca-products` リポに `eyebreakisland/support.html` と `eyebreakisland/privacy-policy.html` を追加 → `gh` で commit + push → GitHub Pages 反映確認（`curl -I` で 200）
- [ ] **Entitlement bug 修正** `EyeBreakIsland/Views/Onboarding/PaywallView.swift` + `ViewModels/PaywallViewModel.swift`: 購入完了後に `Purchases.shared.customerInfo` を再取得 → `subscriptionManager.isPremium = true` → `onPurchased()` で paywall を閉じ main 画面に遷移。TestFlight sandbox で一通り検証
- [ ] Paywall hard 化（§2）+ weekly/annual 構成
- [ ] IAP: weekly **$7.99**、annual **$59.99**、intro 削除
- [ ] IAP App Review screenshot アップロード
- [ ] EULA リンクを App Description に追加
- [ ] RC Offering: weekly + annual
- [ ] Screenshots 再生成
- [ ] fastlane ios release → builds attach
- [ ] `asc metadata push`（subtitle / description / supportUrl 含む）
- [ ] greenlight / asc validate → Errors=0
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 10. Desk Stretch Timer（REJECTED）

**ASC ID:** 6760048397 / **Version:** 1.0 / **Submission:** 4695b13c-2808-4f4e-8f06-ed4eef68f003
**Review date:** 2026-03-11 / **Device:** iPhone 17 Pro Max
**Source 問題:** `mobile-apps/desk-stretch/DeskStretchios` は `/Users/anicca/anicca-deskstretch-fix/DeskStretchios` へのシンボリックリンクだが worktree が prunable。git branch `feature/deskstretch-improvement` は残存

### Apple からの拒否理由（1 件のみ — 最軽症）

| # | Guideline | Issue |
|---|-----------|-------|
| 1 | **2.1(b)** | IAP products not submitted for review |

### 現在の IAP

monthly $4.99 / annual $29.99（weekly **未作成**）

### TODO

- [ ] **worktree 復旧**: `git worktree prune && git worktree add /Users/anicca/anicca-deskstretch-fix -b feature/deskstretch-improvement origin/feature/deskstretch-improvement`
- [ ] Paywall 改修（復旧後に場所特定、§2 準拠）
- [ ] IAP: weekly **$7.99** 新規作成、annual $29.99→**$59.99**、intro 削除
- [ ] IAP App Review screenshot アップロード
- [ ] EULA リンク追加
- [ ] Support / Privacy URL 検証
- [ ] RC Offering: weekly + annual
- [ ] Screenshots 再生成
- [ ] fastlane ios release → builds attach
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 11. Thankful - Gratitude Journal

**ASC ID:** 6759514159 / **現行 1.0.0:** READY_FOR_DISTRIBUTION（審査通過済）/ **新規作成必要 Version:** 1.0.1
**Source:** `mobile-apps/rork-thankful-gratitude-app/ThankfulGratitudeApp/` ✓
**Paywall:** `ThankfulGratitudeApp/Views/PaywallView.swift`（L22-32 に dismiss X、`PlanType { monthly, annual }`、`L10n.annualTrial` 使用）

### 現在の IAP

| product | period | price | state |
|---------|--------|-------|-------|
| thankful_monthly | 1M | $4.99 | APPROVED |
| thankful_annual | 1Y | $29.99 | APPROVED |

Weekly **未作成**。

### TODO

- [ ] **ロゴ 1024×1024 再作成**（safe area 余白確保。現行 `AppIcon.appiconset/icon.png`）
- [ ] Paywall 改修（§2）
- [ ] IAP: `thankful_weekly` を新規作成 $7.99、`thankful_annual` を $29.99→$59.99、intro 削除
- [ ] IAP App Review screenshot アップロード（initial 提出時に既に通過しているが、新 version で再要求される可能性高 → 事前に）
- [ ] EULA リンクを App Description に追加
- [ ] RC Offering: weekly + annual
- [ ] Screenshots 再生成（3 枚 × en-US + ja）
- [ ] `asc versions create --app 6759514159 --version 1.0.1 --copyright '2026 Anicca'`
- [ ] `cd mobile-apps/rork-thankful-gratitude-app && fastlane ios release`
- [ ] `asc versions builds attach --version-id $NEW --build-id $NEW_BUILD`
- [ ] `asc screenshots upload` × 6
- [ ] `asc metadata push --app 6759514159 --version 1.0.1`
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add（version + weekly + annual）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 12. Dhamma Quotes

**ASC ID:** 6757726663 / **Version:** 1.1.1 PREPARE_FOR_SUBMISSION
**Source:** `web-apps/daily-dhamma-app/`（Expo / React Native）
**Paywall:** `app/paywall.tsx`

### 既知の問題

- EN スクショ：手撮り iPhone。モバイルホットスポット緑バー写り込み → **全削除、再生成**
- JA スクショ：英語のまま → **日本語化して再生成**
- paywall hard 化、weekly 追加、trial 削除

### 現在の IAP

| product | period | price | state |
|---------|--------|-------|-------|
| com.dailydhamma.app.premium.monthly | 1M | $4.99 | APPROVED |
| com.dailydhamma.app.premium.yearly | 1Y | $19.99 | APPROVED |

Weekly **未作成**。

### TODO

- [ ] IAP: `com.dailydhamma.app.premium.weekly` 新規 $7.99、yearly $19.99→**$59.99**、intro 削除
- [ ] IAP App Review screenshot アップロード
- [ ] `app/paywall.tsx` hard 化（閉じるボタン削除、weekly + annual 2 択、trial テキスト削除）
- [ ] `locales/en.json` / `locales/ja.json` の paywall コピー更新
- [ ] **EN スクショ 3 枚新規生成**（Next.js `app-store-screenshots` skill。シミュレータで素材再撮影）
- [ ] **JA スクショ 3 枚新規生成**（`?locale=ja`、`ja.json` のコピー使用）
- [ ] EULA リンクを App Description に追加（en-US + ja）
- [ ] RC Offering: weekly + annual
- [ ] Expo build: `cd web-apps/daily-dhamma-app && eas build --platform ios --profile production`
- [ ] `asc versions builds attach --version-id 494a0f6a-de92-4d4f-bf48-402a36809cc1 --build-id $NEW`
- [ ] `asc screenshots upload` × 6
- [ ] `asc metadata push --app 6757726663 --version 1.1.1`
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add → submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 13. Chi Daily: TCM Wellness Coach

**ASC ID:** 6759994539 / **Version:** 1.0 PREPARE_FOR_SUBMISSION
**Source:** `mobile-apps/20260304-105016-app/ChiDailyios/` ✓
**Paywall:** `ChiDaily/Views/Paywall/PaywallView.swift`

### 現在の IAP

| product | period | price | state |
|---------|--------|-------|-------|
| com.aniccafactory.chidaily.monthly | 1M | $4.99 | READY_TO_SUBMIT |
| com.aniccafactory.chidaily.annual | 1Y | $34.99 | READY_TO_SUBMIT |

Weekly **未作成**。

### TODO

- [ ] `asc status --app 6759994539` で Build/Screenshot/Metadata/Privacy 欠損を確認
- [ ] Paywall 改修（§2）
- [ ] IAP: weekly **$7.99** 新規、annual $34.99→**$59.99**、intro 削除
- [ ] IAP App Review screenshot アップロード
- [ ] EULA リンク追加
- [ ] Privacy Policy URL を en-US / ja に設定（現行 URL を `curl -I` 検証）
- [ ] RC Offering: weekly + annual
- [ ] Screenshots 生成（3 枚 × 2 ロケール）
- [ ] fastlane ios release → builds attach
- [ ] `asc metadata push`
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 14. Micro-Mood（ソース欠損）

**ASC ID:** 6759877003 / **Version:** 1.0 PREPARE_FOR_SUBMISSION / **Review state:** READY_FOR_REVIEW（submission 6bf3dfba9 inFlight）
**重要:** 既に submission が READY_FOR_REVIEW でセットされている。が、現構成（monthly/annual/trial）で通す前提なので **weekly 追加と paywall 差し替えのため一度 remove → 再 add** する

### 現在の IAP

monthly $4.99 / annual $29.99（weekly 未作成）

### TODO

- [ ] **ソース探索**（本リポに無い）:
  ```bash
  find /Users -maxdepth 6 -type d -iname 'MicroMood*' 2>/dev/null
  find /Users -maxdepth 6 -type d -iname '*micromood*ios*' 2>/dev/null
  ssh cbns03@100.108.140.123 "find /Users/cbns03 -maxdepth 6 -type d -iname '*micromood*' 2>/dev/null"
  ```
- [ ] 見つからない場合: factory 再実行でスクラッチリビルド（`mobileapp-builder` skill / `ralph.sh`）
- [ ] inFlight submission を一旦削除: `asc review submissions-cancel --id bf3dfba9-023b-4a73-901c-9bacf416c30b`
- [ ] ソース確保後、Chi Daily と同手順
- [ ] Paywall 改修
- [ ] IAP: weekly $7.99、annual $59.99、intro 削除
- [ ] IAP App Review screenshot
- [ ] EULA リンク
- [ ] RC Offering
- [ ] Screenshots
- [ ] build + upload
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 15. Affirm Well

**ASC ID:** 6759867998 / **Version:** 1.0 PREPARE_FOR_SUBMISSION / **Review state:** READY_FOR_REVIEW（submission f4ecf156 inFlight）
**Source:** `mobile-apps/20260301-app/AffirmFlowios/` ✓
**Paywall:** `AffirmFlowios/Views/Paywall/PaywallView.swift`
**重要:** **サブスクが 0 件**（`asc subscriptions pricing summary` が空配列）→ IAP グループもない状態

### TODO

- [ ] inFlight submission を削除: `asc review submissions-cancel --id f4ecf156-21d9-417d-ab6c-c7ff334e752d`
- [ ] Subscription Group **新規作成**: `asc subscriptions groups create --app 6759867998 --reference-name "Premium"`
- [ ] Weekly 新規: `asc subscriptions setup ... --product-id com.anicca.affirmflow.weekly --price 7.99 --subscription-period ONE_WEEK`
- [ ] Annual 新規: `asc subscriptions setup ... --product-id com.anicca.affirmflow.annual --price 59.99 --subscription-period ONE_YEAR`
- [ ] IAP App Review screenshot
- [ ] Paywall 改修（§2）
- [ ] RevenueCat: Project 作成 → Products / Offering / Package 設定
- [ ] EULA リンク
- [ ] Screenshots（3 × 2）
- [ ] fastlane ios release → builds attach
- [ ] `asc metadata push`
- [ ] greenlight / asc validate
- [ ] submissions-create → items-add（version + 2 subs）→ submit --confirm
- [ ] **WAITING_FOR_REVIEW**

---

## 16. 実行順序（推奨）

| Phase | Apps | 理由 |
|-------|------|------|
| **Phase 0** | 前提条件 | iris auth ✅、worktree 復旧、MicroMood 探索、anicca-products clone、Keychain unlock |
| **Phase 1（シンプル）** | DeskStretch | Reject 1 件のみ。IAP 追加と items-add 修正だけで通る |
| **Phase 2（中難度）** | Zone2Daily, FrostDip | EULA + IAP App Review screenshot。FrostDip は追加で purchase bug 修正 |
| **Phase 3（重症）** | EyeBreakIsland | 4 件修正（subtitle / description / supportURL / entitlement bug） |
| **Phase 4（新規 version）** | Thankful | 1.0.1 新規作成 + ロゴ差し替え |
| **Phase 5（React Native）** | Dhamma Quotes | スクショ全再生成（最も時間かかる） |
| **Phase 6（未提出）** | Chi Daily, Affirm Well | Affirm Well はサブスク 0 からセットアップ |
| **Phase 7（ブロック解決後）** | Micro-Mood | ソース復旧が大前提 |

**並行実行可:** Phase 1〜5 は互いに独立（別ディレクトリ、別 ASC ID）なので worktree を分けて並列作業できる。Phase 6/7 はブロック解決後。

1 アプリ ≒ `paywall 改修 + IAP 価格更新 + RC + screenshots + build + submit` で 2〜3 時間（screenshot 生成が律速）。

---

## 17. 品質ゲート（submit 直前の必須チェック）

```bash
greenlight preflight mobile-apps/<app-dir>   # CRITICAL=0
asc validate --app <APP_ID> --output json    # Errors=0
curl -I <supportUrl>                         # 200
curl -I <privacyPolicyUrl>                   # 200
```

全て GREEN でない限り `submissions-submit --confirm` しない。

## 18. 作業完了の定義

9 アプリ全てが `asc review submissions-get --app <APP_ID>` で **WAITING_FOR_REVIEW** を返すこと。
