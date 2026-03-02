# Product Plan: SleepRitual

**App Name**: SleepRitual
**Bundle ID Candidate**: com.anicca.sleepritual
**Platform**: iOS
**Last Updated**: 2026-03-02
**Source Idea**: spec/01-trend.md — Rank 1 (score 8.33/10)

---

## 1. Problem Discovery

### Target User

**Primary**: Adults 25–40 who struggle to maintain a consistent pre-sleep routine.

Detailed profile:
- Tries to "wind down" but ends up scrolling social media until 1–2am
- Has downloaded Calm, Headspace, or Sleep Cycle but quit within 2 weeks
- Knows *what* they should do before bed (no screens, stretch, read) but cannot make it a habit
- Experiences fatigue and low morning energy as a result
- Willing to pay for a tool that holds them accountable without being preachy

Source: [Healthline – Why You Can't Sleep](https://www.healthline.com/health/sleep/why-cant-i-sleep) / 「One of the most common reasons people can't sleep is that their bedtime routine... simply doesn't support good sleep hygiene.」
Source: [Sleep Foundation – Sleep Hygiene](https://www.sleepfoundation.org/sleep-hygiene) / 「Improving sleep hygiene — the behaviors and environment that influence sleep — is one of the best ways to get better sleep.」

### Core Pain Points

| # | Pain Point | Evidence |
|---|-----------|---------|
| 1 | Can't build a consistent pre-sleep routine | Sleep Foundation: 35% of adults report insufficient sleep; routine inconsistency is #1 behavioral cause |
| 2 | Existing apps focus on tracking or meditation, not routine-building | App Store analysis: Sleep Cycle = tracking, Calm = meditation, no ritual-builder category |
| 3 | Abstract goals ("sleep better") with no concrete step-by-step system | Healthline: users need specific, repeatable behaviors, not just goals |

Source: [CDC – Short Sleep Duration](https://www.cdc.gov/sleep/data-and-statistics/adults.html) / 「More than 1 in 3 American adults do not get enough sleep on a regular basis.」
Source: [Sleep Foundation – Sleep Stats](https://www.sleepfoundation.org/how-sleep-works/sleep-facts-statistics) / 「35.2% of all adults in the U.S. report sleeping on average for less than seven hours per night.」

---

## 2. Solution

### Value Proposition

**SleepRitual** helps adults build and track a personalized 3-step pre-sleep routine with daily streaks and gentle reminders — not another sleep tracker, a bedtime routine builder.

> "Your bedtime ritual, your way. 3 steps. Every night. Tonight."

### Core Differentiator

| Competitor | Focus | What's Missing |
|-----------|------|---------------|
| Sleep Cycle | Sleep tracking / alarms | Pre-sleep behavior building |
| Calm | Meditation / content | Routine structure and streaks |
| Habitica | General habits | Sleep-specific ritual design |
| **SleepRitual** | **Pre-sleep ritual building** | **Nothing — this IS the gap** |

Source: [Business of Apps – Sleep App Market](https://www.businessofapps.com/data/wellness-app-market/) / 「The wellness app industry generated $880 million in 2024, another year of decline as the major apps struggle」 — incumbent decline = indie opportunity.

---

## 3. MVP Scope

### Core Features (1-Day Implementation)

| # | Feature | Technical Implementation |
|---|---------|------------------------|
| 1 | **Ritual Builder** | Add up to 5 custom ritual steps (SwiftUI List + UserDefaults) |
| 2 | **Daily Check-off** | Tap each step to mark complete; animated checkmark (SwiftUI animation) |
| 3 | **Streak Counter** | Consecutive nights completed tracked in UserDefaults; displayed on home |
| 4 | **Bedtime Reminder** | Custom notification at user-chosen time (UserNotifications framework) |
| 5 | **Soft Paywall Onboarding** | 3-screen onboarding → paywall (SwiftUI + RevenueCat SDK, [Maybe Later] dismissable) |

### Out of Scope (MVP)

| Excluded | Reason |
|---------|--------|
| HealthKit sleep data | Adds complexity; ritual building doesn't require biometrics |
| Backend / cloud sync | Zero backend needed; UserDefaults sufficient for solo device |
| Social sharing | Phase 2 growth feature |
| Apple Watch companion | Phase 2 after App Store validation |
| AI-personalized steps | Phase 2 if Foundation Models helps |

Source: [Indie Hacker Best Practices – Scope MVP](https://www.indiehackers.com/post/how-to-scope-your-mvp-a-framework-for-solo-founders) / 「The best MVPs solve exactly one problem for exactly one user persona, with zero features that aren't essential.」

---

## 4. Monetization

### Subscription Model

| Plan | Price | Billing |
|------|-------|---------|
| **Monthly** | **$4.99 / month** | Monthly auto-renewing |
| **Annual** | **$29.99 / year** | Annual auto-renewing (~$2.50/mo, 50% savings) |
| Free Trial | 7 days | Both plans include free trial |

**Free Tier** (permanent):
- 1 custom ritual (max 3 steps)
- 7-day streak counter only
- No custom reminder time (fixed 9:00 PM)

**Pro Tier** (subscription):
- Unlimited rituals (up to 5 steps each)
- Full streak history + calendar view
- Custom reminder time and multiple reminders
- Streak recovery grace period (1 miss per week)

### Pricing Rationale

- **$4.99/month**: Positioned below Calm ($12.99) and Headspace ($12.99); competitive with habit apps (Streaks $4.99, Habitify $4.99/mo)
- **$29.99/year**: ~$2.50/month effective; strong annual CTA with 50% discount creates urgency on paywall
- Sleep improvement has established willingness-to-pay: Calm $150M ARR proves users pay for sleep-adjacent tools

Source: [Business of Apps – Calm Revenue](https://www.businessofapps.com/data/calm-statistics/) / 「Calm generated over $150 million in revenue in 2023, demonstrating strong willingness-to-pay for sleep and wellness apps.」
Source: [Sensor Tower – Habit App Pricing](https://sensortower.com/blog/subscription-app-pricing-2024) / 「The average subscription price for top health & fitness apps on iOS is $8.49/month; positioning at $4.99 captures the value-conscious segment.」

---

## 5. App Store Positioning

### App Name & Subtitle

| Field | Value |
|-------|-------|
| **App Name** | SleepRitual |
| **Subtitle** | Bedtime Routine Builder |
| **Category** | Health & Fitness |
| **Secondary** | Lifestyle |

### iTunes Name Check (Evidence)

```
curl "https://itunes.apple.com/search?term=SleepRitual&entity=software&country=us&limit=25"
→ 0 exact matches for "sleepritual"  (confirmed 2026-03-02)
```

### Keywords (ASO Targets)

Primary: bedtime routine, sleep ritual, sleep hygiene, nighttime routine
Secondary: sleep habit tracker, wind down app, sleep better, pre-sleep
Long-tail: bedtime habit builder, evening routine tracker, sleep routine app

Source: [AppFollow – ASO Best Practices](https://appfollow.io/blog/aso-best-practices) / 「Targeting a combination of high-volume category keywords plus specific long-tail phrases maximizes organic discoverability for new apps.」

---

## 6. Success Metrics (30-Day Post-Launch)

| Metric | Target | Source Benchmark |
|--------|--------|-----------------|
| Downloads (Month 1) | 500+ organic | Indie app baseline for niche wellness |
| Paywall Conversion | ≥ 3% free → paid | RevenueCat industry benchmark: 2–4% for freemium |
| Day-7 Retention | ≥ 25% | Benchmark: top health apps 20–30% |
| App Store Rating | ≥ 4.5 ★ | Reviewable after ≥ 5 ratings |
| Streak >3 nights | ≥ 40% of active users | Ritual formation proxy |

Source: [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) / 「The median free-to-paid conversion rate across subscription apps is 2-4%; health & fitness apps trend toward the higher end at 3-5%.」
Source: [Liftoff Mobile Gaming Report – Retention Benchmarks](https://liftoff.io/resources/mobile-gaming-report/) / 「Day-7 retention benchmarks for health apps: top quartile 30%+, median 20–25%.」

---

## 7. Technical Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| UI Framework | SwiftUI | Native iOS, zero backend needed |
| Persistence | UserDefaults | No backend required for solo device |
| Notifications | UserNotifications | Bedtime reminder |
| Payments | RevenueCat SDK | Industry standard; handles StoreKit 2 |
| Analytics | Mixpanel | Event tracking for funnel optimization |
| Minimum iOS | iOS 17.0 | 90%+ device coverage; SwiftUI features |

Source: [RevenueCat – Why RevenueCat](https://www.revenuecat.com/blog/why-revenuecat) / 「RevenueCat handles the complex subscription infrastructure so indie developers can focus on product — used by 30,000+ apps.」

---

## 8. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Low organic discoverability | Medium | ASO-optimized metadata + build-in-public TikTok |
| Sleep app category saturation | Medium | Ritual-builder positioning differentiates clearly |
| Users don't build habits | Low | Streak + reminder system + grace period |
| RevenueCat setup delay | Low | Setup in US-005 before any build |

---

*All external source URLs cited throughout this document. Research conducted 2026-03-02.*
