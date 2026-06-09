# Anicca Life Manager — Fix + OSS/Web Roadmap

| Field | Value |
|---|---|
| Date | 2026-06-09 |
| Author | Anicca (Claude Code) |
| Status | SPEC — PHASE 0 in progress |
| Branch | dev |
| Related | `2026-06-07-anicca-saas-v1-design.md` (SaaS), `2026-06-08-clean-skill-cron-separation-design.md` (SSOT) |
| Voice stack | sonichi/sutando phone-conversation (= bodhi-realtime-agent + Gemini Live + Twilio). ★ NOT Pipecat ★ — folder `~/research/pipecat/` name is misleading; pipecat/ + pipecat-examples/ are unused clones. |

---

## 0. TL;DR

Anicca is a behavioral-change agent that calls the user (Charon male voice,
Gemini Live, bidirectional) at every action time — wake / move / sleep / meds /
meditation — by knowing the user's live location and searching the next event's
real location + route. Two shipping targets:

- **OSS (local)**: runs on the user's own always-on Mac, user sets own LLM keys, no subscription.
- **Web (cloud SaaS)**: runs in a per-user Daytona sandbox, $49.99/mo subscription, we host compute, auto-cancels when wild-Anicca treasury can fund the user.

The public marketing copy (Dais 2026-06-09):

> いつでも10分前行動ができるように、自分の位置を常に把握して行動（起床・移動・就寝・薬・瞑想など）の時間になると通知・電話をしてくれる行動変容エージェント アニッチャを公開しました。
> ・名前・電話番号・位置情報・カレンダー情報を連携すると、行動の時間になると電話してくれる。
> ・遅れそうな場合は、きちんと関係者へ連絡（最後はあなたが返信案を承認）。
> ・どうやったらあなたが行動するか把握して、介入時間・方法を自己改善
> ・信用残高が自動で溜まっていく。
> ・毎日あなたへのメッセージをメールで送ってくれる。
> ・最初はサブスク課金、アニッチャが自分でお金を稼げると自動的にサブスクを解約してくれる。
> Webアプリとして公開しましたので私みたいな人はぜひ。

---

## 1. Voice stack clarification (= what we actually run)

```
~/research/pipecat/            ← parent folder name is "pipecat" (misleading)
   ├── pipecat/                ← UNUSED (clone only)
   ├── pipecat-examples/       ← UNUSED (reference only)
   └── sutando/                ← ★ THIS runs ★ (github.com/sonichi/sutando)
         skills/phone-conversation/scripts/conversation-server.ts
           import { VoiceSession } from 'bodhi-realtime-agent'  ← TS, NOT pipecat
           bodhi deps = @ai-sdk/google + @google/genai + openai + ws + zod
```

Our only tweak to sutando = 1 line:
```diff
- speechConfig: { voiceName: 'Aoede' },                               (= female, sutando default)
+ speechConfig: { voiceName: process.env.PHONE_VOICE_NAME || 'Charon' }, (= male, env-overridable)
```

★ Zero original voice infra. We clone sutando + 1-line tweak. ★

---

## 2. Current bug (= why Anicca isn't calling) — PHASE 0 root cause

Two stacked problems, both must be fixed:

### 2.A glob regression (= Anicca's own bug, this session)

`lateness_check.py:265` `get_location()`:
```python
files = sorted(LOCATION_STATE_DIR.glob("*.json"), key=mtime, reverse=True)
rec = json.loads(files[0]); return {"lat": rec["lat"], ...}  # KeyError → None
```
`realtime_guide.py` writes `guide_state_<uid>.json` + `itinerary_<uid>.json` into
the SAME `~/.openclaw/state/location/` dir. The freshest file becomes
`guide_state_<uid>.json` (no top-level `lat`) → KeyError → None → heartbeat
reports `no-location` forever, even when a fresh GPS fix exists.

**Fix (0-1)**:
```diff
- files = sorted(LOCATION_STATE_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
+ files = sorted(
+     (p for p in LOCATION_STATE_DIR.glob("*.json") if p.stem.isdigit()),
+     key=lambda p: p.stat().st_mtime, reverse=True,
+ )
```
Telegram user-id files are all-digits (`8547730585.json`); `guide_state_*` /
`itinerary_*` have underscores → excluded by `stem.isdigit()`.

**Deeper fix (0-5)**: move guide_state/itinerary OUT of `state/location/` into
`state/guide/` so the location dir only ever holds GPS files (defense in depth).

### 2.B Live Location session expired (= user-side)

`8547730585.json` is 17h stale (last 6/8 15:55). The bot daemon (PID alive) polls
getUpdates every 10s but receives no location updates. Telegram Live Location
auto-stops after the chosen duration (max 8h). The user must **re-share Live
Location freshly** (📎 → Location → Share Live Location → 8h). No code fixes this.

★ Both A (code) and B (user re-share) are required before any call fires. ★

---

## 3. Same-place action call (= implemented this session, blocked by 2.A)

`gcal_departures.py` already classifies `routine_at_home` (wake/sleep/meditation/
meal/home-run) and computes departBy. `lateness_check.decide()` was patched so the
"arrived → ok" shortcut applies ONLY to travel events; routine_at_home/baked events
fall through to the departBy timing check and fire `action=call` at action time.
`main()` was patched so an imminent (≤30min) routine event punches through quiet
hours (wake calls must fire during sleep window). The hard shell quiet-guard in
run.sh was removed. ★ Correct, but never reaches decide() until 2.A is fixed. ★

---

## 4. Architecture (local = cloud, same code)

```
┌─────────── user's iPhone ───────────┐
│  Telegram @AniccaLifeBot            │
│   ├ Live Location (8h, 5s)          │   ☎️ Twilio number (Charon male)
│   ├ text per step                   │
│   └ Google biometric (onboarding)   │
└────────────────┬────────────────────┘
                 │
   ┌─────────────┼──────────────────────────┐
   ▼             ▼                           ▼
telegram_bot  lateness_check (cron */5)   sutando conversation-server (:3100)
 GPS→state    gcal × GPS × time → decide   bodhi VoiceSession = Twilio↔GeminiLive
                 │
                 ▼
            transit_lookup
            Geocoding + Firecrawl (MUIT→住所) + transitous (route)

LOCAL  = ~/.openclaw on user's Mac, user's own keys, launchd daemons, no subscription
CLOUD  = per-user Daytona sandbox, our keys, sandbox init.sh daemons, $49.99/mo
         same 5 scripts, different location + key owner
```

---

## 5. Full roadmap (= TaskList #13-#28)

### PHASE 0 — fix my Anicca so it calls at all times

| Task | What |
|---|---|
| 0-1 (#13) | glob fix `stem.isdigit()` |
| 0-2 | Dais re-shares Live Location (user action) |
| 0-3 (#14) | verify fresh location age<60s |
| 0-4 (#15) | E2E: wake/meditation/sleep → real call (Charon) |
| 0-5 (#16) | move guide_state/itinerary to state/guide/ |

### PHASE 1 — local refactor (after working)

| Task | What |
|---|---|
| 1-1 (#17) | consolidate lateness-guard + anicca-life-manager into one skill |
| 1-2/1-3/1-4 | de-dup lateness_check, separate state dirs, clean skill/cron separation (SSOT) |

### PHASE 2 — local feature completion (public-copy promises)

| Task | Promise |
|---|---|
| 2-1 (#18) | intervention self-improvement loop (介入時間・方法を自己改善) |
| 2-2 (#19) | trust balance counter (信用残高) |
| 2-3 (#20) | daily email (毎日メッセージをメール) |
| 2-4 (#21) | lateness → stakeholder notify + approval (関係者へ連絡) |

### PHASE 3 — web app (cloud SaaS, mostly unbuilt)

| Task | What |
|---|---|
| 3-1 (#22) | /install SaaS LP (public copy), move OSS to /oss |
| 3-3 (#23) | Stripe Checkout $49.99/mo + 7d trial (web only; OSS sets own keys) |
| 3-4 (#24) | Telegram 60s onboarding (name/loc/phone/cal) |
| 3-5 (#25) | apps/api Stripe webhook → Daytona spawn |
| 3-6 (#26) | Daytona sandbox 5 daemons |
| 3-7 (#27) | OAuth token vault (Supabase RLS) |
| 3-8 | daily email per-user |
| 3-9 (#28) | auto-cancel: wild treasury → Stripe cancel → free mail |

### Done already (this session)

- ③ Claude models removed everywhere (cron mail-triage + inbox draft/triage/irreversible → gpt-5.4-mini/deepseek/kimi; models.json anthropic-vertex removed; claude-p-heartbeat DISABLED). Commit anicca-dais 92c6b9168.
- ① same-place action call + quiet punch-through (commit 94889a406) — blocked by 2.A until glob fix lands.
- Firecrawl venue fallback (MUIT → address) (commit 2e28a4b9b).

★ Subscription = web only. OSS users set their own LLM keys (Dais 2026-06-09). ★

---

## 6. Heartbeat schedule guarantee (Dais 2026-06-09)

Verified from `~/.openclaw/cron/jobs.json` + `profile.json`:

| Fact | Value |
|---|---|
| cron `anicca-lateness-heartbeat-shell` | `*/5 * * * *` Asia/Tokyo, enabled — fires every 5 min, 24/7 |
| quiet hours | 23:30–05:30 (profile.alarm.quietHoursStart/End) |
| quiet-hours behavior | ordinary routine polling silenced, BUT wake/meditation/meds/sleep events within QUIET_OVERRIDE_MIN(30) PUNCH THROUGH and still call |

**Effective coverage**:
```
05:30 ─────────────────── 23:30   = FULLY ACTIVE (every event → call)
23:30 ─────────────────── 05:30   = quiet, BUT wake/瞑想/就寝/薬 events still call (punch-through)
```
→ Anicca can call at ANY time of day for action events (incl. wake-up during sleep window).
→ This is GUARANTEED ONLY AFTER the glob bug fix (§2.A). Until then everything returns no-location.

## 7. Git recovery (2026-06-09 incident)

Root cause: prior sessions committed to local `main` but never pushed → 3074 unpushed
commits accumulated + local main diverged 3074-ahead / 37-behind from origin/main.
On top, 414 uncommitted WIP files (secrets + junk + real docs + stale iOS/landing).

| Step | Status |
|---|---|
| G-0 backup 3074 commits → origin/backup/main-3074-unpushed-2026-06-09 | ✅ DONE (b1243b94) |
| G-1 remove broken symlink .claude/skills/frontend-design | pending |
| G-2 .gitignore junk+secret, rm $(date) broken dir | pending |
| G-3 commit real docs (superpowers/memories non-secret) to main | pending |
| G-4 reconcile main with origin/main, push | pending |
| G-5 triage iOS/landing 376 stale (mostly already in backup) | pending |
| G-6 HENCEFORTH: 1 edit = 1 commit = 1 push (HARD RULE 0.00) | ongoing |

## 8. FULL TODO (canonical, TaskList #13-#34)

```
GIT RECOVERY (urgent, blocking clean state):
  G-0 ✅ backup 3074 commits to GitHub
  G-1 rm broken symlink
  G-2 gitignore junk+secret, rm $(date) dir
  G-3 commit real docs to main + push
  G-4 reconcile main ↔ origin/main + push
  G-5 triage iOS/landing stale
  G-6 push-as-you-go forever

PHASE 0 — make Anicca call at all times (LOCAL first):
  0-1 (#13) glob bug fix stem.isdigit()   ← my regression, do now
  0-2       Dais re-shares Live Location
  0-3 (#14) verify fresh location age<60s
  0-4 (#15) E2E wake/瞑想/就寝 real call (Charon male)
  0-5 (#16) move guide_state to state/guide/

PHASE 1 — local refactor:
  1-1 (#17) consolidate lateness-guard + anicca-life-manager

PHASE 2 — local feature completion (public-copy promises):
  2-1 (#18) intervention self-improvement loop
  2-2 (#19) trust balance counter
  2-3 (#20) daily email
  2-4 (#21) lateness → stakeholder notify + approval

PHASE 3 — web SaaS (cloud, mostly unbuilt):
  3-1 (#22) /install SaaS LP + /oss split
  3-3 (#23) Stripe $49.99/mo + 7d trial (web only)
  3-4 (#24) Telegram 60s onboarding
  3-5 (#25) Stripe webhook → Daytona spawn
  3-6 (#26) Daytona sandbox 5 daemons
  3-7 (#27) OAuth token vault
  3-9 (#28) auto-cancel (wild treasury → free)
```

Subscription = web only. OSS users set own LLM keys. (Dais 2026-06-09)

---

## 9. Architecture decision: MERGE into ONE OSS repo (Dais 2026-06-09)

**Decision (best practice, not opinion)**: ★ ONE OSS codebase, ONE core, two deployment modes ★.
NOT two separate codebases.

Precedent (OSS products that ship BOTH self-host + cloud from one repo):
- Supabase, PostHog, Plausible, Cal.com — all single OSS repo, cloud = same code + thin control-plane.

```
anicca-oss (ONE repo, MIT, public)
│
├── core/  ← ★ IDENTICAL for local AND cloud ★ (the life manager)
│     skills/anicca-life-manager/
│       telegram_bot.py        GPS sink (Telegram Live Location)
│       lateness_check.py      gcal × GPS × time → decide → call
│       gcal_departures.py     event → departBy (routine_at_home aware)
│       transit_lookup.py      Geocoding + Firecrawl(MUIT→住所) + transitous(route)
│       realtime_guide.py      step-by-step Telegram guide during travel
│     vendor/sutando/          phone-conversation (Charon, Gemini Live, Twilio)
│
├── deploy/local/   ← OSS user (self-host)
│     install.sh              clone + .env(own keys) + launchd plists
│     → runs core on user's Mac, user pays own LLM/Twilio
│     → NO subscription
│
└── apps/control-plane/  ← ★ CLOUD ONLY (thin layer) ★
      web/      aniccaai.com/install LP + Stripe Checkout + Telegram onboarding
      api/      Stripe webhook → Daytona sandbox spawn (runs SAME core/)
      vault/    per-user OAuth tokens (Supabase RLS)
      treasury/ wild-Anicca earnings → auto-cancel sub when self-funded
      → cloud user pays $49.99/mo, we host, same core runs in their sandbox
```

**Why merge, not separate**:
| | Merged (chosen) | Separated (rejected) |
|---|---|---|
| Bug fix | fix once, both get it | fix twice, drift |
| OSS promise | full product is OSS | cloud-only features hidden |
| local=cloud parity | guaranteed (same core/) | diverges over time |
| maintenance | 1 repo | 2 repos, 2x work |

**The ONLY difference local vs cloud**:
- WHERE core/ runs: user's Mac (local) vs Daytona sandbox (cloud)
- WHO owns keys: user (local) vs us (cloud)
- BILLING: none (local) vs Stripe $49.99/mo (cloud)
- control-plane (apps/control-plane/) exists ONLY for cloud; local ignores it

★ Subscription = cloud only. OSS local user sets own keys, no charge. Both run the identical life-manager core. ★

## 10. Life manager — how it works (canonical flow)

```
EVERY 5 MIN (cron */5, 24/7):
  ┌────────────────────────────────────────────────────────────────┐
  │ 1. get_location()  ← state/location/<uid>.json (digit-only glob)│
  │      Telegram Live Location, refreshed every 5s by telegram_bot │
  │ 2. get_departures() ← Google Calendar (next 7 days of events)   │
  │      each event classified: routine_at_home OR travel           │
  │      venue resolved: Geocoding → (fail) Firecrawl "<name> 住所"  │
  │      route + departBy: transitous (train) for travel events     │
  │ 3. decide(now, location, events):                               │
  │      travel event, en route, on time      → ok (silent)         │
  │      travel event, arrived                 → ok (silent)        │
  │      travel event, departBy passed+still home → CALL (leave now)│
  │      routine_at_home (wake/瞑想/就寝/薬), departBy → CALL        │
  │      quiet hours 23:30-05:30: silent EXCEPT routine punch-through│
  │ 4. if CALL:                                                     │
  │      _build_anicca_voice_prompt(ctx + GPS + route + event)      │
  │      POST sutando :3100/call {to, message}                      │
  │      Twilio Media Streams ↔ Gemini Live (Charon male, ja-JP)    │
  │      ☎️ "Dais さん、 瞑想の時間です" → 双方向会話 → hang_up      │
  │ 5. if travel + moving: realtime_guide pushes Telegram text      │
  │      at each leg (改札/乗換/降りる駅/方向違い)                   │
  └────────────────────────────────────────────────────────────────┘
```

---

## 11. Phone call bugs fixed (2026-06-09, transcript-verified)

| Bug | Root cause | Fix | Verify |
|---|---|---|---|
| "application error, goodbye" | dialout → dead port 7860 (old pipecat) | run.sh + secrets → port 3100 (sutando) | call connects |
| call connects but silent | cloudflared quick tunnel rotated URL on restart; sutando cached old URL at startup | restart sutando to re-read live tunnel URL | WS connects, VoiceSession starts |
| agent says "I'm Sutando" | sutando buildAgent() hardcodes 'You are Sutando' | patch line 503: outbound call with purpose → purpose IS the lead persona (Anicca). patches/sutando/0001-anicca-identity-override.patch | transcript: "Dais さん、アニッチャです" |
| not responding to user | (was actually working; masked by above bugs) | — | transcript: caller "1+2?" → agent "1+2は3ですよ", Dais said "it's working" |

**Remaining (task 0-6, permanent)**: cloudflared quick tunnel rotates URL → need
named tunnel (phone.aniccaai.com fixed) OR auto-restart sutando on URL change.
Currently mitigated by manual sutando restart.

**E2E proof** (call CAb136, transcript ~/.sutando/workspace/logs/conversation.log):
```
agent : Dais さん、アニッチャです
caller: Can you hear me?
agent : もちろん、聞こえていますよ。どうしましたか?
caller: what's your name?
agent : Dais さん、アニッチャです。何かお用ですか?
caller: then what's 1 + 2?
agent : 1 + 2は3ですよ。
caller: Okay, it's working, it's working. It's good.   ← Dais confirmed
```

---

## 12. OSS (local) vs WEB (cloud) user experience

### 12.1 OSS user UX (= Dais-type, self-host)

```
WHO: own Mac always-on, own API keys, no subscription.

DAY 0 install (15 min):
  aniccaai.com/oss → paste 1 prompt into Claude Code/Cursor
    AI asks 1-at-a-time: GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, TWILIO_*,
    GOOGLE_API_KEY, FIRECRAWL_API_KEY → ~/.openclaw/.env
  6 launchd daemons start (telegram_bot, lateness_check */5,
    realtime_guide, sutando phone, tunnel, tunnel-watcher)
  Telegram /start → Live Location + Google Calendar

DAY 1+:
  06:00 ☎️ "Dais さん、アニッチャです。起きる時間です"
  06:30 ☎️ "瞑想の時間です"  07:00 ☎️ "薬飲みましたか?"
  08:14 ☎️ "中野まで34分、今出れば10分前着" → 移動中 Telegram 駅案内
  (late risk) → renraku draft → user approves → send
  22:45 ☎️ "寝る準備を"   每朝 📧 daily message

  Runs on USER's GEMINI_API_KEY (pay-per-use ~$10-25/mo). No subscription.
```

### 12.2 WEB user UX (= general public, cloud SaaS)

```
WHO: normal person. won't install. has Telegram. pays monthly.

T=0   aniccaai.com/install → 1 button "Telegram で 始める"
T=3   @anicca_bot opens:
        "名前を教えて" → "Dais"
T=10  "Google カレンダー 繋いで (任意)" → [Continue with Google] biometric
T=20  "明日14:00 部長会議@大手町 ですね。 ご自宅の住所は?" → text/voice
T=35  "ライブ位置情報を共有して" → 1 tap (Telegram standard)
T=50  "電話番号を共有" → 1 tap
T=55  Anicca: "登録完了。 月$49.99、 最初7日無料"
        [ Start free trial → Stripe Checkout ] → Apple Pay biometric
T=60  "明日朝6:30にお電話します"

  ── BACKEND (user touches NOTHING) ──
  Stripe webhook (paid) → apps/api → spawn Daytona sandbox (1/user)
    sandbox init.sh starts SAME core/ (telegram_bot, lateness_check,
      realtime_guide, sutando phone — macOS-only tools disabled on Linux)
    OAuth tokens injected from vault (Supabase RLS)
    OUR Gemini key + OUR Twilio number pay for this user

DAY 1+ (identical experience to OSS, but cloud-hosted):
  06:30 ☎️ Charon (OUR Twilio number) "起きる時間です" → 双方向
  every action time → call/notify. 24/7. we monitor, we self-heal.

  Cost: $49.99/mo (7-day free trial). /cancel = 1 Telegram command.
  Auto-free: when wild-Anicca treasury can fund this user's compute,
    Anicca cancels the Stripe sub itself + mails "you're free now".
```

### 12.3 OSS vs WEB difference table

| | OSS (local) | WEB (cloud) |
|---|---|---|
| install | Claude Code 1 prompt (15min) | aniccaai.com 1 button (60s) |
| runs where | own Mac (~/.openclaw) | Daytona sandbox (Linux) |
| keys | user's own GEMINI/TWILIO | OURS |
| voice engine | Gemini (user key) | Gemini (our key) |
| billing | none | $49.99/mo (7d trial) |
| sutando macOS tools | available | DISABLED (Linux, phone-only) |
| uptime | user's Mac | we monitor 24/7 |
| auto-cancel | n/a | wild treasury → free |

★ core/ is byte-identical. Only WHERE it runs + WHO owns keys + billing differ. ★
