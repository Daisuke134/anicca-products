#!/bin/zsh
set -euo pipefail

REQUEST="$1"
source "${0:A:h}/runtime-paths.sh"

URL=$("$JOB_SEARCH_JQ" -er '.official_url' "$REQUEST")
RESUME=$("$JOB_SEARCH_JQ" -er '.resume_path' "$REQUEST")
ANSWERS=$("$JOB_SEARCH_JQ" -er '.answers_path' "$REQUEST")
APPLICATION_ID=$("$JOB_SEARCH_JQ" -er '.application_id' "$REQUEST")
BUCKET=$("$JOB_SEARCH_JQ" -er '.portfolio_bucket' "$REQUEST")
ENDPOINT=$("$JOB_SEARCH_JQ" -er '.endpoint' "$JOB_SEARCH_BROWSER_OWNER_EVIDENCE")
OVERFLOW=$("$JOB_SEARCH_JQ" -r '.user_authorized_overflow // false' "$REQUEST")
OVERFLOW_REASON=$("$JOB_SEARCH_JQ" -r '.overflow_reason // empty' "$REQUEST")
EVIDENCE="$JOB_SEARCH_EVIDENCE_DIR"

"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply fill \
  --endpoint "$ENDPOINT" --url "$URL" --answers "$ANSWERS" \
  --resume "$RESUME" --profile "$JOB_SEARCH_PROFILE" \
  --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" >"$EVIDENCE/ashby-fill-transaction.log"
"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply verify \
  --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" --profile "$JOB_SEARCH_PROFILE" \
  >"$EVIDENCE/ashby-fill-verification.json"
"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply claim \
  --fill-result "$JOB_SEARCH_ASHBY_APPLY_RESULT" \
  --owner-receipt "$JOB_SEARCH_BROWSER_OWNER_EVIDENCE" --resume "$RESUME" \
  --snapshot-output "$EVIDENCE/ats-snapshot.json" \
  --answers-output "$EVIDENCE/submission-answers.json" \
  --output "$EVIDENCE/fill-receipt.json" >"$EVIDENCE/ashby-claim-transaction.log"

PREPARE=("$JOB_SEARCH_PYTHON" -m job_search_loop.submission_prepare
  --ledger "$JOB_SEARCH_STATE_ROOT/ledger.sqlite3"
  --application-id "$APPLICATION_ID" --japan-day "$(TZ=Asia/Tokyo date +%F)"
  --portfolio-bucket "$BUCKET" --resume "$RESUME"
  --snapshot "$EVIDENCE/ats-snapshot.json"
  --fill-receipt "$EVIDENCE/fill-receipt.json"
  --answers "$EVIDENCE/submission-answers.json"
  --output "$EVIDENCE/submission-prepare.json")
if [[ "$OVERFLOW" == "true" ]]; then
  [[ -n "$OVERFLOW_REASON" ]]
  PREPARE+=(--user-authorized-overflow --overflow-reason "$OVERFLOW_REASON")
fi
"${PREPARE[@]}" >"$EVIDENCE/submission-prepare-transaction.log"

INTENT=$("$JOB_SEARCH_JQ" -er '.intent_id' "$EVIDENCE/submission-prepare.json")
FENCE=$("$JOB_SEARCH_JQ" -er '.fence' "$EVIDENCE/submission-prepare.json")
"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply apply \
  --endpoint "$ENDPOINT" --url "$URL" --answers "$ANSWERS" \
  --resume "$RESUME" --profile "$JOB_SEARCH_PROFILE" \
  --ledger "$JOB_SEARCH_STATE_ROOT/ledger.sqlite3" \
  --intent-id "$INTENT" --fence "$FENCE" \
  --output "$EVIDENCE/ashby-submit-result.json" >"$EVIDENCE/ashby-submit-transaction.log"

"$JOB_SEARCH_JQ" '{status, submit_observation}' "$EVIDENCE/ashby-submit-result.json"
