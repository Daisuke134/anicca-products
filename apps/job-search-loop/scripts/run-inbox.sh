#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
STATE_ROOT="/Users/anicca/.local/state/anicca/job-search"
RUNNER="/Users/anicca/profitable-claude/skills/agent-runner/agent_runner.py"
RUN_ID="inbox-$(date +%Y%m%d-%H%M%S)"
EVIDENCE="$STATE_ROOT/evidence/$RUN_ID"
SEEN_STATE="$STATE_ROOT/inbox-seen.json"
CANDIDATES="$EVIDENCE/candidates.json"
PROMPT="$EVIDENCE/prompt.md"

mkdir -p "$EVIDENCE" "$STATE_ROOT/logs"
chmod 700 "$STATE_ROOT" "$STATE_ROOT/evidence" "$EVIDENCE" "$STATE_ROOT/logs"
set -a
source /Users/anicca/.openclaw/.env
set +a
export PYTHONPATH="$APP_ROOT"
/opt/homebrew/bin/python3 -m job_search_loop.inbox scan \
  --account keiodaisuke@gmail.com \
  --state "$SEEN_STATE" \
  --output "$CANDIDATES" \
  --prompt-base "$APP_ROOT/prompts/inbox-pass.md" \
  --prompt-output "$PROMPT" \
  --summary "$EVIDENCE/summary.json"
NEW_COUNT=$(/usr/bin/jq -r '.new_count' "$CANDIDATES")
if [[ "$NEW_COUNT" == "0" ]]; then
  exit 0
fi
export ANICCA_BUDGET_REQUIRED=1
export ANICCA_BUDGET_SCOPE_ID="job-search-inbox:$RUN_ID"
export ANICCA_PASS_TOKEN_BUDGET=65536
export ANICCA_LOOP_DAILY_TOKEN_BUDGET=1048576
export ANICCA_BUDGET_DAILY_SCOPE="job-search-inbox"
export ANICCA_BUDGET_DAY_TZ="Asia/Tokyo"
/opt/homebrew/bin/python3 "$RUNNER" \
  --task-class composition-agent \
  --prompt-file "$PROMPT" \
  --schema "$APP_ROOT/schemas/inbox-pass-result.v1.schema.json" \
  --evidence-dir "$EVIDENCE" \
  --task-label job-search-inbox \
  --loop job-search \
  --workdir /Users/anicca/anicca-job-search-loop
/opt/homebrew/bin/python3 -m job_search_loop.inbox mark \
  --state "$SEEN_STATE" \
  --input "$CANDIDATES"
