# Spec Review Verdict — portfolio-self-improve-loop, iteration 3 (FINAL, lean mode)

**Overall: FAIL** (spec_fidelity: FAIL, verification_readiness: FAIL)

This is iteration 3 of 3 (lean mode max). Per protocol this verdict must now escalate to human
review rather than loop to a 4th spec-review iteration.

## Prior (iteration-2) findings re-verified against CURRENT spec text

| Finding | Status | Evidence |
|---|---|---|
| Dangling REQ-006/007 cross-reference (behavioral-spec.md old line 52) | **fixed** | behavioral-spec.md:52 now reads "REQ-006's SCORE+PICK step SHALL NOT treat..." and REQ-006 IS currently the SCORE+PICK requirement (behavioral-spec.md:59-71) — the reference is now accurate, not dangling. |
| REQ-006 "exactly one" with no fallback mechanism | **partial** | REQ-006 now produces an ORDERED LIST (behavioral-spec.md:62-64) and REQ-007 walks it in order (behavioral-spec.md:74-75) — the missing "how do we get the next candidate" mechanism from iteration-2 is resolved. BUT this rework introduced a new defect: REQ-010's NO-OP is now invoked by REQ-006 for one precondition ("list is empty") and by REQ-007 for a materially different precondition ("list non-empty but every candidate excluded as out-of-scope") — and REQ-010's own text only describes the first case, not the second, and never requires the "flagged findings" REQ-007 says must be surfaced. See finding below — same defect class as the one FIND-001 fixed, reintroduced one level down. |
| PROP-010 wrongly bundled into "safely actionable" conditional | **fixed** | verification-architecture.md:46-57 now states two explicitly mutually-exclusive branches (list has a safely-actionable candidate → PROP-007/008/011 apply, PROP-010 does not; every candidate excluded → PROP-010 applies, PROP-007/008/011 do not). Logically exhaustive and non-overlapping, including the vacuous empty-list case. |
| PROP-001 OR instead of AND for two failure modes | **partial** | verification-architecture.md:23 now requires the auth-failure AND network-error paths "EACH independently" — the OR defect is fixed. BUT REQ-001 (behavioral-spec.md:16) names a THIRD failure mode, "non-2xx response," distinct from auth error, that PROP-001 still never requires to be exercised. This was explicitly named in the iteration-2 verdict's finding #4 and remains unaddressed in this revision. |

## New/residual findings this pass

### spec_fidelity — FAIL

1. **[high]** REQ-006 (behavioral-spec.md:70-71) triggers REQ-010's NO-OP only for "the resulting list is empty" (no signal at all). REQ-007 (behavioral-spec.md:84-86) separately triggers "REQ-010's NO-OP" for a different case — the list is non-empty (a real, non-noise signal was found and ranked) but every candidate got excluded during the walk for safety/scope reasons — and additionally requires the outer cycle to "still report the flagged findings." REQ-010's own text (behavioral-spec.md:107-111) matches only REQ-006's case ("no non-noise leading-indicator signal exists") and never mentions an obligation to report flagged-but-excluded findings. An implementer following REQ-010 literally for REQ-007's branch could produce a NO-OP report that doesn't surface the real (blocked) finding — which is functionally under-reporting/soft-fabrication and cuts against this same spec's own "surfaced, not hidden" principle. verification-architecture.md's PROP-010 row does correctly require the flagged findings be recorded (line 51-55), which shows the intended behavior is understood, but the authoritative behavioral-spec.md text (REQ-010) itself does not say this and doesn't match how it's invoked by REQ-007.

### verification_readiness — FAIL

2. **[medium]** PROP-001 (verification-architecture.md:23) still requires only 2 of REQ-001's 3 named failure modes (auth error, network error) to be exercised live. "non-2xx response" (a generic failure distinct from an auth-specific 401/403 — e.g. 500/429/400) has no proof obligation at all. Given REQ-001 is this spec's core anti-fabrication guarantee (explicitly ties to HARD RULE 0.24 no-dry-run + HONESTY Rule 4/5), a bug in the generic-non-2xx code path specifically would ship without any required live verification catching it.

## Escalation note

Both fixes claimed for FIND-002 and FIND-004 in this revision are real but partial: each addressed
the headline defect while leaving (or, in FIND-002's case, introducing) a residual gap of the same
character as the original finding. Per lean-mode's 3-iteration cap, this verdict does not loop to
a 4th spec-review round — it escalates to human review with the two findings above as the concrete
open items to resolve before implementation begins.
