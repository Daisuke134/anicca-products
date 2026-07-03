# Spec Review Verdict — portfolio-self-improve-loop, iteration 2

**Overall: FAIL** (spec_fidelity: FAIL, verification_readiness: FAIL)

## Prior-findings status (verified against CURRENT spec text, not the commit message)

| ID | Status | Evidence |
|---|---|---|
| FIND-001 (circular REQ-006/007) | **fixed** | REQ-006 explicitly states it "and REQ-007 (INNER apply) are sequential, not circular: SCORE+PICK reads only the instrumentation file (REQ-002's real numbers), never a prior INNER trace" (behavioral-spec.md:65-66). |
| FIND-002 (scope-dodge PROP-006-009) | **partial** | Time-based dodge removed, but the replacement conditional in verification-architecture.md:41-49 bundles PROP-010 into the same "if REQ-007's INNER action is safely actionable" gate as PROP-007/008/011 — backwards, since PROP-010 verifies the NO-OP branch that applies precisely when NOT safely actionable. See new finding below. |
| FIND-003 (unnamed 2nd product) | **fixed** | REQ-005(b) now names `lm-stripe-5usd` / `NEXT_PUBLIC_STRIPE_LINK_5` with explicit selection criteria; confirmed the env var name is real (referenced in `docs/superpowers/specs/anicca/patches/P-install-me-flow.patch.md`), not fabricated. |
| FIND-004 (hardcoded project id) | **fixed** | REQ-005(a) now requires dynamic `GET /v2/projects` resolution. Verified the cited code (`scripts/daily-metrics/revenuecat_client.py:29-32`) actually does `client.get(f"{RC_BASE_URL}/projects", ...)` then `resp.json()["items"][0]["id"]` — citation is accurate, not hallucinated. |
| FIND-005 (dropped regression guard) | **fixed** | REQ-009 restored verbatim with explicit "deferred to second cycle" note; PROP-009 documents it at Tier 0. |
| FIND-006 (narrow PROP-001) | **partial** | PROP-001 broadened from "auth-failure only" to "auth failure (temp-invalid key) OR network-error simulation (unreachable host)" — but REQ-001 names a THIRD failure mode ("non-2xx response") that is still never exercised, and even the two modes PROP-001 does name are joined by OR, not AND. |
| FIND-007 (hardwired PROP-006 curl) | **fixed** | The equivalent obligation (now PROP-007, mapped correctly to REQ-007 after renumbering) requires "a method appropriate to the ACTUAL action taken" — curl is now only the illustrative example for a deployed-content-change action, with a config/data-read alternative named for other action types. |

## NEW issues found in this revision (fresh pass, not among the 7 prior findings)

### spec_fidelity — FAIL

1. **[critical] Dangling REQ cross-reference surviving renumbering.** `behavioral-spec.md:52` (inside REQ-005(b)'s NOTE) reads: "...REQ-006/007's grading step SHALL NOT treat a Radar-blocked (`outcome.type=blocked`) charge as a genuine funnel/UX bottleneck signal...". Under the CURRENT numbering, REQ-006 = SCORE+PICK (selection) and REQ-007 = INNER apply (side effect) — **neither is a "grading step."** Grading is now REQ-008 ("read the trace + the real before/after-window instrumentation delta... synthesize... lessons"). Cross-checking iteration-1's verdict confirms the OLD numbering had REQ-006=INNER and REQ-007=OUTER/grading — this phrase was never updated when the spec was renumbered to insert the new REQ-006 (SCORE+PICK). The load-bearing rule (don't treat Radar-blocked charges as real signal) is now unattached to any requirement that actually performs grading/interpretation.

2. **[high] REQ-006/007/010 candidate-selection model is underspecified.** REQ-006 mandates SCORE+PICK "SHALL select exactly one product × one candidate action" with no provision for a ranked/alternate list or a "nothing to select" outcome. But REQ-007 requires falling through "to the next candidate action that IS safely actionable" when the top pick is out-of-scope, and REQ-010 assumes a "no non-noise leading-indicator signal exists" outcome can occur directly after SCORE+PICK, bypassing REQ-007 entirely. Neither REQ-006 nor any other requirement specifies the mechanism that produces REQ-007's "next candidate" or recognizes REQ-010's "nothing to select" case. This is the same class of defect FIND-001 fixed one level up in the same chain, reintroduced one level down.

### verification_readiness — FAIL

3. **[high] PROP-010 misgated in the "Required proof obligations" paragraph (FIND-002 residue).** verification-architecture.md:41-49 requires "PROP-007/008/010/011 if REQ-007's INNER action is safely actionable within this pass's guardrails." PROP-010 verifies REQ-010's NO-OP recording, which by definition applies when there is NO safely-actionable candidate — i.e. the opposite branch. As written, PROP-010 is nominally required exactly where its own precondition doesn't hold, and left unaddressed in the branch (no safely-actionable candidate) where it should actually be checked.

4. **[medium] PROP-001 still under-covers REQ-001's three named failure modes (FIND-006 residue).** PROP-001 (verification-architecture.md:23) now requires "a live auth failure (temporarily-invalid key) OR a live network-error simulation (unreachable host)" — an improvement, but REQ-001 (behavioral-spec.md:16) names THREE modes ("auth error, network error, non-2xx response"). A generic non-2xx response distinct from an auth-specific 401/403 is never required to be exercised, and the OR means a verification pass could satisfy PROP-001 having tested only one of even the two modes it names.

## Positive evidence reviewed (not a summary judgment, just what was checked)
- Full grep of every `REQ-0\d\d` occurrence across both spec files: REQ-001..011 are each unique (no duplicate numbers), and every table row in verification-architecture.md maps its PROP-ID to the REQ that actually matches its current-numbering meaning (PROP-006→REQ-006/SCORE+PICK, PROP-007→REQ-007/INNER, PROP-008→REQ-008/OUTER, etc.) — the one dangling reference found (behavioral-spec.md:52) is the exception, documented above, not evidence of a systemic renumbering failure.
- Read `scripts/daily-metrics/revenuecat_client.py` directly to verify FIND-004's citation (lines 29-32) rather than trusting the spec's prose — citation is accurate.
- Grepped for `NEXT_PUBLIC_STRIPE_LINK_5` across the repo to confirm FIND-003's named product isn't fabricated — found real references outside the spec itself.
