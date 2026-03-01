# UX Specification: Micro Mood

## Design Principles

1. **3-second check-in** — The entire daily interaction should take ≤3 taps
2. **Zero friction** — No setup, no account, no required fields beyond mood level
3. **Calm, not clinical** — Warm colors, gentle animations, no medical vocabulary
4. **Privacy-visible** — Users can see "all data stays on your device" prominently

## Screens

### 1. Onboarding (3 screens)

| Screen | Content | CTA |
|--------|---------|-----|
| Screen 1 | "Track your mood in 3 seconds" + emoji animation | Next |
| Screen 2 | "Discover your patterns" + example weekly report | Next |
| Screen 3 | "Everything stays on your device" + privacy shield | Start Tracking |

No sign-up. No email. No account. Tap "Start" → directly to HomeView.

### 2. HomeView (Tab 1: Today)

```
┌─────────────────────────┐
│  Micro Mood      ⚙️     │
├─────────────────────────┤
│                         │
│   How are you today?    │
│                         │
│  😊  😐  😔  😤  😰   │
│                         │
│  [Optional note...]     │
│                         │
│  [Log Mood]             │
│                         │
├─────────────────────────┤
│  This week:             │
│  [7-day bar chart]      │
│                         │
│  Mon ████               │
│  Tue ██                 │
│  Wed █████              │
│                         │
└─────────────────────────┘
```

**Interaction:**
- Tap emoji → immediate haptic feedback (UIImpactFeedbackGenerator.medium)
- Note field: optional, 280 char limit, keyboard dismisses on tap outside
- "Log Mood" button: saves entry → brief ✅ animation → button returns to default

### 3. HistoryView (Tab 2: History)

```
┌─────────────────────────┐
│  History                │
├─────────────────────────┤
│  Today, March 1         │
│  😊 Great               │
│  "Finished the project" │
│                         │
│  Yesterday, Feb 29      │
│  😐 Okay                │
│  (no note)              │
│                         │
│  ─── 30 days limit ─── │
│  [Unlock Pro to see all]│
└─────────────────────────┘
```

Paywall trigger: Tapping "Unlock Pro" → PaywallView (RevenueCatUI)

### 4. InsightsView (Tab 3: Insights) — Pro only

```
┌─────────────────────────┐
│  Your Patterns          │
│  Week of Feb 24 - Mar 1 │
├─────────────────────────┤
│  📈 Best days           │
│  Fridays (avg 4.2/5)    │
│                         │
│  📉 Tough days          │
│  Mondays (avg 2.1/5)    │
│                         │
│  💡 Pattern             │
│  "You feel 40% better   │
│  on days with notes"    │
├─────────────────────────┤
│  This week's average:   │
│  😐 3.2 / 5.0           │
└─────────────────────────┘
```

Free users see blurred insights with "Unlock Pro to see your patterns"

### 5. Widget (Home Screen / Lock Screen)

**Small widget (2x2):**
```
┌─────────────┐
│ Micro Mood  │
│             │
│  How?       │
│ 😊 😐 😔   │
└─────────────┘
```

Tap any emoji → opens CheckInView with that mood pre-selected (deeplinking via widgetURL).

### 6. PaywallView

Uses RevenueCatUI `PaywallView` with custom offering.

**Copy:**
- Headline: "See Why You Feel What You Feel"
- Feature 1: "✓ Unlimited mood history"
- Feature 2: "✓ AI weekly pattern report"
- Feature 3: "✓ Apple Health sync"
- Feature 4: "✓ CSV export"
- Monthly CTA: "Start for $4.99/month"
- Annual CTA: "Best Value — $29.99/year (Save 50%)"
- Footer: "Cancel anytime · Restore purchases"

**Paywall must only reference features that exist in code.** (CRITICAL RULE 11)

### 7. SettingsView

| Setting | Type |
|---------|------|
| Apple Health sync | Toggle (Pro only) |
| Export data | Button → CSV share sheet |
| Restore purchases | Button |
| Privacy policy | Link |
| App version | Display |

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| VoiceOver labels | All emoji buttons have `.accessibilityLabel("Great mood")` etc. |
| Dynamic Type | All text uses system fonts with dynamic scaling |
| Minimum tap target | ≥44×44pt for all interactive elements |
| Color contrast | WCAG AA minimum (4.5:1 for normal text) |

## Animations

| Interaction | Animation |
|-------------|-----------|
| Mood selected | Scale 1.0 → 1.3 → 1.0, 0.2s spring |
| Log Mood tapped | Button scale down + ✅ checkmark fade-in, 0.3s |
| Tab switch | Default SwiftUI tab animation |
| Widget tap | Immediate, no animation (system handles) |

## Color System (defined in DESIGN_SYSTEM.md)

Dark mode first. Warm dark background (#0f1419). Accent: soft amber (#F4A261).
