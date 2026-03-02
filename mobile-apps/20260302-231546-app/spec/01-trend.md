# US-001: Trend Research + Idea Selection

**Profile (Factory Fixed):** iOS / Swift/SwiftUI / solo dev / 1-day MVP / subscription model

---

## Brainstorming Lenses Applied

All 5 lenses applied per rshankras idea-generator SKILL.md.

| Lens | Ideas Generated |
|------|----------------|
| 1: Skills & Interests | Habit tracker, energy logger, breath coach, sleep ritual |
| 2: Problem-First | "I don't know why I'm tired", "I can't build a sleep routine", "I forget breaks" |
| 3: Technology-First | Foundation Models prompts, ActivityKit Live Activity, HealthKit HRV |
| 4: Market Gap | Wellness app revenue declining for incumbents (Calm, Headspace) = indie opportunity |
| 5: Trend-Based | AI companion market $48.63B +31% CAGR, mental health/anxiety awareness surge |

Sources:
- [Business of Apps – Wellness App Market 2026](https://www.businessofapps.com/data/wellness-app-market/) / 「The wellness app industry generated $880 million in 2024, another year of decline as the major apps struggle」
- [Business of Apps – Health App Market 2026](https://www.businessofapps.com/data/health-app-market/) / 「Health & fitness apps saw a revenue jump of 24% YoY, generating $6.3 billion in 2025」
- [NichesHunter – App Ideas for Indie Hackers 2026](https://nicheshunter.app/blog/app-ideas-indie-hackers-solo-devs-studios) / 「Big companies ignore small niches—a market worth 500K per year is not worth their time, but for a solo developer... it is life changing money」
- [Diginautical – Top 10 iOS Trends 2026](https://diginautical.com/blogs/top-10-ios-app-development-trends-you-cant-ignore-in-2026/) / 「AI Wellness Companions: The AI companion market hits $48.63 billion in 2026 with a 31% CAGR」

---

## Shortlist (Top 5 Scored)

### Rank 1 — Sleep Ritual Builder

| Field | Value |
|-------|-------|
| **idea** | Sleep Ritual Builder |
| **one_liner** | Build a personalized 3-step pre-sleep ritual and track streaks — not another sleep tracker, a routine builder |
| **lens** | problem_first + market_gap |
| **platform** | iOS |
| **problem_statement** | People know they sleep badly but can't build a consistent pre-sleep routine. Existing apps focus on sleep *tracking* (Sleep Cycle, Oura) or meditation (Calm) — no app focuses on *building* the ritual itself: the 3–5 steps you do before bed to wind down. |
| **target_user** | Adults 25–40 who have tried Calm/Headspace but can't maintain a bedtime routine; they know what they "should" do but don't. |
| **monetization_model** | Subscription $4.99/month or $29.99/year. Free tier: 1 custom ritual, 7 days. Pro: unlimited rituals, detailed streaks, reminder customization. |
| **competition_notes** | Sleep Cycle = tracking. Calm/Headspace = meditation. Streaks/Habitica = general habits. None positions specifically as "bedtime ritual builder." Blue ocean within sleep category. |
| **mvp_scope** | 3-step ritual builder (add/reorder steps) + daily reminder notification at custom bedtime + streak counter. Pure SwiftUI + UserDefaults + UserNotifications. No backend needed. |
| **next_step** | product-agent discover --idea "iOS app to build and track a 3-step pre-sleep bedtime ritual with streaks and reminders" --platform iOS --output-format json |

**Feasibility Scores:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Solo Dev Scope | 9 | Pure SwiftUI + UserNotifications + UserDefaults. No backend. Shippable in 1 day MVP. |
| Platform API Fit | 8 | UserNotifications + HealthKit (sleep data read-only optional). WidgetKit for streak widget. |
| Monetization | 8 | Sleep market massive. Users pay for sleep apps — proven by Calm $150M ARR. |
| Competition | 7 | Sleep tracker category crowded BUT ritual builder angle is differentiated. |
| Technical Fit | 9 | Core SwiftUI + Notifications — well within standard iOS skill set. |

**Overall Score: 8.33** *(Solo Dev Scope and Technical Fit weighted 1.5x)*

Calculation: (9×1.5 + 8 + 8 + 7 + 9×1.5) / 6 = (13.5+8+8+7+13.5)/6 = 50/6 = **8.33**

---

### Rank 2 — Energy Pulse

| Field | Value |
|-------|-------|
| **idea** | Energy Pulse |
| **one_liner** | Log your energy level 3x daily with one tap — visualize when you're most productive and why |
| **lens** | problem_first |
| **platform** | iOS |
| **problem_statement** | People feel tired but don't know *when* or *why*. They don't have a tool to log energy throughout the day and spot patterns. Mood trackers are broad; energy-specific logging for productivity is underserved. |
| **target_user** | Remote workers and knowledge workers 25–45 who struggle with productivity dips and afternoon slumps. |
| **monetization_model** | Subscription $3.99/month or $24.99/year. Free: 7 days history. Pro: unlimited history, weekly pattern insights, CSV export. |
| **competition_notes** | Daylio is mood-based, not energy-specific. Few apps focus on energy-as-productivity metric. Underserved niche. |
| **mvp_scope** | 3 daily logging prompts (notification-triggered) + 1–5 energy tap + weekly bar chart. Pure SwiftUI + UserDefaults. |
| **next_step** | product-agent discover --idea "iOS energy logger that lets users log their energy 1-5 three times daily and visualize weekly patterns" --platform iOS --output-format json |

**Feasibility Scores:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Solo Dev Scope | 9 | Pure SwiftUI + Charts framework. No backend. 1-day MVP realistic. |
| Platform API Fit | 7 | Swift Charts + UserNotifications. HealthKit optional for sleep correlation. |
| Monetization | 7 | Productivity niche pays; smaller TAM than sleep. |
| Competition | 8 | Energy-specific is genuinely underserved vs general mood apps. |
| Technical Fit | 9 | Standard SwiftUI + Charts — textbook implementation. |

**Overall Score: 8.17** *(weighted)*

Calculation: (9×1.5 + 7 + 7 + 8 + 9×1.5) / 6 = (13.5+7+7+8+13.5)/6 = 49/6 = **8.17**

---

### Rank 3 — Breath Coach (Nervous System)

| Field | Value |
|-------|-------|
| **idea** | Breath Coach |
| **one_liner** | A personalized breathing coach that reads your Apple Watch HRV and recommends which breathing pattern to use right now |
| **lens** | technology_first |
| **platform** | iOS + watchOS (iOS primary) |
| **problem_statement** | Breathing apps offer fixed patterns (4-7-8, box breathing). No app uses real-time biometric data to decide *which* pattern you need in the moment based on current stress state. |
| **target_user** | Anxiety-prone adults who wear Apple Watch and want evidence-based stress relief, not generic breathing exercises. |
| **monetization_model** | Subscription $4.99/month or $34.99/year. Free: 3 patterns. Pro: HRV-adaptive recommendations + history. |
| **competition_notes** | Balanced Breath, Breathwrk, Oak exist but are all pattern-based, not adaptive. HealthKit HRV access differentiates. |
| **mvp_scope** | Read HRV from HealthKit (last reading) → show recommended breathing pattern → animated breath guide. SwiftUI + HealthKit. |
| **next_step** | product-agent discover --idea "iOS breathing app that reads Apple Watch HRV and recommends personalized breathing patterns based on current stress level" --platform iOS --output-format json |

**Feasibility Scores:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Solo Dev Scope | 8 | HealthKit HRV read + SwiftUI animation. Doable in 1–2 days. |
| Platform API Fit | 9 | HealthKit HRV = deep Apple API usage. Perfect platform fit. |
| Monetization | 8 | Anxiety/stress market huge. Users pay for stress tools. |
| Competition | 6 | Many breathing apps exist; differentiation via HRV is real but needs marketing. |
| Technical Fit | 8 | HealthKit entitlement + read API — standard pattern, documented well. |

**Overall Score: 7.83** *(weighted)*

Calculation: (8×1.5 + 9 + 8 + 6 + 8×1.5) / 6 = (12+9+8+6+12)/6 = 47/6 = **7.83**

---

### Rank 4 — Micro-Habit Nano Tracker

| Field | Value |
|-------|-------|
| **idea** | Micro-Habit Nano Tracker |
| **one_liner** | Track exactly ONE habit per day — nothing more. The anti-habit-app habit app. |
| **lens** | market_gap |
| **platform** | iOS |
| **problem_statement** | Habit apps (Habitica, Streaks, Habitify) are too complex. Users abandon them because they try to track 10 things. The insight: track ONE thing obsessively and never miss. |
| **target_user** | People who've failed multiple habit apps and want radical simplicity — the "I just need to do one thing" market. |
| **monetization_model** | $2.99/month or $14.99/year. Free: 7-day trial. Pro: WidgetKit home screen widget + detailed streaks. |
| **competition_notes** | Streaks allows 12 habits. Habitify allows unlimited. None positions as "one habit only" — intentional constraint is the product differentiator. |
| **mvp_scope** | Name your one habit + tap to complete daily + streak counter + WidgetKit widget. Pure SwiftUI + WidgetKit + UserDefaults. |
| **next_step** | product-agent discover --idea "iOS habit tracker that enforces tracking only one habit at a time — radical simplicity as the product differentiator" --platform iOS --output-format json |

**Feasibility Scores:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Solo Dev Scope | 9 | Simplest possible scope. Pure SwiftUI + WidgetKit. |
| Platform API Fit | 7 | WidgetKit for home screen widget. Simple but effective. |
| Monetization | 7 | Habit space established but $3/month low. Premium positioning helps. |
| Competition | 5 | Extremely crowded. Needs strong marketing angle. |
| Technical Fit | 9 | Textbook SwiftUI + WidgetKit. No edge cases. |

**Overall Score: 7.67** *(weighted)*

Calculation: (9×1.5 + 7 + 7 + 5 + 9×1.5) / 6 = (13.5+7+7+5+13.5)/6 = 46/6 = **7.67**

---

### Rank 5 — Quiet Minutes (Mindful Break Timer)

| Field | Value |
|-------|-------|
| **idea** | Quiet Minutes |
| **one_liner** | Pomodoro timer with mindful break prompts powered by on-device Foundation Models |
| **lens** | technology_first |
| **platform** | iOS |
| **problem_statement** | Pomodoro apps are mechanical (25/5 minutes, no guidance). When breaks happen, users pick up their phone and doom-scroll. A break with a mindful prompt to actually recharge is missing. |
| **target_user** | Remote workers and students who use Pomodoro technique but waste their breaks on social media. |
| **monetization_model** | $3.99/month or $24.99/year. Free: 3 prompt types. Pro: Foundation Models personalized prompts + custom timer lengths. |
| **competition_notes** | Forest, Be Focused, Focus Keeper = mechanical timers. None uses on-device AI for break quality. Foundation Models differentiator is real. |
| **mvp_scope** | 25-min work + 5-min break timer + 5 static mindful prompts (no FM needed for MVP) + notification. SwiftUI + UserNotifications. |
| **next_step** | product-agent discover --idea "Pomodoro iOS app with mindful break prompts powered by Apple Foundation Models, ensuring breaks actually recharge users" --platform iOS --output-format json |

**Feasibility Scores:**

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Solo Dev Scope | 8 | SwiftUI timer + notifications + static prompts for MVP. |
| Platform API Fit | 8 | Foundation Models (iOS 18.1+) is novel API with few indie apps yet. |
| Monetization | 7 | Productivity tools have established willingness to pay. |
| Competition | 5 | Pomodoro space very crowded. Needs clear differentiation messaging. |
| Technical Fit | 8 | SwiftUI + UserNotifications core skills. Foundation Models adds novelty. |

**Overall Score: 7.33** *(weighted)*

Calculation: (8×1.5 + 8 + 7 + 5 + 8×1.5) / 6 = (12+8+7+5+12)/6 = 44/6 = **7.33**

---

## Ideas Filtered Out

| Idea | Lens | Reason |
|------|------|--------|
| Water & Hydration Tracker with Live Activity | technology_first | Hydration apps extremely crowded (WaterMinder, Drops, Plant Nanny). ActivityKit differentiator not enough to overcome competition + low ARPU. Failed competition_density filter. |
| AI Personal Journal with Foundation Models | trend_based | Day One, Journey, Reflect all established with loyal users. High switching cost. Scope too large for 1-day MVP if FM integration required. Failed solo_dev_scope filter. |
| Gym Equipment Wait Time | market_gap | Requires backend/crowdsource infrastructure. Cannot be done solo in 1 day. Failed solo_dev_scope filter. |
| AI Wellness Companion | trend_based | $48B market but dominated by venture-backed companies (Pi, Replika, Character.AI). Extreme competition. Failed competition_density filter. |

---

## Recommendation

**Start with Rank 1: Sleep Ritual Builder.**

Sleep is the highest-priority health category for users who pay for apps (proven: Calm $150M ARR, Sleep Cycle top-10 health app). The ritual-building angle is genuinely differentiated — no existing app positions itself as "help you build the routine *before* sleep" rather than tracking sleep or playing white noise. The technical scope is achievable in 1 day: SwiftUI forms + UserNotifications + UserDefaults + streak logic. Zero backend required. RevenueCat integration adds 30 minutes. Subscription at $4.99/month is defensible because sleep improvement has clear perceived value.

**App Name Candidate:** SleepRitual, NightRoutine, Ritualize, DreamPrep

---

*Sources:*
- [Business of Apps – Wellness 2026](https://www.businessofapps.com/data/wellness-app-market/)
- [Business of Apps – Health App Market 2026](https://www.businessofapps.com/data/health-app-market/)
- [NichesHunter – Indie App Ideas 2026](https://nicheshunter.app/blog/app-ideas-indie-hackers-solo-devs-studios)
- [Diginautical – iOS Trends 2026](https://diginautical.com/blogs/top-10-ios-app-development-trends-you-cant-ignore-in-2026/)
- [Apple Foundation Models Framework](https://www.apple.com/newsroom/2025/09/apples-foundation-models-framework-unlocks-new-intelligent-app-experiences/)
- [Grand View Research – Fitness App Market](https://www.grandviewresearch.com/industry-analysis/fitness-app-market)
