# Thankful Gratitude App — App Store 提出 Complete Spec

**作成日:** 2026-02-23（2026-02-22 版を全面更新）
**ステータス:** 実装中（一部完了済み）
**目標:** App Store に提出して WAITING_FOR_REVIEW にする

---

## 開発環境

| 項目 | 値 |
|------|-----|
| プロジェクトパス | `/Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app/` |
| Xcodeプロジェクト | `ThankfulGratitudeApp.xcodeproj` |
| Bundle ID | `app.rork.thankful-gratitude-app` |
| ASC App ID | `6759514159` |
| 現バージョン | `1.0.0 (1)` |
| Team ID | `S5U8UH3JLJ` |

---

## 確定済みデータ

| 項目 | 値 |
|------|-----|
| RC Project | `proj7aaf9429` (Thankful) |
| RC iOS Public API Key | `appl_pcZedDwIwXVSSdEugQZPMBormtl` |
| Monthly ASC Sub ID | `6759938150` |
| Annual ASC Sub ID | `6759938154` |
| Monthly product ID | `app.rork.thankful-gratitude-app.premium.monthly` |
| Annual product ID | `app.rork.thankful-gratitude-app.premium.yearly` |
| Monthly price | $4.99/月、7日無料トライアル |
| Annual price | $29.99/年、7日無料トライアル |
| Pricing territories | 174カ国設定済み |
| ASC API Key ID | `D637C7RGFN`（p8: `~/Downloads/AuthKey_D637C7RGFN.p8`） |
| Issuer ID | `f53272d9-c12d-4d9d-811c-4eb658284e74` |
| IAP Key ID | `AY9BT5R8NU`（RC 連携用、全アプリ共通） |

---

## 完了済み（このセッションまでに完了）

| # | 完了済みタスク |
|---|--------------|
| ✅ | Config.swift に RC API Key 設定（`appl_pcZedDwIwXVSSdEugQZPMBormtl`） |
| ✅ | SwiftData fatalError → graceful fallback |
| ✅ | IPHONEOS_DEPLOYMENT_TARGET = 17.0 |
| ✅ | PrivacyInfo.xcprivacy 追加（Greenlight ITMS-91061 対応） |
| ✅ | Fastlane セットアップ（Gemfile / Appfile / Fastfile） |
| ✅ | IPA ビルド + ASC アップロード完了（ビルド VALID） |
| ✅ | ASC アプリ作成（App ID: 6759514159） |
| ✅ | Monthly + Annual サブスクリプション作成 |
| ✅ | Territory availability set（USA, JPN + available in new territories） |
| ✅ | 174カ国価格設定（Monthly $4.99 / Annual $29.99） |
| ✅ | 7日間無料トライアル（USA + JPN） |
| ✅ | サブスク localization（en-US + ja、Monthly + Annual） |
| ✅ | Privacy Policy URL（en-US + ja 両方設定済み） |
| ✅ | TestFlight グループ作成 + Daisuke 招待 |
| ✅ | ASC メタデータ（英語のみ）設定済み |

---

## 受け入れ条件（FINAL）

| # | 条件 | 確認方法 |
|---|------|---------|
| AC1 | `asc review submissions-list` で state = WAITING_FOR_REVIEW | CLI |
| AC2 | Monthly + Annual 両方が READY_TO_SUBMIT | `asc subscriptions get --id` |
| AC3 | Monthly + Annual それぞれに IAP Review Screenshot 添付済み | create が "already exists" を返す |
| AC4 | `asc validate subscriptions` で blocking = 0 | CLI |
| AC5 | Greenlight CRITICAL = 0 | `greenlight preflight .` |
| AC6 | RC Offerings に "default" が Current に設定済み | RC Dashboard 目視確認 |
| AC7 | App icon が ASC にアップロード済み（1024×1024） | ASC 目視確認 |
| AC8 | App Store Screenshots x3 が en-US にアップロード済み | ASC 目視確認 |
| AC9 | 日本語 UI が削除され全画面英語のみ | シミュレータ目視確認 |

---

## 残タスク（優先順高い順）

---

### TASK 1: 日本語 UI 削除（英語オンリー化）

**Why:** ユーザー指示。日本語ローカライズは工数対効果が低いのでカット。

| 項目 | 詳細 |
|------|------|
| **As-Is** | `AppLanguage` enum に `.japanese` がある。UI に言語切り替えがある |
| **To-Be** | 日本語 option を削除、英語固定、言語切り替え UI を削除 |
| **作業ファイル** | `Strings.swift`, `SettingsView.swift`, `AppViewModel.swift`, `AppLanguage.swift`（または類似ファイル） |

**具体的な変更:**
- `AppLanguage` enum から `.japanese` を削除（`.english` のみ残す）
- `Strings.swift` の switch 文の japanese ケースを削除
- `SettingsView` の言語切り替え UI コンポーネントを削除
- `UserDefaults` に保存している language キーの初期値を `"english"` に固定

---

### TASK 2: App Icon 生成（1024×1024）

**Why:** アイコンなしでは App Store に掲載不可。現在のアイコンはデフォルトまたは空。

| 項目 | 詳細 |
|------|------|
| **As-Is** | アイコン未設定 or デフォルト（"icon sucks"） |
| **To-Be** | 1024×1024 PNG が `Assets.xcassets/AppIcon.appiconset/` に設定済み |
| **生成方法** | infsh FLUX で AI 生成 |

**生成プロンプト:**
```
Thankful gratitude journal iOS app icon. Minimalist design.
A warm golden sun rising over gentle hills, soft gradient sky from deep blue to golden yellow.
Abstract, meditative mood. No text. Square format. 1024x1024. Premium App Store ready.
```

**コマンド:**
```bash
INFSH_API_KEY="1nfsh-626an14fkjpbj96s129v3vbhkp" infsh app run falai/flux-dev-lora --input '{
  "prompt": "Thankful gratitude journal iOS app icon. Minimalist warm golden sunrise design. Deep blue to golden gradient background. No text. Square format. Premium App Store ready.",
  "width": 1024,
  "height": 1024
}'
# → 出力 URL を curl でダウンロード → icon-1024.png として保存
# → xcassets に配置
```

---

### TASK 3: IAP Review Screenshot（MISSING_METADATA 解消の鍵）

**Why:** IAP Review Screenshot がないと Monthly/Annual が MISSING_METADATA のまま → 提出不可。これが一番のブロッカー。

| 項目 | 詳細 |
|------|------|
| **As-Is** | Monthly + Annual 両方に Screenshot なし → MISSING_METADATA |
| **To-Be** | 各サブスクに Screenshot アップロード済み → READY_TO_SUBMIT |

**手順:**
```bash
# Step 1: シミュレータ起動
xcrun simctl boot "iPhone 16" || true
open /Applications/Simulator.app

# Step 2: アプリをシミュレータにインストール
xcrun simctl install booted <APP_PATH>  # ビルド済み .app パス
xcrun simctl launch booted app.rork.thankful-gratitude-app

# Step 3: AXe でペイウォール画面まで操作してスクショ撮影
axe describe-ui --udid booted
axe screenshot --output ./paywall-review.png --udid booted

# Step 4: Monthly + Annual それぞれにアップロード
asc subscriptions review-screenshots create \
  --subscription-id "6759938150" --file "./paywall-review.png"

asc subscriptions review-screenshots create \
  --subscription-id "6759938154" --file "./paywall-review.png"
# "already exists" エラー = 正常（既にアップロード済み）
```

---

### TASK 4: RC Offerings 設定（TestFlight IAP エラー解消）

**Why:** RC Offerings が未設定だと TestFlight + App Review で「Apple IAP key is invalid」になる。課金できないアプリは審査でリジェクトされる。

**これは手動で RC Dashboard から行う（MCP が Thankful RC プロジェクトにアクセスできないため）:**

| # | 手順 | 詳細 |
|---|------|------|
| 1 | RC Dashboard を開く | https://app.revenuecat.com |
| 2 | Thankful プロジェクトを選択 | `proj7aaf9429` |
| 3 | Products を確認 | `thankful_annual` / `thankful_monthly` が存在することを確認 |
| 4 | Offerings → New Offering | Identifier: `default`, Display Name: `Default` |
| 5 | Packages を追加 | `$rc_annual` → `thankful_annual`、`$rc_monthly` → `thankful_monthly` |
| 6 | Offering を Current に設定 | "Make Current" ボタンをクリック |
| 7 | IAP Key 確認 | ASC API Key: `D637C7RGFN`（Valid credentials 確認済みのはず） |

**確認コマンド（設定後）:**
```bash
# RC v2 API で Offerings を確認
curl -s -H "Authorization: Bearer $THANKFUL_APP_RC_V2_SECRET_KEY" \
  "https://api.revenuecat.com/v2/projects/proj7aaf9429/offerings" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);[print(o['lookup_key'], o.get('is_current')) for o in d['items']]"
# "default" True が返れば OK
```

---

### TASK 5: App Store Screenshots x3（1290×2796）

**Why:** Screenshots なしでは App Store ページが作れない。提出に必須。

| 項目 | 詳細 |
|------|------|
| **サイズ** | 1290×2796（iPhone 16 Pro Max） |
| **枚数** | 3枚（en-US） |
| **スタイル** | Deep navy 背景（#0A0F28 → #1E3250）+ Gold テキスト（#FFC107） |

**3枚の構成:**

| 枚 | コピー | 画面 |
|----|--------|------|
| 1 | "Start each day with gratitude" | メイン日記画面 |
| 2 | "Build a streak that lasts" | カレンダー/ストリーク画面 |
| 3 | "Reflect. Grow. Be thankful." | Paywall または統計画面 |

**手順:**
```bash
# Step 1: シミュレータで各画面のスクショを撮影
xcrun simctl launch booted app.rork.thankful-gratitude-app
axe screenshot --output ./raw/screen1.png --udid booted
# 各画面に移動して screen2.png, screen3.png を撮影

# Step 2: PIL で 1290×2796 に合成 + テキスト重ね
python3 .claude/skills/mobileapp-builder/scripts/make_screenshots.py \
  --raw1 ./raw/screen1.png \
  --raw2 ./raw/screen2.png \
  --raw3 ./raw/screen3.png \
  --output-dir ./screenshots/

# Step 3: ASC にアップロード
asc metadata screenshots upload \
  --app-id "6759514159" \
  --locale "en-US" \
  --display-type IPHONE_67 \
  --file "./screenshots/shot1.png"
# shot2.png, shot3.png も同様
```

---

### TASK 6: Greenlight Preflight（CRITICAL = 0 確認）

**Why:** CRITICAL が残っていたら提出禁止。必ず通す。

```bash
cd /Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app
/tmp/greenlight/build/greenlight preflight .
# CRITICAL = 0 になるまで修正して再実行
```

**Greenlight がない場合:**
```bash
cd /tmp && git clone https://github.com/RevylAI/greenlight.git && cd greenlight && make build
```

---

### TASK 7: IAP Validate（PHASE 8 ゲート）

**Why:** 提出前に Monthly + Annual が READY_TO_SUBMIT であることを確認。MISSING_METADATA のまま提出したらリジェクト確定。

```bash
# TASK 3 の Screenshot アップロード後に実行
asc validate subscriptions --app "6759514159"
# blocking = 0 でなければ TASK 3 に戻る

asc subscriptions get --id "6759938150" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print('Monthly:', d['data']['attributes']['state'])"

asc subscriptions get --id "6759938154" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print('Annual:', d['data']['attributes']['state'])"

# 両方 READY_TO_SUBMIT が出るまで進まない
```

---

### TASK 8: ASC メタデータ最終確認（英語のみ）

**Why:** Title / Subtitle / Description / Keywords が en-US に設定されていることを確認。日本語メタデータは不要（英語のみで提出）。

```bash
# 現在のメタデータ確認
asc metadata list --app-id "6759514159" --locale en-US

# 不足があれば設定
asc metadata update --app-id "6759514159" --locale en-US \
  --field name --value "Thankful - Gratitude Journal"
asc metadata update --app-id "6759514159" --locale en-US \
  --field subtitle --value "Daily Gratitude & Affirmations"
asc metadata update --app-id "6759514159" --locale en-US \
  --field keywords --value "gratitude,journal,mindfulness,affirmation,diary,thankful"
```

**設定値（確定）:**

| フィールド | 値 |
|-----------|-----|
| title | `Thankful - Gratitude Journal` |
| subtitle | `Daily Gratitude & Affirmations` |
| keywords | `gratitude,journal,mindfulness,affirmation,diary,thankful,mood,wellness` |
| description | *(英語のみ。感謝習慣アプリの説明)* |

---

### TASK 9: App Store 提出

**Why:** 全ゲートを通過したら最終提出。

```bash
# VERSION_ID と BUILD_ID を取得
VERSION_ID=$(asc versions list --app "6759514159" | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

BUILD_ID=$(asc builds list --app "6759514159" --sort -uploadedDate --limit 1 | \
  python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data'][0]['id'])")

# 提出
asc submit create --app "6759514159" \
  --version-id "$VERSION_ID" --build "$BUILD_ID" --confirm

# 確認
asc review submissions-list --app "6759514159"
# state = WAITING_FOR_REVIEW ✅
```

---

## 実行順序（ブロッカー優先）

| 順 | TASK | 担当 | 前提 |
|----|------|------|------|
| 1 | **TASK 4: RC Offerings** | **Daisuke（手動）** | RC Dashboard へのアクセス必要 |
| 2 | **TASK 1: 日本語 UI 削除** | Claude Code | なし |
| 3 | **TASK 2: App Icon 生成** | Claude Code | infsh API key |
| 4 | **TASK 3: IAP Review Screenshot** | Claude Code | ビルド済みアプリ |
| 5 | **TASK 7: IAP Validate** | Claude Code | TASK 3 完了後 |
| 6 | **TASK 5: App Store Screenshots** | Claude Code | TASK 1 完了後 |
| 7 | **TASK 6: Greenlight** | Claude Code | TASK 1,2,4 完了後 |
| 8 | **TASK 8: メタデータ確認** | Claude Code | なし |
| 9 | **TASK 9: 提出** | Claude Code | 全TASK完了後 |

---

## ユーザー作業（Daisuke が必ずやること）

| # | タスク | 手順 |
|---|--------|------|
| 1 | **RC Offerings 設定（必須・最優先）** | https://app.revenuecat.com → Thankful → Offerings → New → default → $rc_annual/$rc_monthly → Make Current |
| 2 | **TestFlight で RC Offerings 動作確認** | Sandbox 購入フローが通ることを確認（TASK 4 後） |

---

## リジェクトパターン封じ込め表

| リジェクト理由 | 防ぐTASK | 状態 |
|---------------|---------|------|
| Guideline 2.1（IAP MISSING_METADATA） | TASK 3 + TASK 7 | ❌ 未完了 |
| IAP not submitted for review | TASK 7 + TASK 9 | ❌ 未完了 |
| Privacy Policy URL なし | ✅ 設定済み（en-US + ja） | ✅ 完了 |
| App icon なし | TASK 2 | ❌ 未完了 |
| Screenshots なし | TASK 5 | ❌ 未完了 |
| PrivacyInfo.xcprivacy なし | ✅ 追加済み（Greenlight で確認） | ✅ 完了 |
| Greenlight CRITICAL > 0 | TASK 6 | ❌ 未実行 |
| RC IAP 課金不可 | TASK 4 | ❌ 未完了 |

---

## 境界（やらないこと）

| 項目 | 理由 |
|------|------|
| 日本語メタデータ（ASC） | 英語のみで提出する |
| UI デザイン変更 | UI は完成。Fix のみ |
| 新機能追加 | 提出後に iterator が担当 |
| TestFlight フルベータ | 直接 App Store 提出のみ |
| Android 対応 | iOS のみ |
