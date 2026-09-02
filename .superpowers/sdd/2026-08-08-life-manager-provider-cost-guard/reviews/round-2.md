# Review package: ffcccdd666ad1cb00c9f58ee8619f3956624c8a1..d22da12c1

## Commits
d22da12c1 docs(life-manager): record review fix receipts
5abcb6cdb test(life-manager): verify persisted geocode estimates
290cf460c test(life-manager): constrain voice budget reads
e6967878d fix(life-manager): atomically guard provider spend
f95183d04 fix(life-manager): record every provider attempt
a14e05c84 fix(life-manager): separate actual status from cost class
d3406be56 fix(life-manager): make route cache writes durable

## Files changed
 .../progress.md                                    |  35 ++++
 apps/life-manager/lib/dial.js                      |  12 +-
 apps/life-manager/lib/geocode-cache.js             |  16 +-
 apps/life-manager/lib/geocode-cache.test.js        |  48 +++++
 apps/life-manager/lib/ledger.js                    |  51 +++++-
 apps/life-manager/lib/mail-resend.js               |  23 ++-
 apps/life-manager/lib/provider-budget.js           | 133 +++++++++++---
 apps/life-manager/lib/provider-budget.test.js      |  91 ++++++++-
 apps/life-manager/lib/provider-cost-adapters.js    |  24 ++-
 .../lib/provider-cost-adapters.test.js             |  25 ++-
 apps/life-manager/lib/provider-cost-imports.js     |  60 ++++++
 .../life-manager/lib/provider-cost-imports.test.js |  21 ++-
 apps/life-manager/lib/route-cache.js               |  40 +++-
 apps/life-manager/lib/route-cache.test.js          |  52 ++++++
 .../lib/transport/calendar-composio.js             |   5 +-
 apps/life-manager/lib/travel.js                    |  16 +-
 .../migrations/2026-08-08-lm-provider-cost.sql     | 203 +++++++++++++++++++--
 apps/life-manager/scheduler.js                     |   2 +
 apps/life-manager/server.js                        |  41 ++++-
 .../test/provider-cost-contract.test.js            |  17 +-
 20 files changed, 814 insertions(+), 101 deletions(-)

## Diff
diff --git a/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
index 84f22c287..fe83cdf2a 100644
--- a/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
+++ b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
@@ -17,20 +17,26 @@
 
 | Slice | Status | RED | GREEN | Commit |
 |---|---|---|---|---|
 | 1. Persistent geocodes | GREEN | missing-module | 6/6 focused + 43/43 baseline | `3381cf717` |
 | 2. Durable route cache | GREEN | original suite + new scope tests | 15/15 route/transit + 62/62 travel regression | `826d2837d` |
 | 3. Transit facts/fallback | GREEN | structured projection + anchor tests | 31/31 transit/route tests; 59/59 combined focused | `19f411f39` |
 | 4. Truthful cost event | GREEN | 5 contract failures (missing API) | 12/12 ledger contract | `062663d73` |
 | 5. Provider instrumentation | GREEN | adapter module/import module missing | 77/77 provider + focused regression | `0c6616b86` |
 | 6. Budget policy | GREEN | missing-module | 12/12 budget/gate + 90/90 full focused | `a7604f2a6` |
 | 7. Owner report/deploy/measure | code-only pending | — | — | — |
+| Review fix 1. Durable route writer | GREEN | 2 route contract failures | 37/37 route/transit | `d3406be56` |
+| Review fix 2. Status/classification | GREEN | 9 ledger/adapter/import failures | 25/25 provider cost | `a14e05c84` |
+| Review fix 3. Google attempts | GREEN | failure-path/request-id contracts | 17/17 geocode/adapters | `f95183d04` |
+| Review fix 4. Atomic budget/voice | GREEN | 2 migration/RPC contracts | 106/106 complete focused | `e6967878d` |
+| Review follow-up. Voice-only read | GREEN | default reader scope gap | 14/14 budget | `290cf460c` |
+| Review follow-up. Persisted estimate | GREEN | persisted-threshold E2E gap | 7/7 geocode | `5abcb6cdb` |
 
 ## Known baseline
 
 `npm ci` completed in `apps/life-manager` (Node dependency audit reported 24 existing npm audit findings; no dependency changes were made).
 
 Focused baseline command:
 
 ```text
 node --test lib/travel-transit-wire.test.js lib/transit.test.js lib/route-cache.test.js lib/travel-routes.test.js lib/ledger.test.js lib/composio-budget.test.js
 ```
@@ -78,10 +84,39 @@ Result: 43/43 passed, 0 failed, 0 skipped (2026-08-08).
 - GREEN (scheduled imports): `provider-cost-imports.js` imports Telnyx CDR actuals and Railway/Supabase allocations; loader failures return a failure receipt and write no synthetic zero row. `node --test lib/provider-cost-imports.test.js` → 3/3 passed.
 - GREEN focused verification: `node --test lib/provider-cost-adapters.test.js lib/provider-cost-imports.test.js lib/composio-budget.test.js lib/mail-resend.test.js lib/ledger.test.js lib/travel-transit-wire.test.js lib/transit.test.js lib/route-cache.test.js lib/travel-routes.test.js test/provider-cost-contract.test.js` → 77/77 passed.
 
 ## Task 6 receipt
 
 - RED: `node --test lib/provider-budget.test.js` failed at module load with `Cannot find module './provider-budget.js'`.
 - GREEN: pure policy covers normal/warning/degraded/stopped thresholds at `$0.50/$1.00/$2.00`, preserves unknown billing as a reason, and enforces independent user/global voice caps.
 - GREEN: cached route/calendar/geocode reads bypass budget reads; denied Google geocoding/fallback, nonessential Composio refresh, and Telnyx calls make zero paid-provider requests. Gemini Live checks the gate before opening a session.
 - GREEN: migration adds unique `(uid,budget_day,request_id)` atomic claim identity; `claimProviderBudget` provides the service-role insert seam.
 - Verification: `node --test lib/provider-budget.test.js test/provider-budget-gate.test.js` → 12/12 passed; the complete plan verification command (baseline + geocode + cost adapters/imports + budget + all contract tests) → 90/90 passed. The original pre-change baseline remains the recorded 43/43; the 54/54 route/ledger/Composio run includes the Task 5 Composio assertion added afterward.
+
+## Fresh review fix 1 receipt — durable route writer
+
+- RED: added route-store contract tests failed because `uid/from_geo/to_geo/time_bucket/duration_secs` were sent as NULL and the cache ignored a `set()` false result (2 failures).
+- GREEN: `node --test lib/route-cache.test.js lib/travel-transit-wire.test.js lib/travel-routes.test.js` → 37/37 passed.
+- Route records now carry canonical uid/geos/time bucket through the cache boundary; the REST writer serializes legacy `text` geos, rejects incomplete NOT NULL rows, uses `on_conflict=cache_key`, and propagates failed durable writes instead of returning an unpersisted result.
+- Migration replaces the prior partial cache-key index with a non-partial unique index usable by Supabase conflict resolution. Cross-instance contention and failed writes are covered by tests.
+
+## Fresh review fix 2 receipt — actual status contract and SKU estimates
+
+- RED: contract tests rejected the old `measured|estimated|unknown` status model and exposed missing `cost_classification`/legacy `est_usd` dual writes (9 failures across ledger/adapters/imports).
+- GREEN: `node --test lib/provider-cost-adapters.test.js lib/provider-cost-imports.test.js lib/ledger.test.js test/provider-cost-contract.test.js` → 25/25 passed.
+- `actual_status` is now only `known|unknown`; measured/estimated/fixed/unknown move to `cost_classification`. The migration normalizes prior rows before installing both checks.
+- Provider writes include `cost_classification` and atomically dual-write `estimated_usd` plus legacy `est_usd`. Google Geocoding, Routes, and Directions Transit have versioned non-zero per-SKU projections; Telnyx/imported allocations use `known` + `measured` when an actual amount exists.
+
+## Fresh review fix 3 receipt — Google attempt accounting
+
+- RED: added failure-path and request-identity tests required a geocode ledger row for empty/HTTP-error/thrown responses and distinct IDs for concurrent Google SKUs.
+- GREEN: `node --test lib/geocode-cache.test.js lib/provider-cost-adapters.test.js` → 17/17 passed.
+- Geocoding records exactly once immediately before each actual Google request, including failures and empty results; cache hits and budget-denied calls remain unrecorded. Routes/legacy Transit and free transit plan/guidance now append a UUID to every actual-attempt request ID, preventing provider/request uniqueness collisions.
+
+## Fresh review fix 4 receipt — atomic budget/voice claims and production wiring
+
+- RED: migration/RPC tests failed because budget claims were an optional REST insert and there were no voice reservation/settlement buckets (2 failures).
+- GREEN: complete focused guard suite → 106/106 passed.
+- Added `lm_provider_voice_buckets`, idempotent settlements, and transactional `lm_claim_provider_budget`/`lm_settle_provider_voice` RPCs. The claim locks user then global daily buckets and atomically accounts for reservations; known Telnyx CDRs settle actuals without turning unknown into zero.
+- Production authorization now claims every billable provider operation with a unique request ID and non-zero projection (Telnyx default `$0.05`, Gemini `$0.023`, Google SKU defaults, Composio/Resend defaults); cache-hit exits before reads/claims. Telnyx dial, Gemini Live, Composio, Resend, CDR webhook/imports, Railway/Supabase scheduled measurement loaders are wired.
+- Follow-up regression: the default voice reader now passes `voiceOnly=true` to the ledger query (not just the in-memory aggregation), and its URL filter is covered by `node --test lib/provider-budget.test.js` → 14/14.
+- Follow-up persisted-threshold regression: an empty Google response through the real ledger writer stores `estimated_usd > 0`, `actual_billed_usd = null`, and `actual_status = unknown`; `node --test lib/geocode-cache.test.js` → 7/7.
diff --git a/apps/life-manager/lib/dial.js b/apps/life-manager/lib/dial.js
index 476aa68b9..ace1e476d 100644
--- a/apps/life-manager/lib/dial.js
+++ b/apps/life-manager/lib/dial.js
@@ -1,16 +1,17 @@
 // lib/dial.js — place a Telnyx Call Control call whose media streams to OUR bridge (/ws), so the
 // answered call is bridged to Gemini Live (Charon). Reuses the proven body builders in call-logic.js
 // (same ones runner-telnyx.mjs uses locally). No cloudflared: streamUrl is this service's stable
 // Railway public wss. Returns { ok, ccid } | { ok:false, error }.
 "use strict";
 
+const crypto = require("node:crypto");
 const { telnyxDialBody, telnyxStreamingStartBody } = require("./call-logic.js");
 const { amdEnabled } = require("./answered.js");
 const { encodeWakeClientState } = require("./telnyx-webhook.js");
 
 const TELNYX = "https://api.telnyx.com/v2";
 
 function authHeaders(apiKey) {
   return { Authorization: `Bearer ${apiKey || process.env.TELNYX_API_KEY}`, "Content-Type": "application/json" };
 }
 
@@ -49,29 +50,34 @@ function amdDialOptions(streamUrl, env = process.env, opts = {}) {
     webhook_url: `${webhookProtocol}//${url.host}/telnyx-events`,
     webhook_url_method: "POST",
     ...(clientState ? { client_state: clientState } : {}),
   };
 }
 
 // to: E.164 callee. streamUrl: wss://<this-svc>/ws?summary=...&dateTime=...&location=...&urgency=...
 // clientState: OPTIONAL, for a caller whose identity is not in the stream URL (/test-call). Omitted,
 // the wake path derives it from the URL exactly as before.
 // Returns the call_control_id so the caller can issue record_start / streaming_start.
-async function placeCall({ to, streamUrl, clientState, uid, authorizeProviderOperation, projectedUsd }) {
+async function placeCall({ to, streamUrl, clientState, uid, authorizeProviderOperation, projectedUsd, requestId }) {
   const API = process.env.TELNYX_API_KEY;
   const CONN = process.env.TELNYX_CONNECTION_ID;
   const FROM = process.env.TELNYX_PHONE_NUMBER;
   if (!API || !CONN || !FROM) return { ok: false, error: "telnyx env missing (API/CONN/FROM)" };
   if (!to || !streamUrl) return { ok: false, error: "to/streamUrl required" };
+  const callRequestId = requestId || `telnyx:call_session:${Date.now()}:${crypto.randomUUID()}`;
+  const callProjection = Number.isFinite(Number(projectedUsd)) && Number(projectedUsd) > 0
+    ? Number(projectedUsd)
+    : Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) > 0 ? Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) : 0.05;
   if (typeof authorizeProviderOperation === "function") {
     const decision = await authorizeProviderOperation({
-      uid, provider: "telnyx", operation: "call_session", essential: true, cacheHit: false, projectedUsd,
+      uid, provider: "telnyx", operation: "call_session", essential: true, cacheHit: false,
+      requestId: callRequestId, projectedUsd: callProjection,
     });
     if (decision && decision.allowed === false) return { ok: false, error: `provider budget denied: ${decision.reason || "stopped"}` };
   }
 
   // Preflight: never dial on an empty balance (a mid-call cutoff is a fake "connected").
   const usd = await balanceUsd().catch(() => NaN);
   if (!Number.isFinite(usd) || usd < 0.5) return { ok: false, error: `telnyx balance too low ($${usd})` };
 
   const dialBody = {
     ...telnyxDialBody({ connectionId: CONN, to, from: FROM, streamUrl }),
@@ -82,21 +88,21 @@ async function placeCall({ to, streamUrl, clientState, uid, authorizeProviderOpe
     call = await txPost("/calls", dialBody);
   } catch (e) {
     return { ok: false, error: String(e.message || e) };
   }
   const ccid = call && call.data && call.data.call_control_id;
   if (!ccid) return { ok: false, error: "no call_control_id" };
 
   // NOTE: do NOT record_start here — the call is still RINGING (not answered), so Telnyx rejects
   // record_start ("call is not in a valid state"). Recording is started by the bridge the moment the
   // media `start` frame arrives (= call answered). See startRecording() + the server.js start handler.
-  return { ok: true, ccid };
+  return { ok: true, ccid, requestId: callRequestId };
 }
 
 // Start mp3 recording on an ANSWERED call. Telnyx record_start requires the call to be active
 // (media streaming) — fire this from the bridge's Telnyx `start` frame, NOT right after dial.
 // Returns { ok:true } or { ok:false, error } so the caller can LOG it (never silently swallowed).
 async function startRecording(ccid) {
   if (!ccid) return { ok: false, error: "no ccid" };
   try {
     await txPost(`/calls/${encodeURIComponent(ccid)}/actions/record_start`, { format: "mp3", channels: "single" });
     return { ok: true };
diff --git a/apps/life-manager/lib/geocode-cache.js b/apps/life-manager/lib/geocode-cache.js
index cb2a89e20..ae4984e41 100644
--- a/apps/life-manager/lib/geocode-cache.js
+++ b/apps/life-manager/lib/geocode-cache.js
@@ -1,18 +1,19 @@
 // Persistent address -> coordinate cache used by the cloud travel filler.
 //
 // Coordinates are a shared fact about an address, not a user-owned event.  The
 // cache therefore uses a canonical address key and is protected by the
 // backend's service-role-only Supabase table.  A process-local Map remains a
 // read-through optimization; it is never the production source of truth.
 "use strict";
 
+const crypto = require("node:crypto");
 const DEFAULT_TABLE = "lm_geocode_cache";
 const { recordGoogleGeocoding } = require("./provider-cost-adapters.js");
 
 function normalizeGeocodeAddress(value) {
   if (value == null) return "";
   return String(value)
     .normalize("NFKC")
     .replace(/\s+/gu, " ")
     .trim()
     .toLocaleLowerCase("en-US");
@@ -154,44 +155,45 @@ async function geocodeAddress(addr, mapsKey, {
     }
   }
 
   if (typeof authorizeProviderOperation === "function") {
     const decision = await authorizeProviderOperation({
       uid, provider: "google", operation: "geocoding", essential: false, cacheHit: false,
     });
     if (decision && decision.allowed === false) return null;
   }
   if (typeof fetchImpl !== "function") return null;
+  const attemptId = requestId || `google:geocoding:${Date.now()}:${crypto.randomUUID()}`;
   try {
     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${encodeURIComponent(mapsKey)}`;
+    // Charge/record the attempt before the network call. This preserves one
+    // truthful ledger event when Google returns an empty result, HTTP error, or
+    // throws before a response exists. Cache hits and budget-denied calls stay
+    // above this point and therefore remain free.
+    if (typeof recordProviderCost === "function") {
+      await recordGoogleGeocoding({ uid, requestId: attemptId, metadata: { cache: "miss" } }, { recordProviderCost }).catch(() => false);
+    }
     const response = await fetchImpl(url);
     if (!response || !response.ok) return null;
     const json = await response.json();
     const location = json && Array.isArray(json.results) && json.results[0]
       && json.results[0].geometry && json.results[0].geometry.location;
     const value = validValue({
       lat: location && location.lat,
       lng: location && (location.lng == null ? location.lon : location.lng),
       provider: "google_geocoding",
       resolvedAt: now(),
     });
     if (!value) return null;
     const geo = { lat: value.lat, lon: value.lng };
     processMemo.set(addressKey, geo);
     if (store && typeof store.put === "function") await Promise.resolve(store.put(addressKey, value)).catch(() => false);
-    if (typeof recordProviderCost === "function") {
-      await recordGoogleGeocoding({
-        uid,
-        requestId: requestId || `google:geocoding:${addressKey}`,
-        metadata: { cache: "miss" },
-      }, { recordProviderCost }).catch(() => false);
-    }
     return geo;
   } catch {
     return null;
   }
 }
 
 function clearGeocodeProcessMemo() {
   processMemo.clear();
 }
 
diff --git a/apps/life-manager/lib/geocode-cache.test.js b/apps/life-manager/lib/geocode-cache.test.js
index 402d2d67a..505525e32 100644
--- a/apps/life-manager/lib/geocode-cache.test.js
+++ b/apps/life-manager/lib/geocode-cache.test.js
@@ -1,20 +1,21 @@
 "use strict";
 
 const { test } = require("node:test");
 const assert = require("node:assert/strict");
 
 const {
   normalizeGeocodeAddress,
   createSupabaseGeocodeStore,
   geocodeAddress,
 } = require("./geocode-cache.js");
+const { recordProviderCost } = require("./ledger.js");
 
 const SUPA = { supaUrl: "https://supa.invalid", supaKey: "service-role-key" };
 
 function response(body, status = 200) {
   return { ok: status >= 200 && status < 300, status, json: async () => body };
 }
 
 function persistentFetch() {
   const rows = new Map();
   const calls = [];
@@ -101,18 +102,65 @@ test("empty or failed Google responses remain misses and are never persisted", a
   };
 
   assert.equal(await geocodeAddress("empty place", "maps-key", { store, fetchImpl: googleFetch }), null);
   assert.equal(await geocodeAddress("empty place", "maps-key", { store, fetchImpl: googleFetch }), null);
   assert.equal(await geocodeAddress("failed place", "maps-key", { store, fetchImpl: googleFetch }), null);
   assert.equal(googleCalls, 3);
   assert.equal(db.rows.size, 0);
   assert.equal(db.calls.filter((call) => call.init.method === "POST").length, 0);
 });
 
+test("every attempted Google geocode is recorded once, including empty, HTTP failure, and thrown requests", async () => {
+  const events = [];
+  let calls = 0;
+  const fetchImpl = async () => {
+    calls += 1;
+    if (calls === 1) return response({ results: [] });
+    if (calls === 2) return response({ status: "REQUEST_DENIED", results: [] }, 403);
+    throw new Error("network down");
+  };
+  const recordProviderCost = async (event) => { events.push(event); return true; };
+  const common = { fetchImpl, recordProviderCost, uid: "u1", store: new Map() };
+  assert.equal(await geocodeAddress("unique-empty-guard-place", "maps-key", common), null);
+  assert.equal(await geocodeAddress("unique-http-guard-place", "maps-key", common), null);
+  assert.equal(await geocodeAddress("unique-throw-guard-place", "maps-key", common), null);
+  assert.equal(calls, 3);
+  assert.equal(events.length, 3);
+  assert.equal(new Set(events.map((event) => event.requestId)).size, 3);
+  assert.ok(events.every((event) => event.actualStatus === "unknown" && event.actualBilledUsd === null));
+  assert.ok(events.every((event) => event.estimatedUsd > 0 && event.costClassification === "estimated"));
+});
+
+test("an empty Google response persists a nonzero SKU estimate with nullable unknown actual billing", async () => {
+  const ledgerWrites = [];
+  const result = await geocodeAddress("persisted-empty-geocode-guard", "maps-key", {
+    store: new Map(),
+    fetchImpl: async (url, init = {}) => {
+      if (init.method === "POST") {
+        ledgerWrites.push(JSON.parse(init.body));
+        return response([], 201);
+      }
+      return response({ results: [] });
+    },
+    recordProviderCost: (event) => recordProviderCost(event, {
+      supaUrl: "https://db.example", supaKey: "service",
+      fetchImpl: async (url, init = {}) => {
+        ledgerWrites.push(JSON.parse(init.body));
+        return response([], 201);
+      },
+    }),
+  });
+  assert.equal(result, null);
+  assert.equal(ledgerWrites.length, 1);
+  assert.ok(ledgerWrites[0].estimated_usd > 0);
+  assert.equal(ledgerWrites[0].actual_billed_usd, null);
+  assert.equal(ledgerWrites[0].actual_status, "unknown");
+});
+
 test("cache keys carry no tenant identity or caller-controlled query fragments", async () => {
   const db = persistentFetch();
   const store = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
   await store.get("Tenant A\n1 Main & Home");
   const request = db.calls[0];
   assert.equal(request.url.searchParams.get("address_key"), "eq.tenant a 1 main & home");
   assert.equal(request.url.searchParams.has("uid"), false);
 });
diff --git a/apps/life-manager/lib/ledger.js b/apps/life-manager/lib/ledger.js
index c87d1ab4e..4db71105f 100644
--- a/apps/life-manager/lib/ledger.js
+++ b/apps/life-manager/lib/ledger.js
@@ -1,17 +1,21 @@
 "use strict";
 
 function headers(key, extra) {
   return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
 }
 
-const ACTUAL_STATUS = new Set(["measured", "estimated", "unknown"]);
+// `actualStatus` answers only whether a provider invoice/measurement exists.
+// The way a number was obtained lives in `costClassification` so an estimate
+// can never masquerade as a known billed amount.
+const ACTUAL_STATUS = new Set(["known", "unknown"]);
+const COST_CLASSIFICATION = new Set(["measured", "estimated", "fixed", "unknown"]);
 
 function nonEmpty(value, field) {
   const text = value == null ? "" : String(value).trim();
   if (!text) throw new Error(`${field} is required`);
   return text;
 }
 
 function nonNegative(value, field, { nullable = false } = {}) {
   if (value == null && nullable) return null;
   const number = Number(value);
@@ -23,32 +27,45 @@ function validateProviderCostEvent(input = {}) {
   const provider = nonEmpty(input.provider, "provider");
   const sku = nonEmpty(input.sku, "sku");
   const operation = nonEmpty(input.operation, "operation");
   const requestId = nonEmpty(input.requestId, "requestId");
   const unit = nonEmpty(input.unit, "unit");
   const pricingVersion = nonEmpty(input.pricingVersion, "pricingVersion");
   const quantity = nonNegative(input.quantity, "quantity");
   const estimatedUsd = nonNegative(input.estimatedUsd, "estimatedUsd", { nullable: true });
   const actualBilledUsd = nonNegative(input.actualBilledUsd, "actualBilledUsd", { nullable: true });
   const actualStatus = input.actualStatus == null
-    ? (actualBilledUsd == null ? "unknown" : "measured")
+    ? (actualBilledUsd == null ? "unknown" : "known")
     : String(input.actualStatus);
   if (!ACTUAL_STATUS.has(actualStatus)) throw new Error(`actualStatus must be one of ${Array.from(ACTUAL_STATUS).join(", ")}`);
-  if (actualStatus === "measured" && actualBilledUsd == null) throw new Error("measured billing requires actualBilledUsd");
-  if (actualStatus !== "measured" && actualBilledUsd != null) throw new Error("non-measured billing must keep actualBilledUsd null");
-  if (actualStatus === "estimated" && estimatedUsd == null) throw new Error("estimated billing requires estimatedUsd");
+  if (actualStatus === "known" && actualBilledUsd == null) throw new Error("known billing requires actualBilledUsd");
+  if (actualStatus === "unknown" && actualBilledUsd != null) throw new Error("unknown billing must keep actualBilledUsd null");
+  const costClassification = input.costClassification == null
+    ? (actualBilledUsd != null ? "measured" : estimatedUsd != null ? "estimated" : "unknown")
+    : String(input.costClassification);
+  if (!COST_CLASSIFICATION.has(costClassification)) {
+    throw new Error(`costClassification must be one of ${Array.from(COST_CLASSIFICATION).join(", ")}`);
+  }
+  if (costClassification === "measured" && actualBilledUsd == null) throw new Error("measured classification requires actualBilledUsd");
+  if (costClassification === "estimated" && estimatedUsd == null) throw new Error("estimated classification requires estimatedUsd");
+  if (costClassification === "fixed" && actualBilledUsd == null && estimatedUsd == null) {
+    throw new Error("fixed classification requires actualBilledUsd or estimatedUsd");
+  }
+  if (actualStatus === "known" && !["measured", "fixed"].includes(costClassification)) {
+    throw new Error("known billing must use measured or fixed classification");
+  }
   const metadata = input.metadata == null ? {} : input.metadata;
   if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("metadata must be an object");
   return {
     uid: input.uid == null ? null : String(input.uid),
     provider, sku, operation, requestId, quantity, unit, pricingVersion,
-    estimatedUsd, actualBilledUsd, actualStatus,
+    estimatedUsd, actualBilledUsd, actualStatus, costClassification,
     metadata,
   };
 }
 
 function failureShape(event, error) {
   return {
     kind: "provider_cost_ledger_write_failed",
     provider: event.provider,
     sku: event.sku,
     operation: event.operation,
@@ -118,39 +135,57 @@ async function recordProviderCost(input = {}, opts = {}) {
   const body = {
     uid: event.uid,
     provider: event.provider,
     sku: event.sku,
     operation: event.operation,
     request_id: event.requestId,
     quantity: event.quantity,
     unit: event.unit,
     pricing_version: event.pricingVersion,
     estimated_usd: event.estimatedUsd,
+    // Keep the old reader column populated in the same insert while the
+    // additive migration rolls through mixed deployments.
+    est_usd: event.estimatedUsd,
     actual_billed_usd: event.actualBilledUsd,
     actual_status: event.actualStatus,
+    cost_classification: event.costClassification,
     metadata: event.metadata,
   };
   // Existing daily/financial readers still understand the legacy kind/meta pair. Emit it only for
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
       const error = new Error(`Supabase provider cost insert failed (${response && response.status})`);
       error.status = response && response.status;
       throw error;
     }
+    if (event.provider === "telnyx" && event.actualStatus === "known" && event.actualBilledUsd != null && event.operation === "call_cdr") {
+      try {
+        const { settleProviderVoice } = require("./provider-budget.js");
+        const settled = await settleProviderVoice({
+          uid: event.uid,
+          requestId: event.requestId,
+          actualBilledUsd: event.actualBilledUsd,
+          reservationRequestId: event.metadata && event.metadata.reservationRequestId,
+        }, opts);
+        if (!settled) (opts.log || console.error)("[ledger] voice settlement failed", event.requestId);
+      } catch (settlementError) {
+        try { (opts.log || console.error)("[ledger] voice settlement failed", settlementError && settlementError.message); } catch { /* best effort */ }
+      }
+    }
     return true;
   } catch (error) {
     await emitProviderCostFailure(event, error, opts);
     return false;
   }
 }
 
 // Best-effort cost persistence. Ledger failures must never break a call or scheduler tick.
 async function recordCost({ uid, kind, quantity, unit, estUsd, meta } = {}, opts = {}) {
   const supaUrl = opts.supaUrl || process.env.SUPABASE_URL;
@@ -208,21 +243,21 @@ async function recordDailyComposioPoll(uid, opts = {}) {
     });
     if (!response.ok) throw new Error(`Supabase daily lookup failed (${response.status})`);
     const rows = await response.json().catch(() => []);
     if (Array.isArray(rows) && rows.length > 0) return false;
     // The migrated daily row carries legacy kind explicitly, so the existing indexed query remains
     // the single duplicate guard while provider dimensions are added to the same insert.
     return recordProviderCost({
       uid, provider: "composio", sku: "calendar_poll", operation: "daily_poll",
       requestId: `composio:daily_poll:${uid}:${dayStart.toISOString().slice(0, 10)}`,
       quantity: 1, unit: "day", pricingVersion: "composio-2026-08",
-      estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown",
+      estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown", costClassification: "unknown",
       metadata: { day: dayStart.toISOString().slice(0, 10) },
       legacyKind: "composio_poll", legacyMeta: { day: dayStart.toISOString().slice(0, 10) },
     }, { supaUrl, supaKey, fetchImpl, log });
   } catch (error) {
     log("[ledger] composio daily aggregation failed", error && error.message ? error.message : error);
     return false;
   }
 }
 
 async function monthlyComposioCallCount(opts = {}) {
@@ -297,17 +332,19 @@ function businessSummary(daysBack, rows, nowMs) {
   summary.call_minutes = rounded(summary.call_minutes);
   summary.est_cost_usd = rounded(summary.est_cost_usd);
   for (const item of Object.values(summary.per_uid)) {
     item.call_minutes = rounded(item.call_minutes);
     item.est_cost_usd = rounded(item.est_cost_usd);
   }
   return summary;
 }
 
 module.exports = {
+  ACTUAL_STATUS,
+  COST_CLASSIFICATION,
   recordCost,
   recordProviderCost,
   validateProviderCostEvent,
   recordDailyComposioPoll,
   monthlyComposioCallCount,
   businessSummary,
 };
diff --git a/apps/life-manager/lib/mail-resend.js b/apps/life-manager/lib/mail-resend.js
index 3c3040a50..dd6598015 100644
--- a/apps/life-manager/lib/mail-resend.js
+++ b/apps/life-manager/lib/mail-resend.js
@@ -1,32 +1,41 @@
 "use strict";
+const crypto = require("node:crypto");
 // Own-domain email for the WEB ask/reply loop. We NEVER read the user's Gmail — we SEND from our own
 // verified domain via Resend, and route replies back via a short opaque token in the Reply-To local-part
 // (reply+<token>@reply.aniccaai.com → Cloudflare Email Routing → POST /inbound-email, which looks the token
 // up in lm_ask_log). Flat cost, no per-user fee, no Google restricted-scope CASA. The CALLER generates the
 // token (newReplyToken) and stores token→(uid,eventId) before sending. Telegram users don't use this at all.
 const FROM = process.env.LM_MAIL_FROM || "Life Manager <hello@aniccaai.com>";
 const REPLY_DOMAIN = process.env.LM_REPLY_DOMAIN || "reply.aniccaai.com";
 const RESEND_URL = "https://api.resend.com/emails";
 const { recordResendSend } = require("./provider-cost-adapters.js");
+const { authorizeProviderOperation: authorizeBudget } = require("./provider-budget.js");
 
 // reply+<token>@reply.aniccaai.com — the catch-all inbound address. Local part = 6 + 22 = 28 chars (< 64).
 function replyToFor(token) {
   return `reply+${token}@${REPLY_DOMAIN}`;
 }
 
 // Low-level Resend send. Fail-closed (no key / no recipient → {sent:false}), never throws.
-async function resendSend({ to, subject, text, replyTo, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost, costRequestId }) {
+async function resendSend({ to, subject, text, replyTo, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost, costRequestId, authorizeProviderOperation }) {
   if (!resendKey) return { sent: false, error: "no RESEND_API_KEY" };
   if (!to || (Array.isArray(to) && to.length === 0) || !subject) return { sent: false, error: "missing to/subject" };
   const f = fetchImpl || fetch;
   const recipientCount = Array.isArray(to) ? to.length : 1;
+  const requestId = costRequestId || idempotencyKey || `resend:send:${uid || "anonymous"}:${Date.now()}:${crypto.randomUUID()}`;
+  const budgetGate = authorizeProviderOperation || (uid != null && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
+    ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY }) : undefined);
+  if (typeof budgetGate === "function") {
+    const decision = await budgetGate({ uid, provider: "resend", operation: "send", essential: false, cacheHit: false, requestId, projectedUsd: 0.001 });
+    if (decision && decision.allowed === false) return { sent: false, error: `provider budget denied: ${decision.reason || "stopped"}` };
+  }
   let responseId;
   const costRecorder = typeof recordProviderCost === "function"
     ? recordProviderCost
     : (uid != null && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
       ? (event) => recordResendSend(event, {
         supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
       })
       : null);
   try {
     const r = await f(RESEND_URL, {
@@ -34,46 +43,46 @@ async function resendSend({ to, subject, text, replyTo, resendKey, fetchImpl, id
       headers: {
         Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json",
         ...(idempotencyKey ? { "Idempotency-Key": String(idempotencyKey) } : {}),
       },
       body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, text, reply_to: replyTo }),
     });
     const d = await r.json().catch(() => ({}));
     responseId = d.id;
     const result = { sent: !!r.ok, id: d.id, status: r.status, error: r.ok ? undefined : (d.message || `http ${r.status}`) };
     if (costRecorder) {
-      await recordResendSend({ uid, requestId: costRequestId || idempotencyKey, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
+      await recordResendSend({ uid, requestId, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
     }
     return result;
   } catch (e) {
     if (costRecorder) {
-      await recordResendSend({ uid, requestId: costRequestId || idempotencyKey, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
+      await recordResendSend({ uid, requestId, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
     }
     return { sent: false, error: String(e) };
   }
 }
 
 // Ask the USER where an event is. Reply-To carries the signed token → their reply hits /inbound-email,
 // which parses the token, matches the event, and patches the calendar.
-async function sendAsk({ to, replyToken, event, resendKey, fetchImpl, uid, recordProviderCost }) {
+async function sendAsk({ to, replyToken, event, resendKey, fetchImpl, uid, recordProviderCost, authorizeProviderOperation }) {
   const name = (event && event.summary) || "your event";
   const subject = `Where is “${name}”?`;
   const text =
     `Hi — I'm setting up travel time for “${name}”, but I can't find where it is.\n\n` +
     `Just reply to this email with the address or place name, and I'll add it to your calendar and call you in time.\n\n— Life Manager`;
-  return resendSend({ to, subject, text, replyTo: replyToFor(replyToken), resendKey, fetchImpl, uid, recordProviderCost });
+  return resendSend({ to, subject, text, replyTo: replyToFor(replyToken), resendKey, fetchImpl, uid, recordProviderCost, authorizeProviderOperation });
 }
 
 // Tell the ATTENDEES the user is running late. Sent from our domain "on behalf of <userName>"; Reply-To is
 // the user's REAL email so attendee replies reach the human directly.
-async function sendLateNotice({ toAttendees, userName, event, etaMinutes, userEmail, resendKey, fetchImpl, bodySnapshot, idempotencyKey, uid, recordProviderCost }) {
+async function sendLateNotice({ toAttendees, userName, event, etaMinutes, userEmail, resendKey, fetchImpl, bodySnapshot, idempotencyKey, uid, recordProviderCost, authorizeProviderOperation }) {
   const name = (event && event.summary) || "the meeting";
   const who = userName || "Your contact";
   const subject = `Running late: ${name}`;
   const eta = Number.isFinite(etaMinutes) ? `about ${etaMinutes} minutes` : "a little";
   const text = bodySnapshot ||
     `Hi — ${who} is running ${eta} late to “${name}” and wanted you to know.\n\n` +
     `(Sent automatically by Life Manager on ${who}'s behalf — reply to reach ${who} directly.)`;
-  return resendSend({ to: toAttendees, subject, text, replyTo: userEmail, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost });
+  return resendSend({ to: toAttendees, subject, text, replyTo: userEmail, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost, authorizeProviderOperation });
 }
 
 module.exports = { sendAsk, sendLateNotice, resendSend, replyToFor, FROM, REPLY_DOMAIN };
diff --git a/apps/life-manager/lib/provider-budget.js b/apps/life-manager/lib/provider-budget.js
index 9552dd46e..3b4a9094c 100644
--- a/apps/life-manager/lib/provider-budget.js
+++ b/apps/life-manager/lib/provider-budget.js
@@ -1,30 +1,61 @@
 "use strict";
 
+const crypto = require("node:crypto");
+
 const DEFAULT_THRESHOLDS = Object.freeze({
   warningUsd: 0.5,
   degradedUsd: 1,
   stoppedUsd: 2,
   voiceUserCapUsd: 1,
   voiceGlobalCapUsd: 5,
 });
 
 function finiteUsd(value) {
   const number = Number(value);
   return Number.isFinite(number) && number >= 0 ? number : 0;
 }
 
 function countUnknown(value) {
   const number = Number(value);
   return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
 }
 
+function isVoiceOperation(provider, operation) {
+  const p = String(provider || "").toLowerCase();
+  const o = String(operation || "").toLowerCase();
+  return p === "telnyx" || p === "gemini" || o.includes("voice") || o.includes("call") || o === "session";
+}
+
+function isClaimableProvider(provider) {
+  // Transit is the explicitly free path. All other provider operations that
+  // leave the process receive an idempotent projected-spend claim.
+  return String(provider || "").toLowerCase() !== "transit";
+}
+
+function projectedFor(input = {}) {
+  const explicit = Number(input.projectedUsd);
+  if (Number.isFinite(explicit) && explicit > 0) return explicit;
+  const provider = String(input.provider || "").toLowerCase();
+  if (provider === "telnyx") return 0.05;
+  if (provider === "gemini") return 0.023;
+  if (provider === "google") return input.operation === "geocoding" ? 0.005 : 0.01;
+  if (provider === "composio") return 0.01;
+  if (provider === "resend") return 0.001;
+  return 0;
+}
+
+function attemptRequestId(input = {}) {
+  if (input.requestId != null && String(input.requestId).trim()) return String(input.requestId);
+  return `${String(input.provider || "provider")}:${String(input.operation || "operation")}:${Date.now()}:${crypto.randomUUID()}`;
+}
+
 function thresholdsFor(input = {}, explicit) {
   return { ...DEFAULT_THRESHOLDS, ...(input.thresholds || {}), ...(explicit || {}) };
 }
 
 function evaluateProviderBudget(input = {}, explicitThresholds) {
   const thresholds = thresholdsFor(input, explicitThresholds);
   const measuredUsd = finiteUsd(input.measuredUsd);
   const estimatedUsd = finiteUsd(input.estimatedUsd);
   const totalUsd = Number((measuredUsd + estimatedUsd).toFixed(12));
   let state = "normal";
@@ -33,127 +64,169 @@ function evaluateProviderBudget(input = {}, explicitThresholds) {
   else if (totalUsd >= Number(thresholds.warningUsd)) state = "warning";
   const reasons = [`state:${state}`];
   const unknownCount = countUnknown(input.unknownCount);
   if (unknownCount > 0) reasons.push(`unknown_billing:${unknownCount}`);
   if (state === "warning") reasons.push("daily_warning_threshold");
   if (state === "degraded") reasons.push("paid_fallback_threshold");
   if (state === "stopped") reasons.push("nonessential_work_stopped");
   return { state, totalUsd, measuredUsd, estimatedUsd, unknownCount, reasons };
 }
 
-function aggregateCostRows(rows) {
+function aggregateCostRows(rows, { voiceOnly = false } = {}) {
   let measuredUsd = 0;
   let estimatedUsd = 0;
   let unknownCount = 0;
   for (const row of Array.isArray(rows) ? rows : []) {
+    if (voiceOnly && !isVoiceOperation(row && row.provider, row && row.operation)) continue;
     const status = row && row.actual_status == null ? null : String(row.actual_status);
     const actual = row && row.actual_billed_usd;
     const estimate = row && row.estimated_usd == null ? row.est_usd : row.estimated_usd;
-    if (status === "measured" && Number.isFinite(Number(actual)) && Number(actual) >= 0) measuredUsd += Number(actual);
-    else if (Number.isFinite(Number(estimate)) && Number(estimate) >= 0) estimatedUsd += Number(estimate);
-    else if (status === "unknown" || (status == null && !Number.isFinite(Number(estimate)))) unknownCount++;
+    if (status === "known" && Number.isFinite(Number(actual)) && Number(actual) >= 0) measuredUsd += Number(actual);
+    else if (status === "unknown" && estimate != null && estimate !== "" && Number.isFinite(Number(estimate)) && Number(estimate) >= 0) estimatedUsd += Number(estimate);
+    else if (status === "known" || status === "unknown" || status == null) unknownCount++;
   }
   return { measuredUsd, estimatedUsd, unknownCount };
 }
 
-async function readDailySpend({ uid, nowMs = Date.now() } = {}, deps = {}) {
-  if (typeof deps.readDailySpend === "function") return deps.readDailySpend({ uid, nowMs });
+async function readDailySpend({ uid, nowMs = Date.now(), voiceOnly = false } = {}, deps = {}) {
+  if (typeof deps.readDailySpend === "function") return deps.readDailySpend({ uid, nowMs, voiceOnly });
   const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
   const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
   const fetchImpl = deps.fetchImpl || globalThis.fetch;
   if (!supaUrl || !supaKey || typeof fetchImpl !== "function") throw new Error("budget ledger unavailable");
   const now = new Date(nowMs);
   const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
   const nextDay = new Date(dayStart.getTime() + 86400000);
   const filters = [
     uid == null ? null : `uid=eq.${encodeURIComponent(uid)}`,
     `ts=gte.${encodeURIComponent(dayStart.toISOString())}`,
     `ts=lt.${encodeURIComponent(nextDay.toISOString())}`,
-    "select=actual_status,actual_billed_usd,estimated_usd,est_usd",
+    "select=provider,operation,actual_status,actual_billed_usd,estimated_usd,est_usd,cost_classification",
   ].filter(Boolean).join("&");
-  const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/lm_api_cost?${filters}`, {
+  const voiceFilter = voiceOnly
+    ? "&or=(provider.eq.telnyx,provider.eq.gemini,operation.ilike.*voice*,operation.ilike.*call*,operation.eq.session)"
+    : "";
+  const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/lm_api_cost?${filters}${voiceFilter}`, {
     headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
   });
   if (!response || !response.ok) throw new Error(`budget ledger read failed (${response && response.status})`);
-  return aggregateCostRows(await response.json().catch(() => []));
-}
-
-function isVoiceOperation(provider, operation) {
-  const p = String(provider || "").toLowerCase();
-  const o = String(operation || "").toLowerCase();
-  return p === "telnyx" || p === "gemini" || o.includes("voice") || o.includes("call") || o === "session";
+  return aggregateCostRows(await response.json().catch(() => []), { voiceOnly });
 }
 
 function isPaidFallback(provider, operation) {
   const p = String(provider || "").toLowerCase();
   const o = String(operation || "").toLowerCase();
   return o === "fallback" || o === "paid_fallback" || o.includes("google_fallback") || (p === "google" && o.includes("fallback"));
 }
 
 async function authorizeProviderOperation(input = {}, deps = {}) {
   if (input.cacheHit) return { allowed: true, reason: "cache_hit", state: "cache_hit", totalUsd: null };
   const thresholds = thresholdsFor(deps, input.thresholds);
+  const requestId = attemptRequestId(input);
+  const projectedUsd = projectedFor(input);
+  const voice = isVoiceOperation(input.provider, input.operation);
   let spend;
   try {
     spend = await readDailySpend({ uid: input.uid, nowMs: input.nowMs }, deps);
   } catch (error) {
     return { allowed: false, reason: "budget_unavailable", state: "unknown", error: String(error && error.message ? error.message : error) };
   }
   const budget = evaluateProviderBudget({ ...spend, thresholds });
   const essential = input.essential === true;
   if (!essential && budget.state === "stopped") return { allowed: false, reason: "budget_stopped", ...budget };
   if (!essential && isPaidFallback(input.provider, input.operation) && (budget.state === "degraded" || budget.state === "stopped")) {
     return { allowed: false, reason: "paid_fallback_disabled", ...budget };
   }
   if (isVoiceOperation(input.provider, input.operation)) {
-    const projectedUsd = finiteUsd(input.projectedUsd);
-    const reader = deps.readVoiceSpend || (async ({ scope }) => readDailySpend({ uid: scope === "user" ? input.uid : null, nowMs: input.nowMs }, deps));
+    const reader = deps.readVoiceSpend || (async ({ scope }) => readDailySpend({
+      uid: scope === "user" ? input.uid : null, nowMs: input.nowMs, voiceOnly: true,
+    }, deps));
     try {
-      const userVoice = await reader({ scope: "user", uid: input.uid, nowMs: input.nowMs });
+      const userVoice = await reader({ scope: "user", uid: input.uid, nowMs: input.nowMs, voiceOnly: true });
       if (finiteUsd(userVoice.measuredUsd) + finiteUsd(userVoice.estimatedUsd) + projectedUsd >= Number(thresholds.voiceUserCapUsd)) {
         return { allowed: false, reason: "voice_user_cap", ...budget };
       }
-      const globalVoice = await reader({ scope: "global", uid: null, nowMs: input.nowMs });
+      const globalVoice = await reader({ scope: "global", uid: null, nowMs: input.nowMs, voiceOnly: true });
       if (finiteUsd(globalVoice.measuredUsd) + finiteUsd(globalVoice.estimatedUsd) + projectedUsd >= Number(thresholds.voiceGlobalCapUsd)) {
         return { allowed: false, reason: "voice_global_cap", ...budget };
       }
     } catch (error) {
       return { allowed: false, reason: "budget_unavailable", state: "unknown", error: String(error && error.message ? error.message : error) };
     }
   }
   if (typeof deps.claimBudget === "function") {
     let claimed = false;
-    try { claimed = await deps.claimBudget({ ...input, budget }); } catch { claimed = false; }
-    if (!claimed) return { allowed: false, reason: "budget_claim_failed", ...budget };
+    try { claimed = await deps.claimBudget({ ...input, requestId, projectedUsd, budget }); } catch { claimed = false; }
+    if (!claimed) return { allowed: false, reason: "budget_claim_failed", ...budget, requestId, projectedUsd };
+  } else if (isClaimableProvider(input.provider) && (deps.supaUrl || process.env.SUPABASE_URL)) {
+    const claim = await claimProviderBudget({
+      ...input, requestId, projectedUsd, isVoice: voice,
+      userVoiceCapUsd: thresholds.voiceUserCapUsd, globalVoiceCapUsd: thresholds.voiceGlobalCapUsd,
+    }, deps);
+    if (!claim.allowed) return { allowed: false, reason: claim.reason || "budget_claim_failed", ...budget, requestId, projectedUsd };
   }
-  return { allowed: true, reason: budget.state === "warning" ? "budget_warning" : "allowed", ...budget };
+  return { allowed: true, reason: budget.state === "warning" ? "budget_warning" : "allowed", ...budget, requestId, projectedUsd };
 }
 
 async function claimProviderBudget(input = {}, deps = {}) {
   const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
   const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
   const fetchImpl = deps.fetchImpl || globalThis.fetch;
-  if (!supaUrl || !supaKey || !input.uid || !input.requestId || typeof fetchImpl !== "function") return false;
+  if (!supaUrl || !supaKey || !input.uid || !input.requestId || typeof fetchImpl !== "function") return { allowed: false, reason: "budget_claim_unavailable" };
   const day = new Date(input.nowMs == null ? Date.now() : input.nowMs).toISOString().slice(0, 10);
-  const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/lm_provider_budget_claims`, {
+  let response;
+  try {
+    response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/rpc/lm_claim_provider_budget`, {
     method: "POST",
     headers: {
       apikey: supaKey, Authorization: `Bearer ${supaKey}`, "Content-Type": "application/json",
-      Prefer: "resolution=ignore-duplicates,return=minimal",
+      Prefer: "return=representation",
     },
     body: JSON.stringify({
-      uid: String(input.uid), budget_day: day, provider: String(input.provider || "unknown"),
-      operation: String(input.operation || "unknown"), request_id: String(input.requestId),
-      projected_usd: finiteUsd(input.projectedUsd),
+      p_uid: String(input.uid), p_budget_day: day, p_provider: String(input.provider || "unknown"),
+      p_operation: String(input.operation || "unknown"), p_request_id: String(input.requestId),
+      p_projected_usd: finiteUsd(input.projectedUsd), p_is_voice: Boolean(input.isVoice),
+      p_user_voice_cap: finiteUsd(input.userVoiceCapUsd), p_global_voice_cap: finiteUsd(input.globalVoiceCapUsd),
     }),
-  });
-  return Boolean(response && (response.status === 201 || response.status === 200));
+    });
+  } catch (error) {
+    return { allowed: false, reason: "budget_claim_unavailable", error: String(error && error.message ? error.message : error) };
+  }
+  if (!response || !response.ok) return { allowed: false, reason: "budget_claim_failed", status: response && response.status };
+  const raw = await response.json().catch(() => null);
+  const result = Array.isArray(raw) ? raw[0] : raw;
+  if (!result || result.allowed !== true) return { allowed: false, reason: result && result.reason ? String(result.reason) : "budget_claim_failed" };
+  return { allowed: true, reason: result.duplicate ? "budget_claim_duplicate" : "budget_claimed", duplicate: Boolean(result.duplicate), requestId: result.request_id || input.requestId };
+}
+
+async function settleProviderVoice(input = {}, deps = {}) {
+  const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
+  const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
+  const fetchImpl = deps.fetchImpl || globalThis.fetch;
+  if (!supaUrl || !supaKey || !input.uid || !input.requestId || typeof fetchImpl !== "function") return false;
+  const day = new Date(input.nowMs == null ? Date.now() : input.nowMs).toISOString().slice(0, 10);
+  try {
+    const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/rpc/lm_settle_provider_voice`, {
+      method: "POST",
+      headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
+      body: JSON.stringify({
+        p_uid: String(input.uid), p_budget_day: day, p_request_id: String(input.requestId),
+        p_actual_usd: finiteUsd(input.actualBilledUsd),
+        p_reservation_request_id: input.reservationRequestId == null ? null : String(input.reservationRequestId),
+      }),
+    });
+    if (!response || !response.ok) return false;
+    const raw = await response.json().catch(() => null);
+    const result = Array.isArray(raw) ? raw[0] : raw;
+    return Boolean(result && result.settled === true);
+  } catch { return false; }
 }
 
 module.exports = {
   DEFAULT_THRESHOLDS,
   aggregateCostRows,
   evaluateProviderBudget,
   readDailySpend,
   authorizeProviderOperation,
   claimProviderBudget,
+  settleProviderVoice,
 };
diff --git a/apps/life-manager/lib/provider-budget.test.js b/apps/life-manager/lib/provider-budget.test.js
index 2ca4298a5..7f0b19f9c 100644
--- a/apps/life-manager/lib/provider-budget.test.js
+++ b/apps/life-manager/lib/provider-budget.test.js
@@ -1,38 +1,75 @@
 "use strict";
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
 const fs = require("node:fs");
 const path = require("node:path");
-const { evaluateProviderBudget, authorizeProviderOperation } = require("./provider-budget.js");
+const { evaluateProviderBudget, aggregateCostRows, readDailySpend, authorizeProviderOperation, settleProviderVoice } = require("./provider-budget.js");
 
 test("migration provides a unique atomic daily claim identity", () => {
   const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
   assert.match(sql, /lm_provider_budget_claims/);
   assert.match(sql, /primary key \(uid, budget_day, request_id\)/);
+  assert.match(sql, /create table if not exists public\.lm_provider_voice_buckets/);
+  assert.match(sql, /create or replace function public\.lm_claim_provider_budget/);
+  assert.match(sql, /for update/);
+  assert.match(sql, /reserved_usd/);
+  assert.match(sql, /settled_usd/);
+  assert.match(sql, /lm_settle_provider_voice/);
 });
 
 test("daily provider budget boundaries are normal, warning, degraded, then stopped", () => {
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.49, estimatedUsd: 0 }).state, "normal");
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.50, estimatedUsd: 0 }).state, "warning");
   assert.equal(evaluateProviderBudget({ measuredUsd: 0.99, estimatedUsd: 0.01 }).state, "degraded");
   assert.equal(evaluateProviderBudget({ measuredUsd: 2, estimatedUsd: 0 }).state, "stopped");
 });
 
 test("unknown billing is visible in reasons and never contributes numeric zero as measured spend", () => {
   const budget = evaluateProviderBudget({ measuredUsd: null, estimatedUsd: null, unknownCount: 2 });
   assert.equal(budget.totalUsd, 0);
   assert.equal(budget.state, "normal");
   assert.ok(budget.reasons.some((reason) => /unknown/i.test(reason)));
 });
 
+test("row aggregation keeps unknown null estimates out of numeric spend", () => {
+  const result = aggregateCostRows([
+    { provider: "google", operation: "geocoding", actual_status: "unknown", actual_billed_usd: null, estimated_usd: null, est_usd: null },
+    { provider: "google", operation: "routes", actual_status: "unknown", actual_billed_usd: null, estimated_usd: 0.01 },
+    { provider: "telnyx", operation: "call_cdr", actual_status: "known", actual_billed_usd: 0.03, estimated_usd: null },
+  ]);
+  assert.equal(result.unknownCount, 1);
+  assert.equal(result.estimatedUsd, 0.01);
+  assert.equal(result.measuredUsd, 0.03);
+});
+
+test("voice-only aggregation excludes non-voice provider rows", () => {
+  const result = aggregateCostRows([
+    { provider: "google", operation: "routes", actual_status: "unknown", estimated_usd: 0.5 },
+    { provider: "telnyx", operation: "call_cdr", actual_status: "known", actual_billed_usd: 0.03 },
+  ], { voiceOnly: true });
+  assert.equal(result.measuredUsd, 0.03);
+  assert.equal(result.estimatedUsd, 0);
+});
+
+test("default voice spend reader requests only voice operations", async () => {
+  let requested;
+  await readDailySpend({ uid: "u1", voiceOnly: true }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (url) => { requested = String(url); return { ok: true, json: async () => [] }; },
+  });
+  assert.match(requested, /provider\.eq\.telnyx/);
+  assert.match(requested, /provider\.eq\.gemini/);
+  assert.match(requested, /operation\.ilike/);
+});
+
 test("paid fallback is disabled at one dollar while essential work remains available", async () => {
   const deps = { readDailySpend: async () => ({ measuredUsd: 1, estimatedUsd: 0, unknownCount: 0 }) };
   const fallback = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "fallback", essential: false }, deps);
   const essential = await authorizeProviderOperation({ uid: "u1", provider: "transit", operation: "plan", essential: true }, deps);
   assert.equal(fallback.allowed, false);
   assert.equal(fallback.reason, "paid_fallback_disabled");
   assert.equal(essential.allowed, true);
 });
 
 test("nonessential provider work stops at two dollars", async () => {
@@ -73,10 +110,62 @@ test("voice caps are enforced independently for one user and globally", async ()
   assert.equal(globalBlocked.reason, "voice_global_cap");
 });
 
 test("a failed budget read fails closed for non-cache work", async () => {
   const result = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "routes", essential: false }, {
     readDailySpend: async () => { throw new Error("ledger unavailable"); },
   });
   assert.equal(result.allowed, false);
   assert.equal(result.reason, "budget_unavailable");
 });
+
+test("production authorization atomically claims a nonzero projection through the Postgres RPC", async () => {
+  const calls = [];
+  const result = await authorizeProviderOperation({
+    uid: "u1", provider: "telnyx", operation: "call_session", essential: true,
+    requestId: "call-attempt-1", projectedUsd: 0,
+  }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    readDailySpend: async () => ({ measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }),
+    readVoiceSpend: async () => ({ measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }),
+    fetchImpl: async (url, init = {}) => {
+      calls.push({ url: String(url), init });
+      if (String(url).includes("/rpc/lm_claim_provider_budget")) {
+        return { ok: true, status: 200, json: async () => ({ allowed: true, request_id: "call-attempt-1" }) };
+      }
+      return { ok: true, status: 200, json: async () => [] };
+    },
+  });
+  assert.equal(result.allowed, true);
+  const rpc = calls.find((call) => call.url.includes("/rpc/lm_claim_provider_budget"));
+  assert.ok(rpc, "the production path must use the transactional RPC");
+  const body = JSON.parse(rpc.init.body);
+  assert.equal(body.p_request_id, "call-attempt-1");
+  assert.ok(body.p_projected_usd > 0, "voice claims must never reserve a zero projection");
+  assert.equal(body.p_is_voice, true);
+});
+
+test("cached reads bypass both budget reads and the atomic claim RPC", async () => {
+  let calls = 0;
+  const result = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "routes", cacheHit: true }, {
+    supaUrl: "https://db.example", supaKey: "service", fetchImpl: async () => { calls += 1; return { ok: true }; },
+    readDailySpend: async () => { calls += 1; return { measuredUsd: 99, estimatedUsd: 0, unknownCount: 0 }; },
+  });
+  assert.equal(result.allowed, true);
+  assert.equal(calls, 0);
+});
+
+test("known Telnyx CDR settlement uses the transactional voice settlement RPC", async () => {
+  const calls = [];
+  const ok = await settleProviderVoice({ uid: "u1", requestId: "cdr-1", actualBilledUsd: 0.037, reservationRequestId: "call-1" }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (url, init = {}) => {
+      calls.push({ url: String(url), init });
+      return { ok: true, status: 200, json: async () => ({ settled: true }) };
+    },
+  });
+  assert.equal(ok, true);
+  const body = JSON.parse(calls[0].init.body);
+  assert.equal(body.p_request_id, "cdr-1");
+  assert.equal(body.p_actual_usd, 0.037);
+  assert.equal(body.p_reservation_request_id, "call-1");
+});
diff --git a/apps/life-manager/lib/provider-cost-adapters.js b/apps/life-manager/lib/provider-cost-adapters.js
index 7aaf18f0f..252b43c2c 100644
--- a/apps/life-manager/lib/provider-cost-adapters.js
+++ b/apps/life-manager/lib/provider-cost-adapters.js
@@ -1,16 +1,24 @@
 "use strict";
 
 const crypto = require("node:crypto");
 const { recordProviderCost } = require("./ledger.js");
 
 const GEMINI_WALL_TIME_USD_PER_MINUTE = 0.023;
+const GOOGLE_PRICING_VERSION = "google-maps-2026-08";
+// Versioned conservative projections are deliberately non-zero. Actual Google
+// invoices remain unknown until an import supplies `actualBilledUsd`.
+const GOOGLE_SKU_ESTIMATES_USD = Object.freeze({
+  geocoding: 0.005,
+  routes: 0.01,
+  "directions-transit": 0.005,
+});
 
 function requestId(provider, input = {}) {
   if (input.requestId != null && String(input.requestId).trim()) return String(input.requestId);
   if (input.id != null && String(input.id).trim()) return `${provider}:${String(input.id)}`;
   return `${provider}:${Date.now()}:${crypto.randomUUID()}`;
 }
 
 function quantity(value, fallback = 1) {
   const number = Number(value == null ? fallback : value);
   return Number.isFinite(number) && number >= 0 ? number : fallback;
@@ -29,45 +37,46 @@ function objectOrEmpty(value) {
 async function write(event, deps = {}) {
   const writer = deps.recordProviderCost || recordProviderCost;
   return writer(event, deps);
 }
 
 function unknownEvent({ provider, sku, operation, uid, requestId: id, quantity: amount, unit, pricingVersion, metadata, estimatedUsd = null }) {
   return {
     uid: uid == null ? null : String(uid), provider, sku, operation,
     requestId: requestId(provider, { requestId: id }), quantity: quantity(amount), unit, pricingVersion,
     estimatedUsd: money(estimatedUsd), actualBilledUsd: null, actualStatus: "unknown",
+    costClassification: money(estimatedUsd) == null ? "unknown" : "estimated",
     metadata: objectOrEmpty(metadata),
   };
 }
 
 async function recordGoogleGeocoding(input = {}, deps = {}) {
   return write(unknownEvent({
     provider: "google", sku: "geocoding", operation: "geocoding", uid: input.uid,
     requestId: input.requestId, quantity: input.quantity, unit: "request",
-    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+    pricingVersion: GOOGLE_PRICING_VERSION, metadata: input.metadata, estimatedUsd: input.estimatedUsd == null ? GOOGLE_SKU_ESTIMATES_USD.geocoding : input.estimatedUsd,
   }), deps);
 }
 
 async function recordGoogleRoutes(input = {}, deps = {}) {
   return write(unknownEvent({
     provider: "google", sku: "routes", operation: "routes", uid: input.uid,
     requestId: input.requestId, quantity: input.quantity, unit: "request",
-    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+    pricingVersion: GOOGLE_PRICING_VERSION, metadata: input.metadata, estimatedUsd: input.estimatedUsd == null ? GOOGLE_SKU_ESTIMATES_USD.routes : input.estimatedUsd,
   }), deps);
 }
 
 async function recordGoogleTransit(input = {}, deps = {}) {
   return write(unknownEvent({
     provider: "google", sku: "directions-transit", operation: "transit", uid: input.uid,
     requestId: input.requestId, quantity: input.quantity, unit: "request",
-    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+    pricingVersion: GOOGLE_PRICING_VERSION, metadata: input.metadata, estimatedUsd: input.estimatedUsd == null ? GOOGLE_SKU_ESTIMATES_USD["directions-transit"] : input.estimatedUsd,
   }), deps);
 }
 
 async function recordTransitOperation(input = {}, deps = {}) {
   const operation = String(input.operation || "plan");
   return write(unknownEvent({
     provider: "transit", sku: "jp-public", operation, uid: input.uid,
     requestId: input.requestId, quantity: input.quantity, unit: "request",
     pricingVersion: "transit-api-2026-08", metadata: input.metadata,
   }), deps);
@@ -105,23 +114,25 @@ function cdrCost(cdr = {}) {
   return money(amount != null ? amount : (cdr.price != null ? cdr.price : cdr.amount));
 }
 
 async function recordTelnyxCdr(input = {}, deps = {}) {
   const cdr = objectOrEmpty(input.cdr);
   const actual = cdrCost(cdr);
   return write({
     uid: input.uid == null ? null : String(input.uid), provider: "telnyx", sku: "voice",
     operation: "call_cdr", requestId: requestId("telnyx", { requestId: input.requestId, id: cdr.id || cdr.call_control_id }),
     quantity: quantity(input.durationSeconds, 0), unit: "seconds", pricingVersion: "telnyx-cdr-2026-08",
-    estimatedUsd: null, actualBilledUsd: actual, actualStatus: actual == null ? "unknown" : "measured",
+    estimatedUsd: null, actualBilledUsd: actual, actualStatus: actual == null ? "unknown" : "known",
+    costClassification: actual == null ? "unknown" : "measured",
     metadata: { ...objectOrEmpty(input.metadata), ...(cdr.id ? { cdrId: String(cdr.id) } : {}),
-      ...(cdr.call_control_id ? { callControlId: String(cdr.call_control_id) } : {}) },
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
@@ -132,21 +143,22 @@ async function recordAllocation(input = {}, deps = {}) {
   const provider = String(input.provider || "unknown");
   const actual = money(input.amountUsd);
   const period = input.period == null ? null : String(input.period);
   return write({
     uid: input.uid == null ? null : String(input.uid), provider,
     sku: String(input.sku || "allocation"), operation: "allocation",
     requestId: requestId(provider, { requestId: input.requestId, id: period }),
     quantity: quantity(input.quantity), unit: String(input.unit || "period"),
     pricingVersion: String(input.pricingVersion || `${provider}-allocation-2026-08`),
     estimatedUsd: money(input.estimatedUsd), actualBilledUsd: actual,
-    actualStatus: actual == null ? "unknown" : "measured",
+    actualStatus: actual == null ? "unknown" : "known",
+    costClassification: actual == null ? (money(input.estimatedUsd) == null ? "unknown" : "estimated") : "measured",
     metadata: { ...objectOrEmpty(input.metadata), ...(period ? { period } : {}) },
   }, deps);
 }
 
 async function recordRailwayAllocation(input = {}, deps = {}) {
   return recordAllocation({ ...input, provider: "railway" }, deps);
 }
 
 async function recordSupabaseAllocation(input = {}, deps = {}) {
   return recordAllocation({ ...input, provider: "supabase" }, deps);
diff --git a/apps/life-manager/lib/provider-cost-adapters.test.js b/apps/life-manager/lib/provider-cost-adapters.test.js
index 96acff759..f781b3fbb 100644
--- a/apps/life-manager/lib/provider-cost-adapters.test.js
+++ b/apps/life-manager/lib/provider-cost-adapters.test.js
@@ -1,17 +1,17 @@
 "use strict";
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
 
 const adapters = require("./provider-cost-adapters.js");
-const { routesDriveMinutes, legacyTransitMinutes, transitFetchPlan } = require("./travel.js");
+const { routesDriveMinutes, legacyTransitMinutes, directionsMinutesGoogle, transitFetchPlan } = require("./travel.js");
 const { geocodeAddress, clearGeocodeProcessMemo } = require("./geocode-cache.js");
 
 function recorder() {
   const events = [];
   return {
     events,
     deps: {
       recordProviderCost: async (event) => {
         events.push(event);
         return true;
@@ -42,21 +42,21 @@ test("Transit operations preserve the provider operation and unknown billing sta
   assert.deepEqual(r.events.map((event) => event.operation), ["plan", "guidance"]);
   assert.ok(r.events.every((event) => event.provider === "transit" && event.actualStatus === "unknown"));
 });
 
 test("Composio records one real tool operation and never reports unknown as an estimated zero", async () => {
   const r = recorder();
   await adapters.recordComposioOperation({ uid: "u1", requestId: "composio-1", tool: "GOOGLECALENDAR_EVENTS_LIST" }, r.deps);
   assert.deepEqual(r.events[0], {
     uid: "u1", provider: "composio", sku: "GOOGLECALENDAR_EVENTS_LIST", operation: "tool_execute",
     requestId: "composio-1", quantity: 1, unit: "call", pricingVersion: "composio-2026-08",
-    estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown",
+    estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown", costClassification: "unknown",
     metadata: { tool: "GOOGLECALENDAR_EVENTS_LIST" },
   });
 });
 
 test("Gemini session records token metadata when supplied and otherwise uses a wall-time estimate", async () => {
   const withUsage = recorder();
   await adapters.recordGeminiSession({
     uid: "u1", requestId: "gemini-1", durationSeconds: 60,
     usageMetadata: { promptTokenCount: 10, responseTokenCount: 20 },
   }, withUsage.deps);
@@ -71,41 +71,43 @@ test("Gemini session records token metadata when supplied and otherwise uses a w
   assert.equal(withoutUsage.events[0].actualStatus, "unknown");
 });
 
 test("Telnyx CDR records provider-measured actual cost", async () => {
   const r = recorder();
   await adapters.recordTelnyxCdr({
     uid: "u1", requestId: "cdr-1", durationSeconds: 90,
     cdr: { cost: { amount: "0.037", currency: "USD" }, call_control_id: "cc-1" },
   }, r.deps);
   assert.equal(r.events[0].provider, "telnyx");
-  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualStatus, "known");
+  assert.equal(r.events[0].costClassification, "measured");
   assert.equal(r.events[0].actualBilledUsd, 0.037);
   assert.equal(r.events[0].estimatedUsd, null);
 });
 
 test("Resend sends record recipient quantity and retain unknown billing", async () => {
   const r = recorder();
   await adapters.recordResendSend({ uid: "u1", requestId: "mail-1", recipientCount: 2, responseId: "re-1" }, r.deps);
   assert.equal(r.events[0].provider, "resend");
   assert.equal(r.events[0].quantity, 2);
   assert.equal(r.events[0].unit, "recipient");
   assert.equal(r.events[0].actualStatus, "unknown");
   assert.equal(r.events[0].actualBilledUsd, null);
 });
 
 test("Railway and Supabase allocations are measured when imported and unknown when absent", async () => {
   const r = recorder();
   await adapters.recordRailwayAllocation({ uid: "u1", requestId: "rail-1", amountUsd: "1.25", period: "2026-08-08" }, r.deps);
   await adapters.recordSupabaseAllocation({ uid: "u1", requestId: "supa-1", period: "2026-08-08" }, r.deps);
   assert.equal(r.events[0].provider, "railway");
-  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualStatus, "known");
+  assert.equal(r.events[0].costClassification, "measured");
   assert.equal(r.events[0].actualBilledUsd, 1.25);
   assert.equal(r.events[1].provider, "supabase");
   assert.equal(r.events[1].actualStatus, "unknown");
   assert.equal(r.events[1].actualBilledUsd, null);
   assert.equal(r.events[1].estimatedUsd, null);
 });
 
 test("a failed adapter write returns the recorder result and does not synthesize a zero", async () => {
   const seen = [];
   const ok = await adapters.recordGoogleRoutes({ uid: "u1", requestId: "route-fail" }, {
@@ -139,20 +141,35 @@ test("route providers record each attempted Google operation and transit plan/gu
       recordProviderCost: r.deps.recordProviderCost,
     });
   } finally { global.fetch = original; }
   assert.ok(urls.some((url) => url.includes("routes.googleapis.com")));
   assert.ok(urls.some((url) => url.includes("maps.googleapis.com")));
   assert.deepEqual(r.events.map((event) => [event.provider, event.operation]), [
     ["google", "routes"], ["google", "transit"], ["transit", "plan"], ["transit", "guidance"],
   ]);
 });
 
+test("each actual Google request gets a unique ledger request id even when a caller supplies one operation prefix", async () => {
+  const r = recorder();
+  const original = global.fetch;
+  global.fetch = async (url) => String(url).includes("routes.googleapis.com")
+    ? { ok: true, json: async () => ({ routes: [{ duration: "120s" }] }) }
+    : { ok: true, json: async () => ({ status: "OK", routes: [{ legs: [{ duration: { value: 180 } }] }] }) };
+  try {
+    await directionsMinutesGoogle("a", "b", "k", Date.now() + 60000, Date.now(), false, {
+      uid: "u1", requestId: "google:attempt-prefix", recordProviderCost: r.deps.recordProviderCost,
+    });
+  } finally { global.fetch = original; }
+  assert.equal(r.events.length, 2);
+  assert.equal(new Set(r.events.map((event) => event.requestId)).size, 2);
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
index 3c21ba1fe..026a6c9cb 100644
--- a/apps/life-manager/lib/provider-cost-imports.js
+++ b/apps/life-manager/lib/provider-cost-imports.js
@@ -67,16 +67,76 @@ async function importScheduledMeasurements(provider, loadRows, options = {}) {
     rows = await loadRows();
   } catch (error) {
     return { attempted: 0, recorded: 0, failed: 1, error: String(error && error.message ? error.message : error) };
   }
   if (provider === "telnyx") return importTelnyxCdrs(rows, options);
   if (provider === "railway") return importRailwayAllocations(rows, options);
   if (provider === "supabase") return importSupabaseAllocations(rows, options);
   return { attempted: 0, recorded: 0, failed: 1, error: `unsupported measurement provider: ${String(provider)}` };
 }
 
+async function fetchMeasurementRows(url, { fetchImpl = globalThis.fetch, headers = {} } = {}) {
+  if (!url || typeof fetchImpl !== "function") throw new Error("measurement source is not configured");
+  const response = await fetchImpl(url, { headers });
+  if (!response || !response.ok) throw new Error(`measurement source failed (${response && response.status})`);
+  const body = await response.json();
+  if (Array.isArray(body)) return body;
+  if (body && Array.isArray(body.data)) return body.data;
+  if (body && Array.isArray(body.rows)) return body.rows;
+  throw new Error("measurement source returned no rows array");
+}
+
+function productionMeasurementLoaders({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
+  const loaders = {};
+  if (env.TELNYX_API_KEY) {
+    loaders.telnyx = () => fetchMeasurementRows(
+      env.LM_TELNYX_CDR_URL || "https://api.telnyx.com/v2/call_records",
+      { fetchImpl, headers: { Authorization: `Bearer ${env.TELNYX_API_KEY}` } },
+    );
+  }
+  if (env.LM_RAILWAY_USAGE_URL && env.RAILWAY_API_TOKEN) {
+    loaders.railway = () => fetchMeasurementRows(env.LM_RAILWAY_USAGE_URL, {
+      fetchImpl, headers: { Authorization: `Bearer ${env.RAILWAY_API_TOKEN}` },
+    });
+  }
+  if (env.LM_SUPABASE_USAGE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY)) {
+    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
+    loaders.supabase = () => fetchMeasurementRows(env.LM_SUPABASE_USAGE_URL, {
+      fetchImpl, headers: { apikey: key, Authorization: `Bearer ${key}` },
+    });
+  }
+  return loaders;
+}
+
+async function runScheduledProviderCostImports({ loaders = productionMeasurementLoaders(), options = {} } = {}) {
+  const results = [];
+  for (const provider of ["telnyx", "railway", "supabase"]) {
+    const loader = loaders && loaders[provider];
+    const receipt = typeof loader === "function"
+      ? await importScheduledMeasurements(provider, loader, options)
+      : { attempted: 0, recorded: 0, failed: 0, skipped: true };
+    results.push({ provider, receipt });
+  }
+  return results;
+}
+
+function startProviderCostImportLoop({ intervalMs = 6 * 60 * 60 * 1000, loaders, options = {}, log = console.error } = {}) {
+  const run = () => runScheduledProviderCostImports({ loaders: loaders || productionMeasurementLoaders(), options })
+    .then((receipts) => receipts.forEach(({ provider, receipt }) => {
+      if (receipt.failed > 0) log(`[provider-cost-import] ${provider} failed=${receipt.failed}`);
+    }))
+    .catch((error) => log(`[provider-cost-import] loop failed ${error && error.message ? error.message : error}`));
+  void run();
+  const timer = setInterval(run, intervalMs);
+  return { close: () => clearInterval(timer) };
+}
+
 module.exports = {
   importTelnyxCdrs,
   importRailwayAllocations,
   importSupabaseAllocations,
   importScheduledMeasurements,
+  fetchMeasurementRows,
+  productionMeasurementLoaders,
+  runScheduledProviderCostImports,
+  startProviderCostImportLoop,
 };
diff --git a/apps/life-manager/lib/provider-cost-imports.test.js b/apps/life-manager/lib/provider-cost-imports.test.js
index e87839696..f47f1160c 100644
--- a/apps/life-manager/lib/provider-cost-imports.test.js
+++ b/apps/life-manager/lib/provider-cost-imports.test.js
@@ -1,53 +1,70 @@
 "use strict";
 
 const test = require("node:test");
 const assert = require("node:assert/strict");
 const {
   importTelnyxCdrs,
   importRailwayAllocations,
   importSupabaseAllocations,
   importScheduledMeasurements,
+  runScheduledProviderCostImports,
 } = require("./provider-cost-imports.js");
 
 function recorder() {
   const events = [];
   return {
     events,
     deps: { recordProviderCost: async (event) => { events.push(event); return true; } },
   };
 }
 
 test("Telnyx CDR import stores measured cost and keeps a missing CDR amount unknown", async () => {
   const r = recorder();
   const result = await importTelnyxCdrs([
     { id: "cdr-1", call_control_id: "cc-1", billed_duration: 90, cost: { amount: "0.037", currency: "USD" } },
     { id: "cdr-2", call_control_id: "cc-2", billed_duration: 30 },
   ], { uid: "u1", ...r.deps });
   assert.deepEqual(result, { attempted: 2, recorded: 2, failed: 0 });
-  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualStatus, "known");
   assert.equal(r.events[0].actualBilledUsd, 0.037);
   assert.equal(r.events[1].actualStatus, "unknown");
   assert.equal(r.events[1].actualBilledUsd, null);
 });
 
 test("Railway and Supabase allocation imports preserve owner measurements", async () => {
   const r = recorder();
   await importRailwayAllocations([{ period: "2026-08-08", amount_usd: "1.25" }], { uid: "u1", ...r.deps });
   await importSupabaseAllocations([{ period_key: "2026-08-08", amount_usd: "0.40" }], { uid: "u1", ...r.deps });
   assert.deepEqual(r.events.map((event) => [event.provider, event.actualBilledUsd]), [
     ["railway", 1.25], ["supabase", 0.4],
   ]);
-  assert.ok(r.events.every((event) => event.actualStatus === "measured"));
+  assert.ok(r.events.every((event) => event.actualStatus === "known"));
 });
 
 test("a failed scheduled measurement import returns failure and emits no synthetic zero row", async () => {
   const r = recorder();
   const result = await importScheduledMeasurements("railway", async () => { throw new Error("usage API down"); }, {
     uid: "u1", ...r.deps,
   });
   assert.equal(result.attempted, 0);
   assert.equal(result.recorded, 0);
   assert.equal(result.failed, 1);
   assert.equal(r.events.length, 0);
   assert.match(result.error, /usage API down/);
 });
+
+test("production import runner invokes Telnyx, Railway, and Supabase loaders and reports each result", async () => {
+  const r = recorder();
+  const loaded = [];
+  const result = await runScheduledProviderCostImports({
+    loaders: {
+      telnyx: async () => { loaded.push("telnyx"); return [{ id: "cdr-run", cost: { amount: "0.01", currency: "USD" } }]; },
+      railway: async () => { loaded.push("railway"); return [{ period: "2026-08-08", amount_usd: "0.20" }]; },
+      supabase: async () => { loaded.push("supabase"); return [{ period: "2026-08-08", amount_usd: "0.10" }]; },
+    },
+    options: { uid: "u1", ...r.deps },
+  });
+  assert.deepEqual(loaded, ["telnyx", "railway", "supabase"]);
+  assert.deepEqual(result.map((item) => item.provider), ["telnyx", "railway", "supabase"]);
+  assert.ok(result.every((item) => item.receipt.recorded === 1 && item.receipt.failed === 0));
+});
diff --git a/apps/life-manager/lib/route-cache.js b/apps/life-manager/lib/route-cache.js
index cdc8daab4..ec82b50ea 100644
--- a/apps/life-manager/lib/route-cache.js
+++ b/apps/life-manager/lib/route-cache.js
@@ -13,20 +13,28 @@ function timeBucket(epochMs, bucketMs = BUCKET_MS) {
 // Round a coordinate so trivially-different geos share a cache row (~11m at 4 dp is plenty for a route).
 const q = (n) => {
   const value = Number(n);
   return Number.isFinite(value) ? Math.round(value * 1e4) / 1e4 : null;
 };
 
 function coordinateLongitude(geo) {
   return geo && (geo.lon == null ? geo.lng : geo.lon);
 }
 
+function canonicalGeo(geo) {
+  if (!geo) return null;
+  const lat = q(geo.lat);
+  const lon = q(coordinateLongitude(geo));
+  if (lat == null || lon == null) return null;
+  return `${lat},${lon}`;
+}
+
 function contextValue(context, keys, fallback = "") {
   for (const key of keys) {
     if (context && context[key] != null && context[key] !== "") return String(context[key]);
   }
   return fallback;
 }
 
 function normalizeContext(context = {}) {
   const direction = context.direction || (context.departureMode ? "return" : "outbound");
   return {
@@ -68,41 +76,49 @@ function isRecord(value) {
   return Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value"));
 }
 
 function recordComputedAt(record) {
   if (!record) return null;
   const raw = record.computedAt == null ? record.computed_at : record.computedAt;
   const n = typeof raw === "number" ? raw : Date.parse(raw);
   return Number.isFinite(n) ? n : null;
 }
 
-function routeRecord(value, computedAt, context, ttlMs) {
+function routeRecord(value, computedAt, context, ttlMs, { uid, fromGeo, toGeo, timeBucket: bucket } = {}) {
   return {
     value,
     computedAt,
     ttlMs,
+    uid: uid == null ? null : String(uid),
+    fromGeo: fromGeo == null ? null : { lat: q(fromGeo.lat), lon: q(coordinateLongitude(fromGeo)) },
+    toGeo: toGeo == null ? null : { lat: q(toGeo.lat), lon: q(coordinateLongitude(toGeo)) },
+    timeBucket: bucket == null ? null : Number(bucket),
     provider: context.provider || null,
     eventAnchor: context.eventAnchor || null,
     timezone: context.timezone || null,
     direction: context.direction || null,
     routeMode: context.routeMode || null,
   };
 }
 
 function routeValueFromRow(row) {
   if (!row || typeof row !== "object") return null;
   const value = row.route_result == null ? row.value : row.route_result;
   if (value == null) return null;
   return {
     value,
     computedAt: row.computed_at || row.computedAt,
     ttlMs: row.ttl_secs == null ? undefined : Number(row.ttl_secs) * 1000,
+    uid: row.uid == null ? null : String(row.uid),
+    fromGeo: row.from_geo || null,
+    toGeo: row.to_geo || null,
+    timeBucket: row.time_bucket == null ? null : Number(row.time_bucket),
     provider: row.provider || null,
     eventAnchor: row.event_anchor || row.eventAnchor || null,
     timezone: row.timezone || null,
     direction: row.direction || null,
     routeMode: row.route_mode || row.routeMode || null,
   };
 }
 
 function authHeaders(key, extra) {
   return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
@@ -129,36 +145,39 @@ function createSupabaseRouteStore({ supaUrl, supaKey, fetchImpl = globalThis.fet
   async function set(key, record) {
     if (!baseUrl || !supaKey || typeof fetchImpl !== "function" || !key || !record || record.value == null) return false;
     const value = record.value;
     const duration = value.durationSeconds == null
       ? (value.durationSecs == null ? null : value.durationSecs)
       : value.durationSeconds;
     const computedAt = record.computedAt == null ? new Date().toISOString() : new Date(record.computedAt).toISOString();
     const body = {
       cache_key: key,
       uid: record.uid == null ? null : String(record.uid),
-      from_geo: record.fromGeo || null,
-      to_geo: record.toGeo || null,
+      from_geo: canonicalGeo(record.fromGeo),
+      to_geo: canonicalGeo(record.toGeo),
       time_bucket: record.timeBucket == null ? null : Number(record.timeBucket),
       provider: record.provider || "unknown",
       duration_secs: duration == null ? null : Number(duration),
       geometry: value.geometry == null ? null : value.geometry,
       route_result: value,
       computed_at: computedAt,
       ttl_secs: Math.max(1, Math.round((record.ttlMs == null ? BUCKET_MS : record.ttlMs) / 1000)),
       event_anchor: record.eventAnchor || null,
       timezone: record.timezone || null,
       direction: record.direction || null,
       route_mode: record.routeMode || null,
     };
+    if (!body.uid || !body.from_geo || !body.to_geo || !Number.isFinite(body.time_bucket) || !Number.isFinite(body.duration_secs)) {
+      return false;
+    }
     try {
-      const response = await fetchImpl(path, {
+      const response = await fetchImpl(`${path}?on_conflict=cache_key`, {
         method: "POST",
         headers: authHeaders(supaKey, {
           "Content-Type": "application/json",
           Prefer: "resolution=merge-duplicates,return=minimal",
         }),
         body: JSON.stringify(body),
       });
       return Boolean(response && response.ok);
     } catch {
       return false;
@@ -213,23 +232,32 @@ function makeRouteCache({ store = new Map(), ttlMs = BUCKET_MS, now = Date.now }
     const pending = (async () => {
       // A concurrent caller can have populated the durable store between the
       // initial read and this claim, so re-read before spending on the provider.
       const secondHit = await readStore(store, key);
       if (secondHit && isFresh(secondHit)) {
         readThrough.set(key, secondHit);
         return secondHit.value;
       }
       const value = await compute();
       if (value == null) return value;
-      const record = routeRecord(value, Number(now()), resolved.context, ttlMs);
+      const record = routeRecord(value, Number(now()), resolved.context, ttlMs, {
+        uid,
+        fromGeo,
+        toGeo,
+        timeBucket: resolved.bucket,
+      });
       readThrough.set(key, record);
-      await writeStore(store, key, record);
+      const persisted = await writeStore(store, key, record);
+      if (!persisted) {
+        readThrough.delete(key);
+        throw new Error("durable route cache write failed");
+      }
       return value;
     })();
     inFlight.set(key, pending);
     try {
       return await pending;
     } finally {
       inFlight.delete(key);
     }
   }
   return { getOrCompute };
diff --git a/apps/life-manager/lib/route-cache.test.js b/apps/life-manager/lib/route-cache.test.js
index a1a6a8cfb..3c6a3c9b5 100644
--- a/apps/life-manager/lib/route-cache.test.js
+++ b/apps/life-manager/lib/route-cache.test.js
@@ -134,20 +134,72 @@ test("Supabase route store persists structured route result across cache instanc
   assert.deepEqual(await cacheA.getOrCompute(...keyArgs), value);
   let callsB = 0;
   const cached = await cacheB.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => { callsB += 1; return { durationSecs: 1 }; }, context);
   assert.deepEqual(cached, value);
   assert.equal(callsA, 1);
   assert.equal(callsB, 0);
   assert.equal(rows.size, 1);
   assert.equal(calls.filter((call) => call.init.method === "POST").length, 1);
 });
 
+test("Supabase route store writes every legacy NOT NULL route column and explicit cache conflict target", async () => {
+  const requests = [];
+  const fetchImpl = async (input, init = {}) => {
+    requests.push({ url: new URL(String(input)), init });
+    return { ok: true, status: 201, json: async () => [] };
+  };
+  const store = createSupabaseRouteStore({ supaUrl: "https://supa.invalid", supaKey: "service", fetchImpl });
+  const cache = makeRouteCache({ store, ttlMs: 600000, now: () => 1000 });
+  await cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42,
+    async () => ({ durationSecs: 900, steps: [{ mode: "rail" }] }),
+    { eventAnchor: "2026-08-09T09:00:00+09:00", timezone: "Asia/Tokyo", direction: "outbound", provider: "transit", routeMode: "rail" });
+  const post = requests.find((request) => request.init.method === "POST");
+  assert.ok(post, "durable cache write was attempted");
+  const body = JSON.parse(post.init.body);
+  assert.equal(body.uid, "u1");
+  assert.equal(body.from_geo, "35.68,139.76");
+  assert.equal(body.to_geo, "35.69,139.7");
+  assert.equal(body.time_bucket, 42);
+  assert.equal(body.duration_secs, 900);
+  assert.match(post.url.search, /on_conflict=cache_key/);
+});
+
+test("route cache surfaces a failed durable write instead of silently claiming persistence", async () => {
+  const store = { get: async () => null, set: async () => false };
+  const cache = makeRouteCache({ store, ttlMs: 600000, now: () => 1000 });
+  await assert.rejects(
+    cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => ({ durationSecs: 900 })),
+    /durable route cache write failed/
+  );
+});
+
+test("two cache instances contend through the durable store and only one provider result wins", async () => {
+  const rows = new Map();
+  let writes = 0;
+  const storeFactory = () => ({
+    get: async (key) => rows.get(key) || null,
+    set: async (key, record) => {
+      writes += 1;
+      if (!rows.has(key)) rows.set(key, record);
+      return true;
+    },
+  });
+  const cacheA = makeRouteCache({ store: storeFactory(), ttlMs: 600000, now: () => 1000 });
+  const cacheB = makeRouteCache({ store: storeFactory(), ttlMs: 600000, now: () => 1000 });
+  let providerCalls = 0;
+  const provider = async () => { providerCalls += 1; await new Promise((r) => setTimeout(r, 5)); return { durationSecs: 900 }; };
+  const args = ["u1", G(35.68, 139.76), G(35.69, 139.70), 42, provider];
+  await Promise.all([cacheA.getOrCompute(...args), cacheB.getOrCompute(...args)]);
+  assert.equal(writes, 2, "both writers may race but each must report durable success");
+  assert.equal(rows.size, 1);
+});
+
 test("cache hits remain available when the caller marks provider work degraded", async () => {
   const store = new Map();
   const cache = makeRouteCache({ store, ttlMs: 600000, now: () => 1000 });
   const context = { provider: "transit", routeMode: "rail", allowCompute: true };
   await cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => ({ durationSecs: 900 }), context);
   let called = false;
   const value = await cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => { called = true; return null; }, { ...context, allowCompute: false });
   assert.equal(value.durationSecs, 900);
   assert.equal(called, false);
 });
diff --git a/apps/life-manager/lib/transport/calendar-composio.js b/apps/life-manager/lib/transport/calendar-composio.js
index a4617d7e2..ff825fe67 100644
--- a/apps/life-manager/lib/transport/calendar-composio.js
+++ b/apps/life-manager/lib/transport/calendar-composio.js
@@ -1,15 +1,16 @@
 // lib/transport/calendar-composio.js — CLOUD calendar transport (#74 convergence). Wraps the Composio
 // managed-OAuth GOOGLECALENDAR_* tools behind the adapter interface every life-logic module will use,
 // so the same JS runs cloud (this) or local (calendar-gog.js, slice 5). Behaviour-identical to the
 // inline Composio calls it replaces — the live caller is unchanged.
 "use strict";
+const crypto = require("node:crypto");
 const { recordComposioOperation } = require("../provider-cost-adapters.js");
 const { authorizeProviderOperation: authorizeBudget } = require("../provider-budget.js");
 
 const COMPOSIO_EXEC = "https://backend.composio.dev/api/v3/tools/execute";
 
 async function exec(tool, uid, args, apiKey, fetchImpl = globalThis.fetch) {
   const r = await fetchImpl(`${COMPOSIO_EXEC}/${tool}`, {
     method: "POST",
     headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
     body: JSON.stringify({ user_id: uid, arguments: args }),
@@ -20,28 +21,28 @@ async function exec(tool, uid, args, apiKey, fetchImpl = globalThis.fetch) {
 function makeComposioCalendar({ apiKey, recordCall, recordProviderCost, fetchImpl, authorizeProviderOperation } = {}) {
   const key = apiKey || process.env.COMPOSIO_API_KEY;
   const ledger = recordCall || ((uid, tool, requestId) => {
     if (!recordProviderCost && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) return false;
     return recordComposioOperation({ uid, tool, requestId }, { recordProviderCost });
   });
   const budgetGate = authorizeProviderOperation || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
     ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
     : undefined);
   const execute = async (tool, uid, args, operationOptions = {}) => {
+    const requestId = `composio:${uid || "anonymous"}:${tool}:${Date.now()}:${crypto.randomUUID()}`;
     if (typeof budgetGate === "function") {
       const decision = await budgetGate({
         uid, provider: "composio", operation: operationOptions.operation || "refresh",
-        essential: operationOptions.essential === true, cacheHit: operationOptions.cacheHit === true,
+        essential: operationOptions.essential === true, cacheHit: operationOptions.cacheHit === true, requestId,
       });
       if (decision && decision.allowed === false) throw new Error(`provider budget denied: ${decision.reason || "stopped"}`);
     }
-    const requestId = `composio:${uid || "anonymous"}:${tool}:${Date.now()}`;
     let result;
     let failure;
     try {
       result = await exec(tool, uid, args, key, fetchImpl || globalThis.fetch);
     } catch (error) {
       failure = error;
     } finally {
       await Promise.resolve(ledger(uid, tool, requestId)).catch(() => false);
     }
     if (failure) throw failure;
diff --git a/apps/life-manager/lib/travel.js b/apps/life-manager/lib/travel.js
index 9df4f3dac..7d378964b 100644
--- a/apps/life-manager/lib/travel.js
+++ b/apps/life-manager/lib/travel.js
@@ -1,30 +1,36 @@
 // lib/travel.js — cloud travel-time auto-fill. For a user, look at today→+7d of located events and
 // insert a "[Travel]" block before each one so the wake call fires before they must LEAVE. Ports
 // travel/travel_fill.py to the Railway service: Google Directions for the leave time, Composio for the
 // gcal read + write. Origin priority: previous event's location (back-to-back) → the user's home.
 // Idempotent: never inserts a second [Travel] for an event that already has one.
 "use strict";
 
+const crypto = require("node:crypto");
 const { getCalendar } = require("./transport/index.js");
 const { chooseRouter, parseTransitPlan } = require("./transit.js");
 const { makeRouteCache, createSupabaseRouteStore, timeBucket } = require("./route-cache.js");
 const { geocodeAddress, createSupabaseGeocodeStore } = require("./geocode-cache.js");
 const { interpretCalendarEvent } = require("./calendar-interpreter.js");
 const { recordGoogleRoutes, recordGoogleTransit, recordTransitOperation } = require("./provider-cost-adapters.js");
 const { recordProviderCost: writeProviderCost } = require("./ledger.js");
 const { authorizeProviderOperation: authorizeBudget } = require("./provider-budget.js");
 
 // C3 (FIND-002): a process-lifetime route-result cache so the 60s scheduler tick does NOT recompute a
 // route it already has (~30 paid provider calls/event → 1). Keyed on (from_geo, to_geo, time_bucket).
 const _routeCache = makeRouteCache({ store: new Map(), ttlMs: 10 * 60_000 });
 
+function providerAttemptId(provider, operation, prefix) {
+  const base = prefix == null || String(prefix).trim() === "" ? provider : String(prefix);
+  return `${base}:${operation}:${Date.now()}:${crypto.randomUUID()}`;
+}
+
 function isoNaiveUTC(ms) {
   // Timezone-agnostic: pass the UTC wall clock paired with timezone:"UTC" (set in createTravelBlock).
   // Google stores the correct ABSOLUTE instant and shows it in each user's own timezone — so this
   // works for a user in Tokyo, New York, or anywhere, with no hardcoded offset.
   return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "").replace("Z", "");
 }
 function isTravel(summary) {
   const s = summary || "";
   return s.startsWith("[Travel]") || s.includes("🚆 移動");
 }
@@ -107,22 +113,23 @@ function buildDriveBody(src, dst, departIso) {
   };
 }
 function clampDepartIso(departAtMs, nowMs) {
   // Routes API rejects a departureTime in the past → floor to now+60s.
   const ms = Math.max(Number(departAtMs) || 0, (Number(nowMs) || 0) + 60000);
   return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
 }
 
 async function routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts = {}) {
   const body = JSON.stringify(buildDriveBody(src, dst, clampDepartIso(departAtMs, nowMs)));
+  const attemptId = providerAttemptId("google", "routes", opts.requestId);
   const record = typeof opts.recordProviderCost === "function"
-    ? () => recordGoogleRoutes({ uid: opts.uid, requestId: opts.requestId, metadata: { cache: "miss" } }, {
+    ? () => recordGoogleRoutes({ uid: opts.uid, requestId: attemptId, metadata: { cache: "miss" } }, {
       recordProviderCost: opts.recordProviderCost,
     }).catch(() => false)
     : null;
   if (record) await record();
   try {
     const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "X-Goog-Api-Key": mapsKey,
@@ -144,22 +151,23 @@ async function legacyTransitMinutes(src, dst, mapsKey, arriveByMs, nowMs = Date.
   // NEVER-LATE: anchor transit to the EVENT, not "now". Future event → arrival_time = event start, so
   // the train time reflects the schedule the user will actually ride. Past/missing → fall back to now.
   // Return leg: departAtMs is set → use departure_time anchored to event end (FIND-004).
   if (Number.isFinite(departAtMs) && departAtMs > nowMs) {
     p.set("departure_time", String(Math.floor(departAtMs / 1000)));
   } else if (Number.isFinite(arriveByMs) && arriveByMs > nowMs) {
     p.set("arrival_time", String(Math.floor(arriveByMs / 1000)));
   } else {
     p.set("departure_time", "now");
   }
+  const attemptId = providerAttemptId("google", "transit", opts.requestId);
   const record = typeof opts.recordProviderCost === "function"
-    ? () => recordGoogleTransit({ uid: opts.uid, requestId: opts.requestId }, {
+    ? () => recordGoogleTransit({ uid: opts.uid, requestId: attemptId }, {
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
@@ -216,31 +224,31 @@ async function transitFetchPlan(srcGeo, dstGeo, {
       to: `geo:${dstGeo.lat},${dstGeo.lon}`,
     });
     const local = transitQueryTime(eventAt, timezone);
     if (local) {
       query.set("date", local.date);
       query.set("time", local.time);
       query.set("type", direction === "return" ? "departure" : "arrival");
     }
     const planUrl = `https://api.transit.ls8h.com/api/v1/plan?${query}`;
     if (typeof recordProviderCost === "function") {
-      await recordTransitOperation({ uid, requestId: `transit:plan:${local ? `${local.date}T${local.time}` : "now"}`, operation: "plan" }, {
+      await recordTransitOperation({ uid, requestId: providerAttemptId("transit", "plan", local ? `${local.date}T${local.time}` : "now") , operation: "plan" }, {
         recordProviderCost,
       }).catch(() => false);
     }
     const planResponse = await fetchImpl(planUrl);
     if (!planResponse || !planResponse.ok) return null;
     const plan = await planResponse.json();
     // Guidance is display-only enrichment. A guidance outage must not discard
     // a valid journey plan; the two requests still share exactly one query.
     if (typeof recordProviderCost === "function") {
-      await recordTransitOperation({ uid, requestId: `transit:guidance:${local ? `${local.date}T${local.time}` : "now"}`, operation: "guidance" }, {
+      await recordTransitOperation({ uid, requestId: providerAttemptId("transit", "guidance", local ? `${local.date}T${local.time}` : "now"), operation: "guidance" }, {
         recordProviderCost,
       }).catch(() => false);
     }
     const guidanceResponse = await fetchImpl(`https://api.transit.ls8h.com/api/v1/guidance/plan?${query}`);
     const guidance = guidanceResponse && guidanceResponse.ok ? await guidanceResponse.json().catch(() => null) : null;
     return guidance ? { ...plan, guidance } : plan;
   } catch { return null; }
 }
 
 // C2/C3 WIRE: try the FREE JP transit path first (geocode both → JP bbox → /plan), fall back to Google.
diff --git a/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
index ee5c0fc63..b259446be 100644
--- a/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
+++ b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
@@ -22,52 +22,72 @@ ALTER TABLE public.lm_route_cache
   ADD COLUMN IF NOT EXISTS cache_key text,
   ADD COLUMN IF NOT EXISTS route_result jsonb,
   ADD COLUMN IF NOT EXISTS event_anchor text,
   ADD COLUMN IF NOT EXISTS timezone text,
   ADD COLUMN IF NOT EXISTS direction text,
   ADD COLUMN IF NOT EXISTS route_mode text;
 
 ALTER TABLE public.lm_route_cache
   DROP CONSTRAINT IF EXISTS lm_route_cache_uid_from_geo_to_geo_time_bucket_key;
 
-CREATE UNIQUE INDEX IF NOT EXISTS lm_route_cache_cache_key_idx
-  ON public.lm_route_cache (cache_key)
-  WHERE cache_key IS NOT NULL;
+-- Supabase's `on_conflict=cache_key` requires a non-partial unique index. A
+-- regular unique index still permits multiple legacy NULL keys in PostgreSQL.
+DROP INDEX IF EXISTS public.lm_route_cache_cache_key_idx;
+CREATE UNIQUE INDEX lm_route_cache_cache_key_idx
+  ON public.lm_route_cache (cache_key);
 CREATE INDEX IF NOT EXISTS lm_route_cache_context_idx
   ON public.lm_route_cache (uid, event_anchor, timezone, direction, route_mode);
 
 -- Extend the old ledger without rewriting existing rows.  Actual billing is
 -- deliberately nullable: unavailable provider billing is represented by the
 -- enum value `unknown`, never by a fabricated zero.
 ALTER TABLE public.lm_api_cost
   ADD COLUMN IF NOT EXISTS provider text,
   ADD COLUMN IF NOT EXISTS sku text,
   ADD COLUMN IF NOT EXISTS operation text,
   ADD COLUMN IF NOT EXISTS request_id text,
   ADD COLUMN IF NOT EXISTS pricing_version text,
   ADD COLUMN IF NOT EXISTS estimated_usd numeric,
   ADD COLUMN IF NOT EXISTS actual_billed_usd numeric,
   ADD COLUMN IF NOT EXISTS actual_status text,
+  ADD COLUMN IF NOT EXISTS cost_classification text,
   ADD COLUMN IF NOT EXISTS failed_at timestamptz,
   ADD COLUMN IF NOT EXISTS failure_reason text;
 
+-- Normalize the first version of this gate (`measured|estimated|unknown` in
+-- actual_status) before installing the stricter two-state status contract.
+-- The old distinction is retained in the new classification column.
+UPDATE public.lm_api_cost
+SET cost_classification = CASE
+  WHEN actual_status = 'measured' OR (actual_status = 'known' AND actual_billed_usd IS NOT NULL) THEN 'measured'
+  WHEN actual_status = 'estimated' OR estimated_usd IS NOT NULL THEN 'estimated'
+  ELSE 'unknown'
+END
+WHERE cost_classification IS NULL;
+
+UPDATE public.lm_api_cost
+SET actual_status = CASE
+  WHEN actual_status = 'measured' OR actual_billed_usd IS NOT NULL THEN 'known'
+  ELSE 'unknown'
+END
+WHERE actual_status IS NULL OR actual_status NOT IN ('known', 'unknown');
+
 DO $$
 BEGIN
-  IF NOT EXISTS (
-    SELECT 1 FROM pg_constraint
-    WHERE conrelid = 'public.lm_api_cost'::regclass
-      AND conname = 'lm_api_cost_actual_status_check'
-  ) THEN
-    ALTER TABLE public.lm_api_cost
-      ADD CONSTRAINT lm_api_cost_actual_status_check
-      CHECK (actual_status IS NULL OR actual_status IN ('measured', 'estimated', 'unknown'));
-  END IF;
+  ALTER TABLE public.lm_api_cost DROP CONSTRAINT IF EXISTS lm_api_cost_actual_status_check;
+  ALTER TABLE public.lm_api_cost
+    ADD CONSTRAINT lm_api_cost_actual_status_check
+    CHECK (actual_status IN ('known', 'unknown'));
+  ALTER TABLE public.lm_api_cost DROP CONSTRAINT IF EXISTS lm_api_cost_cost_classification_check;
+  ALTER TABLE public.lm_api_cost
+    ADD CONSTRAINT lm_api_cost_cost_classification_check
+    CHECK (cost_classification IN ('measured', 'estimated', 'fixed', 'unknown'));
 END $$;
 
 UPDATE public.lm_api_cost
 SET estimated_usd = est_usd
 WHERE estimated_usd IS NULL AND est_usd IS NOT NULL;
 
 CREATE INDEX IF NOT EXISTS lm_api_cost_uid_ts_idx
   ON public.lm_api_cost (uid, ts);
 CREATE INDEX IF NOT EXISTS lm_api_cost_provider_ts_idx
   ON public.lm_api_cost (provider, ts);
@@ -85,26 +105,181 @@ CREATE TABLE IF NOT EXISTS public.lm_provider_cost_failures (
   request_id   text NOT NULL,
   quantity     numeric,
   unit         text,
   error        jsonb NOT NULL
 );
 CREATE INDEX IF NOT EXISTS lm_provider_cost_failures_failed_at_idx
   ON public.lm_provider_cost_failures (failed_at);
 ALTER TABLE public.lm_provider_cost_failures ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.lm_provider_cost_failures FORCE ROW LEVEL SECURITY;
 
--- Optional atomic gate claims. The provider ledger remains the cost source of truth; this narrow table
--- only prevents two workers from authorizing the same request id in one user/day budget window.
+-- Atomic budget claims. The ledger remains the audit source of truth; claims
+-- reserve projected spend before a paid provider request leaves the process.
 CREATE TABLE IF NOT EXISTS public.lm_provider_budget_claims (
   uid            text NOT NULL,
   budget_day     date NOT NULL,
   provider       text NOT NULL,
   operation      text NOT NULL,
   request_id     text NOT NULL,
   projected_usd  numeric NOT NULL DEFAULT 0 CHECK (projected_usd >= 0),
+  is_voice       boolean NOT NULL DEFAULT false,
   claimed_at     timestamptz NOT NULL DEFAULT now(),
   PRIMARY KEY (uid, budget_day, request_id)
 );
+ALTER TABLE public.lm_provider_budget_claims
+  ADD COLUMN IF NOT EXISTS is_voice boolean NOT NULL DEFAULT false;
 CREATE INDEX IF NOT EXISTS lm_provider_budget_claims_global_idx
   ON public.lm_provider_budget_claims (budget_day, provider, operation);
 ALTER TABLE public.lm_provider_budget_claims ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.lm_provider_budget_claims FORCE ROW LEVEL SECURITY;
+
+CREATE TABLE IF NOT EXISTS public.lm_provider_voice_buckets (
+  scope        text NOT NULL CHECK (scope IN ('user', 'global')),
+  uid          text NOT NULL DEFAULT '',
+  budget_day   date NOT NULL,
+  settled_usd  numeric NOT NULL DEFAULT 0 CHECK (settled_usd >= 0),
+  reserved_usd numeric NOT NULL DEFAULT 0 CHECK (reserved_usd >= 0),
+  updated_at   timestamptz NOT NULL DEFAULT now(),
+  PRIMARY KEY (scope, uid, budget_day),
+  CHECK ((scope = 'global' AND uid = '') OR (scope = 'user' AND uid <> ''))
+);
+CREATE INDEX IF NOT EXISTS lm_provider_voice_buckets_day_idx
+  ON public.lm_provider_voice_buckets (budget_day, scope);
+ALTER TABLE public.lm_provider_voice_buckets ENABLE ROW LEVEL SECURITY;
+ALTER TABLE public.lm_provider_voice_buckets FORCE ROW LEVEL SECURITY;
+
+CREATE TABLE IF NOT EXISTS public.lm_provider_voice_settlements (
+  request_id  text PRIMARY KEY,
+  uid         text NOT NULL,
+  budget_day  date NOT NULL,
+  amount_usd  numeric NOT NULL CHECK (amount_usd >= 0),
+  settled_at  timestamptz NOT NULL DEFAULT now()
+);
+ALTER TABLE public.lm_provider_voice_settlements ENABLE ROW LEVEL SECURITY;
+ALTER TABLE public.lm_provider_voice_settlements FORCE ROW LEVEL SECURITY;
+
+-- The user and global rows are locked in one deterministic order. This makes
+-- reservations race-safe across Railway instances; a boolean REST insert is
+-- insufficient because two workers could both pass the pre-read cap check.
+CREATE OR REPLACE FUNCTION public.lm_claim_provider_budget(
+  p_uid text,
+  p_budget_day date,
+  p_provider text,
+  p_operation text,
+  p_request_id text,
+  p_projected_usd numeric,
+  p_is_voice boolean,
+  p_user_voice_cap numeric,
+  p_global_voice_cap numeric
+)
+RETURNS jsonb
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = public
+AS $$
+DECLARE
+  v_uid text := nullif(trim(p_uid), '');
+  v_day date := coalesce(p_budget_day, current_date);
+  v_user_settled numeric := 0;
+  v_user_reserved numeric := 0;
+  v_global_settled numeric := 0;
+  v_global_reserved numeric := 0;
+  v_projected numeric := coalesce(p_projected_usd, 0);
+BEGIN
+  IF v_uid IS NULL OR nullif(trim(p_request_id), '') IS NULL OR v_projected < 0 THEN
+    RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_claim');
+  END IF;
+
+  IF coalesce(p_is_voice, false) THEN
+    INSERT INTO lm_provider_voice_buckets(scope, uid, budget_day)
+      VALUES ('user', v_uid, v_day), ('global', '', v_day)
+      ON CONFLICT (scope, uid, budget_day) DO NOTHING;
+    SELECT settled_usd, reserved_usd INTO v_user_settled, v_user_reserved
+      FROM lm_provider_voice_buckets
+      WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day
+      FOR UPDATE;
+    SELECT settled_usd, reserved_usd INTO v_global_settled, v_global_reserved
+      FROM lm_provider_voice_buckets
+      WHERE scope = 'global' AND uid = '' AND budget_day = v_day
+      FOR UPDATE;
+  END IF;
+
+  IF EXISTS (
+    SELECT 1 FROM lm_provider_budget_claims
+    WHERE uid = v_uid AND budget_day = v_day AND request_id = p_request_id
+  ) THEN
+    RETURN jsonb_build_object('allowed', true, 'duplicate', true, 'request_id', p_request_id);
+  END IF;
+
+  IF coalesce(p_is_voice, false) AND v_user_settled + v_user_reserved + v_projected >= coalesce(p_user_voice_cap, 0) THEN
+    RETURN jsonb_build_object('allowed', false, 'reason', 'voice_user_cap');
+  END IF;
+  IF coalesce(p_is_voice, false) AND v_global_settled + v_global_reserved + v_projected >= coalesce(p_global_voice_cap, 0) THEN
+    RETURN jsonb_build_object('allowed', false, 'reason', 'voice_global_cap');
+  END IF;
+
+  INSERT INTO lm_provider_budget_claims(uid, budget_day, provider, operation, request_id, projected_usd, is_voice)
+    VALUES (v_uid, v_day, coalesce(nullif(trim(p_provider), ''), 'unknown'), coalesce(nullif(trim(p_operation), ''), 'unknown'), p_request_id, v_projected, coalesce(p_is_voice, false));
+  IF coalesce(p_is_voice, false) THEN
+    UPDATE lm_provider_voice_buckets
+      SET reserved_usd = reserved_usd + v_projected, updated_at = now()
+      WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day;
+    UPDATE lm_provider_voice_buckets
+      SET reserved_usd = reserved_usd + v_projected, updated_at = now()
+      WHERE scope = 'global' AND uid = '' AND budget_day = v_day;
+  END IF;
+  RETURN jsonb_build_object('allowed', true, 'duplicate', false, 'request_id', p_request_id);
+END;
+$$;
+
+-- CDR/usage imports settle an actual voice amount exactly once and release the
+-- matching reservation when the caller supplies its claim request id.
+CREATE OR REPLACE FUNCTION public.lm_settle_provider_voice(
+  p_uid text,
+  p_budget_day date,
+  p_request_id text,
+  p_actual_usd numeric,
+  p_reservation_request_id text DEFAULT NULL
+)
+RETURNS jsonb
+LANGUAGE plpgsql
+SECURITY DEFINER
+SET search_path = public
+AS $$
+DECLARE
+  v_uid text := nullif(trim(p_uid), '');
+  v_day date := coalesce(p_budget_day, current_date);
+  v_amount numeric := coalesce(p_actual_usd, 0);
+  v_reserved numeric := 0;
+BEGIN
+  IF v_uid IS NULL OR nullif(trim(p_request_id), '') IS NULL OR v_amount < 0 THEN
+    RETURN jsonb_build_object('settled', false, 'reason', 'invalid_settlement');
+  END IF;
+  INSERT INTO lm_provider_voice_buckets(scope, uid, budget_day)
+    VALUES ('user', v_uid, v_day), ('global', '', v_day)
+    ON CONFLICT (scope, uid, budget_day) DO NOTHING;
+  PERFORM 1 FROM lm_provider_voice_buckets
+    WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day FOR UPDATE;
+  PERFORM 1 FROM lm_provider_voice_buckets
+    WHERE scope = 'global' AND uid = '' AND budget_day = v_day FOR UPDATE;
+  INSERT INTO lm_provider_voice_settlements(request_id, uid, budget_day, amount_usd)
+    VALUES (p_request_id, v_uid, v_day, v_amount)
+    ON CONFLICT (request_id) DO NOTHING;
+  IF NOT FOUND THEN
+    RETURN jsonb_build_object('settled', true, 'duplicate', true);
+  END IF;
+  IF p_reservation_request_id IS NOT NULL THEN
+    SELECT projected_usd INTO v_reserved FROM lm_provider_budget_claims
+      WHERE uid = v_uid AND budget_day = v_day AND request_id = p_reservation_request_id AND is_voice = true;
+    v_reserved := coalesce(v_reserved, 0);
+  END IF;
+  UPDATE lm_provider_voice_buckets
+    SET settled_usd = settled_usd + v_amount,
+        reserved_usd = greatest(0, reserved_usd - v_reserved), updated_at = now()
+    WHERE scope = 'user' AND uid = v_uid AND budget_day = v_day;
+  UPDATE lm_provider_voice_buckets
+    SET settled_usd = settled_usd + v_amount,
+        reserved_usd = greatest(0, reserved_usd - v_reserved), updated_at = now()
+    WHERE scope = 'global' AND uid = '' AND budget_day = v_day;
+  RETURN jsonb_build_object('settled', true, 'duplicate', false);
+END;
+$$;
diff --git a/apps/life-manager/scheduler.js b/apps/life-manager/scheduler.js
index 0679e7547..ea6cca34f 100644
--- a/apps/life-manager/scheduler.js
+++ b/apps/life-manager/scheduler.js
@@ -472,20 +472,22 @@ async function wakeCallOnce(u, nowMs, deps = {}) {
         const fresh = await (deps.claimWake || claimWake)(u.uid, eventKey);
         if (!fresh) continue; // already called for this (event, level)
         // A coarser level the call above superseded must never ring later, so it is CLAIMED here and
         // left uncalled — the claim is what stops a future tick from resurrecting it.
         if (lvl !== due[0]) continue;
         const streamUrl = buildStreamUrl({ ...ev, wakeUid: u.uid, wakeEventKey: eventKey }, lvl.urgency, langForUser(u), u.name);
         let res;
         try {
           res = await (deps.placeCall || placeCall)({
             to: u.phone, streamUrl, uid: u.uid,
+            projectedUsd: Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) > 0
+              ? Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) : 0.05,
             authorizeProviderOperation: deps.authorizeProviderOperation || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
               ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
               : undefined),
           });
         } catch (e) {
           res = { ok: false, error: String((e && e.message) || e) };
         }
         if (res.ok) {
           console.log(`[scheduler] WAKE T-${lvl.min} uid=${u.uid.slice(0, 12)} "${ev.summary}" ccid=${res.ccid}`);
         } else {
diff --git a/apps/life-manager/server.js b/apps/life-manager/server.js
index ebb907ecd..b0063887f 100644
--- a/apps/life-manager/server.js
+++ b/apps/life-manager/server.js
@@ -67,20 +67,22 @@ const {
 const { handleDiscoveryCallback } = require("./lib/feature-discovery.js");
 const { handlePayoutCallback } = require("./lib/payout-question.js");
 const { handleDietCallback } = require("./lib/diet-runtime.js");
 const { handlePreceptsCallback } = require("./lib/precepts-runtime.js");
 const { handleTypedPayoutAddress } = require("./lib/payout-address-intake.js");
 const { handleBrowserTaskMessage } = require("./lib/browser-task-intake.js");
 const { startBrowserJobLoop } = require("./lib/browser-job-runtime.js");
 const { claimEvent, unclaimEvent, applyBilling } = require("./lib/billing.js");
 const { recordProviderCost: writeProviderCost } = require("./lib/ledger.js");
 const { recordGeminiSession } = require("./lib/provider-cost-adapters.js");
+const { recordTelnyxCdr } = require("./lib/provider-cost-adapters.js");
+const { startProviderCostImportLoop } = require("./lib/provider-cost-imports.js");
 const { authorizeProviderOperation: authorizeBudget } = require("./lib/provider-budget.js");
 const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder"); // apiKey unused by constructEvent
 const SUPA_URL = process.env.SUPABASE_URL, SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const COMPOSIO_KEY = process.env.COMPOSIO_API_KEY;
 const LM_INBOUND_SECRET = process.env.LM_INBOUND_SECRET || ""; // shared secret in the Resend inbound webhook URL
 
 const LM_TG_TOKEN = process.env.LM_TELEGRAM_BOT_TOKEN || "";
 const LM_TG_SECRET = process.env.LM_TELEGRAM_WEBHOOK_SECRET || "";
 const LM_LATE_APPROVAL_CALLBACK_SECRET = process.env.LM_LATE_APPROVAL_CALLBACK_SECRET
   || process.env.LM_UID_SECRET || LM_TG_SECRET || undefined;
@@ -288,20 +290,40 @@ const server = http.createServer((req, res) => {
         timestamp: req.headers["telnyx-timestamp"],
         publicKey: process.env.TELNYX_PUBLIC_KEY,
       });
       if (!verified) { res.writeHead(403); res.end("invalid signature"); return; }
 
       let event;
       try { event = JSON.parse(rawBody.toString("utf8")); }
       catch { res.writeHead(400); res.end("invalid json"); return; }
       const data = event && event.data;
       const payload = data && data.payload;
+      // Telnyx CDR/call-ended deliveries are a production measurement source,
+      // not a best-effort dashboard import. Persist one CDR row per event ID
+      // before acknowledging the webhook; the provider/request unique index
+      // makes redelivery idempotent.
+      if (data && payload && /call\.(?:hangup|ended|cost|cdr)/iu.test(String(data.event_type || ""))) {
+        const state = decodeCallClientState(payload.client_state);
+        const cdrUid = state && state.kind === "wake" ? state.wakeUid : state && state.kind === "test" ? state.testUid : null;
+        const cdrId = payload.id || payload.call_control_id || data.id || crypto.randomUUID();
+        const cdrRecorded = await recordTelnyxCdr({
+          uid: cdrUid,
+          requestId: `telnyx:cdr:${String(cdrId)}`,
+          durationSeconds: payload.billed_duration || payload.duration_seconds || payload.duration,
+          cdr: payload,
+        }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY });
+        if (!cdrRecorded && SUPA_URL && SUPA_KEY) {
+          res.writeHead(503, { "content-type": "text/plain" });
+          res.end("cdr record failed; send it again");
+          return;
+        }
+      }
       if (!data || data.event_type !== "call.machine.detection.ended" || !payload) {
         res.writeHead(200); res.end("ignored"); return;
       }
       const call = decodeCallClientState(payload.client_state);
       // spec §3 row 2d: a /test-call detection arrives here too, and it is handled BEFORE the wake
       // path because it has no lm_wake_log row to write on — the code below would PATCH nothing and
       // report matched=0 forever. It still costs the same money on a voicemail, so it still hangs up.
       if (call && call.kind === "test") {
         const detection = await applyTestCallDetection({
           result: payload.result, callControlId: payload.call_control_id,
@@ -456,21 +478,25 @@ const server = http.createServer((req, res) => {
           startIso: body.dateTime || new Date(Date.now() + 15 * 60000).toISOString(),
           location: (body.location || "").toString().slice(0, 200),
         };
         const urgency = ["gentle", "firm", "harsh"].includes(body.urgency) ? body.urgency : "gentle";
         const streamUrl = buildStreamUrl(ev, urgency, lang, u.name);
         // spec §3 row 2d: say who this call is. The stream URL cannot carry it — its query is signed
         // by signCtx over a fixed array the /ws bridge re-verifies — so the state rides beside it. An
         // unnamed call is what made the detection webhook return "no wake context" and let every test
         // call that hit a voicemail run to the carrier's 120-second recording limit.
         const result = await placeCall({
-          to: phone, streamUrl, clientState: encodeTestCallClientState({ testUid: body.uid }),
+          to: phone, uid: body.uid, streamUrl, clientState: encodeTestCallClientState({ testUid: body.uid }),
+          projectedUsd: Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) > 0
+            ? Number(process.env.LM_TELNYX_PROJECTED_CALL_USD) : 0.05,
+          authorizeProviderOperation: SUPA_URL && SUPA_KEY
+            ? (input) => authorizeBudget(input, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }) : undefined,
         });
         return reply(result.ok ? 200 : 502, result);
       } catch (e) {
         return reply(502, { error: String(e) });
       }
     })();
     return;
   }
   // POST /telegram — the Life Manager bot webhook. Telegram echoes our secret in a header; reject
   // anything that doesn't match (so strangers can't post fake updates). /start hands the user to the
@@ -890,24 +916,27 @@ wss.on("connection", (carrierWs, req) => {
   const carrierSend = (o) => { if (carrierWs.readyState === WebSocket.OPEN) carrierWs.send(JSON.stringify(o)); };
   const geminiSend = (o) => { if (gemini && gemini.readyState === WebSocket.OPEN) gemini.send(JSON.stringify(o)); };
 
   // Open the Gemini Live bridge (billed, ~$0.023/min). Called on the Telnyx `start` frame (call
   // answered) — this IS the default path now, not an escalation. If the socket drops before any audio
   // was heard, retry ONCE; a second pre-audio failure ends the call cleanly (never silence, never a
   // clip fallback).
   async function openGeminiLive() {
     if (gemini || geminiOpening) return;
     geminiOpening = true;
+    const geminiRequestId = `gemini:session:${wakeUid || "anonymous"}:${Date.now()}:${crypto.randomUUID()}`;
+    const geminiProjection = Number(process.env.LM_GEMINI_PROJECTED_SESSION_USD) > 0
+      ? Number(process.env.LM_GEMINI_PROJECTED_SESSION_USD) : 0.023;
     if (SUPA_URL && SUPA_KEY) {
       const decision = await authorizeBudget({
         uid: wakeUid || null, provider: "gemini", operation: "session", essential: true,
-        projectedUsd: Number(process.env.LM_GEMINI_PROJECTED_SESSION_USD) || 0,
+        requestId: geminiRequestId, projectedUsd: geminiProjection,
       }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY });
       if (!decision.allowed) {
         geminiOpening = false;
         console.error(`[bridge] Gemini session blocked by provider budget: ${decision.reason}`);
         try { carrierWs.close(1013, "provider budget"); } catch {}
         return;
       }
     }
     geminiOpening = false;
     liveWsOpened++;
@@ -947,21 +976,21 @@ wss.on("connection", (carrierWs, req) => {
       log: (reason) => console.log(`[bridge] gemini ${reason} gotAudio=${gotAudio} reconnects=${geminiReconnects}`),
     });
     gemini.on("error", (e) => onGeminiEnd(`err ${e.message}`));
     gemini.on("close", () => {
       if (!geminiCostRecorded) {
         geminiCostRecorded = true;
         const quantity = Math.max(0, (Date.now() - geminiStartedAtMs) / 1000);
         // Google bills Live API by token usage. Preserve provider usage metadata when supplied;
         // otherwise the adapter records a wall-time estimate with actual_status=unknown.
         void recordGeminiSession({
-          uid: wakeUid || null, requestId: `gemini:${wakeUid || "anonymous"}:${geminiStartedAtMs}`,
+          uid: wakeUid || null, requestId: geminiRequestId,
           durationSeconds: quantity, usageMetadata: geminiUsageMetadata,
           metadata: { kind: "gemini_live", reconnect: geminiReconnects },
         }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }).catch(() => false);
       }
       onGeminiEnd("closed");
     });
   }
 
   carrierWs.on("message", (data) => {
     let msg;
@@ -1022,20 +1051,26 @@ if (require.main === module) {
     // A comp window silently changes who gets past the paywall and who the scheduler picks up, so it
     // announces itself once at boot — an operator must never have to guess whether it is on.
     const compBanner = compBootLog(process.env);
     if (compBanner) console.log(compBanner);
     // SINGLE-WRITER (B3): run the scheduler loops in-process ONLY when LIFE_RUN_LOOPS!=="false".
     // The /ws Telnyx⇄Gemini-Live voice bridge + /test-call + /telegram endpoints are ALWAYS on regardless.
     // As an OpenClaw voice daemon, set LIFE_RUN_LOOPS=false so the cron-COMMAND jobs (B2) own the loops.
     const loops = maybeStartLoops(process.env, {
       startScheduler, startWakeLoop, startTravelLoop, startAskLoop, startOnboardLoop, startDiscoveryLoop,
     });
+    // Measurement imports are independent from the user-facing scheduler. They
+    // run in production whenever a provider source is configured, and a failed
+    // source produces a visible receipt instead of a synthetic zero.
+    if (SUPA_URL && SUPA_KEY) {
+      startProviderCostImportLoop({ options: { supaUrl: SUPA_URL, supaKey: SUPA_KEY } });
+    }
     console.log(`[life-call] ${loops.started ? "loops ON (standalone)" : "VOICE DAEMON (loops OFF)"} — ${loops.reason}`);
     const browserJobs = startBrowserJobLoop({
       enabled: process.env.LM_BROWSER_TASKS_ENABLED === "1",
     });
     console.log(`[life-call] browser jobs ${browserJobs.enabled ? "ON (Railway private Steel)" : "OFF"}`);
     // INC-3: register our own webhook from our own env — registration and comparison are one value.
     selfHealWebhook(process.env).then((r) => {
       console.log(`[life-call] webhook self-heal: healed=${r.healed} ${r.reason}`);
     }).catch((e) => console.error(`[life-call] webhook self-heal error ${e && e.message}`));
   });
diff --git a/apps/life-manager/test/provider-cost-contract.test.js b/apps/life-manager/test/provider-cost-contract.test.js
index 2d1628a38..12ac960c0 100644
--- a/apps/life-manager/test/provider-cost-contract.test.js
+++ b/apps/life-manager/test/provider-cost-contract.test.js
@@ -17,81 +17,88 @@ const BASE = {
   operation: "address_lookup",
   uid: "u1",
   requestId: "req-1",
   quantity: 1,
   unit: "request",
   pricingVersion: "maps-2026-01",
   estimatedUsd: 0.005,
   metadata: { source: "travel" },
 };
 
-test("provider cost migration adds complete dimensions and explicit actual status", () => {
+test("provider cost migration adds complete dimensions and separate actual status/classification", () => {
   const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
   for (const field of ["provider", "sku", "operation", "request_id", "pricing_version", "estimated_usd", "actual_billed_usd", "actual_status"]) {
     assert.match(sql, new RegExp(`add column if not exists ${field}`));
   }
   assert.match(sql, /actual_status/);
+  assert.match(sql, /cost_classification/);
+  assert.match(sql, /actual_status[^;]+known/);
   assert.match(sql, /lm_provider_cost_failures/);
 });
 
-test("recordProviderCost records all dimensions and measured actual billing", async () => {
+test("recordProviderCost records all dimensions and known actual billing", async () => {
   const calls = [];
   const ok = await loadLedger().recordProviderCost({
     ...BASE,
     actualBilledUsd: 0.0042,
-    actualStatus: "measured",
+    actualStatus: "known",
+    costClassification: "measured",
   }, {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
   });
   assert.equal(ok, true);
   assert.equal(calls.length, 1);
   const body = JSON.parse(calls[0][1].body);
   assert.deepEqual(body, {
     uid: "u1",
     provider: "google_maps",
     sku: "geocoding",
     operation: "address_lookup",
     request_id: "req-1",
     quantity: 1,
     unit: "request",
     pricing_version: "maps-2026-01",
     estimated_usd: 0.005,
     actual_billed_usd: 0.0042,
-    actual_status: "measured",
+    actual_status: "known",
+    cost_classification: "measured",
+    est_usd: 0.005,
     metadata: { source: "travel" },
   });
 });
 
 test("missing provider billing is stored as null/unknown and never coerced to zero", async () => {
   const calls = [];
   const ok = await loadLedger().recordProviderCost({ ...BASE, requestId: "req-unknown" }, {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
   });
   assert.equal(ok, true);
   const body = JSON.parse(calls[0][1].body);
   assert.equal(body.actual_status, "unknown");
+  assert.equal(body.cost_classification, "estimated");
   assert.equal(body.actual_billed_usd, null);
   assert.notEqual(body.actual_billed_usd, 0);
   assert.equal(body.estimated_usd, BASE.estimatedUsd);
 });
 
 test("invalid actual status or dimensions fail closed without a provider write", async () => {
   let calls = 0;
   const deps = {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async () => { calls += 1; return { ok: true, status: 201 }; },
   };
   assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "fake" }, deps), false);
+  assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "measured", actualBilledUsd: 0.1 }, deps), false);
   assert.equal(await loadLedger().recordProviderCost({ ...BASE, quantity: -1 }, deps), false);
-  assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "measured" }, deps), false);
+  assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "known" }, deps), false);
   assert.equal(calls, 0);
 });
 
 test("ledger write failure emits a structured owner alert/outbox record and returns false", async () => {
   const alerts = [];
   const outbox = [];
   const ok = await loadLedger().recordProviderCost(BASE, {
     supaUrl: "https://db.example", supaKey: "service",
     fetchImpl: async () => ({ ok: false, status: 503 }),
     ownerAlert: async (event) => alerts.push(event),
