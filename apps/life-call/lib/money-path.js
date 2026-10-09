// lib/money-path.js — C5/C6 (VCSDD life-manager-cost-connect-reliability). Continuous money-path check
// so the ¥700k-wrong-link / site-down class (2026-07-03) can never silently survive again.
// SRE: black-box + CONTENT assertion (200 is not enough — assert the exact Web app handoff and
// reject Telegram/direct Stripe links). The registry Stripe URL remains the server-side payment SSOT for
// reachability checks. The legacy Stripe-value assertion stays available for historical callers.
// Rollback is gated:
//   - debounce: >=2 consecutive FAIL (no single-transient rollback)
//   - flap guard: never roll back into a last-good that itself fails → escalate instead
//   - dedup: ONE Telegram per incident, re-armed after a recovery
// Pure logic; the HTTP fetch + Netlify restore + Telegram send live in the caller (a GitHub Actions cron,
// independent of Railway/Netlify so the monitor never dies with the monitored).
"use strict";

const STRIPE_RE = /https:\/\/buy\.stripe\.com\/[A-Za-z0-9_]+/g;
const TELEGRAM_HANDOFF_URL = "https://t.me/LifeManagerBotbot?start=lp";
const HTTPS_URL_RE = /https:\/\/(?:(?!https:\/\/)[^"'\s])+/gi;

// All DISTINCT buy.stripe.com links in a chunk (order-preserving). The monitor must not trust the FIRST
// match — a rogue second link (exactly the ¥700k class) must be caught.
function extractAllStripeLinks(chunk) {
  return [...new Set(String(chunk || "").match(STRIPE_RE) || [])];
}

function extractStripeLink(chunk) {
  const all = extractAllStripeLinks(chunk);
  return all.length ? all[0] : null;
}

// assertMoneyPath({ chunk }, registry) → { ok, reason }
// FAIL if: no link, the (single) link != registry, OR any OTHER distinct stripe link is present
// (ambiguous bundle = a rogue link snuck in). Only an exact single-match to the registry passes.
function assertMoneyPath(bundle, registry) {
  const links = extractAllStripeLinks(bundle && bundle.chunk);
  if (links.length === 0) return { ok: false, reason: "no stripe link found in /lm chunk" };
  const rogue = links.filter((l) => l !== registry.stripe_lm_url);
  if (rogue.length > 0)
    return { ok: false, reason: `stripe link mismatch/ambiguous: unexpected=${rogue.join(",")} expected=${registry.stripe_lm_url}` };
  return { ok: true, reason: "ok" };
}

// assertWebAppHandoff({ chunk }) → { ok, reason }
// Public /lm starts in the Life Manager web app; billing remains server-side after Calendar setup.
function assertWebAppHandoff(bundle) {
  const chunk = String(bundle && bundle.chunk || "");
  const webLinks = [];
  const unexpectedWebLinks = [];
  let telegramLinkFound = false;
  let stripeLinkFound = false;
  for (const raw of chunk.match(HTTPS_URL_RE) || []) {
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
    if (hostname === "t.me" || hostname === "telegram.me") telegramLinkFound = true;
    if (hostname === "stripe.com" || hostname.endsWith(".stripe.com")) stripeLinkFound = true;
    if (hostname === "life-call-production.up.railway.app") {
      const canonical = parsed.protocol === "https:" && !parsed.username && !parsed.password
        && parsed.pathname === "/lm";
      if (canonical) webLinks.push(`${parsed.origin}${parsed.pathname}`);
      else unexpectedWebLinks.push(raw);
    }
  }
  if (telegramLinkFound) return { ok: false, reason: "telegram link found in /lm chunk" };
  if (stripeLinkFound) {
    return { ok: false, reason: "stripe link found in /lm chunk" };
  }
  if (unexpectedWebLinks.length > 0) return { ok: false, reason: `unexpected web app link in /lm chunk: ${unexpectedWebLinks.join(",")}` };
  if (!webLinks.includes("https://life-call-production.up.railway.app/lm")) return { ok: false, reason: "web app handoff link missing in /lm chunk" };
  return { ok: true, reason: "ok" };
}

// Stateful gate across checks.
class RollbackController {
  constructor({ debounce = 2 } = {}) {
    this.debounce = debounce;
    this.consecutiveFail = 0;
    this.incidentOpen = false; // true once we've alerted/acted for the current incident
    this.rollbackFired = false; // one restore per incident — never re-fire real Netlify restores each cycle
  }
  // onResult(pass, { lastGoodPasses }) → { rollback, escalate, notify }
  onResult(pass, { lastGoodPasses = true } = {}) {
    if (pass) {
      this.consecutiveFail = 0;
      this.incidentOpen = false; // recovery re-arms alerting
      this.rollbackFired = false; // ...and re-arms rollback for a future incident
      return { rollback: false, escalate: false, notify: false };
    }
    this.consecutiveFail += 1;
    if (this.consecutiveFail < this.debounce) {
      return { rollback: false, escalate: false, notify: false }; // still debouncing
    }
    const notify = !this.incidentOpen; // one alert per incident
    if (notify) this.incidentOpen = true;
    if (lastGoodPasses) {
      const rollback = !this.rollbackFired; // one restore per incident
      if (rollback) this.rollbackFired = true;
      return { rollback, escalate: false, notify };
    }
    // flap guard: the rollback target is also bad → don't flap, escalate to a human
    return { rollback: false, escalate: true, notify };
  }
}

module.exports = {
  extractStripeLink,
  assertMoneyPath,
  assertWebAppHandoff,
  RollbackController,
  STRIPE_RE,
};
