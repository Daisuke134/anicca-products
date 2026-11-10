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
        outcome="Stripe aniccaJP 2026-11 paid rows 0 (17:25 JST). Local Capafy payout_snapshot 2026-11-06 00:06 JST balance_payout_usd=$83.78 total_paid_out_usd=0, below $100, not revenue. Moneytree has no bank read. Full paid receipt and cost match stays in progress.",
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
        outcome="Read-only Naive SDK 2026-11-06 00:30 PT: prepaid balance $19.564708; existing agent agt_3b7pjzk133jd5tcjjxp54fbr66 N1_OK; tools disabled; task cap $0.05; zero sessions before the check. Box src/cycle.ts is present. No $0.05 session and no topup. Product flow and paid job unproven. Fresh GET 2026-11-06 03:54 PT: maritime 200, music 404, life-call health 200 build b17d6d66770ef72ed10d853d9523d61fda63d339. A Spotify artist link is not proof Music is fixed. PR 9283 is source-only.",
        proof="https://usenaive.ai/hackathon + https://aniccaai.com/maritime + https://life-call-production.up.railway.app/health + DAILY-LOG/2026-11-06.md",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "Codex": dict(
        task="#10 Anicca: PR #9282 merged; App Store still live 1.9.6 (no 1.9.8 submission)",
        cadence="request-based Mac mini Codex CLI",
        last_event_at="2026-11-06 17:44 JST",
        outcome="life-manager PR #9282 MERGED (head 029049d4, merge 6cc7c4a). App Store remains live 1.9.6; no new 1.9.8 submission. Not a live release success. PR #9283 MERGED squash a642df1374 at 2026-11-06T08:44Z (https://github.com/Daisuke134/life-manager/pull/9283): due 0 at event start; WAKE_LEVELS T-10 firm / T-5 harsh / T-0 harsh; mocked fixtures 11/11 pass. No live production delivery, deployment, or customer outcome.",
        proof="https://github.com/Daisuke134/life-manager/pull/9282 + https://github.com/Daisuke134/life-manager/pull/9283",
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
        task="#9 separate the open /en PR from unpushed page claims",
        cadence="request-based",
        last_event_at="2026-11-06 08:26 PT",
        outcome="NOT DEPLOYED. The open change is life-manager PR 9287 head 6f86b325, /en source only, still OPEN. anicca-products branch cursor/seo-refresh-20261106-2882 is HTTP 404 and commit b2a35e78 is HTTP 422. Production HTTP 200 titles are unchanged. No five-page deployment.",
        proof="https://github.com/Daisuke134/life-manager/pull/9287",
        status="observed",
        source="GitHub PR 9287 file list plus production title curl",
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
        outcome="Relay reports only, not a direct verified publish. YouTube Shorts identity dialog was relayed and is not re-verified here.",
        proof="DAILY-LOG/2026-11-06.md Muse (via relay) rows",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "X Operator": dict(
        task="@diceai0 original / reply / native repost",
        cadence="unknown (schedule ≠ proof of continuous posting)",
        last_event_at="2026-11-06 20:17 JST",
        outcome="Prior result 17:07 JST: https://x.com/diceai0/status/2118594520891732052 80imp/2like/1reply; replies 8imp and 5imp. Latest browser proxy HTTP 403 at 2026-11-06 20:17 JST, publication 0, so posting is currently blocked after those results. X Operator remains its own actor, not 参謀.",
        proof="DAILY-LOG/2026-11-06.md X Operator 17:07 JST",
        status="observed",
        source="DAILY-LOG/2026-11-06.md",
    ),
    "参謀": dict(
        task="Coordination / verification only — COMPANY_TODO + /open owner facts",
        cadence="two weekday TODO syncs; LINE watch every 4h (label only, no content); revenue paid-receipts daily",
        last_event_at="2026-11-06 08:26 PT",
        outcome="49 routines remain enabled (finished one-off tax/refund excluded). Schedule does not prove success. Historical failures still stand: revenue receipts FAILURE 2026-11-05 14:40 PT, and the 2026-11-06 00:00 PT wake/schedule call failed. One existing routine was rewritten as x-money-tactics-scout, not a 51st: daily around 07:30 PT, only new public posts from @ErnestoSOFTWARE and @maubaron, one mobile-growth candidate with its exact source or silence. As of 2026-11-06 08:22 PT the connected @selawmqt connector created private list Mobile Growth Watch id 2118740781213053290; both members returned is_member true. This PR did not call X. The list and schedule are not revenue and not measured savings. Latest supported shared-plan reading remains 57.5% at 08:16 PT.",
        proof="COMPANY_TODO.md runtime + #1/#25/#27/#30 (public)",
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
        loop="49 periodic routines, including rewritten x-money-tactics-scout",
        schedule="49 enabled; scout daily around 07:30 PT",
        state="enabled",
        proof_of_run=False,
        note="Schedule does not prove success. Historical failures still stand. Not a 51st routine. Not revenue or measured savings.",
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


ENABLED_ROUTINE_COUNT = 49
STALE_PAUSE_OVERWRITE = (
    "other listed 参謀 routines paused",
    "other 参謀 routines paused",
    "all daily routines are stopped",
    "Naive Grok routine PAUSED",
)


def validate_public_team(data: dict) -> None:
    fail = []
    blob = json.dumps(data, ensure_ascii=False)
    for phrase in STALE_PAUSE_OVERWRITE:
        if phrase in blob:
            fail.append(f"stale paused fact would overwrite {ENABLED_ROUTINE_COUNT} enabled: {phrase}")
    sanbo = next((r for r in data.get("current_status") or [] if r.get("agent") == "参謀"), None)
    if not sanbo or f"{ENABLED_ROUTINE_COUNT} routines remain enabled" not in str(sanbo.get("outcome") or ""):
        fail.append(f"facts fallback missing canonical {ENABLED_ROUTINE_COUNT} enabled setting")
    for loop in data.get("loops") or []:
        if loop.get("owner") == "参謀" and loop.get("state") == "paused":
            fail.append("stale paused loop would overwrite the 49 enabled setting")
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
    path = os.path.join(outdir, "team")
    os.makedirs(path, exist_ok=True)
    dest = os.path.join(path, "team.json")
    if os.path.exists(dest):
        with open(dest, encoding="utf-8") as handle:
            existing = json.loads(handle.read())
        owners = existing.get("owners")
        if isinstance(owners, list) and owners and isinstance(owners[0], dict) and "owner" in owners[0]:
            names = [row.get("owner") for row in owners]
            if names.count("X Operator") != 1 or names.count("Reason Dots") != 1:
                raise SystemExit("owners board lost X Operator or Reason Dots; refusing to rewrite")
            if len(owners) != 16 or len(existing.get("loops") or []) != 92:
                raise SystemExit("owners board is not the live 16-owner/92-loop snapshot; refusing to rewrite")
            # Name-keyed board. Do not replace it with the 15-row current_status projection.
            return existing
    data = build_team_facts(now)
    with open(dest, "w", encoding="utf-8") as f:
        # Compact JSON keeps the public PR under the line budget; UI parses either form.
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    return data


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    d = write_team_json(out)
    if "current_status" in d:
        print(f"team facts built {d['built_at']}: {len(d['current_status'])} agents")
    else:
        print(f"preserved owners board owners={len(d.get('owners') or [])} loops={len(d.get('loops') or [])}")
