# Release Specification: Micro Mood

## App Store Metadata

### App Info

| Field | Value |
|-------|-------|
| App Name | Micro Mood |
| Bundle ID | com.anicca.micromood |
| Version | 1.0.0 |
| Build Number | 1 |
| Category | Health & Fitness |
| Primary Category ID | HEALTH_AND_FITNESS |
| Content Rating | 4+ (no objectionable content) |

### Subtitle (30 chars max)

`Know Why You Feel What You Feel`

### Keywords (100 chars max)

`mood tracker,mood journal,emotional wellness,daily mood,mood diary,mental health,feelings,wellbeing`

### Description — en-US

```
Micro Mood — the 3-second mood tracker that actually explains your patterns.

Most mood apps ask too much. 40 activity tags. Detailed notes. Medical questionnaires. You quit in 3 days.

Micro Mood is different. Tap your mood in 3 seconds. Once a week, see your patterns: "You feel best on Fridays. Mondays are consistently rough after short sleep."

No journaling. No setup. No complexity.

FEATURES:
• 3-tap check-in — faster than unlocking your phone
• Home screen widget — mood tracking from the home screen
• AI weekly patterns — understand WHY, not just WHAT
• Privacy-first — all data stays on your device, never shared
• HealthKit sync — mood logs in Apple Health (Pro)

FREE includes 30 days of history and full check-in functionality.
Pro unlocks unlimited history, AI weekly reports, HealthKit sync, and CSV export.

Try free — no sign-up required.
```

### Description — ja

```
Micro Mood — なぜそう感じるのかを教えてくれる、3秒のムードトラッカー。

複雑なアプリは続かない。40個のアクティビティタグ。長い記録。あなたは3日でやめる。

Micro Moodは違う。3秒でムードを記録。毎週、パターンがわかる。「金曜日に最も元気。月曜は睡眠不足の後に落ち込む傾向がある。」

日記不要。設定不要。複雑さゼロ。

【機能】
• 3タップで記録 — ホーム画面から
• ウィジェット対応 — ロック画面から直接記録
• AIウィークリーパターン — "なぜ"を解き明かす（Pro）
• プライバシー最優先 — データはデバイス上のみ
• ヘルスケア連携 — Apple Healthにムードを記録（Pro）

無料で30日分の履歴。サインアップ不要。
Proは無制限の履歴、AIレポート、ヘルスケア連携、CSVエクスポートが使えます。
```

## Subscription Products

| Product | ID | Price | Duration |
|---------|-----|-------|---------|
| Monthly | com.anicca.micromood.premium.monthly | $4.99 | 1 month |
| Annual | com.anicca.micromood.premium.annual | $29.99 | 1 year |

**Subscription Group Name:** Micro Mood Premium
**Free Trial:** None in v1 (30-day free tier is the trial equivalent)

## App Store Connect Checklist

### Before Submission

| # | Task | Status |
|---|------|--------|
| 1 | Privacy Policy URL deployed to GitHub Pages | ⬜ |
| 2 | App created in ASC with bundle ID com.anicca.micromood | ⬜ |
| 3 | 2 IAP products created (monthly + annual) | ⬜ |
| 4 | 175-territory pricing set (price-point IDs — NOT --tier) | ⬜ |
| 5 | RevenueCat: 2 products attached to offering | ⬜ |
| 6 | PrivacyInfo.xcprivacy in project target | ⬜ |
| 7 | ITSAppUsesNonExemptEncryption = NO in Info.plist | ⬜ |
| 8 | App icon 1024×1024px | ⬜ |
| 9 | Screenshots: iPhone 6.7" (1290×2796) — 3 minimum | ⬜ |
| 10 | Screenshots: iPad 13" 2048×2732 (APP_IPAD_PRO_3GEN_129) | ⬜ |
| 11 | Age Rating all 22 items set | ⬜ |
| 12 | Review Details: --demo-account-required false | ⬜ |
| 13 | Availability: 175 territories | ⬜ |
| 14 | App pricing: free (subscriptions handle revenue) | ⬜ |
| 15 | Copyright: "2026 Anicca" | ⬜ |
| 16 | Content Rights: DOES_NOT_USE_THIRD_PARTY_CONTENT | ⬜ |
| 17 | primaryCategory set (HEALTH_AND_FITNESS) | ⬜ |
| 18 | usesIdfa: false set | ⬜ |
| 19 | asc validate → Errors=0 | ⬜ |
| 20 | App Privacy (data usage) set in ASC Web (manual) | ⬜ |
| 21 | IAP selected in ASC version page (GUI — CRITICAL RULE 29b) | ⬜ |

## Privacy Policy

**URL:** https://[github-user].github.io/micromood-privacy/

**Required content:**
- Data collected: anonymized analytics (Mixpanel device ID)
- Data NOT collected: mood entries (stored on device only)
- HealthKit use: write-only for mood sync
- Subscription management: RevenueCat
- Contact email

## Build & Release Commands

```bash
# 1. Unlock keychain (required before signing)
security unlock-keychain -p "$KEYCHAIN_PASSWORD" ~/Library/Keychains/login.keychain-db

# 2. Build IPA
cd MicroMoodiOS && FASTLANE_SKIP_UPDATE_CHECK=1 FASTLANE_OPT_OUT_CRASH_REPORTING=1 fastlane build

# 3. Upload to ASC
cd MicroMoodiOS && fastlane upload

# 4. Wait for processing, then submit
# (asc review submissions-create → items-add → submissions-submit)
```

## Review Notes for Apple

```
Demo account: Not required (no sign-in)
In-app purchases: Subscription tested with sandbox account
Privacy: All data stored on device (CoreData). No server required.
```

## TestFlight Distribution

| Group | Users |
|-------|-------|
| Internal | Dev + QA (max 25) |
| External | None required for v1 |

## Post-Launch

| Timeline | Action |
|----------|--------|
| Day 1-7 | Monitor crash reports (Xcode Organizer) |
| Week 2 | Check Mixpanel: paywall_viewed conversion rate |
| Month 1 | RevenueCat: MRR, conversion rate, churn |
| Month 2 | Consider Foundation Models AI (iOS 19 users) |
