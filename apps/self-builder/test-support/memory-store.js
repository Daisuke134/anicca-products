"use strict";

/**
 * LM-SB-03 fixture store — an in-memory stand-in for the Postgres schema in
 * `migrations/2026-07-30-self-builder-core.sql`, so the state-machine and idempotency
 * contracts run with no DATABASE_URL. Mirrors the life-call `test-support/` pattern.
 *
 * It deliberately reproduces the SQL's GUARANTEES, not just its shape:
 *   - `sb_signals.signal_id PRIMARY KEY`        -> a replayed signal_id does not insert
 *   - `sb_clusters.signature_hash UNIQUE`       -> one signature, one cluster
 *   - `sb_issues.cluster_id UNIQUE`             -> one cluster, one Issue
 *   - append-only sb_signals / sb_audit         -> no update/delete method exists at all
 *   - `UPDATE ... WHERE state = expected`       -> claimTransition wins at most once
 *
 * If a behaviour is only true in this fixture and not in the SQL, the test suite is lying —
 * `state/schema.test.js` asserts the SQL side of each rule, and
 * `test/postgres/self-builder-core-postgres.integration.sh` runs the same three scenarios
 * against a real Postgres.
 */

const { STATES } = require("../state/transitions.js");

const INITIAL_STATE = STATES[0]; // OBSERVED

function createMemoryStore() {
  const signals = [];
  const clusters = [];
  const issues = [];
  const audit = [];
  let sequence = 0;

  function nextId(prefix) {
    sequence += 1;
    return `${prefix}_${String(sequence).padStart(6, "0")}`;
  }

  /** INSERT ... ON CONFLICT (signal_id) DO NOTHING */
  function appendSignal(row) {
    if (signals.some((existing) => existing.signal_id === row.signal_id)) {
      return Object.freeze({ inserted: false, signal_id: row.signal_id });
    }
    signals.push(Object.freeze({ ...row }));
    return Object.freeze({ inserted: true, signal_id: row.signal_id });
  }

  /** INSERT ... ON CONFLICT (signature_hash) DO UPDATE SET occurrences = occurrences + 1 */
  function upsertCluster({ signature_hash: signature, observed_at_ms: observedAtMs, counted = true }) {
    const index = clusters.findIndex((cluster) => cluster.signature_hash === signature);
    if (index === -1) {
      const cluster = {
        cluster_id: nextId("cl"),
        signature_hash: signature,
        occurrences: 1,
        first_seen_ms: observedAtMs,
        last_seen_ms: observedAtMs,
      };
      clusters.push(cluster);
      return Object.freeze({ cluster_id: cluster.cluster_id, created: true });
    }
    const existing = clusters[index];
    // A replayed delivery must not inflate recurrence — that is how a duplicate would look
    // like a worsening trend and jump the §6 priority queue.
    clusters[index] = {
      ...existing,
      occurrences: counted ? existing.occurrences + 1 : existing.occurrences,
      first_seen_ms: Math.min(existing.first_seen_ms, observedAtMs),
      last_seen_ms: Math.max(existing.last_seen_ms, observedAtMs),
    };
    return Object.freeze({ cluster_id: existing.cluster_id, created: false });
  }

  /** INSERT ... ON CONFLICT (cluster_id) DO NOTHING RETURNING */
  function ensureIssue({ cluster_id: clusterId }) {
    const existing = issues.find((issue) => issue.cluster_id === clusterId);
    if (existing) return Object.freeze({ issue_id: existing.issue_id, created: false });
    const issue = { issue_id: nextId("iss"), cluster_id: clusterId, state: INITIAL_STATE };
    issues.push(issue);
    return Object.freeze({ issue_id: issue.issue_id, created: true });
  }

  /** UPDATE sb_issues SET state = to WHERE issue_id = ? AND state = from RETURNING */
  function claimTransition({ issue_id: issueId, from, to, idempotency_key: idempotencyKey = null, worker_id: workerId = null }) {
    const index = issues.findIndex((issue) => issue.issue_id === issueId && issue.state === from);
    if (index === -1) return Object.freeze({ claimed: false, state: null });
    issues[index] = { ...issues[index], state: to };
    // M3: mirrors UNIQUE (issue_id, idempotency_key) ... ON CONFLICT DO NOTHING — a
    // replayed key must not double-write history even when the state claim wins.
    const duplicate = idempotencyKey !== null && audit.some(
      (row) => row.issue_id === issueId && row.idempotency_key === idempotencyKey,
    );
    if (!duplicate) {
      audit.push(Object.freeze({
        audit_id: nextId("aud"),
        issue_id: issueId,
        from_state: from,
        to_state: to,
        idempotency_key: idempotencyKey,
        worker_id: workerId,
      }));
    }
    return Object.freeze({ claimed: true, state: to });
  }

  function snapshot() {
    return {
      signals: signals.map((row) => ({ ...row })),
      clusters: clusters.map((row) => ({ ...row })),
      issues: issues.map((row) => ({ ...row })),
      audit: audit.map((row) => row),
    };
  }

  // No update/delete methods are exposed: append-only is enforced by absence, exactly as the
  // migration enforces it with REVOKE UPDATE, DELETE.
  return Object.freeze({ appendSignal, upsertCluster, ensureIssue, claimTransition, snapshot });
}

module.exports = { createMemoryStore, INITIAL_STATE };
