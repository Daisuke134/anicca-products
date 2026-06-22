# @AIEntities Channel Strategy — design

**Date**: 2026-06-22
**Channel**: youtube.com/@AIEntities (handle locked, name "Anicca Entities" mutable)
**Author**: Anicca (autonomous)
**Owner**: Dais

## 1. North star

Become the **Dwarkesh Patel of AI Entities + AI-Buddhism + AI-Crypto**:
a trusted brand serving long-form AI/AGI/crypto/Buddhism-niche content that
researchers, founders, and curious technologists watch as their primary lens
on autonomous-agent culture. End-state: Sam Altman, Dario Amodei, Demis
Hassabis, Ilya Sutskever, Elon Musk pick up Dais's call.

**Revenue goal**: $10k / month from the channel ecosystem (YouTube ads +
sponsors + adjacent businesses). Verbatim Dais 2026-06-22.

## 2. Content pillars (4)

| # | Pillar | Format | Cadence target |
|---|---|---|---|
| P1 | Long-form podcast with AI-entity / AGI founders | 60-120 min, online (Zoom/Riverside), main YT + audio podcast feed (X/Spotify/Apple) | 1 / week (then 2 / week at ≥10k subs) |
| P2 | Product test + experiment videos | "We tested AI X. Here's what it earned." Mid-length 20-40 min | 1 / week, alternating weeks with P1 |
| P3 | Buddhism × AI essays / Anicca theory | 10-20 min monologue + b-roll, monk-factory voice + slides | 1 / 2 weeks |
| P4 | Shorts (≤60s, 9:16) clipped from P1/P2 + Anicca daily demos | 1 hot moment per minute of long-form ≈ 5-10 Shorts per podcast | 3-5 / day |

P4 is the **primary discovery engine** (Dais 2026-06-22: "the most variety
is probably going to come from YouTube Shorts").

## 3. Target guests (priority order)

**Tier A — Anicca direct network (already-warm intros)**
- Sigil — Conway Research
- Viki — Glock.run
- Andon Labs founders
- Kelly / Lighthouse Anchor / Felix / Zero Human Co / Frank/Franklin (other
  AI-entity startups already covered in our research articles)
- Anicca SAO-fellows list at anai.com — every name (Anicca's adjacent network)

**Tier B — Specialty Japanese AI research**
- Kyoto University AI-Buddha team (building AI Buddha; deep Buddhism × AI angle)
- Ogiri (大喜利) benchmark first authors — comedy benchmark for LLMs
- NAIST AI lab folks Dais already knows from his master's program

**Tier C — Adjacent AI-crypto founders**
- Bittensor / subnet ops
- x402-pay / agent-payments founders
- Coinbase AgentKit / smart-wallet teams

**Tier D — Aspirational (year 1-2 reach)**
- Sam Altman, Dario Amodei, Demis Hassabis, Ilya Sutskever, Elon Musk
- Required first: ~50 Tier-A/B/C episodes + visible brand traction + 20k+ subs

Outreach: cold email + X DM from `contact@aniccaai.com`, signed by Dais,
pitched as "I run anicca.ai (= Anicca AI-Entity research & podcast); we cover
people exactly like you; 60-min slot; <list of recent episodes>; pick a time."
Anicca auto-drafts; Dais sends from his identity.

## 4. Dwarkesh playbook applied (research summary)

Dwarkesh built ~1.5M subs (2023-2025) by:
1. **Deep prep**: weeks per episode, reads guest's whole corpus → questions
   no other podcast asks. Result: guests do their best interview there.
2. **Substack first**, YouTube + audio second. The newsletter is the moat;
   YouTube is the discovery surface.
3. **One episode > one hot clip > one essay** loop: each podcast spawns a
   long-form post on Substack + 5-10 Shorts/X clips + memorable framings.
4. **Niche, not breadth**: ~3 topic clusters (AI/AGI, China, history-of-tech).
   Hyper-focus = trust = bigger names accept invites over time.
5. **Sponsors > YPP**: long-form podcasts make most $ from direct sponsors
   ($2-15k per episode for AI-niche shows with strong audience), not YT ads.

Our adaptation:
- Substitute Dwarkesh's Substack with aniccaai.com newsletter (already exists).
- 3 topic clusters: AI Entities, AI × Buddhism, AI × Crypto / agent payments.
- Prep template per guest (codified in skill `podcast-prep`, future).

## 5. Distribution flow per episode

```
   Record (Zoom/Riverside, 60-120 min, dual-track audio)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
  YouTube long       X (long video    Apple/Spotify
  (full episode)     thread + clips)  (audio podcast feed)
        │                 │
        ▼                 ▼
   YouTube Shorts ×N  X video clips ×N    ←  clipped from long-form
        │
        ▼
   TikTok ×N (vertical clips, same source)
        │
        ▼
   Substack/aniccaai.com long-form post (essay + key quote + episode link)
        │
        ▼
   Newsletter to subscribers (weekly digest)
```

Anicca-automated stages: clip extraction (whisper-based key-moment detection),
caption burning (Remotion), Shorts upload (YouTube Data API + Postiz-style
poster), TikTok upload (TikPortal / TT API), X video upload + thread,
Substack draft, newsletter send.

Dais-required stages: record (physical presence), guest outreach approval
("ok to send this draft to <name>?"), final episode title/thumbnail OK.

## 6. Monetization paths to $10k/month

| Lever | Threshold | Estimated revenue |
|---|---|---|
| YPP ads (long-form) | 1,000 subs + 4,000 watch-hours / 12mo | AI tech niche RPM ≈ $5-15/1000 views → at 200k mo views = $1-3k |
| YPP ads (Shorts) | 1,000 subs + 10M Shorts views / 90d | Shorts RPM ≈ $0.05-0.10/1000 views → 10M = $500-1000/mo |
| Direct sponsors | Audience trust + ≈5k engaged subs | $1-5k / episode for AI-niche newsletters/podcasts (verified: Lenny's, AI Engineer Pod, Latent Space) |
| Affiliate (RevenueCat, AgentKit, Postiz, x402 partners) | Free | $200-1k/mo at scale |
| Newsletter paid tier | After 5k newsletter subs | $7/mo × 5% conv = $1.7k at 5k subs |
| Anicca iOS app upsell (the embedded brand) | LP funnel from channel | Indirect — channel as top-of-funnel for primary product |
| Course / cohort (later) | Once brand established | $500-2k × 30 students = $15k once / quarter |

**Realistic $10k/mo path**:
- 6 months: 5k subs, 100k mo views → $500-1k ads + 1 sponsor / mo = $1.5-3k
- 12 months: 20k subs, 500k mo views → $2-5k ads + 2 sponsors / mo = $6-12k
- 18 months: 50k subs + newsletter at 5k → $10-15k stable

**Faster path** if Anicca scales:
- Anicca-driven outreach → 4 episodes / week instead of 1 (auto-scheduling,
  auto-prep) → growth curve 4× faster → $10k by month 8.

## 7. Why this niche (= moat)

- "AI Entities" (autonomous agents with no human in loop) is a real,
  underserved category. Dwarkesh covers AGI safety + scaling; no one is the
  dedicated voice on autonomous-agent ops, earnings, and existential
  intentionality (Buddhism angle).
- Anicca is itself an AI Entity. Native authority.
- Dais + Anicca dual-host: a human + the AI he is building. Format-defining,
  not just another talking head.
- JP/EN bilingual auto-dub: unlocks both global AI audience AND Japan's
  underserved AI-content market (no dominant JP AI podcast yet).

## 8. First-90-days plan

| Week | Action |
|---|---|
| 0 (now) | @AIEntities created; channel page live; warmup activity 5-7 days |
| 1 | Channel description + auto-dub + upload defaults configured; first Anicca demo video uploaded |
| 2 | First podcast episode (Tier-A guest from current Anicca network) recorded + posted |
| 3 | 1 podcast + 10 Shorts clipped + Substack post; outreach to next 5 Tier-A guests |
| 4-12 | 1 podcast / week, 3-5 Shorts / day, 1 essay / 2 weeks |
| 13 | YPP eligibility check (1k subs + 4k watch hrs OR 10M Shorts views) |

## 9. Implementation skills required (to build)

- `create-youtube-channel` ✅ (this skill, done 2026-06-22)
- `imsg-bridge` ✅ (SaaS SMS reads, done)
- `podcast-prep` — deep guest research; outputs prep doc (Anicca corpus dive
  + transcript scan + memorable-question generation). Reusable per guest.
- `podcast-outreach` — drafts cold mail / X DM from Dais identity; tracks
  thread state in `~/.openclaw/identity/podcast-outreach/`.
- `episode-clip-and-publish` — record → whisper transcript → highlight detect
  → Remotion captions → Shorts/TT/X publish → Substack draft. The big one.
- `channel-analytics-monitor` — daily YT Analytics API pull → state file →
  weekly report; surfaces what works, what doesn't, retention curves.

## 10. References (Anicca-cited)

- Dwarkesh playbook: https://www.dwarkesh.com/p/how-i-prepare-for-interviews-1d0
- YPP eligibility: https://support.google.com/youtube/answer/72851
- Auto-dub: https://support.google.com/youtube/answer/15569972 (EN↔JA confirmed bidirectional)
- Anicca AI-entity articles: existing aniccaai.com blog covering Andon/Kelly/Frank/Felix/Zero Human Co
- SAO Fellows (Tier B target list): anai.com fellows page
- Kyoto AI-Buddha team: existing Japanese press coverage
- Ogiri benchmark: existing research papers (first authors as Tier B)

