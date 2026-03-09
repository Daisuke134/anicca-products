---
name: ios-app-onboarding
description: "Activate this skill when designing, auditing, iterating, or reviewing iOS app onboarding flows and paywalls for maximum conversion. Covers the Vara Framework (Personalize immediately, Slow down on purpose, Max perceived value before paywall), paywall design patterns from 10,229 plus real-world paywalls (PaywallScreens.com), Purchasely 2026 playbook patterns, and conversion optimization techniques. Outputs EN and JA localized text. Applicable to all iOS apps including factory apps."
---

# iOS App Onboarding & Paywall Optimization

## Purpose

Provide battle-tested best practices for iOS app onboarding and paywall design that maximize
trial starts, subscription conversion, and Day-1 retention. Based on analysis of 10,229+
real-world paywalls and top-performing apps (Fastic 26M users, Blinkist, RISE, Balance, Opal).

## When to Use

- Designing a new onboarding flow for any iOS app
- Auditing an existing onboarding for conversion improvements
- Iterating on paywall design, copy, or pricing layout
- Reviewing onboarding before App Store submission
- Creating factory apps that need profitable onboarding patterns

## Core Framework: The Three Pillars (Vara Framework)

| # | Pillar | Purpose | Implementation |
|---|--------|---------|----------------|
| 1 | **Personalize immediately** | Create investment/ownership feeling | Add 2-3 question slides early in the flow |
| 2 | **Slow them down on purpose** | Build perceived value layer by layer | Progress bar + value proposition slides between questions |
| 3 | **Max perceived value before paywall** | Achieve "I need this" conviction | Show personalized result summary right before paywall |

## Workflow

### Step 1: Audit Current Onboarding

Read the app's onboarding files and evaluate against this checklist:

| Check | Best Practice | Weight |
|-------|--------------|--------|
| Personalization questions exist | 2-3 questions before paywall | CRITICAL |
| Progress indicator | Dots or progress bar on all slides | HIGH |
| Value proposition slides | Social proof / stats between questions | HIGH |
| "Building your plan" moment | Loading animation before paywall | MEDIUM |
| Skip button exists | Apple guideline compliance | CRITICAL |
| Animations | Fade/slide transitions between slides | MEDIUM |
| Benefit-oriented copy | "What you get" not "What this does" | HIGH |

### Step 2: Audit Current Paywall

| Check | Best Practice | Weight |
|-------|--------------|--------|
| Personalized headline | Based on onboarding answers | CRITICAL |
| Social proof | "Join X+ users" type text | HIGH |
| Free vs Premium comparison table | Side-by-side feature comparison | HIGH |
| Yearly plan has "BEST VALUE" badge | + "Save X%" calculation | HIGH |
| CTA says "Start Free Trial" | Not "Subscribe Now" | HIGH |
| Close button delayed 3-5 seconds | Reduce instant dismissal | MEDIUM |
| "Maybe later" instead of "Continue with Free" | Less prominent skip option | MEDIUM |
| Legal footer | Terms + Privacy + Cancel anytime | CRITICAL |
| Restore Purchases button | Apple requirement | CRITICAL |
| Plan cards: yearly pre-selected | Anchor to annual plan | HIGH |

### Step 3: Generate Improvement Recommendations

For each CRITICAL or HIGH item that fails audit, generate a specific recommendation:

1. **What to change** — Exact element (component, text, style)
2. **Why** — Which best practice it violates and expected impact
3. **How** — Code-level or design-level patch (EN + JA text included)
4. **Expected impact** — Estimated CVR improvement range

### Step 4: Output Localized Text

All text recommendations MUST include both EN and JA versions in a table:

| Key | EN | JA |
|-----|----|----|
| (i18n key) | English text | 日本語テキスト |

### Step 5: Apple Guidelines Compliance Check

| Rule | Check |
|------|-------|
| Paywall MUST be dismissible (skip/close button) | ⬜ |
| Actual prices displayed (from StoreKit/RevenueCat) | ⬜ |
| Free trial duration + auto-renewal clearly stated | ⬜ |
| Privacy Policy link on paywall | ⬜ |
| Terms of Use link on paywall | ⬜ |
| Restore Purchases button present and functional | ⬜ |
| `demoAccountRequired` set to `false` | ⬜ |

## Recommended Onboarding Flow Template (5-8 slides)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ Welcome  │ → │ Q1: Goal │ → │ Value    │ → │ Q2: When │ → │ Building │ → │ Notif    │ → │ Personalized │
│ Hero     │   │ 4 choices│   │ Social   │   │ 4 choices│   │ Plan     │   │ Request  │   │ Paywall      │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────────┘
```

Each slide MUST have:
- Progress indicator (dots or bar)
- Single clear CTA button
- Smooth animation transition (fade + scale)

## Paywall Layout Template

```
┌────────────────────────────┐
│           [X] (3s delay)   │
│       🎯 App Icon          │
│  "{Personalized Headline}" │
│  "Join X+ users who..."    │  ← Social proof
│                            │
│  ┌─FREE──┬──PREMIUM───┐   │  ← Comparison table
│  │ basic │ full access │   │
│  │ limit │ unlimited   │   │
│  │  ❌   │     ✅      │   │
│  └───────┴────────────┘   │
│                            │
│  [ Monthly    $X.XX/mo ]   │
│  [ Yearly ⭐ BEST VALUE ]  │  ← Pre-selected, badge, Save%
│                            │
│  [=== Start Free Trial ===]│  ← Primary CTA
│      "Maybe later"         │  ← Subtle
│    "Restore Purchases"     │
│  Terms • Privacy • Cancel  │
└────────────────────────────┘
```

## Conversion Optimization Techniques

| Technique | How | Expected Impact |
|-----------|-----|-----------------|
| Anchoring | Show yearly first, monthly appears expensive | CVR +15-30% |
| Loss aversion | "Free users miss 80% of content" | CVR +10-20% |
| Social proof | "X,000+ users" with specific number | CVR +5-15% |
| Scarcity | Close button delay (3-5s) | Reduces instant dismiss |
| Endowment effect | Questions → "your personalized plan" | CVR +20-40% |
| Free trial framing | "Start Free Trial" vs "Subscribe" | CVR +30-50% |

## Target Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Onboarding completion rate | >70% | Analytics: slide-by-slide drop-off |
| Paywall view rate | >80% | Onboarding complete → paywall shown |
| Paywall CVR (soft) | >5% | Purchase / paywall views |
| Free trial start rate | >15% | Trial start / paywall views |
| Trial → Paid | >60% | Paid / trial starts |
| D1 retention | >40% | Next-day return rate |

## Reference Apps ($500K+/month revenue)

| App | Pattern | Key Learning |
|-----|---------|-------------|
| Balance: Meditation | Long personalization → result → soft paywall | Meditation app gold standard |
| RISE: Sleep Tracker | Questions → loading → personalized paywall | "Building your plan" pattern |
| Opal: Screen Time | Problem → solution → paywall | Problem-solution frame |
| Fastic (26M users) | 10+ questions, still high conversion | Length doesn't kill if personalized |
| Blinkist | Goal setting → social proof → recs → paywall | Education app pattern |

## References

For detailed research and app-specific implementation examples, read:
- `references/onboarding-paywall-best-practices.md` — Full research with sources and citations
