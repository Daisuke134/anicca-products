"use strict";

/**
 * LM-SB-03 — the Self-Builder state machine.
 *
 * Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md §4.
 *
 * The legal graph and every transition's evidence requirement live here as DATA, not as
 * branching code, because this table is the thing an adversary reviews and the migration's
 * CHECK constraint mirrors. `transition()` is a pure function over that table: no I/O, no
 * clock, no LLM. The Postgres function `claim_sb_issue_transition` performs the actual
 * `UPDATE ... WHERE state = expected RETURNING`; this module decides whether the attempt is
 * even admissible.
 *
 * Fail-closed: an unrecognised hop, a missing input, a missing receipt, a dead lease or a
 * malformed request all deny. A denial never mints an idempotency key, so nothing
 * downstream can mistake it for work that happened.
 */

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/** spec §4 happy path, in order. */
const STATES = Object.freeze([
  "OBSERVED",
  "CLUSTERED",
  "TRIAGED",
  "REPRODUCED",
  "EVAL_READY",
  "CLAIMED",
  "IMPLEMENTED",
  "VERIFIED",
  "PR_OPEN",
  "CANARY",
  "PROMOTED",
  "MEASURED",
  "LEARNING_RECORDED",
]);

/** spec §4 failure transitions. */
const FAILURE_STATES = Object.freeze([
  "DUPLICATE",
  "QUARANTINED",
  "NOT_REPRODUCIBLE",
  "REJECTED",
  "REGRESSION",
  "ROLLED_BACK",
  "RETRY_WAIT",
  "CIRCUIT_OPEN",
]);

const TERMINAL_STATE = "LEARNING_RECORDED";

/**
 * "any active state" in spec §4. A finished issue is NOT re-openable as DUPLICATE or
 * QUARANTINED: once a learning receipt is written, that history is closed.
 */
const ACTIVE_STATES = Object.freeze(STATES.filter((state) => state !== TERMINAL_STATE));

const ANY_ACTIVE = "*";

/** spec §4 "same failure x3 -> CIRCUIT_OPEN". */
const CIRCUIT_FAILURE_THRESHOLD = 3;

function rule(from, to, { inputs = [], receipts = [], claim = false, idempotency = null, minFailures = null } = {}) {
  return deepFreeze({
    from,
    to,
    required_inputs: inputs,
    required_receipts: receipts,
    claim_required: claim,
    idempotency_parts: idempotency,
    min_consecutive_failures: minFailures,
  });
}

const TRANSITIONS = deepFreeze([
  // ---- happy path -------------------------------------------------------------------
  rule("OBSERVED", "CLUSTERED", { inputs: ["cluster_id"] }),
  rule("CLUSTERED", "TRIAGED", { inputs: ["cluster_id"], receipts: ["evidence_packet_result"] }),
  rule("TRIAGED", "REPRODUCED", { inputs: ["reproduction_eval_id"], receipts: ["reproduction_baseline_result"] }),
  rule("REPRODUCED", "EVAL_READY", { inputs: ["reproduction_eval_id"], receipts: ["grader_sealed_result"] }),
  rule("EVAL_READY", "CLAIMED", { claim: true }),
  rule("CLAIMED", "IMPLEMENTED", {
    inputs: ["candidate_commit_sha"],
    receipts: ["implementation_result"],
    claim: true,
  }),
  // spec §4 "Transition contract" is quoted verbatim for this hop.
  rule("IMPLEMENTED", "VERIFIED", {
    inputs: ["candidate_commit_sha", "reproduction_eval_id"],
    receipts: [
      "build_result",
      "unit_result",
      "integration_result",
      "sealed_eval_result",
      "policy_scan_result",
    ],
    claim: true,
    idempotency: ["issue_id", "candidate_commit_sha", "checker_version"],
  }),
  rule("VERIFIED", "PR_OPEN", { inputs: ["candidate_commit_sha", "pr_number"] }),
  rule("PR_OPEN", "CANARY", { inputs: ["candidate_commit_sha"], receipts: ["policy_decision_result"] }),
  rule("CANARY", "PROMOTED", { receipts: ["canary_metric_result"] }),
  rule("PROMOTED", "MEASURED", { receipts: ["outcome_measurement_result"] }),
  rule("MEASURED", "LEARNING_RECORDED", { inputs: ["learning_receipt_id"] }),

  // ---- failure transitions ----------------------------------------------------------
  rule(ANY_ACTIVE, "DUPLICATE", { inputs: ["duplicate_of_issue_id"] }),
  rule(ANY_ACTIVE, "QUARANTINED", { inputs: ["quarantine_reason"] }),
  rule(ANY_ACTIVE, "RETRY_WAIT", { inputs: ["retry_after_ms"] }),
  rule(ANY_ACTIVE, "CIRCUIT_OPEN", {
    inputs: ["consecutive_failures"],
    minFailures: CIRCUIT_FAILURE_THRESHOLD,
  }),
  rule("REPRODUCED", "NOT_REPRODUCIBLE", { receipts: ["reproduction_baseline_result"] }),
  rule("IMPLEMENTED", "REJECTED", { receipts: ["checker_result"] }),
  rule("VERIFIED", "REGRESSION", { receipts: ["regression_result"] }),
  rule("CANARY", "ROLLED_BACK", { receipts: ["rollback_result"] }),
]);

function findRule(from, to) {
  const exact = TRANSITIONS.find((item) => item.from === from && item.to === to);
  if (exact) return exact;
  if (!ACTIVE_STATES.includes(from)) return null;
  return TRANSITIONS.find((item) => item.from === ANY_ACTIVE && item.to === to) || null;
}

/** Every state reachable from `from` in one hop. */
function legalTargets(from) {
  const targets = TRANSITIONS
    .filter((item) => item.from === from || (item.from === ANY_ACTIVE && ACTIVE_STATES.includes(from)))
    .map((item) => item.to);
  return Object.freeze([...new Set(targets)]);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Present means: a non-blank string, or a finite number. Anything else is absent. */
function isProvided(value) {
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return false;
}

function nonBlankString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * I5: the same contract the migration enforces with
 * `CHECK (candidate_commit_sha ~ '^[0-9a-f]{7,40}$')`. "done" is not a SHA.
 */
const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/;

/** Per-input VALUE validators beyond mere presence (I5). Fail-closed on violation. */
const INPUT_VALIDATORS = Object.freeze({
  candidate_commit_sha: (value) => typeof value === "string" && COMMIT_SHA_PATTERN.test(value),
});

/**
 * spec §4 `idempotency_key`. Data-driven: the IMPLEMENTED->VERIFIED hop uses the exact
 * `issue_id:candidate_sha:checker_version` shape the spec writes down. Every OTHER hop that
 * carries a candidate binds the SHA into its key too (review I7: two candidates on the same
 * hop must never collide); only candidate-free hops use the bare from->to key.
 * Returns null when the key material is incomplete.
 */
function idempotencyKey(request) {
  if (!isPlainObject(request)) return null;
  const { issue_id: issueId, from, to, checker_version: checkerVersion } = request;
  if (!nonBlankString(issueId) || !nonBlankString(checkerVersion)) return null;
  if (!nonBlankString(from) || !nonBlankString(to)) return null;

  const matched = findRule(from, to);
  const parts = matched && matched.idempotency_parts;
  const inputs = isPlainObject(request.inputs) ? request.inputs : {};

  if (!parts) {
    // I7: when the hop requires a candidate SHA, the key must distinguish candidates.
    const requiresSha = Boolean(matched && matched.required_inputs.includes("candidate_commit_sha"));
    if (!requiresSha) return `${issueId}:${from}->${to}:${checkerVersion}`;
    const sha = inputs.candidate_commit_sha;
    if (!INPUT_VALIDATORS.candidate_commit_sha(sha)) return null;
    return `${issueId}:${from}->${to}:${sha}:${checkerVersion}`;
  }

  const resolved = parts.map((part) => {
    if (part === "issue_id") return issueId;
    if (part === "checker_version") return checkerVersion;
    return inputs[part];
  });
  if (resolved.some((value) => !isProvided(value))) return null;
  return resolved.map((value) => String(value).trim()).join(":");
}

function deny(reasons) {
  return Object.freeze({
    allowed: false,
    reason: Object.freeze([...new Set(reasons)].sort()),
    idempotency_key: null,
  });
}

/**
 * @returns frozen { allowed, reason: string[], idempotency_key: string|null }
 */
function transition(request) {
  if (!isPlainObject(request)) return deny(["request_not_object"]);

  const reasons = [];
  const { issue_id: issueId, from, to, checker_version: checkerVersion, now_ms: nowMs } = request;

  if (!nonBlankString(issueId)) reasons.push("issue_id_missing");
  if (!nonBlankString(checkerVersion)) reasons.push("checker_version_missing");
  if (!Number.isFinite(nowMs)) reasons.push("invalid_now_ms");
  if (!nonBlankString(from) || !nonBlankString(to)) {
    reasons.push("state_missing");
    return deny(reasons);
  }

  const matched = findRule(from, to);
  if (!matched) return deny([...reasons, `illegal_transition:${from}->${to}`]);

  const inputs = isPlainObject(request.inputs) ? request.inputs : null;
  const receipts = isPlainObject(request.receipts) ? request.receipts : null;
  if (inputs === null) reasons.push("inputs_missing");
  if (receipts === null) reasons.push("receipts_missing");

  for (const field of matched.required_inputs) {
    const value = (inputs || {})[field];
    if (!isProvided(value)) {
      reasons.push(`missing_input:${field}`);
    } else if (INPUT_VALIDATORS[field] && !INPUT_VALIDATORS[field](value)) {
      // I5: presence is not validity — "done" as a commit SHA denies.
      reasons.push(`invalid_input:${field}`);
    }
  }
  for (const field of matched.required_receipts) {
    if (!isProvided((receipts || {})[field])) reasons.push(`missing_receipt:${field}`);
  }

  if (matched.min_consecutive_failures !== null) {
    const failures = (inputs || {}).consecutive_failures;
    // I4: fail CLOSED — a non-numeric count can never open the circuit.
    if (!Number.isFinite(failures) || failures < matched.min_consecutive_failures) {
      reasons.push("circuit_threshold_not_reached");
    }
  }

  if (matched.claim_required) {
    const claim = isPlainObject(request.claim) ? request.claim : null;
    if (claim === null || !nonBlankString(claim.worker_id)) {
      reasons.push("claim_missing");
    } else if (!Number.isFinite(claim.lease_expires_at)) {
      reasons.push("claim_missing");
    } else if (Number.isFinite(nowMs) && claim.lease_expires_at <= nowMs) {
      // half-open: a lease expiring exactly now is already dead, matching lease.js
      reasons.push("lease_expired");
    }
  }

  if (reasons.length > 0) return deny(reasons);

  const key = idempotencyKey(request);
  if (key === null) return deny(["idempotency_key_unavailable"]);

  return Object.freeze({ allowed: true, reason: Object.freeze([]), idempotency_key: key });
}

module.exports = {
  STATES,
  FAILURE_STATES,
  ACTIVE_STATES,
  TERMINAL_STATE,
  TRANSITIONS,
  CIRCUIT_FAILURE_THRESHOLD,
  transition,
  idempotencyKey,
  legalTargets,
};
