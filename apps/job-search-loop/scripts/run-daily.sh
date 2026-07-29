#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
STATE_ROOT="/Users/anicca/.local/state/anicca/job-search"
RUNNER="/Users/anicca/profitable-claude/skills/agent-runner/agent_runner.py"
RUN_ID="daily-$(date +%Y%m%d-%H%M%S)"
EVIDENCE="$STATE_ROOT/evidence/$RUN_ID"
TELEGRAM_OUTBOX="$STATE_ROOT/telegram-outbox.sqlite3"
TELEGRAM_MEDIA="/Users/anicca/.openclaw/media/job-search-outbound"

mkdir -p "$EVIDENCE" "$STATE_ROOT/logs"
chmod 700 "$STATE_ROOT" "$STATE_ROOT/evidence" "$EVIDENCE" "$STATE_ROOT/logs"
export PYTHONPATH="$APP_ROOT"
/opt/homebrew/bin/python3 -m job_search_loop.application_reporting deliver \
  --ledger "$STATE_ROOT/ledger.sqlite3" \
  --outbox "$TELEGRAM_OUTBOX" \
  --media-root "$TELEGRAM_MEDIA" \
  --output "$EVIDENCE/resume-deliver-before.json"
JAPAN_DAY=$(TZ=Asia/Tokyo /bin/date +%F)
SLOT_COUNT=$(/opt/homebrew/bin/python3 - "$STATE_ROOT/ledger.sqlite3" "$JAPAN_DAY" <<'PY'
import sys
from pathlib import Path

from job_search_loop.ledger import Ledger

ledger = Ledger(Path(sys.argv[1]))
try:
    print(ledger.daily_slot_count(sys.argv[2]))
finally:
    ledger.close()
PY
)
if [[ "$SLOT_COUNT" -ge "2" ]]; then
  /usr/bin/jq -n \
    --arg status "daily_quota_reached" \
    --arg japan_day "$JAPAN_DAY" \
    --argjson slot_count "$SLOT_COUNT" \
    '{status:$status,japan_day:$japan_day,slot_count:$slot_count}' \
    >"$EVIDENCE/summary.json"
  chmod 600 "$EVIDENCE/summary.json"
  exit 0
fi
export ANICCA_BUDGET_REQUIRED=1
export ANICCA_BUDGET_SCOPE_ID="job-search-daily:$RUN_ID"
export ANICCA_PASS_TOKEN_BUDGET=49152
export ANICCA_LOOP_DAILY_TOKEN_BUDGET=98304
export ANICCA_BUDGET_DAILY_SCOPE="job-search-daily"
export ANICCA_BUDGET_DAY_TZ="Asia/Tokyo"
/opt/homebrew/bin/python3 "$RUNNER" \
  --task-class browser-lane-agent \
  --prompt-file "$APP_ROOT/prompts/daily-pass.md" \
  --schema "$APP_ROOT/schemas/pass-result.v1.schema.json" \
  --evidence-dir "$EVIDENCE" \
  --task-label job-search-daily \
  --loop job-search \
  --workdir /Users/anicca/anicca-job-search-loop
/opt/homebrew/bin/python3 -m job_search_loop.application_reporting deliver \
  --ledger "$STATE_ROOT/ledger.sqlite3" \
  --outbox "$TELEGRAM_OUTBOX" \
  --media-root "$TELEGRAM_MEDIA" \
  --output "$EVIDENCE/resume-deliver-after.json"
