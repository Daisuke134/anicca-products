"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { replyMobileQuestion } = require("../lib/mobile-question.js");
const { createMemoryMobileStore } = require("../lib/mobile-store.js");
const { appendMobileMessage } = require("../lib/mobile-outbox.js");
const { makeComposioCalendar } = require("../lib/transport/calendar-composio.js");

test("reply consumes only the authenticated user's open question once", async () => {
  const store = createMemoryMobileStore({ users: [{ uid: "user-a", product_locale: "en" }, { uid: "user-b", product_locale: "en" }] });
  await store.createQuestion({ uid: "user-a" }, { id: "question:v1:one", type: "origin", prompt: "Where?" });
  let applied = 0;
  const deps = { store, applyAnswer: async (scope, question, answer) => { applied++; assert.equal(scope.uid, "user-a"); assert.equal(question.id, "question:v1:one"); assert.equal(answer, "Shibuya"); } };
  const result = await replyMobileQuestion({ uid: "user-a", productLocale: "en" }, "question:v1:one", "Shibuya", deps);
  assert.equal(result.status, "answered");
  assert.equal(applied, 1);
  await assert.rejects(() => replyMobileQuestion({ uid: "user-a", productLocale: "en" }, "question:v1:one", "Shibuya", deps), (error) => error.code === "question_stale");
  await assert.rejects(() => replyMobileQuestion({ uid: "user-b", productLocale: "en" }, "question:v1:one", "Shibuya", deps), (error) => error.code === "question_stale");
  assert.equal(applied, 1);
});

test("reply appends one durable user bubble with a stable message ID", async () => {
  const store = createMemoryMobileStore({ users: [{ uid: "user-a", product_locale: "en" }] });
  await store.createQuestion({ uid: "user-a" }, { id: "question:v1:destination", type: "destination", eventId: "event-1", prompt: "Where?" });
  const deps = { store, applyAnswer: async () => {} };

  const first = await replyMobileQuestion({ uid: "user-a", productLocale: "en" }, "question:v1:destination", "Tokyo Tower", deps);
  assert.equal(first.status, "answered");

  const rows = store._outbox.get("user-a") || [];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].key, "chat.user_reply");
  assert.equal(rows[0].type, "user");
  assert.match(rows[0].id, /^message:v1:reply-[0-9a-f]{40}$/u);
  assert.equal(rows[0].args.answer, "Tokyo Tower");
});

test("reply validates text and never acts as a general chat endpoint", async () => {
  const store = createMemoryMobileStore({ users: [{ uid: "user-a" }] });
  await assert.rejects(() => replyMobileQuestion({ uid: "user-a" }, null, "hello", { store }), (error) => error.code === "question_required");
  await assert.rejects(() => replyMobileQuestion({ uid: "user-a" }, "question:v1:none", "hello", { store }), (error) => error.code === "question_stale");
});

test("destination replies patch the stored Calendar event before re-analysis", async () => {
  const store = createMemoryMobileStore({ users: [{ uid: "user-a", gmail_account_id: "account-a", calendar_provider: "composio_gcal" }] });
  await store.createQuestion({ uid: "user-a" }, { id: "question:v1:destination", type: "destination", eventId: "event-1", prompt: "Where?" });
  const patches = [];
  const result = await replyMobileQuestion({ uid: "user-a" }, "question:v1:destination", "Tokyo Tower", {
    store,
    calendar: { async patchEvent(uid, input) { patches.push({ uid, input }); return { successful: true }; } },
  });
  assert.equal(result.status, "answered");
  assert.deepEqual(patches, [{ uid: "user-a", input: { calendar_id: "primary", event_id: "event-1", location: "Tokyo Tower" } }]);
});

test("destination replies use the persisted Composio owner with the exact account", async () => {
  const store = createMemoryMobileStore({ users: [{
    uid: "lm_stable", calendar_composio_user_id: "lm_provisional", gmail_account_id: "ca_exact", calendar_provider: "composio_gcal",
  }] });
  await store.createQuestion({ uid: "lm_stable" }, { id: "question:v1:destination-routing", type: "destination", eventId: "event-1", prompt: "Where?" });
  const calls = [];
  const calendar = makeComposioCalendar({
    apiKey: "composio-test-key",
    recordCall: async () => false,
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return { ok: true, async json() { return { successful: true }; } };
    },
  });
  const result = await replyMobileQuestion({ uid: "lm_stable" }, "question:v1:destination-routing", "Tokyo Tower", { store, calendar });
  assert.equal(result.status, "answered");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.user_id, "lm_provisional");
  assert.equal(calls[0].body.connected_account_id, "ca_exact");
  assert.notEqual(calls[0].body.user_id, "lm_stable");
});

test("question claim survives downstream failure and resumes apply/outbox before final answer", async () => {
  const calls = [];
  let applyAttempts = 0;
  let status = "open";
  const question = { id: "question-resume", type: "origin", prompt: "Where?", eventId: null, answer: null };
  const store = {
    async claimOpenQuestion(_scope, id, answer) {
      assert.equal(id, question.id);
      if (status === "answered") return null;
      if (status === "claimed" && question.answer !== answer) throw new Error("answer conflict");
      status = "claimed"; question.answer = answer; return { ...question, status };
    },
    async appendOutbox(_scope, row) {
      calls.push("outbox");
      return { ...row, sequence: 1, createdAt: "2026-08-09T00:00:00.000Z" };
    },
    async completeQuestionReply() { status = "answered"; calls.push("complete"); return { ...question, status }; },
  };
  const deps = {
    store,
    applyAnswer: async () => { applyAttempts++; calls.push("apply"); if (applyAttempts === 1) throw new (require("../lib/mobile-utils.js").MobileError)("question_apply_failed", "temporary", 502, true); },
    analyzeNextEvent: async (_scope, input) => { calls.push(input.analysisId); return { status: "route_ready" }; },
  };
  await assert.rejects(() => replyMobileQuestion({ uid: "user-a" }, { questionId: question.id, answer: "Shibuya" }, deps), (error) => error.code === "question_apply_failed");
  assert.equal(status, "claimed");
  const result = await replyMobileQuestion({ uid: "user-a" }, { questionId: question.id, answer: "Shibuya" }, deps);
  assert.equal(result.status, "answered");
  assert.equal(status, "answered");
  assert.deepEqual(calls, ["apply", "apply", "outbox", "question-reply:question-resume", "complete"]);
});

test("analysis retry keeps one reply bubble and later appends the Life Manager response", async () => {
  const store = createMemoryMobileStore({ users: [{ uid: "user-a", product_locale: "en" }] });
  await store.createQuestion({ uid: "user-a" }, { id: "question:v1:resume", type: "origin", prompt: "Where?" });
  let analysisAttempts = 0;
  const deps = {
    store,
    applyAnswer: async () => {},
    analyzeNextEvent: async () => {
      analysisAttempts += 1;
      if (analysisAttempts === 1) throw new (require("../lib/mobile-utils.js").MobileError)("analysis_failed", "temporary", 503, true);
      await appendMobileMessage({ uid: "user-a", productLocale: "en" }, {
        id: "message:v1:route-response",
        type: "route",
        key: "chat.route_ready",
        args: {},
        userContent: { eventTitle: "Demo event", eventLocation: "Tokyo Tower" },
        route: {
          timezone: "Asia/Tokyo",
          origin: "Roppongi",
          destination: "Tokyo Tower",
          leaveAt: "2026-08-09T01:00:00.000Z",
          arriveAt: "2026-08-09T01:30:00.000Z",
          bufferSeconds: 300,
          durationSeconds: 1800,
          provider: "transit",
          providerAttribution: "Transit",
        },
      }, { store });
      return { status: "route_ready" };
    },
  };

  await assert.rejects(
    () => replyMobileQuestion({ uid: "user-a", productLocale: "en" }, "question:v1:resume", "Roppongi", deps),
    (error) => error.code === "analysis_failed"
  );
  const afterFailure = store._outbox.get("user-a") || [];
  assert.equal(afterFailure.length, 1);
  assert.equal(afterFailure[0].key, "chat.user_reply");

  const result = await replyMobileQuestion({ uid: "user-a", productLocale: "en" }, "question:v1:resume", "Roppongi", deps);
  assert.equal(result.status, "answered");
  const afterRetry = store._outbox.get("user-a") || [];
  assert.equal(afterRetry.length, 2, "retry must keep one bubble and append the later Life Manager response");
  assert.equal(afterRetry[0].id, afterFailure[0].id);
  assert.equal(afterRetry[1].key, "chat.route_ready");
});
