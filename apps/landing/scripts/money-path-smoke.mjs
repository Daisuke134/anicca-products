// money-path-smoke.mjs — C5/C6 (VCSDD life-manager-cost-connect-reliability). Post-deploy smoke:
// assert the live site is up, /lm hands off to the Life Manager web app, and payment stays server-side.
// Exit 0 = PASS, exit 1 = FAIL (caller rolls back). Deterministic, no LLM. Usage: node money-path-smoke.mjs [baseUrl]
// The link-assertion logic is the SINGLE tested source (apps/life-call/lib/money-path.js) — no reimplementation
// (adversary FIND-006 drift). registry.json is the single known-good SSOT.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { LIFE_MANAGER_WEB_APP_URL } from "../lib/writer-cta-url.js";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { assertWebAppHandoff } = require(join(here, "../../life-call/lib/money-path.js"));
const registry = JSON.parse(readFileSync(join(here, "../monitors/registry.json"), "utf8"));

const BASE = process.argv[2] || "https://aniccaai.com";
const fail = (m) => { console.error("SMOKE FAIL:", m); process.exit(1); };

// 1. core routes 200
for (const p of ["/", "/life-manager", "/lm"]) {
  const r = await fetch(BASE + p);
  if (r.status !== 200) fail(`${p} returned ${r.status}`);
}
// 2. /lm chunk points to the Web app and contains neither a Telegram handoff nor a direct Stripe link.
const html = await (await fetch(`${BASE}/lm?cb=${Date.now()}`)).text();
if (!html.includes("$29") || !html.includes("7-day free trial") || /\$20\/mo|coming soon|近日公開/i.test(html)) {
  fail("/lm pricing/trial copy is stale or missing the live $29 plan");
}
const chunkPath = (html.match(/\/_next\/static\/chunks\/app\/lm\/page-[A-Za-z0-9]+\.js/) || [])[0];
if (!chunkPath) fail("no /lm page chunk found in HTML");
const chunk = await (await fetch(BASE + chunkPath)).text();
const verdict = assertWebAppHandoff({ chunk });
if (!verdict.ok) fail(verdict.reason);
const webHealth = await fetch(new URL("/health", LIFE_MANAGER_WEB_APP_URL));
if (webHealth.status !== 200) fail(`Life Manager web app health returned ${webHealth.status}`);
const health = await webHealth.json().catch(() => null);
if (!health || health.ok !== true || health.service !== "life-call") fail("Life Manager web app health response is invalid");
// 3. Keep the legacy Payment Link reachable for existing users. New Web customers use
// server-created Checkout after Calendar setup; the live $29 price remains unchanged.
const pay = await fetch(registry.stripe_lm_url);
if (pay.status !== 200) fail(`registry Stripe link not reachable (${pay.status})`);
// A GET must reach the checkout handler's method guard without creating a Stripe session.
const checkout = await fetch(`${BASE}/.netlify/functions/checkout`);
if (checkout.status !== 405) fail(`checkout function did not load cleanly (${checkout.status})`);

console.log(`SMOKE PASS: ${BASE} up, /lm Web app handoff verified, life-call health is 200, no direct Stripe link, Checkout and legacy Payment Link remain reachable`);
process.exit(0);
