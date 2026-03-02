# Product Requirements Document: SleepRitual

**app_name**: SleepRitual
**bundle_id**: com.anicca.sleepritual
**Version**: 1.0.0
**Last Updated**: 2026-03-02
**Status**: Approved
**Platform**: iOS 17.0+

---

## Subscription Pricing

| Plan | Price | Product ID |
|------|-------|-----------|
| Monthly | $4.99 / month | com.anicca.sleepritual.monthly |
| Annual | $29.99 / year | com.anicca.sleepritual.annual |
| Free Trial | 7 days | Both plans |

---

## 1. Product Overview

### 1.1 Vision Statement
SleepRitual helps adults build and track a personalized pre-sleep routine — not another sleep tracker or meditation app, but a ritual builder. Users define up to 5 bedtime steps, check them off each night, and build consistent streaks to transform their sleep habits permanently.

### 1.2 Target Audience
**Primary**: Adults 25–40 who struggle with inconsistent bedtime routines; have tried Calm/Headspace/habit apps but quit within weeks; know what they "should" do before bed but can't make it stick.

### 1.3 Success Metrics
- Day-7 retention: ≥ 25%
- Free → paid conversion: ≥ 3%
- App Store rating: ≥ 4.5 ★
- Downloads Month 1: ≥ 500

---

## 2. User Personas

### 2.1 Primary Persona: "The Routine Starter"
- **Age**: 28–36, professional
- **Pain**: Knows good sleep habits intellectually; can't execute consistently
- **Quote**: "I tell myself every night I'll go to bed early. Then it's 1am and I'm still on my phone."
- **Goal**: Fall asleep faster, feel better in the morning, stop the doom-scroll spiral

---

## 3. Features & Requirements

### MVP Features (P0)

#### Feature 1: Ritual Builder
As a user, I want to create a custom list of 3–5 pre-sleep steps so that I have a consistent routine to follow each night.

**Acceptance Criteria**:
- User can add steps with custom names (e.g., "Dim lights", "Read 10 pages", "No phone")
- Maximum 5 steps per ritual (free: max 3)
- Steps persist across app launches (UserDefaults)
- Steps can be reordered via drag-and-drop

#### Feature 2: Daily Check-off
As a user, I want to tap each ritual step to mark it complete so that I feel accomplished completing my routine.

**Acceptance Criteria**:
- Each step shows unchecked/checked state with animation
- Completing all steps triggers a success animation
- Progress resets at midnight (next day's ritual ready)
- Completion state persists if app closed mid-ritual

#### Feature 3: Streak Counter
As a user, I want to see my consecutive nights completing the ritual so that I'm motivated to maintain my streak.

**Acceptance Criteria**:
- Streak increments when all steps completed before midnight
- Streak shown prominently on home screen
- Pro: streak recovery grace period (1 miss/week)
- Streak history stored in UserDefaults

#### Feature 4: Bedtime Reminder
As a user, I want a notification at my chosen bedtime so that I remember to start my ritual.

**Acceptance Criteria**:
- User sets reminder time (default: 9:00 PM)
- Notification fires daily at chosen time
- Notification message: "Time for your sleep ritual 🌙"
- Pro: multiple reminders, custom message

#### Feature 5: Soft Paywall Onboarding
As a new user, I want to see what Pro offers before being asked to pay so that I can decide if the subscription is worth it.

**Acceptance Criteria**:
- 3-screen onboarding showing value props
- Final screen: soft paywall with Monthly + Annual options
- [Maybe Later] button dismisses paywall (critical: must be present)
- RevenueCat SDK handles purchase and receipt validation
- Free trial (7 days) shown prominently on paywall

---

## 4. Out of Scope (MVP)

- HealthKit integration
- Apple Watch companion app
- iCloud sync / backend
- Social features
- AI-personalized steps (Foundation Models)

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Cold launch time | < 1.5 seconds |
| Minimum iOS | 17.0 |
| Dark Mode | Full support |
| VoiceOver | All interactive elements labeled |
| App size | < 10MB |
| No backend | UserDefaults only |
| ATT | Not used (no tracking) |

---

## 6. Technical Services

| Service | Purpose |
|---------|---------|
| RevenueCat SDK | Subscription management, StoreKit 2 abstraction |
| Mixpanel SDK | Analytics events |
| UserNotifications | Daily bedtime reminder |
| UserDefaults | Local persistence |

---

## References
- spec/01-trend.md
- product-plan.md
- competitive-analysis.md
- market-research.md
