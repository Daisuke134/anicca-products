"use strict";

// RED-first contract test for LM-SB-03 (exactly-once work admission).
// Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
//   §4  "全transitionは UPDATE ... WHERE state = expected RETURNING でclaimする"
//   §6  `worker_leases` (claim, expiry, heartbeat)
//   §16 verification matrix rows:
//        "Same signal delivered twice -> one cluster, one Issue"
//        "Worker dies after claim     -> lease expiry後にresume"

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  LEASE_TTL_MS,
  SIGNATURE_FIELDS,
  activeLease,
  isLeaseLive,
  claimLease,
  renewLease,
  releaseLease,
  signalSignature,
  ingestSignal,
} = require("./lease.js");
const { createMemoryStore } = require("../test-support/memory-store.js");

const NOW = 1785000000000;

function signal(over = {}) {
  return {
    signal_id: "sig_1",
    source: "life_manager.scheduler",
    node: "wake_scheduler",
    tool: "telnyx.place_call",
    failure_class: "provider_low_balance",
    graph_version: "lm.v1",
    observed_at: new Date(NOW).toISOString(),
    ...over,
  };
}

// ---------------------------------------------------------------------------
// §16 row: worker dies after claim -> lease expiry then resume
// ---------------------------------------------------------------------------

test("§16: worker dies after claim -> a second worker resumes only after lease expiry", () => {
  const first = claimLease({ leases: [], issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW });
  assert.equal(first.claimed, true);
  assert.equal(first.lease.worker_id, "worker-1");
  assert.equal(first.lease.expires_at, NOW + LEASE_TTL_MS);
  assert.equal(first.leases.length, 1);

  // worker-1 is now dead but its lease is still live: worker-2 must NOT steal the work
  const stolen = claimLease({
    leases: first.leases, issue_id: "iss_1", worker_id: "worker-2", now_ms: NOW + 1000,
  });
  assert.equal(stolen.claimed, false);
  assert.equal(stolen.reason, "lease_held");
  assert.deepEqual(stolen.leases, first.leases, "a refused claim must not change the lease table");

  // the original worker may always re-claim its own lease (crash-restart of the same worker)
  const reentrant = claimLease({
    leases: first.leases, issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW + 1000,
  });
  assert.equal(reentrant.claimed, true);

  // after expiry the work is resumable by anyone
  const afterExpiry = NOW + LEASE_TTL_MS + 1;
  assert.equal(isLeaseLive(first.lease, afterExpiry), false);
  const resumed = claimLease({
    leases: first.leases, issue_id: "iss_1", worker_id: "worker-2", now_ms: afterExpiry,
  });
  assert.equal(resumed.claimed, true);
  assert.equal(resumed.lease.worker_id, "worker-2");
  assert.equal(resumed.lease.expires_at, afterExpiry + LEASE_TTL_MS);
  assert.equal(resumed.leases.length, 1, "resuming replaces the dead lease, it does not duplicate it");
  assert.equal(activeLease(resumed.leases, "iss_1", afterExpiry).worker_id, "worker-2");
});

test("a lease expiring exactly now is already dead (half-open window)", () => {
  const { lease } = claimLease({ leases: [], issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW });
  assert.equal(isLeaseLive(lease, lease.expires_at - 1), true);
  assert.equal(isLeaseLive(lease, lease.expires_at), false);
  assert.equal(activeLease([lease], "iss_1", lease.expires_at), null);
});

test("leases are per issue: one worker's claim never blocks another issue", () => {
  const a = claimLease({ leases: [], issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW });
  const b = claimLease({ leases: a.leases, issue_id: "iss_2", worker_id: "worker-2", now_ms: NOW });
  assert.equal(b.claimed, true);
  assert.equal(b.leases.length, 2);
  assert.equal(activeLease(b.leases, "iss_1", NOW).worker_id, "worker-1");
  assert.equal(activeLease(b.leases, "iss_2", NOW).worker_id, "worker-2");
  assert.equal(activeLease(b.leases, "iss_3", NOW), null);
});

test("renew extends only the holder's own lease; release frees it immediately", () => {
  const { leases } = claimLease({ leases: [], issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW });

  const foreign = renewLease({ leases, issue_id: "iss_1", worker_id: "worker-2", now_ms: NOW + 1000 });
  assert.equal(foreign.renewed, false);
  assert.equal(foreign.reason, "not_lease_holder");

  const renewed = renewLease({ leases, issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW + 1000 });
  assert.equal(renewed.renewed, true);
  assert.equal(renewed.lease.expires_at, NOW + 1000 + LEASE_TTL_MS);
  assert.equal(renewed.lease.heartbeat_at, NOW + 1000);

  const deadRenew = renewLease({ leases, issue_id: "iss_1", worker_id: "worker-1", now_ms: NOW + LEASE_TTL_MS + 1 });
  assert.equal(deadRenew.renewed, false, "an expired lease must be re-claimed, not renewed");

  const foreignRelease = releaseLease({ leases, issue_id: "iss_1", worker_id: "worker-2" });
  assert.equal(foreignRelease.released, false);
  assert.equal(foreignRelease.leases.length, 1);

  const released = releaseLease({ leases, issue_id: "iss_1", worker_id: "worker-1" });
  assert.equal(released.released, true);
  assert.equal(released.leases.length, 0);
  assert.equal(activeLease(released.leases, "iss_1", NOW), null);
});

test("lease helpers are pure and fail closed on junk", () => {
  const leases = Object.freeze([Object.freeze({ issue_id: "iss_1", worker_id: "w", expires_at: NOW + 1, heartbeat_at: NOW })]);
  const snapshot = JSON.stringify(leases);
  claimLease({ leases, issue_id: "iss_1", worker_id: "w2", now_ms: NOW });
  releaseLease({ leases, issue_id: "iss_1", worker_id: "w" });
  assert.equal(JSON.stringify(leases), snapshot, "the input lease table must never be mutated");

  for (const bad of [undefined, null, {}, { issue_id: "iss_1" }, { worker_id: "w" }, { issue_id: "", worker_id: "w", now_ms: NOW }]) {
    let result;
    assert.doesNotThrow(() => { result = claimLease(bad); });
    assert.equal(result.claimed, false);
    assert.ok(result.reason.length > 0);
  }
  assert.equal(isLeaseLive(undefined, NOW), false);
  assert.equal(activeLease(undefined, "iss_1", NOW), null);
});

// ---------------------------------------------------------------------------
// §16 row: same signal delivered twice -> one cluster, one Issue
// ---------------------------------------------------------------------------

test("§16: the same signal delivered twice yields one cluster and one Issue", () => {
  const store = createMemoryStore();
  const first = ingestSignal(store, signal(), NOW);
  const second = ingestSignal(store, signal(), NOW + 5000);

  assert.equal(first.signal_inserted, true);
  assert.equal(second.signal_inserted, false, "a replayed signal_id must not append a second observation");
  assert.equal(first.cluster_id, second.cluster_id);
  assert.equal(first.issue_id, second.issue_id);
  assert.equal(second.cluster_created, false);
  assert.equal(second.issue_created, false);

  const snapshot = store.snapshot();
  assert.equal(snapshot.signals.length, 1, "one signal");
  assert.equal(snapshot.clusters.length, 1, "one cluster");
  assert.equal(snapshot.issues.length, 1, "one Issue");
});

test("a DIFFERENT delivery of the same failure joins the existing cluster without a second Issue", () => {
  const store = createMemoryStore();
  const first = ingestSignal(store, signal({ signal_id: "sig_1" }), NOW);
  const again = ingestSignal(store, signal({ signal_id: "sig_2" }), NOW + 60000);

  assert.equal(again.signal_inserted, true, "a genuinely new observation is recorded");
  assert.equal(again.cluster_id, first.cluster_id, "same signature -> same cluster");
  assert.equal(again.issue_id, first.issue_id, "one cluster -> one Issue");
  assert.equal(again.cluster_created, false);
  assert.equal(again.issue_created, false);

  const snapshot = store.snapshot();
  assert.deepEqual(
    [snapshot.signals.length, snapshot.clusters.length, snapshot.issues.length],
    [2, 1, 1],
  );
  assert.equal(snapshot.clusters[0].occurrences, 2, "recurrence is counted on the cluster");
  assert.equal(snapshot.clusters[0].first_seen_ms, NOW);
  assert.equal(snapshot.clusters[0].last_seen_ms, NOW + 60000);
});

test("a different failure class opens its own cluster and Issue", () => {
  const store = createMemoryStore();
  const low = ingestSignal(store, signal({ signal_id: "sig_1" }), NOW);
  const dial = ingestSignal(store, signal({ signal_id: "sig_2", failure_class: "dial_failed" }), NOW);
  assert.notEqual(dial.cluster_id, low.cluster_id);
  assert.notEqual(dial.issue_id, low.issue_id);
  assert.equal(store.snapshot().issues.length, 2);
});

// I3: the test name now claims exactly what it asserts. The spec §5.4 aggregation unit is
// release × graph_version × model × tool × failure_class; code_version is the release axis
// (the model axis arrives when a signal ever carries one — none does in M1).
test("spec §5.4: the cluster signature is code_version(release) x graph_version x node x tool x failure_class x source", () => {
  const a = signalSignature(signal());
  assert.equal(a, signalSignature(signal({ signal_id: "other", observed_at: "2026-01-01T00:00:00.000Z" })),
    "signature must ignore per-delivery fields");
  assert.notEqual(a, signalSignature(signal({ failure_class: "dial_failed" })));
  assert.notEqual(a, signalSignature(signal({ tool: "gcal.patch_event" })));
  assert.notEqual(a, signalSignature(signal({ graph_version: "lm.v2" })));
  assert.notEqual(a, signalSignature(signal({ node: "travel_fill" })));
  assert.notEqual(a, signalSignature(signal({ source: "life_manager.travel" })));
  // I3: a new RELEASE of the code is a different failure population — it must re-cluster.
  assert.notEqual(a, signalSignature(signal({ code_version: "1.4.1" })),
    "code_version (release) must be part of the cluster signature");
  assert.equal(a, signalSignature(signal({ code_version: undefined })));
  assert.match(a, /^sha256:[0-9a-f]{64}$/);
  // no tenant identity may leak into a cluster key
  assert.equal(a, signalSignature({ ...signal(), tenant_ref: `sha256:${"b".repeat(64)}` }));
  assert.deepEqual([...SIGNATURE_FIELDS],
    ["source", "graph_version", "code_version", "node", "tool", "failure_class"]);
});

test("I3: two releases of the same failure open separate clusters and Issues", () => {
  const store = createMemoryStore();
  const v1 = ingestSignal(store, signal({ signal_id: "sig_1", code_version: "1.4.0" }), NOW);
  const v2 = ingestSignal(store, signal({ signal_id: "sig_2", code_version: "1.4.1" }), NOW);
  assert.notEqual(v1.cluster_id, v2.cluster_id);
  assert.notEqual(v1.issue_id, v2.issue_id);
  assert.equal(store.snapshot().signals[0].code_version, "1.4.0",
    "the store must persist code_version so the release axis survives");
});

test("a signal with no failure class is not clusterable and never opens an Issue", () => {
  const store = createMemoryStore();
  const result = ingestSignal(store, signal({ failure_class: null }), NOW);
  assert.equal(result.cluster_id, null);
  assert.equal(result.issue_id, null);
  assert.ok(result.reason.includes("not_clusterable"));
  const snapshot = store.snapshot();
  assert.equal(snapshot.clusters.length, 0);
  assert.equal(snapshot.issues.length, 0);
});

test("ingest fails closed on junk without throwing and writes nothing", () => {
  const store = createMemoryStore();
  for (const bad of [undefined, null, {}, "signal", { signal_id: "" }]) {
    let result;
    assert.doesNotThrow(() => { result = ingestSignal(store, bad, NOW); });
    assert.equal(result.signal_inserted, false);
    assert.equal(result.issue_id, null);
    assert.ok(result.reason.length > 0);
  }
  const snapshot = store.snapshot();
  assert.deepEqual([snapshot.signals.length, snapshot.clusters.length, snapshot.issues.length], [0, 0, 0]);
});

// ---------------------------------------------------------------------------
// the fixture store must behave like the SQL it stands in for
// ---------------------------------------------------------------------------

test("the memory store enforces the same append-only and atomic-claim rules as the migration", () => {
  const store = createMemoryStore();
  ingestSignal(store, signal(), NOW);

  // append-only: no update or delete surface is exposed at all
  assert.equal(typeof store.updateSignal, "undefined");
  assert.equal(typeof store.deleteSignal, "undefined");
  assert.equal(typeof store.updateAudit, "undefined");

  const issueId = store.snapshot().issues[0].issue_id;

  // UPDATE ... WHERE state = expected RETURNING: exactly one of two racing claims wins
  const won = store.claimTransition({ issue_id: issueId, from: "OBSERVED", to: "CLUSTERED" });
  const lost = store.claimTransition({ issue_id: issueId, from: "OBSERVED", to: "CLUSTERED" });
  assert.equal(won.claimed, true);
  assert.equal(lost.claimed, false, "the second claim sees a changed state and loses");
  assert.equal(store.snapshot().issues[0].state, "CLUSTERED");

  // an unknown issue never claims
  assert.equal(store.claimTransition({ issue_id: "nope", from: "OBSERVED", to: "CLUSTERED" }).claimed, false);

  // every successful claim leaves an append-only audit row
  const audit = store.snapshot().audit;
  assert.equal(audit.length, 1);
  assert.deepEqual(
    { issue_id: audit[0].issue_id, from_state: audit[0].from_state, to_state: audit[0].to_state },
    { issue_id: issueId, from_state: "OBSERVED", to_state: "CLUSTERED" },
  );
  assert.equal(Object.isFrozen(audit[0]), true, "an audit row is immutable once written");
});

test("M3: the memory store mirrors UNIQUE(issue_id, idempotency_key) ON CONFLICT DO NOTHING for audit", () => {
  const store = createMemoryStore();
  ingestSignal(store, signal(), NOW);
  const issueId = store.snapshot().issues[0].issue_id;

  const first = store.claimTransition({ issue_id: issueId, from: "OBSERVED", to: "CLUSTERED", idempotency_key: "k1" });
  const replay = store.claimTransition({ issue_id: issueId, from: "CLUSTERED", to: "TRIAGED", idempotency_key: "k1" });
  assert.equal(first.claimed, true);
  assert.equal(replay.claimed, true, "the state claim itself still wins");
  assert.equal(store.snapshot().audit.length, 1,
    "a replayed idempotency key must not double-write audit history");

  const fresh = store.claimTransition({ issue_id: issueId, from: "TRIAGED", to: "REPRODUCED", idempotency_key: "k2" });
  assert.equal(fresh.claimed, true);
  assert.equal(store.snapshot().audit.length, 2);
});

test("the memory store snapshot is a copy, so a caller cannot rewrite history", () => {
  const store = createMemoryStore();
  ingestSignal(store, signal(), NOW);
  const snapshot = store.snapshot();
  snapshot.signals.length = 0;
  snapshot.clusters.push({ forged: true });
  assert.equal(store.snapshot().signals.length, 1);
  assert.equal(store.snapshot().clusters.length, 1);
});
