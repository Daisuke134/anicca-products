#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
STATE_ROOT="/Users/anicca/.local/state/anicca/job-search"
JOB_UID="$(id -u)"

for NAME in ai.anicca.job-search-daily ai.anicca.job-search-inbox; do
  plutil -lint "$APP_ROOT/launchd/$NAME.plist" >/dev/null
  plutil -lint "/Users/anicca/Library/LaunchAgents/$NAME.plist" >/dev/null
  STATUS=$(launchctl print "gui/$JOB_UID/$NAME" | awk '
    /^[[:space:]]*state =/ {state=$3}
    /^[[:space:]]*last exit code =/ {exit_code=$5}
    END {printf "state=%s last_exit=%s", state, exit_code}
  ')
  if [[ "$STATUS" != *"last_exit=0" ]]; then
    echo "$NAME unhealthy: $STATUS" >&2
    exit 1
  fi
  echo "$NAME $STATUS"
done

/opt/homebrew/bin/python3 - "$STATE_ROOT" <<'PY'
import json
import sqlite3
import stat
import sys
import time
from pathlib import Path

root = Path(sys.argv[1])
database = root / "ledger.sqlite3"
with sqlite3.connect(database) as connection:
    integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity != "ok":
        raise SystemExit(f"ledger integrity failed: {integrity}")
    counts = dict(
        connection.execute(
            "SELECT current_state, COUNT(*) FROM applications GROUP BY current_state"
        ).fetchall()
    )

private_paths = [
    root / "inbox-seen.json",
    Path("/Users/anicca/.config/anicca/job-search/profile.json"),
]
for path in private_paths:
    if not path.exists():
        raise SystemExit(f"private state missing: {path}")
    mode = stat.S_IMODE(path.stat().st_mode)
    if mode & 0o077:
        raise SystemExit(f"private state permissions too broad: {path} {mode:o}")

evidence_root = root / "evidence"
limits = {"daily-": 36 * 3600, "inbox-": 45 * 60}
freshness = {}
now = time.time()
for prefix, maximum_age in limits.items():
    candidates = [
        candidate
        for candidate in sorted(evidence_root.glob(f"{prefix}*"))
        if (candidate / "summary.json").is_file()
    ]
    if not candidates:
        raise SystemExit(f"missing completed evidence for {prefix}")
    summary = candidates[-1] / "summary.json"
    value = json.loads(summary.read_text(encoding="utf-8"))
    age = now - summary.stat().st_mtime
    if age > maximum_age:
        raise SystemExit(f"stale evidence for {prefix}: {int(age)}s")
    freshness[prefix.rstrip("-")] = {
        "age_seconds": int(age),
        "status": value.get("status"),
    }

print(json.dumps({
    "ledger_integrity": integrity,
    "application_counts": counts,
    "freshness": freshness,
}, ensure_ascii=False, sort_keys=True))
PY
