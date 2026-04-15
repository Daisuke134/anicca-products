# Factory Apps Resubmission Spec — 2026-04-15

**目標:** 9 アプリを App Store に再提出して `WAITING_FOR_REVIEW` に到達させる。

## グローバル要件（9 アプリ全てに適用）

| 項目 | 値 |
|------|-----|
| サブスク構成 | **weekly $7.99 + annual $59.99 の2プランのみ** |
| Trial | **なし**（全プランから削除。旧 3-day free trial を廃止） |
| Paywall 種別 | **Hard paywall — X / dismiss / restore 以外の閉じるUI禁止** |
| 配置 | Onboarding 最終画面。通過しないと main screen に入れない |
| Monthly プラン | ASC 側は残してよいが **paywall と Offering に露出させない** |
| Screenshots | [app-store-screenshots](../../.claude/skills/app-store-screenshots/SKILL.md) スキル必須。3 画面固定。en-US + ja の 2 ロケール |
| ビルド | fastlane のみ。xcodebuild 直叩き禁止 |
| Xcode SDK | Xcode 26 + iOS 26 SDK（2026-04-28 以降必須、早めに揃える） |

### サブスク変更コマンド（全アプリ共通テンプレート）

各アプリで下記 4 ステップを実施（APP_ID / GROUP_ID / SUB_ID は置換）。

```bash
# 1. ASC グループとサブスクID取得
asc subscriptions groups list --app "$APP_ID"
asc subscriptions list --group-id "$GROUP_ID"

# 2. 既存 Weekly があれば価格を更新。無ければ作成（availability BEFORE pricing）
#    → asc subscriptions pricing prices add --subscription-id "$WEEKLY_ID" --territory USA --price 7.99
#    → 価格は 175 カ国にレプリケート
asc subscriptions setup --app "$APP_ID" \
  --group-reference-name "Premium" \
  --reference-name "Weekly Premium" \
  --product-id "$PRODUCT_ID_WEEKLY" \
  --subscription-period ONE_WEEK \
  --locale "en-US" --display-name "Weekly" \
  --price "7.99" --price-territory USA \
  --territories "全175カ国"

# 3. 既存 Annual の価格を 59.99 に更新
asc subscriptions pricing prices add --subscription-id "$ANNUAL_ID" --price-point "<PRICE_POINT_FOR_59.99_USA>"
# 全175カ国に equalize
asc subscriptions equalize-subscription-prices --subscription-id "$ANNUAL_ID"

# 4. Trial（Introductory Offer）削除
#    → asc subscriptions offers の intro offer を削除
asc subscriptions offers list --subscription-id "$ANNUAL_ID"
asc subscriptions offers delete --id "$INTRO_OFFER_ID"
asc subscriptions offers list --subscription-id "$WEEKLY_ID"
asc subscriptions offers delete --id "$INTRO_OFFER_ID"

# 5. RevenueCat 側 Offering を weekly + annual のみに組み替え
mcp__revenuecat__list-offerings  # 該当 RC プロジェクト
mcp__revenuecat__attach-products-to-package  # weekly + annual のみ
mcp__revenuecat__detach-products-from-package  # monthly を外す
```

### Paywall 共通改修パッチ（SwiftUI アプリ）

旧: `PlanType { monthly, annual }` + dismiss X ボタン + trial 表示
新: `PlanType { weekly, annual }` + X ボタン削除 + trial テキスト削除

```diff
-    @State private var selectedPlan: PlanType = .annual
-    private enum PlanType { case monthly, annual }
+    @State private var selectedPlan: PlanType = .annual
+    private enum PlanType { case weekly, annual }

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

- `planCard(... detail: L10n.annualTrial(language))` → `detail: nil`
- `L10n.annualPrice` → `"$59.99 / year"`, `L10n.weeklyPrice` → `"$7.99 / week"`
- `RevenueCat.Offerings.current.availablePackages` から `weekly` と `annual` のみを pick
- `Restore Purchases` ボタンは paywall 内に残す（Apple 2.1 要件）
- `onDismiss` closure は呼ばれないので削除可
- Onboarding Navigation の `PaywallView` への遷移は `.interactiveDismissDisabled(true)` を付与

### Screenshot 生成（3 枚固定 × 2 ロケール）

`/Users/anicca/anicca-project/.claude/skills/app-store-screenshots/` を使用し、Next.js ジェネレータで生成。

各アプリの `mobile-apps/<app>/screenshots-gen/` に Next.js プロジェクトを scaffold。

手順:
1. 実機/シミュレータの app 素材 PNG を `public/screenshots/{en,ja}/*.png` に配置
2. `public/app-icon.png` にアイコン配置
3. `page.tsx` で 3 スライド定義（hero / differentiator / trust signal）
4. `bun dev` → ブラウザで `?locale=en&size=6.9` 等を切り替えて export
5. 6.9" (1320×2868) を生成、Apple は 6.5" / 6.3" へ自動ダウンスケール
6. **Dhamma と Thankful の旧スクショは完全削除**。**モバイルホットスポット緑バー写り込みの手撮り画像は禁止**
7. `asc screenshots upload` で en-US と ja に個別アップロード

---

## アプリ別状態と TODO

| # | App | ASC ID | Version | State | Blocker |
|---|-----|--------|---------|-------|---------|
| 1 | Thankful - Gratitude Journal | 6759514159 | 1.0.0 | **READY_FOR_DISTRIBUTION** | 新バージョン 1.0.1 でロゴ + paywall + pricing 差し替え |
| 2 | Dhamma Quotes | 6757726663 | 1.1.1 | PREPARE_FOR_SUBMISSION | JA スクショ英語のまま、EN スクショに緑バー、paywall + pricing |
| 3 | Cold Plunge Timer - FrostDip | 6760225278 | 1.0 | **REJECTED** | 拒否理由未取得（iris auth 必要） + paywall + pricing |
| 4 | Zone2Daily | 6760271560 | 1.0 | **REJECTED** | 拒否理由未取得 + paywall + pricing |
| 5 | Eye Break - EyeBreakIsland | 6760196743 | 1.0 | **REJECTED** | 拒否理由未取得 + paywall + pricing |
| 6 | Desk Stretch Timer | 6760048397 | 1.0 | **REJECTED** | 拒否理由未取得 + **ソース worktree が prunable（復旧必要）** |
| 7 | Chi Daily: TCM Wellness Coach | 6759994539 | 1.0 | PREPARE_FOR_SUBMISSION | 未提出（build/screenshot/metadata 未確認）+ paywall + pricing |
| 8 | Micro-Mood | 6759877003 | 1.0 | PREPARE_FOR_SUBMISSION | **ソースコードが本リポジトリに存在しない（要復旧）** |
| 9 | Affirm Well | 6759867998 | 1.0 | PREPARE_FOR_SUBMISSION | 未提出。ソースあり（20260301-app/AffirmFlowios）|

### BLOCKING 前提条件（全作業前に解決）

1. **iris session**: `! asc web auth login --apple-id keiodaisuke@gmail.com` をユーザーに実行してもらう。完了後 `asc web auth status` で `authenticated: true` を確認
2. **Rejection reasons 取得**: 上記 login 後、4 アプリ分の拒否理由を取得
   ```bash
   for id in 6760225278 6760271560 6760196743 6760048397; do
     echo "=== $id ==="
     asc web review show --app $id --apple-id keiodaisuke@gmail.com
   done
   ```
3. **MicroMood ソース復旧**: 本リポジトリに存在しない。ビルドマシン上の過去工場出力を探すか、スクラッチで再ビルド。ASC 側の 1.0 は PREPARE_FOR_SUBMISSION なので「空のプロジェクト再ビルド → 新 build 上書き」で進められる
4. **DeskStretch worktree 復旧**:
   ```bash
   git worktree prune
   git worktree add /Users/anicca/anicca-deskstretch-fix -b feature/deskstretch-improvement origin/feature/deskstretch-improvement
   ```
5. **Keychain**: `source ~/.config/mobileapp-builder/.env && security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db`

---

## 1. Thankful - Gratitude Journal

**現状:** v1.0.0 が READY_FOR_DISTRIBUTION（審査通過済み）。Icon が画面にフィットせず美観不良。

**Paywall 実体** (`ThankfulGratitudeApp/Views/PaywallView.swift`):
- L22-32 に X ボタンあり → **削除**
- `PlanType { monthly, annual }` → `{ weekly, annual }`
- L68 `L10n.annualTrial(language)` → `detail: nil`（trial 表記削除）
- L10n 辞書の `annualPrice` / `weeklyPrice` を新価格に更新

**現在の IAP:**
- `thankful_monthly` $4.99 APPROVED
- `thankful_annual` $29.99 APPROVED
- Weekly なし → 新規作成必要

**TODO:**
- [ ] Icon 1024×1024 再作成（現行 `AppIcon.appiconset/icon.png`。safe area・余白を考慮）
- [ ] IAP: `thankful_weekly` を `asc subscriptions setup` で新規作成 ($7.99)
- [ ] IAP: `thankful_annual` の価格を $59.99 に更新（`asc subscriptions pricing prices add` → equalize）
- [ ] IAP: 既存 Intro Offer（trial）を削除
- [ ] RevenueCat: Thankful プロジェクトの Offering を weekly + annual のみに再構成
- [ ] Paywall 改修（上記パッチ）
- [ ] `asc versions create --app 6759514159 --version 1.0.1`
- [ ] `cd mobile-apps/rork-thankful-gratitude-app && fastlane ios release`（IPA アップロード）
- [ ] `asc versions builds attach --version-id $NEW_VERSION --build-id $NEW_BUILD`
- [ ] Screenshots 再生成（app-store-screenshots、3枚）→ `asc screenshots upload`
- [ ] `asc validate --app 6759514159` が Errors=0
- [ ] `asc review submissions-create --app 6759514159 --platform IOS`
- [ ] `asc review items-add --submission $SUB_ID --item-type appStoreVersions --item-id $NEW_VERSION`
- [ ] `asc review submissions-submit --id $SUB_ID --confirm` → **WAITING_FOR_REVIEW**

---

## 2. Dhamma Quotes

**現状:** v1.1.0 READY_FOR_DISTRIBUTION / v1.1.1 PREPARE_FOR_SUBMISSION。Expo プロジェクト（`web-apps/daily-dhamma-app/`）。

**問題:**
- **EN スクショ**: 手撮り（iPhone hotspot の緑バー写り込み）→ **削除、再生成**
- **JA スクショ**: 英語のまま（ローカライズされていない）→ **削除、日本語版を新規生成**
- **Paywall** (`app/paywall.tsx` → React Native): hard 化、weekly 追加、trial 削除

**現在の IAP:**
- `com.dailydhamma.app.premium.monthly` $4.99 APPROVED
- `com.dailydhamma.app.premium.yearly` $19.99 APPROVED
- Weekly なし → 新規作成必要

**TODO:**
- [ ] IAP: `com.dailydhamma.app.premium.weekly` 新規作成 ($7.99)
- [ ] IAP: yearly の価格を $59.99 に更新
- [ ] IAP: Intro Offer（trial）削除
- [ ] RevenueCat: Offering を weekly + annual のみに再構成
- [ ] `app/paywall.tsx` を hard 化（閉じるボタン削除、weekly プラン追加、trial テキスト削除）
- [ ] ローカライズ辞書（`locales/en.json`, `locales/ja.json`）の paywall コピー更新
- [ ] **EN スクショ**: Next.js で 3 枚生成（hero / feature / trust signal）。素材はシミュレータで取り直し
- [ ] **JA スクショ**: 同じ Next.js で `?locale=ja`、ja 素材を配置して生成
- [ ] Expo build: `eas build --platform ios --profile production`
- [ ] `asc versions builds attach --version-id 494a0f6a-de92-4d4f-bf48-402a36809cc1 --build-id $NEW_BUILD`
- [ ] `asc screenshots upload --version-localization <en-US> --file ...` × 3 枚
- [ ] `asc screenshots upload --version-localization <ja> --file ...` × 3 枚
- [ ] `asc validate --app 6757726663` → Errors=0
- [ ] `asc review submissions-create` → `items-add` → `submissions-submit --confirm` → **WAITING_FOR_REVIEW**

---

## 3. Cold Plunge Timer - FrostDip

**現状:** v1.0 REJECTED。拒否理由は **要 iris auth で取得（上記 BLOCKING 2）**。

**ソース:** `mobile-apps/20260307-223953-app/FrostDipios/` — 存在 ✓

**現在の IAP:** weekly $1.99 / monthly $6.99 / annual $29.99（全て READY_TO_SUBMIT）

**TODO:**
- [ ] 拒否理由取得 → 本スペックに追記 → 該当する修正を反映
- [ ] Paywall 改修（`Views/Onboarding/PaywallView.swift`）: X 削除、weekly + annual 2 択、trial 削除
- [ ] IAP: weekly $1.99 → $7.99、annual $29.99 → $59.99、intro offer 削除
- [ ] RC Offering: weekly + annual only
- [ ] Screenshots 再生成（3枚、en-US + ja）
- [ ] `cd mobile-apps/20260307-223953-app/FrostDipios && fastlane ios release`
- [ ] `asc versions builds attach`
- [ ] `asc screenshots upload` × 6（3×2 ロケール）
- [ ] `asc validate --app 6760225278` → Errors=0
- [ ] 既存 REJECTED version をそのまま再提出するため `asc review submissions-create` → items-add → submissions-submit → **WAITING_FOR_REVIEW**

---

## 4. Zone2Daily

**現状:** v1.0 REJECTED。拒否理由 **要取得**。

**ソース:** `mobile-apps/20260309-070017-app/zone2dailyios/` — 存在 ✓

**現在の IAP:** weekly $1.99 / monthly $4.99 / annual $29.99

**TODO:** FrostDip と同一手順（Paywall 改修 → IAP 価格更新 → RC → screenshots → fastlane → validate → submit）
- [ ] 拒否理由取得
- [ ] Paywall (`Views/Onboarding/PaywallView.swift`) 改修
- [ ] IAP 価格更新 + intro 削除
- [ ] RC Offering 再構成
- [ ] Screenshots 再生成
- [ ] ビルド & upload
- [ ] validate → review submission → submit → **WAITING_FOR_REVIEW**

---

## 5. Eye Break - EyeBreakIsland

**現状:** v1.0 REJECTED。拒否理由 **要取得**。

**ソース:** `mobile-apps/20260307-002214-app/EyeBreakIslandios/` — 存在 ✓

**現在の IAP:** weekly $1.99 / monthly $4.99 / annual $29.99

**TODO:** 同一手順
- [ ] 拒否理由取得
- [ ] Paywall (`EyeBreakIsland/Views/Onboarding/PaywallView.swift`) 改修
- [ ] IAP 価格更新
- [ ] RC Offering
- [ ] Screenshots
- [ ] Build / upload / attach
- [ ] validate → submit → **WAITING_FOR_REVIEW**

---

## 6. Desk Stretch Timer

**現状:** v1.0 REJECTED。拒否理由 **要取得**。

**ソース問題:** `mobile-apps/desk-stretch/DeskStretchios` は `/Users/anicca/anicca-deskstretch-fix/DeskStretchios` へのシンボリックリンクだが、worktree が `prunable`（ディレクトリ実体なし）。git branch は残っている。

**現在の IAP:** monthly $4.99 / annual $29.99（weekly 未作成）

**TODO:**
- [ ] worktree 復旧: `git worktree prune && git worktree add /Users/anicca/anicca-deskstretch-fix -b feature/deskstretch-improvement origin/feature/deskstretch-improvement`
- [ ] 拒否理由取得
- [ ] Paywall 改修（該当ファイルは復旧後に特定）
- [ ] IAP: weekly 新規 $7.99、annual $59.99、intro 削除
- [ ] RC Offering
- [ ] Screenshots 再生成
- [ ] fastlane build + upload
- [ ] validate → submit → **WAITING_FOR_REVIEW**

---

## 7. Chi Daily: TCM Wellness Coach

**現状:** v1.0 PREPARE_FOR_SUBMISSION（審査未到達）。

**ソース:** `mobile-apps/20260304-105016-app/ChiDailyios/` — 存在 ✓

**現在の IAP:** monthly $4.99 / annual $34.99（weekly 未作成）

**TODO:**
- [ ] `asc status --app 6759994539` で Build/Screenshot/Metadata/Privacy の欠損を特定
- [ ] Paywall (`ChiDaily/Views/Paywall/PaywallView.swift`) 改修
- [ ] IAP: weekly $7.99 新規、annual $34.99→$59.99、intro 削除
- [ ] RC Offering
- [ ] Screenshots 生成（3枚、en-US + ja）
- [ ] Privacy Policy URL を en-US + ja 両方に設定
- [ ] fastlane build + upload
- [ ] `asc validate --app 6759994539` → Errors=0
- [ ] submissions-create → items-add → submit → **WAITING_FOR_REVIEW**

---

## 8. Micro-Mood

**現状:** v1.0 PREPARE_FOR_SUBMISSION。**ソースコードが本リポジトリに見つからない**（`com.anicca.micromood` で検索しても `20260307-002214-app/spec/01-trend.md` しかヒットしない）。

**現在の IAP:** monthly $4.99 / annual $29.99（weekly 未作成）

**TODO:**
- [ ] **ソース復旧**: Mac Mini 上の他の factory 出力ディレクトリを探索、または工場を再実行してスクラッチビルド
    ```bash
    ssh cbns03@100.108.140.123 "find /Users/cbns03 -maxdepth 5 -type d -iname '*micromood*' 2>/dev/null"
    find /Users -maxdepth 6 -type d -iname 'MicroMood*ios*' 2>/dev/null
    ```
- [ ] ソース確保後、以降は Chi Daily と同手順
- [ ] Paywall 改修
- [ ] IAP: weekly $7.99 新規、annual $59.99、intro 削除
- [ ] RC Offering
- [ ] Screenshots
- [ ] Build + upload
- [ ] validate → submit → **WAITING_FOR_REVIEW**

---

## 9. Affirm Well

**現状:** v1.0 PREPARE_FOR_SUBMISSION。

**ソース:** `mobile-apps/20260301-app/AffirmFlowios/` — 存在 ✓
**Paywall:** `AffirmFlowios/Views/Paywall/PaywallView.swift`

**現在の IAP:** 要 `asc subscriptions pricing summary --app 6759867998` 再確認（前回出力が truncate されたため）

**TODO:**
- [ ] IAP 現状確認 → 必要なプラン作成 / 価格更新
- [ ] Paywall 改修
- [ ] RC Offering
- [ ] Screenshots
- [ ] Build + upload
- [ ] validate → submit → **WAITING_FOR_REVIEW**

---

## 実行順序（推奨）

1. **前提条件クリア**（iris auth、MicroMood ソース探索、DeskStretch worktree 復旧、Keychain unlock）
2. **拒否理由取得**（FrostDip / Zone2 / EyeBreak / DeskStretch の 4 件）
3. **ソースありで並行実行可**（Affirm Well / Chi Daily / FrostDip / Zone2 / EyeBreak / Thankful / Dhamma）
4. **ブロッカー解決後**（MicroMood / DeskStretch）

1 アプリ ≒ `paywall 改修 + IAP 価格更新 + RC + screenshots + build + submit` で約 2〜3 時間（screenshot 生成が律速）。

## Green Light / 品質ゲート

各アプリ submit 直前に:
```bash
greenlight preflight mobile-apps/<app-dir>   # CRITICAL=0 確認
asc validate --app <APP_ID>                  # Errors=0 確認
```

両方 GREEN でない限り `submissions-submit --confirm` しない。
