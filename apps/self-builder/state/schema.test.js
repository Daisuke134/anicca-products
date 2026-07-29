"use strict";

// RED-first contract test for the LM-SB-03 migration.
// The SQL is the authority (spec §4 "Postgresをauthority、GitHub Issue/labelをprojectionとする"),
// so the invariants the JS layer relies on must also exist as constraints in the schema —
// otherwise a direct SQL writer could create the exact states the state machine forbids.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { STATES, FAILURE_STATES } = require("./transitions.js");

const MIGRATIONS = path.join(__dirname, "..", "migrations");
const MIGRATION_FILE = path.join(MIGRATIONS, "2026-07-30-self-builder-core.sql");
const ROLLBACK_FILE = path.join(MIGRATIONS, "2026-07-30-self-builder-core.rollback.sql");

const sql = fs.readFileSync(MIGRATION_FILE, "utf8");
const rollback = fs.readFileSync(ROLLBACK_FILE, "utf8");

const TABLES = Object.freeze([
  "sb_signals",
  "sb_clusters",
  "sb_issues",
  "sb_leases",
  "sb_audit",
]);

test("spec §6: every Self-Builder core table is created idempotently", () => {
  for (const table of TABLES) {
    assert.ok(
      new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}\\b`).test(sql),
      `${table} must be created with IF NOT EXISTS`,
    );
  }
});

test("spec §4: the issue state CHECK lists every happy-path and failure state", () => {
  const check = /state text NOT NULL[^,]*CHECK \(state IN \(([^)]*)\)\)/.exec(sql);
  assert.ok(check, "sb_issues.state must carry a CHECK IN (...) constraint");
  const declared = check[1].split(",").map((item) => item.trim().replace(/^'|'$/g, ""));
  assert.deepEqual(declared, [...STATES, ...FAILURE_STATES],
    "the SQL state list must match transitions.js exactly, in the same order");
});

test("§16: one cluster one Issue is enforced by UNIQUE constraints, not by convention", () => {
  assert.match(sql, /signature_hash text NOT NULL UNIQUE/, "a cluster signature must be unique");
  assert.match(sql, /cluster_id (?:uuid|text) NOT NULL UNIQUE REFERENCES public\.sb_clusters/,
    "an Issue must be unique per cluster");
  assert.match(sql, /signal_id text PRIMARY KEY/, "a replayed signal_id must collide on the primary key");
});

test("spec §2/§6: sb_signals and sb_audit are append-only for the worker role", () => {
  for (const table of ["sb_signals", "sb_audit"]) {
    assert.ok(
      new RegExp(`REVOKE UPDATE, DELETE ON public\\.${table}`).test(sql),
      `${table} must revoke UPDATE and DELETE (append-only audit history is immutable kernel)`,
    );
    assert.ok(
      new RegExp(`GRANT (?:INSERT|SELECT, INSERT) ON public\\.${table}`).test(sql),
      `${table} must still grant append access`,
    );
  }
});

test("spec §4: the transition claim is an UPDATE ... WHERE state = expected RETURNING", () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.claim_sb_issue_transition\(/);
  assert.match(sql, /WHERE issue_id = p_issue_id\s*\n\s*AND state = p_from_state/,
    "the claim must be conditional on the expected state");
  assert.match(sql, /GET DIAGNOSTICS|RETURNING/, "the claim must report whether it won");
  assert.doesNotMatch(sql, /pg_advisory_lock/, "spec §4 forbids session advisory locks");
});

test("spec §6: worker leases carry expiry and heartbeat and are claimed atomically", () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.sb_leases/);
  assert.match(sql, /expires_at timestamptz NOT NULL/);
  assert.match(sql, /heartbeat_at timestamptz NOT NULL/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.claim_sb_lease\(/);
  assert.match(sql, /expires_at <= now\(\)|expires_at < now\(\)/, "an expired lease must be reclaimable");
});

test("row level security is enabled on every table and functions are role-locked", () => {
  for (const table of TABLES) {
    assert.ok(
      new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`).test(sql),
      `${table} must enable RLS`,
    );
  }
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.claim_sb_issue_transition/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.claim_sb_issue_transition/);
});

test("no raw tenant or payload column exists (spec §5.4 default export禁止)", () => {
  assert.doesNotMatch(sql, /\b(?:uid|user_id|email|phone|telegram_chat_id|raw_payload|prompt_text)\b/i,
    "the Self-Builder schema must never hold raw identity or content");
  assert.match(sql, /tenant_ref text/, "only the pseudonymous tenant_ref is stored");
  // A CHECK is not evaluated for NULL, so this single form both allows an unattributed
  // fleet signal and rejects any non-pseudonymous value.
  assert.match(sql, /CHECK \(tenant_ref ~ '\^sha256:\[0-9a-f\]\{64\}\$'\)/,
    "tenant_ref must be constrained to a sha256 pseudonym at the database level");
});

test("the rollback drops exactly what the migration created and nothing else", () => {
  for (const table of TABLES) {
    assert.ok(
      new RegExp(`DROP TABLE IF EXISTS public\\.${table}`).test(rollback),
      `rollback must drop ${table}`,
    );
  }
  assert.match(rollback, /DROP FUNCTION IF EXISTS public\.claim_sb_issue_transition/);
  assert.match(rollback, /DROP FUNCTION IF EXISTS public\.claim_sb_lease/);
  const droppedTables = [...rollback.matchAll(/DROP TABLE IF EXISTS public\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual([...droppedTables].sort(), [...TABLES].sort(),
    "the rollback must not drop a table this migration did not create");
});

test("the Postgres integration script exists, is executable and is gated on DATABASE_URL", () => {
  const script = path.join(__dirname, "..", "test", "postgres", "self-builder-core-postgres.integration.sh");
  assert.ok(fs.existsSync(script), "a Postgres integration script must exist");
  const body = fs.readFileSync(script, "utf8");
  assert.match(body, /^#!\/usr\/bin\/env bash/);
  assert.match(body, /set -euo pipefail/);
  assert.match(body, /DATABASE_URL/, "the script must be gated on DATABASE_URL");
  // eslint-disable-next-line no-bitwise
  assert.ok((fs.statSync(script).mode & 0o111) !== 0, "the script must be executable");
});
