# Release Specification: SleepRitual

**App**: SleepRitual
**Bundle ID**: com.anicca.sleepritual
**Version**: 1.0.0
**Date**: 2026-03-02

---

## 1. App Store Metadata

### English (en-US)

| Field | Value |
|-------|-------|
| **App Name** | SleepRitual |
| **Subtitle** | Bedtime Routine Builder |
| **Category** | Health & Fitness |
| **Secondary Category** | Lifestyle |

**Description (4000 chars max)**:
```
Build the bedtime ritual that actually sticks.

SleepRitual helps you create and track a personalized pre-sleep routine —
3 simple steps, every night, better mornings.

Not another sleep tracker. Not a meditation app. SleepRitual is a
ritual builder — the tool that helps you design and actually DO your
wind-down routine.

HOW IT WORKS
1. Build your ritual — Add the steps that matter to you. Dim the lights.
   Read a chapter. Put your phone down. Your ritual, your rules.
2. Check off each step — Tap to mark complete. See your progress in real time.
3. Build your streak — Complete your ritual every night. Watch your streak grow.

WHY IT WORKS
You already know what you should do before bed. The problem isn't knowledge —
it's accountability. SleepRitual gives you the simple, judgment-free structure
to follow through every night.

FEATURES
• Custom ritual builder with up to 5 steps (Pro)
• Daily streak counter to keep you motivated
• Bedtime reminder notification at your chosen time
• Streak recovery grace period (Pro)
• Simple, calm interface designed for evenings

START FREE
Try SleepRitual Pro free for 7 days. No commitment. Cancel anytime.

Monthly: $4.99/month
Annual: $29.99/year (best value — save 50%)
```

**Keywords** (100 chars max):
`bedtime routine,sleep ritual,sleep hygiene,night routine,habit tracker,wind down,sleep better`

**Promotional Text** (170 chars):
`Build your bedtime ritual. Check off 3 steps every night. Grow your streak. Better mornings start the night before.`

### Japanese (ja)

| Field | Value |
|-------|-------|
| **App Name** | SleepRitual |
| **Subtitle** | 就寝前ルーティンビルダー |

**Description (ja)**:
```
毎晩続く就寝前のリチュアルを作ろう。

SleepRitualは、あなただけのオリジナル睡眠ルーティンを作り、
毎晩続けるためのアプリです。

睡眠トラッカーでも瞑想アプリでもありません。
「就寝前に何をするか」を設計し、実行するためのリチュアルビルダーです。

使い方：
1. リチュアルを作る — 自分に合った3〜5つのステップを追加
2. 毎晩チェック — タップして完了マーク
3. ストリークを伸ばす — 連続記録が毎晩の動機に

月額 ¥800（$4.99相当）
年額 ¥4,800（$29.99相当）— 約50%お得
7日間無料トライアル
```

**Keywords (ja)**:
`就寝ルーティン,睡眠習慣,ナイトルーティン,ストリーク,寝る前習慣,睡眠改善`

---

## 2. In-App Purchases

| Product ID | Type | Price | Display Name |
|-----------|------|-------|-------------|
| `com.anicca.sleepritual.monthly` | Auto-renewable subscription | $4.99/month | SleepRitual Pro Monthly |
| `com.anicca.sleepritual.annual` | Auto-renewable subscription | $29.99/year | SleepRitual Pro Annual |

**Subscription Group Name**: SleepRitual Pro
**Free Trial**: 7 days (both plans)

---

## 3. App Store Submission Preflight

### Greenlight Check (CRITICAL — run before every submission)
```bash
cd SleepRitualios && /tmp/greenlight/build/greenlight preflight .
# CRITICAL = 0 required
```

### Pre-Submission Checklist

| # | Check | Command/Action |
|---|-------|---------------|
| 1 | Greenlight CRITICAL=0 | `greenlight preflight .` |
| 2 | PrivacyInfo.xcprivacy exists | `ls SleepRitualios/Resources/PrivacyInfo.xcprivacy` |
| 3 | ITSAppUsesNonExemptEncryption=NO | Info.plist check |
| 4 | No ATT/NSUserTrackingUsageDescription | `grep -r 'NSUserTracking' --include='*.plist' .` should = 0 lines |
| 5 | No RevenueCatUI import | `grep -r 'import RevenueCatUI' --include='*.swift' .` should = 0 lines |
| 6 | [Maybe Later] button exists | Code review: PaywallView.swift |
| 7 | Build compiles clean | `fastlane build` |
| 8 | Age Rating all 22 items | ASC Web — submit questionnaire |
| 9 | App Privacy complete | ASC Web (requires human action) |
| 10 | Metadata en-US + ja | `asc metadata validate` |

---

## 4. Release Flow

```bash
# 1. Set version
cd SleepRitualios && fastlane set_version version:1.0.0

# 2. Greenlight preflight
/tmp/greenlight/build/greenlight preflight .
# Must show CRITICAL=0

# 3. Build + upload
fastlane full_release
# Archives → uploads to ASC → waits for processing → submits for review

# 4. Verify
asc builds list --app $APP_ID | head -5
```

---

## 5. TestFlight Distribution

- Upload to TestFlight before App Store submission
- Distribute to Internal Testing group
- Include test notes: "Test ritual builder, streak, and paywall ([Maybe Later] must work)"

---

## 6. Post-Launch Checklist

| Task | Timing |
|------|--------|
| Monitor crash rate in Xcode Organizer | Day 1 |
| Check Mixpanel funnel: install → onboarding → paywall → paid | Day 3 |
| Respond to first App Store reviews | Day 7 |
| Evaluate D7 retention | Day 7 |
| Plan v1.1 based on data | Day 14 |
