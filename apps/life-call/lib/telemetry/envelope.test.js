"use strict";

// RED-first contract test for LM-SB-02 (common trace/effect envelope).
// Spec: docs/loop-engineering/51-life-manager-builds-life-manager.md
//   §5.2 common signal envelope, §5.3 trace hierarchy, §5.4 multi-tenant collection policy,
//   §16 "Raw PII enters signal -> redaction gate reject".

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  createEnvelope,
  validateEnvelope,
  tenantRef,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  STATUSES,
  GRAPH_VERSION,
  SERVICE_TENANT_REF,
  correlationRef,
  safeTenantRef,
} = require("./envelope.js");
const { createEmitter, jsonlSink, emitSignal } = require("./emitter.js");

const HASH = `sha256:${"a".repeat(64)}`;
// A hash whose leading run is 10 consecutive digits: proves the phone detector does not
// false-positive on hex references (spec §5.4 tenant identity = stable pseudonymous hash).
const DIGITY_HASH = `sha256:1234567890${"a".repeat(54)}`;

function base(over = {}) {
  return {
    signal_id: "sig_0001",
    source: "life_manager.scheduler",
    observed_at: "2026-07-30T00:00:00.000Z",
    trace_id: "tr_0001",
    run_id: "run_0001",
    tenant_ref: HASH,
    graph_version: "lm.v1",
    node: "wake_scheduler",
    tool: "telnyx.place_call",
    status: "ok",
    failure_class: null,
    latency_ms: 1234,
    effect_id: "receipt://telnyx/ccid-1",
    privacy: { raw_retained: false, redaction_version: "v1" },
    ...over,
  };
}

function tmpFile(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lm-telemetry-")), name);
}

// ---------------------------------------------------------------------------
// schema shape (spec §5.2)
// ---------------------------------------------------------------------------

test("spec §5.2: required fields are exactly the common envelope contract", () => {
  assert.deepEqual([...REQUIRED_FIELDS], [
    "signal_id",
    "source",
    "observed_at",
    "trace_id",
    "run_id",
    "tenant_ref",
    "graph_version",
    "node",
    "tool",
    "status",
    "failure_class",
    "latency_ms",
    "effect_id",
    "privacy",
  ]);
  assert.deepEqual([...OPTIONAL_FIELDS], ["code_version", "severity", "payload_ref"]);
  assert.deepEqual([...STATUSES], ["ok", "failure", "timeout", "denied", "skipped"]);
});

test("a fully specified envelope validates", () => {
  const result = validateEnvelope(base());
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(Object.isFrozen(result), true);
});

test("every required field is individually required", () => {
  for (const field of REQUIRED_FIELDS) {
    const broken = base();
    delete broken[field];
    const result = validateEnvelope(broken);
    assert.equal(result.valid, false, `${field} must be required`);
    assert.ok(result.errors.includes(`missing_field:${field}`), `expected missing_field:${field}, got ${result.errors}`);
  }
});

test("the schema is closed: unknown fields are rejected so raw payloads cannot ride along", () => {
  const result = validateEnvelope(base({ telegram_message: "hello there" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("unknown_field:telegram_message"));
});

test("optional fields are accepted when well formed and rejected when malformed", () => {
  assert.equal(validateEnvelope(base({ code_version: "1.4.0", severity: 0.8, payload_ref: "artifact://redacted/c1" })).valid, true);
  assert.equal(validateEnvelope(base({ severity: 1.5 })).valid, false);
  assert.equal(validateEnvelope(base({ severity: "high" })).valid, false);
  assert.equal(validateEnvelope(base({ payload_ref: "/var/log/raw.txt" })).valid, false);
});

// ---------------------------------------------------------------------------
// tenant_ref: sha256 only, raw identifiers rejected (spec §5.4)
// ---------------------------------------------------------------------------

test("spec §5.4: raw tenant identifiers are rejected, only sha256 pseudonyms pass", () => {
  for (const raw of ["uid_abc123", "user-42", "keiodaisuke@gmail.com", "sha256:notahash", `sha256:${"A".repeat(64)}`, HASH.slice(0, 40)]) {
    const result = validateEnvelope(base({ tenant_ref: raw }));
    assert.equal(result.valid, false, `raw tenant ref must be rejected: ${raw}`);
    assert.ok(result.errors.includes("tenant_ref_not_hashed"), `expected tenant_ref_not_hashed for ${raw}, got ${result.errors}`);
  }
  assert.equal(validateEnvelope(base({ tenant_ref: HASH })).valid, true);
});

test("tenantRef produces a stable salted sha256 pseudonym and never echoes the raw id", () => {
  const a = tenantRef("uid_abc123", "salt-1");
  const b = tenantRef("uid_abc123", "salt-1");
  const c = tenantRef("uid_abc123", "salt-2");
  const d = tenantRef("uid_zzz999", "salt-1");
  assert.match(a, /^sha256:[0-9a-f]{64}$/);
  assert.equal(a, b, "same tenant + salt must be stable across runs");
  assert.notEqual(a, c, "a different salt must produce a different pseudonym");
  assert.notEqual(a, d);
  assert.equal(a.includes("uid_abc123"), false);
  assert.equal(validateEnvelope(base({ tenant_ref: a })).valid, true);
  assert.throws(() => tenantRef("", "salt-1"), /tenant/i);
  assert.throws(() => tenantRef(null, "salt-1"), /tenant/i);
});

test("a hex reference containing a long digit run is not mistaken for a phone number", () => {
  const result = validateEnvelope(base({ tenant_ref: DIGITY_HASH }));
  assert.deepEqual(result, { valid: true, errors: [] });
});

// ---------------------------------------------------------------------------
// PII gate (spec §16 "Raw PII enters signal -> redaction gate reject")
// ---------------------------------------------------------------------------

test("spec §16: an email address anywhere in the envelope is rejected", () => {
  for (const field of ["failure_class", "node", "tool", "source", "effect_id"]) {
    const result = validateEnvelope(base({ status: "failure", [field]: "keiodaisuke@gmail.com" }));
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes("pii_detected:email"), `expected email PII rejection in ${field}, got ${result.errors}`);
  }
  const nested = validateEnvelope(base({ privacy: { raw_retained: false, redaction_version: "v1 dais@example.org" } }));
  assert.equal(nested.valid, false);
  assert.ok(nested.errors.includes("pii_detected:email"));
});

test("spec §16: a phone number anywhere in the envelope is rejected", () => {
  for (const value of ["+81 90 1234 5678", "090-1234-5678", "(03) 1234-5678", "+819012345678", "09012345678"]) {
    const result = validateEnvelope(base({ status: "failure", failure_class: value }));
    assert.equal(result.valid, false, `phone must be rejected: ${value}`);
    assert.ok(result.errors.includes("pii_detected:phone"), `expected phone PII rejection for ${value}, got ${result.errors}`);
  }
});

test("spec §5.4: retaining raw payload is forbidden", () => {
  const result = validateEnvelope(base({ privacy: { raw_retained: true, redaction_version: "v1" } }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("raw_retained_forbidden"));

  const closed = validateEnvelope(base({ privacy: { raw_retained: false, redaction_version: "v1", raw_text: "hi" } }));
  assert.equal(closed.valid, false);
  assert.ok(closed.errors.includes("unknown_field:privacy.raw_text"));
});

// ---------------------------------------------------------------------------
// field level validation
// ---------------------------------------------------------------------------

test("status must be a member of the closed enum", () => {
  for (const status of STATUSES) {
    const failureClass = status === "ok" || status === "skipped" ? null : "provider_low_balance";
    assert.equal(validateEnvelope(base({ status, failure_class: failureClass })).valid, true, status);
  }
  const bad = validateEnvelope(base({ status: "PASS" }));
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.includes("invalid:status"));
});

test("failure_class is required for a failing status and forbidden for a successful one", () => {
  const missing = validateEnvelope(base({ status: "failure", failure_class: null }));
  assert.equal(missing.valid, false);
  assert.ok(missing.errors.includes("failure_class_required"));

  const unexpected = validateEnvelope(base({ status: "ok", failure_class: "provider_low_balance" }));
  assert.equal(unexpected.valid, false);
  assert.ok(unexpected.errors.includes("failure_class_unexpected"));
});

test("latency_ms must be a finite non-negative number", () => {
  for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY, "1234", null]) {
    const result = validateEnvelope(base({ latency_ms: value }));
    assert.equal(result.valid, false, `latency ${value} must be rejected`);
    assert.ok(result.errors.includes("invalid:latency_ms"));
  }
  assert.equal(validateEnvelope(base({ latency_ms: 0 })).valid, true);
});

test("observed_at must be an ISO-8601 UTC instant", () => {
  assert.equal(validateEnvelope(base({ observed_at: "2026-07-30" })).valid, false);
  assert.equal(validateEnvelope(base({ observed_at: 1785000000000 })).valid, false);
  assert.equal(validateEnvelope(base({ observed_at: "2026-07-30T00:00:00.000Z" })).valid, true);
});

test("effect_id must be null or a receipt/artifact reference", () => {
  assert.equal(validateEnvelope(base({ effect_id: null })).valid, true);
  assert.equal(validateEnvelope(base({ effect_id: "artifact://redacted/x" })).valid, true);
  assert.equal(validateEnvelope(base({ effect_id: "ccid-1" })).valid, false);
});

test("non-object input is rejected without throwing", () => {
  for (const bad of [undefined, null, "envelope", 42, []]) {
    const result = validateEnvelope(bad);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
});

test("validateEnvelope is pure: it never mutates the candidate and errors are sorted", () => {
  const input = base({ status: "failure", failure_class: null, latency_ms: -5, telegram_message: "raw" });
  const snapshot = JSON.stringify(input);
  const first = validateEnvelope(input);
  const second = validateEnvelope(input);
  assert.equal(JSON.stringify(input), snapshot);
  assert.deepEqual(first, second);
  assert.deepEqual(first.errors, [...first.errors].sort());
  assert.equal(Object.isFrozen(first.errors), true);
});

// ---------------------------------------------------------------------------
// createEnvelope
// ---------------------------------------------------------------------------

test("createEnvelope fills spec defaults, is frozen, valid and does not mutate its input", () => {
  const fields = {
    source: "life_manager.scheduler",
    trace_id: "tr_9",
    run_id: "run_9",
    tenant_ref: HASH,
    graph_version: "lm.v1",
    node: "wake_scheduler",
    tool: "telnyx.place_call",
    status: "ok",
    latency_ms: 12,
  };
  const snapshot = JSON.stringify(fields);
  const envelope = createEnvelope(fields, {
    now: () => 1785000000000,
    randomId: () => "deadbeef",
  });

  assert.equal(JSON.stringify(fields), snapshot, "createEnvelope must not mutate its input");
  assert.equal(Object.isFrozen(envelope), true);
  assert.equal(envelope.signal_id, "sig_deadbeef");
  assert.equal(envelope.observed_at, new Date(1785000000000).toISOString());
  assert.equal(envelope.failure_class, null);
  assert.equal(envelope.effect_id, null);
  assert.deepEqual(envelope.privacy, { raw_retained: false, redaction_version: "v1" });
  assert.deepEqual(validateEnvelope(envelope), { valid: true, errors: [] });
});

test("createEnvelope is deterministic under injected deps and never invents a tenant", () => {
  const deps = { now: () => 1785000000000, randomId: () => "cafe" };
  const fields = { source: "life_manager.travel", trace_id: "tr_1", run_id: "run_1", tenant_ref: HASH, graph_version: "lm.v1", node: "travel_fill", tool: "google.directions", status: "ok", latency_ms: 3 };
  assert.deepEqual(createEnvelope(fields, deps), createEnvelope(fields, deps));

  const noTenant = createEnvelope({ ...fields, tenant_ref: undefined }, deps);
  assert.equal(validateEnvelope(noTenant).valid, false, "a missing tenant must fail validation, never be faked");
});

// ---------------------------------------------------------------------------
// emitter: append-only JSONL, fail-open, redaction gate
// ---------------------------------------------------------------------------

test("emitter appends one newline-terminated JSON object per signal", () => {
  const file = tmpFile("signals.jsonl");
  const emitter = createEmitter({ sink: jsonlSink(file) });

  const first = emitter.emit(base({ signal_id: "sig_1" }));
  const second = emitter.emit(base({ signal_id: "sig_2", status: "failure", failure_class: "provider_low_balance", effect_id: null }));

  assert.equal(first.emitted, true);
  assert.equal(second.emitted, true);
  const raw = fs.readFileSync(file, "utf8");
  assert.equal(raw.endsWith("\n"), true);
  const lines = raw.trim().split("\n");
  assert.equal(lines.length, 2);
  assert.deepEqual(lines.map((l) => JSON.parse(l).signal_id), ["sig_1", "sig_2"]);
  assert.equal(JSON.parse(lines[1]).failure_class, "provider_low_balance");
});

test("emitter is a redaction gate: an invalid or PII-bearing envelope is never written", () => {
  const file = tmpFile("signals.jsonl");
  const emitter = createEmitter({ sink: jsonlSink(file) });

  const pii = emitter.emit(base({ status: "failure", failure_class: "dais@example.org" }));
  assert.equal(pii.emitted, false);
  assert.ok(pii.errors.includes("pii_detected:email"));

  const invalid = emitter.emit({ nope: true });
  assert.equal(invalid.emitted, false);
  assert.ok(invalid.errors.length > 0);

  assert.equal(fs.existsSync(file) && fs.readFileSync(file, "utf8") !== "", false, "nothing may be written");
});

test("emitter is fail-open: a throwing sink never propagates into product code", () => {
  const seen = [];
  const emitter = createEmitter({
    sink: () => { throw new Error("disk on fire"); },
    onError: (error) => seen.push(String(error && error.message)),
  });

  let result;
  assert.doesNotThrow(() => { result = emitter.emit(base()); });
  assert.equal(result.emitted, false);
  assert.ok(result.errors.includes("sink_failed"));
  assert.deepEqual(seen, ["disk on fire"]);
});

test("emitter is fail-open even when onError itself throws", () => {
  const emitter = createEmitter({
    sink: () => { throw new Error("sink down"); },
    onError: () => { throw new Error("logger down"); },
  });
  let result;
  assert.doesNotThrow(() => { result = emitter.emit(base()); });
  assert.equal(result.emitted, false);
});

test("emitter is fail-open when the envelope cannot be serialized", () => {
  const file = tmpFile("signals.jsonl");
  const emitter = createEmitter({ sink: jsonlSink(file) });
  const cyclic = base();
  cyclic.privacy = { raw_retained: false, redaction_version: "v1" };
  Object.defineProperty(cyclic, "latency_ms", { get() { throw new Error("boom"); }, enumerable: true });
  let result;
  assert.doesNotThrow(() => { result = emitter.emit(cyclic); });
  assert.equal(result.emitted, false);
});

test("jsonlSink creates missing parent directories and appends across emitter instances", () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lm-telemetry-")), "nested", "deep", "signals.jsonl");
  createEmitter({ sink: jsonlSink(file) }).emit(base({ signal_id: "sig_a" }));
  createEmitter({ sink: jsonlSink(file) }).emit(base({ signal_id: "sig_b" }));
  const lines = fs.readFileSync(file, "utf8").trim().split("\n");
  assert.deepEqual(lines.map((l) => JSON.parse(l).signal_id), ["sig_a", "sig_b"]);
});

test("emitSignal is disabled unless a sink is configured, and never throws when disabled", () => {
  const env = {};
  let result;
  assert.doesNotThrow(() => { result = emitSignal(base(), { env }); });
  assert.equal(result.emitted, false);
  assert.ok(result.errors.includes("telemetry_disabled"));
});

test("emitSignal writes to the configured JSONL path and swallows every failure", () => {
  const file = tmpFile("prod.jsonl");
  const ok = emitSignal(base({ signal_id: "sig_env" }), { env: { LM_TELEMETRY_JSONL: file } });
  assert.equal(ok.emitted, true);
  assert.equal(JSON.parse(fs.readFileSync(file, "utf8").trim()).signal_id, "sig_env");

  let bad;
  assert.doesNotThrow(() => {
    bad = emitSignal(base(), { env: { LM_TELEMETRY_JSONL: "/proc/definitely/not/writable/x.jsonl" } });
  });
  assert.equal(bad.emitted, false);
});

test("emitSignal tolerates a garbage envelope and a garbage env without throwing", () => {
  for (const args of [[undefined, undefined], [null, { env: null }], [{}, {}], ["x", { env: { LM_TELEMETRY_JSONL: "" } }]]) {
    let result;
    assert.doesNotThrow(() => { result = emitSignal(args[0], args[1]); });
    assert.equal(result.emitted, false);
  }
});

// ---------------------------------------------------------------------------
// production wiring: the five loops emit through this envelope (spec §5.1)
// ---------------------------------------------------------------------------

test("spec §5.1: all five Life Manager loops are wired to the telemetry emitter", () => {
  const wiring = [
    ["../../scheduler.js", "life_manager.scheduler"],
    ["../daily-preflight.js", "life_manager.daily_preflight"],
    ["../ask.js", "life_manager.ask"],
    ["../travel.js", "life_manager.travel"],
    ["../feature-discovery.js", "life_manager.feature_discovery"],
  ];
  for (const [relative, source] of wiring) {
    const src = fs.readFileSync(path.join(__dirname, relative), "utf8");
    // assert.ok (not assert.match) so a failure prints a one-line message instead of dumping
    // the whole production file into the test output.
    assert.ok(
      /require\("\.{1,2}\/(?:lib\/)?telemetry\/emitter\.js"\)/.test(src),
      `${relative} must import the telemetry emitter`,
    );
    assert.ok(src.includes(source), `${relative} must emit source ${source}`);
    const emitCalls = (src.match(/emitSignal\(/g) || []).length;
    assert.equal(emitCalls, 1, `${relative} must contain exactly one emitSignal call, found ${emitCalls}`);
  }
});

test("GRAPH_VERSION and correlationRef produce envelope-valid identifiers with no raw ids", () => {
  assert.equal(validateEnvelope(base({ graph_version: GRAPH_VERSION })).valid, true);

  const a = correlationRef("tr", "uid_abc123", "2026-07-30T00:00:00.000Z");
  const b = correlationRef("tr", "uid_abc123", "2026-07-30T00:00:00.000Z");
  const c = correlationRef("tr", "uid_zzz999", "2026-07-30T00:00:00.000Z");
  assert.match(a, /^tr_[0-9a-f]{32}$/);
  assert.equal(a, b, "correlation refs must be stable");
  assert.notEqual(a, c);
  assert.equal(a.includes("uid_abc123"), false, "a raw tenant id must never survive into a trace id");
  assert.equal(validateEnvelope(base({ trace_id: a, run_id: correlationRef("run", "k", 5) })).valid, true);

  // tolerant of junk so a call site can never throw on telemetry construction
  assert.match(correlationRef(), /^ref_[0-9a-f]{32}$/);
  assert.match(correlationRef("RUN", null, undefined), /^run_[0-9a-f]{32}$/);
});

test("safeTenantRef never throws at a call site and drops rather than fakes a tenant", () => {
  assert.equal(safeTenantRef("uid_abc123"), tenantRef("uid_abc123"));
  for (const bad of [undefined, null, "", "   ", 42, {}]) {
    let value;
    assert.doesNotThrow(() => { value = safeTenantRef(bad); });
    assert.equal(value, null, `safeTenantRef(${JSON.stringify(bad)}) must be null, never invented`);
    assert.equal(validateEnvelope(base({ tenant_ref: value })).valid, false, "a null tenant must fail the gate");
  }
});

test("SERVICE_TENANT_REF is a valid pseudonym for fleet-level (non-tenant) signals", () => {
  assert.match(SERVICE_TENANT_REF, /^sha256:[0-9a-f]{64}$/);
  assert.equal(validateEnvelope(base({ tenant_ref: SERVICE_TENANT_REF })).valid, true);
});
