#!/bin/bash
# Re-arm only Hermes tasks whose own terminal event says disk preflight blocked.
# This is a scheduler recovery edge, not a delivery executor.
set -u
export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin

HERMES_BIN="${HERMES_BIN:-$(command -v hermes 2>/dev/null || true)}"
BOARD="${DISK_RECOVERY_BOARD:-gig-revenue}"
LEDGER="${DISK_RECOVERY_LEDGER:-$HOME/.openclaw/state/disk-recovery-redispatch.jsonl}"
REASON_PREFIX="${DISK_RECOVERY_REASON_PREFIX:-Disk preflight blocked:}"

mkdir -p "$(dirname "$LEDGER")" 2>/dev/null || exit 0
if [ -z "$HERMES_BIN" ] || [ ! -x "$HERMES_BIN" ]; then
  exit 0
fi

list_json=$("$HERMES_BIN" kanban --board "$BOARD" list --archived --json 2>/dev/null) || exit 0
task_ids=$(printf '%s' "$list_json" | python3 -c '
import json, sys
try:
    payload = json.load(sys.stdin)
except (json.JSONDecodeError, OSError):
    raise SystemExit(0)
rows = payload if isinstance(payload, list) else payload.get("tasks", payload.get("items", []))
for row in rows:
    if isinstance(row, dict) and row.get("status") == "blocked" and row.get("id"):
        print(row["id"])
')

unblocked=()
for task_id in $task_ids; do
  case "$task_id" in
    t_[A-Za-z0-9_-]*) ;;
    *) continue ;;
  esac
  task_json=$("$HERMES_BIN" kanban --board "$BOARD" show "$task_id" --json 2>/dev/null) || continue
  matches=$(printf '%s' "$task_json" | REASON_PREFIX="$REASON_PREFIX" python3 -c '
import json, os, sys
try:
    payload = json.load(sys.stdin)
except (json.JSONDecodeError, OSError):
    raise SystemExit(1)
task = payload.get("task", {})
if task.get("status") != "blocked":
    raise SystemExit(1)
events = payload.get("events", [])
for event in reversed(events):
    if event.get("kind") != "blocked":
        continue
    event_payload = event.get("payload") or {}
    reason = event_payload.get("reason")
    if isinstance(reason, str) and reason.startswith(os.environ["REASON_PREFIX"]):
        raise SystemExit(0)
    break
raise SystemExit(1)
') || continue
  [ "$matches" = "" ] || continue
  if "$HERMES_BIN" kanban --board "$BOARD" unblock "$task_id" \
      --reason "disk-pressure-recovered" >/dev/null 2>&1; then
    unblocked+=("$task_id")
  fi
done

if [ "${#unblocked[@]}" -gt 0 ]; then
  # The Hermes dispatcher owns worker creation and the paid effect fence.
  "$HERMES_BIN" kanban --board "$BOARD" dispatch --json >/dev/null 2>&1 || true
fi

unblocked_ids="${unblocked[*]-}"
python3 - "$LEDGER" "$BOARD" "$unblocked_ids" <<'PY'
import json
import sys
import time
from pathlib import Path

ledger = Path(sys.argv[1])
board = sys.argv[2]
unblocked = [item for item in sys.argv[3].split() if item]
record = {
    "ts": int(time.time()),
    "board": board,
    "unblocked": unblocked,
    "dispatch_requested": bool(unblocked),
}
try:
    with ledger.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, separators=(",", ":")) + "\n")
except OSError:
    pass
PY
exit 0
