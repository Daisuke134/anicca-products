# Review package: d22da12c1..47c98a0b7

## Commits
47c98a0b7 docs(life-manager): record final provider cost guard fixes
e4b9b1cdd fix(life-manager): dual-write Telnyx summary dimensions
85e6a1de6 fix(life-manager): settle exact Telnyx dial reservations
a30e1d3ea fix(life-manager): make provider retries idempotent
5a5dd201c fix(life-manager): atomically cap provider reservations
8baf3c602 fix(life-manager): restrict provider budget RPCs

## Files changed
 .../progress.md                                    |  16 +++
 apps/life-manager/lib/dial.js                      |   3 +-
 apps/life-manager/lib/dial.test.js                 |   5 +
 apps/life-manager/lib/ledger.js                    |   9 +-
 apps/life-manager/lib/ledger.test.js               |  46 ++++++++
 apps/life-manager/lib/provider-budget.js           |  14 ++-
 apps/life-manager/lib/provider-budget.test.js      |  43 +++++++
 apps/life-manager/lib/provider-cost-adapters.js    |   4 +
 .../lib/provider-cost-adapters.test.js             |  40 ++++++-
 apps/life-manager/lib/provider-cost-imports.js     |   5 +-
 .../life-manager/lib/provider-cost-imports.test.js |  21 ++++
 apps/life-manager/lib/telnyx-webhook.js            |  28 ++++-
 apps/life-manager/lib/telnyx-webhook.test.js       |  11 ++
 apps/life-manager/lib/travel-routes.test.js        |   2 +-
 apps/life-manager/lib/travel.js                    |  40 +++++--
 .../migrations/2026-08-08-lm-provider-cost.sql     | 124 ++++++++++++++++++---
 apps/life-manager/scheduler.js                     |   8 +-
 apps/life-manager/server.js                        |  34 ++++--
 .../test/provider-cost-contract.test.js            |  37 ++++++
 .../test/testcall-amd-hangup-http-contract.test.js |   9 +-
 20 files changed, 447 insertions(+), 52 deletions(-)

## Diff
diff --git a/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
index fe83cdf2a..f78989a07 100644
--- a/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
+++ b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
@@ -23,20 +23,25 @@
 | 4. Truthful cost event | GREEN | 5 contract failures (missing API) | 12/12 ledger contract | `062663d73` |
 | 5. Provider instrumentation | GREEN | adapter module/import module missing | 77/77 provider + focused regression | `0c6616b86` |
 | 6. Budget policy | GREEN | missing-module | 12/12 budget/gate + 90/90 full focused | `a7604f2a6` |
 | 7. Owner report/deploy/measure | code-only pending | — | — | — |
 | Review fix 1. Durable route writer | GREEN | 2 route contract failures | 37/37 route/transit | `d3406be56` |
 | Review fix 2. Status/classification | GREEN | 9 ledger/adapter/import failures | 25/25 provider cost | `a14e05c84` |
 | Review fix 3. Google attempts | GREEN | failure-path/request-id contracts | 17/17 geocode/adapters | `f95183d04` |
 | Review fix 4. Atomic budget/voice | GREEN | 2 migration/RPC contracts | 106/106 complete focused | `e6967878d` |
 | Review follow-up. Voice-only read | GREEN | default reader scope gap | 14/14 budget | `290cf460c` |
 | Review follow-up. Persisted estimate | GREEN | persisted-threshold E2E gap | 7/7 geocode | `5abcb6cdb` |
+| Final fix 1. RPC privileges | GREEN | missing SECURITY DEFINER revoke/grant contract | 15/15 budget | `8baf3c602` |
+| Final fix 2. Atomic daily cap + Google fallback claims | GREEN | missing SQL daily-cap params and per-attempt gate | 60/60 baseline + 37/37 guard | `5a5dd201c` |
+| Final fix 3. Conflict replay/idempotent retries | GREEN | duplicate 409/replay returned failure | 33/33 budget/ledger/import | `a30e1d3ea` |
+| Final fix 4. Telnyx reservation propagation/settlement | GREEN | reservation ID stopped at dial boundary | 24/24 reservation contracts + syntax checks | `85e6a1de6` |
+| Final fix 5. Telnyx legacy summary dual-write | GREEN | new dimensions were invisible to businessSummary | 20/20 adapter/summary contracts | `e4b9b1cdd` |
 
 ## Known baseline
 
 `npm ci` completed in `apps/life-manager` (Node dependency audit reported 24 existing npm audit findings; no dependency changes were made).
 
 Focused baseline command:
 
 ```text
 node --test lib/travel-transit-wire.test.js lib/transit.test.js lib/route-cache.test.js lib/travel-routes.test.js lib/ledger.test.js lib/composio-budget.test.js
 ```
@@ -113,10 +118,21 @@ Result: 43/43 passed, 0 failed, 0 skipped (2026-08-08).
 - Geocoding records exactly once immediately before each actual Google request, including failures and empty results; cache hits and budget-denied calls remain unrecorded. Routes/legacy Transit and free transit plan/guidance now append a UUID to every actual-attempt request ID, preventing provider/request uniqueness collisions.
 
 ## Fresh review fix 4 receipt — atomic budget/voice claims and production wiring
 
 - RED: migration/RPC tests failed because budget claims were an optional REST insert and there were no voice reservation/settlement buckets (2 failures).
 - GREEN: complete focused guard suite → 106/106 passed.
 - Added `lm_provider_voice_buckets`, idempotent settlements, and transactional `lm_claim_provider_budget`/`lm_settle_provider_voice` RPCs. The claim locks user then global daily buckets and atomically accounts for reservations; known Telnyx CDRs settle actuals without turning unknown into zero.
 - Production authorization now claims every billable provider operation with a unique request ID and non-zero projection (Telnyx default `$0.05`, Gemini `$0.023`, Google SKU defaults, Composio/Resend defaults); cache-hit exits before reads/claims. Telnyx dial, Gemini Live, Composio, Resend, CDR webhook/imports, Railway/Supabase scheduled measurement loaders are wired.
 - Follow-up regression: the default voice reader now passes `voiceOnly=true` to the ledger query (not just the in-memory aggregation), and its URL filter is covered by `node --test lib/provider-budget.test.js` → 14/14.
 - Follow-up persisted-threshold regression: an empty Google response through the real ledger writer stores `estimated_usd > 0`, `actual_billed_usd = null`, and `actual_status = unknown`; `node --test lib/geocode-cache.test.js` → 7/7.
+
+## Final review fix round receipt
+
+- Security: both SECURITY DEFINER RPCs now explicitly revoke `PUBLIC`, `anon`, and `authenticated`, then grant only `service_role`. The migration contract checks exact function signatures and grants.
+- Atomic cap: the claim RPC always locks the user/day bucket, reads settled `lm_api_cost` amounts and outstanding reservations in the same transaction, and rejects a projected request at the daily cap. Voice reservations still lock global after user; unknown/null billing is not coerced to zero.
+- Google fallback: Routes and Directions are sequential. Each concrete provider attempt gets a distinct request ID and claim immediately before its request; a denied Directions claim emits no Directions request. Existing in-flight URLs remain valid through the legacy eight-field HMAC fallback when no reservation field is present.
+- Replay: claims use `ON CONFLICT ... DO NOTHING RETURNING`; ledger/provider/import 409 conflicts are successful no-ops. Concurrent ledger retries are covered by a two-writer test.
+- Telnyx reservation: generated dial reservation IDs travel through signed stream context, client state, webhook CDR, scheduled imports, and exact voice settlement. Settlement has a unique `(uid,budget_day,reservation_request_id)` index and releases the matching `reserved_usd` exactly once.
+- Legacy summary: Telnyx CDR and call-session rows dual-write provider dimensions plus `kind=telnyx_call`, `meta`, and `est_usd` compatibility fields; a 60-second fixture produces one call and one minute in `businessSummary`.
+- Focused verification: plan baseline command → 60/60 passed; cost guard command → 37/37 passed; combined reservation/contract/adapters/imports → 24/24 passed (plus syntax checks). No production env/deploy was performed.
+- Full-suite verification after `npm ci`: `npm test` reached the existing legacy-path scanner and reported exactly one pre-existing failure in `scripts/scan-legacy-paths.test.js` for the two connector runtime `${HOME}/.openclaw/.env` lines; no changed provider-cost test failed. Before the clean install, direct HTTP tests were temporarily blocked by absent declared modules (`canonicalize`, `ws`); `npm ci` restored them.
diff --git a/apps/life-manager/lib/dial.js b/apps/life-manager/lib/dial.js
index ace1e476d..a977b7994 100644
--- a/apps/life-manager/lib/dial.js
+++ b/apps/life-manager/lib/dial.js
@@ -36,22 +36,23 @@ async function balanceUsd() {
 // worked for wake calls — /test-call builds its URL with empty wakeUid/wakeEventKey, so the dial body
 // carried no client_state and the detection webhook had nothing to correlate. The kind is passed in
 // rather than added to the URL: buildStreamUrl signs its query with signCtx([...]) and the bridge
 // verifies the SAME ordered array, so a new query item changes what the signature means on both ends.
 // An argument costs nothing and cannot desync from a signature.
 function amdDialOptions(streamUrl, env = process.env, opts = {}) {
   if (!amdEnabled(env)) return {};
   const url = new URL(streamUrl);
   const wakeUid = url.searchParams.get("wakeUid") || "";
   const wakeEventKey = url.searchParams.get("wakeEventKey") || "";
+  const reservationRequestId = url.searchParams.get("reservationRequestId") || "";
   const webhookProtocol = url.protocol === "ws:" ? "http:" : "https:";
-  const clientState = opts.clientState || encodeWakeClientState({ wakeUid, wakeEventKey });
+  const clientState = opts.clientState || encodeWakeClientState({ wakeUid, wakeEventKey, reservationRequestId });
   return {
     answering_machine_detection: "detect",
     webhook_url: `${webhookProtocol}//${url.host}/telnyx-events`,
     webhook_url_method: "POST",
     ...(clientState ? { client_state: clientState } : {}),
   };
 }
 
 // to: E.164 callee. streamUrl: wss://<this-svc>/ws?summary=...&dateTime=...&location=...&urgency=...
 // clientState: OPTIONAL, for a caller whose identity is not in the stream URL (/test-call). Omitted,
diff --git a/apps/life-manager/lib/dial.test.js b/apps/life-manager/lib/dial.test.js
index 05b77bd4b..0508afe18 100644
--- a/apps/life-manager/lib/dial.test.js
+++ b/apps/life-manager/lib/dial.test.js
@@ -1,20 +1,25 @@
 "use strict";
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
 const { amdDialOptions } = require("./dial.js");
 const { encodeTestCallClientState, decodeCallClientState } = require("./telnyx-webhook.js");
 
 const WAKE_URL = "wss://life-call-production.up.railway.app/ws?summary=x&wakeUid=lm_abc&wakeEventKey=k1";
 const TEST_URL = "wss://life-call-production.up.railway.app/ws?summary=x&wakeUid=&wakeEventKey=";
 
+test("a wake dial carries its reservation id into Telnyx client_state", () => {
+  const opts = amdDialOptions(`${WAKE_URL}&reservationRequestId=telnyx%3Areservation-1`, { LM_AMD: "on" });
+  assert.equal(decodeCallClientState(opts.client_state).reservationRequestId, "telnyx:reservation-1");
+});
+
 test("a wake stream url still derives its client_state from the url", () => {
   // The wake path is the one that already works in production; the test-call fix must not move it.
   const opts = amdDialOptions(WAKE_URL, { LM_AMD: "on" });
   assert.deepEqual(decodeCallClientState(opts.client_state), { kind: "wake", wakeUid: "lm_abc", wakeEventKey: "k1" });
 });
 
 test("an explicit client_state wins over the url", () => {
   const clientState = encodeTestCallClientState({ testUid: "lm_abc" });
   const opts = amdDialOptions(TEST_URL, { LM_AMD: "on" }, { clientState });
   assert.equal(opts.answering_machine_detection, "detect");
diff --git a/apps/life-manager/lib/ledger.js b/apps/life-manager/lib/ledger.js
index 4db71105f..976438926 100644
--- a/apps/life-manager/lib/ledger.js
+++ b/apps/life-manager/lib/ledger.js
@@ -154,20 +154,24 @@ async function recordProviderCost(input = {}, opts = {}) {
   // explicitly migrated compatibility events; the provider contract itself remains complete above.
   if (input.legacyKind != null) body.kind = String(input.legacyKind);
   if (input.legacyMeta != null) body.meta = input.legacyMeta;
   try {
     const response = await fetchImpl(`${supaUrl.replace(/\/$/u, "")}/rest/v1/lm_api_cost`, {
       method: "POST",
       headers: headers(supaKey, { "Content-Type": "application/json", Prefer: "return=minimal" }),
       body: JSON.stringify(body),
     });
     if (!response || !response.ok) {
+      // PostgREST reports a replay against the provider/request unique index
+      // as 409. The first writer already persisted the same receipt, so this
+      // retry is a successful no-op and must not enter the failure outbox.
+      if (response && Number(response.status) === 409) return true;
       const error = new Error(`Supabase provider cost insert failed (${response && response.status})`);
       error.status = response && response.status;
       throw error;
     }
     if (event.provider === "telnyx" && event.actualStatus === "known" && event.actualBilledUsd != null && event.operation === "call_cdr") {
       try {
         const { settleProviderVoice } = require("./provider-budget.js");
         const settled = await settleProviderVoice({
           uid: event.uid,
           requestId: event.requestId,
@@ -201,21 +205,24 @@ async function recordCost({ uid, kind, quantity, unit, estUsd, meta } = {}, opts
       headers: headers(supaKey, { "Content-Type": "application/json", Prefer: "return=minimal" }),
       body: JSON.stringify({
         uid: uid == null ? null : String(uid),
         kind: String(kind),
         quantity: Number(quantity) || 0,
         unit: unit == null ? null : String(unit),
         est_usd: Number(estUsd) || 0,
         meta: meta == null ? {} : meta,
       }),
     });
-    if (!response.ok) throw new Error(`Supabase insert failed (${response.status})`);
+    if (!response.ok) {
+      if (Number(response.status) === 409) return true;
+      throw new Error(`Supabase insert failed (${response.status})`);
+    }
     return true;
   } catch (error) {
     log("[ledger] recordCost failed", error && error.message ? error.message : error);
     return false;
   }
 }
 
 // DB-backed daily aggregation: every process/tick asks Supabase whether today's per-user row exists.
 // No process-memory counter is authoritative, so restarts cannot create a fresh daily bucket.
 async function recordDailyComposioPoll(uid, opts = {}) {
diff --git a/apps/life-manager/lib/ledger.test.js b/apps/life-manager/lib/ledger.test.js
index f8afeb42a..2e155398a 100644
--- a/apps/life-manager/lib/ledger.test.js
+++ b/apps/life-manager/lib/ledger.test.js
@@ -48,20 +48,66 @@ test("recordCost logs and resolves false when Supabase fails", async () => {
   const result = await ledger().recordCost({ uid: "u1", kind: "x", quantity: 1 }, {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async () => { throw new Error("offline"); },
     log: (...args) => errors.push(args.join(" ")),
   });
   assert.equal(result, false);
   assert.equal(errors.length, 1);
   assert.match(errors[0], /offline/);
 });
 
+test("provider ledger duplicate conflicts are idempotent success without an owner failure", async () => {
+  const failures = [];
+  const result = await ledger().recordProviderCost({
+    uid: "u1", provider: "google", sku: "routes", operation: "routes", requestId: "route-replay",
+    quantity: 1, unit: "request", pricingVersion: "google-test-1", estimatedUsd: 0.01,
+    actualStatus: "unknown", actualBilledUsd: null,
+  }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ code: "23505" }) }),
+    ownerAlert: (failure) => failures.push(failure),
+  });
+  assert.equal(result, true);
+  assert.equal(failures.length, 0);
+});
+
+test("legacy ledger duplicate conflicts are idempotent success", async () => {
+  const result = await ledger().recordCost({ uid: "u1", kind: "telnyx_call", quantity: 60, estUsd: 0.01 }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async () => ({ ok: false, status: 409 }),
+  });
+  assert.equal(result, true);
+});
+
+test("concurrent provider ledger retries resolve as one write plus one successful no-op", async () => {
+  let requests = 0;
+  const failures = [];
+  const input = {
+    uid: "u1", provider: "telnyx", sku: "voice", operation: "call_cdr", requestId: "cdr-concurrent",
+    quantity: 60, unit: "seconds", pricingVersion: "telnyx-test-1", actualBilledUsd: 0.02,
+    actualStatus: "known", costClassification: "measured",
+  };
+  const opts = {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (url) => {
+      if (!String(url).includes("/rest/v1/lm_api_cost")) return { ok: true, status: 200, json: async () => ({ settled: true }) };
+      requests += 1;
+      return requests === 1 ? { ok: true, status: 201 } : { ok: false, status: 409 };
+    },
+    ownerAlert: (failure) => failures.push(failure),
+  };
+  const results = await Promise.all([ledger().recordProviderCost(input, opts), ledger().recordProviderCost(input, opts)]);
+  assert.deepEqual(results, [true, true]);
+  assert.equal(requests, 2);
+  assert.equal(failures.length, 0);
+});
+
 test("recordDailyComposioPoll uses a DB day query and inserts at most one row", async () => {
   const requests = [];
   const responses = [
     { ok: true, status: 200, json: async () => [] },
     { ok: true, status: 201 },
     { ok: true, status: 200, json: async () => [{ id: 9 }] },
   ];
   const opts = {
     supaUrl: "https://db.example", supaKey: "service",
     nowMs: Date.parse("2026-07-18T12:34:56Z"),
diff --git a/apps/life-manager/lib/provider-budget.js b/apps/life-manager/lib/provider-budget.js
index 3b4a9094c..b28f5e747 100644
--- a/apps/life-manager/lib/provider-budget.js
+++ b/apps/life-manager/lib/provider-budget.js
@@ -154,22 +154,25 @@ async function authorizeProviderOperation(input = {}, deps = {}) {
     }
   }
   if (typeof deps.claimBudget === "function") {
     let claimed = false;
     try { claimed = await deps.claimBudget({ ...input, requestId, projectedUsd, budget }); } catch { claimed = false; }
     if (!claimed) return { allowed: false, reason: "budget_claim_failed", ...budget, requestId, projectedUsd };
   } else if (isClaimableProvider(input.provider) && (deps.supaUrl || process.env.SUPABASE_URL)) {
     const claim = await claimProviderBudget({
       ...input, requestId, projectedUsd, isVoice: voice,
       userVoiceCapUsd: thresholds.voiceUserCapUsd, globalVoiceCapUsd: thresholds.voiceGlobalCapUsd,
+      dailyCapUsd: input.dailyCapUsd == null ? thresholds.stoppedUsd : input.dailyCapUsd,
+      enforceDailyCap: input.enforceDailyCap !== false,
     }, deps);
     if (!claim.allowed) return { allowed: false, reason: claim.reason || "budget_claim_failed", ...budget, requestId, projectedUsd };
+    if (claim.duplicate) return { allowed: true, reason: claim.reason || "budget_claim_duplicate", duplicate: true, ...budget, requestId, projectedUsd };
   }
   return { allowed: true, reason: budget.state === "warning" ? "budget_warning" : "allowed", ...budget, requestId, projectedUsd };
 }
 
 async function claimProviderBudget(input = {}, deps = {}) {
   const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
   const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
   const fetchImpl = deps.fetchImpl || globalThis.fetch;
   if (!supaUrl || !supaKey || !input.uid || !input.requestId || typeof fetchImpl !== "function") return { allowed: false, reason: "budget_claim_unavailable" };
   const day = new Date(input.nowMs == null ? Date.now() : input.nowMs).toISOString().slice(0, 10);
@@ -179,26 +182,35 @@ async function claimProviderBudget(input = {}, deps = {}) {
     method: "POST",
     headers: {
       apikey: supaKey, Authorization: `Bearer ${supaKey}`, "Content-Type": "application/json",
       Prefer: "return=representation",
     },
     body: JSON.stringify({
       p_uid: String(input.uid), p_budget_day: day, p_provider: String(input.provider || "unknown"),
       p_operation: String(input.operation || "unknown"), p_request_id: String(input.requestId),
       p_projected_usd: finiteUsd(input.projectedUsd), p_is_voice: Boolean(input.isVoice),
       p_user_voice_cap: finiteUsd(input.userVoiceCapUsd), p_global_voice_cap: finiteUsd(input.globalVoiceCapUsd),
+      p_daily_cap: finiteUsd(input.dailyCapUsd), p_enforce_daily_cap: input.enforceDailyCap !== false,
     }),
     });
   } catch (error) {
     return { allowed: false, reason: "budget_claim_unavailable", error: String(error && error.message ? error.message : error) };
   }
-  if (!response || !response.ok) return { allowed: false, reason: "budget_claim_failed", status: response && response.status };
+  // A uniqueness conflict is the replay receipt from another concurrent
+  // worker. The SQL RPC itself returns the original claim as `duplicate=true`,
+  // but Supabase/PostgREST can surface the same race as HTTP 409.
+  if (!response || !response.ok) {
+    if (response && Number(response.status) === 409) {
+      return { allowed: true, reason: "budget_claim_duplicate", duplicate: true, requestId: input.requestId };
+    }
+    return { allowed: false, reason: "budget_claim_failed", status: response && response.status };
+  }
   const raw = await response.json().catch(() => null);
   const result = Array.isArray(raw) ? raw[0] : raw;
   if (!result || result.allowed !== true) return { allowed: false, reason: result && result.reason ? String(result.reason) : "budget_claim_failed" };
   return { allowed: true, reason: result.duplicate ? "budget_claim_duplicate" : "budget_claimed", duplicate: Boolean(result.duplicate), requestId: result.request_id || input.requestId };
 }
 
 async function settleProviderVoice(input = {}, deps = {}) {
   const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
   const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
   const fetchImpl = deps.fetchImpl || globalThis.fetch;
diff --git a/apps/life-manager/lib/provider-budget.test.js b/apps/life-manager/lib/provider-budget.test.js
index 7f0b19f9c..003d71d77 100644
--- a/apps/life-manager/lib/provider-budget.test.js
+++ b/apps/life-manager/lib/provider-budget.test.js
@@ -9,20 +9,47 @@ const { evaluateProviderBudget, aggregateCostRows, readDailySpend, authorizeProv
 test("migration provides a unique atomic daily claim identity", () => {
   const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
   assert.match(sql, /lm_provider_budget_claims/);
   assert.match(sql, /primary key \(uid, budget_day, request_id\)/);
   assert.match(sql, /create table if not exists public\.lm_provider_voice_buckets/);
   assert.match(sql, /create or replace function public\.lm_claim_provider_budget/);
   assert.match(sql, /for update/);
   assert.match(sql, /reserved_usd/);
   assert.match(sql, /settled_usd/);
   assert.match(sql, /lm_settle_provider_voice/);
+  assert.match(sql, /reservation_request_id/);
+  assert.match(sql, /lm_provider_voice_settlement_reservation_idx/);
+});
+
+test("security-definer budget RPCs are callable only by service_role", () => {
+  const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
+  assert.match(sql, /revoke all on function public\.lm_claim_provider_budget\([^)]*\)\s+from public, anon, authenticated/);
+  assert.match(sql, /grant execute on function public\.lm_claim_provider_budget\([^)]*\)\s+to service_role/);
+  assert.match(sql, /revoke all on function public\.lm_settle_provider_voice\([^)]*\)\s+from public, anon, authenticated/);
+  assert.match(sql, /grant execute on function public\.lm_settle_provider_voice\([^)]*\)\s+to service_role/);
+});
+
+test("the transactional claim contract includes the daily cap and settled ledger", () => {
+  const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
+  assert.match(sql, /p_daily_cap\s+numeric/);
+  assert.match(sql, /from lm_api_cost/);
+  assert.match(sql, /actual_billed_usd/);
+  assert.match(sql, /estimated_usd/);
+  assert.match(sql, /lm_provider_budget_claims/);
+  assert.match(sql, /for update/);
+});
+
+test("provider claims use conflict replay semantics for the original receipt", () => {
+  const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
+  assert.match(sql, /insert into lm_provider_budget_claims[\s\S]*on conflict \(uid, budget_day, request_id\) do nothing/);
+  assert.match(sql, /returning request_id/);
+  assert.match(sql, /duplicate/);
 });
 
 test("daily provider budget boundaries are normal, warning, degraded, then stopped", () => {
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.49, estimatedUsd: 0 }).state, "normal");
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.50, estimatedUsd: 0 }).state, "warning");
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.99, estimatedUsd: 0.01 }).state, "degraded");
   assert.equal(evaluateProviderBudget({ measuredUsd: 2, estimatedUsd: 0 }).state, "stopped");
 });
 
 test("unknown billing is visible in reasons and never contributes numeric zero as measured spend", () => {
@@ -135,20 +162,21 @@ test("production authorization atomically claims a nonzero projection through th
       return { ok: true, status: 200, json: async () => [] };
     },
   });
   assert.equal(result.allowed, true);
   const rpc = calls.find((call) => call.url.includes("/rpc/lm_claim_provider_budget"));
   assert.ok(rpc, "the production path must use the transactional RPC");
   const body = JSON.parse(rpc.init.body);
   assert.equal(body.p_request_id, "call-attempt-1");
   assert.ok(body.p_projected_usd > 0, "voice claims must never reserve a zero projection");
   assert.equal(body.p_is_voice, true);
+  assert.equal(body.p_daily_cap, 2);
 });
 
 test("cached reads bypass both budget reads and the atomic claim RPC", async () => {
   let calls = 0;
   const result = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "routes", cacheHit: true }, {
     supaUrl: "https://db.example", supaKey: "service", fetchImpl: async () => { calls += 1; return { ok: true }; },
     readDailySpend: async () => { calls += 1; return { measuredUsd: 99, estimatedUsd: 0, unknownCount: 0 }; },
   });
   assert.equal(result.allowed, true);
   assert.equal(calls, 0);
@@ -162,10 +190,25 @@ test("known Telnyx CDR settlement uses the transactional voice settlement RPC",
       calls.push({ url: String(url), init });
       return { ok: true, status: 200, json: async () => ({ settled: true }) };
     },
   });
   assert.equal(ok, true);
   const body = JSON.parse(calls[0].init.body);
   assert.equal(body.p_request_id, "cdr-1");
   assert.equal(body.p_actual_usd, 0.037);
   assert.equal(body.p_reservation_request_id, "call-1");
 });
+
+test("a provider claim replay after a conflict is an allowed duplicate receipt", async () => {
+  const result = await authorizeProviderOperation({
+    uid: "u1", provider: "google", operation: "routes", essential: false,
+    requestId: "route-replay", projectedUsd: 0.01,
+  }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    readDailySpend: async () => ({ measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }),
+    fetchImpl: async (url) => String(url).includes("lm_claim_provider_budget")
+      ? { ok: false, status: 409, json: async () => ({ code: "23505", message: "duplicate key" }) }
+      : { ok: true, status: 200, json: async () => [] },
+  });
+  assert.equal(result.allowed, true);
+  assert.equal(result.reason, "budget_claim_duplicate");
+});
diff --git a/apps/life-manager/lib/provider-cost-adapters.js b/apps/life-manager/lib/provider-cost-adapters.js
index 252b43c2c..bbfb2d0fc 100644
--- a/apps/life-manager/lib/provider-cost-adapters.js
+++ b/apps/life-manager/lib/provider-cost-adapters.js
@@ -119,20 +119,24 @@ async function recordTelnyxCdr(input = {}, deps = {}) {
   const actual = cdrCost(cdr);
   return write({
     uid: input.uid == null ? null : String(input.uid), provider: "telnyx", sku: "voice",
     operation: "call_cdr", requestId: requestId("telnyx", { requestId: input.requestId, id: cdr.id || cdr.call_control_id }),
     quantity: quantity(input.durationSeconds, 0), unit: "seconds", pricingVersion: "telnyx-cdr-2026-08",
     estimatedUsd: null, actualBilledUsd: actual, actualStatus: actual == null ? "unknown" : "known",
     costClassification: actual == null ? "unknown" : "measured",
     metadata: { ...objectOrEmpty(input.metadata), ...(cdr.id ? { cdrId: String(cdr.id) } : {}),
       ...(cdr.call_control_id ? { callControlId: String(cdr.call_control_id) } : {}),
       ...(input.reservationRequestId ? { reservationRequestId: String(input.reservationRequestId) } : {}) },
+    legacyKind: "telnyx_call",
+    legacyMeta: { kind: "telnyx_call", ...(cdr.id ? { cdrId: String(cdr.id) } : {}),
+      ...(cdr.call_control_id ? { callControlId: String(cdr.call_control_id) } : {}),
+      ...(input.reservationRequestId ? { reservationRequestId: String(input.reservationRequestId) } : {}) },
   }, deps);
 }
 
 async function recordResendSend(input = {}, deps = {}) {
   const recipients = quantity(input.recipientCount, 1);
   return write(unknownEvent({
     provider: "resend", sku: "email", operation: "send", uid: input.uid,
     requestId: input.requestId || input.responseId, quantity: recipients, unit: "recipient",
     pricingVersion: "resend-2026-08",
     metadata: { ...objectOrEmpty(input.metadata), ...(input.responseId ? { responseId: String(input.responseId) } : {}) },
diff --git a/apps/life-manager/lib/provider-cost-adapters.test.js b/apps/life-manager/lib/provider-cost-adapters.test.js
index f781b3fbb..5079221cd 100644
--- a/apps/life-manager/lib/provider-cost-adapters.test.js
+++ b/apps/life-manager/lib/provider-cost-adapters.test.js
@@ -77,20 +77,31 @@ test("Telnyx CDR records provider-measured actual cost", async () => {
     uid: "u1", requestId: "cdr-1", durationSeconds: 90,
     cdr: { cost: { amount: "0.037", currency: "USD" }, call_control_id: "cc-1" },
   }, r.deps);
   assert.equal(r.events[0].provider, "telnyx");
   assert.equal(r.events[0].actualStatus, "known");
   assert.equal(r.events[0].costClassification, "measured");
   assert.equal(r.events[0].actualBilledUsd, 0.037);
   assert.equal(r.events[0].estimatedUsd, null);
 });
 
+test("Telnyx CDR keeps the dial reservation id and legacy call dimensions", async () => {
+  const r = recorder();
+  await adapters.recordTelnyxCdr({
+    uid: "u1", requestId: "cdr-reservation-1", reservationRequestId: "call-reservation-1", durationSeconds: 60,
+    cdr: { id: "cdr-1", call_control_id: "cc-1", cost: { amount: "0.02", currency: "USD" } },
+  }, r.deps);
+  assert.equal(r.events[0].metadata.reservationRequestId, "call-reservation-1");
+  assert.equal(r.events[0].legacyKind, "telnyx_call");
+  assert.equal(r.events[0].legacyMeta.reservationRequestId, "call-reservation-1");
+});
+
 test("Resend sends record recipient quantity and retain unknown billing", async () => {
   const r = recorder();
   await adapters.recordResendSend({ uid: "u1", requestId: "mail-1", recipientCount: 2, responseId: "re-1" }, r.deps);
   assert.equal(r.events[0].provider, "resend");
   assert.equal(r.events[0].quantity, 2);
   assert.equal(r.events[0].unit, "recipient");
   assert.equal(r.events[0].actualStatus, "unknown");
   assert.equal(r.events[0].actualBilledUsd, null);
 });
 
@@ -145,31 +156,58 @@ test("route providers record each attempted Google operation and transit plan/gu
   assert.ok(urls.some((url) => url.includes("maps.googleapis.com")));
   assert.deepEqual(r.events.map((event) => [event.provider, event.operation]), [
     ["google", "routes"], ["google", "transit"], ["transit", "plan"], ["transit", "guidance"],
   ]);
 });
 
 test("each actual Google request gets a unique ledger request id even when a caller supplies one operation prefix", async () => {
   const r = recorder();
   const original = global.fetch;
   global.fetch = async (url) => String(url).includes("routes.googleapis.com")
-    ? { ok: true, json: async () => ({ routes: [{ duration: "120s" }] }) }
+    ? { ok: false, status: 503, json: async () => ({}) }
     : { ok: true, json: async () => ({ status: "OK", routes: [{ legs: [{ duration: { value: 180 } }] }] }) };
   try {
     await directionsMinutesGoogle("a", "b", "k", Date.now() + 60000, Date.now(), false, {
       uid: "u1", requestId: "google:attempt-prefix", recordProviderCost: r.deps.recordProviderCost,
     });
   } finally { global.fetch = original; }
   assert.equal(r.events.length, 2);
   assert.equal(new Set(r.events.map((event) => event.requestId)).size, 2);
 });
 
+test("Google fallback authorizes each actual attempt and skips Directions when its claim is denied", async () => {
+  const r = recorder();
+  const original = global.fetch;
+  const urls = [];
+  const decisions = [];
+  global.fetch = async (url) => {
+    urls.push(String(url));
+    if (String(url).includes("routes.googleapis.com")) return { ok: false, status: 503, json: async () => ({}) };
+    throw new Error("Directions must not run after its claim is denied");
+  };
+  try {
+    const result = await directionsMinutesGoogle("a", "b", "k", Date.now() + 60000, Date.now(), false, {
+      uid: "u1", requestId: "google:fallback", recordProviderCost: r.deps.recordProviderCost,
+      authorizeProviderOperation: async (input) => {
+        decisions.push(input);
+        return { allowed: decisions.length === 1 };
+      },
+    });
+    assert.equal(result, null);
+  } finally { global.fetch = original; }
+  assert.equal(decisions.length, 2);
+  assert.equal(urls.filter((url) => url.includes("routes.googleapis.com")).length, 1);
+  assert.equal(urls.filter((url) => url.includes("maps.googleapis.com")).length, 0);
+  assert.equal(r.events.length, 1);
+  assert.equal(new Set(decisions.map((decision) => decision.requestId)).size, 2);
+});
+
 test("a successful Google geocode miss records one operation while a cache hit records none", async () => {
   const r = recorder();
   clearGeocodeProcessMemo();
   const store = new Map();
   const cache = {
     get: async (key) => store.get(key) || null,
     put: async (key, value) => { store.set(key, value); return true; },
   };
   let googleCalls = 0;
   const fetchImpl = async () => {
diff --git a/apps/life-manager/lib/provider-cost-imports.js b/apps/life-manager/lib/provider-cost-imports.js
index 026a6c9cb..a2a727fd6 100644
--- a/apps/life-manager/lib/provider-cost-imports.js
+++ b/apps/life-manager/lib/provider-cost-imports.js
@@ -28,21 +28,24 @@ async function importRows(rows, importer, options = {}) {
       failed++;
     }
   }
   return { attempted: rows.length, recorded, failed };
 }
 
 async function importTelnyxCdrs(rows, options = {}) {
   return importRows(rows, (row, index) => recordTelnyxCdr({
     uid: row && row.uid != null ? row.uid : options.uid,
     requestId: row && (row.requestId || row.request_id) || idFor("telnyx", row, index, options.requestIdPrefix),
-    durationSeconds: durationFor(row), cdr: row, metadata: options.metadata,
+    durationSeconds: durationFor(row), cdr: row,
+    reservationRequestId: row && (row.reservationRequestId || row.reservation_request_id)
+      || options.reservationRequestId,
+    metadata: options.metadata,
   }, options), options);
 }
 
 function allocationInput(provider, row, index, options) {
   return {
     uid: row && row.uid != null ? row.uid : options.uid,
     requestId: row && (row.requestId || row.request_id) || idFor(provider, row, index, options.requestIdPrefix),
     amountUsd: row && (row.amountUsd ?? row.amount_usd ?? row.costUsd ?? row.cost_usd ?? row.amount),
     estimatedUsd: row && (row.estimatedUsd ?? row.estimated_usd),
     quantity: row && row.quantity,
diff --git a/apps/life-manager/lib/provider-cost-imports.test.js b/apps/life-manager/lib/provider-cost-imports.test.js
index f47f1160c..ec98a78bc 100644
--- a/apps/life-manager/lib/provider-cost-imports.test.js
+++ b/apps/life-manager/lib/provider-cost-imports.test.js
@@ -2,20 +2,21 @@
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
 const {
   importTelnyxCdrs,
   importRailwayAllocations,
   importSupabaseAllocations,
   importScheduledMeasurements,
   runScheduledProviderCostImports,
 } = require("./provider-cost-imports.js");
+const { recordProviderCost } = require("./ledger.js");
 
 function recorder() {
   const events = [];
   return {
     events,
     deps: { recordProviderCost: async (event) => { events.push(event); return true; } },
   };
 }
 
 test("Telnyx CDR import stores measured cost and keeps a missing CDR amount unknown", async () => {
@@ -24,20 +25,29 @@ test("Telnyx CDR import stores measured cost and keeps a missing CDR amount unkn
     { id: "cdr-1", call_control_id: "cc-1", billed_duration: 90, cost: { amount: "0.037", currency: "USD" } },
     { id: "cdr-2", call_control_id: "cc-2", billed_duration: 30 },
   ], { uid: "u1", ...r.deps });
   assert.deepEqual(result, { attempted: 2, recorded: 2, failed: 0 });
   assert.equal(r.events[0].actualStatus, "known");
   assert.equal(r.events[0].actualBilledUsd, 0.037);
   assert.equal(r.events[1].actualStatus, "unknown");
   assert.equal(r.events[1].actualBilledUsd, null);
 });
 
+test("Telnyx import propagates a row reservation id to the CDR settlement event", async () => {
+  const r = recorder();
+  await importTelnyxCdrs([
+    { id: "cdr-reservation", call_control_id: "cc-reservation", billed_duration: 60,
+      reservation_request_id: "call-reservation-1", cost: { amount: "0.02", currency: "USD" } },
+  ], { uid: "u1", ...r.deps });
+  assert.equal(r.events[0].metadata.reservationRequestId, "call-reservation-1");
+});
+
 test("Railway and Supabase allocation imports preserve owner measurements", async () => {
   const r = recorder();
   await importRailwayAllocations([{ period: "2026-08-08", amount_usd: "1.25" }], { uid: "u1", ...r.deps });
   await importSupabaseAllocations([{ period_key: "2026-08-08", amount_usd: "0.40" }], { uid: "u1", ...r.deps });
   assert.deepEqual(r.events.map((event) => [event.provider, event.actualBilledUsd]), [
     ["railway", 1.25], ["supabase", 0.4],
   ]);
   assert.ok(r.events.every((event) => event.actualStatus === "known"));
 });
 
@@ -46,20 +56,31 @@ test("a failed scheduled measurement import returns failure and emits no synthet
   const result = await importScheduledMeasurements("railway", async () => { throw new Error("usage API down"); }, {
     uid: "u1", ...r.deps,
   });
   assert.equal(result.attempted, 0);
   assert.equal(result.recorded, 0);
   assert.equal(result.failed, 1);
   assert.equal(r.events.length, 0);
   assert.match(result.error, /usage API down/);
 });
 
+test("a replayed Telnyx import with a provider uniqueness conflict is recorded, not failed", async () => {
+  const result = await importTelnyxCdrs([
+    { id: "cdr-replay", call_control_id: "cc-replay", billed_duration: 60, cost: { amount: "0.02", currency: "USD" } },
+  ], {
+    uid: "u1", recordProviderCost,
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async () => ({ ok: false, status: 409, json: async () => ({ code: "23505" }) }),
+  });
+  assert.deepEqual(result, { attempted: 1, recorded: 1, failed: 0 });
+});
+
 test("production import runner invokes Telnyx, Railway, and Supabase loaders and reports each result", async () => {
   const r = recorder();
   const loaded = [];
   const result = await runScheduledProviderCostImports({
     loaders: {
       telnyx: async () => { loaded.push("telnyx"); return [{ id: "cdr-run", cost: { amount: "0.01", currency: "USD" } }]; },
       railway: async () => { loaded.push("railway"); return [{ period: "2026-08-08", amount_usd: "0.20" }]; },
       supabase: async () => { loaded.push("supabase"); return [{ period: "2026-08-08", amount_usd: "0.10" }]; },
     },
     options: { uid: "u1", ...r.deps },
diff --git a/apps/life-manager/lib/telnyx-webhook.js b/apps/life-manager/lib/telnyx-webhook.js
index 487cb170f..a2b0e662f 100644
--- a/apps/life-manager/lib/telnyx-webhook.js
+++ b/apps/life-manager/lib/telnyx-webhook.js
@@ -1,64 +1,80 @@
 "use strict";
 
 const crypto = require("node:crypto");
 
 const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
 const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;
 
-function encodeWakeClientState({ wakeUid, wakeEventKey } = {}) {
+function encodeWakeClientState({ wakeUid, wakeEventKey, reservationRequestId } = {}) {
   if (!wakeUid || !wakeEventKey) return "";
-  return Buffer.from(JSON.stringify({ wakeUid, wakeEventKey }), "utf8").toString("base64");
+  const state = { wakeUid, wakeEventKey };
+  if (reservationRequestId != null && String(reservationRequestId).trim()) {
+    state.reservationRequestId = String(reservationRequestId).slice(0, 200);
+  }
+  return Buffer.from(JSON.stringify(state), "utf8").toString("base64");
 }
 
 function decodeWakeClientState(value) {
   if (!value) return null;
   try {
     const parsed = JSON.parse(Buffer.from(String(value), "base64").toString("utf8"));
     if (!parsed || typeof parsed.wakeUid !== "string" || typeof parsed.wakeEventKey !== "string") return null;
     if (!parsed.wakeUid || !parsed.wakeEventKey) return null;
-    return {
+    const state = {
       wakeUid: parsed.wakeUid.slice(0, 100),
       wakeEventKey: parsed.wakeEventKey.slice(0, 300),
     };
+    if (typeof parsed.reservationRequestId === "string" && parsed.reservationRequestId.trim()) {
+      state.reservationRequestId = parsed.reservationRequestId.slice(0, 200);
+    }
+    return state;
   } catch {
     return null;
   }
 }
 
 // spec §3 row 2d: /test-call went out with NO client_state at all, so the webhook decoded null and
 // returned "no wake context" before it could reach the hangup — every test call that hit a voicemail
 // ran to the carrier's 120-second recording limit. The fix is to give a call state that says WHICH
 // KIND of call it belongs to, because the two kinds have different records: a wake call has an
 // lm_wake_log row to write amd_result onto, a test call has none. Writing the same shape for both
 // would aim a PATCH at a row that does not exist and turn matched=0 (the "a wake row went missing"
 // alarm of §1.3) into routine noise.
-function encodeTestCallClientState({ testUid } = {}) {
+function encodeTestCallClientState({ testUid, reservationRequestId } = {}) {
   // "" and not a decodable blob: dial.js omits client_state entirely on a falsy value, and a call we
   // cannot name in a log is worse than a call that carries no state at all.
   if (!testUid) return "";
-  return Buffer.from(JSON.stringify({ testUid }), "utf8").toString("base64");
+  const state = { testUid };
+  if (reservationRequestId != null && String(reservationRequestId).trim()) {
+    state.reservationRequestId = String(reservationRequestId).slice(0, 200);
+  }
+  return Buffer.from(JSON.stringify(state), "utf8").toString("base64");
 }
 
 // One decoder for both kinds so the webhook branches on `kind` instead of trying each decoder in turn
 // and inferring the kind from which one answered. Wake is tried first and unchanged: its existing
 // callers and its stricter shape (both fields required) keep deciding what a wake call is.
 function decodeCallClientState(value) {
   const wake = decodeWakeClientState(value);
   if (wake) return { kind: "wake", ...wake };
   if (!value) return null;
   try {
     const parsed = JSON.parse(Buffer.from(String(value), "base64").toString("utf8"));
     if (!parsed || typeof parsed.testUid !== "string" || !parsed.testUid) return null;
     // Same slice as the wake fields: this ends up in a log line, and Telnyx echoes client_state back
     // verbatim, so its length is attacker-controlled input to our own logs.
-    return { kind: "test", testUid: parsed.testUid.slice(0, 100) };
+    const state = { kind: "test", testUid: parsed.testUid.slice(0, 100) };
+    if (typeof parsed.reservationRequestId === "string" && parsed.reservationRequestId.trim()) {
+      state.reservationRequestId = parsed.reservationRequestId.slice(0, 200);
+    }
+    return state;
   } catch {
     return null;
   }
 }
 
 function createTelnyxPublicKey(value) {
   const text = String(value || "").trim().replace(/\\n/g, "\n");
   if (!text) return null;
   if (text.includes("BEGIN PUBLIC KEY")) return crypto.createPublicKey(text);
   const raw = Buffer.from(text, "base64");
diff --git a/apps/life-manager/lib/telnyx-webhook.test.js b/apps/life-manager/lib/telnyx-webhook.test.js
index 1d50a395c..01e324af2 100644
--- a/apps/life-manager/lib/telnyx-webhook.test.js
+++ b/apps/life-manager/lib/telnyx-webhook.test.js
@@ -6,20 +6,31 @@ const {
   encodeWakeClientState, encodeTestCallClientState, decodeCallClientState, decodeWakeClientState,
 } = require("./telnyx-webhook.js");
 
 test("a wake client_state decodes as kind=wake", () => {
   const encoded = encodeWakeClientState({ wakeUid: "lm_abc", wakeEventKey: "lm_abc|2026-08-02T09:00:00+09:00|10" });
   assert.deepEqual(decodeCallClientState(encoded), {
     kind: "wake", wakeUid: "lm_abc", wakeEventKey: "lm_abc|2026-08-02T09:00:00+09:00|10",
   });
 });
 
+test("wake and test client states carry the exact dial reservation request id", () => {
+  const wake = encodeWakeClientState({ wakeUid: "lm_abc", wakeEventKey: "event-1", reservationRequestId: "telnyx:reservation-1" });
+  assert.deepEqual(decodeCallClientState(wake), {
+    kind: "wake", wakeUid: "lm_abc", wakeEventKey: "event-1", reservationRequestId: "telnyx:reservation-1",
+  });
+  const testCall = encodeTestCallClientState({ testUid: "lm_abc", reservationRequestId: "telnyx:reservation-2" });
+  assert.deepEqual(decodeCallClientState(testCall), {
+    kind: "test", testUid: "lm_abc", reservationRequestId: "telnyx:reservation-2",
+  });
+});
+
 test("a test-call client_state decodes as kind=test", () => {
   const encoded = encodeTestCallClientState({ testUid: "lm_abc" });
   assert.deepEqual(decodeCallClientState(encoded), { kind: "test", testUid: "lm_abc" });
 });
 
 test("a test-call client_state is NOT mistaken for a wake row", () => {
   // Mistaking one for the other would send an amd_result PATCH at an lm_wake_log row that does not
   // exist, and every test call would report matched=0 — the same log line that means a real wake row
   // went missing. The two must stay distinguishable or the matched=0 alarm stops meaning anything.
   assert.equal(decodeWakeClientState(encodeTestCallClientState({ testUid: "lm_abc" })), null);
diff --git a/apps/life-manager/lib/travel-routes.test.js b/apps/life-manager/lib/travel-routes.test.js
index a6a995190..a9a2c3027 100644
--- a/apps/life-manager/lib/travel-routes.test.js
+++ b/apps/life-manager/lib/travel-routes.test.js
@@ -108,21 +108,21 @@ test("transit returns empty routes[] → null path, drive used (no crash)", asyn
   const restore = stubFetch({ transit: { status: "OK", routes: [] }, drive: driveOK(30) });
   try {
     const now = Date.parse("2026-06-21T00:00:00Z");
     assert.equal(await directionsMinutes("A", "B", "k", now + 3600000, now), 30);
   } finally { restore(); }
 });
 
 test("transit anchors arrival_time to EVENT start (not departure_time=now) for a future event", async () => {
   let transitUrl = "";
   const restore = stubFetch({
-    transit: transitOK(20), drive: driveOK(10),
+    transit: transitOK(20), drive: {},
     capture: (u) => { if (u.includes("/maps/api/directions")) transitUrl = u; },
   });
   try {
     const now = Date.parse("2026-06-21T00:00:00Z");
     const eventStart = Date.parse("2026-06-21T09:00:00Z");
     await directionsMinutes("A", "B", "k", eventStart, now);
     assert.ok(transitUrl.includes(`arrival_time=${Math.floor(eventStart / 1000)}`), "must carry event-start arrival_time");
     assert.ok(!transitUrl.includes("departure_time=now"), "must NOT use departure_time=now for a future event");
   } finally { restore(); }
 });
diff --git a/apps/life-manager/lib/travel.js b/apps/life-manager/lib/travel.js
index 7d378964b..4a19891be 100644
--- a/apps/life-manager/lib/travel.js
+++ b/apps/life-manager/lib/travel.js
@@ -114,20 +114,27 @@ function buildDriveBody(src, dst, departIso) {
 }
 function clampDepartIso(departAtMs, nowMs) {
   // Routes API rejects a departureTime in the past → floor to now+60s.
   const ms = Math.max(Number(departAtMs) || 0, (Number(nowMs) || 0) + 60000);
   return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
 }
 
 async function routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts = {}) {
   const body = JSON.stringify(buildDriveBody(src, dst, clampDepartIso(departAtMs, nowMs)));
   const attemptId = providerAttemptId("google", "routes", opts.requestId);
+  if (typeof opts.authorizeProviderOperation === "function") {
+    const decision = await opts.authorizeProviderOperation({
+      uid: opts.uid, provider: "google", operation: "routes", essential: false, cacheHit: false,
+      requestId: attemptId, projectedUsd: 0.01,
+    });
+    if (decision && decision.allowed === false) return null;
+  }
   const record = typeof opts.recordProviderCost === "function"
     ? () => recordGoogleRoutes({ uid: opts.uid, requestId: attemptId, metadata: { cache: "miss" } }, {
       recordProviderCost: opts.recordProviderCost,
     }).catch(() => false)
     : null;
   if (record) await record();
   try {
     const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
       method: "POST",
       headers: {
@@ -152,52 +159,58 @@ async function legacyTransitMinutes(src, dst, mapsKey, arriveByMs, nowMs = Date.
   // the train time reflects the schedule the user will actually ride. Past/missing → fall back to now.
   // Return leg: departAtMs is set → use departure_time anchored to event end (FIND-004).
   if (Number.isFinite(departAtMs) && departAtMs > nowMs) {
     p.set("departure_time", String(Math.floor(departAtMs / 1000)));
   } else if (Number.isFinite(arriveByMs) && arriveByMs > nowMs) {
     p.set("arrival_time", String(Math.floor(arriveByMs / 1000)));
   } else {
     p.set("departure_time", "now");
   }
   const attemptId = providerAttemptId("google", "transit", opts.requestId);
+  if (typeof opts.authorizeProviderOperation === "function") {
+    const decision = await opts.authorizeProviderOperation({
+      uid: opts.uid, provider: "google", operation: "transit", essential: false, cacheHit: false,
+      requestId: attemptId, projectedUsd: 0.005,
+    });
+    if (decision && decision.allowed === false) return null;
+  }
   const record = typeof opts.recordProviderCost === "function"
     ? () => recordGoogleTransit({ uid: opts.uid, requestId: attemptId }, {
       recordProviderCost: opts.recordProviderCost,
     }).catch(() => false)
     : null;
   if (record) await record();
   try {
     const r = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${p}`);
     const j = await r.json();
     if (j.status !== "OK" || !j.routes || !j.routes[0] || !j.routes[0].legs || !j.routes[0].legs[0]) return null;
     return minutesFromSeconds(j.routes[0].legs[0].duration.value);
   } catch { return null; }
 }
 
-// Query BOTH transit (anchored to event start) and traffic-aware drive, then take the LARGER —
-// never-late bias: we don't yet know the user's mode, so assume the slower so we never under-estimate.
-// departAtMs ≈ event start. Returns null only if neither mode resolves (caller then asks). floor 5 min.
+// Try Routes first, then make one Directions request only when Routes did not
+// resolve. Each actual attempt owns its own budget claim and ledger request ID;
+// this keeps a denied fallback from leaking a second paid request.
 // TODO(#69/#70): per-user travel_mode preference → trust the chosen mode instead of max().
 //
 // departureMode: when true, the time arg is a DEPARTURE anchor (for return legs — FIND-004).
 // Outbound (default false): transit uses arrival_time = event start (arrive-by).
 // Return (true): transit uses departure_time = ev.endMs (depart-at, not arrive-by).
 // The Google path (Routes Pro drive + legacy transit, never-late MAX bias). This is the FALLBACK now.
 async function directionsMinutesGoogle(src, dst, mapsKey, departAtMs = Date.now(), nowMs = Date.now(), departureMode = false, opts = {}) {
   if (!mapsKey || !src || !dst) return null;
-  const [transit, drive] = await Promise.all([
-    departureMode
-      ? legacyTransitMinutes(src, dst, mapsKey, null, nowMs, departAtMs, opts)
-      : legacyTransitMinutes(src, dst, mapsKey, departAtMs, nowMs, null, opts),
-    routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts),
-  ]);
-  return acceptRouteResults({ legacyTransit: transit, routesDrive: drive }).minutes;
+  const drive = await routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts);
+  if (Number.isFinite(drive)) return drive;
+  const transit = departureMode
+    ? await legacyTransitMinutes(src, dst, mapsKey, null, nowMs, departAtMs, opts)
+    : await legacyTransitMinutes(src, dst, mapsKey, departAtMs, nowMs, null, opts);
+  return Number.isFinite(transit) ? transit : null;
 }
 
 function transitQueryTime(eventAt, timezone) {
   const instant = new Date(eventAt);
   if (!Number.isFinite(instant.getTime())) return null;
   const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
     timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit",
     hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
   }).formatToParts(instant).filter((part) => part.type !== "literal")
     .map((part) => [part.type, part.value]));
@@ -264,30 +277,35 @@ async function directionsRoute(src, dst, mapsKey, departAtMs = Date.now(), nowMs
   }));
   const transitFetch = opts._transitFetch || ((from, to, options) => transitFetchPlan(from, to, {
     ...options,
     fetchImpl: opts._transitFetchImpl || globalThis.fetch,
     uid: opts._uid,
     recordProviderCost: opts._recordProviderCost,
   }));
   const googleFn = opts._directionsMinutesGoogle || directionsMinutesGoogle;
   const cache = opts._routeCache || _routeCache; // tests inject a fresh cache to avoid cross-test leakage
   const google = async () => {
-    if (typeof opts._authorizeProviderOperation === "function") {
+    // Test/integration seams may replace the whole Google operation. Keep the
+    // shared fallback gate around that seam; production directionsMinutesGoogle
+    // performs one claim immediately before each concrete provider request.
+    if (opts._directionsMinutesGoogle && typeof opts._authorizeProviderOperation === "function") {
       const decision = await opts._authorizeProviderOperation({
         uid: opts._uid, provider: "google", operation: "fallback", essential: false, cacheHit: false,
+        requestId: providerAttemptId("google", "fallback", opts._googleRequestId), projectedUsd: 0.01,
       });
       if (decision && decision.allowed === false) return null;
     }
     return googleFn(src, dst, mapsKey, departAtMs, nowMs, departureMode, {
       uid: opts._uid,
       requestId: opts._googleRequestId || `google:routes:${new Date(departAtMs).toISOString()}:${departureMode ? "return" : "outbound"}`,
       recordProviderCost: opts._recordProviderCost,
+      authorizeProviderOperation: opts._authorizeProviderOperation,
     });
   };
   if (!mapsKey || !src || !dst) return null;
   const [srcGeo, dstGeo] = await Promise.all([
     geocode(src, mapsKey, opts),
     geocode(dst, mapsKey, opts),
   ]);
   const routeBucket = timeBucket(departAtMs);
   const cacheUid = opts._uid == null ? "anonymous" : String(opts._uid);
   const anchor = new Date(departAtMs).toISOString();
diff --git a/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
index b259446be..a549babbb 100644
--- a/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
+++ b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
@@ -44,21 +44,22 @@ ALTER TABLE public.lm_api_cost
   ADD COLUMN IF NOT EXISTS provider text,
   ADD COLUMN IF NOT EXISTS sku text,
   ADD COLUMN IF NOT EXISTS operation text,
   ADD COLUMN IF NOT EXISTS request_id text,
   ADD COLUMN IF NOT EXISTS pricing_version text,
   ADD COLUMN IF NOT EXISTS estimated_usd numeric,
   ADD COLUMN IF NOT EXISTS actual_billed_usd numeric,
   ADD COLUMN IF NOT EXISTS actual_status text,
   ADD COLUMN IF NOT EXISTS cost_classification text,
   ADD COLUMN IF NOT EXISTS failed_at timestamptz,
-  ADD COLUMN IF NOT EXISTS failure_reason text;
+  ADD COLUMN IF NOT EXISTS failure_reason text,
+  ADD COLUMN IF NOT EXISTS metadata jsonb;
 
 -- Normalize the first version of this gate (`measured|estimated|unknown` in
 -- actual_status) before installing the stricter two-state status contract.
 -- The old distinction is retained in the new classification column.
 UPDATE public.lm_api_cost
 SET cost_classification = CASE
   WHEN actual_status = 'measured' OR (actual_status = 'known' AND actual_billed_usd IS NOT NULL) THEN 'measured'
   WHEN actual_status = 'estimated' OR estimated_usd IS NOT NULL THEN 'estimated'
   ELSE 'unknown'
 END
@@ -145,87 +146,170 @@ CREATE TABLE IF NOT EXISTS public.lm_provider_voice_buckets (
 CREATE INDEX IF NOT EXISTS lm_provider_voice_buckets_day_idx
   ON public.lm_provider_voice_buckets (budget_day, scope);
 ALTER TABLE public.lm_provider_voice_buckets ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.lm_provider_voice_buckets FORCE ROW LEVEL SECURITY;
 
 CREATE TABLE IF NOT EXISTS public.lm_provider_voice_settlements (
   request_id  text PRIMARY KEY,
   uid         text NOT NULL,
   budget_day  date NOT NULL,
   amount_usd  numeric NOT NULL CHECK (amount_usd >= 0),
+  reservation_request_id text,
   settled_at  timestamptz NOT NULL DEFAULT now()
 );
+ALTER TABLE public.lm_provider_voice_settlements
+  ADD COLUMN IF NOT EXISTS reservation_request_id text;
+CREATE UNIQUE INDEX IF NOT EXISTS lm_provider_voice_settlement_reservation_idx
+  ON public.lm_provider_voice_settlements (uid, budget_day, reservation_request_id)
+  WHERE reservation_request_id IS NOT NULL;
 ALTER TABLE public.lm_provider_voice_settlements ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.lm_provider_voice_settlements FORCE ROW LEVEL SECURITY;
 
 -- The user and global rows are locked in one deterministic order. This makes
 -- reservations race-safe across Railway instances; a boolean REST insert is
 -- insufficient because two workers could both pass the pre-read cap check.
+-- The 9-argument function shipped in the first version cannot be replaced with
+-- a different signature in PostgreSQL, so remove it before installing the
+-- version that also receives the atomic daily-cap parameters.
+DROP FUNCTION IF EXISTS public.lm_claim_provider_budget(text, date, text, text, text, numeric, boolean, numeric, numeric);
 CREATE OR REPLACE FUNCTION public.lm_claim_provider_budget(
   p_uid text,
   p_budget_day date,
   p_provider text,
   p_operation text,
   p_request_id text,
   p_projected_usd numeric,
   p_is_voice boolean,
   p_user_voice_cap numeric,
-  p_global_voice_cap numeric
+  p_global_voice_cap numeric,
+  p_daily_cap numeric,
+  p_enforce_daily_cap boolean
 )
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 AS $$
 DECLARE
   v_uid text := nullif(trim(p_uid), '');
   v_day date := coalesce(p_budget_day, current_date);
   v_user_settled numeric := 0;
   v_user_reserved numeric := 0;
   v_global_settled numeric := 0;
   v_global_reserved numeric := 0;
+  v_daily_spend numeric := 0;
+  v_outstanding_reserved numeric := 0;
   v_projected numeric := coalesce(p_projected_usd, 0);
+  v_existing_projected numeric := NULL;
+  v_claimed_request_id text := NULL;
 BEGIN
   IF v_uid IS NULL OR nullif(trim(p_request_id), '') IS NULL OR v_projected < 0 THEN
     RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_claim');
   END IF;
 
+  -- Always create/lock the user row. Non-voice claims use this row as the
+  -- per-user mutex for their atomic daily cap; voice claims also lock global
+  -- after user so every instance observes the same lock order.
+  INSERT INTO lm_provider_voice_buckets(scope, uid, budget_day)
+    VALUES ('user', v_uid, v_day)
+    ON CONFLICT (scope, uid, budget_day) DO NOTHING;
+  SELECT settled_usd, reserved_usd INTO v_user_settled, v_user_reserved
+    FROM lm_provider_voice_buckets
+    WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day
+    FOR UPDATE;
   IF coalesce(p_is_voice, false) THEN
     INSERT INTO lm_provider_voice_buckets(scope, uid, budget_day)
-      VALUES ('user', v_uid, v_day), ('global', '', v_day)
+      VALUES ('global', '', v_day)
       ON CONFLICT (scope, uid, budget_day) DO NOTHING;
-    SELECT settled_usd, reserved_usd INTO v_user_settled, v_user_reserved
-      FROM lm_provider_voice_buckets
-      WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day
-      FOR UPDATE;
     SELECT settled_usd, reserved_usd INTO v_global_settled, v_global_reserved
       FROM lm_provider_voice_buckets
       WHERE scope = 'global' AND uid = '' AND budget_day = v_day
       FOR UPDATE;
   END IF;
 
-  IF EXISTS (
-    SELECT 1 FROM lm_provider_budget_claims
+  SELECT projected_usd INTO v_existing_projected
+    FROM lm_provider_budget_claims
     WHERE uid = v_uid AND budget_day = v_day AND request_id = p_request_id
-  ) THEN
-    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'request_id', p_request_id);
+    FOR SHARE;
+  IF FOUND THEN
+    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'request_id', p_request_id,
+      'projected_usd', v_existing_projected);
+  END IF;
+
+  -- Settled spend is read from the ledger inside this transaction. Unknown
+  -- rows contribute their persisted estimate only; null remains unknown and
+  -- contributes nothing. A call-session estimate is superseded by a known CDR
+  -- for the same reservation, preventing one call from being counted twice.
+  SELECT coalesce(sum(
+    CASE
+      WHEN l.actual_status = 'known' AND l.actual_billed_usd IS NOT NULL THEN l.actual_billed_usd
+      WHEN l.actual_status = 'unknown' THEN coalesce(l.estimated_usd, l.est_usd, 0)
+      ELSE 0
+    END
+  ), 0)
+  INTO v_daily_spend
+  FROM lm_api_cost l
+  WHERE l.uid = v_uid
+    AND l.ts >= v_day::timestamptz
+    AND l.ts < (v_day + 1)::timestamptz
+    AND NOT (
+      l.operation = 'call_session'
+      AND l.actual_status = 'unknown'
+      AND EXISTS (
+        SELECT 1 FROM lm_api_cost cdr
+        WHERE cdr.uid = l.uid
+          AND cdr.operation = 'call_cdr'
+          AND coalesce(cdr.metadata, cdr.meta)->>'reservationRequestId' = l.request_id
+      )
+    );
+
+  -- Non-voice claims remain outstanding until their exact provider request is
+  -- represented in the ledger. Voice claims use the locked bucket, whose
+  -- reserved_usd is released by lm_settle_provider_voice.
+  SELECT coalesce(sum(c.projected_usd), 0)
+  INTO v_outstanding_reserved
+  FROM lm_provider_budget_claims c
+  WHERE c.uid = v_uid
+    AND c.budget_day = v_day
+    AND c.is_voice = false
+    AND NOT EXISTS (
+      SELECT 1 FROM lm_api_cost l
+      WHERE l.uid = c.uid
+        AND l.provider = c.provider
+        AND l.request_id = c.request_id
+    );
+  v_outstanding_reserved := v_outstanding_reserved + CASE WHEN coalesce(p_is_voice, false) THEN v_user_reserved ELSE 0 END;
+
+  IF coalesce(p_enforce_daily_cap, true)
+     AND coalesce(p_daily_cap, 0) > 0
+     AND v_daily_spend + v_outstanding_reserved + v_projected >= p_daily_cap THEN
+    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_provider_cap');
   END IF;
 
   IF coalesce(p_is_voice, false) AND v_user_settled + v_user_reserved + v_projected >= coalesce(p_user_voice_cap, 0) THEN
     RETURN jsonb_build_object('allowed', false, 'reason', 'voice_user_cap');
   END IF;
   IF coalesce(p_is_voice, false) AND v_global_settled + v_global_reserved + v_projected >= coalesce(p_global_voice_cap, 0) THEN
     RETURN jsonb_build_object('allowed', false, 'reason', 'voice_global_cap');
   END IF;
 
   INSERT INTO lm_provider_budget_claims(uid, budget_day, provider, operation, request_id, projected_usd, is_voice)
-    VALUES (v_uid, v_day, coalesce(nullif(trim(p_provider), ''), 'unknown'), coalesce(nullif(trim(p_operation), ''), 'unknown'), p_request_id, v_projected, coalesce(p_is_voice, false));
+    VALUES (v_uid, v_day, coalesce(nullif(trim(p_provider), ''), 'unknown'), coalesce(nullif(trim(p_operation), ''), 'unknown'), p_request_id, v_projected, coalesce(p_is_voice, false))
+    ON CONFLICT (uid, budget_day, request_id) DO NOTHING
+    RETURNING request_id INTO v_claimed_request_id;
+  IF NOT FOUND THEN
+    SELECT projected_usd INTO v_existing_projected
+      FROM lm_provider_budget_claims
+      WHERE uid = v_uid AND budget_day = v_day AND request_id = p_request_id;
+    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'request_id', p_request_id,
+      'projected_usd', coalesce(v_existing_projected, v_projected));
+  END IF;
   IF coalesce(p_is_voice, false) THEN
     UPDATE lm_provider_voice_buckets
       SET reserved_usd = reserved_usd + v_projected, updated_at = now()
       WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day;
     UPDATE lm_provider_voice_buckets
       SET reserved_usd = reserved_usd + v_projected, updated_at = now()
       WHERE scope = 'global' AND uid = '' AND budget_day = v_day;
   END IF;
   RETURN jsonb_build_object('allowed', true, 'duplicate', false, 'request_id', p_request_id);
 END;
@@ -254,32 +338,44 @@ BEGIN
   IF v_uid IS NULL OR nullif(trim(p_request_id), '') IS NULL OR v_amount < 0 THEN
     RETURN jsonb_build_object('settled', false, 'reason', 'invalid_settlement');
   END IF;
   INSERT INTO lm_provider_voice_buckets(scope, uid, budget_day)
     VALUES ('user', v_uid, v_day), ('global', '', v_day)
     ON CONFLICT (scope, uid, budget_day) DO NOTHING;
   PERFORM 1 FROM lm_provider_voice_buckets
     WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day FOR UPDATE;
   PERFORM 1 FROM lm_provider_voice_buckets
     WHERE scope = 'global' AND uid = '' AND budget_day = v_day FOR UPDATE;
-  INSERT INTO lm_provider_voice_settlements(request_id, uid, budget_day, amount_usd)
-    VALUES (p_request_id, v_uid, v_day, v_amount)
+  INSERT INTO lm_provider_voice_settlements(request_id, uid, budget_day, amount_usd, reservation_request_id)
+    VALUES (p_request_id, v_uid, v_day, v_amount, p_reservation_request_id)
     ON CONFLICT (request_id) DO NOTHING;
   IF NOT FOUND THEN
     RETURN jsonb_build_object('settled', true, 'duplicate', true);
   END IF;
   IF p_reservation_request_id IS NOT NULL THEN
     SELECT projected_usd INTO v_reserved FROM lm_provider_budget_claims
       WHERE uid = v_uid AND budget_day = v_day AND request_id = p_reservation_request_id AND is_voice = true;
     v_reserved := coalesce(v_reserved, 0);
   END IF;
   UPDATE lm_provider_voice_buckets
     SET settled_usd = settled_usd + v_amount,
         reserved_usd = greatest(0, reserved_usd - v_reserved), updated_at = now()
     WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day;
   UPDATE lm_provider_voice_buckets
     SET settled_usd = settled_usd + v_amount,
         reserved_usd = greatest(0, reserved_usd - v_reserved), updated_at = now()
     WHERE scope = 'global' AND uid = '' AND budget_day = v_day;
   RETURN jsonb_build_object('settled', true, 'duplicate', false);
 END;
 $$;
+
+-- These functions mutate reservations and billing buckets.  SECURITY DEFINER
+-- must never make them callable by browser roles; only the server-side
+-- service-role key may invoke them.
+REVOKE ALL ON FUNCTION public.lm_claim_provider_budget(text, date, text, text, text, numeric, boolean, numeric, numeric, numeric, boolean)
+  FROM PUBLIC, anon, authenticated;
+GRANT EXECUTE ON FUNCTION public.lm_claim_provider_budget(text, date, text, text, text, numeric, boolean, numeric, numeric, numeric, boolean)
+  TO service_role;
+REVOKE ALL ON FUNCTION public.lm_settle_provider_voice(text, date, text, numeric, text)
+  FROM PUBLIC, anon, authenticated;
+GRANT EXECUTE ON FUNCTION public.lm_settle_provider_voice(text, date, text, numeric, text)
+  TO service_role;
diff --git a/apps/life-manager/scheduler.js b/apps/life-manager/scheduler.js
index ea6cca34f..6e2dc9955 100644
--- a/apps/life-manager/scheduler.js
+++ b/apps/life-manager/scheduler.js
@@ -248,22 +248,24 @@ function langForUser(u) {
 function buildStreamUrl(ev, urgency, lang, name) {
   const base = (process.env.PUBLIC_WSS || "").replace(/\/$/, "");
   const summary = ev.summary || "";
   const dateTime = ev.startIso || "";
   const location = ev.location || "";
   const urg = urgency || "gentle";
   const lg = lang === "ja" ? "ja" : "en";
   const nm = String(name || "").replace(/[\r\n]/g, " ").slice(0, 60); // address the user by name on the call
   const wakeUid = String(ev.wakeUid || "");
   const wakeEventKey = String(ev.wakeEventKey || "");
-  const sig = signCtx([summary, dateTime, location, urg, lg, nm, wakeUid, wakeEventKey]);
+  const reservationRequestId = String(ev.reservationRequestId || "");
+  const sig = signCtx([summary, dateTime, location, urg, lg, nm, wakeUid, wakeEventKey, reservationRequestId]);
   const qs = new URLSearchParams({ summary, dateTime, location, urgency: urg, lang: lg, name: nm, wakeUid, wakeEventKey, sig });
+  if (reservationRequestId) qs.set("reservationRequestId", reservationRequestId);
   return `${base}/ws?${qs.toString()}`;
 }
 
 // LM-30 runs inside the durable 60s wake tick. A non-expired Telegram live location is the sole gate;
 // lm_late_notice_log atomically deduplicates one action per calendar event across restarts.
 async function lateNoticeUserOnce(u, nowMs, deps = {}) {
   const now = nowMs !== undefined ? nowMs : Date.now();
   const configuredSupa = SUPA();
   const supaUrl = deps.supaUrl !== undefined ? deps.supaUrl : configuredSupa.url;
   const supaKey = deps.supaKey !== undefined ? deps.supaKey : configuredSupa.key;
@@ -467,25 +469,27 @@ async function wakeCallOnce(u, nowMs, deps = {}) {
       for (const lvl of due) {
         const eventKey = `${u.uid}|${ev.startIso}|${lvl.min}`;
         // `fresh` is the CLAIM TOKEN (a truthy string) when this tick won the claim — the gate below
         // is unchanged because falsy still means "someone already called". It is carried all the way
         // to releaseWake so a release that arrives late can only delete ITS OWN claim.
         const fresh = await (deps.claimWake || claimWake)(u.uid, eventKey);
         if (!fresh) continue; // already called for this (event, level)
         // A coarser level the call above superseded must never ring later, so it is CLAIMED here and
         // left uncalled — the claim is what stops a future tick from resurrecting it.
         if (lvl !== due[0]) continue;
-        const streamUrl = buildStreamUrl({ ...ev, wakeUid: u.uid, wakeEventKey: eventKey }, lvl.urgency, langForUser(u), u.name);
+        const reservationRequestId = `telnyx:call_session:${Date.now()}:${crypto.randomUUID()}`;
+        const streamUrl = buildStreamUrl({ ...ev, wakeUid: u.uid, wakeEventKey: eventKey, reservationRequestId }, lvl.urgency, langForUser(u), u.name);
         let res;
         try {
           res = await (deps.placeCall || placeCall)({
             to: u.phone, streamUrl, uid: u.uid,
+            requestId: reservationRequestId,
             projectedUsd: Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) > 0
               ? Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) : 0.05,
             authorizeProviderOperation: deps.authorizeProviderOperation || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
               ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
               : undefined),
           });
         } catch (e) {
           res = { ok: false, error: String((e && e.message) || e) };
         }
         if (res.ok) {
diff --git a/apps/life-manager/server.js b/apps/life-manager/server.js
index b0063887f..4831ad01c 100644
--- a/apps/life-manager/server.js
+++ b/apps/life-manager/server.js
@@ -207,29 +207,39 @@ function ctxFromReq(req) {
   const summary = (q.get("summary") || "").slice(0, 200);
   const dateTime = (q.get("dateTime") || "").slice(0, 40);
   const location = (q.get("location") || "").slice(0, 200);
   let urgency = q.get("urgency") || "gentle";
   if (!VALID_URGENCY.has(urgency)) urgency = "gentle";
   let lang = q.get("lang");
   if (lang !== "ja" && lang !== "en") lang = "en"; // call language follows the user (JP→ja, else en)
   const name = (q.get("name") || "").slice(0, 60); // who to address on the call (already sanitized when signed)
   const wakeUid = (q.get("wakeUid") || "").slice(0, 100);
   const wakeEventKey = (q.get("wakeEventKey") || "").slice(0, 300);
+  const reservationRequestId = (q.get("reservationRequestId") || "").slice(0, 200);
   const sig = q.get("sig") || "";
 
   const secret = process.env.LM_CALL_SECRET || "";
-  const expected = crypto.createHmac("sha256", secret).update([summary, dateTime, location, urgency, lang, name, wakeUid, wakeEventKey].join("\n")).digest("base64url");
+  const expected = crypto.createHmac("sha256", secret).update([summary, dateTime, location, urgency, lang, name, wakeUid, wakeEventKey, reservationRequestId].join("\n")).digest("base64url");
   const a = Buffer.from(sig);
   const b = Buffer.from(expected);
-  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
+  let verified = secret && a.length === b.length && crypto.timingSafeEqual(a, b);
+  // Keep already-minted wake URLs valid during a rolling deploy. The legacy
+  // signature had no reservation field; only accept it when the new field is
+  // absent, never as a general fallback for a tampered reservation.
+  if (!verified && !reservationRequestId) {
+    const legacy = crypto.createHmac("sha256", secret).update([summary, dateTime, location, urgency, lang, name, wakeUid, wakeEventKey].join("\n")).digest("base64url");
+    const legacyBuffer = Buffer.from(legacy);
+    verified = secret && a.length === legacyBuffer.length && crypto.timingSafeEqual(a, legacyBuffer);
+  }
+  if (!verified) return null;
 
-  return { event: { summary, start: { dateTime }, location }, urgency, lang, name, wakeUid, wakeEventKey };
+  return { event: { summary, start: { dateTime }, location }, urgency, lang, name, wakeUid, wakeEventKey, reservationRequestId };
 }
 
 const server = http.createServer((req, res) => {
   const path = (req.url || "").split("?")[0];
   if (path === "/api/panel/session/telegram" || path === "/api/panel/session/device") {
     handlePanelRequest(req, res, {
       supaUrl: SUPA_URL, supaKey: SUPA_KEY, token: LM_TG_TOKEN,
       panelOrigin: LM_PANEL_BASE, panelBaseUrl: LM_PANEL_BASE,
       botUsername: process.env.LM_TELEGRAM_BOT_USERNAME,
     }).catch((error) => {
@@ -297,26 +307,26 @@ const server = http.createServer((req, res) => {
       catch { res.writeHead(400); res.end("invalid json"); return; }
       const data = event && event.data;
       const payload = data && data.payload;
       // Telnyx CDR/call-ended deliveries are a production measurement source,
       // not a best-effort dashboard import. Persist one CDR row per event ID
       // before acknowledging the webhook; the provider/request unique index
       // makes redelivery idempotent.
       if (data && payload && /call\.(?:hangup|ended|cost|cdr)/iu.test(String(data.event_type || ""))) {
         const state = decodeCallClientState(payload.client_state);
         const cdrUid = state && state.kind === "wake" ? state.wakeUid : state && state.kind === "test" ? state.testUid : null;
-        const cdrId = payload.id || payload.call_control_id || data.id || crypto.randomUUID();
+        const cdrId = payload.id || payload.call_control_id || data.id || "unknown";
         const cdrRecorded = await recordTelnyxCdr({
           uid: cdrUid,
           requestId: `telnyx:cdr:${String(cdrId)}`,
           durationSeconds: payload.billed_duration || payload.duration_seconds || payload.duration,
-          cdr: payload,
+          cdr: payload, reservationRequestId: state && state.reservationRequestId,
         }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY });
         if (!cdrRecorded && SUPA_URL && SUPA_KEY) {
           res.writeHead(503, { "content-type": "text/plain" });
           res.end("cdr record failed; send it again");
           return;
         }
       }
       if (!data || data.event_type !== "call.machine.detection.ended" || !payload) {
         res.writeHead(200); res.end("ignored"); return;
       }
@@ -472,27 +482,29 @@ const server = http.createServer((req, res) => {
         const lang = resolveCallLang({ callLanguage: u.call_language, phone });
         // Caller may pass a REAL event (summary/location/urgency) so the call + its recording are
         // postable content — NEVER hardcode "test" (the assistant reads the summary aloud). Default = a
         // real morning nudge in the USER's language, not a "test" label.
         const ev = {
           summary: (body.summary || (lang === "ja" ? "次のご予定" : "your next appointment")).toString().slice(0, 200),
           startIso: body.dateTime || new Date(Date.now() + 15 * 60000).toISOString(),
           location: (body.location || "").toString().slice(0, 200),
         };
         const urgency = ["gentle", "firm", "harsh"].includes(body.urgency) ? body.urgency : "gentle";
-        const streamUrl = buildStreamUrl(ev, urgency, lang, u.name);
+        const reservationRequestId = `telnyx:call_session:${Date.now()}:${crypto.randomUUID()}`;
+        const streamUrl = buildStreamUrl({ ...ev, reservationRequestId }, urgency, lang, u.name);
         // spec §3 row 2d: say who this call is. The stream URL cannot carry it — its query is signed
         // by signCtx over a fixed array the /ws bridge re-verifies — so the state rides beside it. An
         // unnamed call is what made the detection webhook return "no wake context" and let every test
         // call that hit a voicemail run to the carrier's 120-second recording limit.
         const result = await placeCall({
-          to: phone, uid: body.uid, streamUrl, clientState: encodeTestCallClientState({ testUid: body.uid }),
+          to: phone, uid: body.uid, streamUrl, requestId: reservationRequestId,
+          clientState: encodeTestCallClientState({ testUid: body.uid, reservationRequestId }),
           projectedUsd: Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) > 0
             ? Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) : 0.05,
           authorizeProviderOperation: SUPA_URL && SUPA_KEY
             ? (input) => authorizeBudget(input, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }) : undefined,
         });
         return reply(result.ok ? 200 : 502, result);
       } catch (e) {
         return reply(502, { error: String(e) });
       }
     })();
@@ -891,21 +903,21 @@ wss.on("connection", (carrierWs, req) => {
     console.error("[bridge] rejected unauthenticated /ws connection");
     try { carrierWs.close(1008, "unauthorized"); } catch {}
     return;
   }
   if (liveCalls >= MAX_CONCURRENT) {
     console.error(`[bridge] at capacity (${liveCalls}/${MAX_CONCURRENT}) — rejecting`);
     try { carrierWs.close(1013, "busy"); } catch {}
     return;
   }
   liveCalls++;
-  const { event, urgency, lang, name, wakeUid, wakeEventKey } = ctx;
+  const { event, urgency, lang, name, wakeUid, wakeEventKey, reservationRequestId } = ctx;
   console.log(`[bridge] carrier connected urgency=${urgency} live=${liveCalls}`);
   const state = { streamSid: null, inFrames: 0, outFrames: 0, setupComplete: false };
 
   // C1 (VCSDD life-manager-cost-connect-reliability): Gemini Live is the DEFAULT — every answered call
   // is a two-way Charon conversation from the first second (no one-way clip). `liveWsOpened` is the
   // measurable Goal-1 invariant (now ≥1 on EVERY answered call, the inverse of the old escalation-only
   // invariant).
   let gemini = null;
   let callStartedAtMs = null;
   let liveWsOpened = 0;
@@ -1025,24 +1037,26 @@ wss.on("connection", (carrierWs, req) => {
   });
   let released = false;
   const release = () => { if (!released) { released = true; liveCalls = Math.max(0, liveCalls - 1); } };
   carrierWs.on("close", () => {
     release();
     console.log(`[bridge] carrier closed in=${state.inFrames} out=${state.outFrames} live_ws_opened=${liveWsOpened} live=${liveCalls}`);
     if (callStartedAtMs != null) {
       const quantity = Math.max(0, (Date.now() - callStartedAtMs) / 1000);
       void writeProviderCost({
         uid: wakeUid || null, provider: "telnyx", sku: "voice", operation: "call_session",
-        requestId: `telnyx:${wakeUid || "anonymous"}:${callStartedAtMs}`, quantity, unit: "seconds",
+        requestId: reservationRequestId || `telnyx:${wakeUid || "anonymous"}:${callStartedAtMs}`, quantity, unit: "seconds",
         pricingVersion: "telnyx-session-estimate-2026-08", estimatedUsd: quantity / 60 * 0.002,
         actualBilledUsd: null, actualStatus: "unknown",
-        metadata: { kind: "telnyx_call", stream_id: state.streamSid || null },
+        metadata: { kind: "telnyx_call", stream_id: state.streamSid || null, reservationRequestId: reservationRequestId || null },
+        legacyKind: "telnyx_call",
+        legacyMeta: { kind: "telnyx_call", stream_id: state.streamSid || null, reservationRequestId: reservationRequestId || null },
       }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }).catch(() => false);
     }
     if (gemini) { try { gemini.close(); } catch {} }
   });
   carrierWs.on("error", release);
 });
 
 // Only bind to the port when this file is run directly (not when required by tests).
 // This allows test files to import inngestServeAllowed without starting the HTTP server.
 if (require.main === module) {
diff --git a/apps/life-manager/test/provider-cost-contract.test.js b/apps/life-manager/test/provider-cost-contract.test.js
index 12ac960c0..61291feca 100644
--- a/apps/life-manager/test/provider-cost-contract.test.js
+++ b/apps/life-manager/test/provider-cost-contract.test.js
@@ -26,20 +26,31 @@ const BASE = {
 
 test("provider cost migration adds complete dimensions and separate actual status/classification", () => {
   const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
   for (const field of ["provider", "sku", "operation", "request_id", "pricing_version", "estimated_usd", "actual_billed_usd", "actual_status"]) {
     assert.match(sql, new RegExp(`add column if not exists ${field}`));
   }
   assert.match(sql, /actual_status/);
   assert.match(sql, /cost_classification/);
   assert.match(sql, /actual_status[^;]+known/);
   assert.match(sql, /lm_provider_cost_failures/);
+  assert.match(sql, /add column if not exists metadata/);
+});
+
+test("voice reservation identity is wired through scheduler, bridge, webhook, and import paths", () => {
+  const server = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
+  const scheduler = fs.readFileSync(path.join(__dirname, "../scheduler.js"), "utf8");
+  const imports = fs.readFileSync(path.join(__dirname, "../lib/provider-cost-imports.js"), "utf8");
+  assert.match(scheduler, /reservationRequestId/);
+  assert.match(server, /reservationRequestId/);
+  assert.match(server, /legacyKind:\s*["']telnyx_call["']/);
+  assert.match(imports, /reservationRequestId/);
 });
 
 test("recordProviderCost records all dimensions and known actual billing", async () => {
   const calls = [];
   const ok = await loadLedger().recordProviderCost({
     ...BASE,
     actualBilledUsd: 0.0042,
     actualStatus: "known",
     costClassification: "measured",
   }, {
@@ -60,20 +71,46 @@ test("recordProviderCost records all dimensions and known actual billing", async
     pricing_version: "maps-2026-01",
     estimated_usd: 0.005,
     actual_billed_usd: 0.0042,
     actual_status: "known",
     cost_classification: "measured",
     est_usd: 0.005,
     metadata: { source: "travel" },
   });
 });
 
+test("a new Telnyx 60-second row preserves legacy summary dimensions alongside provider fields", async () => {
+  const calls = [];
+  const ok = await loadLedger().recordProviderCost({
+    provider: "telnyx", sku: "voice", operation: "call_cdr", uid: "u1", requestId: "cdr-summary-1",
+    quantity: 60, unit: "seconds", pricingVersion: "telnyx-cdr-test-1", estimatedUsd: null,
+    actualBilledUsd: 0.02, actualStatus: "known", costClassification: "measured",
+    metadata: { reservationRequestId: "call-reservation-1" },
+    legacyKind: "telnyx_call", legacyMeta: { kind: "telnyx_call", reservationRequestId: "call-reservation-1" },
+  }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
+  });
+  assert.equal(ok, true);
+  const body = JSON.parse(calls[0][1].body);
+  assert.equal(body.provider, "telnyx");
+  assert.equal(body.operation, "call_cdr");
+  assert.equal(body.kind, "telnyx_call");
+  assert.equal(body.meta.reservationRequestId, "call-reservation-1");
+  const summary = loadLedger().businessSummary(1, [{
+    ts: new Date().toISOString(), uid: body.uid, kind: body.kind, quantity: body.quantity, est_usd: body.est_usd,
+    provider: body.provider, operation: body.operation,
+  }], Date.now());
+  assert.equal(summary.calls, 1);
+  assert.equal(summary.call_minutes, 1);
+});
+
 test("missing provider billing is stored as null/unknown and never coerced to zero", async () => {
   const calls = [];
   const ok = await loadLedger().recordProviderCost({ ...BASE, requestId: "req-unknown" }, {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
   });
   assert.equal(ok, true);
   const body = JSON.parse(calls[0][1].body);
   assert.equal(body.actual_status, "unknown");
   assert.equal(body.cost_classification, "estimated");
diff --git a/apps/life-manager/test/testcall-amd-hangup-http-contract.test.js b/apps/life-manager/test/testcall-amd-hangup-http-contract.test.js
index 8608851c5..63a3506d3 100644
--- a/apps/life-manager/test/testcall-amd-hangup-http-contract.test.js
+++ b/apps/life-manager/test/testcall-amd-hangup-http-contract.test.js
@@ -119,30 +119,33 @@ test("a /test-call that reaches voicemail is hung up on, and writes nothing", as
     const uid = "lm_fixture_uid";
     const sig = crypto.createHmac("sha256", process.env.LM_UID_SECRET).update(uid).digest("base64url");
     const placed = await post("/test-call", JSON.stringify({ uid, sig }));
     assert.equal(placed.status, 200);
     assert.equal(dialBodies.length, 1);
 
     // 2. THE REGRESSION: this dial body used to carry no client_state, which is the entire reason a
     //    test call could never be hung up on.
     const clientState = dialBodies[0].client_state;
     assert.ok(clientState, "a /test-call dial body must carry a client_state");
-    assert.deepEqual(decodeCallClientState(clientState), { kind: "test", testUid: uid });
+    const decodedClientState = decodeCallClientState(clientState);
+    assert.equal(decodedClientState.kind, "test");
+    assert.equal(decodedClientState.testUid, uid);
+    assert.match(decodedClientState.reservationRequestId, /^telnyx:call_session:/);
     assert.equal(dialBodies[0].answering_machine_detection, "detect");
 
     // 3. The stream URL is signed by signCtx over a FIXED ordered array that the /ws bridge verifies
     //    with the same array. Carrying the kind in a new query item would silently change what that
     //    signature covers on one end only, so the query must stay exactly what it was.
     const streamQuery = [...new URL(dialBodies[0].stream_url).searchParams.keys()].sort();
     assert.deepEqual(streamQuery,
-      ["dateTime", "lang", "location", "name", "sig", "summary", "urgency", "wakeEventKey", "wakeUid"],
-      "buildStreamUrl's signed query must not gain items");
+      ["dateTime", "lang", "location", "name", "reservationRequestId", "sig", "summary", "urgency", "wakeEventKey", "wakeUid"],
+      "buildStreamUrl carries only the signed reservation context in addition to the existing query");
 
     // 4. Voicemail → the call is ended, and the response says so rather than "no wake context".
     const machine = await detection({ result: "machine", call_control_id: "v2:fixture-ccid", client_state: clientState });
     assert.equal(machine.status, 200);
     assert.equal(machine.text, "test hangup");
     assert.deepEqual(hangups, ["/v2/calls/v2%3Afixture-ccid/actions/hangup"]);
 
     // 5. A human who pressed "Call me now" and picked up is left alone.
     const human = await detection({ result: "human", call_control_id: "v2:fixture-ccid", client_state: clientState });
     assert.equal(human.status, 200);
