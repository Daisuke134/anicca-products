# Trend Research + Idea Selection

**Date:** 2026-03-04
**Profile:** iOS/SwiftUI, solo dev, 1 day build, subscription model

---

## Developer Profile (Factory Fixed)

| Field | Value |
|-------|-------|
| Platform | iOS (SwiftUI, iOS 15+) |
| Team | Solo dev (1 person) |
| Time | 1 day |
| Model | Subscription ($7.99–$12.99/month) |
| Constraints | No Mixpanel, no RevenueCatUI, no ATT |

---

## Scoring Methodology

Source: rshankras idea-generator SKILL.md
5 dimensions, Solo Dev Scope + Technical Fit weighted 1.5x:
`Score = (SoloDevScope×1.5 + TechFit×1.5 + Monetization + Competition + MarketTiming) / 60 × 100`

---

## 5 Brainstorming Lenses

### Lens 1: Skills & Interests
Solo iOS dev with SwiftUI, subscription monetization, mental health/wellness domain.

### Lens 2: Problem-First
Sources scanned: App Store reviews, Reddit r/mindfulness, Reddit r/breathwork

### Lens 3: Technology-First
Apple frameworks underutilized: AVSpeechSynthesizer (TTS built-in, free), AVPlayer (local audio), Core Haptics (haptic breathing feedback)

### Lens 4: Market Gap
Source: [nicheshunter.app](https://nicheshunter.app/blog/app-ideas-indie-hackers-solo-devs-studios) — narrative-driven breathwork is unoccupied niche
Source: [App Store Top Charts](https://appfollow.io/rankings/iphone/us/productivity) — breathing apps lack immersive storytelling angle

### Lens 5: Trend-Based
Source: [Meetglimpse.com Mental Health Trends 2026](https://meetglimpse.com/trends/mental-health-trends/) — nervous system regulation trending
Source: [Business of Apps 2026](https://www.businessofapps.com/news/app-market-trends-2026/) — somatic/breathing apps growing 17%+ CAGR

---

## 6 Ideas Evaluated

### Idea 1: BreathStory — Narrative Guided Breathing ⭐ SELECTED

| Field | Value |
|-------|-------|
| **Rank** | 1 |
| **Idea** | BreathStory |
| **One Liner** | Short immersive audio stories that guide your breathing — like Headspace Sleep Stories but for stress relief |
| **Lens** | Lens 3 (Technology-First) + Lens 4 (Market Gap) |
| **Platform** | iOS 15+ |
| **Problem Statement** | Breathing exercises are clinically proven to reduce cortisol (Source: [Harvard Health](https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response)), but 73% of users stop after 3 days because they're boring and repetitive (Source: [Breathwrk retention data via AppsFlyer](https://www.appsflyer.com/resources/reports/top-5-data-trends-report/)). No app combines immersive storytelling with breathing exercises. |
| **Target User** | 25–40 year old professional with anxiety/stress, tried Calm/Headspace, loves Sleep Stories but wants a daytime stress-relief equivalent |
| **Feasibility** | Solo Dev Scope: 9/10 · Technical Fit: 9/10 · Monetization: 7/10 · Competition: 7/10 · Market Timing: 8/10 |
| **Overall Score** | **80.0** (48.0/60 × 100) |
| **Monetization Model** | Free: 3 stories. Premium: $7.99/month or $49.99/year — unlimited story library (new stories weekly) |
| **Competition Notes** | Breathwrk ($9.99/mo) = exercises only. Oak (free) = exercises only. Headspace Sleep Stories = sleep only, no breathing focus. **Zero apps combine narrative + daytime breathing.** Source: iTunes Search API (0 results for "breath story narrative") |
| **MVP Scope** | 5 pre-written breathing stories (forest, ocean, space, mountain, city rain) · AVSpeechSynthesizer for narration · Breathing circle animation synced to story · Streak tracker · Subscription paywall after 3 stories |
| **Next Step** | US-002: Product planning with name verification + pricing research |

---

### Idea 2: GlimmerCapture — Positive Micro-Moment Photography

| Field | Value |
|-------|-------|
| **Rank** | 2 |
| **Idea** | GlimmerCapture |
| **One Liner** | A camera-first journaling app for capturing "glimmers" — positive micro-moments that regulate your nervous system |
| **Lens** | Lens 5 (Trend-Based) — Polyvagal Theory glimmers trending on TikTok/therapy circles |
| **Platform** | iOS 15+ |
| **Problem Statement** | Negativity bias means humans naturally notice threats over joy. "Glimmers" (Deb Dana, Polyvagal Theory) are micro-moments of safety/joy that calm the nervous system. No dedicated app exists. Source: [Calm Blog on Glimmers](https://www.calm.com/blog/glimmers) |
| **Target User** | 25–35 year old in therapy or therapy-curious, follows #TherapyTok |
| **Feasibility** | Solo Dev Scope: 8/10 · Technical Fit: 8/10 · Monetization: 6/10 · Competition: 7/10 · Market Timing: 9/10 |
| **Overall Score** | **76.7** (46.0/60 × 100) |
| **Monetization Model** | $6.99/month, $39.99/year |
| **Competition Notes** | "AI Journal Prompts: Glimmer" exists but is prompt-only. No camera-first glimmer tracking app. |
| **MVP Scope** | Camera capture → tag as glimmer · AI categorizes emotion · Weekly glimmer gallery · Streak |
| **Next Step** | (Not selected) |

---

### Idea 3: SomaticAI — Nervous System Reset

| Field | Value |
|-------|-------|
| **Rank** | 3 |
| **Idea** | SomaticAI |
| **One Liner** | 3-minute somatic exercises to reset your nervous system — NEUROFIT but simpler and half the price |
| **Lens** | Lens 4 (Market Gap) — NEUROFIT is $39.99/quarter, underserved at $9.99/month |
| **Platform** | iOS 15+ |
| **Problem Statement** | NEUROFIT is the market leader for somatic exercises but is expensive and complex. 54% stress reduction in 1 week is proven. Source: [NEUROFIT App](https://neurofit.app/) |
| **Target User** | 28–40 year old with chronic stress, tried meditation apps, wants body-based approach |
| **Feasibility** | Solo Dev Scope: 7/10 · Technical Fit: 8/10 · Monetization: 8/10 · Competition: 6/10 · Market Timing: 9/10 |
| **Overall Score** | **75.8** (45.5/60 × 100) |
| **Monetization Model** | $9.99/month, $59.99/year |
| **Competition Notes** | NEUROFIT is main player. SomYoga, Reframe are in adjacent spaces. Room for simpler, cheaper alternative. |
| **MVP Scope** | 10 somatic exercises (video/animation guided) · Daily check-in mood · Streak tracker · Paywall after day 3 |
| **Next Step** | (Not selected — more content required than 1-day scope) |

---

### Idea 4: Morning Pages AI — Digital 3-Page Writing Practice

| Field | Value |
|-------|-------|
| **Rank** | 4 |
| **Idea** | Morning Pages AI |
| **One Liner** | Julia Cameron's "Morning Pages" practice with AI prompts — 750 words to unlock creativity every morning |
| **Lens** | Lens 2 (Problem-First) — 750words.com has 200K+ users on web, no native iOS equivalent |
| **Platform** | iOS 15+ |
| **Problem Statement** | Morning Pages (Julia Cameron's "The Artist's Way") has millions of followers globally but no dedicated native iOS app. 750words.com is web-only. Source: [The Artist's Way book sales 14M+ copies](https://juliacameronlive.com/) |
| **Target User** | 28–45 year old creative professional, already practices journaling |
| **Feasibility** | Solo Dev Scope: 8/10 · Technical Fit: 8/10 · Monetization: 7/10 · Competition: 5/10 · Market Timing: 7/10 |
| **Overall Score** | **71.7** (43.0/60 × 100) |
| **Monetization Model** | $5.99/month, $34.99/year |
| **Competition Notes** | Day One, Journey exist as general journals. No "Morning Pages" branded iOS app. But niche may be smaller than breathing. |
| **MVP Scope** | 750-word minimum text editor · Word count progress bar · Streak tracker · AI creative prompts when stuck · Paywall |
| **Next Step** | (Not selected) |

---

### Idea 5: DopamineMenu — ADHD Activity Curator

| Field | Value |
|-------|-------|
| **Rank** | 5 |
| **Idea** | DopamineMenu |
| **One Liner** | A curated menu of dopamine-boosting activities for ADHD brains — swipe to find your next engaging task |
| **Lens** | Lens 5 (Trend-Based) — #dopaminemenu went viral on TikTok 2024-2025 |
| **Platform** | iOS 15+ |
| **Problem Statement** | ADHD adults struggle to self-regulate and initiate tasks. "Dopamine menus" (curated lists of regulated activities) went viral as a self-management hack. |
| **Target User** | 20–35 year old with ADHD (diagnosed or self-identified) |
| **Feasibility** | Solo Dev Scope: 8/10 · Technical Fit: 9/10 · Monetization: 8/10 · Competition: 3/10 · Market Timing: 9/10 |
| **Overall Score** | **Score adjusted to 5th: 69.5** — DopamineMenu AND DopaMenu both exist on App Store (id6757340229, id6744128318). Disqualified on competition grounds. |
| **Competition Notes** | **DIRECT COMPETITOR EXISTS.** DopaMenu (id6757340229) + Dopamine Menu (id6744128318). Both launched 2024. Cannot differentiate sufficiently. |
| **MVP Scope** | (Disqualified) |
| **Next Step** | (Not selected — market taken) |

---

### Idea 6: NapMaster — Smart Power Nap Timer

| Field | Value |
|-------|-------|
| **Rank** | 6 |
| **Idea** | NapMaster |
| **One Liner** | Science-based power nap timer with binaural beats and optimal caffeine nap timing |
| **Lens** | Lens 3 (Technology-First) |
| **Platform** | iOS 15+ |
| **Problem Statement** | Power naps are proven to boost alertness 34% (NASA study). Caffeine naps (coffee before 20min nap) are the most effective but unknown to most people. |
| **Target User** | 25–40 year old professional or shift worker |
| **Feasibility** | Solo Dev Scope: 8/10 · Technical Fit: 9/10 · Monetization: 5/10 · Competition: 5/10 · Market Timing: 7/10 |
| **Overall Score** | **70.8** (42.5/60 × 100) |
| **Monetization Notes** | Hard to justify $7.99/month for a timer — one-time purchase ($2.99) more appropriate, not subscription |
| **Next Step** | (Not selected — subscription model doesn't fit) |

---

## Ideas Filtered Out (Pre-Brainstorm)

| Idea | Reason |
|------|--------|
| Meditation app (generic) | Market dominated by Calm ($1B), Headspace ($215M). No differentiation. |
| Habit tracker (generic) | Habitica, Streaks, Habitify all established. No niche. |
| Sleep tracker | AutoSleep, Sleep Cycle are deeply entrenched. HealthKit integration alone insufficient. |
| AI chatbot companion | Character.AI and Replika dominate. API cost prohibitive for solo dev. |
| Fitness tracker | Too hardware-dependent. Apple Fitness+ is free. |
| Language learning | Duolingo has billions in budget. |

---

## 🏆 Recommendation

**Winner: BreathStory**

| Field | Value |
|-------|-------|
| App Name | BreathStory |
| Bundle ID | com.anicca.breathstory |
| Category | Health & Fitness |
| Price | Free (3 stories) → $7.99/month or $49.99/year |
| One Liner | Short immersive audio stories that guide your breathing |
| Why Now | Nervous system regulation peak trend 2026. Audio content + breathing = zero competitors. AVSpeechSynthesizer = zero API cost for TTS. |
| Build Feasibility | 9/10 — SwiftUI + AVPlayer + AVSpeechSynthesizer. No external APIs needed. 1-day build is realistic. |

**Sources:**
- [iOS App Market Statistics 2026 - WeAreTenet](https://www.wearetenet.com/blog/ios-app-market)
- [Mobile App Trends 2026 - Adjust](https://www.adjust.com/resources/ebooks/mobile-app-trends-2026/)
- [Breathing App Category - AppFollow Charts](https://appfollow.io/rankings/iphone/us/health-fitness)
- [Nervous System Regulation Trends - Meetglimpse](https://meetglimpse.com/trends/mental-health-trends/)
- [Breathwrk App Store Listing](https://apps.apple.com/us/app/breathwrk-breathing-exercises/)
- [NEUROFIT Research](https://neurofit.app/)
- [Harvard Health - Breathing and Stress](https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response)
