#!/bin/zsh
set -euo pipefail

APP_ROOT="/Users/anicca/anicca-job-search-loop/apps/job-search-loop"
STATE_ROOT="/Users/anicca/.local/state/anicca/job-search"
RUNNER="/Users/anicca/profitable-claude/skills/agent-runner/agent_runner.py"
RUN_ID="inbox-$(date +%Y%m%d-%H%M%S)"
EVIDENCE="$STATE_ROOT/evidence/$RUN_ID"

mkdir -p "$EVIDENCE" "$STATE_ROOT/logs"
chmod 700 "$STATE_ROOT" "$STATE_ROOT/evidence" "$EVIDENCE" "$STATE_ROOT/logs"
export PYTHONPATH="$APP_ROOT"
export ANICCA_BUDGET_REQUIRED=1
export ANICCA_BUDGET_SCOPE_ID="job-search-inbox"
export ANICCA_PASS_TOKEN_BUDGET=65536
export ANICCA_LOOP_DAILY_TOKEN_BUDGET=131072
export ANICCA_BUDGET_DAILY_SCOPE="job-search-inbox"
export ANICCA_BUDGET_DAY_TZ="Asia/Tokyo"
exec /opt/homebrew/bin/python3 "$RUNNER" \
  --task-class repeatable-agent \
  --prompt-file "$APP_ROOT/prompts/inbox-pass.md" \
  --schema "$APP_ROOT/schemas/inbox-pass-result.v1.schema.json" \
  --evidence-dir "$EVIDENCE" \
  --task-label job-search-inbox \
  --loop job-search \
  --workdir /Users/anicca/anicca-job-search-loop
