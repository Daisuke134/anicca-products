# Spec Review Verdict — portfolio-self-improve-loop, iteration 1

**Overall: FAIL** (spec_fidelity: FAIL, verification_readiness: FAIL)

## spec_fidelity — FAIL

- **FIND-001 (critical)**: REQ-006 says the INNER action is selected by "the OUTER step (see REQ-007)",
  but REQ-007 requires an INNER trace to already exist before it can run. Cross-referencing the parent
  design doc shows OUTER is defined purely as grading of PAST traces (daily `claude -p` job over
  accumulated history), never as an action-selection mechanism — that job belongs to the design's
  separate step `[2] SCORE+PICK`, which behavioral-spec.md never turns into its own requirement. For the
  first cycle in scope, nothing in the spec says who picks the action.
- **FIND-003 (high)**: REQ-005(b)'s second product is left entirely unnamed ("selected during
  implementation... not invented") with no selection criteria — a real gap, not an acceptable
  implementation-time detail, per this project's own no-optional/no-TBD spec discipline.
- **FIND-004 (medium)**: REQ-005(a) hardcodes RevenueCat project id `projbb7b9d1b` in spec prose with no
  verification of the id itself, deviating from the existing repo pattern
  (`scripts/daily-metrics/revenuecat_client.py:29-32`) of resolving the project id dynamically via API.
- **FIND-005 (medium)**: The parent design's Rule 7 regression/revert safety guardrail is silently
  dropped from behavioral-spec.md with no "out of scope" acknowledgment, unlike every other narrowed
  item, which IS explicitly called out.

## verification_readiness — FAIL

- **FIND-002 (critical)**: verification-architecture.md's own "Required proof obligations for THIS pass"
  section marks PROP-006 through PROP-009 — i.e. the entire INNER apply, OUTER grade, NO-OP validity, and
  adversary/E2E gate — as required "only if time... rolls into next task". This directly contradicts
  behavioral-spec.md's own scope statement ("run exactly ONE real INNER... -> OUTER... cycle end to
  end") and the SHALL language in REQ-006/007/008/009. This is a scope-dodge baked into the verification
  contract: the pass could be declared spec-fidelity-complete having proven only instrumentation, never
  the cycle the spec exists to deliver.
- **FIND-007 (high)**: PROP-006's verification method ("curl the live deployed URL") hardwires one
  example instance of REQ-006's generically-worded action; if the selected action isn't a deployed-URL
  content change, the proof obligation has no applicable method.
- **FIND-006 (medium)**: PROP-001 only exercises REQ-001's auth-failure fail-closed path; the other two
  named failure modes (network error, non-2xx response) have no specified verification method.

## Positive evidence reviewed (not a summary judgment, just what was checked)
- REQ-001's fail-closed claim IS testable without a second real API key (deliberately invalid credential
  against the real endpoint suffices) — PROP-001 correctly uses this approach for the auth-failure case.
- The purity boundary map (pull scripts = impure I/O, products.json = pure config, OUTER
  judgment = impure/non-deterministic-by-design) correctly follows the project's
  agent-does-judgment/tool-does-fetch principle and does not misclassify any layer.
- Verification tier definitions (0 static / 1 live-read / 2 side-effect / 3 adversary+E2E) are distinct
  and non-overlapping as written.
