# Product Requirements Document: Micro Mood

## App Metadata

| Field | Value |
|-------|-------|
| **app_name** | Micro Mood |
| **display_name** | Micro Mood |
| **bundle_id** | com.anicca.micromood |
| **version** | 1.0.0 |
| **build_number** | 1 |
| **ios_deployment_target** | 17.0 |
| **category** | Health & Fitness |
| **primary_category_id** | HEALTH_AND_FITNESS |

## Subscription Pricing

| Plan | Price | Product ID |
|------|-------|------------|
| **Monthly** | $4.99 USD/month | com.anicca.micromood.premium.monthly |
| **Annual** | $29.99 USD/year | com.anicca.micromood.premium.annual |
| **Free tier** | $0 | — |

## Problem

Mood tracker apps are too complex. Daylio requires 40+ activity tags. Bearable is for chronic illness tracking. Users quit in 3 days. The core question — "why do I feel the way I feel?" — remains unanswered.

## Solution

3-tap daily mood check-in + AI-powered weekly pattern report. "You're consistently tired on Mondays. Your best moods follow exercise days." No journaling. No medical setup. Just patterns.

## Target Users

**Primary:** 25–35yo professionals and students wanting emotional self-awareness without overhead.
**Secondary:** 35–45yo stressed parents.

## MVP Features

### Free Tier

| Feature | Description |
|---------|------------|
| Daily mood check-in | 5-mood emoji scale + optional 1-sentence note |
| Home screen widget | 1-tap check-in from lock screen / home screen |
| 7-day mood chart | Weekly bar chart |
| 30-day history | Scroll through past entries |

### Pro Tier ($4.99/mo or $29.99/yr)

| Feature | Description |
|---------|------------|
| Unlimited history | All entries forever |
| AI weekly pattern report | "You feel best on Fridays after 7+ hours sleep" |
| HealthKit integration | Write mood data to Apple Health Mindfulness |
| Data export | CSV download of all entries |
| Widget customization | Custom emoji sets |

## Out of Scope (v1.0)

| Feature | Reason |
|---------|--------|
| Foundation Models AI | iOS 19+ only — v2 |
| Apple Watch | Phase 2 |
| Custom reminders | Phase 2 |
| Social/sharing | Out of scope — mood is private |
| Android | Not planned |
| Backend/cloud | CoreData only — privacy feature |

## Acceptance Criteria

| # | Criteria |
|---|---------|
| 1 | User can check in mood in ≤3 taps from home screen widget |
| 2 | Mood data persists locally in CoreData |
| 3 | Weekly AI pattern summary appears every Monday |
| 4 | Paywall presents on >30 day history access attempt |
| 5 | RevenueCat purchase flow completes without error |
| 6 | HealthKit write succeeds for Pro users |
| 7 | App passes xcodebuild archive without errors |

## App Store Metadata

**Subtitle:** Know Why You Feel What You Feel

**Description (en-US, 4000 chars max):**
```
Micro Mood — the 3-second mood tracker that actually explains your patterns.

Most mood apps ask too much. 40 activity tags. Detailed notes. Medical questionnaires. You quit in 3 days.

Micro Mood is different. Tap your mood in 3 seconds. Once a week, see your patterns: "You feel best on Fridays. Mondays are consistently rough after short sleep."

No journaling. No setup. No complexity.

FEATURES:
• 3-tap check-in — faster than unlocking your phone
• Home screen widget — mood tracking from the home screen
• AI weekly patterns — understand WHY, not just WHAT
• Privacy-first — all data stays on your device
• HealthKit sync — mood logs in Apple Health

FREE includes 30 days of history.
Pro unlocks unlimited history, AI weekly reports, HealthKit, and export.
```

**Keywords:** mood tracker, mood journal, emotional wellness, daily mood, mood diary, mental health, mood log, feelings tracker, emotion diary, wellbeing

## Privacy

| Data Type | Storage | Shared With |
|-----------|---------|------------|
| Mood entries | CoreData (device only) | Nobody |
| Notes | CoreData (device only) | Nobody |
| HealthKit data | Apple Health (device) | Nobody |
| Analytics | Mixpanel (anonymized) | Mixpanel only |
