# UX Specification: SleepRitual

**App**: SleepRitual
**Date**: 2026-03-02

---

## 1. Navigation Structure

```
Launch
  └── [First time] OnboardingView (3 screens + PaywallView)
  └── [Returning] HomeView
        ├── [Tab: Home] HomeView (streak + today's ritual)
        ├── [Tab: Build] RitualBuilderView (add/edit/reorder steps)
        └── [Tab: Settings] SettingsView (reminder time, subscription)
```

---

## 2. Screen Specifications

### 2.1 Onboarding Screen 1 — Value Prop

| Element | Spec |
|---------|------|
| Headline | "Your bedtime ritual, your way." |
| Subhead | "3 steps. Every night. Better mornings." |
| Visual | Moon + ritual steps illustration |
| CTA | [Get Started] → Onboarding Screen 2 |

### 2.2 Onboarding Screen 2 — Streak

| Element | Spec |
|---------|------|
| Headline | "Build the streak." |
| Subhead | "Check off your ritual each night. Watch your streak grow." |
| Visual | Animated streak counter (7 → 8 → 9) |
| CTA | [Continue] → Onboarding Screen 3 |

### 2.3 Onboarding Screen 3 — Reminder

| Element | Spec |
|---------|------|
| Headline | "Never forget your ritual." |
| Subhead | "Set a bedtime reminder. We'll nudge you when it's time." |
| Visual | iPhone notification mockup |
| CTA | [Continue] → PaywallView |

### 2.4 PaywallView (Soft — CRITICAL)

| Element | Spec |
|---------|------|
| Headline | "Start Your Sleep Ritual" |
| Features list | • Unlimited ritual steps • Full streak history • Custom reminder times |
| Plan 1 | Annual: $29.99/year — "Best Value" badge |
| Plan 2 | Monthly: $4.99/month |
| Free trial badge | "7 Days Free" on both plans |
| Primary CTA | [Start Free Trial] — RevenueCat purchase |
| **[Maybe Later]** | **Dismisses paywall. MUST BE PRESENT. Top-right or bottom.** |
| Privacy note | "Cancel anytime. Billed by Apple." |

**⚠️ CRITICAL**: `[Maybe Later]` must be tappable and dismiss the paywall without purchase. This is per CLAUDE.md Rule 19.

### 2.5 HomeView

| Element | Spec |
|---------|------|
| Top | Streak badge (flame icon + number) |
| Center | "Tonight's Ritual" — list of steps with checkboxes |
| Each step | Name, checkbox, tap to toggle |
| Completion | Confetti animation when all steps checked |
| Bottom | Completion message or "Keep going!" |
| Empty state | "No ritual yet → [Build yours →]" |

### 2.6 RitualBuilderView

| Element | Spec |
|---------|------|
| Title | "Your Sleep Ritual" |
| List | Existing steps (drag-to-reorder handles) |
| Add step | [+ Add Step] → text field inline |
| Step limit | Free: max 3 steps, Pro: max 5 steps |
| Delete | Swipe-to-delete on each row |
| Edit | Tap step name to edit inline |

### 2.7 SettingsView

| Element | Spec |
|---------|------|
| Reminder section | Time picker, enable/disable toggle |
| Subscription section | Plan status, [Upgrade to Pro] or [Manage Subscription] |
| Restore purchases | [Restore Purchases] link |
| Privacy Policy | Link to aniccaai.com/privacy |

---

## 3. Key UX Principles

| Principle | Implementation |
|-----------|---------------|
| No guilt | Never shame users for missing a streak |
| Minimal friction | Maximum 2 taps to start ritual |
| Visible progress | Streak always on home screen |
| Honest paywall | [Maybe Later] always present |
| No sign-up | Zero authentication required |

---

## 4. Gesture & Interaction

| Interaction | Behavior |
|-------------|---------|
| Tap ritual step | Toggle checked/unchecked with spring animation |
| Long press step | Edit mode |
| Drag handle | Reorder steps |
| Swipe left on step | Delete with confirmation |
| Complete all steps | Confetti burst + haptic feedback (UINotificationFeedbackGenerator.success) |

---

## 5. Error States

| State | UI Response |
|-------|------------|
| Notifications denied | "Enable in Settings for reminders" + [Open Settings] button |
| Purchase failed | RevenueCat error message, retry button |
| Restore fails | "No active subscription found" toast |
| Max steps reached (free) | "Pro unlocks more steps" upsell banner |
