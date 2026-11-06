#!/usr/bin/env python3
"""Build public /open/team owners snapshot.

Cadence is schedule-only. current_task stays unknown unless a fresh
observation exists (this builder never invents current execution from
BOARD/DAILY-LOG history). DAILY-LOG/BOARD lines become latest_outcome
facts with freshness only.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

JST = timezone(timedelta(hours=9))

# Known Grok Bot roster from TEAM.md (Manager room is a room, not an owner).
GROK_BOTS = [
    {"owner": "参謀", "role": "優先順位・割り振り・成田さんの窓口", "cadence": "朝会 09:00／X 投稿枠／Content+SEO／受託検証／revenue／CEO／team board（詳細は LOOPS.md）", "kind": "grok_bot"},
    {"owner": "Anicca Marketer", "role": "Anicca iOS の配信と数値", "cadence": "growth 02:00・14:00 JST／JP 固定枠 7:00–23:00（LOOPS #39/#39b）", "kind": "grok_bot"},
    {"owner": "Fucker", "role": "Capafy・PromptBase 販売", "cadence": "revenue 2時間ごと :35／10:00 daily revenue／10:55 Honne/PDF（LOOPS #40）", "kind": "grok_bot"},
    {"owner": "dr eggbot", "role": "Grok Bot の設計・作成（入札ループは paused、受信確認）", "cadence": "upwork-skima 3h／inbox-sweep 2h／gig-audit（LOOPS #41/#42b）", "kind": "grok_bot"},
    {"owner": "Forensic Writing", "role": "X バイラルフック分析（下書きのみ）", "cadence": "HOOKS 06:08／フォロワー 21:00／分析 3h :45（LOOPS #43/#57）", "kind": "grok_bot"},
    {"owner": "Muse Relay", "role": "Muse のリール勝ちを X/note/TikTok に書き直す", "cadence": "00・04・08・12・16・20時（LOOPS #44）", "kind": "grok_bot"},
    {"owner": "Muse（中継 bot）", "role": "部屋の発言を本物の Muse へ中継（stand-in；直作業は Muse VM）", "cadence": "依頼ベース（stand-in contact）", "kind": "legacy_standin"},
    {"owner": "Codex（中継 bot）", "role": "部屋の発言を Mac mini Codex へ中継（stand-in；直作業は Codex CLI）", "cadence": "依頼ベース（stand-in contact）", "kind": "legacy_standin"},
    {"owner": "Dots（中継 bot）", "role": "部屋の発言を本物の Dots へ中継（stand-in；直作業は Reason Dots）", "cadence": "依頼ベース（stand-in contact）", "kind": "legacy_standin"},
    {"owner": "Pause", "role": "unknown（本人が記入）", "cadence": "unknown", "kind": "grok_bot"},
    {"owner": "Applications", "role": "求人応募（超知能・行動シミュレーション企業だけ）", "cadence": "依頼ベース", "kind": "grok_bot"},
    {"owner": "Reporter", "role": "アカウント数値・財務レポート", "cadence": "依頼ベース", "kind": "grok_bot"},
    {"owner": "X Operator", "role": "X @diceai0・@selawmqt の唯一の投稿者", "cadence": "X 投稿枠（参謀配下）", "kind": "grok_bot"},
]

# Real external/machine contacts — never invent a current task.
LEGACY_CONTACTS = [
    {"owner": "Codex CLI (Mac mini)", "role": "実装・リリース・GitHub・プロダクト/ペイウォール", "cadence": "依頼ベース／09:00 research（WHO-DOES-WHAT / TEAM.md）", "kind": "legacy_contact"},
    {"owner": "Muse VM", "role": "リール企画・制作、IG 投稿、monk TikTok/note", "cadence": "毎日 :22 帯／3h・1h・6h・30分・15分ループ（LOOPS #45）", "kind": "legacy_contact"},
    {"owner": "Reason Dots", "role": "お金・Moneytree・支出上限・アプリ数値", "cadence": "毎時:10 Ops chaser・20:00 money check（WHO-DOES-WHAT；未検証表記あり）", "kind": "legacy_contact"},
]

ALIASES = {
    "参謀": [r"参謀", r"Grok Bot 参謀"],
    "Anicca Marketer": [r"Anicca Marketer"],
    "Fucker": [r"Fucker"],
    "dr eggbot": [r"dr eggbot", r"dr-eggbot"],
    "Forensic Writing": [r"Forensic Writing", r"Forensic"],
    "Muse Relay": [r"Muse Relay"],
    "Muse（中継 bot）": [],  # do not scrape stand-in activity from Muse VM lines
    "Codex（中継 bot）": [],
    "Dots（中継 bot）": [],
    "Pause": [r"\bPause\b"],
    "Applications": [r"\bApplications\b"],
    "Reporter": [r"\bReporter\b"],
    "X Operator": [r"X Operator"],
    "Codex CLI (Mac mini)": [],  # unknown unless clearly labeled; avoid inventing from board
    "Muse VM": [r"Muse \(via relay\)", r"Muse（本物）", r"^Muse \|", r"｜Muse｜"],
    "Reason Dots": [r"\bDots\b", r"dots-one"],
}


def clean(s: str, n: int = 160) -> str:
    s = re.sub(r"[\w.+-]+@[\w-]+\.[\w.]+", "[email]", str(s))
    s = re.sub(r"(sk|rk|pk)_(live|test)_\w+|\b[0-9a-f]{32,}\b", "[redacted]", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n]


def parse_stamp(line: str, default_day: str) -> datetime | None:
    # 2026-11-06 14:10 JST｜...
    m = re.search(r"(20\d{2}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})(?::\d{2})?\s*(JST|PT)?", line)
    if m:
        day, hm, zone = m.group(1), m.group(2), m.group(3) or "JST"
        dt = datetime.strptime(f"{day} {hm}", "%Y-%m-%d %H:%M")
        if zone == "PT":
            # America/Los_Angeles ≈ UTC-8 in early Nov 2026 (PST)
            return dt.replace(tzinfo=timezone(timedelta(hours=-8))).astimezone(JST)
        return dt.replace(tzinfo=JST)
    # 15:54 JST｜... on a dated file
    m = re.search(r"^[\-\s]*(\d{1,2}:\d{2})\s*JST", line)
    if m and default_day:
        dt = datetime.strptime(f"{default_day} {m.group(1)}", "%Y-%m-%d %H:%M").replace(tzinfo=JST)
        return dt
    return None


def freshness(now: datetime, when: datetime | None) -> str:
    if when is None:
        return "unknown"
    delta = now - when
    if delta.total_seconds() < 0:
        delta = -delta
        ago = False
    else:
        ago = True
    secs = int(delta.total_seconds())
    if secs < 60:
        label = f"{secs}s"
    elif secs < 3600:
        label = f"{secs // 60}m"
    elif secs < 86400:
        label = f"{secs // 3600}h {(secs % 3600) // 60}m"
    else:
        label = f"{secs // 86400}d {(secs % 86400) // 3600}h"
    return f"{label} ago" if ago else f"in {label}"


def load_daily_lines(team_root: Path) -> list[tuple[str, str, datetime | None]]:
    out: list[tuple[str, str, datetime | None]] = []
    log_dir = team_root / "DAILY-LOG"
    if not log_dir.is_dir():
        return out
    files = sorted(log_dir.glob("20*.md"), reverse=True)[:3]
    for path in files:
        day = path.stem
        for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            stamp = parse_stamp(line, day)
            out.append((day, line, stamp))
    return out


def actor_of(line: str) -> str | None:
    """Return the reporting agent on a DAILY-LOG line, not a mentioned name."""
    s = line.lstrip("- ").strip()
    m = re.match(
        r"(?:20\d{2}-\d{2}-\d{2}\s+)?\d{1,2}:\d{2}(?::\d{2})?\s*(?:JST|PT)?\s*[|｜]\s*([^|｜]+)\s*[|｜]",
        s,
    )
    if m:
        return m.group(1).strip()
    m = re.match(
        r"(?:20\d{2}-\d{2}-\d{2}\s+)?\d{1,2}:\d{2}(?::\d{2})?\s*(?:JST|PT)?\s+([^|｜]+?)\s*[|｜]",
        s,
    )
    if m:
        return m.group(1).strip()
    return None


def match_owner(owner: str, line: str) -> bool:
    pats = ALIASES.get(owner, [re.escape(owner)])
    if not pats:
        return False
    actor = actor_of(line)
    if actor is None:
        return False
    for pat in pats:
        if re.search(pat, actor):
            return True
    return False


def latest_for(owner: str, lines: list[tuple[str, str, datetime | None]], now: datetime) -> dict:
    best = None
    for day, line, stamp in lines:
        if match_owner(owner, line):
            if best is None or (stamp and (best[2] is None or stamp > best[2])):
                best = (day, line, stamp)
            elif best is not None and stamp is None and best[2] is None:
                best = (day, line, stamp)
    if not best:
        return {
            "text": "unknown",
            "kind": "unknown",
            "observed_at": None,
            "freshness": "unknown",
            "source": None,
        }
    day, line, stamp = best
    observed = stamp.strftime("%Y-%m-%d %H:%M JST") if stamp else f"{day} (time unknown)"
    return {
        "text": clean(line, 180),
        "kind": "observed",
        "observed_at": observed,
        "freshness": freshness(now, stamp),
        "source": f"DAILY-LOG/{day}.md",
    }


def build_owners(team_root: Path, now: datetime) -> list[dict]:
    lines = load_daily_lines(team_root)
    owners = []
    for row in GROK_BOTS + LEGACY_CONTACTS:
        outcome = latest_for(row["owner"], lines, now)
        # Stand-ins and machine contacts: never invent current task.
        current = {"text": "unknown", "kind": "unknown"}
        owners.append({
            "owner": row["owner"],
            "kind": row["kind"],
            "task": {"text": row["role"], "kind": "assigned_lane"},
            "cadence": {"text": row["cadence"], "kind": "schedule"},
            "current_task": current,
            "latest_outcome": outcome,
        })
    return owners


def merge_public(existing: dict, owners: list[dict], built_at: str) -> dict:
    notes = [
        "Cadence is schedule only; it is not proof that the work ran.",
        "current_task is unknown unless a fresh live observation exists. BOARD and DAILY-LOG lines are latest_outcome facts with freshness — not claims of current execution.",
        "All known Grok bots are listed. Muse/Codex/Dots Grok profiles are legacy stand-in contacts (migration APPLIED). Real Codex CLI, Muse VM, and Reason Dots are separate rows with unknown current tasks.",
    ]
    out = dict(existing)
    out["built_at"] = built_at
    out["timezone"] = "Asia/Tokyo"
    out["owners"] = owners
    out["notes"] = notes
    # Keep loops/accounts/seo/right_now for unrelated surfaces; UI labels right_now as non-live.
    return out


def main() -> int:
    team_root = Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/team")
    out_json = Path(sys.argv[2] if len(sys.argv) > 2 else "apps/landing/public/open/team/team.json")
    now = datetime.now(JST)
    built_at = now.strftime("%Y-%m-%d %H:%M JST")
    existing = {}
    if out_json.exists():
        existing = json.loads(out_json.read_text(encoding="utf-8"))
    owners = build_owners(team_root, now)
    data = merge_public(existing, owners, built_at)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {out_json} owners={len(owners)} built_at={built_at}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
