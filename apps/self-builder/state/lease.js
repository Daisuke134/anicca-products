"use strict";

/**
 * LM-SB-03 — exactly-once work admission.
 *
 * Two idempotency concerns, same shape ("this unit of work is admitted once"):
 *
 *  1. WORKER LEASES (spec §6 `worker_leases`, §16 "Worker dies after claim -> lease expiry後に
 *     resume"). A crashed worker must not wedge an Issue forever, and a live worker must not
 *     have its work stolen. Both follow from one rule: a claim succeeds only if no OTHER
 *     worker holds a lease that is still live.
 *
 *  2. SIGNAL INGEST (spec §16 "Same signal delivered twice -> one cluster, one Issue"). The
 *     cluster key is derived from the failure SIGNATURE, never from the delivery, so a
 *     replay, a retry and a genuinely new occurrence all land in the same cluster — and one
 *     cluster owns exactly one Issue.
 *
 * All lease helpers are pure: they return a NEW lease table and never mutate the input.
 */

const crypto = require("node:crypto");

/** 15 minutes: long enough for a Maker step, short enough that a crash resumes quickly. */
const LEASE_TTL_MS = 15 * 60 * 1000;

/**
 * spec §5.4 aggregation unit: release × graph_version × model × tool × failure_class.
 * code_version is the release axis (review I3). The model axis joins when a signal ever
 * carries one — no M1 signal does, and adding a dead field would only fake coverage.
 */
const SIGNATURE_FIELDS = Object.freeze([
  "source",
  "graph_version",
  "code_version",
  "node",
  "tool",
  "failure_class",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonBlankString(value) {
  return typeof value === "string" && value.trim() !== "";
}

// ---------------------------------------------------------------------------
// leases
// ---------------------------------------------------------------------------

/** Half-open window: a lease expiring exactly at `nowMs` is already dead. */
function isLeaseLive(lease, nowMs) {
  if (!isPlainObject(lease) || !Number.isFinite(nowMs)) return false;
  return Number.isFinite(lease.expires_at) && lease.expires_at > nowMs;
}

function activeLease(leases, issueId, nowMs) {
  if (!Array.isArray(leases)) return null;
  const found = leases.find((lease) => isPlainObject(lease)
    && lease.issue_id === issueId
    && isLeaseLive(lease, nowMs));
  return found || null;
}

function makeLease(issueId, workerId, nowMs, ttlMs) {
  return Object.freeze({
    issue_id: issueId,
    worker_id: workerId,
    claimed_at: nowMs,
    heartbeat_at: nowMs,
    expires_at: nowMs + ttlMs,
  });
}

function withoutIssue(leases, issueId) {
  return leases.filter((lease) => !isPlainObject(lease) || lease.issue_id !== issueId);
}

function claimResult(claimed, reason, lease, leases) {
  return Object.freeze({
    claimed,
    reason,
    lease: lease || null,
    leases: Object.freeze([...leases]),
  });
}

/**
 * Claim (or re-claim) the lease for an Issue.
 * Mirrors `claim_sb_lease`: an INSERT that only wins when no live lease exists, or when the
 * existing lease belongs to the same worker (crash-restart re-entry).
 */
function claimLease(request) {
  if (!isPlainObject(request)) return claimResult(false, "request_not_object", null, []);
  const leases = Array.isArray(request.leases) ? request.leases : [];
  const issueId = request.issue_id;
  const workerId = request.worker_id;
  const nowMs = request.now_ms;
  const ttlMs = Number.isFinite(request.ttl_ms) && request.ttl_ms > 0 ? request.ttl_ms : LEASE_TTL_MS;

  if (!nonBlankString(issueId)) return claimResult(false, "issue_id_missing", null, leases);
  if (!nonBlankString(workerId)) return claimResult(false, "worker_id_missing", null, leases);
  if (!Number.isFinite(nowMs)) return claimResult(false, "invalid_now_ms", null, leases);

  const held = activeLease(leases, issueId, nowMs);
  if (held && held.worker_id !== workerId) return claimResult(false, "lease_held", null, leases);

  const lease = makeLease(issueId, workerId, nowMs, ttlMs);
  return claimResult(true, null, lease, [...withoutIssue(leases, issueId), lease]);
}

/** Extend the holder's own live lease (heartbeat). An expired lease must be re-claimed. */
function renewLease(request) {
  if (!isPlainObject(request)) {
    return Object.freeze({ renewed: false, reason: "request_not_object", lease: null, leases: Object.freeze([]) });
  }
  const leases = Array.isArray(request.leases) ? request.leases : [];
  const { issue_id: issueId, worker_id: workerId, now_ms: nowMs } = request;
  const ttlMs = Number.isFinite(request.ttl_ms) && request.ttl_ms > 0 ? request.ttl_ms : LEASE_TTL_MS;
  const frozen = Object.freeze([...leases]);

  if (!nonBlankString(issueId) || !nonBlankString(workerId) || !Number.isFinite(nowMs)) {
    return Object.freeze({ renewed: false, reason: "request_invalid", lease: null, leases: frozen });
  }
  const held = activeLease(leases, issueId, nowMs);
  if (!held) {
    return Object.freeze({ renewed: false, reason: "lease_not_live", lease: null, leases: frozen });
  }
  if (held.worker_id !== workerId) {
    return Object.freeze({ renewed: false, reason: "not_lease_holder", lease: null, leases: frozen });
  }
  const renewed = Object.freeze({
    ...held,
    heartbeat_at: nowMs,
    expires_at: nowMs + ttlMs,
  });
  return Object.freeze({
    renewed: true,
    reason: null,
    lease: renewed,
    leases: Object.freeze([...withoutIssue(leases, issueId), renewed]),
  });
}

/** Release a lease the caller actually holds. */
function releaseLease(request) {
  if (!isPlainObject(request)) {
    return Object.freeze({ released: false, reason: "request_not_object", leases: Object.freeze([]) });
  }
  const leases = Array.isArray(request.leases) ? request.leases : [];
  const { issue_id: issueId, worker_id: workerId } = request;
  const frozen = Object.freeze([...leases]);
  if (!nonBlankString(issueId) || !nonBlankString(workerId)) {
    return Object.freeze({ released: false, reason: "request_invalid", leases: frozen });
  }
  const owned = leases.some((lease) => isPlainObject(lease)
    && lease.issue_id === issueId
    && lease.worker_id === workerId);
  if (!owned) return Object.freeze({ released: false, reason: "not_lease_holder", leases: frozen });
  return Object.freeze({
    released: true,
    reason: null,
    leases: Object.freeze(leases.filter((lease) => !(lease.issue_id === issueId && lease.worker_id === workerId))),
  });
}

// ---------------------------------------------------------------------------
// signal ingest idempotency
// ---------------------------------------------------------------------------

/**
 * The cluster key. Deliberately excludes signal_id, observed_at, trace/run ids, latency and
 * tenant_ref: two deliveries of the same failure MUST collide here, and no tenant identity
 * may influence which cluster a failure belongs to (spec §5.4).
 */
function signalSignature(signal) {
  const source = isPlainObject(signal) ? signal : {};
  const material = SIGNATURE_FIELDS
    .map((field) => `${field}=${source[field] === undefined || source[field] === null ? "" : String(source[field])}`)
    .join("|");
  return `sha256:${crypto.createHash("sha256").update(material).digest("hex")}`;
}

function ingestResult(over) {
  return Object.freeze({
    signal_inserted: false,
    cluster_id: null,
    cluster_created: false,
    issue_id: null,
    issue_created: false,
    reason: Object.freeze([]),
    ...over,
  });
}

/**
 * Record one delivered signal and make sure it is represented by exactly one cluster and
 * one Issue. `store` is either the Postgres-backed store or the in-memory fixture store —
 * both expose the same append-only interface.
 */
function ingestSignal(store, signal, nowMs) {
  if (!isPlainObject(store) || typeof store.appendSignal !== "function") {
    return ingestResult({ reason: Object.freeze(["store_unavailable"]) });
  }
  if (!isPlainObject(signal) || !nonBlankString(signal.signal_id)) {
    return ingestResult({ reason: Object.freeze(["signal_invalid"]) });
  }

  const signature = signalSignature(signal);
  const observedAtMs = Number.isFinite(nowMs) ? nowMs : Date.parse(signal.observed_at);
  if (!Number.isFinite(observedAtMs)) {
    return ingestResult({ reason: Object.freeze(["observed_at_invalid"]) });
  }

  // A failure class is what makes a signal clusterable: a healthy run is L0 aggregate data,
  // not a problem to open an Issue for (spec §7.1).
  if (!nonBlankString(signal.failure_class)) {
    return ingestResult({ reason: Object.freeze(["not_clusterable"]) });
  }

  const appended = store.appendSignal({
    signal_id: signal.signal_id,
    signature_hash: signature,
    source: signal.source,
    code_version: signal.code_version || null,
    failure_class: signal.failure_class,
    tenant_ref: signal.tenant_ref || null,
    observed_at_ms: observedAtMs,
  });

  const cluster = store.upsertCluster({ signature_hash: signature, observed_at_ms: observedAtMs, counted: appended.inserted });
  const issue = store.ensureIssue({ cluster_id: cluster.cluster_id });

  return ingestResult({
    signal_inserted: appended.inserted,
    cluster_id: cluster.cluster_id,
    cluster_created: cluster.created,
    issue_id: issue.issue_id,
    issue_created: issue.created,
  });
}

module.exports = {
  LEASE_TTL_MS,
  SIGNATURE_FIELDS,
  isLeaseLive,
  activeLease,
  claimLease,
  renewLease,
  releaseLease,
  signalSignature,
  ingestSignal,
};
