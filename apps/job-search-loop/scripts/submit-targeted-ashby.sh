#!/bin/zsh
set -euo pipefail

REQUEST="$1"
source "${0:A:h}/runtime-paths.sh"

URL=$("$JOB_SEARCH_JQ" -er '.official_url' "$REQUEST")
RESUME=$("$JOB_SEARCH_JQ" -er '.resume_path' "$REQUEST")
ANSWERS=$("$JOB_SEARCH_JQ" -r '.answers_path // empty' "$REQUEST")
APPLICATION_ID=$("$JOB_SEARCH_JQ" -r '.application_id // empty' "$REQUEST")
COMPANY=$("$JOB_SEARCH_JQ" -r '.company // empty' "$REQUEST")
TITLE=$("$JOB_SEARCH_JQ" -r '.title // empty' "$REQUEST")
BUCKET=$("$JOB_SEARCH_JQ" -er '.portfolio_bucket' "$REQUEST")
ENDPOINT=$("$JOB_SEARCH_JQ" -er '.endpoint' "$JOB_SEARCH_BROWSER_OWNER_EVIDENCE")
OVERFLOW=$("$JOB_SEARCH_JQ" -r '.user_authorized_overflow // false' "$REQUEST")
OVERFLOW_REASON=$("$JOB_SEARCH_JQ" -r '.overflow_reason // empty' "$REQUEST")
EVIDENCE="$JOB_SEARCH_EVIDENCE_DIR"
REUSE_ARGS=()

if [[ -z "$ANSWERS" ]]; then
  ANSWERS="$EVIDENCE/ashby-answers.json"
  set +e
  "$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply prepare \
    --endpoint "$ENDPOINT" --url "$URL" --resume "$RESUME" \
    --profile "$JOB_SEARCH_PROFILE" --answers-output "$ANSWERS" \
    --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" \
    >"$EVIDENCE/ashby-fill-transaction.log"
  FILL_RC=$?
  set -e
else
  set +e
  "$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply fill \
    --endpoint "$ENDPOINT" --url "$URL" --answers "$ANSWERS" \
    --resume "$RESUME" --profile "$JOB_SEARCH_PROFILE" \
    --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" \
    >"$EVIDENCE/ashby-fill-transaction.log"
  FILL_RC=$?
  set -e
fi
if [[ -f "$JOB_SEARCH_ASHBY_APPLY_RESULT" ]] \
  && [[ "$("$JOB_SEARCH_JQ" -r '.status // empty' "$JOB_SEARCH_ASHBY_APPLY_RESULT")" != "ready" ]]; then
  FILL_RC=2
fi
if [[ "$FILL_RC" -ne 0 ]]; then
  [[ -f "$ANSWERS" ]]
  "$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_browser_repair \
    --url "$URL" --answers "$ANSWERS" --resume "$RESUME" \
    --output "$EVIDENCE/browser-harness-repair.json" \
    >"$EVIDENCE/browser-harness-repair.log"
  "$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply fill \
    --endpoint "$ENDPOINT" --url "$URL" --answers "$ANSWERS" \
    --resume "$RESUME" --profile "$JOB_SEARCH_PROFILE" \
    --reuse-existing-page --keep-page \
    --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" \
    >"$EVIDENCE/ashby-fill-repaired-transaction.log"
  REUSE_ARGS=(--reuse-existing-page)
fi
"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply verify \
  --output "$JOB_SEARCH_ASHBY_APPLY_RESULT" --profile "$JOB_SEARCH_PROFILE" \
  >"$EVIDENCE/ashby-fill-verification.json"
INTENT=$("$JOB_SEARCH_JQ" -r '.intent_id // empty' "$REQUEST")
FENCE=$("$JOB_SEARCH_JQ" -r '.fence // empty' "$REQUEST")
if [[ -z "$INTENT" || -z "$FENCE" ]]; then
  "$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply claim \
    --fill-result "$JOB_SEARCH_ASHBY_APPLY_RESULT" \
    --owner-receipt "$JOB_SEARCH_BROWSER_OWNER_EVIDENCE" --resume "$RESUME" \
    --snapshot-output "$EVIDENCE/ats-snapshot.json" \
    --answers-output "$EVIDENCE/submission-answers.json" \
    --output "$EVIDENCE/fill-receipt.json" >"$EVIDENCE/ashby-claim-transaction.log"

  PREPARE=("$JOB_SEARCH_PYTHON" -m job_search_loop.submission_prepare
    --ledger "$JOB_SEARCH_STATE_ROOT/ledger.sqlite3"
    --japan-day "$(TZ=Asia/Tokyo date +%F)" --portfolio-bucket "$BUCKET"
    --resume "$RESUME"
    --snapshot "$EVIDENCE/ats-snapshot.json"
    --fill-receipt "$EVIDENCE/fill-receipt.json"
    --answers "$EVIDENCE/submission-answers.json"
    --output "$EVIDENCE/submission-prepare.json")
  if [[ -n "$APPLICATION_ID" ]]; then
    PREPARE+=(--application-id "$APPLICATION_ID")
  else
    [[ -n "$COMPANY" && -n "$TITLE" ]]
    PREPARE+=(--company "$COMPANY" --title "$TITLE" --official-url "$URL")
  fi
  if [[ "$OVERFLOW" == "true" ]]; then
    [[ -n "$OVERFLOW_REASON" ]]
    PREPARE+=(--user-authorized-overflow --overflow-reason "$OVERFLOW_REASON")
  fi
  "${PREPARE[@]}" >"$EVIDENCE/submission-prepare-transaction.log"
  INTENT=$("$JOB_SEARCH_JQ" -er '.intent_id' "$EVIDENCE/submission-prepare.json")
  FENCE=$("$JOB_SEARCH_JQ" -er '.fence' "$EVIDENCE/submission-prepare.json")
fi
"$JOB_SEARCH_PYTHON" -m job_search_loop.ashby_apply apply \
  --endpoint "$ENDPOINT" --url "$URL" --answers "$ANSWERS" \
  --resume "$RESUME" --profile "$JOB_SEARCH_PROFILE" \
  --ledger "$JOB_SEARCH_STATE_ROOT/ledger.sqlite3" \
  --intent-id "$INTENT" --fence "$FENCE" \
  "${REUSE_ARGS[@]}" \
  --output "$EVIDENCE/ashby-submit-result.json" >"$EVIDENCE/ashby-submit-transaction.log"

"$JOB_SEARCH_JQ" '{status, submit_observation}' "$EVIDENCE/ashby-submit-result.json"
