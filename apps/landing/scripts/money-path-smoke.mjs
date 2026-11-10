// money-path-smoke.mjs — C5/C6 (VCSDD life-manager-cost-connect-reliability). Post-deploy smoke:
// assert the live site is up, /maritime is the same-origin Cloud proxy, /lm does not advertise
// an undecided Cloud price, and payment stays server-side.
// Exit 0 = PASS, exit 1 = FAIL (caller rolls back). Deterministic, no LLM. Usage: node money-path-smoke.mjs [baseUrl]
// The link-assertion logic is the SINGLE tested source (apps/life-call/lib/money-path.js) — no reimplementation
// (adversary FIND-006 drift). registry.json is the single known-good SSOT.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { assertWebAppHandoff } = require(join(here, "../../life-call/lib/money-path.js"));
const registry = JSON.parse(readFileSync(join(here, "../monitors/registry.json"), "utf8"));

const BASE = process.argv[2] || "https://aniccaai.com";
const LIFE_MANAGER_WEB_SERVICE_ORIGIN = "https://life-call-production.up.railway.app";
const fail = (m) => { console.error("SMOKE FAIL:", m); process.exit(1); };

// 1. core routes 200
for (const p of ["/", "/life-manager", "/lm"]) {
  const r = await fetch(BASE + p);
  if (r.status !== 200) fail(`${p} returned ${r.status}`);
}
// 1b. /maritime is the same-origin Cloud proxy. A redirect back to /lm hides the app.
const maritime = await fetch(BASE + "/maritime", { redirect: "manual" });
if (maritime.status !== 200) fail(`/maritime returned ${maritime.status}, expected the proxied Cloud app`);
const maritimeHtml = await maritime.text();
if (!maritimeHtml.includes("Life Manager Cloud")) fail("/maritime response is not the Cloud app");
if (/\$19|\b19\/month\b|\$29|\b29\/month\b|7-day free trial/i.test(maritimeHtml)) {
  fail("/maritime advertises a live Cloud price");
}
// 2. /lm is the public page. It may be the waitlist or a same-origin Cloud link, and it must not
// advertise the undecided Cloud price or the TEST-only $19 offer.
const html = await (await fetch(`${BASE}/lm?cb=${Date.now()}`)).text();
if (/\$20\/mo|coming soon|近日公開|\$19|\b19\/month\b|\$29|\b29\/month\b|7-day free trial/i.test(html)) {
  fail("/lm pricing copy is stale or advertises an undecided Cloud price");
}
if (!/join the waitlist/i.test(html) && !html.includes('href="/maritime') && !html.includes("href='/maritime")) {
  fail("/lm has neither the waitlist nor a same-origin Cloud entry");
}
const chunkPath = (html.match(/\/_next\/static\/chunks\/app\/lm\/page-[A-Za-z0-9]+\.js/) || [])[0];
// Canonical marketing routes are static HTML; legacy pages still use a Next chunk.
// Validate the actual handoff surface with the same tested invariant in either format.
let chunk = html;
if (chunkPath) {
  const response = await fetch(BASE + chunkPath);
  if (!response.ok) fail(`/lm page chunk returned ${response.status}`);
  chunk += "\n" + await response.text();
} else if (!html.includes('rel="canonical" href="https://aniccaai.com/lm"')) {
  fail("no /lm page chunk or canonical static page found");
}
const verdict = assertWebAppHandoff({ chunk }, { publicOrigin: BASE });
if (!verdict.ok) fail(verdict.reason);
// Verify backend health directly. The public onboarding and authentication path stays on Netlify.
const webHealth = await fetch(new URL("/health", LIFE_MANAGER_WEB_SERVICE_ORIGIN));
if (webHealth.status !== 200) fail(`Life Manager web app health returned ${webHealth.status}`);
const health = await webHealth.json().catch(() => null);
if (!health || health.ok !== true || health.service !== "life-call") fail("Life Manager web app health response is invalid");
// 3. Keep legacy payment routes healthy for existing users; this does not claim Cloud checkout is live.
const pay = await fetch(registry.stripe_lm_url);
if (pay.status !== 200) fail(`registry Stripe link not reachable (${pay.status})`);
// A GET must reach the checkout handler's method guard without creating a Stripe session.
const checkout = await fetch(`${BASE}/.netlify/functions/checkout`);
if (checkout.status !== 405) fail(`checkout function did not load cleanly (${checkout.status})`);

console.log(`SMOKE PASS: ${BASE} up, /maritime proxy is 200, /lm has no live Cloud price, life-call backend health is 200, no direct Stripe link, legacy Checkout and Payment Link remain reachable`);
process.exit(0);
