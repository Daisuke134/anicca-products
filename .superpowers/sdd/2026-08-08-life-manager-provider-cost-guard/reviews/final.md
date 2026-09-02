# Review package: dcd9ad9ad..ffcccdd666ad1cb00c9f58ee8619f3956624c8a1

## Commits
ffcccdd66 docs(life-manager): record budget gate receipt
a7604f2a6 feat(life-manager): enforce provider budget gates
8d2e6ec19 docs(life-manager): record provider instrumentation receipt
0c6616b86 feat(life-manager): instrument provider cost events
51afd1cf0 feat(life-manager): add provider cost adapters
062663d73 feat(life-manager): record truthful provider cost events
19f411f39 feat(life-manager): preserve transit facts and anchors
826d2837d feat(life-manager): make route cache durable and scoped
3381cf717 feat(life-manager): persist normalized geocode results

## Files changed
 .../progress.md                                    |  87 ++++++++
 apps/life-manager/lib/ask.js                       |   2 +-
 apps/life-manager/lib/composio-budget.test.js      |  21 ++
 apps/life-manager/lib/dial.js                      |   8 +-
 apps/life-manager/lib/geocode-cache.js             | 204 +++++++++++++++++
 apps/life-manager/lib/geocode-cache.test.js        | 118 ++++++++++
 apps/life-manager/lib/ledger.js                    | 183 ++++++++++++++-
 apps/life-manager/lib/mail-resend.js               |  30 ++-
 apps/life-manager/lib/mail-resend.test.js          |  15 ++
 apps/life-manager/lib/notify.js                    |   1 +
 apps/life-manager/lib/provider-budget.js           | 159 +++++++++++++
 apps/life-manager/lib/provider-budget.test.js      |  82 +++++++
 apps/life-manager/lib/provider-cost-adapters.js    | 167 ++++++++++++++
 .../lib/provider-cost-adapters.test.js             | 172 ++++++++++++++
 apps/life-manager/lib/provider-cost-imports.js     |  82 +++++++
 .../life-manager/lib/provider-cost-imports.test.js |  53 +++++
 apps/life-manager/lib/route-cache.js               | 246 ++++++++++++++++++--
 apps/life-manager/lib/route-cache.test.js          |  90 +++++++-
 apps/life-manager/lib/transit.js                   | 115 +++++++++-
 apps/life-manager/lib/transit.test.js              |  61 +++++
 .../lib/transport/calendar-composio.js             |  44 +++-
 apps/life-manager/lib/travel-routes.test.js        |  28 ++-
 apps/life-manager/lib/travel-transit-wire.test.js  |  49 ++++
 apps/life-manager/lib/travel.js                    | 247 +++++++++++++++++----
 .../migrations/2026-08-08-lm-provider-cost.sql     | 110 +++++++++
 apps/life-manager/scheduler.js                     |  11 +-
 apps/life-manager/server.js                        |  51 ++++-
 .../test/mobile-geocode-cost-guard.test.js         |  61 +++++
 .../life-manager/test/provider-budget-gate.test.js |  84 +++++++
 .../test/provider-cost-contract.test.js            | 108 +++++++++
 30 files changed, 2578 insertions(+), 111 deletions(-)

## Diff
diff --git a/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
new file mode 100644
index 000000000..84f22c287
--- /dev/null
+++ b/.superpowers/sdd/2026-08-08-life-manager-provider-cost-guard/progress.md
@@ -0,0 +1,87 @@
+# Provider cost guard SDD progress
+
+## Scope
+
+- Branch: `feat/lm-provider-cost-guard`
+- Plan: `docs/superpowers/plans/2026-08-08-life-manager-provider-cost-guard.md`
+- Runtime scope: code/tests only; no production environment or deployment changes.
+- Ownership: provider cost, geocode cache, route cache, provider budget, and related migrations/tests.
+
+## Initial audit
+
+- [x] Read the executable plan and applicable Superpowers TDD/executing-plans instructions.
+- [x] Confirmed branch is isolated from `canonical/main` and worktree is initially clean.
+- [x] Run clean dependency install and record focused baseline.
+
+## Slice receipts
+
+| Slice | Status | RED | GREEN | Commit |
+|---|---|---|---|---|
+| 1. Persistent geocodes | GREEN | missing-module | 6/6 focused + 43/43 baseline | `3381cf717` |
+| 2. Durable route cache | GREEN | original suite + new scope tests | 15/15 route/transit + 62/62 travel regression | `826d2837d` |
+| 3. Transit facts/fallback | GREEN | structured projection + anchor tests | 31/31 transit/route tests; 59/59 combined focused | `19f411f39` |
+| 4. Truthful cost event | GREEN | 5 contract failures (missing API) | 12/12 ledger contract | `062663d73` |
+| 5. Provider instrumentation | GREEN | adapter module/import module missing | 77/77 provider + focused regression | `0c6616b86` |
+| 6. Budget policy | GREEN | missing-module | 12/12 budget/gate + 90/90 full focused | `a7604f2a6` |
+| 7. Owner report/deploy/measure | code-only pending | — | — | — |
+
+## Known baseline
+
+`npm ci` completed in `apps/life-manager` (Node dependency audit reported 24 existing npm audit findings; no dependency changes were made).
+
+Focused baseline command:
+
+```text
+node --test lib/travel-transit-wire.test.js lib/transit.test.js lib/route-cache.test.js lib/travel-routes.test.js lib/ledger.test.js lib/composio-budget.test.js
+```
+
+Result: 43/43 passed, 0 failed, 0 skipped (2026-08-08).
+
+## Task 1 receipt
+
+- RED: both new test files failed at module load with `Cannot find module './geocode-cache.js'` / `../lib/geocode-cache.js`.
+- GREEN: `node --test lib/geocode-cache.test.js test/mobile-geocode-cost-guard.test.js` → 6/6 passed.
+- GREEN regression: original focused suite → 43/43 passed.
+- Implementation: normalized NFKC/case/whitespace keys, Supabase REST get/merge-put adapter, valid-result-only persistence, process read-through, and `travel.js` production injection via `supaUrl`/`supaKey`.
+- Migration added: `apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql`.
+- No staging/production mutation was performed; migration application is intentionally deferred to the integration/deploy gate.
+
+## Task 2 receipt
+
+- RED intent: the added scope/persistence tests target the old cache's shared geo/bucket identity and process-only Map; implementation was then replaced with the complete context key and durable adapter.
+- GREEN: `node --test lib/route-cache.test.js lib/travel-transit-wire.test.js` → 15/15 passed.
+- GREEN regression: `node --test lib/route-cache.test.js lib/travel-transit-wire.test.js lib/travel-routes.test.js lib/travel.test.js lib/travel-return.test.js` → 62/62 passed.
+- Key now scopes uid, normalized origin/destination, event anchor, timezone, direction, provider, and route mode; in-flight coalescing prevents concurrent duplicate provider work.
+- `createSupabaseRouteStore` uses `cache_key` upsert and stores structured `route_result`; `fillTravel` injects durable geocode and route stores when Supabase credentials are present.
+- Migration extends `lm_route_cache` and drops the old shared uniqueness constraint before creating the complete-key index.
+
+## Task 3 receipt
+
+- GREEN: Transit parser now preserves provider, computed timestamp when supplied, IANA timezone, event-date departure/arrival instants, access/egress walks, transfer count, fare, ordered steps, nullable platform/geometry, and explicit availability flags. Unsupported entrance/exit/best-car/crowding fields are not copied.
+- GREEN: free provider queries `/plan` and `/guidance/plan` sequentially with the same date/time and `type=arrival` for outbound or `type=departure` for return.
+- GREEN: `directionsRoute` returns structured `{provider, minutes, route}` while `directionsMinutes` remains the integer-minute adapter for existing scheduler callers.
+- Verification: `node --test lib/transit.test.js lib/travel-transit-wire.test.js lib/travel-routes.test.js` → 31/31; combined cost/route/geocode focus → 59/59.
+
+## Task 4 receipt
+
+- RED: `node --test lib/ledger.test.js test/provider-cost-contract.test.js` → legacy 7 tests passed, all 5 new contract tests failed (missing migration failure table and `recordProviderCost`).
+- GREEN: same command → 12/12 passed.
+- `recordProviderCost` validates all dimensions, preserves nullable actual billing, defaults absent actuals to `actual_status="unknown"`, and rejects contradictory/invalid statuses without writing.
+- Ledger failures return `false` and emit a structured `provider_cost_ledger_write_failed` event through the configured owner alert and durable outbox seam.
+- Migration adds additive ledger columns, actual-status check, request idempotency index, and service-role-only failure outbox table.
+
+## Task 5 receipt
+
+- RED: `node --test lib/provider-cost-adapters.test.js` failed at module load with `Cannot find module './provider-cost-adapters.js'`.
+- GREEN (adapter core): the new recorder adapters cover Google Geocoding/Routes, Transit, Composio, Gemini, Telnyx CDR, Resend, Railway, and Supabase; `node --test lib/provider-cost-adapters.test.js` → 10/10 passed.
+- GREEN (runtime wiring): geocode misses, Google Routes/legacy transit, Transit `/plan` + guidance, Composio calls, Resend sends, Gemini Live sessions, and Telnyx call sessions now emit complete events. Cache hits do not emit provider spend.
+- GREEN (scheduled imports): `provider-cost-imports.js` imports Telnyx CDR actuals and Railway/Supabase allocations; loader failures return a failure receipt and write no synthetic zero row. `node --test lib/provider-cost-imports.test.js` → 3/3 passed.
+- GREEN focused verification: `node --test lib/provider-cost-adapters.test.js lib/provider-cost-imports.test.js lib/composio-budget.test.js lib/mail-resend.test.js lib/ledger.test.js lib/travel-transit-wire.test.js lib/transit.test.js lib/route-cache.test.js lib/travel-routes.test.js test/provider-cost-contract.test.js` → 77/77 passed.
+
+## Task 6 receipt
+
+- RED: `node --test lib/provider-budget.test.js` failed at module load with `Cannot find module './provider-budget.js'`.
+- GREEN: pure policy covers normal/warning/degraded/stopped thresholds at `$0.50/$1.00/$2.00`, preserves unknown billing as a reason, and enforces independent user/global voice caps.
+- GREEN: cached route/calendar/geocode reads bypass budget reads; denied Google geocoding/fallback, nonessential Composio refresh, and Telnyx calls make zero paid-provider requests. Gemini Live checks the gate before opening a session.
+- GREEN: migration adds unique `(uid,budget_day,request_id)` atomic claim identity; `claimProviderBudget` provides the service-role insert seam.
+- Verification: `node --test lib/provider-budget.test.js test/provider-budget-gate.test.js` → 12/12 passed; the complete plan verification command (baseline + geocode + cost adapters/imports + budget + all contract tests) → 90/90 passed. The original pre-change baseline remains the recorded 43/43; the 54/54 route/ledger/Composio run includes the Task 5 Composio assertion added afterward.
diff --git a/apps/life-manager/lib/ask.js b/apps/life-manager/lib/ask.js
index fc8c9125c..8ef034178 100644
--- a/apps/life-manager/lib/ask.js
+++ b/apps/life-manager/lib/ask.js
@@ -436,21 +436,21 @@ async function askTick(uid, opts) {
       semanticKey, questionType, questionContext, telegramChatId: opts.telegramChatId,
     }))) continue;
     let sent = false;
     if (opts.telegramChatId && opts.telegramToken) {
       const message = questionType === "calendar_online"
         ? closedOnlineAskMessage(event, interpretation, replyToken)
         : { text: `場所はどこですか？住所か、お店・会社の名前を送ってください。`, extra: undefined };
       const r = await tgSend(opts.telegramToken, opts.telegramChatId, message.text, message.extra);
       sent = !!(r && r.ok);
     } else if (questionType !== "calendar_online" && userEmail && resendKey) {
-      const r = await sendAsk({ to: userEmail, replyToken, event, resendKey });
+      const r = await sendAsk({ to: userEmail, replyToken, event, resendKey, uid });
       sent = !!(r && r.sent);
     }
     if (sent) asked++;
     else await unclaimAsk(uid, event.id, supaUrl, supaKey); // send failed → release so next tick retries
   }
 
   // Replies (email + Telegram) both arrive via webhooks now — Telegram → /telegram, email → /inbound-email.
   // Neither polls an inbox, so there is no read step here.
   return { autofilled, asked, resolved };
 }
diff --git a/apps/life-manager/lib/composio-budget.test.js b/apps/life-manager/lib/composio-budget.test.js
index ce640af26..172d93364 100644
--- a/apps/life-manager/lib/composio-budget.test.js
+++ b/apps/life-manager/lib/composio-budget.test.js
@@ -31,10 +31,31 @@ test("each real Composio execution records one composio_call without making ledg
   const records = [];
   global.fetch = async () => ({ json: async () => ({ successful: true, data: { items: [] } }) });
   try {
     const calendar = makeComposioCalendar({ apiKey: "k", recordCall: async (uid, tool) => records.push({ uid, tool }) });
     assert.deepEqual(await calendar.listEventsRaw("u1", {}), []);
     assert.deepEqual(records, [{ uid: "u1", tool: "GOOGLECALENDAR_EVENTS_LIST" }]);
     const resilient = makeComposioCalendar({ apiKey: "k", recordCall: async () => { throw new Error("ledger down"); } });
     assert.deepEqual(await resilient.listEventsRaw("u1", {}), []);
   } finally { global.fetch = original; }
 });
+
+test("default Composio path records the complete provider event after a real tool request", async () => {
+  const providerCalls = [];
+  let composioCalls = 0;
+  const calendar = makeComposioCalendar({
+    apiKey: "k",
+    fetchImpl: async () => {
+      composioCalls += 1;
+      return { json: async () => ({ successful: true, data: { items: [] } }) };
+    },
+    recordProviderCost: async (event) => { providerCalls.push(event); return true; },
+  });
+  assert.deepEqual(await calendar.listEventsRaw("u1", {}), []);
+  assert.equal(composioCalls, 1);
+  assert.equal(providerCalls.length, 1);
+  assert.equal(providerCalls[0].provider, "composio");
+  assert.equal(providerCalls[0].operation, "tool_execute");
+  assert.equal(providerCalls[0].quantity, 1);
+  assert.equal(providerCalls[0].actualBilledUsd, null);
+  assert.equal(providerCalls[0].actualStatus, "unknown");
+});
diff --git a/apps/life-manager/lib/dial.js b/apps/life-manager/lib/dial.js
index d431e679a..476aa68b9 100644
--- a/apps/life-manager/lib/dial.js
+++ b/apps/life-manager/lib/dial.js
@@ -49,26 +49,32 @@ function amdDialOptions(streamUrl, env = process.env, opts = {}) {
     webhook_url: `${webhookProtocol}//${url.host}/telnyx-events`,
     webhook_url_method: "POST",
     ...(clientState ? { client_state: clientState } : {}),
   };
 }
 
 // to: E.164 callee. streamUrl: wss://<this-svc>/ws?summary=...&dateTime=...&location=...&urgency=...
 // clientState: OPTIONAL, for a caller whose identity is not in the stream URL (/test-call). Omitted,
 // the wake path derives it from the URL exactly as before.
 // Returns the call_control_id so the caller can issue record_start / streaming_start.
-async function placeCall({ to, streamUrl, clientState }) {
+async function placeCall({ to, streamUrl, clientState, uid, authorizeProviderOperation, projectedUsd }) {
   const API = process.env.TELNYX_API_KEY;
   const CONN = process.env.TELNYX_CONNECTION_ID;
   const FROM = process.env.TELNYX_PHONE_NUMBER;
   if (!API || !CONN || !FROM) return { ok: false, error: "telnyx env missing (API/CONN/FROM)" };
   if (!to || !streamUrl) return { ok: false, error: "to/streamUrl required" };
+  if (typeof authorizeProviderOperation === "function") {
+    const decision = await authorizeProviderOperation({
+      uid, provider: "telnyx", operation: "call_session", essential: true, cacheHit: false, projectedUsd,
+    });
+    if (decision && decision.allowed === false) return { ok: false, error: `provider budget denied: ${decision.reason || "stopped"}` };
+  }
 
   // Preflight: never dial on an empty balance (a mid-call cutoff is a fake "connected").
   const usd = await balanceUsd().catch(() => NaN);
   if (!Number.isFinite(usd) || usd < 0.5) return { ok: false, error: `telnyx balance too low ($${usd})` };
 
   const dialBody = {
     ...telnyxDialBody({ connectionId: CONN, to, from: FROM, streamUrl }),
     ...amdDialOptions(streamUrl, process.env, { clientState }),
   };
   let call;
diff --git a/apps/life-manager/lib/geocode-cache.js b/apps/life-manager/lib/geocode-cache.js
new file mode 100644
index 000000000..cb2a89e20
--- /dev/null
+++ b/apps/life-manager/lib/geocode-cache.js
@@ -0,0 +1,204 @@
+// Persistent address -> coordinate cache used by the cloud travel filler.
+//
+// Coordinates are a shared fact about an address, not a user-owned event.  The
+// cache therefore uses a canonical address key and is protected by the
+// backend's service-role-only Supabase table.  A process-local Map remains a
+// read-through optimization; it is never the production source of truth.
+"use strict";
+
+const DEFAULT_TABLE = "lm_geocode_cache";
+const { recordGoogleGeocoding } = require("./provider-cost-adapters.js");
+
+function normalizeGeocodeAddress(value) {
+  if (value == null) return "";
+  return String(value)
+    .normalize("NFKC")
+    .replace(/\s+/gu, " ")
+    .trim()
+    .toLocaleLowerCase("en-US");
+}
+
+function finiteCoordinate(value, min, max) {
+  const n = Number(value);
+  return Number.isFinite(n) && n >= min && n <= max ? n : null;
+}
+
+function validValue(value) {
+  if (!value || typeof value !== "object") return null;
+  const lat = finiteCoordinate(value.lat, -90, 90);
+  const lng = finiteCoordinate(value.lng == null ? value.lon : value.lng, -180, 180);
+  if (lat == null || lng == null) return null;
+  return {
+    lat,
+    lng,
+    provider: value.provider == null ? "google_geocoding" : String(value.provider),
+    resolvedAt: value.resolvedAt || value.resolved_at || new Date().toISOString(),
+  };
+}
+
+function authHeaders(key, extra) {
+  return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
+}
+
+function normalizeStoreRow(row) {
+  if (!row || typeof row !== "object") return null;
+  return validValue({
+    lat: row.lat,
+    lng: row.lng == null ? row.lon : row.lng,
+    provider: row.provider,
+    resolvedAt: row.resolved_at || row.resolvedAt,
+  });
+}
+
+function createSupabaseGeocodeStore({
+  supaUrl,
+  supaKey,
+  fetchImpl = globalThis.fetch,
+  now = () => Date.now(),
+  table = DEFAULT_TABLE,
+} = {}) {
+  const baseUrl = String(supaUrl || "").replace(/\/$/u, "");
+  const local = new Map();
+  const request = (addressKey) =>
+    `${baseUrl}/rest/v1/${encodeURIComponent(table)}?address_key=eq.${encodeURIComponent(addressKey)}&select=address_key,lat,lng,provider,resolved_at&limit=1`;
+
+  async function get(rawKey) {
+    const addressKey = normalizeGeocodeAddress(rawKey);
+    if (!addressKey) return null;
+    const localHit = local.get(addressKey);
+    if (localHit) return localHit;
+    if (!baseUrl || !supaKey || typeof fetchImpl !== "function") return null;
+    try {
+      const response = await fetchImpl(request(addressKey), { headers: authHeaders(supaKey) });
+      if (!response || !response.ok) return null;
+      const rows = await response.json();
+      const value = normalizeStoreRow(Array.isArray(rows) ? rows[0] : null);
+      if (value) local.set(addressKey, value);
+      return value;
+    } catch {
+      return null;
+    }
+  }
+
+  async function put(rawKey, rawValue) {
+    const addressKey = normalizeGeocodeAddress(rawKey);
+    const value = validValue(rawValue);
+    if (!addressKey || !value || !baseUrl || !supaKey || typeof fetchImpl !== "function") return false;
+    const body = {
+      address_key: addressKey,
+      lat: value.lat,
+      lng: value.lng,
+      provider: value.provider,
+      resolved_at: value.resolvedAt,
+    };
+    try {
+      const response = await fetchImpl(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`, {
+        method: "POST",
+        headers: authHeaders(supaKey, {
+          "Content-Type": "application/json",
+          Prefer: "resolution=merge-duplicates,return=minimal",
+        }),
+        body: JSON.stringify(body),
+      });
+      if (!response || !response.ok) return false;
+      local.set(addressKey, value);
+      return true;
+    } catch {
+      return false;
+    }
+  }
+
+  // Exposed for tests and diagnostics without making local state authoritative.
+  void now;
+  return { get, put };
+}
+
+const processMemo = new Map();
+let defaultStore;
+
+function getDefaultStore() {
+  if (defaultStore !== undefined) return defaultStore;
+  const supaUrl = process.env.SUPABASE_URL;
+  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
+  defaultStore = supaUrl && supaKey
+    ? createSupabaseGeocodeStore({ supaUrl, supaKey })
+    : null;
+  return defaultStore;
+}
+
+function valueToGeo(value) {
+  const valid = validValue(value);
+  return valid ? { lat: valid.lat, lon: valid.lng } : null;
+}
+
+// Geocode through the durable store first, then Google exactly once for a
+// miss.  Failed/empty provider responses never enter either cache.
+async function geocodeAddress(addr, mapsKey, {
+  store = getDefaultStore(),
+  fetchImpl = globalThis.fetch,
+  now = () => new Date().toISOString(),
+  uid = null,
+  requestId,
+  recordProviderCost,
+  authorizeProviderOperation,
+} = {}) {
+  const addressKey = normalizeGeocodeAddress(addr);
+  if (!addressKey || !mapsKey) return null;
+  if (processMemo.has(addressKey)) return processMemo.get(addressKey);
+
+  if (store && typeof store.get === "function") {
+    const cached = valueToGeo(await Promise.resolve(store.get(addressKey)).catch(() => null));
+    if (cached) {
+      processMemo.set(addressKey, cached);
+      return cached;
+    }
+  }
+
+  if (typeof authorizeProviderOperation === "function") {
+    const decision = await authorizeProviderOperation({
+      uid, provider: "google", operation: "geocoding", essential: false, cacheHit: false,
+    });
+    if (decision && decision.allowed === false) return null;
+  }
+  if (typeof fetchImpl !== "function") return null;
+  try {
+    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${encodeURIComponent(mapsKey)}`;
+    const response = await fetchImpl(url);
+    if (!response || !response.ok) return null;
+    const json = await response.json();
+    const location = json && Array.isArray(json.results) && json.results[0]
+      && json.results[0].geometry && json.results[0].geometry.location;
+    const value = validValue({
+      lat: location && location.lat,
+      lng: location && (location.lng == null ? location.lon : location.lng),
+      provider: "google_geocoding",
+      resolvedAt: now(),
+    });
+    if (!value) return null;
+    const geo = { lat: value.lat, lon: value.lng };
+    processMemo.set(addressKey, geo);
+    if (store && typeof store.put === "function") await Promise.resolve(store.put(addressKey, value)).catch(() => false);
+    if (typeof recordProviderCost === "function") {
+      await recordGoogleGeocoding({
+        uid,
+        requestId: requestId || `google:geocoding:${addressKey}`,
+        metadata: { cache: "miss" },
+      }, { recordProviderCost }).catch(() => false);
+    }
+    return geo;
+  } catch {
+    return null;
+  }
+}
+
+function clearGeocodeProcessMemo() {
+  processMemo.clear();
+}
+
+module.exports = {
+  DEFAULT_TABLE,
+  normalizeGeocodeAddress,
+  createSupabaseGeocodeStore,
+  geocodeAddress,
+  clearGeocodeProcessMemo,
+};
diff --git a/apps/life-manager/lib/geocode-cache.test.js b/apps/life-manager/lib/geocode-cache.test.js
new file mode 100644
index 000000000..402d2d67a
--- /dev/null
+++ b/apps/life-manager/lib/geocode-cache.test.js
@@ -0,0 +1,118 @@
+"use strict";
+
+const { test } = require("node:test");
+const assert = require("node:assert/strict");
+
+const {
+  normalizeGeocodeAddress,
+  createSupabaseGeocodeStore,
+  geocodeAddress,
+} = require("./geocode-cache.js");
+
+const SUPA = { supaUrl: "https://supa.invalid", supaKey: "service-role-key" };
+
+function response(body, status = 200) {
+  return { ok: status >= 200 && status < 300, status, json: async () => body };
+}
+
+function persistentFetch() {
+  const rows = new Map();
+  const calls = [];
+  const fetchImpl = async (input, init = {}) => {
+    const url = new URL(String(input));
+    calls.push({ url, init });
+    if (init.method === "POST") {
+      const body = JSON.parse(init.body);
+      rows.set(body.address_key, body);
+      return response([], 201);
+    }
+    const expression = url.searchParams.get("address_key") || "";
+    const key = expression.startsWith("eq.") ? expression.slice(3) : expression;
+    const row = rows.get(key);
+    return response(row ? [row] : []);
+  };
+  return { fetchImpl, rows, calls };
+}
+
+test("normalizeGeocodeAddress collapses case, Unicode whitespace, and compatibility forms", () => {
+  assert.equal(
+    normalizeGeocodeAddress("  ＭＡＩＮ　  Street\n 12 "),
+    "main street 12",
+  );
+  assert.equal(normalizeGeocodeAddress("main street 12"), "main street 12");
+  assert.equal(normalizeGeocodeAddress(" \t\n "), "");
+});
+
+test("Supabase geocode store persists a successful result across store instances", async () => {
+  const db = persistentFetch();
+  const first = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  const second = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  const key = normalizeGeocodeAddress(" 1-2 MAIN STREET ");
+  const value = {
+    lat: 35.681236,
+    lng: 139.767125,
+    provider: "google_geocoding",
+    resolvedAt: "2026-08-08T06:00:00.000Z",
+  };
+
+  assert.equal(await first.put(key, value), true);
+  assert.deepEqual(await second.get("1-2 main\nstreet"), value);
+  assert.equal(db.rows.size, 1);
+  assert.equal(db.calls.filter((call) => call.init.method === "POST").length, 1);
+});
+
+test("geocodeAddress writes only a valid result and a second process avoids Google", async () => {
+  const db = persistentFetch();
+  let googleCalls = 0;
+  const googleFetch = async () => {
+    googleCalls += 1;
+    return response({ results: [{ geometry: { location: { lat: 35.68, lng: 139.76 } } }] });
+  };
+  const first = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  const second = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+
+  const firstResult = await geocodeAddress(" 1-2 MAIN STREET ", "maps-key", {
+    store: first,
+    fetchImpl: googleFetch,
+    now: () => "2026-08-08T06:00:00.000Z",
+  });
+  const secondResult = await geocodeAddress("1-2 main\nstreet", "maps-key", {
+    store: second,
+    fetchImpl: googleFetch,
+    now: () => "2026-08-08T06:01:00.000Z",
+  });
+
+  assert.equal(googleCalls, 1);
+  assert.equal(firstResult.lat, 35.68);
+  assert.equal(firstResult.lon, 139.76);
+  assert.equal(secondResult.lat, 35.68);
+  assert.equal(secondResult.lon, 139.76);
+});
+
+test("empty or failed Google responses remain misses and are never persisted", async () => {
+  const db = persistentFetch();
+  const store = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  let googleCalls = 0;
+  const googleFetch = async () => {
+    googleCalls += 1;
+    return googleCalls === 1
+      ? response({ results: [] })
+      : response({ status: "REQUEST_DENIED", results: [] }, 403);
+  };
+
+  assert.equal(await geocodeAddress("empty place", "maps-key", { store, fetchImpl: googleFetch }), null);
+  assert.equal(await geocodeAddress("empty place", "maps-key", { store, fetchImpl: googleFetch }), null);
+  assert.equal(await geocodeAddress("failed place", "maps-key", { store, fetchImpl: googleFetch }), null);
+  assert.equal(googleCalls, 3);
+  assert.equal(db.rows.size, 0);
+  assert.equal(db.calls.filter((call) => call.init.method === "POST").length, 0);
+});
+
+test("cache keys carry no tenant identity or caller-controlled query fragments", async () => {
+  const db = persistentFetch();
+  const store = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  await store.get("Tenant A\n1 Main & Home");
+  const request = db.calls[0];
+  assert.equal(request.url.searchParams.get("address_key"), "eq.tenant a 1 main & home");
+  assert.equal(request.url.searchParams.has("uid"), false);
+});
diff --git a/apps/life-manager/lib/ledger.js b/apps/life-manager/lib/ledger.js
index 2ca9e85b5..c87d1ab4e 100644
--- a/apps/life-manager/lib/ledger.js
+++ b/apps/life-manager/lib/ledger.js
@@ -1,16 +1,163 @@
 "use strict";
 
 function headers(key, extra) {
   return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
 }
 
+const ACTUAL_STATUS = new Set(["measured", "estimated", "unknown"]);
+
+function nonEmpty(value, field) {
+  const text = value == null ? "" : String(value).trim();
+  if (!text) throw new Error(`${field} is required`);
+  return text;
+}
+
+function nonNegative(value, field, { nullable = false } = {}) {
+  if (value == null && nullable) return null;
+  const number = Number(value);
+  if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number or null`);
+  return number;
+}
+
+function validateProviderCostEvent(input = {}) {
+  const provider = nonEmpty(input.provider, "provider");
+  const sku = nonEmpty(input.sku, "sku");
+  const operation = nonEmpty(input.operation, "operation");
+  const requestId = nonEmpty(input.requestId, "requestId");
+  const unit = nonEmpty(input.unit, "unit");
+  const pricingVersion = nonEmpty(input.pricingVersion, "pricingVersion");
+  const quantity = nonNegative(input.quantity, "quantity");
+  const estimatedUsd = nonNegative(input.estimatedUsd, "estimatedUsd", { nullable: true });
+  const actualBilledUsd = nonNegative(input.actualBilledUsd, "actualBilledUsd", { nullable: true });
+  const actualStatus = input.actualStatus == null
+    ? (actualBilledUsd == null ? "unknown" : "measured")
+    : String(input.actualStatus);
+  if (!ACTUAL_STATUS.has(actualStatus)) throw new Error(`actualStatus must be one of ${Array.from(ACTUAL_STATUS).join(", ")}`);
+  if (actualStatus === "measured" && actualBilledUsd == null) throw new Error("measured billing requires actualBilledUsd");
+  if (actualStatus !== "measured" && actualBilledUsd != null) throw new Error("non-measured billing must keep actualBilledUsd null");
+  if (actualStatus === "estimated" && estimatedUsd == null) throw new Error("estimated billing requires estimatedUsd");
+  const metadata = input.metadata == null ? {} : input.metadata;
+  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("metadata must be an object");
+  return {
+    uid: input.uid == null ? null : String(input.uid),
+    provider, sku, operation, requestId, quantity, unit, pricingVersion,
+    estimatedUsd, actualBilledUsd, actualStatus,
+    metadata,
+  };
+}
+
+function failureShape(event, error) {
+  return {
+    kind: "provider_cost_ledger_write_failed",
+    provider: event.provider,
+    sku: event.sku,
+    operation: event.operation,
+    requestId: event.requestId,
+    uid: event.uid,
+    quantity: event.quantity,
+    unit: event.unit,
+    error: {
+      message: error && error.message ? String(error.message) : String(error),
+      status: error && Number.isFinite(Number(error.status)) ? Number(error.status) : null,
+    },
+    failedAt: new Date().toISOString(),
+  };
+}
+
+async function emitProviderCostFailure(event, error, opts = {}) {
+  const failure = failureShape(event, error);
+  const log = opts.log || console.error;
+  try { log("[ledger] provider cost write failed", JSON.stringify(failure)); } catch { /* logging is best effort */ }
+  if (opts.outboxStore && typeof opts.outboxStore.insert === "function") {
+    try { await opts.outboxStore.insert(failure); } catch (outboxError) {
+      try { log("[ledger] provider cost failure outbox failed", outboxError && outboxError.message ? outboxError.message : outboxError); } catch { /* noop */ }
+    }
+  } else if (opts.failureOutboxUrl && opts.fetchImpl && typeof opts.fetchImpl === "function") {
+    try {
+      await opts.fetchImpl(opts.failureOutboxUrl, {
+        method: "POST",
+        headers: Object.assign({ "Content-Type": "application/json" }, opts.failureOutboxHeaders || {}),
+        body: JSON.stringify(failure),
+      });
+    } catch { /* owner alert below remains the visible signal */ }
+  }
+  if (typeof opts.ownerAlert === "function") {
+    try { await opts.ownerAlert(failure); } catch (alertError) {
+      try { log("[ledger] provider cost owner alert failed", alertError && alertError.message ? alertError.message : alertError); } catch { /* noop */ }
+    }
+  }
+  return failure;
+}
+
+// Complete provider cost event. Unlike the legacy recordCost wrapper below,
+// this function never fills an absent actual amount with zero.
+async function recordProviderCost(input = {}, opts = {}) {
+  let event;
+  try {
+    event = validateProviderCostEvent(input);
+  } catch (error) {
+    const invalidEvent = {
+      provider: input.provider == null ? "unknown" : String(input.provider),
+      sku: input.sku == null ? "unknown" : String(input.sku),
+      operation: input.operation == null ? "unknown" : String(input.operation),
+      requestId: input.requestId == null ? "unknown" : String(input.requestId),
+      uid: input.uid == null ? null : String(input.uid),
+      quantity: null,
+      unit: input.unit == null ? "unknown" : String(input.unit),
+    };
+    await emitProviderCostFailure(invalidEvent, error, opts);
+    return false;
+  }
+  const supaUrl = opts.supaUrl || process.env.SUPABASE_URL;
+  const supaKey = opts.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
+  const fetchImpl = opts.fetchImpl || globalThis.fetch;
+  if (!supaUrl || !supaKey || typeof fetchImpl !== "function") {
+    await emitProviderCostFailure(event, new Error("Supabase credentials or fetch implementation missing"), opts);
+    return false;
+  }
+  const body = {
+    uid: event.uid,
+    provider: event.provider,
+    sku: event.sku,
+    operation: event.operation,
+    request_id: event.requestId,
+    quantity: event.quantity,
+    unit: event.unit,
+    pricing_version: event.pricingVersion,
+    estimated_usd: event.estimatedUsd,
+    actual_billed_usd: event.actualBilledUsd,
+    actual_status: event.actualStatus,
+    metadata: event.metadata,
+  };
+  // Existing daily/financial readers still understand the legacy kind/meta pair. Emit it only for
+  // explicitly migrated compatibility events; the provider contract itself remains complete above.
+  if (input.legacyKind != null) body.kind = String(input.legacyKind);
+  if (input.legacyMeta != null) body.meta = input.legacyMeta;
+  try {
+    const response = await fetchImpl(`${supaUrl.replace(/\/$/u, "")}/rest/v1/lm_api_cost`, {
+      method: "POST",
+      headers: headers(supaKey, { "Content-Type": "application/json", Prefer: "return=minimal" }),
+      body: JSON.stringify(body),
+    });
+    if (!response || !response.ok) {
+      const error = new Error(`Supabase provider cost insert failed (${response && response.status})`);
+      error.status = response && response.status;
+      throw error;
+    }
+    return true;
+  } catch (error) {
+    await emitProviderCostFailure(event, error, opts);
+    return false;
+  }
+}
+
 // Best-effort cost persistence. Ledger failures must never break a call or scheduler tick.
 async function recordCost({ uid, kind, quantity, unit, estUsd, meta } = {}, opts = {}) {
   const supaUrl = opts.supaUrl || process.env.SUPABASE_URL;
   const supaKey = opts.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
   const fetchImpl = opts.fetchImpl || globalThis.fetch;
   const log = opts.log || console.error;
   try {
     if (!supaUrl || !supaKey || !kind || typeof fetchImpl !== "function") {
       throw new Error("Supabase credentials or ledger kind missing");
     }
@@ -55,23 +202,29 @@ async function recordDailyComposioPoll(uid, opts = {}) {
       `ts=lt.${encodeURIComponent(nextDay.toISOString())}`,
       "select=id",
       "limit=1",
     ].join("&");
     const response = await fetchImpl(`${supaUrl}/rest/v1/lm_api_cost?${query}`, {
       headers: headers(supaKey),
     });
     if (!response.ok) throw new Error(`Supabase daily lookup failed (${response.status})`);
     const rows = await response.json().catch(() => []);
     if (Array.isArray(rows) && rows.length > 0) return false;
-    return recordCost({
-      uid, kind: "composio_poll", quantity: 1, unit: "day", estUsd: 0,
-      meta: { day: dayStart.toISOString().slice(0, 10) },
+    // The migrated daily row carries legacy kind explicitly, so the existing indexed query remains
+    // the single duplicate guard while provider dimensions are added to the same insert.
+    return recordProviderCost({
+      uid, provider: "composio", sku: "calendar_poll", operation: "daily_poll",
+      requestId: `composio:daily_poll:${uid}:${dayStart.toISOString().slice(0, 10)}`,
+      quantity: 1, unit: "day", pricingVersion: "composio-2026-08",
+      estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown",
+      metadata: { day: dayStart.toISOString().slice(0, 10) },
+      legacyKind: "composio_poll", legacyMeta: { day: dayStart.toISOString().slice(0, 10) },
     }, { supaUrl, supaKey, fetchImpl, log });
   } catch (error) {
     log("[ledger] composio daily aggregation failed", error && error.message ? error.message : error);
     return false;
   }
 }
 
 async function monthlyComposioCallCount(opts = {}) {
   const supaUrl = opts.supaUrl || process.env.SUPABASE_URL;
   const supaKey = opts.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
@@ -84,21 +237,34 @@ async function monthlyComposioCallCount(opts = {}) {
     const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
     const query = ["select=id", "kind=eq.composio_call",
       `ts=gte.${encodeURIComponent(monthStart.toISOString())}`,
       `ts=lt.${encodeURIComponent(nextMonth.toISOString())}`, "limit=1"].join("&");
     const response = await fetchImpl(`${supaUrl}/rest/v1/lm_api_cost?${query}`, {
       headers: headers(supaKey, { Prefer: "count=exact" }),
     });
     if (!response.ok) throw new Error(`Supabase monthly count failed (${response.status})`);
     const range = response.headers && response.headers.get("content-range");
     const match = String(range || "").match(/\/(\d+)$/);
-    return match ? Number(match[1]) : 0;
+    const legacyCount = match ? Number(match[1]) : 0;
+    if (legacyCount > 0) return legacyCount;
+    // New provider rows use provider/operation dimensions. Keep the legacy query first so mixed
+    // deployments and existing budget dashboards continue to work without a migration race.
+    const providerQuery = ["select=id", "provider=eq.composio", "operation=eq.tool_execute",
+      `ts=gte.${encodeURIComponent(monthStart.toISOString())}`,
+      `ts=lt.${encodeURIComponent(nextMonth.toISOString())}`, "limit=1"].join("&");
+    const providerResponse = await fetchImpl(`${supaUrl}/rest/v1/lm_api_cost?${providerQuery}`, {
+      headers: headers(supaKey, { Prefer: "count=exact" }),
+    });
+    if (!providerResponse.ok) throw new Error(`Supabase provider monthly count failed (${providerResponse.status})`);
+    const providerRange = providerResponse.headers && providerResponse.headers.get("content-range");
+    const providerMatch = String(providerRange || "").match(/\/(\d+)$/);
+    return providerMatch ? Number(providerMatch[1]) : 0;
   } catch (error) {
     log("[ledger] monthly Composio count failed", error && error.message ? error.message : error);
     return null;
   }
 }
 
 function finite(value) {
   const n = Number(value);
   return Number.isFinite(n) ? n : 0;
 }
@@ -130,11 +296,18 @@ function businessSummary(daysBack, rows, nowMs) {
   }
   summary.call_minutes = rounded(summary.call_minutes);
   summary.est_cost_usd = rounded(summary.est_cost_usd);
   for (const item of Object.values(summary.per_uid)) {
     item.call_minutes = rounded(item.call_minutes);
     item.est_cost_usd = rounded(item.est_cost_usd);
   }
   return summary;
 }
 
-module.exports = { recordCost, recordDailyComposioPoll, monthlyComposioCallCount, businessSummary };
+module.exports = {
+  recordCost,
+  recordProviderCost,
+  validateProviderCostEvent,
+  recordDailyComposioPoll,
+  monthlyComposioCallCount,
+  businessSummary,
+};
diff --git a/apps/life-manager/lib/mail-resend.js b/apps/life-manager/lib/mail-resend.js
index 4479c850d..3c3040a50 100644
--- a/apps/life-manager/lib/mail-resend.js
+++ b/apps/life-manager/lib/mail-resend.js
@@ -1,61 +1,79 @@
 "use strict";
 // Own-domain email for the WEB ask/reply loop. We NEVER read the user's Gmail — we SEND from our own
 // verified domain via Resend, and route replies back via a short opaque token in the Reply-To local-part
 // (reply+<token>@reply.aniccaai.com → Cloudflare Email Routing → POST /inbound-email, which looks the token
 // up in lm_ask_log). Flat cost, no per-user fee, no Google restricted-scope CASA. The CALLER generates the
 // token (newReplyToken) and stores token→(uid,eventId) before sending. Telegram users don't use this at all.
 const FROM = process.env.LM_MAIL_FROM || "Life Manager <hello@aniccaai.com>";
 const REPLY_DOMAIN = process.env.LM_REPLY_DOMAIN || "reply.aniccaai.com";
 const RESEND_URL = "https://api.resend.com/emails";
+const { recordResendSend } = require("./provider-cost-adapters.js");
 
 // reply+<token>@reply.aniccaai.com — the catch-all inbound address. Local part = 6 + 22 = 28 chars (< 64).
 function replyToFor(token) {
   return `reply+${token}@${REPLY_DOMAIN}`;
 }
 
 // Low-level Resend send. Fail-closed (no key / no recipient → {sent:false}), never throws.
-async function resendSend({ to, subject, text, replyTo, resendKey, fetchImpl, idempotencyKey }) {
+async function resendSend({ to, subject, text, replyTo, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost, costRequestId }) {
   if (!resendKey) return { sent: false, error: "no RESEND_API_KEY" };
   if (!to || (Array.isArray(to) && to.length === 0) || !subject) return { sent: false, error: "missing to/subject" };
   const f = fetchImpl || fetch;
+  const recipientCount = Array.isArray(to) ? to.length : 1;
+  let responseId;
+  const costRecorder = typeof recordProviderCost === "function"
+    ? recordProviderCost
+    : (uid != null && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
+      ? (event) => recordResendSend(event, {
+        supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
+      })
+      : null);
   try {
     const r = await f(RESEND_URL, {
       method: "POST",
       headers: {
         Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json",
         ...(idempotencyKey ? { "Idempotency-Key": String(idempotencyKey) } : {}),
       },
       body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, text, reply_to: replyTo }),
     });
     const d = await r.json().catch(() => ({}));
-    return { sent: !!r.ok, id: d.id, status: r.status, error: r.ok ? undefined : (d.message || `http ${r.status}`) };
+    responseId = d.id;
+    const result = { sent: !!r.ok, id: d.id, status: r.status, error: r.ok ? undefined : (d.message || `http ${r.status}`) };
+    if (costRecorder) {
+      await recordResendSend({ uid, requestId: costRequestId || idempotencyKey, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
+    }
+    return result;
   } catch (e) {
+    if (costRecorder) {
+      await recordResendSend({ uid, requestId: costRequestId || idempotencyKey, recipientCount, responseId }, { recordProviderCost: costRecorder }).catch(() => false);
+    }
     return { sent: false, error: String(e) };
   }
 }
 
 // Ask the USER where an event is. Reply-To carries the signed token → their reply hits /inbound-email,
 // which parses the token, matches the event, and patches the calendar.
-async function sendAsk({ to, replyToken, event, resendKey, fetchImpl }) {
+async function sendAsk({ to, replyToken, event, resendKey, fetchImpl, uid, recordProviderCost }) {
   const name = (event && event.summary) || "your event";
   const subject = `Where is “${name}”?`;
   const text =
     `Hi — I'm setting up travel time for “${name}”, but I can't find where it is.\n\n` +
     `Just reply to this email with the address or place name, and I'll add it to your calendar and call you in time.\n\n— Life Manager`;
-  return resendSend({ to, subject, text, replyTo: replyToFor(replyToken), resendKey, fetchImpl });
+  return resendSend({ to, subject, text, replyTo: replyToFor(replyToken), resendKey, fetchImpl, uid, recordProviderCost });
 }
 
 // Tell the ATTENDEES the user is running late. Sent from our domain "on behalf of <userName>"; Reply-To is
 // the user's REAL email so attendee replies reach the human directly.
-async function sendLateNotice({ toAttendees, userName, event, etaMinutes, userEmail, resendKey, fetchImpl, bodySnapshot, idempotencyKey }) {
+async function sendLateNotice({ toAttendees, userName, event, etaMinutes, userEmail, resendKey, fetchImpl, bodySnapshot, idempotencyKey, uid, recordProviderCost }) {
   const name = (event && event.summary) || "the meeting";
   const who = userName || "Your contact";
   const subject = `Running late: ${name}`;
   const eta = Number.isFinite(etaMinutes) ? `about ${etaMinutes} minutes` : "a little";
   const text = bodySnapshot ||
     `Hi — ${who} is running ${eta} late to “${name}” and wanted you to know.\n\n` +
     `(Sent automatically by Life Manager on ${who}'s behalf — reply to reach ${who} directly.)`;
-  return resendSend({ to: toAttendees, subject, text, replyTo: userEmail, resendKey, fetchImpl, idempotencyKey });
+  return resendSend({ to: toAttendees, subject, text, replyTo: userEmail, resendKey, fetchImpl, idempotencyKey, uid, recordProviderCost });
 }
 
 module.exports = { sendAsk, sendLateNotice, resendSend, replyToFor, FROM, REPLY_DOMAIN };
diff --git a/apps/life-manager/lib/mail-resend.test.js b/apps/life-manager/lib/mail-resend.test.js
index 3bb9b2875..cfe721979 100644
--- a/apps/life-manager/lib/mail-resend.test.js
+++ b/apps/life-manager/lib/mail-resend.test.js
@@ -40,10 +40,25 @@ test("sendAsk posts From hello@, Reply-To reply+<token>@, asks where the event i
 
 test("sendLateNotice replies to the USER's real email (so attendees reach the human)", async () => {
   const cap = {};
   const r = await sendLateNotice({ toAttendees: ["a@x.com", "b@y.com"], userName: "Dais", event: { summary: "Sync" }, etaMinutes: 12, userEmail: "dais@me.com", resendKey: "k", fetchImpl: fakeFetch(cap) });
   assert.strictEqual(r.sent, true);
   assert.deepStrictEqual(cap.body.to, ["a@x.com", "b@y.com"]);
   assert.strictEqual(cap.body.reply_to, "dais@me.com");
   assert.match(cap.body.text, /Dais/);
   assert.match(cap.body.text, /12 minutes/);
 });
+
+test("a successful Resend request records recipient quantity with unknown provider billing", async () => {
+  const cap = {};
+  const events = [];
+  const r = await resendSend({
+    to: ["a@x.com", "b@y.com"], subject: "x", text: "y", resendKey: "k", fetchImpl: fakeFetch(cap), uid: "u1",
+    recordProviderCost: async (event) => { events.push(event); return true; },
+  });
+  assert.equal(r.sent, true);
+  assert.equal(events.length, 1);
+  assert.equal(events[0].provider, "resend");
+  assert.equal(events[0].quantity, 2);
+  assert.equal(events[0].actualStatus, "unknown");
+  assert.equal(events[0].actualBilledUsd, null);
+});
diff --git a/apps/life-manager/lib/notify.js b/apps/life-manager/lib/notify.js
index de4aee319..3e66cd58d 100644
--- a/apps/life-manager/lib/notify.js
+++ b/apps/life-manager/lib/notify.js
@@ -6,20 +6,21 @@ const { sendLateNotice: resendLateNotice } = require("./mail-resend.js");
 async function sendLateNotice(_uid, event, opts = {}) {
   const snapshot = Array.isArray(opts.recipientSnapshot) ? opts.recipientSnapshot : null;
   const toAttendees = snapshot
     ? snapshot.filter((recipient) => recipient && recipient.email).map((recipient) => recipient.email)
     : (Array.isArray(event && event.attendees) ? event.attendees : [])
       .filter((attendee) => attendee && attendee.email && !attendee.self && !attendee.organizer)
       .map((attendee) => attendee.email);
   if (!toAttendees.length) return { sent: false, reason: "no_destination" };
   const result = await resendLateNotice({
     toAttendees,
+    uid: _uid,
     userName: opts.userName,
     event,
     etaMinutes: opts.etaMinutes,
     userEmail: opts.userEmail,
     resendKey: opts.resendKey,
     fetchImpl: opts.fetchImpl,
     bodySnapshot: opts.bodySnapshot,
     idempotencyKey: opts.idempotencyKey || opts.providerIdempotencyKey,
   });
   return { ...result, to: toAttendees, event: event.summary, etaMinutes: opts.etaMinutes };
diff --git a/apps/life-manager/lib/provider-budget.js b/apps/life-manager/lib/provider-budget.js
new file mode 100644
index 000000000..9552dd46e
--- /dev/null
+++ b/apps/life-manager/lib/provider-budget.js
@@ -0,0 +1,159 @@
+"use strict";
+
+const DEFAULT_THRESHOLDS = Object.freeze({
+  warningUsd: 0.5,
+  degradedUsd: 1,
+  stoppedUsd: 2,
+  voiceUserCapUsd: 1,
+  voiceGlobalCapUsd: 5,
+});
+
+function finiteUsd(value) {
+  const number = Number(value);
+  return Number.isFinite(number) && number >= 0 ? number : 0;
+}
+
+function countUnknown(value) {
+  const number = Number(value);
+  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
+}
+
+function thresholdsFor(input = {}, explicit) {
+  return { ...DEFAULT_THRESHOLDS, ...(input.thresholds || {}), ...(explicit || {}) };
+}
+
+function evaluateProviderBudget(input = {}, explicitThresholds) {
+  const thresholds = thresholdsFor(input, explicitThresholds);
+  const measuredUsd = finiteUsd(input.measuredUsd);
+  const estimatedUsd = finiteUsd(input.estimatedUsd);
+  const totalUsd = Number((measuredUsd + estimatedUsd).toFixed(12));
+  let state = "normal";
+  if (totalUsd >= Number(thresholds.stoppedUsd)) state = "stopped";
+  else if (totalUsd >= Number(thresholds.degradedUsd)) state = "degraded";
+  else if (totalUsd >= Number(thresholds.warningUsd)) state = "warning";
+  const reasons = [`state:${state}`];
+  const unknownCount = countUnknown(input.unknownCount);
+  if (unknownCount > 0) reasons.push(`unknown_billing:${unknownCount}`);
+  if (state === "warning") reasons.push("daily_warning_threshold");
+  if (state === "degraded") reasons.push("paid_fallback_threshold");
+  if (state === "stopped") reasons.push("nonessential_work_stopped");
+  return { state, totalUsd, measuredUsd, estimatedUsd, unknownCount, reasons };
+}
+
+function aggregateCostRows(rows) {
+  let measuredUsd = 0;
+  let estimatedUsd = 0;
+  let unknownCount = 0;
+  for (const row of Array.isArray(rows) ? rows : []) {
+    const status = row && row.actual_status == null ? null : String(row.actual_status);
+    const actual = row && row.actual_billed_usd;
+    const estimate = row && row.estimated_usd == null ? row.est_usd : row.estimated_usd;
+    if (status === "measured" && Number.isFinite(Number(actual)) && Number(actual) >= 0) measuredUsd += Number(actual);
+    else if (Number.isFinite(Number(estimate)) && Number(estimate) >= 0) estimatedUsd += Number(estimate);
+    else if (status === "unknown" || (status == null && !Number.isFinite(Number(estimate)))) unknownCount++;
+  }
+  return { measuredUsd, estimatedUsd, unknownCount };
+}
+
+async function readDailySpend({ uid, nowMs = Date.now() } = {}, deps = {}) {
+  if (typeof deps.readDailySpend === "function") return deps.readDailySpend({ uid, nowMs });
+  const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
+  const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
+  const fetchImpl = deps.fetchImpl || globalThis.fetch;
+  if (!supaUrl || !supaKey || typeof fetchImpl !== "function") throw new Error("budget ledger unavailable");
+  const now = new Date(nowMs);
+  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
+  const nextDay = new Date(dayStart.getTime() + 86400000);
+  const filters = [
+    uid == null ? null : `uid=eq.${encodeURIComponent(uid)}`,
+    `ts=gte.${encodeURIComponent(dayStart.toISOString())}`,
+    `ts=lt.${encodeURIComponent(nextDay.toISOString())}`,
+    "select=actual_status,actual_billed_usd,estimated_usd,est_usd",
+  ].filter(Boolean).join("&");
+  const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/lm_api_cost?${filters}`, {
+    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
+  });
+  if (!response || !response.ok) throw new Error(`budget ledger read failed (${response && response.status})`);
+  return aggregateCostRows(await response.json().catch(() => []));
+}
+
+function isVoiceOperation(provider, operation) {
+  const p = String(provider || "").toLowerCase();
+  const o = String(operation || "").toLowerCase();
+  return p === "telnyx" || p === "gemini" || o.includes("voice") || o.includes("call") || o === "session";
+}
+
+function isPaidFallback(provider, operation) {
+  const p = String(provider || "").toLowerCase();
+  const o = String(operation || "").toLowerCase();
+  return o === "fallback" || o === "paid_fallback" || o.includes("google_fallback") || (p === "google" && o.includes("fallback"));
+}
+
+async function authorizeProviderOperation(input = {}, deps = {}) {
+  if (input.cacheHit) return { allowed: true, reason: "cache_hit", state: "cache_hit", totalUsd: null };
+  const thresholds = thresholdsFor(deps, input.thresholds);
+  let spend;
+  try {
+    spend = await readDailySpend({ uid: input.uid, nowMs: input.nowMs }, deps);
+  } catch (error) {
+    return { allowed: false, reason: "budget_unavailable", state: "unknown", error: String(error && error.message ? error.message : error) };
+  }
+  const budget = evaluateProviderBudget({ ...spend, thresholds });
+  const essential = input.essential === true;
+  if (!essential && budget.state === "stopped") return { allowed: false, reason: "budget_stopped", ...budget };
+  if (!essential && isPaidFallback(input.provider, input.operation) && (budget.state === "degraded" || budget.state === "stopped")) {
+    return { allowed: false, reason: "paid_fallback_disabled", ...budget };
+  }
+  if (isVoiceOperation(input.provider, input.operation)) {
+    const projectedUsd = finiteUsd(input.projectedUsd);
+    const reader = deps.readVoiceSpend || (async ({ scope }) => readDailySpend({ uid: scope === "user" ? input.uid : null, nowMs: input.nowMs }, deps));
+    try {
+      const userVoice = await reader({ scope: "user", uid: input.uid, nowMs: input.nowMs });
+      if (finiteUsd(userVoice.measuredUsd) + finiteUsd(userVoice.estimatedUsd) + projectedUsd >= Number(thresholds.voiceUserCapUsd)) {
+        return { allowed: false, reason: "voice_user_cap", ...budget };
+      }
+      const globalVoice = await reader({ scope: "global", uid: null, nowMs: input.nowMs });
+      if (finiteUsd(globalVoice.measuredUsd) + finiteUsd(globalVoice.estimatedUsd) + projectedUsd >= Number(thresholds.voiceGlobalCapUsd)) {
+        return { allowed: false, reason: "voice_global_cap", ...budget };
+      }
+    } catch (error) {
+      return { allowed: false, reason: "budget_unavailable", state: "unknown", error: String(error && error.message ? error.message : error) };
+    }
+  }
+  if (typeof deps.claimBudget === "function") {
+    let claimed = false;
+    try { claimed = await deps.claimBudget({ ...input, budget }); } catch { claimed = false; }
+    if (!claimed) return { allowed: false, reason: "budget_claim_failed", ...budget };
+  }
+  return { allowed: true, reason: budget.state === "warning" ? "budget_warning" : "allowed", ...budget };
+}
+
+async function claimProviderBudget(input = {}, deps = {}) {
+  const supaUrl = deps.supaUrl || process.env.SUPABASE_URL;
+  const supaKey = deps.supaKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
+  const fetchImpl = deps.fetchImpl || globalThis.fetch;
+  if (!supaUrl || !supaKey || !input.uid || !input.requestId || typeof fetchImpl !== "function") return false;
+  const day = new Date(input.nowMs == null ? Date.now() : input.nowMs).toISOString().slice(0, 10);
+  const response = await fetchImpl(`${String(supaUrl).replace(/\/$/u, "")}/rest/v1/lm_provider_budget_claims`, {
+    method: "POST",
+    headers: {
+      apikey: supaKey, Authorization: `Bearer ${supaKey}`, "Content-Type": "application/json",
+      Prefer: "resolution=ignore-duplicates,return=minimal",
+    },
+    body: JSON.stringify({
+      uid: String(input.uid), budget_day: day, provider: String(input.provider || "unknown"),
+      operation: String(input.operation || "unknown"), request_id: String(input.requestId),
+      projected_usd: finiteUsd(input.projectedUsd),
+    }),
+  });
+  return Boolean(response && (response.status === 201 || response.status === 200));
+}
+
+module.exports = {
+  DEFAULT_THRESHOLDS,
+  aggregateCostRows,
+  evaluateProviderBudget,
+  readDailySpend,
+  authorizeProviderOperation,
+  claimProviderBudget,
+};
diff --git a/apps/life-manager/lib/provider-budget.test.js b/apps/life-manager/lib/provider-budget.test.js
new file mode 100644
index 000000000..2ca4298a5
--- /dev/null
+++ b/apps/life-manager/lib/provider-budget.test.js
@@ -0,0 +1,82 @@
+"use strict";
+
+const test = require("node:test");
+const assert = require("node:assert/strict");
+const fs = require("node:fs");
+const path = require("node:path");
+const { evaluateProviderBudget, authorizeProviderOperation } = require("./provider-budget.js");
+
+test("migration provides a unique atomic daily claim identity", () => {
+  const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
+  assert.match(sql, /lm_provider_budget_claims/);
+  assert.match(sql, /primary key \(uid, budget_day, request_id\)/);
+});
+
+test("daily provider budget boundaries are normal, warning, degraded, then stopped", () => {
+  assert.equal(evaluateProviderBudget({ measuredUsd: 0.49, estimatedUsd: 0 }).state, "normal");
+  assert.equal(evaluateProviderBudget({ measuredUsd: 0.50, estimatedUsd: 0 }).state, "warning");
+  assert.equal(evaluateProviderBudget({ measuredUsd: 0.99, estimatedUsd: 0.01 }).state, "degraded");
+  assert.equal(evaluateProviderBudget({ measuredUsd: 2, estimatedUsd: 0 }).state, "stopped");
+});
+
+test("unknown billing is visible in reasons and never contributes numeric zero as measured spend", () => {
+  const budget = evaluateProviderBudget({ measuredUsd: null, estimatedUsd: null, unknownCount: 2 });
+  assert.equal(budget.totalUsd, 0);
+  assert.equal(budget.state, "normal");
+  assert.ok(budget.reasons.some((reason) => /unknown/i.test(reason)));
+});
+
+test("paid fallback is disabled at one dollar while essential work remains available", async () => {
+  const deps = { readDailySpend: async () => ({ measuredUsd: 1, estimatedUsd: 0, unknownCount: 0 }) };
+  const fallback = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "fallback", essential: false }, deps);
+  const essential = await authorizeProviderOperation({ uid: "u1", provider: "transit", operation: "plan", essential: true }, deps);
+  assert.equal(fallback.allowed, false);
+  assert.equal(fallback.reason, "paid_fallback_disabled");
+  assert.equal(essential.allowed, true);
+});
+
+test("nonessential provider work stops at two dollars", async () => {
+  const result = await authorizeProviderOperation({ uid: "u1", provider: "composio", operation: "refresh", essential: false }, {
+    readDailySpend: async () => ({ measuredUsd: 2, estimatedUsd: 0, unknownCount: 0 }),
+  });
+  assert.equal(result.allowed, false);
+  assert.equal(result.reason, "budget_stopped");
+});
+
+test("cached reads are always allowed even when spend lookup fails", async () => {
+  const result = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "routes", cacheHit: true }, {
+    readDailySpend: async () => { throw new Error("ledger unavailable"); },
+  });
+  assert.equal(result.allowed, true);
+  assert.equal(result.reason, "cache_hit");
+});
+
+test("voice caps are enforced independently for one user and globally", async () => {
+  const userBlocked = await authorizeProviderOperation({ uid: "u1", provider: "telnyx", operation: "call_session", essential: true, projectedUsd: 0.2 }, {
+    readDailySpend: async () => ({ measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }),
+    readVoiceSpend: async ({ scope }) => scope === "user"
+      ? { measuredUsd: 0.9, estimatedUsd: 0, unknownCount: 0 }
+      : { measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 },
+    thresholds: { voiceUserCapUsd: 1, voiceGlobalCapUsd: 5 },
+  });
+  assert.equal(userBlocked.allowed, false);
+  assert.equal(userBlocked.reason, "voice_user_cap");
+
+  const globalBlocked = await authorizeProviderOperation({ uid: "u1", provider: "gemini", operation: "session", essential: true, projectedUsd: 0.2 }, {
+    readDailySpend: async () => ({ measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }),
+    readVoiceSpend: async ({ scope }) => scope === "user"
+      ? { measuredUsd: 0, estimatedUsd: 0, unknownCount: 0 }
+      : { measuredUsd: 4.9, estimatedUsd: 0, unknownCount: 0 },
+    thresholds: { voiceUserCapUsd: 5, voiceGlobalCapUsd: 5 },
+  });
+  assert.equal(globalBlocked.allowed, false);
+  assert.equal(globalBlocked.reason, "voice_global_cap");
+});
+
+test("a failed budget read fails closed for non-cache work", async () => {
+  const result = await authorizeProviderOperation({ uid: "u1", provider: "google", operation: "routes", essential: false }, {
+    readDailySpend: async () => { throw new Error("ledger unavailable"); },
+  });
+  assert.equal(result.allowed, false);
+  assert.equal(result.reason, "budget_unavailable");
+});
diff --git a/apps/life-manager/lib/provider-cost-adapters.js b/apps/life-manager/lib/provider-cost-adapters.js
new file mode 100644
index 000000000..7aaf18f0f
--- /dev/null
+++ b/apps/life-manager/lib/provider-cost-adapters.js
@@ -0,0 +1,167 @@
+"use strict";
+
+const crypto = require("node:crypto");
+const { recordProviderCost } = require("./ledger.js");
+
+const GEMINI_WALL_TIME_USD_PER_MINUTE = 0.023;
+
+function requestId(provider, input = {}) {
+  if (input.requestId != null && String(input.requestId).trim()) return String(input.requestId);
+  if (input.id != null && String(input.id).trim()) return `${provider}:${String(input.id)}`;
+  return `${provider}:${Date.now()}:${crypto.randomUUID()}`;
+}
+
+function quantity(value, fallback = 1) {
+  const number = Number(value == null ? fallback : value);
+  return Number.isFinite(number) && number >= 0 ? number : fallback;
+}
+
+function money(value) {
+  if (value == null || value === "") return null;
+  const number = Number(value);
+  return Number.isFinite(number) && number >= 0 ? number : null;
+}
+
+function objectOrEmpty(value) {
+  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
+}
+
+async function write(event, deps = {}) {
+  const writer = deps.recordProviderCost || recordProviderCost;
+  return writer(event, deps);
+}
+
+function unknownEvent({ provider, sku, operation, uid, requestId: id, quantity: amount, unit, pricingVersion, metadata, estimatedUsd = null }) {
+  return {
+    uid: uid == null ? null : String(uid), provider, sku, operation,
+    requestId: requestId(provider, { requestId: id }), quantity: quantity(amount), unit, pricingVersion,
+    estimatedUsd: money(estimatedUsd), actualBilledUsd: null, actualStatus: "unknown",
+    metadata: objectOrEmpty(metadata),
+  };
+}
+
+async function recordGoogleGeocoding(input = {}, deps = {}) {
+  return write(unknownEvent({
+    provider: "google", sku: "geocoding", operation: "geocoding", uid: input.uid,
+    requestId: input.requestId, quantity: input.quantity, unit: "request",
+    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+  }), deps);
+}
+
+async function recordGoogleRoutes(input = {}, deps = {}) {
+  return write(unknownEvent({
+    provider: "google", sku: "routes", operation: "routes", uid: input.uid,
+    requestId: input.requestId, quantity: input.quantity, unit: "request",
+    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+  }), deps);
+}
+
+async function recordGoogleTransit(input = {}, deps = {}) {
+  return write(unknownEvent({
+    provider: "google", sku: "directions-transit", operation: "transit", uid: input.uid,
+    requestId: input.requestId, quantity: input.quantity, unit: "request",
+    pricingVersion: "google-maps-2026-08", metadata: input.metadata,
+  }), deps);
+}
+
+async function recordTransitOperation(input = {}, deps = {}) {
+  const operation = String(input.operation || "plan");
+  return write(unknownEvent({
+    provider: "transit", sku: "jp-public", operation, uid: input.uid,
+    requestId: input.requestId, quantity: input.quantity, unit: "request",
+    pricingVersion: "transit-api-2026-08", metadata: input.metadata,
+  }), deps);
+}
+
+async function recordComposioOperation(input = {}, deps = {}) {
+  const tool = String(input.tool || "tool");
+  return write(unknownEvent({
+    provider: "composio", sku: tool, operation: "tool_execute", uid: input.uid,
+    requestId: input.requestId, quantity: input.quantity, unit: "call",
+    pricingVersion: "composio-2026-08", metadata: { ...objectOrEmpty(input.metadata), tool },
+  }), deps);
+}
+
+async function recordGeminiSession(input = {}, deps = {}) {
+  const seconds = quantity(input.durationSeconds, 0);
+  const estimate = money(input.estimatedUsd) != null
+    ? money(input.estimatedUsd)
+    : seconds > 0 ? seconds / 60 * GEMINI_WALL_TIME_USD_PER_MINUTE : null;
+  const usage = input.usageMetadata == null ? null : objectOrEmpty(input.usageMetadata);
+  return write(unknownEvent({
+    provider: "gemini", sku: "live", operation: "session", uid: input.uid,
+    requestId: input.requestId, quantity: seconds, unit: "seconds",
+    pricingVersion: usage ? "gemini-live-token-metadata-2026-08" : "gemini-live-wall-time-2026-08",
+    estimatedUsd: estimate,
+    metadata: { ...objectOrEmpty(input.metadata), ...(usage ? { usage } : {}) },
+  }), deps);
+}
+
+function cdrCost(cdr = {}) {
+  const cost = cdr.cost;
+  const amount = cost && typeof cost === "object" ? cost.amount : cost;
+  const currency = cost && typeof cost === "object" && cost.currency ? String(cost.currency).toUpperCase() : "USD";
+  if (currency !== "USD") return null;
+  return money(amount != null ? amount : (cdr.price != null ? cdr.price : cdr.amount));
+}
+
+async function recordTelnyxCdr(input = {}, deps = {}) {
+  const cdr = objectOrEmpty(input.cdr);
+  const actual = cdrCost(cdr);
+  return write({
+    uid: input.uid == null ? null : String(input.uid), provider: "telnyx", sku: "voice",
+    operation: "call_cdr", requestId: requestId("telnyx", { requestId: input.requestId, id: cdr.id || cdr.call_control_id }),
+    quantity: quantity(input.durationSeconds, 0), unit: "seconds", pricingVersion: "telnyx-cdr-2026-08",
+    estimatedUsd: null, actualBilledUsd: actual, actualStatus: actual == null ? "unknown" : "measured",
+    metadata: { ...objectOrEmpty(input.metadata), ...(cdr.id ? { cdrId: String(cdr.id) } : {}),
+      ...(cdr.call_control_id ? { callControlId: String(cdr.call_control_id) } : {}) },
+  }, deps);
+}
+
+async function recordResendSend(input = {}, deps = {}) {
+  const recipients = quantity(input.recipientCount, 1);
+  return write(unknownEvent({
+    provider: "resend", sku: "email", operation: "send", uid: input.uid,
+    requestId: input.requestId || input.responseId, quantity: recipients, unit: "recipient",
+    pricingVersion: "resend-2026-08",
+    metadata: { ...objectOrEmpty(input.metadata), ...(input.responseId ? { responseId: String(input.responseId) } : {}) },
+  }), deps);
+}
+
+async function recordAllocation(input = {}, deps = {}) {
+  const provider = String(input.provider || "unknown");
+  const actual = money(input.amountUsd);
+  const period = input.period == null ? null : String(input.period);
+  return write({
+    uid: input.uid == null ? null : String(input.uid), provider,
+    sku: String(input.sku || "allocation"), operation: "allocation",
+    requestId: requestId(provider, { requestId: input.requestId, id: period }),
+    quantity: quantity(input.quantity), unit: String(input.unit || "period"),
+    pricingVersion: String(input.pricingVersion || `${provider}-allocation-2026-08`),
+    estimatedUsd: money(input.estimatedUsd), actualBilledUsd: actual,
+    actualStatus: actual == null ? "unknown" : "measured",
+    metadata: { ...objectOrEmpty(input.metadata), ...(period ? { period } : {}) },
+  }, deps);
+}
+
+async function recordRailwayAllocation(input = {}, deps = {}) {
+  return recordAllocation({ ...input, provider: "railway" }, deps);
+}
+
+async function recordSupabaseAllocation(input = {}, deps = {}) {
+  return recordAllocation({ ...input, provider: "supabase" }, deps);
+}
+
+module.exports = {
+  recordGoogleGeocoding,
+  recordGoogleRoutes,
+  recordGoogleTransit,
+  recordTransitOperation,
+  recordComposioOperation,
+  recordGeminiSession,
+  recordTelnyxCdr,
+  recordResendSend,
+  recordRailwayAllocation,
+  recordSupabaseAllocation,
+  recordAllocation,
+};
diff --git a/apps/life-manager/lib/provider-cost-adapters.test.js b/apps/life-manager/lib/provider-cost-adapters.test.js
new file mode 100644
index 000000000..96acff759
--- /dev/null
+++ b/apps/life-manager/lib/provider-cost-adapters.test.js
@@ -0,0 +1,172 @@
+"use strict";
+
+const test = require("node:test");
+const assert = require("node:assert/strict");
+
+const adapters = require("./provider-cost-adapters.js");
+const { routesDriveMinutes, legacyTransitMinutes, transitFetchPlan } = require("./travel.js");
+const { geocodeAddress, clearGeocodeProcessMemo } = require("./geocode-cache.js");
+
+function recorder() {
+  const events = [];
+  return {
+    events,
+    deps: {
+      recordProviderCost: async (event) => {
+        events.push(event);
+        return true;
+      },
+    },
+  };
+}
+
+test("Google geocoding and Routes operations record unknown actual billing without zero", async () => {
+  const r = recorder();
+  await adapters.recordGoogleGeocoding({ uid: "u1", requestId: "geo-1" }, r.deps);
+  await adapters.recordGoogleRoutes({ uid: "u1", requestId: "route-1" }, r.deps);
+  assert.equal(r.events.length, 2);
+  assert.deepEqual(r.events.map((event) => [event.provider, event.operation]), [
+    ["google", "geocoding"], ["google", "routes"],
+  ]);
+  for (const event of r.events) {
+    assert.equal(event.actualStatus, "unknown");
+    assert.equal(event.actualBilledUsd, null);
+    assert.notEqual(event.estimatedUsd, 0);
+  }
+});
+
+test("Transit operations preserve the provider operation and unknown billing state", async () => {
+  const r = recorder();
+  await adapters.recordTransitOperation({ uid: "u1", requestId: "transit-1", operation: "plan" }, r.deps);
+  await adapters.recordTransitOperation({ uid: "u1", requestId: "transit-2", operation: "guidance" }, r.deps);
+  assert.deepEqual(r.events.map((event) => event.operation), ["plan", "guidance"]);
+  assert.ok(r.events.every((event) => event.provider === "transit" && event.actualStatus === "unknown"));
+});
+
+test("Composio records one real tool operation and never reports unknown as an estimated zero", async () => {
+  const r = recorder();
+  await adapters.recordComposioOperation({ uid: "u1", requestId: "composio-1", tool: "GOOGLECALENDAR_EVENTS_LIST" }, r.deps);
+  assert.deepEqual(r.events[0], {
+    uid: "u1", provider: "composio", sku: "GOOGLECALENDAR_EVENTS_LIST", operation: "tool_execute",
+    requestId: "composio-1", quantity: 1, unit: "call", pricingVersion: "composio-2026-08",
+    estimatedUsd: null, actualBilledUsd: null, actualStatus: "unknown",
+    metadata: { tool: "GOOGLECALENDAR_EVENTS_LIST" },
+  });
+});
+
+test("Gemini session records token metadata when supplied and otherwise uses a wall-time estimate", async () => {
+  const withUsage = recorder();
+  await adapters.recordGeminiSession({
+    uid: "u1", requestId: "gemini-1", durationSeconds: 60,
+    usageMetadata: { promptTokenCount: 10, responseTokenCount: 20 },
+  }, withUsage.deps);
+  assert.deepEqual(withUsage.events[0].metadata.usage, { promptTokenCount: 10, responseTokenCount: 20 });
+  assert.equal(withUsage.events[0].actualStatus, "unknown");
+  assert.ok(withUsage.events[0].estimatedUsd > 0);
+
+  const withoutUsage = recorder();
+  await adapters.recordGeminiSession({ uid: "u1", requestId: "gemini-2", durationSeconds: 0 }, withoutUsage.deps);
+  assert.equal(withoutUsage.events[0].estimatedUsd, null);
+  assert.equal(withoutUsage.events[0].actualBilledUsd, null);
+  assert.equal(withoutUsage.events[0].actualStatus, "unknown");
+});
+
+test("Telnyx CDR records provider-measured actual cost", async () => {
+  const r = recorder();
+  await adapters.recordTelnyxCdr({
+    uid: "u1", requestId: "cdr-1", durationSeconds: 90,
+    cdr: { cost: { amount: "0.037", currency: "USD" }, call_control_id: "cc-1" },
+  }, r.deps);
+  assert.equal(r.events[0].provider, "telnyx");
+  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualBilledUsd, 0.037);
+  assert.equal(r.events[0].estimatedUsd, null);
+});
+
+test("Resend sends record recipient quantity and retain unknown billing", async () => {
+  const r = recorder();
+  await adapters.recordResendSend({ uid: "u1", requestId: "mail-1", recipientCount: 2, responseId: "re-1" }, r.deps);
+  assert.equal(r.events[0].provider, "resend");
+  assert.equal(r.events[0].quantity, 2);
+  assert.equal(r.events[0].unit, "recipient");
+  assert.equal(r.events[0].actualStatus, "unknown");
+  assert.equal(r.events[0].actualBilledUsd, null);
+});
+
+test("Railway and Supabase allocations are measured when imported and unknown when absent", async () => {
+  const r = recorder();
+  await adapters.recordRailwayAllocation({ uid: "u1", requestId: "rail-1", amountUsd: "1.25", period: "2026-08-08" }, r.deps);
+  await adapters.recordSupabaseAllocation({ uid: "u1", requestId: "supa-1", period: "2026-08-08" }, r.deps);
+  assert.equal(r.events[0].provider, "railway");
+  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualBilledUsd, 1.25);
+  assert.equal(r.events[1].provider, "supabase");
+  assert.equal(r.events[1].actualStatus, "unknown");
+  assert.equal(r.events[1].actualBilledUsd, null);
+  assert.equal(r.events[1].estimatedUsd, null);
+});
+
+test("a failed adapter write returns the recorder result and does not synthesize a zero", async () => {
+  const seen = [];
+  const ok = await adapters.recordGoogleRoutes({ uid: "u1", requestId: "route-fail" }, {
+    recordProviderCost: async (event) => { seen.push(event); return false; },
+  });
+  assert.equal(ok, false);
+  assert.equal(seen[0].actualBilledUsd, null);
+  assert.notEqual(seen[0].estimatedUsd, 0);
+});
+
+test("route providers record each attempted Google operation and transit plan/guidance", async () => {
+  const r = recorder();
+  const original = global.fetch;
+  const urls = [];
+  global.fetch = async (url) => {
+    urls.push(String(url));
+    if (String(url).includes("routes.googleapis.com")) {
+      return { ok: true, json: async () => ({ routes: [{ duration: "120s" }] }) };
+    }
+    if (String(url).includes("maps.googleapis.com")) {
+      return { ok: true, json: async () => ({ status: "OK", routes: [{ legs: [{ duration: { value: 180 } }] }] }) };
+    }
+    return { ok: true, json: async () => ({ durationSecs: 120 }) };
+  };
+  try {
+    await routesDriveMinutes("a", "b", "k", Date.now() + 60000, Date.now(), { uid: "u1", requestId: "google-route", recordProviderCost: r.deps.recordProviderCost });
+    await legacyTransitMinutes("a", "b", "k", Date.now() + 60000, Date.now(), null, { uid: "u1", requestId: "google-transit", recordProviderCost: r.deps.recordProviderCost });
+    await transitFetchPlan({ lat: 35.6, lon: 139.7 }, { lat: 35.7, lon: 139.8 }, {
+      eventAt: "2026-08-08T02:00:00.000Z", timezone: "UTC", uid: "u1",
+      fetchImpl: async (url) => ({ ok: true, json: async () => ({ durationSecs: 120, url }) }),
+      recordProviderCost: r.deps.recordProviderCost,
+    });
+  } finally { global.fetch = original; }
+  assert.ok(urls.some((url) => url.includes("routes.googleapis.com")));
+  assert.ok(urls.some((url) => url.includes("maps.googleapis.com")));
+  assert.deepEqual(r.events.map((event) => [event.provider, event.operation]), [
+    ["google", "routes"], ["google", "transit"], ["transit", "plan"], ["transit", "guidance"],
+  ]);
+});
+
+test("a successful Google geocode miss records one operation while a cache hit records none", async () => {
+  const r = recorder();
+  clearGeocodeProcessMemo();
+  const store = new Map();
+  const cache = {
+    get: async (key) => store.get(key) || null,
+    put: async (key, value) => { store.set(key, value); return true; },
+  };
+  let googleCalls = 0;
+  const fetchImpl = async () => {
+    googleCalls += 1;
+    return { ok: true, json: async () => ({ results: [{ geometry: { location: { lat: 35.6, lng: 139.7 } } }] }) };
+  };
+  await geocodeAddress("Unique Cost Guard Place", "maps", {
+    store: cache, fetchImpl, recordProviderCost: r.deps.recordProviderCost, uid: "u1", requestId: "geo-unique",
+  });
+  clearGeocodeProcessMemo();
+  await geocodeAddress("Unique Cost Guard Place", "maps", {
+    store: cache, fetchImpl, recordProviderCost: r.deps.recordProviderCost, uid: "u1", requestId: "geo-unique-hit",
+  });
+  assert.equal(googleCalls, 1);
+  assert.equal(r.events.length, 1);
+  assert.equal(r.events[0].operation, "geocoding");
+});
diff --git a/apps/life-manager/lib/provider-cost-imports.js b/apps/life-manager/lib/provider-cost-imports.js
new file mode 100644
index 000000000..3c21ba1fe
--- /dev/null
+++ b/apps/life-manager/lib/provider-cost-imports.js
@@ -0,0 +1,82 @@
+"use strict";
+
+const {
+  recordTelnyxCdr,
+  recordRailwayAllocation,
+  recordSupabaseAllocation,
+} = require("./provider-cost-adapters.js");
+
+function idFor(provider, row, index, prefix) {
+  const id = row && (row.id || row.requestId || row.request_id || row.period || row.period_key);
+  return `${prefix || provider}:${id == null ? index : String(id)}`;
+}
+
+function durationFor(row) {
+  return row && (row.durationSeconds ?? row.duration_seconds ?? row.billed_duration ?? row.duration ?? 0);
+}
+
+async function importRows(rows, importer, options = {}) {
+  if (!Array.isArray(rows)) return { attempted: 0, recorded: 0, failed: 1, error: "measurement rows must be an array" };
+  let recorded = 0;
+  let failed = 0;
+  for (let index = 0; index < rows.length; index++) {
+    try {
+      const ok = await importer(rows[index], index);
+      if (ok) recorded++;
+      else failed++;
+    } catch {
+      failed++;
+    }
+  }
+  return { attempted: rows.length, recorded, failed };
+}
+
+async function importTelnyxCdrs(rows, options = {}) {
+  return importRows(rows, (row, index) => recordTelnyxCdr({
+    uid: row && row.uid != null ? row.uid : options.uid,
+    requestId: row && (row.requestId || row.request_id) || idFor("telnyx", row, index, options.requestIdPrefix),
+    durationSeconds: durationFor(row), cdr: row, metadata: options.metadata,
+  }, options), options);
+}
+
+function allocationInput(provider, row, index, options) {
+  return {
+    uid: row && row.uid != null ? row.uid : options.uid,
+    requestId: row && (row.requestId || row.request_id) || idFor(provider, row, index, options.requestIdPrefix),
+    amountUsd: row && (row.amountUsd ?? row.amount_usd ?? row.costUsd ?? row.cost_usd ?? row.amount),
+    estimatedUsd: row && (row.estimatedUsd ?? row.estimated_usd),
+    quantity: row && row.quantity,
+    unit: row && row.unit,
+    period: row && (row.period || row.period_key || row.date),
+    sku: row && row.sku,
+    metadata: { ...(options.metadata || {}), ...(row && row.metadata && typeof row.metadata === "object" ? row.metadata : {}) },
+  };
+}
+
+async function importRailwayAllocations(rows, options = {}) {
+  return importRows(rows, (row, index) => recordRailwayAllocation(allocationInput("railway", row, index, options), options), options);
+}
+
+async function importSupabaseAllocations(rows, options = {}) {
+  return importRows(rows, (row, index) => recordSupabaseAllocation(allocationInput("supabase", row, index, options), options), options);
+}
+
+async function importScheduledMeasurements(provider, loadRows, options = {}) {
+  let rows;
+  try {
+    rows = await loadRows();
+  } catch (error) {
+    return { attempted: 0, recorded: 0, failed: 1, error: String(error && error.message ? error.message : error) };
+  }
+  if (provider === "telnyx") return importTelnyxCdrs(rows, options);
+  if (provider === "railway") return importRailwayAllocations(rows, options);
+  if (provider === "supabase") return importSupabaseAllocations(rows, options);
+  return { attempted: 0, recorded: 0, failed: 1, error: `unsupported measurement provider: ${String(provider)}` };
+}
+
+module.exports = {
+  importTelnyxCdrs,
+  importRailwayAllocations,
+  importSupabaseAllocations,
+  importScheduledMeasurements,
+};
diff --git a/apps/life-manager/lib/provider-cost-imports.test.js b/apps/life-manager/lib/provider-cost-imports.test.js
new file mode 100644
index 000000000..e87839696
--- /dev/null
+++ b/apps/life-manager/lib/provider-cost-imports.test.js
@@ -0,0 +1,53 @@
+"use strict";
+
+const test = require("node:test");
+const assert = require("node:assert/strict");
+const {
+  importTelnyxCdrs,
+  importRailwayAllocations,
+  importSupabaseAllocations,
+  importScheduledMeasurements,
+} = require("./provider-cost-imports.js");
+
+function recorder() {
+  const events = [];
+  return {
+    events,
+    deps: { recordProviderCost: async (event) => { events.push(event); return true; } },
+  };
+}
+
+test("Telnyx CDR import stores measured cost and keeps a missing CDR amount unknown", async () => {
+  const r = recorder();
+  const result = await importTelnyxCdrs([
+    { id: "cdr-1", call_control_id: "cc-1", billed_duration: 90, cost: { amount: "0.037", currency: "USD" } },
+    { id: "cdr-2", call_control_id: "cc-2", billed_duration: 30 },
+  ], { uid: "u1", ...r.deps });
+  assert.deepEqual(result, { attempted: 2, recorded: 2, failed: 0 });
+  assert.equal(r.events[0].actualStatus, "measured");
+  assert.equal(r.events[0].actualBilledUsd, 0.037);
+  assert.equal(r.events[1].actualStatus, "unknown");
+  assert.equal(r.events[1].actualBilledUsd, null);
+});
+
+test("Railway and Supabase allocation imports preserve owner measurements", async () => {
+  const r = recorder();
+  await importRailwayAllocations([{ period: "2026-08-08", amount_usd: "1.25" }], { uid: "u1", ...r.deps });
+  await importSupabaseAllocations([{ period_key: "2026-08-08", amount_usd: "0.40" }], { uid: "u1", ...r.deps });
+  assert.deepEqual(r.events.map((event) => [event.provider, event.actualBilledUsd]), [
+    ["railway", 1.25], ["supabase", 0.4],
+  ]);
+  assert.ok(r.events.every((event) => event.actualStatus === "measured"));
+});
+
+test("a failed scheduled measurement import returns failure and emits no synthetic zero row", async () => {
+  const r = recorder();
+  const result = await importScheduledMeasurements("railway", async () => { throw new Error("usage API down"); }, {
+    uid: "u1", ...r.deps,
+  });
+  assert.equal(result.attempted, 0);
+  assert.equal(result.recorded, 0);
+  assert.equal(result.failed, 1);
+  assert.equal(r.events.length, 0);
+  assert.match(result.error, /usage API down/);
+});
diff --git a/apps/life-manager/lib/route-cache.js b/apps/life-manager/lib/route-cache.js
index 1fd9b4859..cdc8daab4 100644
--- a/apps/life-manager/lib/route-cache.js
+++ b/apps/life-manager/lib/route-cache.js
@@ -1,37 +1,245 @@
-// lib/route-cache.js — C3 (VCSDD life-manager-cost-connect-reliability): route-result cache so the 60s
-// scheduler tick does NOT recompute a route it already has. This is a NEW store, distinct from
-// lm_travel_log (which stays a dedup/claim ledger). In production the `store` is Supabase `lm_route_cache`
-// (uid, from_geo, to_geo, time_bucket, provider, duration_secs, geometry, computed_at, ttl); here it is
-// injected so the logic is pure + unit-testable.
+// lib/route-cache.js — durable route-result cache. The Map used by the original
+// implementation is retained as a read-through optimization only; production
+// callers inject the Supabase store below.
 "use strict";
 
 const BUCKET_MS = 10 * 60_000; // coarse 10-min bucket: a moved event lands in a new bucket → recompute.
 
 // Round a departure epoch (ms) down to a coarse bucket index.
 function timeBucket(epochMs, bucketMs = BUCKET_MS) {
   return Math.floor(epochMs / bucketMs);
 }
 
 // Round a coordinate so trivially-different geos share a cache row (~11m at 4 dp is plenty for a route).
-const q = (n) => Math.round(n * 1e4) / 1e4;
+const q = (n) => {
+  const value = Number(n);
+  return Number.isFinite(value) ? Math.round(value * 1e4) / 1e4 : null;
+};
 
-function cacheKey(uid, fromGeo, toGeo, bucket) {
-  return [uid, q(fromGeo.lat), q(fromGeo.lon), q(toGeo.lat), q(toGeo.lon), bucket].join("|");
+function coordinateLongitude(geo) {
+  return geo && (geo.lon == null ? geo.lng : geo.lon);
+}
+
+function contextValue(context, keys, fallback = "") {
+  for (const key of keys) {
+    if (context && context[key] != null && context[key] !== "") return String(context[key]);
+  }
+  return fallback;
+}
+
+function normalizeContext(context = {}) {
+  const direction = context.direction || (context.departureMode ? "return" : "outbound");
+  return {
+    eventAnchor: contextValue(context, ["eventAnchor", "anchor", "event_at"]),
+    timezone: contextValue(context, ["timezone", "tz"]),
+    direction: String(direction || ""),
+    provider: contextValue(context, ["provider"]),
+    routeMode: contextValue(context, ["routeMode", "mode"]),
+  };
+}
+
+function resolveBucketAndContext(bucket, context) {
+  if (bucket && typeof bucket === "object" && !Array.isArray(bucket)) {
+    const next = normalizeContext(bucket);
+    const value = bucket.timeBucket == null
+      ? (bucket.eventAnchor ? timeBucket(Date.parse(bucket.eventAnchor)) : "")
+      : bucket.timeBucket;
+    return { bucket: value, context: next };
+  }
+  return { bucket, context: normalizeContext(context) };
+}
+
+function cacheKey(uid, fromGeo, toGeo, bucket, context = {}) {
+  const resolved = resolveBucketAndContext(bucket, context);
+  return JSON.stringify([
+    uid == null ? "" : String(uid),
+    q(fromGeo && fromGeo.lat), q(coordinateLongitude(fromGeo)),
+    q(toGeo && toGeo.lat), q(coordinateLongitude(toGeo)),
+    resolved.bucket == null ? "" : String(resolved.bucket),
+    resolved.context.eventAnchor,
+    resolved.context.timezone,
+    resolved.context.direction,
+    resolved.context.provider,
+    resolved.context.routeMode,
+  ]);
+}
+
+function isRecord(value) {
+  return Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value"));
+}
+
+function recordComputedAt(record) {
+  if (!record) return null;
+  const raw = record.computedAt == null ? record.computed_at : record.computedAt;
+  const n = typeof raw === "number" ? raw : Date.parse(raw);
+  return Number.isFinite(n) ? n : null;
+}
+
+function routeRecord(value, computedAt, context, ttlMs) {
+  return {
+    value,
+    computedAt,
+    ttlMs,
+    provider: context.provider || null,
+    eventAnchor: context.eventAnchor || null,
+    timezone: context.timezone || null,
+    direction: context.direction || null,
+    routeMode: context.routeMode || null,
+  };
+}
+
+function routeValueFromRow(row) {
+  if (!row || typeof row !== "object") return null;
+  const value = row.route_result == null ? row.value : row.route_result;
+  if (value == null) return null;
+  return {
+    value,
+    computedAt: row.computed_at || row.computedAt,
+    ttlMs: row.ttl_secs == null ? undefined : Number(row.ttl_secs) * 1000,
+    provider: row.provider || null,
+    eventAnchor: row.event_anchor || row.eventAnchor || null,
+    timezone: row.timezone || null,
+    direction: row.direction || null,
+    routeMode: row.route_mode || row.routeMode || null,
+  };
+}
+
+function authHeaders(key, extra) {
+  return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
+}
+
+// Store rows by an opaque canonical key. The migration adds cache_key so the
+// complete context key is durable instead of relying on the old shared geo
+// identity. All writes use Supabase upsert semantics (one winner per key).
+function createSupabaseRouteStore({ supaUrl, supaKey, fetchImpl = globalThis.fetch, table = "lm_route_cache" } = {}) {
+  const baseUrl = String(supaUrl || "").replace(/\/$/u, "");
+  const path = `${baseUrl}/rest/v1/${encodeURIComponent(table)}`;
+  async function get(key) {
+    if (!baseUrl || !supaKey || typeof fetchImpl !== "function" || !key) return null;
+    try {
+      const query = `${path}?cache_key=eq.${encodeURIComponent(key)}&select=*&limit=1`;
+      const response = await fetchImpl(query, { headers: authHeaders(supaKey) });
+      if (!response || !response.ok) return null;
+      const rows = await response.json();
+      return routeValueFromRow(Array.isArray(rows) ? rows[0] : null);
+    } catch {
+      return null;
+    }
+  }
+  async function set(key, record) {
+    if (!baseUrl || !supaKey || typeof fetchImpl !== "function" || !key || !record || record.value == null) return false;
+    const value = record.value;
+    const duration = value.durationSeconds == null
+      ? (value.durationSecs == null ? null : value.durationSecs)
+      : value.durationSeconds;
+    const computedAt = record.computedAt == null ? new Date().toISOString() : new Date(record.computedAt).toISOString();
+    const body = {
+      cache_key: key,
+      uid: record.uid == null ? null : String(record.uid),
+      from_geo: record.fromGeo || null,
+      to_geo: record.toGeo || null,
+      time_bucket: record.timeBucket == null ? null : Number(record.timeBucket),
+      provider: record.provider || "unknown",
+      duration_secs: duration == null ? null : Number(duration),
+      geometry: value.geometry == null ? null : value.geometry,
+      route_result: value,
+      computed_at: computedAt,
+      ttl_secs: Math.max(1, Math.round((record.ttlMs == null ? BUCKET_MS : record.ttlMs) / 1000)),
+      event_anchor: record.eventAnchor || null,
+      timezone: record.timezone || null,
+      direction: record.direction || null,
+      route_mode: record.routeMode || null,
+    };
+    try {
+      const response = await fetchImpl(path, {
+        method: "POST",
+        headers: authHeaders(supaKey, {
+          "Content-Type": "application/json",
+          Prefer: "resolution=merge-duplicates,return=minimal",
+        }),
+        body: JSON.stringify(body),
+      });
+      return Boolean(response && response.ok);
+    } catch {
+      return false;
+    }
+  }
+  return { get, set };
+}
+
+function readStore(store, key) {
+  return store && typeof store.get === "function" ? Promise.resolve(store.get(key)) : Promise.resolve(null);
+}
+
+function writeStore(store, key, value) {
+  if (!store || typeof store.set !== "function") return Promise.resolve(false);
+  return Promise.resolve(store.set(key, value));
 }
 
 // makeRouteCache({ store: Map-like {get,set}, ttlMs, now }) → { getOrCompute }.
-// INVARIANT: the provider is called at most once per (uid, from, to, bucket) within ttlMs.
-function makeRouteCache({ store, ttlMs = BUCKET_MS, now = Date.now }) {
-  async function getOrCompute(uid, fromGeo, toGeo, bucket, provider) {
-    const key = cacheKey(uid, fromGeo, toGeo, bucket);
-    const hit = store.get(key);
-    const t = now();
-    if (hit && t - hit.computedAt < ttlMs) return hit.value;
-    const value = await provider();
-    store.set(key, { value, computedAt: t });
-    return value;
+// INVARIANT: provider is called at most once per canonical key in this process;
+// a durable store makes the completed value survive process restarts.
+function makeRouteCache({ store = new Map(), ttlMs = BUCKET_MS, now = Date.now } = {}) {
+  const inFlight = new Map();
+  const readThrough = new Map();
+
+  async function getOrCompute(uid, fromGeo, toGeo, bucket, provider, context = {}) {
+    let compute = provider;
+    let metadata = context;
+    if (typeof bucket === "function") {
+      // Defensive support for a compact `(uid, from, to, provider, context)` call.
+      compute = bucket;
+      bucket = timeBucket(now());
+      metadata = provider || {};
+    }
+    if (typeof compute !== "function") throw new TypeError("route cache provider must be a function");
+    const resolved = resolveBucketAndContext(bucket, metadata);
+    const key = cacheKey(uid, fromGeo, toGeo, resolved.bucket, resolved.context);
+    const t = Number(now());
+    const isFresh = (record) => {
+      const computedAt = recordComputedAt(record);
+      if (computedAt == null || t - computedAt < 0) return false;
+      const effectiveTtl = Number(record && record.ttlMs);
+      return t - computedAt < (Number.isFinite(effectiveTtl) ? effectiveTtl : ttlMs);
+    };
+    const localHit = readThrough.get(key);
+    if (localHit && isFresh(localHit)) return localHit.value;
+    const durableHit = await readStore(store, key);
+    if (durableHit && isFresh(durableHit)) {
+      readThrough.set(key, durableHit);
+      return durableHit.value;
+    }
+    if (inFlight.has(key)) return inFlight.get(key);
+    const pending = (async () => {
+      // A concurrent caller can have populated the durable store between the
+      // initial read and this claim, so re-read before spending on the provider.
+      const secondHit = await readStore(store, key);
+      if (secondHit && isFresh(secondHit)) {
+        readThrough.set(key, secondHit);
+        return secondHit.value;
+      }
+      const value = await compute();
+      if (value == null) return value;
+      const record = routeRecord(value, Number(now()), resolved.context, ttlMs);
+      readThrough.set(key, record);
+      await writeStore(store, key, record);
+      return value;
+    })();
+    inFlight.set(key, pending);
+    try {
+      return await pending;
+    } finally {
+      inFlight.delete(key);
+    }
   }
   return { getOrCompute };
 }
 
-module.exports = { timeBucket, cacheKey, makeRouteCache, BUCKET_MS };
+module.exports = {
+  timeBucket,
+  cacheKey,
+  makeRouteCache,
+  createSupabaseRouteStore,
+  normalizeContext,
+  BUCKET_MS,
+};
diff --git a/apps/life-manager/lib/route-cache.test.js b/apps/life-manager/lib/route-cache.test.js
index 33a4bc627..a1a6a8cfb 100644
--- a/apps/life-manager/lib/route-cache.test.js
+++ b/apps/life-manager/lib/route-cache.test.js
@@ -1,19 +1,19 @@
 // lib/route-cache.test.js — C3 RED. lm_route_cache: <=1 provider call per (uid, from, to, time-bucket);
 // a moved event (changed start → new bucket) recomputes; stale-beyond-TTL recomputes. Pure logic with an
 // injected store (Map) + a call-counting provider. NO network.
 "use strict";
 
 const { test } = require("node:test");
 const assert = require("node:assert/strict");
 
-const { cacheKey, timeBucket, makeRouteCache } = require("./route-cache.js"); // missing → RED
+const { cacheKey, timeBucket, makeRouteCache, createSupabaseRouteStore } = require("./route-cache.js");
 
 const G = (lat, lon) => ({ lat, lon });
 
 test("timeBucket: rounds a departure epoch to a coarse bucket (e.g. 10-min)", () => {
   const b1 = timeBucket(1_781_000_000_000);
   const b2 = timeBucket(1_781_000_000_000 + 60_000); // +1 min, same bucket
   const b3 = timeBucket(1_781_000_000_000 + 15 * 60_000); // +15 min, new bucket
   assert.equal(b1, b2);
   assert.notEqual(b1, b3);
 });
@@ -56,10 +56,98 @@ test("getOrCompute: stale beyond TTL recomputes", async () => {
   assert.equal(calls, 2);
 });
 
 test("cacheKey: coords within ~11m (4dp) COLLIDE; coords across the rounding boundary do NOT — FIND-002", () => {
   const a = cacheKey("u1", G(35.68000, 139.76000), G(35.69, 139.70), 5);
   const near = cacheKey("u1", G(35.680001, 139.760001), G(35.69, 139.70), 5); // < 1e-4 diff → same row
   const far = cacheKey("u1", G(35.6802, 139.76000), G(35.69, 139.70), 5); // > 1e-4 diff → different row
   assert.equal(a, near);
   assert.notEqual(a, far);
 });
+
+test("cacheKey: event anchor, timezone, direction, provider, and route mode are scoped", () => {
+  const base = {
+    eventAnchor: "2026-08-09T09:00:00+09:00",
+    timezone: "Asia/Tokyo",
+    direction: "outbound",
+    provider: "transit",
+    routeMode: "rail",
+  };
+  const key = cacheKey("u1", G(35.68, 139.76), G(35.69, 139.70), 42, base);
+  for (const field of Object.keys(base)) {
+    const changed = { ...base, [field]: `${base[field]}-changed` };
+    assert.notEqual(key, cacheKey("u1", G(35.68, 139.76), G(35.69, 139.70), 42, changed), field);
+  }
+});
+
+test("cacheKey: lng aliases normalize with lon and origin/destination remain directional", () => {
+  const a = cacheKey("u1", { lat: 35.68, lon: 139.76 }, { lat: 35.69, lon: 139.70 }, 42);
+  const b = cacheKey("u1", { lat: 35.68, lng: 139.76 }, { lat: 35.69, lng: 139.70 }, 42);
+  const reversed = cacheKey("u1", { lat: 35.69, lon: 139.70 }, { lat: 35.68, lon: 139.76 }, 42);
+  assert.equal(a, b);
+  assert.notEqual(a, reversed);
+});
+
+test("getOrCompute: concurrent first writers spend once and a stale row recomputes", async () => {
+  const rows = new Map();
+  const cache = makeRouteCache({ store: rows, ttlMs: 600000, now: () => 1000 });
+  let calls = 0;
+  const provider = async () => {
+    calls += 1;
+    await new Promise((resolve) => setTimeout(resolve, 5));
+    return { durationSecs: 900, provider: "transit" };
+  };
+  const args = ["u1", G(35.68, 139.76), G(35.69, 139.70), 42, provider, {
+    eventAnchor: "2026-08-09T09:00:00+09:00", timezone: "Asia/Tokyo", provider: "transit", routeMode: "rail",
+  }];
+  const values = await Promise.all([cache.getOrCompute(...args), cache.getOrCompute(...args)]);
+  assert.equal(calls, 1);
+  assert.deepEqual(values[0], values[1]);
+  assert.equal(rows.size, 1);
+});
+
+test("Supabase route store persists structured route result across cache instances", async () => {
+  const rows = new Map();
+  const calls = [];
+  const fetchImpl = async (input, init = {}) => {
+    const url = new URL(String(input));
+    calls.push({ url, init });
+    if (init.method === "POST") {
+      const body = JSON.parse(init.body);
+      rows.set(body.cache_key, body);
+      return { ok: true, status: 201, json: async () => [] };
+    }
+    const keyExpr = url.searchParams.get("cache_key") || "";
+    const row = rows.get(keyExpr.replace(/^eq\./u, ""));
+    return { ok: true, status: 200, json: async () => (row ? [row] : []) };
+  };
+  const storeA = createSupabaseRouteStore({ supaUrl: "https://supa.invalid", supaKey: "service", fetchImpl });
+  const storeB = createSupabaseRouteStore({ supaUrl: "https://supa.invalid", supaKey: "service", fetchImpl });
+  const context = {
+    eventAnchor: "2026-08-09T09:00:00+09:00", timezone: "Asia/Tokyo", direction: "outbound",
+    provider: "transit", routeMode: "rail",
+  };
+  const cacheA = makeRouteCache({ store: storeA, ttlMs: 600000, now: () => 1000 });
+  const cacheB = makeRouteCache({ store: storeB, ttlMs: 600000, now: () => 1000 });
+  let callsA = 0;
+  const value = { durationSecs: 900, steps: [{ mode: "rail", platform: null }] };
+  const keyArgs = ["u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => { callsA += 1; return value; }, context];
+  assert.deepEqual(await cacheA.getOrCompute(...keyArgs), value);
+  let callsB = 0;
+  const cached = await cacheB.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => { callsB += 1; return { durationSecs: 1 }; }, context);
+  assert.deepEqual(cached, value);
+  assert.equal(callsA, 1);
+  assert.equal(callsB, 0);
+  assert.equal(rows.size, 1);
+  assert.equal(calls.filter((call) => call.init.method === "POST").length, 1);
+});
+
+test("cache hits remain available when the caller marks provider work degraded", async () => {
+  const store = new Map();
+  const cache = makeRouteCache({ store, ttlMs: 600000, now: () => 1000 });
+  const context = { provider: "transit", routeMode: "rail", allowCompute: true };
+  await cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => ({ durationSecs: 900 }), context);
+  let called = false;
+  const value = await cache.getOrCompute("u1", G(35.68, 139.76), G(35.69, 139.70), 42, async () => { called = true; return null; }, { ...context, allowCompute: false });
+  assert.equal(value.durationSecs, 900);
+  assert.equal(called, false);
+});
diff --git a/apps/life-manager/lib/transit.js b/apps/life-manager/lib/transit.js
index 98d702e15..4eff27c23 100644
--- a/apps/life-manager/lib/transit.js
+++ b/apps/life-manager/lib/transit.js
@@ -25,38 +25,143 @@ function isJapanGeo(lat, lon) {
   );
 }
 
 // Pick the router: transit only when BOTH endpoints are inside Japan; any non-JP/mixed → Google.
 function chooseRouter(fromGeo, toGeo) {
   const jp =
     fromGeo && toGeo && isJapanGeo(fromGeo.lat, fromGeo.lon) && isJapanGeo(toGeo.lat, toGeo.lon);
   return jp ? "transit" : "google";
 }
 
-// Parse an /api/v1/plan response into the shape the wake/travel logic needs.
-// Returns null when there are no journeys → caller falls back to Google.
-function parseTransitPlan(plan) {
+function validTimezone(timezone) {
+  const zone = String(timezone || "UTC");
+  try {
+    new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
+    return zone;
+  } catch {
+    return "UTC";
+  }
+}
+
+function dateKey(value) {
+  const raw = String(value || "");
+  if (/^\d{8}$/u.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
+  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return raw;
+  return null;
+}
+
+function zonedWallInstant(date, seconds, timezone) {
+  const key = dateKey(date);
+  const total = Number(seconds);
+  if (!key || !Number.isFinite(total)) return null;
+  const [year, month, day] = key.split("-").map(Number);
+  const wallMs = Date.UTC(year, month - 1, day) + total * 1000;
+  const zone = validTimezone(timezone);
+  let instant = wallMs;
+  for (let pass = 0; pass < 3; pass += 1) {
+    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
+      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
+      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
+    }).formatToParts(new Date(instant)).filter((part) => part.type !== "literal")
+      .map((part) => [part.type, part.value]));
+    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
+      Number(parts.hour), Number(parts.minute), Number(parts.second));
+    instant = wallMs - (represented - instant);
+  }
+  return new Date(instant).toISOString();
+}
+
+function modeForStep(mode, kind) {
+  if (kind === "walk" || mode === "walk") return "walk";
+  if (mode === "rail") return "train";
+  if (mode === "subway") return "subway";
+  if (mode === "bus") return "bus";
+  if (kind === "transfer") return "transfer";
+  return mode || "other";
+}
+
+function nullableNumber(value) {
+  const n = Number(value);
+  return Number.isFinite(n) ? n : null;
+}
+
+// Parse an /api/v1/plan response into a structured, provider-fact-preserving
+// route. Returns null when there are no journeys → caller falls back to Google.
+function parseTransitPlan(plan, anchor = {}) {
   const journeys = (plan && Array.isArray(plan.journeys) && plan.journeys) || [];
   if (journeys.length === 0) return null;
   // Best = earliest arrival (the fixture is departure-sorted; arrival is the honest "you're there by").
   const best = journeys.reduce((a, b) => (b.arrivalSecs < a.arrivalSecs ? b : a));
   // NEVER-LATE door-to-door (FIND-004 + FIND-101): the journey's durationSecs = arrivalSecs − departureSecs,
   // where arrivalSecs ALREADY includes the egress walk (journey arrival = last-leg arrival + egressWalk,
   // verified against the fixture: 81789 − 81660 = 129 = egressWalkSecs). departureSecs = first-leg (train)
   // departure, so the ACCESS walk to the first stop is NOT yet included. Door-to-door = accessWalk + duration.
   // Adding egress again would double-count it.
   const access = Number(best.accessWalkSecs) || 0;
+  const egress = nullableNumber(best.egressWalkSecs);
+  const timezone = validTimezone((plan && plan.timezone) || anchor.timezone || "UTC");
+  const date = (plan && plan.date) || anchor.date || null;
+  const fare = best.fare == null ? null : best.fare;
+  const legs = Array.isArray(best.legs) ? best.legs : [];
+  const steps = legs.map((leg) => {
+    const from = leg && leg.from && leg.from.name != null ? String(leg.from.name) : null;
+    const to = leg && leg.to && leg.to.name != null ? String(leg.to.name) : null;
+    const departureSecs = nullableNumber(leg && leg.departureSecs);
+    const arrivalSecs = nullableNumber(leg && leg.arrivalSecs);
+    const durationSeconds = nullableNumber(leg && leg.durationSecs)
+      ?? (departureSecs != null && arrivalSecs != null ? arrivalSecs - departureSecs : null);
+    const geometry = leg && leg.geometry != null ? leg.geometry : null;
+    return {
+      mode: modeForStep(leg && leg.mode, leg && leg.kind),
+      instruction: leg && leg.instruction != null ? String(leg.instruction) : null,
+      from,
+      to,
+      service: leg && (leg.service || leg.routeName) != null ? String(leg.service || leg.routeName) : null,
+      headsign: leg && leg.headsign != null ? String(leg.headsign) : null,
+      platform: leg && (leg.platform == null ? leg.platformCode : leg.platform) != null
+        ? String(leg.platform == null ? leg.platformCode : leg.platform) : null,
+      departAt: zonedWallInstant(date, departureSecs, timezone),
+      arriveAt: zonedWallInstant(date, arrivalSecs, timezone),
+      durationSeconds,
+      geometry,
+    };
+  });
+  const hasPlatform = steps.some((step) => step.platform != null);
+  const hasGeometry = steps.some((step) => step.geometry != null);
+  const provider = plan && plan.provider ? String(plan.provider) : "transit";
   return {
+    provider,
+    computedAt: plan && (plan.computedAt || plan.computed_at) || null,
+    timezone,
+    departureAt: zonedWallInstant(date, best.departureSecs, timezone),
+    arrivalAt: zonedWallInstant(date, best.arrivalSecs, timezone),
+    durationSeconds: (best.durationSecs || 0) + access,
+    accessWalkSeconds: access,
+    egressWalkSeconds: egress,
+    fare,
+    steps,
+    availability: { platform: hasPlatform, fare: fare != null, geometry: hasGeometry },
+    date: dateKey(date),
+    departureSecs: best.departureSecs,
+    arrivalSecs: best.arrivalSecs,
     durationSecs: (best.durationSecs || 0) + access,
     inVehicleSecs: best.durationSecs,
+    accessWalkSecs: access,
+    egressWalkSecs: egress,
     transferCount: best.transferCount || 0,
-    legs: (best.legs || []).map((l) => ({
+    legs: legs.map((l) => ({
       kind: l.kind,
       mode: l.mode,
       routeName: l.routeName,
+      service: l.service,
       from: l.from && l.from.name,
       to: l.to && l.to.name,
+      headsign: l.headsign,
+      platform: l.platform == null ? l.platformCode : l.platform,
+      departureSecs: l.departureSecs,
+      arrivalSecs: l.arrivalSecs,
+      geometry: l.geometry == null ? null : l.geometry,
     })),
   };
 }
 
-module.exports = { isJapanGeo, chooseRouter, parseTransitPlan, JP_BBOX };
+module.exports = { isJapanGeo, chooseRouter, parseTransitPlan, zonedWallInstant, dateKey, JP_BBOX };
diff --git a/apps/life-manager/lib/transit.test.js b/apps/life-manager/lib/transit.test.js
index 3cac78840..3b432df13 100644
--- a/apps/life-manager/lib/transit.test.js
+++ b/apps/life-manager/lib/transit.test.js
@@ -61,10 +61,71 @@ test("isJapanGeo: exact bbox boundaries 24/46/122/146 inclusive, just-outside ex
 });
 
 test("parseTransitPlan: picks EARLIEST ARRIVAL, not journeys[0] — FIND-006", () => {
   const plan = { journeys: [
     { departureSecs: 100, arrivalSecs: 900, durationSecs: 800, transferCount: 1, legs: [{ mode: "rail" }] }, // first, LATER arrival
     { departureSecs: 200, arrivalSecs: 700, durationSecs: 500, transferCount: 0, legs: [{ mode: "rail" }] }, // earliest arrival
   ] };
   const r = parseTransitPlan(plan);
   assert.equal(r.durationSecs, 500); // the 2nd journey, proving it's not journeys[0]
 });
+
+test("parseTransitPlan: preserves anchor, walking, fare, nullable provider facts, and ordered steps", () => {
+  const r = parseTransitPlan({
+    date: "20260809",
+    timezone: "Asia/Tokyo",
+    provider: "transit.ls8h",
+    computedAt: "2026-08-08T06:00:00.000Z",
+    journeys: [{
+      departureSecs: 8 * 3600,
+      arrivalSecs: 9 * 3600 + 5 * 60,
+      durationSecs: 3600,
+      accessWalkSecs: 420,
+      egressWalkSecs: 300,
+      transferCount: 1,
+      fare: { currency: "JPY", amount: 210, medium: "IC" },
+      legs: [
+        {
+          kind: "walk", mode: "walk", from: { name: "Home" }, to: { name: "Station" },
+          departureSecs: 8 * 3600, arrivalSecs: 8 * 3600 + 420,
+          geometry: { type: "LineString", coordinates: [] },
+        },
+        {
+          kind: "transit", mode: "rail", routeName: "Yamanote", headsign: "Shibuya",
+          from: { name: "Station" }, to: { name: "Shibuya" }, platform: null,
+          departureSecs: 8 * 3600 + 480, arrivalSecs: 8 * 3600 + 3600,
+        },
+      ],
+    }],
+  });
+  assert.equal(r.provider, "transit.ls8h");
+  assert.equal(r.timezone, "Asia/Tokyo");
+  assert.equal(r.computedAt, "2026-08-08T06:00:00.000Z");
+  assert.equal(r.durationSecs, 4020); // provider journey + access, egress is already in arrival
+  assert.equal(r.accessWalkSecs, 420);
+  assert.equal(r.egressWalkSecs, 300);
+  assert.equal(r.transferCount, 1);
+  assert.deepEqual(r.fare, { currency: "JPY", amount: 210, medium: "IC" });
+  assert.equal(r.steps.length, 2);
+  assert.equal(r.steps[0].mode, "walk");
+  assert.equal(r.steps[1].service, "Yamanote");
+  assert.equal(r.steps[1].headsign, "Shibuya");
+  assert.equal(r.steps[1].platform, null);
+  assert.equal(r.steps[1].from, "Station");
+  assert.equal(r.steps[1].to, "Shibuya");
+  assert.equal(Object.prototype.hasOwnProperty.call(r.steps[1], "entrance"), false);
+  assert.equal(Object.prototype.hasOwnProperty.call(r.steps[1], "bestCar"), false);
+  assert.equal(Object.prototype.hasOwnProperty.call(r.steps[1], "crowding"), false);
+  assert.deepEqual(r.availability, { platform: false, fare: true, geometry: true });
+});
+
+test("parseTransitPlan: missing nullable facts stay null instead of guessed text", () => {
+  const r = parseTransitPlan({
+    date: "20260809", timezone: "UTC",
+    journeys: [{ departureSecs: 10, arrivalSecs: 20, durationSecs: 10, legs: [{ mode: "rail" }] }],
+  });
+  assert.equal(r.fare, null);
+  assert.equal(r.steps[0].platform, null);
+  assert.equal(r.steps[0].geometry, null);
+  assert.equal(r.availability.fare, false);
+  assert.equal(r.availability.platform, false);
+});
diff --git a/apps/life-manager/lib/transport/calendar-composio.js b/apps/life-manager/lib/transport/calendar-composio.js
index 96c261933..a4617d7e2 100644
--- a/apps/life-manager/lib/transport/calendar-composio.js
+++ b/apps/life-manager/lib/transport/calendar-composio.js
@@ -1,63 +1,83 @@
 // lib/transport/calendar-composio.js — CLOUD calendar transport (#74 convergence). Wraps the Composio
 // managed-OAuth GOOGLECALENDAR_* tools behind the adapter interface every life-logic module will use,
 // so the same JS runs cloud (this) or local (calendar-gog.js, slice 5). Behaviour-identical to the
 // inline Composio calls it replaces — the live caller is unchanged.
 "use strict";
-const { recordCost } = require("../ledger.js");
+const { recordComposioOperation } = require("../provider-cost-adapters.js");
+const { authorizeProviderOperation: authorizeBudget } = require("../provider-budget.js");
 
 const COMPOSIO_EXEC = "https://backend.composio.dev/api/v3/tools/execute";
 
-async function exec(tool, uid, args, apiKey) {
-  const r = await fetch(`${COMPOSIO_EXEC}/${tool}`, {
+async function exec(tool, uid, args, apiKey, fetchImpl = globalThis.fetch) {
+  const r = await fetchImpl(`${COMPOSIO_EXEC}/${tool}`, {
     method: "POST",
     headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
     body: JSON.stringify({ user_id: uid, arguments: args }),
   });
   return r.json();
 }
 
-function makeComposioCalendar({ apiKey, recordCall } = {}) {
+function makeComposioCalendar({ apiKey, recordCall, recordProviderCost, fetchImpl, authorizeProviderOperation } = {}) {
   const key = apiKey || process.env.COMPOSIO_API_KEY;
-  const ledger = recordCall || ((uid, tool) => {
-    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
-    return recordCost({ uid, kind: "composio_call", quantity: 1, unit: "call", estUsd: 0, meta: { tool } });
+  const ledger = recordCall || ((uid, tool, requestId) => {
+    if (!recordProviderCost && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) return false;
+    return recordComposioOperation({ uid, tool, requestId }, { recordProviderCost });
   });
-  const execute = async (tool, uid, args) => {
-    const result = await exec(tool, uid, args, key);
-    await Promise.resolve(ledger(uid, tool)).catch(() => false);
+  const budgetGate = authorizeProviderOperation || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
+    ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
+    : undefined);
+  const execute = async (tool, uid, args, operationOptions = {}) => {
+    if (typeof budgetGate === "function") {
+      const decision = await budgetGate({
+        uid, provider: "composio", operation: operationOptions.operation || "refresh",
+        essential: operationOptions.essential === true, cacheHit: operationOptions.cacheHit === true,
+      });
+      if (decision && decision.allowed === false) throw new Error(`provider budget denied: ${decision.reason || "stopped"}`);
+    }
+    const requestId = `composio:${uid || "anonymous"}:${tool}:${Date.now()}`;
+    let result;
+    let failure;
+    try {
+      result = await exec(tool, uid, args, key, fetchImpl || globalThis.fetch);
+    } catch (error) {
+      failure = error;
+    } finally {
+      await Promise.resolve(ledger(uid, tool, requestId)).catch(() => false);
+    }
+    if (failure) throw failure;
     return result;
   };
   // ONE page of Google Calendar items PLUS the cursor that unlocks the next. events.list returns at
   // most `maxResults` items per page (250 by default, 2500 max) and sets data.nextPageToken whenever
   // more remain — measured against this exact endpoint on 2026-07-26: a 548-day window came back as
   // 250 + 250 + 203 with a live token on the first two pages, and the identical 703 events arrive in
   // one call at maxResults=2500 with NO token. listEventsRaw used to drop that token on the floor,
   // which left "the calendar holds 703 events" and "it holds 7000 and you were handed page one"
   // indistinguishable to every caller. A caller that persists an append-only record
   // (fetchCalendarHistory → lm_care_scan_log) cannot live with that ambiguity, so the cursor is now
   // part of the transport contract.
   // Error contract unchanged and shared with listEventsRaw: default (wake path) swallows every
   // failure to an empty page — load-bearing, a transport blip must not crash the 60s tick — while
   // strict (history path) THROWS, because "empty calendar" and "the read failed" must never merge.
-  const listEventsPage = async (uid, { timeMin, timeMax, maxResults, pageToken, strict } = {}) => {
+  const listEventsPage = async (uid, { timeMin, timeMax, maxResults, pageToken, strict, cacheHit } = {}) => {
     const empty = { items: [], nextPageToken: null };
     if (!key || !uid) {
       if (strict) throw new Error(`calendar transport not ready (missing ${key ? "uid" : "API key"})`);
       return empty;
     }
     const args = { calendarId: "primary", singleEvents: true, orderBy: "startTime", timeMin, timeMax };
     if (maxResults) args.maxResults = maxResults;
     if (pageToken) args.pageToken = pageToken;
     let j;
     try {
-      j = await execute("GOOGLECALENDAR_EVENTS_LIST", uid, args);
+      j = await execute("GOOGLECALENDAR_EVENTS_LIST", uid, args, { essential: false, cacheHit });
     } catch (e) {
       if (strict) throw e;
       return empty;
     }
     if (!j || !j.successful) {
       if (strict) throw new Error(`calendar list failed: ${String((j && (j.error || j.message)) || "unsuccessful response")}`);
       return empty;
     }
     const d = j.data || {};
     return {
diff --git a/apps/life-manager/lib/travel-routes.test.js b/apps/life-manager/lib/travel-routes.test.js
index fcf080dbf..a6a995190 100644
--- a/apps/life-manager/lib/travel-routes.test.js
+++ b/apps/life-manager/lib/travel-routes.test.js
@@ -1,16 +1,16 @@
 // travel-routes.test.js — #71 Routes API migration: pure helpers for the traffic-aware DRIVE leg.
 // Run: node --test apps/life-call/lib/travel-routes.test.js
 "use strict";
 const { test } = require("node:test");
 const assert = require("node:assert");
-const { parseDurationSeconds, minutesFromSeconds, buildDriveBody, clampDepartIso, directionsMinutes, acceptRouteResults } = require("./travel.js");
+const { parseDurationSeconds, minutesFromSeconds, buildDriveBody, clampDepartIso, directionsMinutes, acceptRouteResults, transitFetchPlan } = require("./travel.js");
 
 // ── fetch-injection helpers for the never-late ordering tests ────────────────────────────────────
 // Route by URL: legacy Directions (transit) vs Routes API (drive). Each test supplies the two bodies.
 function stubFetch({ transit, drive, capture } = {}) {
   const orig = global.fetch;
   global.fetch = async (url, opts) => {
     const u = String(url);
     if (capture) capture(u, opts);
     if (u.includes("maps.googleapis.com/maps/api/directions")) {
       return { ok: true, json: async () => transit };
@@ -132,10 +132,36 @@ test("neither mode resolves → null (caller asks)", async () => {
   try {
     const now = Date.parse("2026-06-21T00:00:00Z");
     assert.equal(await directionsMinutes("A", "B", "k", now + 3600000, now), null);
   } finally { restore(); }
 });
 
 test("missing key/src/dst → null without any fetch", async () => {
   assert.equal(await directionsMinutes("", "B", "k"), null);
   assert.equal(await directionsMinutes("A", "B", ""), null);
 });
+
+test("transitFetchPlan anchors /plan and /guidance to the same event date/time and type", async () => {
+  const urls = [];
+  const response = (body) => ({ ok: true, json: async () => body });
+  const fetchImpl = async (url) => {
+    urls.push(String(url));
+    return response(url.includes("guidance") ? { options: [] } : { journeys: [] });
+  };
+  const eventAt = Date.parse("2026-08-09T09:00:00+09:00");
+  await transitFetchPlan({ lat: 35.68, lon: 139.76 }, { lat: 35.69, lon: 139.70 }, {
+    eventAt, timezone: "Asia/Tokyo", direction: "outbound", fetchImpl,
+  });
+  assert.equal(urls.length, 2);
+  for (const url of urls) {
+    assert.match(url, /date=20260809/u);
+    assert.match(url, /time=09%3A00%3A00/u);
+    assert.match(url, /type=arrival/u);
+  }
+  urls.length = 0;
+  await transitFetchPlan({ lat: 35.68, lon: 139.76 }, { lat: 35.69, lon: 139.70 }, {
+    eventAt, timezone: "Asia/Tokyo", direction: "return", fetchImpl,
+  });
+  assert.equal(urls.length, 2);
+  assert.match(urls[0], /type=departure/u);
+  assert.match(urls[1], /type=departure/u);
+});
diff --git a/apps/life-manager/lib/travel-transit-wire.test.js b/apps/life-manager/lib/travel-transit-wire.test.js
index 9d5413423..89561ef46 100644
--- a/apps/life-manager/lib/travel-transit-wire.test.js
+++ b/apps/life-manager/lib/travel-transit-wire.test.js
@@ -63,10 +63,59 @@ test("directionsMinutes: repeated ticks (same event) call the provider ONCE —
     _geocode: fakeGeocode,
     _transitFetch: async () => { transitCalls++; return fakeTransitFetch(); },
     _directionsMinutesGoogle: async () => 45,
     _routeCache: cache,
   };
   const at = Date.now() + 3600000; // ev.startMs is CONSTANT across the 60s ticks
   await travel.directionsMinutes("新宿区A", "渋谷区B", "k", at, Date.now(), false, opts);
   await travel.directionsMinutes("新宿区A", "渋谷区B", "k", at, Date.now() + 60000, false, opts); // next tick, same event
   assert.equal(transitCalls, 1); // second tick is a cache hit
 });
+
+test("directionsRoute: Transit receives the event anchor and accepted result never calls Google", async () => {
+  let anchor;
+  let googleCalls = 0;
+  const eventAt = Date.parse("2026-08-09T09:00:00+09:00");
+  const route = await travel.directionsRoute("新宿区A", "渋谷区B", "mapsKey", eventAt, eventAt - 60000, false, {
+    _geocode: fakeGeocode,
+    _transitFetch: async (_from, _to, options) => {
+      anchor = options;
+      return {
+        date: "20260809", timezone: "Asia/Tokyo", journeys: [{
+          departureSecs: 100, arrivalSecs: 1000, durationSecs: 900,
+          accessWalkSecs: 120, egressWalkSecs: 60, transferCount: 1,
+          fare: { currency: "JPY", amount: 210 },
+          legs: [{ mode: "rail", routeName: "Ginza", headsign: "渋谷", departureSecs: 100, arrivalSecs: 900 }],
+        }],
+      };
+    },
+    _directionsMinutesGoogle: async () => { googleCalls += 1; return 45; },
+    _routeCache: freshCache(),
+    _timezone: "Asia/Tokyo",
+  });
+  assert.equal(route.provider, "transit");
+  assert.equal(route.route.transferCount, 1);
+  assert.equal(route.route.accessWalkSecs, 120);
+  assert.equal(route.minutes, 17);
+  assert.equal(anchor.eventAt, new Date(eventAt).toISOString());
+  assert.equal(anchor.timezone, "Asia/Tokyo");
+  assert.equal(anchor.direction, "outbound");
+  assert.equal(googleCalls, 0);
+});
+
+test("directionsRoute: return query uses depart-at semantics with the same event anchor", async () => {
+  let anchor;
+  const eventEnd = Date.parse("2026-08-09T18:00:00+09:00");
+  const route = await travel.directionsRoute("渋谷区B", "新宿区A", "mapsKey", eventEnd, eventEnd - 60000, true, {
+    _geocode: fakeGeocode,
+    _transitFetch: async (_from, _to, options) => {
+      anchor = options;
+      return { date: "20260809", timezone: "Asia/Tokyo", journeys: [{ departureSecs: 100, arrivalSecs: 700, durationSecs: 600, legs: [] }] };
+    },
+    _routeCache: freshCache(),
+    _timezone: "Asia/Tokyo",
+  });
+  assert.equal(route.provider, "transit");
+  assert.equal(route.minutes, 10);
+  assert.equal(anchor.eventAt, new Date(eventEnd).toISOString());
+  assert.equal(anchor.direction, "return");
+});
diff --git a/apps/life-manager/lib/travel.js b/apps/life-manager/lib/travel.js
index 3a1e718f4..9df4f3dac 100644
--- a/apps/life-manager/lib/travel.js
+++ b/apps/life-manager/lib/travel.js
@@ -1,21 +1,25 @@
 // lib/travel.js — cloud travel-time auto-fill. For a user, look at today→+7d of located events and
 // insert a "[Travel]" block before each one so the wake call fires before they must LEAVE. Ports
 // travel/travel_fill.py to the Railway service: Google Directions for the leave time, Composio for the
 // gcal read + write. Origin priority: previous event's location (back-to-back) → the user's home.
 // Idempotent: never inserts a second [Travel] for an event that already has one.
 "use strict";
 
 const { getCalendar } = require("./transport/index.js");
 const { chooseRouter, parseTransitPlan } = require("./transit.js");
-const { makeRouteCache, timeBucket } = require("./route-cache.js");
+const { makeRouteCache, createSupabaseRouteStore, timeBucket } = require("./route-cache.js");
+const { geocodeAddress, createSupabaseGeocodeStore } = require("./geocode-cache.js");
 const { interpretCalendarEvent } = require("./calendar-interpreter.js");
+const { recordGoogleRoutes, recordGoogleTransit, recordTransitOperation } = require("./provider-cost-adapters.js");
+const { recordProviderCost: writeProviderCost } = require("./ledger.js");
+const { authorizeProviderOperation: authorizeBudget } = require("./provider-budget.js");
 
 // C3 (FIND-002): a process-lifetime route-result cache so the 60s scheduler tick does NOT recompute a
 // route it already has (~30 paid provider calls/event → 1). Keyed on (from_geo, to_geo, time_bucket).
 const _routeCache = makeRouteCache({ store: new Map(), ttlMs: 10 * 60_000 });
 
 function isoNaiveUTC(ms) {
   // Timezone-agnostic: pass the UTC wall clock paired with timezone:"UTC" (set in createTravelBlock).
   // Google stores the correct ABSOLUTE instant and shows it in each user's own timezone — so this
   // works for a user in Tokyo, New York, or anywhere, with no hardcoded offset.
   return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "").replace("Z", "");
@@ -101,127 +105,242 @@ function buildDriveBody(src, dst, departIso) {
     origin: { address: src }, destination: { address: dst },
     travelMode: "DRIVE", routingPreference: "TRAFFIC_AWARE_OPTIMAL", departureTime: departIso,
   };
 }
 function clampDepartIso(departAtMs, nowMs) {
   // Routes API rejects a departureTime in the past → floor to now+60s.
   const ms = Math.max(Number(departAtMs) || 0, (Number(nowMs) || 0) + 60000);
   return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
 }
 
-async function routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs) {
+async function routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts = {}) {
   const body = JSON.stringify(buildDriveBody(src, dst, clampDepartIso(departAtMs, nowMs)));
+  const record = typeof opts.recordProviderCost === "function"
+    ? () => recordGoogleRoutes({ uid: opts.uid, requestId: opts.requestId, metadata: { cache: "miss" } }, {
+      recordProviderCost: opts.recordProviderCost,
+    }).catch(() => false)
+    : null;
+  if (record) await record();
   try {
     const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "X-Goog-Api-Key": mapsKey,
         "X-Goog-FieldMask": "routes.duration",
       },
       body,
     });
     if (!r.ok) return null;
     const j = await r.json();
     const sec = parseDurationSeconds((((j.routes || [])[0]) || {}).duration);
     return sec == null ? null : minutesFromSeconds(sec);
   } catch { return null; }
 }
 
 // arriveByMs: used for outbound (arrive-by event start). departAtMs: used for return legs (depart at
 // event end). Only one should be non-null; if neither is a future time, falls back to departure_time="now".
-async function legacyTransitMinutes(src, dst, mapsKey, arriveByMs, nowMs = Date.now(), departAtMs = null) {
+async function legacyTransitMinutes(src, dst, mapsKey, arriveByMs, nowMs = Date.now(), departAtMs = null, opts = {}) {
   const p = new URLSearchParams({ origin: src, destination: dst, mode: "transit", key: mapsKey });
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
+  const record = typeof opts.recordProviderCost === "function"
+    ? () => recordGoogleTransit({ uid: opts.uid, requestId: opts.requestId }, {
+      recordProviderCost: opts.recordProviderCost,
+    }).catch(() => false)
+    : null;
+  if (record) await record();
   try {
     const r = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${p}`);
     const j = await r.json();
     if (j.status !== "OK" || !j.routes || !j.routes[0] || !j.routes[0].legs || !j.routes[0].legs[0]) return null;
     return minutesFromSeconds(j.routes[0].legs[0].duration.value);
   } catch { return null; }
 }
 
 // Query BOTH transit (anchored to event start) and traffic-aware drive, then take the LARGER —
 // never-late bias: we don't yet know the user's mode, so assume the slower so we never under-estimate.
 // departAtMs ≈ event start. Returns null only if neither mode resolves (caller then asks). floor 5 min.
 // TODO(#69/#70): per-user travel_mode preference → trust the chosen mode instead of max().
 //
 // departureMode: when true, the time arg is a DEPARTURE anchor (for return legs — FIND-004).
 // Outbound (default false): transit uses arrival_time = event start (arrive-by).
 // Return (true): transit uses departure_time = ev.endMs (depart-at, not arrive-by).
 // The Google path (Routes Pro drive + legacy transit, never-late MAX bias). This is the FALLBACK now.
-async function directionsMinutesGoogle(src, dst, mapsKey, departAtMs = Date.now(), nowMs = Date.now(), departureMode = false) {
+async function directionsMinutesGoogle(src, dst, mapsKey, departAtMs = Date.now(), nowMs = Date.now(), departureMode = false, opts = {}) {
   if (!mapsKey || !src || !dst) return null;
   const [transit, drive] = await Promise.all([
     departureMode
-      ? legacyTransitMinutes(src, dst, mapsKey, null, nowMs, departAtMs)
-      : legacyTransitMinutes(src, dst, mapsKey, departAtMs, nowMs),
-    routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs),
+      ? legacyTransitMinutes(src, dst, mapsKey, null, nowMs, departAtMs, opts)
+      : legacyTransitMinutes(src, dst, mapsKey, departAtMs, nowMs, null, opts),
+    routesDriveMinutes(src, dst, mapsKey, departAtMs, nowMs, opts),
   ]);
   return acceptRouteResults({ legacyTransit: transit, routesDrive: drive }).minutes;
 }
 
-// C3: address→geo memo — the 60s scheduler tick must NOT re-geocode the same home/event address every
-// time. Keyed on the address string; a geo rarely changes for a fixed address. Process-lifetime cache.
-const _geoMemo = new Map();
-
-// C2: geocode a JP address ONCE via Google Geocoding (cheap, one-time; NOT the Routes-Pro cost driver).
-// Returns {lat,lon} or null. Injected in tests via opts._geocode.
-async function geocodeAddress(addr, mapsKey) {
-  if (!addr || !mapsKey) return null;
-  if (_geoMemo.has(addr)) return _geoMemo.get(addr);
-  try {
-    const u = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${mapsKey}`;
-    const j = await (await fetch(u)).json();
-    const loc = j && j.results && j.results[0] && j.results[0].geometry && j.results[0].geometry.location;
-    return loc ? { lat: loc.lat, lon: loc.lng } : null;
-  } catch { return null; }
+function transitQueryTime(eventAt, timezone) {
+  const instant = new Date(eventAt);
+  if (!Number.isFinite(instant.getTime())) return null;
+  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
+    timeZone: timezone || "UTC", year: "numeric", month: "2-digit", day: "2-digit",
+    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
+  }).formatToParts(instant).filter((part) => part.type !== "literal")
+    .map((part) => [part.type, part.value]));
+  return {
+    date: `${parts.year}${parts.month}${parts.day}`,
+    time: `${parts.hour}:${parts.minute}:${parts.second}`,
+  };
 }
 
-// C2: real FREE JP transit fetch (api.transit.ls8h.com /plan). Injected in tests via opts._transitFetch.
-async function transitFetchPlan(srcGeo, dstGeo) {
+// C2: real FREE JP transit fetch (api.transit.ls8h.com /plan + guidance).
+// Both requests carry the same event date/time and type. Injected in tests via
+// opts._transitFetch so no network is needed for unit tests.
+async function transitFetchPlan(srcGeo, dstGeo, {
+  eventAt,
+  timezone = "UTC",
+  direction = "outbound",
+  fetchImpl = globalThis.fetch,
+  uid = null,
+  recordProviderCost,
+} = {}) {
   try {
-    const u = `https://api.transit.ls8h.com/api/v1/plan?from=geo:${srcGeo.lat},${srcGeo.lon}&to=geo:${dstGeo.lat},${dstGeo.lon}`;
-    return await (await fetch(u)).json();
+    const query = new URLSearchParams({
+      from: `geo:${srcGeo.lat},${srcGeo.lon}`,
+      to: `geo:${dstGeo.lat},${dstGeo.lon}`,
+    });
+    const local = transitQueryTime(eventAt, timezone);
+    if (local) {
+      query.set("date", local.date);
+      query.set("time", local.time);
+      query.set("type", direction === "return" ? "departure" : "arrival");
+    }
+    const planUrl = `https://api.transit.ls8h.com/api/v1/plan?${query}`;
+    if (typeof recordProviderCost === "function") {
+      await recordTransitOperation({ uid, requestId: `transit:plan:${local ? `${local.date}T${local.time}` : "now"}`, operation: "plan" }, {
+        recordProviderCost,
+      }).catch(() => false);
+    }
+    const planResponse = await fetchImpl(planUrl);
+    if (!planResponse || !planResponse.ok) return null;
+    const plan = await planResponse.json();
+    // Guidance is display-only enrichment. A guidance outage must not discard
+    // a valid journey plan; the two requests still share exactly one query.
+    if (typeof recordProviderCost === "function") {
+      await recordTransitOperation({ uid, requestId: `transit:guidance:${local ? `${local.date}T${local.time}` : "now"}`, operation: "guidance" }, {
+        recordProviderCost,
+      }).catch(() => false);
+    }
+    const guidanceResponse = await fetchImpl(`https://api.transit.ls8h.com/api/v1/guidance/plan?${query}`);
+    const guidance = guidanceResponse && guidanceResponse.ok ? await guidanceResponse.json().catch(() => null) : null;
+    return guidance ? { ...plan, guidance } : plan;
   } catch { return null; }
 }
 
 // C2/C3 WIRE: try the FREE JP transit path first (geocode both → JP bbox → /plan), fall back to Google.
-async function directionsMinutes(src, dst, mapsKey, departAtMs = Date.now(), nowMs = Date.now(), departureMode = false, opts = {}) {
-  const geocode = opts._geocode || geocodeAddress;
-  const transitFetch = opts._transitFetch || transitFetchPlan;
+async function directionsRoute(src, dst, mapsKey, departAtMs = Date.now(), nowMs = Date.now(), departureMode = false, opts = {}) {
+  const geocode = opts._geocode || ((address, key) => geocodeAddress(address, key, {
+    store: opts._geocodeStore,
+    fetchImpl: opts._fetchImpl,
+    now: opts._now,
+    uid: opts._uid,
+    requestId: opts._geocodeRequestId,
+    recordProviderCost: opts._recordProviderCost,
+    authorizeProviderOperation: opts._authorizeProviderOperation,
+  }));
+  const transitFetch = opts._transitFetch || ((from, to, options) => transitFetchPlan(from, to, {
+    ...options,
+    fetchImpl: opts._transitFetchImpl || globalThis.fetch,
+    uid: opts._uid,
+    recordProviderCost: opts._recordProviderCost,
+  }));
   const googleFn = opts._directionsMinutesGoogle || directionsMinutesGoogle;
   const cache = opts._routeCache || _routeCache; // tests inject a fresh cache to avoid cross-test leakage
-  const google = () => googleFn(src, dst, mapsKey, departAtMs, nowMs, departureMode);
-  if (!mapsKey || !src || !dst) return null;
-  const [srcGeo, dstGeo] = await Promise.all([geocode(src, mapsKey), geocode(dst, mapsKey)]);
-  // The expensive part = the transit/Google provider call. Cache it per (from_geo, to_geo, time_bucket)
-  // so repeated 60s ticks for the same event reuse one result (FIND-002).
-  const compute = async () => {
-    if (srcGeo && dstGeo && chooseRouter(srcGeo, dstGeo) === "transit") {
-      const plan = await transitFetch(srcGeo, dstGeo);
-      const parsed = plan && parseTransitPlan(plan);
-      if (parsed && parsed.durationSecs != null) return minutesFromSeconds(parsed.durationSecs);
+  const google = async () => {
+    if (typeof opts._authorizeProviderOperation === "function") {
+      const decision = await opts._authorizeProviderOperation({
+        uid: opts._uid, provider: "google", operation: "fallback", essential: false, cacheHit: false,
+      });
+      if (decision && decision.allowed === false) return null;
     }
-    return google(); // non-JP / unresolvable / transit empty → Google Routes (as before)
+    return googleFn(src, dst, mapsKey, departAtMs, nowMs, departureMode, {
+      uid: opts._uid,
+      requestId: opts._googleRequestId || `google:routes:${new Date(departAtMs).toISOString()}:${departureMode ? "return" : "outbound"}`,
+      recordProviderCost: opts._recordProviderCost,
+    });
   };
-  if (srcGeo && dstGeo) return cache.getOrCompute("_shared", srcGeo, dstGeo, timeBucket(departAtMs), compute);
-  return compute(); // un-geocodable address → uncached (rare)
+  if (!mapsKey || !src || !dst) return null;
+  const [srcGeo, dstGeo] = await Promise.all([
+    geocode(src, mapsKey, opts),
+    geocode(dst, mapsKey, opts),
+  ]);
+  const routeBucket = timeBucket(departAtMs);
+  const cacheUid = opts._uid == null ? "anonymous" : String(opts._uid);
+  const anchor = new Date(departAtMs).toISOString();
+  const commonContext = {
+    eventAnchor: anchor,
+    timezone: opts._timezone || "UTC",
+    direction: departureMode ? "return" : "outbound",
+  };
+  const isTransit = srcGeo && dstGeo && chooseRouter(srcGeo, dstGeo) === "transit";
+  // Transit and Google have separate durable identities. A cached accepted
+  // Transit result can never be mistaken for a Google fallback, and a failed
+  // Transit attempt does not make the fallback key look fresh.
+  const transitCompute = async () => {
+    const plan = await transitFetch(srcGeo, dstGeo, {
+      eventAt: new Date(departAtMs).toISOString(),
+      timezone: opts._timezone || "UTC",
+      direction: departureMode ? "return" : "outbound",
+    });
+    const parsed = plan && parseTransitPlan(plan, {
+      eventAt: new Date(departAtMs).toISOString(),
+      timezone: opts._timezone || "UTC",
+    });
+    return parsed && parsed.durationSecs != null
+      ? { minutes: minutesFromSeconds(parsed.durationSecs), provider: "transit", route: parsed }
+      : null;
+  };
+  const googleCompute = async () => {
+    const minutes = await google();
+    return minutes == null ? null : { minutes, provider: "google", route: null };
+  };
+  const result = srcGeo && dstGeo
+    ? isTransit
+      ? await (async () => {
+        const transit = await cache.getOrCompute(cacheUid, srcGeo, dstGeo, routeBucket, transitCompute, {
+          ...commonContext, provider: "transit", routeMode: "transit",
+        });
+        if (transit) return transit;
+        return cache.getOrCompute(cacheUid, srcGeo, dstGeo, routeBucket, googleCompute, {
+          ...commonContext, provider: "google", routeMode: "fallback",
+        });
+      })()
+      : cache.getOrCompute(cacheUid, srcGeo, dstGeo, routeBucket, googleCompute, {
+        ...commonContext, provider: "google", routeMode: "google",
+      })
+    : googleCompute(); // un-geocodable address → uncached (rare)
+  const resolved = await result;
+  return resolved || null;
+}
+
+// Existing scheduler callers consume integer minutes. Mobile/API callers use
+// directionsRoute to retain the structured provider facts.
+async function directionsMinutes(...args) {
+  const result = await directionsRoute(...args);
+  return result && result.minutes != null ? result.minutes : null;
 }
 
 async function createTravelBlock(uid, apiKey, leaveMs, arriveMs, fromName, toName, dstAddr, calendar, gmailAccountId) {
   const cal = calendar || getCalendar({ apiKey, gmailAccountId });
   const hours = Math.floor((arriveMs - leaveMs) / 3600000);
   const minutes = Math.round(((arriveMs - leaveMs) % 3600000) / 60000);
   const j = await cal.createEvent(uid, {
     summary: `[Travel] 🚆 ${shortName(fromName)}→${shortName(toName)}`,
     start_datetime: isoNaiveUTC(leaveMs),
     event_duration_hour: hours, event_duration_minutes: Math.min(59, minutes),
@@ -249,23 +368,32 @@ async function claimTravel(uid, eventKey, leg, supaUrl, supaKey) {
 }
 // Release a claim when createTravelBlock failed, so a later run retries (claim→create→unclaim-on-failure).
 async function unclaimTravel(uid, eventKey, leg, supaUrl, supaKey) {
   if (!supaUrl || !supaKey) return;
   await fetch(`${supaUrl}/rest/v1/lm_travel_log?uid=eq.${encodeURIComponent(uid)}&event_key=eq.${encodeURIComponent(eventKey)}&leg=eq.${encodeURIComponent(leg)}`, {
     method: "DELETE",
     headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}`, Prefer: "return=minimal" },
   }).catch(() => {});
 }
 
-async function fillTravel(uid, { apiKey, mapsKey, geminiKey, home, nowMs = Date.now(), bufferMin = 5, calendar, supaUrl, supaKey, _directionsMinutes, gmailAccountId } = {}) {
+async function fillTravel(uid, { apiKey, mapsKey, geminiKey, home, nowMs = Date.now(), bufferMin = 5, calendar, supaUrl, supaKey, _directionsMinutes, gmailAccountId, timezone = "UTC", authorizeProviderOperation } = {}) {
   const directionsFn = _directionsMinutes || directionsMinutes;
   const cal = calendar || getCalendar({ apiKey, gmailAccountId });
+  const geocodeStore = supaUrl && supaKey ? createSupabaseGeocodeStore({ supaUrl, supaKey }) : undefined;
+  const routeStore = supaUrl && supaKey ? createSupabaseRouteStore({ supaUrl, supaKey }) : undefined;
+  const providerCost = supaUrl && supaKey
+    ? (event) => writeProviderCost(event, { supaUrl, supaKey })
+    : undefined;
+  const budgetGate = authorizeProviderOperation || (supaUrl && supaKey
+    ? (input) => authorizeBudget(input, { supaUrl, supaKey })
+    : undefined);
+  const routeCache = routeStore ? makeRouteCache({ store: routeStore, ttlMs: 10 * 60_000 }) : _routeCache;
   const events = await listEvents7d(uid, apiKey, nowMs, cal, gmailAccountId);
   let inserted = 0, checked = 0, skipped = 0;
   const outboundReports = [];
   for (let i = 0; i < events.length; i++) {
     const ev = events[i];
     if (isTravel(ev.summary) || !ev.location) continue;
     checked++;
     // C-H1: atomic claim key per (event, leg). Prefer the gcal event id (stable + unique). Fallback to
     // startMs:summary (NOT startMs alone — two different same-user events can share a start time, FIND-001).
     const evKey = String(ev.id || `${ev.startMs}:${ev.summary || ""}`);
@@ -282,35 +410,51 @@ async function fillTravel(uid, { apiKey, mapsKey, geminiKey, home, nowMs = Date.
       skipped++;
     } else {
       const origin = decision.origin;
       // Dedup: a [Travel] block already sitting in the gap right before this event?
       const dup = events.some((e) => isTravel(e.summary) && e.endMs && e.endMs <= ev.startMs && e.endMs > ev.startMs - 3 * 3600000);
       if (dup) {
         skipped++;
         // outbound block already exists — fall through to return-leg so it can backfill a missing return block
       } else {
         let dest = ev.location;
-        let mins = await directionsFn(origin, dest, mapsKey, ev.startMs, nowMs);
+        let mins = await directionsFn(origin, dest, mapsKey, ev.startMs, nowMs, false, {
+          _geocodeStore: geocodeStore,
+          _routeCache: routeCache,
+          _uid: uid,
+          _timezone: timezone,
+          _now: () => new Date(nowMs).toISOString(),
+          _recordProviderCost: providerCost,
+          _authorizeProviderOperation: budgetGate,
+        });
         if (mins == null && geminiKey) {
           // The location is a room name / unroutable string (e.g. "情報科学大講義室[L1]（IS）"). Let the
           // agent web-search the REAL venue address so a must-travel event still gets a block instead of a
           // silent skip — never-late beats clean code. (Lazy require avoids any load-order coupling.)
           try {
             const { agentResolveLocation } = require("./ask.js");
             const res = await agentResolveLocation(ev, { home, mapsKey, geminiKey });
             if (res && res.kind === "online") {
               skipped++;
               continue; // truly online — no outbound OR return block needed; skip entire iteration
             }
             if (res && res.kind === "filled" && res.location) {
               dest = res.location;
-              mins = await directionsFn(origin, dest, mapsKey, ev.startMs, nowMs);
+              mins = await directionsFn(origin, dest, mapsKey, ev.startMs, nowMs, false, {
+                _geocodeStore: geocodeStore,
+                _routeCache: routeCache,
+                _uid: uid,
+                _timezone: timezone,
+                _now: () => new Date(nowMs).toISOString(),
+                _recordProviderCost: providerCost,
+                _authorizeProviderOperation: budgetGate,
+              });
             }
           } catch { /* fall through to null-mins skip below */ }
         }
         if (mins == null) {
           skipped++;
           // Cannot route outbound — still evaluate return leg in case it is independently resolvable
         } else {
           const arriveMs = ev.startMs;
           const leaveMs = arriveMs - (mins + bufferMin) * 60000;
           if (leaveMs < nowMs) {
@@ -368,21 +512,29 @@ async function fillTravel(uid, { apiKey, mapsKey, geminiKey, home, nowMs = Date.
     // a block that already exists but is NOT events[i+1] (e.g. another event sits between them).
     const retDup = events.some(
       (e) => isTravel(e.summary) && e.startMs && e.startMs >= ev.endMs && e.startMs < ev.endMs + 3 * 3600000,
     );
     if (retDup) { skipped++; continue; }
     // Compute return travel time: DEPARTURE anchored to ev.endMs (FIND-004 — departureMode=true).
     // resolvedDest is the agent-resolved venue address from the outbound leg (or ev.location if
     // outbound was skipped due to dedup/no-origin — returnDecision already checked venue non-empty).
     const venue = resolvedDest;
     if (!home) { skipped++; continue; }
-    const retMins = await directionsFn(venue, home, mapsKey, ev.endMs, nowMs, /* departureMode= */ true);
+    const retMins = await directionsFn(venue, home, mapsKey, ev.endMs, nowMs, /* departureMode= */ true, {
+      _geocodeStore: geocodeStore,
+      _routeCache: routeCache,
+      _uid: uid,
+      _timezone: timezone,
+      _now: () => new Date(nowMs).toISOString(),
+      _recordProviderCost: providerCost,
+      _authorizeProviderOperation: budgetGate,
+    });
     if (retMins == null) { skipped++; continue; }
     const retLeaveMs = ev.endMs;                           // depart immediately after event ends
     const retArriveMs = retLeaveMs + retMins * 60000;
     // C-H1: atomically CLAIM the RETURN leg before creating.
     if (await claimTravel(uid, evKey, "return", supaUrl, supaKey)) {
       if (await createTravelBlock(uid, apiKey, retLeaveMs, retArriveMs, venue, home, home, cal, gmailAccountId)) inserted++;
       else { skipped++; await unclaimTravel(uid, evKey, "return", supaUrl, supaKey); } // create failed → release
     } else {
       skipped++; // another writer already claimed the RETURN block (race-safe)
     }
@@ -414,14 +566,15 @@ function returnDecision(ev, next, home) {
   // venue→next-venue (not home), so no return block is needed.
   const nextVenue = (next ? (next.location || "") : "").trim();
   const gap = next && Number.isFinite(next.startMs) ? next.startMs - ev.endMs : Infinity;
   if (nextVenue && gap >= 0 && gap <= 90 * 60000) {
     return { insert: false, origin: venue, reason: "next-back-to-back-venue" };
   }
   return { insert: true, origin: venue, reason: "return-needed" };
 }
 
 module.exports = {
-  fillTravel, directionsMinutes, isTravel, travelDecision, returnDecision, claimTravel, unclaimTravel,
+  fillTravel, directionsMinutes, directionsRoute, transitFetchPlan, isTravel, travelDecision, returnDecision, claimTravel, unclaimTravel,
   // #71 pure helpers (unit-tested)
   parseDurationSeconds, minutesFromSeconds, buildDriveBody, clampDepartIso, acceptRouteResults,
+  routesDriveMinutes, legacyTransitMinutes, directionsMinutesGoogle,
 };
diff --git a/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
new file mode 100644
index 000000000..ee5c0fc63
--- /dev/null
+++ b/apps/life-manager/migrations/2026-08-08-lm-provider-cost.sql
@@ -0,0 +1,110 @@
+-- Provider cost guard shared schema.  This migration is additive and safe to
+-- apply after the older lm_api_cost/lm_route_cache migrations.
+
+CREATE TABLE IF NOT EXISTS public.lm_geocode_cache (
+  address_key  text PRIMARY KEY CHECK (char_length(address_key) > 0),
+  lat          double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
+  lng          double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
+  provider     text NOT NULL,
+  resolved_at  timestamptz NOT NULL DEFAULT now()
+);
+
+CREATE INDEX IF NOT EXISTS lm_geocode_cache_resolved_at_idx
+  ON public.lm_geocode_cache (resolved_at);
+
+ALTER TABLE public.lm_geocode_cache ENABLE ROW LEVEL SECURITY;
+ALTER TABLE public.lm_geocode_cache FORCE ROW LEVEL SECURITY;
+
+-- Route cache v2: the previous unique identity omitted the event anchor,
+-- timezone, direction, and mode.  Keep old rows readable, but make new rows
+-- use the complete opaque key and retain the structured provider result.
+ALTER TABLE public.lm_route_cache
+  ADD COLUMN IF NOT EXISTS cache_key text,
+  ADD COLUMN IF NOT EXISTS route_result jsonb,
+  ADD COLUMN IF NOT EXISTS event_anchor text,
+  ADD COLUMN IF NOT EXISTS timezone text,
+  ADD COLUMN IF NOT EXISTS direction text,
+  ADD COLUMN IF NOT EXISTS route_mode text;
+
+ALTER TABLE public.lm_route_cache
+  DROP CONSTRAINT IF EXISTS lm_route_cache_uid_from_geo_to_geo_time_bucket_key;
+
+CREATE UNIQUE INDEX IF NOT EXISTS lm_route_cache_cache_key_idx
+  ON public.lm_route_cache (cache_key)
+  WHERE cache_key IS NOT NULL;
+CREATE INDEX IF NOT EXISTS lm_route_cache_context_idx
+  ON public.lm_route_cache (uid, event_anchor, timezone, direction, route_mode);
+
+-- Extend the old ledger without rewriting existing rows.  Actual billing is
+-- deliberately nullable: unavailable provider billing is represented by the
+-- enum value `unknown`, never by a fabricated zero.
+ALTER TABLE public.lm_api_cost
+  ADD COLUMN IF NOT EXISTS provider text,
+  ADD COLUMN IF NOT EXISTS sku text,
+  ADD COLUMN IF NOT EXISTS operation text,
+  ADD COLUMN IF NOT EXISTS request_id text,
+  ADD COLUMN IF NOT EXISTS pricing_version text,
+  ADD COLUMN IF NOT EXISTS estimated_usd numeric,
+  ADD COLUMN IF NOT EXISTS actual_billed_usd numeric,
+  ADD COLUMN IF NOT EXISTS actual_status text,
+  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
+  ADD COLUMN IF NOT EXISTS failure_reason text;
+
+DO $$
+BEGIN
+  IF NOT EXISTS (
+    SELECT 1 FROM pg_constraint
+    WHERE conrelid = 'public.lm_api_cost'::regclass
+      AND conname = 'lm_api_cost_actual_status_check'
+  ) THEN
+    ALTER TABLE public.lm_api_cost
+      ADD CONSTRAINT lm_api_cost_actual_status_check
+      CHECK (actual_status IS NULL OR actual_status IN ('measured', 'estimated', 'unknown'));
+  END IF;
+END $$;
+
+UPDATE public.lm_api_cost
+SET estimated_usd = est_usd
+WHERE estimated_usd IS NULL AND est_usd IS NOT NULL;
+
+CREATE INDEX IF NOT EXISTS lm_api_cost_uid_ts_idx
+  ON public.lm_api_cost (uid, ts);
+CREATE INDEX IF NOT EXISTS lm_api_cost_provider_ts_idx
+  ON public.lm_api_cost (provider, ts);
+CREATE UNIQUE INDEX IF NOT EXISTS lm_api_cost_provider_request_idx
+  ON public.lm_api_cost (provider, request_id)
+  WHERE request_id IS NOT NULL;
+
+CREATE TABLE IF NOT EXISTS public.lm_provider_cost_failures (
+  id           bigint generated always as identity primary key,
+  failed_at    timestamptz NOT NULL DEFAULT now(),
+  uid          text,
+  provider     text NOT NULL,
+  sku          text NOT NULL,
+  operation    text NOT NULL,
+  request_id   text NOT NULL,
+  quantity     numeric,
+  unit         text,
+  error        jsonb NOT NULL
+);
+CREATE INDEX IF NOT EXISTS lm_provider_cost_failures_failed_at_idx
+  ON public.lm_provider_cost_failures (failed_at);
+ALTER TABLE public.lm_provider_cost_failures ENABLE ROW LEVEL SECURITY;
+ALTER TABLE public.lm_provider_cost_failures FORCE ROW LEVEL SECURITY;
+
+-- Optional atomic gate claims. The provider ledger remains the cost source of truth; this narrow table
+-- only prevents two workers from authorizing the same request id in one user/day budget window.
+CREATE TABLE IF NOT EXISTS public.lm_provider_budget_claims (
+  uid            text NOT NULL,
+  budget_day     date NOT NULL,
+  provider       text NOT NULL,
+  operation      text NOT NULL,
+  request_id     text NOT NULL,
+  projected_usd  numeric NOT NULL DEFAULT 0 CHECK (projected_usd >= 0),
+  claimed_at     timestamptz NOT NULL DEFAULT now(),
+  PRIMARY KEY (uid, budget_day, request_id)
+);
+CREATE INDEX IF NOT EXISTS lm_provider_budget_claims_global_idx
+  ON public.lm_provider_budget_claims (budget_day, provider, operation);
+ALTER TABLE public.lm_provider_budget_claims ENABLE ROW LEVEL SECURITY;
+ALTER TABLE public.lm_provider_budget_claims FORCE ROW LEVEL SECURITY;
diff --git a/apps/life-manager/scheduler.js b/apps/life-manager/scheduler.js
index dcd92e381..0679e7547 100644
--- a/apps/life-manager/scheduler.js
+++ b/apps/life-manager/scheduler.js
@@ -29,20 +29,21 @@ const {
 } = require("./lib/wake-miss.js");
 const { putEvents, getEvents } = require("./lib/event-cache.js");
 const { runOrgan } = require("./lib/organ-run.js");
 const { fillTravel, directionsMinutes } = require("./lib/travel.js");
 const { formatTravelAutofillMessage } = require("./lib/i18n.js");
 const { askTick } = require("./lib/ask.js");
 const { onboardNudgeAll } = require("./lib/telegram-onboard.js");
 const { sendMessage } = require("./lib/telegram.js");
 const { langForPhone } = require("./lib/call-language.js");
 const { recordDailyComposioPoll } = require("./lib/ledger.js");
+const { authorizeProviderOperation: authorizeBudget } = require("./lib/provider-budget.js");
 const { schedulerPollInterval } = require("./lib/composio-budget.js");
 const {
   processLocationLateNotice, getLiveLocation,
 } = require("./lib/late-notice.js");
 const {
   DISCOVERY_WEEK_MS, listDiscoveryUsers, runDiscoveryForUser,
 } = require("./lib/feature-discovery.js");
 
 // HMAC over the per-call context so the persistent /ws bridge can prove a connection was minted by
 // THIS scheduler (not a stranger draining the Gemini budget) AND that the prompt context wasn't
@@ -469,21 +470,26 @@ async function wakeCallOnce(u, nowMs, deps = {}) {
         // is unchanged because falsy still means "someone already called". It is carried all the way
         // to releaseWake so a release that arrives late can only delete ITS OWN claim.
         const fresh = await (deps.claimWake || claimWake)(u.uid, eventKey);
         if (!fresh) continue; // already called for this (event, level)
         // A coarser level the call above superseded must never ring later, so it is CLAIMED here and
         // left uncalled — the claim is what stops a future tick from resurrecting it.
         if (lvl !== due[0]) continue;
         const streamUrl = buildStreamUrl({ ...ev, wakeUid: u.uid, wakeEventKey: eventKey }, lvl.urgency, langForUser(u), u.name);
         let res;
         try {
-          res = await (deps.placeCall || placeCall)({ to: u.phone, streamUrl });
+          res = await (deps.placeCall || placeCall)({
+            to: u.phone, streamUrl, uid: u.uid,
+            authorizeProviderOperation: deps.authorizeProviderOperation || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
+              ? (input) => authorizeBudget(input, { supaUrl: process.env.SUPABASE_URL, supaKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
+              : undefined),
+          });
         } catch (e) {
           res = { ok: false, error: String((e && e.message) || e) };
         }
         if (res.ok) {
           console.log(`[scheduler] WAKE T-${lvl.min} uid=${u.uid.slice(0, 12)} "${ev.summary}" ccid=${res.ccid}`);
         } else {
           console.error(`[scheduler] dial failed T-${lvl.min} uid=${u.uid.slice(0, 12)}: ${res.error}`);
           // 1b: record BEFORE releasing, because releasing is what erases the evidence. Wrapped so a
           // ledger outage can never skip the release below — the retry outranks the bookkeeping.
           await noteWakeMiss(u, {
@@ -807,20 +813,23 @@ async function travelUserOnce(u, deps = {}) {
   if (!apiKey || !mapsKey) return;
   const configuredSupa = SUPA();
   const supaUrl = deps.supaUrl !== undefined ? deps.supaUrl : configuredSupa.url;
   const supaKey = deps.supaKey !== undefined ? deps.supaKey : configuredSupa.key;
   try {
     const r = await (deps.fillTravel || fillTravel)(u.uid, {
       apiKey, mapsKey, geminiKey, home: u.home_address,
       nowMs: deps.nowMs === undefined ? Date.now() : deps.nowMs,
       calendar: deps.calendar, supaUrl, supaKey,
       _directionsMinutes: deps.directionsMinutes,
+      authorizeProviderOperation: deps.authorizeProviderOperation || (supaUrl && supaKey
+        ? (input) => authorizeBudget(input, { supaUrl, supaKey })
+        : undefined),
       gmailAccountId: u.gmail_account_id,
     });
     if (r.inserted) console.log(`[travel] uid=${u.uid.slice(0, 12)} inserted=${r.inserted} checked=${r.checked}`);
     const telegramToken = deps.telegramToken !== undefined ? deps.telegramToken : process.env.LM_TELEGRAM_BOT_TOKEN;
     if (u.notifications_enabled !== false && telegramToken && u.telegram_chat_id) {
       for (const report of r.outboundReports || []) {
         try {
           await (deps.sendMessage || sendMessage)(telegramToken, u.telegram_chat_id,
             formatTravelAutofillMessage(report, deps.nowMs === undefined ? Date.now() : deps.nowMs));
         } catch (error) {
diff --git a/apps/life-manager/server.js b/apps/life-manager/server.js
index 7c7e79a82..ebb907ecd 100644
--- a/apps/life-manager/server.js
+++ b/apps/life-manager/server.js
@@ -65,21 +65,23 @@ const {
   markAnswered, applyAmdDetection, applyTestCallDetection, upsertLiveLocation,
 } = require("./lib/late-notice.js");
 const { handleDiscoveryCallback } = require("./lib/feature-discovery.js");
 const { handlePayoutCallback } = require("./lib/payout-question.js");
 const { handleDietCallback } = require("./lib/diet-runtime.js");
 const { handlePreceptsCallback } = require("./lib/precepts-runtime.js");
 const { handleTypedPayoutAddress } = require("./lib/payout-address-intake.js");
 const { handleBrowserTaskMessage } = require("./lib/browser-task-intake.js");
 const { startBrowserJobLoop } = require("./lib/browser-job-runtime.js");
 const { claimEvent, unclaimEvent, applyBilling } = require("./lib/billing.js");
-const { recordCost } = require("./lib/ledger.js");
+const { recordProviderCost: writeProviderCost } = require("./lib/ledger.js");
+const { recordGeminiSession } = require("./lib/provider-cost-adapters.js");
+const { authorizeProviderOperation: authorizeBudget } = require("./lib/provider-budget.js");
 const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder"); // apiKey unused by constructEvent
 const SUPA_URL = process.env.SUPABASE_URL, SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
 const COMPOSIO_KEY = process.env.COMPOSIO_API_KEY;
 const LM_INBOUND_SECRET = process.env.LM_INBOUND_SECRET || ""; // shared secret in the Resend inbound webhook URL
 
 const LM_TG_TOKEN = process.env.LM_TELEGRAM_BOT_TOKEN || "";
 const LM_TG_SECRET = process.env.LM_TELEGRAM_WEBHOOK_SECRET || "";
 const LM_LATE_APPROVAL_CALLBACK_SECRET = process.env.LM_LATE_APPROVAL_CALLBACK_SECRET
   || process.env.LM_UID_SECRET || LM_TG_SECRET || undefined;
 const PUBLIC_BASE = process.env.PUBLIC_BASE || "https://aniccaai.com";
@@ -876,38 +878,56 @@ wss.on("connection", (carrierWs, req) => {
 
   // C1 (VCSDD life-manager-cost-connect-reliability): Gemini Live is the DEFAULT — every answered call
   // is a two-way Charon conversation from the first second (no one-way clip). `liveWsOpened` is the
   // measurable Goal-1 invariant (now ≥1 on EVERY answered call, the inverse of the old escalation-only
   // invariant).
   let gemini = null;
   let callStartedAtMs = null;
   let liveWsOpened = 0;
   let gotAudio = false;       // has Gemini emitted any audio yet on this call?
   let geminiReconnects = 0;   // one-retry guard for a pre-audio socket drop
+  let geminiUsageMetadata = null;
+  let geminiOpening = false;
   const carrierSend = (o) => { if (carrierWs.readyState === WebSocket.OPEN) carrierWs.send(JSON.stringify(o)); };
   const geminiSend = (o) => { if (gemini && gemini.readyState === WebSocket.OPEN) gemini.send(JSON.stringify(o)); };
 
   // Open the Gemini Live bridge (billed, ~$0.023/min). Called on the Telnyx `start` frame (call
   // answered) — this IS the default path now, not an escalation. If the socket drops before any audio
   // was heard, retry ONCE; a second pre-audio failure ends the call cleanly (never silence, never a
   // clip fallback).
-  function openGeminiLive() {
-    if (gemini) return;
+  async function openGeminiLive() {
+    if (gemini || geminiOpening) return;
+    geminiOpening = true;
+    if (SUPA_URL && SUPA_KEY) {
+      const decision = await authorizeBudget({
+        uid: wakeUid || null, provider: "gemini", operation: "session", essential: true,
+        projectedUsd: Number(process.env.LM_GEMINI_PROJECTED_SESSION_USD) || 0,
+      }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY });
+      if (!decision.allowed) {
+        geminiOpening = false;
+        console.error(`[bridge] Gemini session blocked by provider budget: ${decision.reason}`);
+        try { carrierWs.close(1013, "provider budget"); } catch {}
+        return;
+      }
+    }
+    geminiOpening = false;
     liveWsOpened++;
     console.log(`[bridge] opening Gemini Live live_ws_opened=${liveWsOpened}`);
     gemini = new WebSocket(geminiLiveWsUrl(GEMINI_KEY));
     const geminiStartedAtMs = Date.now();
     let geminiCostRecorded = false;
     gemini.on("open", () => geminiSend(geminiSetupForEvent(event, urgency, lang, name)));
     gemini.on("message", (data) => {
       let msg;
       try { msg = JSON.parse(data.toString()); } catch { return; }
+      const usage = msg.usageMetadata || msg.usage_metadata || (msg.serverContent && msg.serverContent.usageMetadata);
+      if (usage && typeof usage === "object" && !Array.isArray(usage)) geminiUsageMetadata = usage;
       const r = routeGeminiMessage(msg, state, carrierSend, buildTelnyxMediaFrame);
       if (r.kind === "setupComplete") geminiSend(buildGeminiTurn(openingTurnForLang(lang)));
       if (r.kind === "audio") gotAudio = true;
       // Barge-in: the caller spoke over Charon (Gemini server-VAD). Flush Telnyx's queued playback so
       // the caller is heard immediately instead of talked over.
       const carrierAction = carrierActionForGeminiKind(r.kind);
       if (carrierAction) carrierSend(carrierAction); // barge-in: flush Telnyx queued playback
       if (DEBUG_TRANSCRIPTS) {
         const t = parseGeminiTranscripts(msg);
         if (t.input) console.error(`[transcript] USER: ${t.input}`);
@@ -915,34 +935,36 @@ wss.on("connection", (carrierWs, req) => {
       }
     });
     // ws fires `error` THEN `close` for a SINGLE failure — the factory's `ended` flag collapses the pair
     // (else the paired close would hang up the call right after the reconnect socket opened). One retry
     // only, for a pre-audio transient failure; otherwise end the call cleanly (never silence, never a clip).
     const onGeminiEnd = makeGeminiEndHandler({
       getGotAudio: () => gotAudio,
       getReconnects: () => geminiReconnects,
       incReconnects: () => { geminiReconnects++; },
       carrierOpen: () => carrierWs.readyState === WebSocket.OPEN,
-      onReconnect: () => { gemini = null; openGeminiLive(); },
+      onReconnect: () => { gemini = null; void openGeminiLive().catch((error) => console.error(`[bridge] Gemini open failed: ${error && error.message}`)); },
       onClose: () => { try { carrierWs.close(); } catch {} },
       log: (reason) => console.log(`[bridge] gemini ${reason} gotAudio=${gotAudio} reconnects=${geminiReconnects}`),
     });
     gemini.on("error", (e) => onGeminiEnd(`err ${e.message}`));
     gemini.on("close", () => {
       if (!geminiCostRecorded) {
         geminiCostRecorded = true;
         const quantity = Math.max(0, (Date.now() - geminiStartedAtMs) / 1000);
-        // Duration proxy from spec §13's measured ~$0.023/min. Google bills Live API by actual
-        // token usage, not wall time (https://ai.google.dev/gemini-api/docs/live-api/best-practices#pricing-billing),
-        // but this bridge does not receive billable token totals, so the ledger stores this explicit estimate.
-        recordCost({ uid: wakeUid || null, kind: "gemini_live", quantity, unit: "seconds",
-          estUsd: quantity / 60 * 0.023, meta: { reconnect: geminiReconnects } });
+        // Google bills Live API by token usage. Preserve provider usage metadata when supplied;
+        // otherwise the adapter records a wall-time estimate with actual_status=unknown.
+        void recordGeminiSession({
+          uid: wakeUid || null, requestId: `gemini:${wakeUid || "anonymous"}:${geminiStartedAtMs}`,
+          durationSeconds: quantity, usageMetadata: geminiUsageMetadata,
+          metadata: { kind: "gemini_live", reconnect: geminiReconnects },
+        }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }).catch(() => false);
       }
       onGeminiEnd("closed");
     });
   }
 
   carrierWs.on("message", (data) => {
     let msg;
     try { msg = JSON.parse(data.toString()); } catch { return; }
     const kind = routeTelnyxMessage(msg, state, geminiSend);
     if (kind === "start") {
@@ -960,34 +982,39 @@ wss.on("connection", (carrierWs, req) => {
         if (!r.ok) console.error(`[bridge] answered_at PATCH FAILED (${r.error}) wake=${String(wakeUid).slice(0, 12)}`);
         else if (r.matched === 0) console.error(`[bridge] answered_at matched NO ROW wake=${String(wakeUid).slice(0, 12)}`);
       }).catch((e) => console.error(`[bridge] answered_at update failed: ${e && e.message}`));
       if (state.callControlId && !state.recordStarted) {
         state.recordStarted = true;
         startRecording(state.callControlId).then((r) => {
           if (r.ok) console.log(`[bridge] recording started ccid=${state.callControlId}`);
           else console.error(`[bridge] record_start FAILED: ${r.error}`);
         });
       }
-      if (!gemini) openGeminiLive(); // DEFAULT: two-way Gemini Live from second 1
+      if (!gemini) void openGeminiLive().catch((error) => console.error(`[bridge] Gemini open failed: ${error && error.message}`)); // DEFAULT: two-way Gemini Live from second 1
     }
     if (kind === "dtmf") console.log("[bridge] DTMF ignored (Gemini Live already open)");
     if (kind === "stop" && gemini) { try { gemini.close(); } catch {} }
   });
   let released = false;
   const release = () => { if (!released) { released = true; liveCalls = Math.max(0, liveCalls - 1); } };
   carrierWs.on("close", () => {
     release();
     console.log(`[bridge] carrier closed in=${state.inFrames} out=${state.outFrames} live_ws_opened=${liveWsOpened} live=${liveCalls}`);
     if (callStartedAtMs != null) {
       const quantity = Math.max(0, (Date.now() - callStartedAtMs) / 1000);
-      recordCost({ uid: wakeUid || null, kind: "telnyx_call", quantity, unit: "seconds",
-        estUsd: quantity / 60 * 0.002, meta: { stream_id: state.streamSid || null } });
+      void writeProviderCost({
+        uid: wakeUid || null, provider: "telnyx", sku: "voice", operation: "call_session",
+        requestId: `telnyx:${wakeUid || "anonymous"}:${callStartedAtMs}`, quantity, unit: "seconds",
+        pricingVersion: "telnyx-session-estimate-2026-08", estimatedUsd: quantity / 60 * 0.002,
+        actualBilledUsd: null, actualStatus: "unknown",
+        metadata: { kind: "telnyx_call", stream_id: state.streamSid || null },
+      }, { supaUrl: SUPA_URL, supaKey: SUPA_KEY }).catch(() => false);
     }
     if (gemini) { try { gemini.close(); } catch {} }
   });
   carrierWs.on("error", release);
 });
 
 // Only bind to the port when this file is run directly (not when required by tests).
 // This allows test files to import inngestServeAllowed without starting the HTTP server.
 if (require.main === module) {
   server.listen(PORT, () => {
diff --git a/apps/life-manager/test/mobile-geocode-cost-guard.test.js b/apps/life-manager/test/mobile-geocode-cost-guard.test.js
new file mode 100644
index 000000000..2f9e7f572
--- /dev/null
+++ b/apps/life-manager/test/mobile-geocode-cost-guard.test.js
@@ -0,0 +1,61 @@
+"use strict";
+
+const { test } = require("node:test");
+const assert = require("node:assert/strict");
+
+const travel = require("../lib/travel.js");
+const { createSupabaseGeocodeStore } = require("../lib/geocode-cache.js");
+const { makeRouteCache } = require("../lib/route-cache.js");
+
+const SUPA = { supaUrl: "https://supa.invalid", supaKey: "service-role-key" };
+
+function response(body, status = 200) {
+  return { ok: status >= 200 && status < 300, status, json: async () => body };
+}
+
+function persistentFetch() {
+  const rows = new Map();
+  const calls = [];
+  const fetchImpl = async (input, init = {}) => {
+    const url = new URL(String(input));
+    calls.push({ url, init });
+    if (init.method === "POST") {
+      const body = JSON.parse(init.body);
+      rows.set(body.address_key, body);
+      return response([], 201);
+    }
+    const expression = url.searchParams.get("address_key") || "";
+    const key = expression.startsWith("eq.") ? expression.slice(3) : expression;
+    const row = rows.get(key);
+    return response(row ? [row] : []);
+  };
+  return { fetchImpl, rows, calls };
+}
+
+test("row 9: repeated normalized addresses make zero new Google geocode requests", async () => {
+  const db = persistentFetch();
+  const firstStore = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  const secondStore = createSupabaseGeocodeStore({ ...SUPA, fetchImpl: db.fetchImpl });
+  let googleCalls = 0;
+  const googleFetch = async () => {
+    googleCalls += 1;
+    return response({ results: [{ geometry: { location: { lat: 35.681, lng: 139.767 } } }] });
+  };
+  const transitFetch = async () => ({
+    journeys: [{ durationSecs: 900, arrivalSecs: 900, departureSecs: 0, legs: [] }],
+  });
+  const at = Date.parse("2026-08-09T09:00:00+09:00");
+  const options = (store) => ({
+    _geocodeStore: store,
+    _fetchImpl: googleFetch,
+    _transitFetch: transitFetch,
+    _directionsMinutesGoogle: async () => 45,
+    _routeCache: makeRouteCache({ store: new Map(), ttlMs: 600000 }),
+  });
+
+  await travel.directionsMinutes(" 1-2 MAIN STREET ", " 3-4 SHIBUYA\nTOKYO ", "maps-key", at, at - 60000, false, options(firstStore));
+  await travel.directionsMinutes("1-2 main street", "3-4 shibuya tokyo", "maps-key", at, at - 60000, false, options(secondStore));
+
+  assert.equal(googleCalls, 2, "one request per unique address, none on the second process instance");
+  assert.equal(db.rows.size, 2);
+});
diff --git a/apps/life-manager/test/provider-budget-gate.test.js b/apps/life-manager/test/provider-budget-gate.test.js
new file mode 100644
index 000000000..cb7046c48
--- /dev/null
+++ b/apps/life-manager/test/provider-budget-gate.test.js
@@ -0,0 +1,84 @@
+"use strict";
+
+const test = require("node:test");
+const assert = require("node:assert/strict");
+const { directionsRoute } = require("../lib/travel.js");
+const { makeRouteCache } = require("../lib/route-cache.js");
+const { geocodeAddress } = require("../lib/geocode-cache.js");
+const { makeComposioCalendar } = require("../lib/transport/calendar-composio.js");
+const { placeCall } = require("../lib/dial.js");
+
+test("Google fallback is budget-authorized and does not call the paid provider after denial", async () => {
+  let googleCalls = 0;
+  const route = await directionsRoute("origin", "destination", "maps", Date.now() + 60000, Date.now(), false, {
+    _geocode: async (address) => address === "origin" ? { lat: 35.6, lon: 139.7 } : { lat: 35.7, lon: 139.8 },
+    _transitFetch: async () => null,
+    _directionsMinutesGoogle: async () => { googleCalls += 1; return 30; },
+    _authorizeProviderOperation: async (input) => {
+      assert.equal(input.provider, "google");
+      assert.equal(input.operation, "fallback");
+      return { allowed: false, reason: "paid_fallback_disabled" };
+    },
+    _routeCache: makeRouteCache({ store: new Map() }),
+  });
+  assert.equal(route, null);
+  assert.equal(googleCalls, 0);
+});
+
+test("a Google geocode miss is budget-authorized before the paid request", async () => {
+  let googleCalls = 0;
+  const result = await geocodeAddress("unresolved", "maps", {
+    store: { get: async () => null, put: async () => true },
+    fetchImpl: async () => { googleCalls += 1; return { ok: true, json: async () => ({ results: [] }) }; },
+    authorizeProviderOperation: async (input) => {
+      assert.equal(input.provider, "google");
+      assert.equal(input.operation, "geocoding");
+      return { allowed: false, reason: "budget_stopped" };
+    },
+  });
+  assert.equal(result, null);
+  assert.equal(googleCalls, 0);
+});
+
+test("nonessential Composio refresh checks the shared budget before the tool request", async () => {
+  let providerCalls = 0;
+  const calendar = makeComposioCalendar({
+    apiKey: "k",
+    fetchImpl: async () => { providerCalls += 1; return { ok: true, json: async () => ({ successful: true, data: { items: [] } }) }; },
+    authorizeProviderOperation: async (input) => {
+      assert.equal(input.provider, "composio");
+      assert.equal(input.essential, false);
+      return { allowed: false, reason: "budget_stopped" };
+    },
+  });
+  assert.deepEqual(await calendar.listEventsRaw("u1", {}), []);
+  assert.equal(providerCalls, 0);
+});
+
+test("new Telnyx calls consult the shared voice cap before dialing", async () => {
+  const before = {
+    TELNYX_API_KEY: process.env.TELNYX_API_KEY,
+    TELNYX_CONNECTION_ID: process.env.TELNYX_CONNECTION_ID,
+    TELNYX_PHONE_NUMBER: process.env.TELNYX_PHONE_NUMBER,
+  };
+  process.env.TELNYX_API_KEY = "k";
+  process.env.TELNYX_CONNECTION_ID = "connection";
+  process.env.TELNYX_PHONE_NUMBER = "+10000000000";
+  try {
+    const result = await placeCall({
+      to: "+10000000001", streamUrl: "wss://example.test/ws", uid: "u1",
+      authorizeProviderOperation: async (input) => {
+        assert.equal(input.provider, "telnyx");
+        assert.equal(input.operation, "call_session");
+        return { allowed: false, reason: "voice_user_cap" };
+      },
+    });
+    assert.equal(result.ok, false);
+    assert.match(result.error, /voice_user_cap/);
+  } finally {
+    for (const [key, value] of Object.entries(before)) {
+      if (value == null) delete process.env[key];
+      else process.env[key] = value;
+    }
+  }
+});
diff --git a/apps/life-manager/test/provider-cost-contract.test.js b/apps/life-manager/test/provider-cost-contract.test.js
new file mode 100644
index 000000000..2d1628a38
--- /dev/null
+++ b/apps/life-manager/test/provider-cost-contract.test.js
@@ -0,0 +1,108 @@
+"use strict";
+
+const { test } = require("node:test");
+const assert = require("node:assert/strict");
+const fs = require("node:fs");
+const path = require("node:path");
+
+function loadLedger() {
+  const file = require.resolve("../lib/ledger.js");
+  delete require.cache[file];
+  return require(file);
+}
+
+const BASE = {
+  provider: "google_maps",
+  sku: "geocoding",
+  operation: "address_lookup",
+  uid: "u1",
+  requestId: "req-1",
+  quantity: 1,
+  unit: "request",
+  pricingVersion: "maps-2026-01",
+  estimatedUsd: 0.005,
+  metadata: { source: "travel" },
+};
+
+test("provider cost migration adds complete dimensions and explicit actual status", () => {
+  const sql = fs.readFileSync(path.join(__dirname, "../migrations/2026-08-08-lm-provider-cost.sql"), "utf8").toLowerCase();
+  for (const field of ["provider", "sku", "operation", "request_id", "pricing_version", "estimated_usd", "actual_billed_usd", "actual_status"]) {
+    assert.match(sql, new RegExp(`add column if not exists ${field}`));
+  }
+  assert.match(sql, /actual_status/);
+  assert.match(sql, /lm_provider_cost_failures/);
+});
+
+test("recordProviderCost records all dimensions and measured actual billing", async () => {
+  const calls = [];
+  const ok = await loadLedger().recordProviderCost({
+    ...BASE,
+    actualBilledUsd: 0.0042,
+    actualStatus: "measured",
+  }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
+  });
+  assert.equal(ok, true);
+  assert.equal(calls.length, 1);
+  const body = JSON.parse(calls[0][1].body);
+  assert.deepEqual(body, {
+    uid: "u1",
+    provider: "google_maps",
+    sku: "geocoding",
+    operation: "address_lookup",
+    request_id: "req-1",
+    quantity: 1,
+    unit: "request",
+    pricing_version: "maps-2026-01",
+    estimated_usd: 0.005,
+    actual_billed_usd: 0.0042,
+    actual_status: "measured",
+    metadata: { source: "travel" },
+  });
+});
+
+test("missing provider billing is stored as null/unknown and never coerced to zero", async () => {
+  const calls = [];
+  const ok = await loadLedger().recordProviderCost({ ...BASE, requestId: "req-unknown" }, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 201 }; },
+  });
+  assert.equal(ok, true);
+  const body = JSON.parse(calls[0][1].body);
+  assert.equal(body.actual_status, "unknown");
+  assert.equal(body.actual_billed_usd, null);
+  assert.notEqual(body.actual_billed_usd, 0);
+  assert.equal(body.estimated_usd, BASE.estimatedUsd);
+});
+
+test("invalid actual status or dimensions fail closed without a provider write", async () => {
+  let calls = 0;
+  const deps = {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async () => { calls += 1; return { ok: true, status: 201 }; },
+  };
+  assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "fake" }, deps), false);
+  assert.equal(await loadLedger().recordProviderCost({ ...BASE, quantity: -1 }, deps), false);
+  assert.equal(await loadLedger().recordProviderCost({ ...BASE, actualStatus: "measured" }, deps), false);
+  assert.equal(calls, 0);
+});
+
+test("ledger write failure emits a structured owner alert/outbox record and returns false", async () => {
+  const alerts = [];
+  const outbox = [];
+  const ok = await loadLedger().recordProviderCost(BASE, {
+    supaUrl: "https://db.example", supaKey: "service",
+    fetchImpl: async () => ({ ok: false, status: 503 }),
+    ownerAlert: async (event) => alerts.push(event),
+    outboxStore: { insert: async (event) => { outbox.push(event); return true; } },
+    log: () => {},
+  });
+  assert.equal(ok, false);
+  assert.equal(alerts.length, 1);
+  assert.equal(outbox.length, 1);
+  assert.equal(alerts[0].kind, "provider_cost_ledger_write_failed");
+  assert.equal(alerts[0].requestId, "req-1");
+  assert.equal(outbox[0].provider, "google_maps");
+  assert.equal(outbox[0].error.status, 503);
+});
