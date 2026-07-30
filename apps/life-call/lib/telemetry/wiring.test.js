"use strict";

// LM-SB-02 runtime proof. envelope.test.js checks the SOURCE of the five loops mentions the
// emitter; this file actually RUNS each loop with a real JSONL sink and asserts the bytes on
// disk are schema-valid §5.2 envelopes. Without this, a call site could emit an envelope the
// redaction gate silently drops and every source-level test would still be green.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { validateEnvelope, JSONL_PATH_ENV } = (() => ({
  validateEnvelope: require("./envelope.js").validateEnvelope,
  JSONL_PATH_ENV: require("./emitter.js").JSONL_PATH_ENV,
}))();

const { runPreflight } = require("../daily-preflight.js");
const { fillTravel } = require("../travel.js");
const { handleInboundReply } = require("../ask.js");
const { runDiscoveryForUser } = require("../feature-discovery.js");
const { wakeUserOnce } = require("../../scheduler.js");

/** Run `fn` with telemetry pointed at a fresh file, then return the parsed signals. */
async function captureSignals(fn) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "lm-wiring-")), "signals.jsonl");
  const previous = process.env[JSONL_PATH_ENV];
  process.env[JSONL_PATH_ENV] = file;
  try {
    await fn();
  } finally {
    if (previous === undefined) delete process.env[JSONL_PATH_ENV];
    else process.env[JSONL_PATH_ENV] = previous;
  }
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

function assertValidSignals(signals, expected) {
  assert.ok(signals.length > 0, `${expected.source} emitted nothing — the call site was dropped by the gate`);
  for (const signal of signals) {
    const verdict = validateEnvelope(signal);
    assert.deepEqual(verdict.errors, [], `invalid envelope from ${expected.source}: ${verdict.errors.join(",")}`);
  }
  const signal = signals[signals.length - 1];
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(signal[key], value, `${expected.source}.${key}`);
  }
  assert.ok(Number.isFinite(signal.latency_ms) && signal.latency_ms >= 0);
  assert.match(signal.tenant_ref, /^sha256:[0-9a-f]{64}$/);
  assert.equal(signal.privacy.raw_retained, false);
}

// ---------------------------------------------------------------------------

test("wired loop 1/5 — daily preflight emits a valid envelope for pass and for fail", async () => {
  const passing = await captureSignals(() => runPreflight({
    checks: [{ name: "health", run: async () => ({ ok: true, evidence: { status: 200 } }) }],
    now: Date.now,
  }));
  assertValidSignals(passing, {
    source: "life_manager.daily_preflight",
    node: "daily_preflight",
    tool: "dependency_checks",
    status: "ok",
    failure_class: null,
  });

  const failing = await captureSignals(() => runPreflight({
    checks: [{ name: "health", run: async () => ({ ok: false, evidence: { reason: "down" } }) }],
    now: Date.now,
  }));
  assertValidSignals(failing, {
    source: "life_manager.daily_preflight",
    status: "failure",
    failure_class: "dependency_failed",
  });
});

test("wired loop 2/5 — travel fill emits ok when nothing failed", async () => {
  const signals = await captureSignals(() => fillTravel("uid_travel_test", {
    home: "Home",
    nowMs: Date.now(),
    calendar: { listEventsRaw: async () => [] },
  }));
  assertValidSignals(signals, {
    source: "life_manager.travel",
    node: "travel_fill",
    tool: "gcal.travel_block",
    status: "ok",
    failure_class: null,
  });
});

test("I9: travel fill DERIVES failure from an unroutable event, not a hardcoded ok", async () => {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const rawEvent = {
    id: "ev-route-fail",
    summary: "Client meeting",
    location: "1-1-1 Marunouchi, Chiyoda City, Tokyo",
    start: { dateTime: iso(now + 3 * 3600000) },
    end: { dateTime: iso(now + 4 * 3600000) },
  };
  const signals = await captureSignals(() => fillTravel("uid_travel_test", {
    home: "2-2-2 Umeda, Kita Ward, Osaka",
    nowMs: now,
    calendar: { listEventsRaw: async () => [rawEvent] },
    // the route provider is down: every directions call fails
    _directionsMinutes: async () => null,
    // no supa creds -> claimTravel returns false anyway, but the route dies first
  }));
  assertValidSignals(signals, {
    source: "life_manager.travel",
    node: "travel_fill",
    tool: "gcal.travel_block",
    status: "failure",
    failure_class: "route_unresolved",
  });
});

test("I9: travel fill reports a failed block create with its own class", async () => {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const rawEvent = {
    id: "ev-create-fail",
    summary: "Client meeting",
    location: "1-1-1 Marunouchi, Chiyoda City, Tokyo",
    start: { dateTime: iso(now + 3 * 3600000) },
    end: { dateTime: iso(now + 4 * 3600000) },
  };
  const calendar = {
    listEventsRaw: async () => [rawEvent],
    // createTravelBlock path: the write API reports failure (claimTravel with no supa
    // creds returns true, so the create IS attempted and fails)
    createEvent: async () => ({ successful: false }),
  };
  const signals = await captureSignals(() => fillTravel("uid_travel_test", {
    home: "2-2-2 Umeda, Kita Ward, Osaka",
    nowMs: now,
    calendar,
    _directionsMinutes: async () => 25,
  }));
  assert.ok(signals.length > 0, "a signal must be emitted");
  const last = signals[signals.length - 1];
  assert.equal(last.status, "failure", `expected failure, got ${last.status} (${last.failure_class})`);
  assert.ok(["travel_block_create_failed", "travel_block_not_inserted"].includes(last.failure_class),
    `got ${last.failure_class}`);
});

test("wired loop 3/5 — ask inbound reply emits valid envelopes for success and failure", async () => {
  const success = await captureSignals(() => handleInboundReply("tok-1", "The cafe in Shibuya", {
    supaUrl: "https://example.test",
    supaKey: "synthetic-key",
    consume: async () => ({ uid: "uid_ask_test", event_id: "ev-1" }),
    listEvents: async () => [{ id: "ev-1", summary: "Coffee", location: "" }],
    needsLocation: () => true,
    match: async () => ({ location: "Shibuya" }),
    patch: async () => true,
    remember: async () => true,
  }));
  assertValidSignals(success, {
    source: "life_manager.ask",
    node: "ask_inbound_reply",
    tool: "gcal.patch_event",
    status: "ok",
    failure_class: null,
    effect_id: "receipt://gcal/ev-1",
  });

  const spent = await captureSignals(() => handleInboundReply("tok-2", "anything", {
    supaUrl: "https://example.test",
    supaKey: "synthetic-key",
    consume: async () => null,
  }));
  assertValidSignals(spent, {
    source: "life_manager.ask",
    status: "failure",
    failure_class: "reply_token_unknown_or_spent",
    effect_id: null,
  });
});

test("wired loop 4/5 — feature discovery emits valid envelopes for sent and telegram failure", async () => {
  const user = {
    uid: "uid_discovery_test",
    telegram_chat_id: "chat-1",
    notifications_enabled: true,
    last_discovery_at: null,
    last_discovery_gate: null,
    payout_destination: null,
  };
  const sent = await captureSignals(() => runDiscoveryForUser(user, Date.now(), {
    getLiveLocation: async () => null,
    sendMessage: async () => ({ ok: true }),
    saveDiscovery: async () => true,
  }));
  assertValidSignals(sent, {
    source: "life_manager.feature_discovery",
    node: "feature_discovery",
    tool: "telegram.send_message",
    status: "ok",
    failure_class: null,
  });

  const failed = await captureSignals(() => runDiscoveryForUser(user, Date.now(), {
    getLiveLocation: async () => null,
    sendMessage: async () => ({ ok: false }),
    saveDiscovery: async () => true,
  }));
  assertValidSignals(failed, {
    source: "life_manager.feature_discovery",
    status: "failure",
    failure_class: "telegram_send_failed",
  });
});

test("wired loop 5/5 — wake scheduler emits valid envelopes for dial ok and low balance", async () => {
  const now = Date.now();
  const event = {
    id: "ev-wake",
    summary: "Standup",
    location: "Office",
    startIso: new Date(now + 10 * 60000).toISOString(),
    startMs: now + 10 * 60000,
    endMs: now + 40 * 60000,
  };
  const user = {
    uid: "uid_wake_test",
    name: "T",
    phone: "+15550000000",
    home_address: "Home",
    wake_policy: "all-events",
    call_enabled: true,
    notifications_enabled: false,
    daily_automation_enabled: true,
  };
  const baseDeps = {
    recordDailyPoll: async () => true,
    fetchUpcomingEvents: async () => [event],
    directionsMinutes: async () => null,
    claimWake: async () => true,
    releaseWake: async () => true,
    alertLowBalance: async () => true,
  };

  const dialed = await captureSignals(() => wakeUserOnce(user, now, {
    ...baseDeps,
    placeCall: async () => ({ ok: true, ccid: "ccid-abc" }),
  }));
  assertValidSignals(dialed, {
    source: "life_manager.scheduler",
    node: "wake_scheduler",
    tool: "telnyx.place_call",
    status: "ok",
    failure_class: null,
    effect_id: "receipt://telnyx/ccid-abc",
  });

  // The raw provider message contains a phone number; only the CLASS may be emitted.
  const lowBalance = await captureSignals(() => wakeUserOnce(user, now, {
    ...baseDeps,
    placeCall: async () => ({ ok: false, error: "Telnyx balance too low to call +81 90 1234 5678" }),
  }));
  assertValidSignals(lowBalance, {
    source: "life_manager.scheduler",
    status: "failure",
    failure_class: "provider_low_balance",
    effect_id: null,
  });
  const serialized = JSON.stringify(lowBalance);
  assert.equal(serialized.includes("1234 5678"), false, "no raw provider text may reach telemetry");
  assert.equal(serialized.includes("uid_wake_test"), false, "no raw uid may reach telemetry");
});

test("telemetry stays inert when LM_TELEMETRY_JSONL is unset (no stray artifacts)", async () => {
  const previous = process.env[JSONL_PATH_ENV];
  delete process.env[JSONL_PATH_ENV];
  try {
    const report = await runPreflight({
      checks: [{ name: "health", run: async () => ({ ok: true, evidence: { status: 200 } }) }],
      now: Date.now,
    });
    assert.equal(report.overallStatus, "pass", "the loop still returns its normal report");
  } finally {
    if (previous !== undefined) process.env[JSONL_PATH_ENV] = previous;
  }
});
