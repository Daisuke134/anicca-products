# Thankful Gratitude App — App Store 提出 Fix Spec

**作成日:** 2026-02-22
**ステータス:** 実装待ち（スペック確定）
**目標:** クラッシュ修正 → RC 設定 → PrivacyPolicy 追加 → Fastlane セットアップ → Greenlight CRITICAL=0 → App Store 提出

---

## 開発環境

| 項目 | 値 |
|------|-----|
| プロジェクトパス | `/Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app/` |
| Xcodeプロジェクト | `ThankfulGratitudeApp.xcodeproj` |
| Bundle ID | `app.rork.thankful-gratitude-app` |
| 現バージョン | `1.0.0 (1)` |

---

## RevenueCat 確定データ（API で検証済み）

| 項目 | 値 |
|------|-----|
| RC Project | `proj7aaf9429` (Thankful) |
| iOS App ID | `app2672aee816` |
| iOS Public API Key | `appl_pcZedDwIwXVSSdEugQZPMBormtl` |
| v2 Secret Key | `.env` → `THANKFUL_APP_RC_V2_SECRET_KEY` |
| Offering ID | `ofrngbe380d2bec` (Default, current=true) |
| Monthly Package | `pkge46dd13b373`, lookup_key: `$rc_monthly`, store_id: `thankful_monthly` |
| Annual Package | `pkgec3b7005dc9`, lookup_key: `$rc_annual`, store_id: `thankful_annual` |
| Entitlement | `entl3420469870`, lookup_key: `pro` ← PaywallView の `entitlements["pro"]` と一致 ✅ |
| Package キー一致 | PaywallView の `"$rc_annual"` / `"$rc_monthly"` は RC 実データと一致 ✅ |

**注意:** iOS 製品 (`prod3239ba236d`, `prod91f6a061e5`) の `duration: null` / `trial_duration: null` — ASC 側で IAP が未設定の可能性あり。ASC で `thankful_annual` / `thankful_monthly` の IAP を確認・設定が必要。

---

## 概要（What & Why）

Rork が生成した感謝日記アプリ。Swift/SwiftUI + SwiftData + RevenueCat 構成。
UIと設計は完成しているが、**起動時にクラッシュして何も表示されない。**

**クラッシュの根本原因（確定）:**
`Config.swift` の `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` が空文字 → `RevenueCatService.configure()` が `guard !apiKey.isEmpty else { return }` で早期終了 → RC SDK 未初期化 → ContentView が `Purchases.shared` にアクセス → **クラッシュ**

---

## 受け入れ条件

| # | 条件 | 確認方法 |
|---|------|---------|
| AC1 | シミュレータでクラッシュなしに起動 | `fastlane build_for_simulator` |
| AC2 | 実機（ダイスの iPhone）で起動してコア機能が動く | `fastlane build_for_device` |
| AC3 | RevenueCat Paywall が表示される（Sandbox 購入フロー確認） | 実機テスト |
| AC4 | 英語・日本語切り替えが全画面で動作する | シミュレータで確認 |
| AC5 | `greenlight preflight .` で CRITICAL = 0 | CLI 実行 |
| AC6 | `fastlane safe_release` が通る | Fastlane 実行 |
| AC7 | SettingsView に Privacy Policy リンクがある | 目視 |

---

## As-Is / To-Be（全 Fix）

### Fix 1: Config.swift — RC iOS APIキー設定（最重要・クラッシュ直結）

| | 内容 |
|-|------|
| **As-Is** | `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = ""` / `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = ""` |
| **To-Be** | 両方に `appl_pcZedDwIwXVSSdEugQZPMBormtl` を設定 |

```swift
// ThankfulGratitudeApp/Config.swift — 修正後
enum Config {
    static let EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = "appl_pcZedDwIwXVSSdEugQZPMBormtl"
    static let EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = "appl_pcZedDwIwXVSSdEugQZPMBormtl"
}
```

---

### Fix 2: SwiftData fatalError → graceful error handling

| | 内容 |
|-|------|
| **As-Is** | `fatalError("Could not create ModelContainer: \(error)")` — 失敗時即クラッシュ |
| **To-Be** | `catch` で in-memory フォールバック。本番でデータが消えることを防ぐ |

```swift
// ThankfulGratitudeAppApp.swift — 修正後
var sharedModelContainer: ModelContainer = {
    let schema = Schema([GratitudeEntry.self])
    let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
    do {
        return try ModelContainer(for: schema, configurations: [config])
    } catch {
        // フォールバック: in-memory で起動（データは失うが、クラッシュ回避）
        let fallback = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        return try! ModelContainer(for: schema, configurations: [fallback])
    }
}()
```

---

### Fix 3: デプロイターゲット 18.0 → 17.0

| | 内容 |
|-|------|
| **As-Is** | `IPHONEOS_DEPLOYMENT_TARGET = 18.0` |
| **To-Be** | `IPHONEOS_DEPLOYMENT_TARGET = 17.0`（SwiftData は 17.0+ 必須。以下にはできない） |
| **作業** | `project.pbxproj` の全 `IPHONEOS_DEPLOYMENT_TARGET` を `17.0` に変更 |

---

### Fix 4: PrivacyInfo.xcprivacy 追加（ITMS-91061 防止）

| | 内容 |
|-|------|
| **As-Is** | `PrivacyInfo.xcprivacy` が存在しない |
| **To-Be** | `ThankfulGratitudeApp/PrivacyInfo.xcprivacy` を作成してターゲットに追加 |

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </dict>
    </array>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyTracking</key>
    <false/>
</dict>
</plist>
```

**追加手順:** Xcode でファイル追加 → Target Membership で `ThankfulGratitudeApp` にチェック。

---

### Fix 5: Privacy Policy リンク追加（Guideline 5.1.1(i) 必須）

| | 内容 |
|-|------|
| **As-Is** | `SettingsView` に Privacy Policy リンクなし → App Review リジェクト確定 |
| **To-Be** | `SettingsView` の "About" セクションに Privacy Policy と Terms of Use リンクを追加 |

```swift
// SettingsView.swift の About セクションに追加
Section(L10n.about(language)) {
    // 既存のバージョン表示...
    Link(L10n.privacyPolicy(language), destination: URL(string: "https://aniccaai.com/privacy")!)
    Link(L10n.termsOfUse(language), destination: URL(string: "https://aniccaai.com/terms")!)
}
```

**Strings.swift にも追加:**
```swift
static func privacyPolicy(_ language: AppLanguage) -> String {
    switch language {
    case .english: return "Privacy Policy"
    case .japanese: return "プライバシーポリシー"
    }
}
static func termsOfUse(_ language: AppLanguage) -> String {
    switch language {
    case .english: return "Terms of Use"
    case .japanese: return "利用規約"
    }
}
```

---

### Fix 6: Expo アーティファクト削除

| | 内容 |
|-|------|
| **As-Is** | `app/+native-intent.tsx` が存在（Rork の残骸） |
| **To-Be** | `app/` ディレクトリを完全削除 |

```bash
rm -rf /Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app/app/
```

---

### Fix 7: Fastlane セットアップ（このアプリ専用）

| | 内容 |
|-|------|
| **As-Is** | Fastlane なし |
| **To-Be** | `Gemfile` + `fastlane/Appfile` + `fastlane/Fastfile` を作成 |

**Fastfile に必要な lane:**

| Lane | 用途 |
|------|------|
| `test` | ユニットテスト |
| `build_for_simulator` | シミュレータビルド |
| `build_for_device` | 実機ビルド |
| `preflight` | GATE 2 自動チェック（checklist.md の実装） |
| `safe_release` | preflight → full_release |
| `full_release` | build → upload → submit |

---

### Fix 8: ASC メタデータ（EN + JA）設定

| | 内容 |
|-|------|
| **As-Is** | ASC にメタデータ未設定 |
| **To-Be** | `asc` CLI で EN + JA のタイトル・説明・キーワードを設定 |

**設定値（案）:**

| フィールド | EN | JA |
|-----------|-----|-----|
| Title | Thankful - Gratitude Journal | Thankful - 感謝日記 |
| Subtitle | Daily Gratitude & Affirmations | 毎日の感謝と気づき |
| Keywords | gratitude,journal,mindfulness,affirmation,diary | 感謝,日記,マインドフルネス,アファメーション,習慣 |

---

### Fix 9: ASC IAP 確認・設定

| | 内容 |
|-|------|
| **As-Is** | RC の iOS 製品 `thankful_annual` / `thankful_monthly` の `duration: null`（ASC IAP 未確認） |
| **To-Be** | ASC で `thankful_annual`（$49.99/年、7日 Trial）と `thankful_monthly`（$9.99/月）の IAP が存在することを `asc` CLI で確認 |
| **確認コマンド** | `asc iaps list --app-id <ASC_APP_ID>` |
| **未設定なら** | ASC GUI で IAP を作成してサブスクリプショングループに紐付け |

---

## テストマトリックス（TDD: RED → GREEN の順）

| # | テスト名 | 何をテスト | ファイル |
|---|----------|-----------|---------|
| T1 | `testRevenueCatAPIKey_IsNotEmpty` | Config の API キーが空でないこと | `ConfigTests.swift` |
| T2 | `testRevenueCatConfigures_WithValidKey` | RC SDK が設定されること | `RevenueCatServiceTests.swift` |
| T3 | `testModelContainer_InitializesSuccessfully` | SwiftData が起動すること | `AppTests.swift` |
| T4 | `testCalculateStreak_EmptyEntries_ReturnsZero` | 空配列で streak = 0 | `AppViewModelTests.swift` |
| T5 | `testCalculateStreak_SingleToday_ReturnsOne` | 今日だけなら streak = 1 | `AppViewModelTests.swift` |
| T6 | `testAllStrings_HaveBothLanguages` | 全 L10n 関数が EN/JA 両方返す | `StringsTests.swift` |
| T7 | `testPrivacyPolicyString_ExistsInBothLanguages` | Fix 5 で追加した文字列の確認 | `StringsTests.swift` |

---

## E2E 判定

| 項目 | 値 |
|------|-----|
| UI 変更 | あり（Privacy Policy リンク追加） |
| 新画面 | なし |
| 新ボタン | Link ×2（Privacy Policy, Terms of Use） |
| 結論 | Maestro: 最小限。Paywall 表示確認のみ。Link タップはシミュレータで困難なため実機確認で代替。 |

---

## 境界（やらないこと）

| 項目 | 理由 |
|------|------|
| UI デザイン変更 | 「UIは良い」と確認済み |
| 新機能追加 | Fix のみ |
| Android 対応 | iOS のみ |
| RC Experiment | 提出後に iterator が担当 |
| Maestro の full フロー | Privacy Policy リンクのみ変更。Full E2E は工数対効果が低い |

---

## 実行手順（全て Claude Code が実行）

### Step 1: Fix 1〜6 実装（TDD）

```bash
# 作業ディレクトリ
cd /Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app

# Fix 1: Config.swift 修正
# Fix 2: ThankfulGratitudeAppApp.swift 修正
# Fix 3: project.pbxproj のデプロイターゲット変更
# Fix 4: PrivacyInfo.xcprivacy 作成 + Xcode ターゲット追加
# Fix 5: SettingsView + Strings.swift に Privacy Policy 追加
# Fix 6: app/ ディレクトリ削除
```

### Step 2: Fastlane セットアップ（Fix 7）

```bash
# Gemfile / Appfile / Fastfile 作成
# preflight lane に checklist.md の GATE 2 自動項目を実装
```

### Step 3: ユニットテスト（GATE 0）

```bash
cd /Users/cbns03/Downloads/anicca-project/rork-thankful-gratitude-app
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane test
# 全件 PASS が必須
```

### Step 4: codex-review（GATE codex）

```bash
/codex-review
# ok: true になるまで最大 5 回反復
```

### Step 5: Greenlight（GATE 1）

```bash
/tmp/greenlight/build/greenlight preflight .
# CRITICAL = 0 必須。失敗したら修正して再実行
```

### Step 6: シミュレータ確認（GATE 2 自動）

```bash
FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build_for_simulator
# クラッシュなし確認
```

### Step 7: ASC メタデータ + IAP 確認（GATE 2 半自動）

```bash
# ASC App ID を特定
asc apps list

# メタデータ確認・設定
asc metadata list --app-id <ID>

# IAP 確認
asc iaps list --app-id <ID>

# スクリーンショット確認
asc screenshots list --app-id <ID> --locale en-US
```

### Step 8: 実機テスト（ダイスが確認）

```bash
# Claude Code が実行
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane build_for_device

# ダイスが確認する内容
# - 起動する
# - Paywall が表示される
# - Sandbox で購入フローが通る
# - 英語・日本語切り替えが動く
# - Privacy Policy リンクが開く
```

### Step 9: 提出

```bash
FASTLANE_SKIP_UPDATE_CHECK=1 fastlane safe_release
# safe_release = preflight（全 GATE 自動チェック）→ full_release
```

---

## スキル・フロー

| フェーズ | ツール |
|---------|--------|
| TDD | `/tdd` |
| コードレビュー | `/codex-review` |
| Greenlight | `greenlight preflight .` |
| ASC 操作 | `asc` CLI（`asc-cli-usage` スキル参照） |
| 提出 | `fastlane safe_release`（`asc-release-flow` スキル参照） |
