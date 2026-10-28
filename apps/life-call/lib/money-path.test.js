// lib/money-path.test.js — C5/C6. The money-path monitor keeps the legacy Stripe-link assertion
// covered while the current /lm route hands off to the /maritime page and continues payment server-side. It
// gates rollback with debounce (>=2 consecutive FAIL), a flap guard (never roll back into a target
// that also fails), and Telegram dedup (one message per incident). Pure logic; network fetch lives in the caller.
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  extractStripeLink,
  assertMoneyPath,
  assertWebAppHandoff,
  RollbackController,
} = require("./money-path.js");

const GOOD = "https://buy.stripe.com/9B600j6C204S7LadIG2880V"; // LM $20/mo (registry known-good)
const BAD = "https://buy.stripe.com/00w9ATf8yaJwghG6ge2880v"; // ¥700k AI供養 (the real 2026-07-03 bug)

test("extractStripeLink: pulls buy.stripe.com/<slug> out of a chunk string", () => {
  const chunk = `})}let m="/x",x="${GOOD}",p=/re/;`;
  assert.equal(extractStripeLink(chunk), GOOD);
  assert.equal(extractStripeLink("no link here"), null);
});

test("assertMoneyPath: PASS when bundle link == registry, FAIL on the ¥700k bug", () => {
  const registry = { stripe_lm_url: GOOD };
  assert.equal(assertMoneyPath({ chunk: `x="${GOOD}"` }, registry).ok, true);
  const bad = assertMoneyPath({ chunk: `x="${BAD}"` }, registry);
  assert.equal(bad.ok, false);
  assert.match(bad.reason, /stripe/i);
});

test("assertWebAppHandoff accepts the canonical /maritime handoff", () => {
  assert.equal(typeof assertWebAppHandoff, "function");
  assert.deepEqual(assertWebAppHandoff({ chunk: 'href="/maritime?source=landing&lang=en"' }), { ok: true, reason: "ok" });
  assert.deepEqual(assertWebAppHandoff({ chunk: 'href="https://aniccaai.com/maritime"' }), { ok: true, reason: "ok" });
  assert.deepEqual(assertWebAppHandoff({ chunk: '"/maritime"' }), { ok: true, reason: "ok" });
});

test("assertWebAppHandoff fails when the /maritime handoff is absent", () => {
  assert.deepEqual(assertWebAppHandoff({ chunk: 'href="https://example.com/lm"' }), {
    ok: false, reason: "web app handoff link missing in /lm chunk",
  });
});

test("assertWebAppHandoff rejects Telegram and direct Stripe links", () => {
  assert.deepEqual(assertWebAppHandoff({ chunk: 'href="/maritime" https://t.me/LifeManagerBotbot?start=lp' }), {
    ok: false, reason: "telegram link found in /lm chunk",
  });
  assert.deepEqual(assertWebAppHandoff({ chunk: 'href="/maritime" https://checkout.stripe.com/c/pay' }), {
    ok: false, reason: "stripe link found in /lm chunk",
  });
});

test("assertWebAppHandoff fails without a /maritime link even when other Life Manager URLs are present", () => {
  assert.deepEqual(assertWebAppHandoff({ chunk: 'https://life-call-production.up.railway.app/auth/google' }), {
    ok: false, reason: "web app handoff link missing in /lm chunk",
  });
  assert.deepEqual(assertWebAppHandoff({ chunk: 'https://life-call-production.up.railway.app.evil/lm' }), {
    ok: false, reason: "web app handoff link missing in /lm chunk",
  });
});

test("RollbackController: debounce — needs >=2 consecutive FAIL before rollback", () => {
  const rc = new RollbackController();
  assert.equal(rc.onResult(false).rollback, false); // 1st fail: wait
  assert.equal(rc.onResult(false).rollback, true); // 2nd consecutive fail: roll back
});

test("RollbackController: a PASS resets the debounce counter", () => {
  const rc = new RollbackController();
  rc.onResult(false);
  rc.onResult(true); // recovered
  assert.equal(rc.onResult(false).rollback, false); // single fail again → wait
});

test("RollbackController: flap guard — do not roll back into a target that also fails", () => {
  const rc = new RollbackController();
  rc.onResult(false);
  const d = rc.onResult(false, { lastGoodPasses: false });
  assert.equal(d.rollback, false);
  assert.equal(d.escalate, true); // escalate instead of flapping into another bad build
});

test("RollbackController: Telegram dedup — ONE alert per incident, re-armed after recovery", () => {
  const rc = new RollbackController();
  rc.onResult(false);
  const a = rc.onResult(false, { lastGoodPasses: false }); // incident opens
  const b = rc.onResult(false, { lastGoodPasses: false }); // still failing
  assert.equal(a.notify, true);
  assert.equal(b.notify, false); // deduped
  rc.onResult(true); // recovery re-arms
  rc.onResult(false);
  assert.equal(rc.onResult(false, { lastGoodPasses: false }).notify, true);
});

test("assertMoneyPath: FAIL when a rogue 2nd stripe link is present (¥700k class) — FIND-003", () => {
  const registry = { stripe_lm_url: GOOD };
  const two = `a="${GOOD}";b="${BAD}";`; // good FIRST, rogue second
  const r = assertMoneyPath({ chunk: two }, registry);
  assert.equal(r.ok, false);
  assert.match(r.reason, /ambiguous|mismatch/);
});

test("RollbackController: rollback fires ONCE per incident, not every cycle — FIND-004", () => {
  const rc = new RollbackController();
  rc.onResult(false);
  assert.equal(rc.onResult(false).rollback, true); // 2nd fail → restore
  assert.equal(rc.onResult(false).rollback, false); // 3rd fail → do NOT restore again
  assert.equal(rc.onResult(false).rollback, false); // 4th fail → still no repeat
  rc.onResult(true); // recovery re-arms
  rc.onResult(false);
  assert.equal(rc.onResult(false).rollback, true); // new incident → restore once
});
