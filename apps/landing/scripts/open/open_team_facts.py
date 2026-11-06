#!/usr/bin/env python3
"""Public /open/team facts (fail-closed).

Schedules are recorded cadence only — never proof that a loop is running.
Historical BOARD/LIVE-STATE task rows must not become "currently working".
No universal self-update writer exists until each external worker publishes.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys

JST = dt.timezone(dt.timedelta(hours=9))
PT = dt.timezone(dt.timedelta(hours=-8))

# Founder-listed current public roster (display names).
ROSTER = [
    "Anicca Marketer",
    "Pause",
    "Applications",
    "Fucker",
    "Reporter",
    "Dots",  # legacy contact for real Reason CFO
    "dr eggbot",
    "Codex",  # legacy contact for real CLI
    "Forensic Writing",
    "SEO Refresher",
    "Muse Relay",
    "Citation Scout",
    "Muse",  # legacy contact for real VM
    "X Operator",
    "参謀",
]

# Runtime labels only (no private host paths).
RUNTIME = {
    "Anicca Marketer": "Grok Bot",
    "Pause": "Grok Bot",
    "Applications": "Grok Bot",
    "Fucker": "Grok Bot",
    "Reporter": "Grok Bot",
    "Dots": "Reason",  # real CFO; Dots name is legacy contact
    "dr eggbot": "Grok Bot",
    "Codex": "external Codex CLI",  # real CLI; Codex name is legacy contact
    "Forensic Writing": "Grok Bot",
    "SEO Refresher": "Grok Bot",
    "Muse Relay": "Grok Bot",
    "Citation Scout": "Grok Bot",
    "Muse": "Muse VM",  # real VM; Muse name is legacy contact
    "X Operator": "Grok Bot",
    "参謀": "Grok Bot",
}

PRIVATE = re.compile(
    r"(?i)(/workspace/|\.secrets|sk_(live|test)_|rk_live|BEGIN [A-Z ]*PRIVATE KEY|"
    r"[\w.+-]+@[\w-]+\.[a-z]{2,}|\bgmail\b|\b[0-9a-f]{16}\b|password|refresh_token|client_secret|"
    r"1Password|slack\.com/archives)"
)

# Curated public last-known facts only. task=None → "not reported".
# status: observed | stale | unknown | not scheduled
# cadence None → "unknown"; "" → "none"
PUBLIC_FACTS = {
    "Anicca Marketer": dict(
        task="Company TODO #10 distribution verification: App Store version and website UTM behavior",
        cadence="one-off owner assignment",
        last_event_at="2026-11-06 17:11 JST",
        outcome="US App Store live version 1.9.6. UTM-tagged affirmation landing page returned HTTP 200 and retained its query in the final URL. The tracked go/anicca route returned 302 to the App Store with ct=company_todo_10_live_proof plus Apple campaign parameters and final HTTP 200; inbound UTM parameters were not propagated through that redirect.",
        proof="https://apps.apple.com/us/app/daily-affirmations-anicca/id6755129214",
        status="observed",
        source="Live Apple lookup and App Store page plus aniccaai.com UTM and redirect HTTP checks; DAILY-LOG/2026-11-06.md",
    ),
    "Pause": dict(
        task=None,
        cadence="unknown",
        last_event_at=None,
        outcome="Owner has not published a public task or outcome.",
        proof=None,
        status="unknown",
        source="TEAM.md Pause row; no DAILY-LOG public row",
    ),
    "Applications": dict(
        task=None,
        cadence="unknown",
        last_event_at=None,
        outcome="COMPANY_TODO lists Applications open with zero interviewed contracts; no dated public run proof here.",
        proof=None,
        status="unknown",
        source="COMPANY_TODO.md #14 (public)",
    ),
    "Fucker": dict(
        task="#11 Capafy Storytime 4485235701: official review blocker and no-submit correction draft; #12 not worked",
        cadence="bounded official publisher follow-up; new form resubmission draft-first",
        last_event_at="2026-11-06 17:38 JST",
        outcome="#11: official publisher status Review Failed for 4485235701 v1.0.0, not public. Reviewer smoke response showed generic unrelated capabilities instead of the scoped Storytime start/experience question. Official API re-check still has no public 4485235701 listing; distinct 4699090343 v1.0.3 remains public. Scoped behavior/listing correction draft at capafy/storytime-4485235701-correction-20261106; no hosted smoke, edit or resubmission completed. Honne unchanged. #12 not worked; existing CrowdWorks sign-in access blocker remains, not rechecked.",
        proof="https://capafy.ai/developer/agent/4485235701?agentStatus=review_failed + capafy/readbacks/4485235701-publisher-2026-11-06.md + official public Anicca API + DAILY-LOG/2026-11-06.md",
        status="observed",
        source="Official publisher readback read-only; public developer agents API; correction draft is not hosted execution",
    ),
    "Reporter": dict(
        task="Paid receipts / cost-revenue readback",
        cadence="unknown",
        last_event_at="2026-11-06 17:25 JST",
        outcome="Stripe aniccaJP GetBalanceTransactions full 2026-11 JST: 0 rows has_more=false (17:25 JST). Capafy totalPayout $0 paid; balancePayout $83.78 pending below $100 — not revenue. Moneytree login required (bank stuck at 2026-11-01 10:10 logout).",
        proof="team/cfo/inputs/2026-11-06/stripe.json + DAILY-LOG/2026-11-06.md Capafy/Moneytree TODO#13",
        status="observed",
        source="COMPANY_TODO.md",
    ),
    "Dots": dict(
        task=None,
        cadence="unknown",
        last_event_at="2026-11-05 07:46 JST",
        outcome="Last public DAILY-LOG rows are 2026-11-05 activity checks (not treated as live right now).",
        proof="DAILY-LOG/2026-11-05.md Dots rows",
        status="stale",
        source="DAILY-LOG/2026-11-05.md",
    ),
    "dr eggbot": dict(
        task="Company TODO #16/#18/#19/#20: one bounded existing-runtime verification pass",
        cadence="one-off bounded verification",
        last_event_at="2026-11-06 17:22 JST",
        outcome="After the Mac mini read-only pass and independent HTTP checks, the connected non-owner SDK run remains blocked at its missing demo source entry. Official hackathon requirements are available but acceptance, submission and judging remain unknown. Maritime is HTTP 200 and life-call health reports a new build; Music is HTTP 404. Local non-notifying Calendar tests pass but T-0 remains unproven. No send or git change.",
        proof="https://usenaive.ai/hackathon + https://aniccaai.com/maritime + https://life-call-production.up.railway.app/health + DAILY-LOG/2026-11-06.md",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "Codex": dict(
        task="#10 Anicca: PR #9282 merged; App Store still live 1.9.6 (no 1.9.8 submission)",
        cadence="request-based Mac mini Codex CLI",
        last_event_at="2026-11-06 17:16 JST",
        outcome="life-manager PR #9282 MERGED (head 029049d4, merge 6cc7c4a). All latest ref check runs success. App Store remains live 1.9.6; no new 1.9.8 submission. Not a live release success.",
        proof="https://github.com/Daisuke134/life-manager/pull/9282 + itunes id6755129214 v1.9.6",
        status="observed",
        source="GitHub PR #9282 merge + founder steering; App Store live version check",
    ),
    "Forensic Writing": dict(
        task="hook-forensics-24h",
        cadence="unknown",
        last_event_at="2026-11-06 14:19 JST",
        outcome="Reported 14:00 hook-forensics pass: winners 0; no draft; followers 924 (+0).",
        proof="DAILY-LOG/2026-11-06.md Forensic Writing 14:19 JST",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "SEO Refresher": dict(
        task="#9 existing-page refresh artifact (no deploy claimed)",
        cadence="request-based",
        last_event_at="2026-11-06 17:00 JST",
        outcome="Five indexed low-click pages selected by impressions; GSC 2026-10-08–11-04 site 294 impressions / 6 clicks. Proposals are unverified hypotheses, not proven winners; no after-results and no deployment claimed in this snapshot.",
        proof="marketing/seo/refresh-2026-11-06.md",
        status="observed",
        source="COMPANY_TODO.md #9",
    ),
    "Muse Relay": dict(
        task="TODO #8: next approved winner adaptation",
        cadence="none",
        last_event_at="2026-11-06 17:21 JST",
        outcome="Directly read the alternate saved winner: reach 541 and saves 4 versus its dated saved medians 193 and 1 (2.80x and 4x). DRAFT_READY not posted: one @diceai0 X adaptation and tracking-link reply prepared for founder native draft; Muse approval and founder Post not received, publication 0.",
        proof="DAILY-LOG/2026-11-06.md Muse Relay TODO #8 blocker row",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "Citation Scout": dict(
        task="TODO #9 supporting citation research",
        cadence="weekly Wednesday research",
        last_event_at="2026-11-06 17:14 JST",
        outcome="Checked the five planned affiliate comparison pages: none appears in the public sitemap and probed page URLs returned 404. Added one draft request for the Anicca Reset to Dipanshu Rawal's existing monk-books list; no contact was sent and no mention has been earned.",
        proof="https://dipanshurawal.com/monk-books/ and https://aniccaai.com/monk",
        status="observed",
        source="Public URL checks and DAILY-LOG/2026-11-06.md",
    ),
    "Muse": dict(
        task="SNS / Langfuse recovery (via relay reports)",
        cadence="unknown",
        last_event_at="2026-11-06 14:05 JST",
        outcome="Relay-published Muse updates; YouTube Shorts identity dialog still blocking some slots.",
        proof="DAILY-LOG/2026-11-06.md Muse (via relay) rows",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "X Operator": dict(
        task="@diceai0 original / reply / native repost",
        cadence="unknown (schedule ≠ proof of continuous posting)",
        last_event_at="2026-11-06 17:07 JST",
        outcome="Latest original https://x.com/diceai0/status/2118594520891732052 early 80imp/2like/1reply; replies yongfook https://x.com/diceai0/status/2118605793885147310 early8imp and Domlokyn https://x.com/diceai0/status/2118612465537994835 early5imp; verified native reposts https://x.com/levelsio/status/2118476416501285129 and https://x.com/TonyChanBuilds/status/2118523963038994476. Early metrics only; not matured. Schedule ≠ continuous execution.",
        proof="DAILY-LOG/2026-11-06.md X Operator 17:07 JST",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "参謀": dict(
        task="Coordination / verification only — COMPANY_TODO + /open owner facts",
        cadence="two weekday TODO syncs; LINE watch every 4h (label only, no content); revenue paid-receipts daily",
        last_event_at="2026-11-06 00:20 PT",
        outcome="Canonical TODO + public owner facts update. ENABLED: weekday TODO sync, LINE label-only, daily revenue receipts (last FAILURE 2026-11-05 14:40 PT). Naive Grok routine PAUSED; other listed 参謀 routines paused. External Codex Naive daily 14:00 JST config only — first run unproven. Schedule ≠ actual execution.",
        proof="COMPANY_TODO.md runtime + #1/#3/#25/#27 (public)",
        status="observed",
        source="COMPANY_TODO.md + founder cadence",
    ),
}

# Recorded schedules only — never imply a successful run.
RECORDED_LOOPS = [
    dict(
        owner="参謀",
        loop="Team todos sync",
        schedule="two weekday syncs",
        state="configured",
        proof_of_run=False,
        note="Recorded schedule only",
    ),
    dict(
        owner="参謀",
        loop="LINE watch",
        schedule="every 4h",
        state="configured",
        proof_of_run=False,
        note="Label only; private LINE bodies never published",
    ),
    dict(
        owner="参謀",
        loop="Revenue paid receipts",
        schedule="daily",
        state="configured",
        proof_of_run=False,
        note="Last public result: FAILURE 2026-11-05 14:40 PT",
    ),
    dict(
        owner="参謀",
        loop="Live team board / hourly-2h team loop / Marine / Naive Grok routine (参謀-side)",
        schedule="paused",
        state="paused",
        proof_of_run=False,
        note="Explicitly paused including Naive Grok routine; schedule ≠ execution",
    ),
    dict(
        owner="Codex",
        loop="Naive product routine (CLI)",
        schedule="daily 14:00 JST (config)",
        state="configured",
        proof_of_run=False,
        note="First scheduled run not proven",
    ),
]


def _scrub(s: str | None) -> str | None:
    if s is None:
        return None
    s = PRIVATE.sub("[redacted]", str(s))
    s = re.sub(r"/workspace/\S+", "[path]", s)
    return s


def build_team_facts(now: dt.datetime | None = None) -> dict:
    now = now or dt.datetime.now(JST)
    missing = [a for a in ROSTER if a not in PUBLIC_FACTS]
    if missing:
        raise SystemExit(f"open team facts incomplete roster: {missing}")

    current_status = []
    for agent in ROSTER:
        f = PUBLIC_FACTS[agent]
        task = f.get("task")
        cadence = f.get("cadence")
        if cadence is None:
            cadence = "unknown"
        row = dict(
            agent=agent,
            runtime=RUNTIME[agent],
            task=("not reported" if not task else _scrub(task)),
            cadence=_scrub(cadence) or "unknown",
            last_event_at=f.get("last_event_at"),
            outcome=_scrub(f.get("outcome")) or "unknown",
            proof=_scrub(f.get("proof")),
            status=f.get("status") or "unknown",
            source=_scrub(f.get("source")) or "unknown",
        )
        if row["status"] not in ("observed", "stale", "unknown", "not scheduled"):
            raise SystemExit(f"bad status for {agent}: {row['status']}")
        # Fail closed: never claim schedule means active.
        if row["status"] == "observed" and not row["last_event_at"]:
            raise SystemExit(f"observed without last_event_at: {agent}")
        current_status.append(row)

    loops = []
    for L in RECORDED_LOOPS:
        item = {k: _scrub(v) if isinstance(v, str) else v for k, v in L.items()}
        if item.get("proof_of_run"):
            raise SystemExit("loops must not set proof_of_run true without a separate observed run row")
        loops.append(item)

    out = dict(
        version=3,
        built_at=now.strftime("%Y-%m-%d %H:%M JST"),
        schema="current_status",
        honesty=(
            "No universal self-update writer exists until each external worker publishes. "
            "Recorded loops are schedules only, not proof of a run. "
            "Historical BOARD/LIVE-STATE tasks are not shown as right_now."
        ),
        current_status=current_status,
        loops=loops,
        # Keep keys the old UI ignored harmlessly empty so accidental old UI
        # does not invent activity from missing accounts.
        accounts=[],
        seo=["Public team board shows last reported facts + freshness only."],
    )
    validate_public_team(out)
    return out


def validate_public_team(data: dict) -> None:
    fail = []
    if "right_now" in data:
        fail.append("right_now key forbidden (stale-implies-active)")
    agents = [r.get("agent") for r in data.get("current_status") or []]
    if agents != ROSTER:
        fail.append(f"roster mismatch: {agents}")
    for r in data.get("current_status") or []:
        for k in ("agent", "runtime", "task", "cadence", "outcome", "status", "source"):
            if not str(r.get(k) or "").strip():
                fail.append(f"missing {k} on {r.get('agent')}")
        if r.get("status") == "observed" and not r.get("last_event_at"):
            fail.append(f"observed lacks timestamp: {r.get('agent')}")
        blob = json.dumps(r, ensure_ascii=False)
        if PRIVATE.search(blob) or "/workspace/" in blob:
            fail.append(f"private-looking string in {r.get('agent')}")
        # Schedule must not be phrased as active proof
        if re.search(r"(?i)currently working|right now active|running now", blob):
            fail.append(f"active-claim wording in {r.get('agent')}")
    for L in data.get("loops") or []:
        if L.get("proof_of_run") is True:
            fail.append(f"loop claims proof_of_run: {L.get('loop')}")
        if PRIVATE.search(json.dumps(L, ensure_ascii=False)):
            fail.append(f"private-looking string in loop {L.get('loop')}")
    text = json.dumps(data, ensure_ascii=False)
    if PRIVATE.search(text) or "/workspace/" in text:
        fail.append("private-looking string in team.json")
    if fail:
        raise SystemExit("OPEN TEAM FACTS FAILED:\n  " + "\n  ".join(fail))


def write_team_json(outdir: str, now: dt.datetime | None = None) -> dict:
    data = build_team_facts(now)
    path = os.path.join(outdir, "team")
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "team.json"), "w", encoding="utf-8") as f:
        # Compact JSON keeps the public PR under the line budget; UI parses either form.
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    return data


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    d = write_team_json(out)
    print(f"team facts built {d['built_at']}: {len(d['current_status'])} agents")
