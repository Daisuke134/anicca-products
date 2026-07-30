"use strict";

// RED-first contract test for LM-SB-03 (state machine).
// Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
//   §4  state machine + "Transition contract" (claim, required_inputs, required_receipts,
//       idempotency_key) and "全transitionは UPDATE ... WHERE state = expected RETURNING でclaim"
//   §16 verification matrix row "Maker says done without SHA -> transition denied"

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  STATES,
  FAILURE_STATES,
  ACTIVE_STATES,
  TRANSITIONS,
  transition,
  idempotencyKey,
  legalTargets,
} = require("./transitions.js");

const NOW = 1785000000000;
const SHA = "a".repeat(40);

function claim(over = {}) {
  return { worker_id: "worker-1", lease_expires_at: NOW + 60000, ...over };
}

function verifyRequest(over = {}) {
  return {
    issue_id: "iss_1",
    from: "IMPLEMENTED",
    to: "VERIFIED",
    claim: claim(),
    inputs: { candidate_commit_sha: SHA, reproduction_eval_id: "eval_1" },
    receipts: {
      build_result: "artifact://build/1",
      unit_result: "artifact://unit/1",
      integration_result: "artifact://integration/1",
      sealed_eval_result: "artifact://sealed/1",
      policy_scan_result: "artifact://policy/1",
    },
    checker_version: "checker.v1",
    now_ms: NOW,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// spec §4 state inventory
// ---------------------------------------------------------------------------

test("spec §4: the happy-path states are exactly the documented chain in order", () => {
  assert.deepEqual([...STATES], [
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
});

test("spec §4: the failure states are exactly the documented set", () => {
  assert.deepEqual([...FAILURE_STATES], [
    "DUPLICATE",
    "QUARANTINED",
    "NOT_REPRODUCIBLE",
    "REJECTED",
    "REGRESSION",
    "ROLLED_BACK",
    "RETRY_WAIT",
    "CIRCUIT_OPEN",
  ]);
  for (const state of FAILURE_STATES) assert.equal(STATES.includes(state), false, `${state} is not a happy-path state`);
  assert.equal(ACTIVE_STATES.includes("LEARNING_RECORDED"), false, "a terminal state is not active");
  assert.equal(ACTIVE_STATES.includes("CLAIMED"), true);
});

test("the happy path is walkable end to end and every hop is declared", () => {
  for (let i = 0; i < STATES.length - 1; i += 1) {
    const from = STATES[i];
    const to = STATES[i + 1];
    assert.ok(legalTargets(from).includes(to), `${from} -> ${to} must be legal`);
  }
  assert.equal(legalTargets("LEARNING_RECORDED").length, 0, "the terminal state has no successor");
  assert.deepEqual(legalTargets("NOT_A_STATE"), []);
});

test("every declared transition names its from/to plus explicit requirement lists", () => {
  assert.ok(TRANSITIONS.length > 0);
  for (const rule of TRANSITIONS) {
    assert.ok(STATES.includes(rule.from) || rule.from === "*" || FAILURE_STATES.includes(rule.from), rule.from);
    assert.ok(STATES.includes(rule.to) || FAILURE_STATES.includes(rule.to), rule.to);
    assert.ok(Array.isArray(rule.required_inputs));
    assert.ok(Array.isArray(rule.required_receipts));
    assert.equal(typeof rule.claim_required, "boolean");
    assert.equal(Object.isFrozen(rule), true, "policy data must be frozen");
  }
});

// ---------------------------------------------------------------------------
// §16 row: "Maker says done without SHA -> transition denied"
// ---------------------------------------------------------------------------

test("§16: Maker says done without a commit SHA -> transition denied", () => {
  const noSha = transition(verifyRequest({ inputs: { reproduction_eval_id: "eval_1" } }));
  assert.equal(noSha.allowed, false);
  assert.ok(noSha.reason.includes("missing_input:candidate_commit_sha"));
  assert.equal(noSha.idempotency_key, null, "a denied transition must not mint an idempotency key");

  const blankSha = transition(verifyRequest({ inputs: { candidate_commit_sha: "   ", reproduction_eval_id: "eval_1" } }));
  assert.equal(blankSha.allowed, false);
  assert.ok(blankSha.reason.includes("missing_input:candidate_commit_sha"));

  // the same denial applies one step earlier: implementation cannot be "done" without a SHA
  const implemented = transition({
    issue_id: "iss_1",
    from: "CLAIMED",
    to: "IMPLEMENTED",
    claim: claim(),
    inputs: {},
    receipts: { implementation_result: "artifact://impl/1" },
    checker_version: "checker.v1",
    now_ms: NOW,
  });
  assert.equal(implemented.allowed, false);
  assert.ok(implemented.reason.includes("missing_input:candidate_commit_sha"));
});

test("§16: every required receipt is individually required for IMPLEMENTED -> VERIFIED", () => {
  const required = [
    "build_result",
    "unit_result",
    "integration_result",
    "sealed_eval_result",
    "policy_scan_result",
  ];
  const full = verifyRequest();
  for (const receipt of required) {
    const receipts = { ...full.receipts };
    delete receipts[receipt];
    const result = transition(verifyRequest({ receipts }));
    assert.equal(result.allowed, false, `${receipt} must be required`);
    assert.ok(result.reason.includes(`missing_receipt:${receipt}`), `expected missing_receipt:${receipt}`);
  }
  assert.equal(transition(full).allowed, true, "the fully evidenced transition must be allowed");
});

test("a fully evidenced transition mints the spec §4 idempotency key", () => {
  const result = transition(verifyRequest());
  assert.deepEqual(result, {
    allowed: true,
    reason: [],
    idempotency_key: `iss_1:${SHA}:checker.v1`,
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(idempotencyKey(verifyRequest()), `iss_1:${SHA}:checker.v1`);
});

test("the idempotency key is stable, and differs per issue, candidate and checker version", () => {
  const key = idempotencyKey(verifyRequest());
  assert.equal(key, idempotencyKey(verifyRequest()));
  assert.notEqual(key, idempotencyKey(verifyRequest({ issue_id: "iss_2" })));
  assert.notEqual(key, idempotencyKey(verifyRequest({ checker_version: "checker.v2" })));
  assert.notEqual(key, idempotencyKey(verifyRequest({
    inputs: { candidate_commit_sha: "b".repeat(40), reproduction_eval_id: "eval_1" },
  })));
  // transitions with no candidate still get a deterministic, collision-free key
  const clustered = idempotencyKey({
    issue_id: "iss_1", from: "OBSERVED", to: "CLUSTERED", inputs: { cluster_id: "cl_1" }, checker_version: "v1",
  });
  assert.equal(clustered, "iss_1:OBSERVED->CLUSTERED:v1");
});

// ---------------------------------------------------------------------------
// illegal transitions and claim/lease enforcement
// ---------------------------------------------------------------------------

test("an undeclared hop is denied even with perfect evidence", () => {
  const skipped = transition(verifyRequest({ from: "TRIAGED", to: "VERIFIED" }));
  assert.equal(skipped.allowed, false);
  assert.ok(skipped.reason.includes("illegal_transition:TRIAGED->VERIFIED"));

  const backwards = transition(verifyRequest({ from: "VERIFIED", to: "IMPLEMENTED" }));
  assert.equal(backwards.allowed, false);
  assert.ok(backwards.reason.includes("illegal_transition:VERIFIED->IMPLEMENTED"));

  const terminal = transition(verifyRequest({ from: "LEARNING_RECORDED", to: "MEASURED" }));
  assert.equal(terminal.allowed, false);
});

test("spec §4: a claimed transition requires a live lease held by the acting worker", () => {
  const noClaim = transition(verifyRequest({ claim: undefined }));
  assert.equal(noClaim.allowed, false);
  assert.ok(noClaim.reason.includes("claim_missing"));

  const noWorker = transition(verifyRequest({ claim: claim({ worker_id: "" }) }));
  assert.equal(noWorker.allowed, false);
  assert.ok(noWorker.reason.includes("claim_missing"));

  const expired = transition(verifyRequest({ claim: claim({ lease_expires_at: NOW - 1 }) }));
  assert.equal(expired.allowed, false);
  assert.ok(expired.reason.includes("lease_expired"));

  const exactlyNow = transition(verifyRequest({ claim: claim({ lease_expires_at: NOW }) }));
  assert.equal(exactlyNow.allowed, false, "a lease expiring exactly now is not live");
});

test("failure transitions carry their own evidence requirements", () => {
  const quarantine = transition({
    issue_id: "iss_1", from: "IMPLEMENTED", to: "QUARANTINED", inputs: {}, receipts: {},
    checker_version: "v1", now_ms: NOW,
  });
  assert.equal(quarantine.allowed, false);
  assert.ok(quarantine.reason.includes("missing_input:quarantine_reason"));

  const quarantined = transition({
    issue_id: "iss_1", from: "IMPLEMENTED", to: "QUARANTINED",
    inputs: { quarantine_reason: "sensitive_paths_touched" }, receipts: {},
    checker_version: "v1", now_ms: NOW,
  });
  assert.equal(quarantined.allowed, true);

  const duplicate = transition({
    issue_id: "iss_1", from: "CLUSTERED", to: "DUPLICATE",
    inputs: { duplicate_of_issue_id: "iss_0" }, receipts: {}, checker_version: "v1", now_ms: NOW,
  });
  assert.equal(duplicate.allowed, true);

  const circuit = transition({
    issue_id: "iss_1", from: "CLAIMED", to: "CIRCUIT_OPEN",
    inputs: { consecutive_failures: 2 }, receipts: {}, checker_version: "v1", now_ms: NOW,
  });
  assert.equal(circuit.allowed, false, "the circuit opens on the third failure, not the second");
  assert.ok(circuit.reason.includes("circuit_threshold_not_reached"));

  const opened = transition({
    issue_id: "iss_1", from: "CLAIMED", to: "CIRCUIT_OPEN",
    inputs: { consecutive_failures: 3 }, receipts: {}, checker_version: "v1", now_ms: NOW,
  });
  assert.equal(opened.allowed, true);
});

// ---------------------------------------------------------------------------
// fail-closed and purity
// ---------------------------------------------------------------------------

test("fail-closed: malformed requests are denied with a reason and never throw", () => {
  for (const bad of [
    undefined,
    null,
    {},
    verifyRequest({ issue_id: "" }),
    verifyRequest({ from: undefined }),
    verifyRequest({ to: undefined }),
    verifyRequest({ receipts: undefined }),
    verifyRequest({ inputs: undefined }),
    verifyRequest({ checker_version: "" }),
    verifyRequest({ now_ms: undefined }),
    verifyRequest({ receipts: { ...verifyRequest().receipts, build_result: "" } }),
  ]) {
    let result;
    assert.doesNotThrow(() => { result = transition(bad); });
    assert.equal(result.allowed, false, `must deny: ${JSON.stringify(bad)}`);
    assert.ok(result.reason.length > 0, "a denial always carries a reason");
    assert.equal(result.idempotency_key, null);
  }
});

// ---------------------------------------------------------------------------
// review I4 / I5 / I7 — proven fail-open defects
// ---------------------------------------------------------------------------

test("I4: a non-numeric consecutive_failures fails CLOSED, never opens the circuit", () => {
  for (const junk of ["1", "3", { a: 1 }, [3], true, null, undefined, Number.NaN]) {
    const result = transition({
      issue_id: "iss_1", from: "CLAIMED", to: "CIRCUIT_OPEN",
      inputs: { consecutive_failures: junk }, receipts: {}, checker_version: "v1", now_ms: NOW,
    });
    assert.equal(result.allowed, false, `junk failures must deny: ${JSON.stringify(junk)}`);
    assert.ok(
      result.reason.includes("circuit_threshold_not_reached") || result.reason.includes("missing_input:consecutive_failures"),
      `${JSON.stringify(junk)}: got ${result.reason}`,
    );
  }
});

test("I5: candidate_commit_sha must be a real git SHA, not any non-empty string", () => {
  for (const fake of ["done", "no sha yet lol", "g".repeat(40), "abc", "A".repeat(40), 1234567, { junk: 1 }]) {
    const result = transition(verifyRequest({
      inputs: { candidate_commit_sha: fake, reproduction_eval_id: "eval_1" },
    }));
    assert.equal(result.allowed, false, `fake SHA must deny: ${JSON.stringify(fake)}`);
    assert.ok(
      result.reason.includes("invalid_input:candidate_commit_sha") || result.reason.includes("missing_input:candidate_commit_sha"),
      `${JSON.stringify(fake)}: got ${result.reason}`,
    );
  }
  // 7..40 lowercase hex is the schema's contract — both bounds pass
  assert.equal(transition(verifyRequest({
    inputs: { candidate_commit_sha: "abc1234", reproduction_eval_id: "eval_1" },
  })).allowed, true);
  assert.equal(transition(verifyRequest()).allowed, true);
});

test("I7: two candidates on the same hop never share an idempotency key", () => {
  const shaA = "a".repeat(40);
  const shaB = "b".repeat(40);
  const implemented = (sha) => ({
    issue_id: "iss_1", from: "CLAIMED", to: "IMPLEMENTED",
    claim: claim(),
    inputs: { candidate_commit_sha: sha },
    receipts: { implementation_result: "artifact://impl/1" },
    checker_version: "v1", now_ms: NOW,
  });
  const keyA = transition(implemented(shaA)).idempotency_key;
  const keyB = transition(implemented(shaB)).idempotency_key;
  assert.ok(keyA && keyB, "both transitions must be allowed");
  assert.notEqual(keyA, keyB, "different candidates must never collide on the same hop");
  assert.ok(keyA.includes(shaA), "the key must bind the candidate SHA");

  // hops that genuinely have no candidate keep the from->to key
  assert.equal(
    idempotencyKey({ issue_id: "iss_1", from: "OBSERVED", to: "CLUSTERED", inputs: { cluster_id: "cl_1" }, checker_version: "v1" }),
    "iss_1:OBSERVED->CLUSTERED:v1",
  );
});

test("transition is pure: no mutation, deterministic, sorted frozen reasons", () => {
  const request = verifyRequest({ inputs: {}, receipts: {}, claim: claim({ lease_expires_at: NOW - 1 }) });
  const snapshot = JSON.stringify(request);
  const first = transition(request);
  const second = transition(request);
  assert.equal(JSON.stringify(request), snapshot);
  assert.deepEqual(first, second);
  assert.deepEqual(first.reason, [...first.reason].sort());
  assert.equal(Object.isFrozen(first.reason), true);
});
