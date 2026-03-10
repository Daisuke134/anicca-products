# Release Specification: SomaticFlow

Source: [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 「Apps must include accurate metadata, including descriptions, screenshots, and keywords.」
Source: [Apple Developer: Preparing for App Store Submission](https://developer.apple.com/documentation/xcode/preparing-your-app-for-distribution) — 「Verify all metadata, capabilities, and entitlements before submission.」
Source: [mobileapp-builder CLAUDE.md](CLAUDE.md) — 「Greenlight: CRITICAL=0確認してから提出」

---

## 1. Pre-Submission Checklist

| # | Gate | Command | Pass Criteria |
|---|------|---------|--------------|
| 1 | Unit Tests | `cd SomaticFlowios && fastlane test` | 全テストGREEN |
| 2 | Build | `cd SomaticFlowios && fastlane build` | BUILD_SUCCESS |
| 3 | Greenlight | `greenlight preflight SomaticFlowios/` | CRITICAL=0 |
| 4 | Rule 17 | `grep -rE "Mix[p]anel\|Fire[b]ase" SomaticFlowios/SomaticFlow --include="*.swift"` | 0件 |
| 5 | Rule 20 | `grep -r "Revenue[C]atUI" SomaticFlowios/ --include="*.swift"` | 0件 |
| 6 | Rule 20b | `grep -r "ATTracking[M]anager" SomaticFlowios/` | 0件 |
| 7 | Rule 23 | `grep -rE "Open[A]I\|anthr[o]pic\|Google[G]enerativeAI\|Foundation[M]odels" SomaticFlowios/ --include="*.swift"` | 0件 |
| 8 | PrivacyInfo | `test -f SomaticFlowios/SomaticFlow/PrivacyInfo.xcprivacy && echo PASS` | PASS |
| 9 | Encryption | `grep -q "ITSAppUsesNonExemptEncryption" SomaticFlowios/SomaticFlow/Info.plist && echo PASS` | PASS |

---

## 2. App Store Metadata

### en-US

| 項目 | 値 |
|------|-----|
| **App Name** | Somatic Exercises - SomaticFlow |
| **Subtitle** | Daily Nervous System Reset |
| **Version** | 1.0.0 |
| **Build** | 1 |
| **Bundle ID** | com.aniccafactory.somaticflow |
| **SKU** | somaticflow-001 |
| **Keywords** | somatic exercises,nervous system reset,trauma release,stress relief body,body tension release,vagus nerve exercises,daily wellness routine,anxiety relief,somatic healing,body scan |
| **Promotional Text** | Finally, somatic exercises that actually make sense. Animation-guided routines in 5 minutes a day — no video, no complexity. |
| **Description** | SomaticFlow guides you through daily somatic exercises with SwiftUI animations and haptic feedback — no text instructions needed.\n\nBacked by research on how the body stores and releases tension, SomaticFlow makes nervous system reset accessible to everyone.\n\n**What you'll do:**\n• Follow animated exercise guides — no reading required\n• Feel the rhythm with gentle haptic cues\n• Build a daily streak starting with Day 1\n• Get reminded at your chosen time each day\n\n**Free includes:** 3 somatic exercises (7-day intro, Day 1–3)\n**Premium includes:** 25+ exercises, 7-day + 30-day programs, full progress dashboard\n\nSubscription: $7.99/month or $29.99/year (7-day free trial on annual). Cancel anytime. |
| **Privacy Policy URL** | https://daisuke134.github.io/anicca-products/somaticflow/privacy-policy.html |

### ja

| 項目 | 値 |
|------|-----|
| **App Name** | ソマティックエクサイズ - SomaticFlow |
| **Subtitle** | 毎日の神経系リセット |
| **Version** | 1.0.0 |
| **Keywords** | ソマティックエクサイズ,神経系リセット,トラウマ解放,ストレス解消,体の緊張解放,迷走神経,ウェルネス習慣,不安解消,ソマティックヒーリング,ボディスキャン |
| **Promotional Text** | ついに、本当に使えるソマティックエクサイズアプリ。アニメーション図解で5分のルーティン — テキスト不要、複雑さゼロ。 |
| **Description** | SomaticFlowは、SwiftUIアニメーションとハプティクス振動で、毎日のソマティックエクサイズをガイドします — テキスト指示は不要です。\n\n体が緊張とトラウマを蓄積・解放する仕組みを研究に基づき、神経系リセットを誰にでもアクセスしやすくします。\n\n**できること:**\n• アニメーション図解でエクサイズをフォロー — 読まなくていい\n• 優しい振動キューでリズムを感じる\n• Day 1からストリークを積み上げる\n• 毎日好きな時間にリマインド\n\n**無料:** ソマティックエクサイズ3種（7日間プログラム Day 1–3）\n**プレミアム:** 25以上のエクサイズ、7日間+30日間プログラム、進捗ダッシュボード\n\nサブスク: 月額¥1,300 または 年額¥4,900（年額は7日間無料トライアル）。いつでもキャンセル可。 |
| **Privacy Policy URL** | https://daisuke134.github.io/anicca-products/somaticflow/privacy-policy.html |

---

## 3. Screenshots

Source: [App Store Connect: Screenshot Specs](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) — 「6.9" (1320×2868) screenshots are required; Apple auto-scales to smaller sizes.」

### デバイス

| Device Type | Size | Required |
|-------------|------|---------|
| IPHONE_69 (6.9") | 1320×2868 | ✅ REQUIRED（自動スケール元） |


**Rule 24: 6.9" のみ。他サイズ不要。Apple が自動スケール。**

### スクリーンショット構成（en-US + ja 各4枚以上）

| # | Screen | Accessibility ID | Caption (en) | Caption (ja) |
|---|--------|-----------------|-------------|-------------|
| 1 | PaywallView | `paywall_cta_button` | "Reset Your Nervous System Daily" | "毎日、神経系をリセット" |
| 2 | ExerciseSessionView | `exercise_animation` | "Animation-Guided, No Instructions Needed" | "アニメーション図解、テキスト不要" |
| 3 | ProgramView | `today_exercise_card` | "5 Minutes a Day, Build Your Streak" | "毎日5分、ストリークを積み上げる" |
| 4 | ProgressView | `progress_streak_label` | "Track Your Journey" | "進捗を可視化" |
| 5 | LibraryView | `library_exercise_list` | "25+ Somatic Exercises" | "25以上のエクサイズ" |

### キャプチャコマンド

```bash
# アプリ起動確認
UDID=$(xcrun simctl list devices | grep "iPhone 16 Pro Max" | head -1 | grep -o '[A-Z0-9-]\{36\}')

# スクショキャプチャ
asc screenshots capture \
  --bundle-id com.aniccafactory.somaticflow \
  --udid "$UDID" \
  --output-dir screenshots/raw \
  --output json

# フレーミング（Koubouのみ — Rule 18）
asc screenshots frame \
  --input screenshots/raw \
  --output screenshots/framed \
  --device IPHONE_69

# ASCにアップロード
asc screenshots upload \
  --version-localization "$LOC_ID_EN" \
  --path screenshots/framed/en-US \
  --device-type IPHONE_69

asc screenshots upload \
  --version-localization "$LOC_ID_JA" \
  --path screenshots/framed/ja \
  --device-type IPHONE_69
```

---

## 4. Privacy

| 項目 | 値 |
|------|-----|
| PrivacyInfo.xcprivacy | 必須（ITMS-91053 回避） |
| Required Reason API | `NSPrivacyAccessedAPICategoryUserDefaults` — Reason: `CA92.1` |
| ATT | **不使用**（Rule 20b） |
| Data Collection | なし（ローカルのみ） |
| Encryption | `ITSAppUsesNonExemptEncryption = NO` |

### App Privacy 回答（ASC Web）

| Category | Collected | Used For | Linked | Tracking |
|----------|-----------|---------|--------|---------|
| Contact Info | No | — | — | — |
| Health & Fitness | No | — | — | — |
| User Content | No | — | — | — |
| Identifiers | No | — | — | — |
| Usage Data | No | — | — | — |
| Diagnostics | No | — | — | — |

**全データ収集：なし（データを一切収集しない）**

---

## 5. Build & Archive

Source: [mobileapp-builder CLAUDE.md: Fastlane必須](CLAUDE.md) — 「xcodebuild直接実行禁止。`cd aniccaios && fastlane <lane>`」

```bash
# 署名前の準備
source ~/.config/mobileapp-builder/.env
[ -f ./.env ] && source ./.env
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db

# ビルド + アーカイブ
cd SomaticFlowios
fastlane build

# IPA エクスポート（signing problem回避用）
xcodebuild -exportArchive \
  -archivePath build/SomaticFlow.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist

# ASC アップロード
xcrun altool --upload-app \
  --type ios \
  --file build/export/SomaticFlow.ipa \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID"
```

---

## 6. TestFlight

| 項目 | 値 |
|------|-----|
| Internal Testing | ダイスケ（Tester）のみ |
| External Testing | 提出後 TestFlight パブリックリンク |
| What to Test | オンボーディング、ペイウォール（sandbox）、タイマー、通知 |
| Beta Notes (en) | "Please test: onboarding flow, soft paywall, exercise timer, daily reminder. Use Sandbox account for in-app purchase testing." |
| Beta Notes (ja) | "テスト項目: オンボーディング、ソフトペイウォール（Sandboxアカウント使用）、エクサイズタイマー、毎日リマインド通知" |

```bash
# ビルドをTestFlightに配布
BUILD_ID=$(asc builds list --app "$APP_ID" --sort -uploadedDate --limit 1 | jq -r '.[0].id')
GROUP_ID=$(asc testflight groups list --app "$APP_ID" | jq -r '.[0].id')
asc builds add-groups --build "$BUILD_ID" --group "$GROUP_ID"
```

---

## 7. Submission

### コンプライアンス回答

| 項目 | 回答 | 理由 |
|------|------|------|
| 暗号化 | `usesNonExemptEncryption = false` | HTTPS (TLS) のみ、RevenueCat SDK経由 |
| コンテンツ権利 | `DOES_NOT_USE_THIRD_PARTY_CONTENT` | 静的コンテンツ（exercises.json）は自作 |
| Demo Account Required | `false` | 認証不要。Sandbox購入でテスト可 |
| Advertising Identifier | 不使用 | ATT禁止（Rule 20b） |

### 審査提出コマンド

```bash
# Review Submission 作成 → アイテム追加 → 提出
VERSION_ID=$(asc versions list --app "$APP_ID" | jq -r '.[0].id')
SUBMISSION_ID=$(asc review submissions-create --app "$APP_ID" | jq -r '.id')
asc review submissions-items-add --submission "$SUBMISSION_ID" --version "$VERSION_ID"
asc review submissions-submit --submission "$SUBMISSION_ID"
```

---

## 8. Review Notes

**審査官向けメモ（en-US）:**

```
SomaticFlow is a somatic exercise app with static content only.

- No AI/ML used: All exercises are pre-written JSON content bundled with the app
- No data collection: All progress data stored locally via UserDefaults only
- No camera/microphone/location: App uses only CoreHaptics and local notifications
- Subscription: $7.99/month or $29.99/year with 7-day free trial (annual only)
  - Managed via RevenueCat SDK
  - "Cancel anytime" clearly displayed on paywall
- Soft paywall: Users can tap "Maybe Later" to use free tier (Day 1-3)
- Notifications: UNCalendarNotificationTrigger, daily reminder, user-configurable time
```

---

## 9. Age Rating

| Category | Rating | Note |
|----------|--------|------|
| Cartoon or Fantasy Violence | None | — |
| Realistic Violence | None | — |
| Sexual Content or Nudity | None | — |
| Profanity or Crude Humor | None | — |
| Alcohol, Tobacco, Drugs | None | — |
| Horror/Fear Themes | None | — |
| Gambling | None | — |
| Contests | None | — |
| Medical/Treatment Info | Mild | General wellness only |

**Final Age Rating: 4+**

```bash
# 全22項目設定（NONE / MILD / INFREQUENT_OR_MILD / FREQUENT_OR_INTENSE）
asc age-ratings set --app "$APP_ID" \
  --cartoon-fantasy-violence NONE \
  --realistic-violence NONE \
  --prolonged-graphic-sadistic-realistic-violence NONE \
  --sexual-content-nudity NONE \
  --graphic-sexual-content-nudity NONE \
  --substance-use NONE \
  --profanity-crude-humor NONE \
  --horror-fear NONE \
  --mature-suggestive NONE \
  --gambling NONE
```

---

## 10. Hotfix Protocol

| Step | Action |
|------|--------|
| 1 | `git checkout release/1.0.x` でリリースブランチに切替 |
| 2 | バグ修正コミット |
| 3 | `CFBundleShortVersionString` を 1.0.1 にバンプ |
| 4 | `fastlane test` 全PASS確認 |
| 5 | `fastlane build` → TestFlight アップロード |
| 6 | 内部テスト確認後 ASC に再提出 |
| 7 | `git cherry-pick <commit>` を dev ブランチに適用 |

---

## 11. Version History

| Version | Build | Date | Changes |
|---------|-------|------|---------|
| 1.0.0 | 1 | 2026-03-xx | Initial App Store release |
