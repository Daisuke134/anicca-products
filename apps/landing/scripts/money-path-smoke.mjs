// money-path-smoke.mjs — post-deploy smoke after Life Manager Cloud retirement (2026-11-28).
// Assert the live site is up, /lm no longer hands off to the retired Railway app,
// /maritime still redirects to /lm, and checkout still loads. Exit 0 = PASS, 1 = FAIL.
import { ANICCA_HOME_URL } from "../lib/writer-cta-url.js";

const BASE = process.argv[2] || "https://aniccaai.com";
const fail = (m) => { console.error("SMOKE FAIL:", m); process.exit(1); };

for (const p of ["/", "/life-manager", "/lm"]) {
  const r = await fetch(BASE + p);
  if (r.status !== 200) fail(`${p} returned ${r.status}`);
}

const retired = await fetch(BASE + "/maritime", { redirect: "manual" });
if (![301, 302, 303, 307, 308].includes(retired.status)) fail(`/maritime returned ${retired.status}, expected a redirect to /lm`);
const loc = retired.headers.get("location") || "";
if (!loc.endsWith("/lm")) fail(`/maritime redirect Location is ${loc}, expected /lm`);

const html = await (await fetch(`${BASE}/lm?cb=${Date.now()}`)).text();
if (/life-call-production\.up\.railway\.app/i.test(html)) {
  fail("/lm still links to the retired Life Manager Railway app");
}
if (/Connect Google Calendar/i.test(html) && /7-day free trial/i.test(html)) {
  fail("/lm still offers the closed Life Manager Cloud trial");
}

const money = await fetch(`${BASE}/money-printer`, { redirect: "manual" });
if (![301, 302, 303, 307, 308].includes(money.status)) fail(`/money-printer returned ${money.status}, expected a redirect off the retired Railway proxy`);
const moneyLoc = money.headers.get("location") || "";
if (/railway\.app/i.test(moneyLoc)) fail(`/money-printer still redirects to Railway (${moneyLoc})`);

const checkout = await fetch(`${BASE}/.netlify/functions/checkout`);
if (checkout.status !== 405) fail(`checkout function did not load cleanly (${checkout.status})`);

if (!ANICCA_HOME_URL.includes("aniccaai.com")) fail("ANICCA_HOME_URL is not the live Anicca site");

console.log(`SMOKE PASS: ${BASE} up, /maritime redirects to /lm, /lm has no Railway Life Manager CTA, /money-printer leaves Railway, checkout reachable`);
process.exit(0);
