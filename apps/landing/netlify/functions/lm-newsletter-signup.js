// POST /api/newsletter (and /.netlify/functions/lm-newsletter-signup)
//
// Onboarding for the Life Manager daily gig newsletter. Accepts exactly what the
// page asks for — email, language, interests, device — and stores it durably.
//
// Storage order (first one that works is enough to answer 200):
//   1. Supabase table `lm_newsletter_subscribers` when SUPABASE_URL +
//      SUPABASE_SERVICE_ROLE_KEY are set (see supabase/migrations/).
//   2. Netlify Blobs store `lm-newsletter` — always available inside Netlify
//      Functions, so a missing table never loses a subscriber.
// A welcome email goes out through Resend when RESEND_API_KEY and
// RESEND_FROM_EMAIL are configured; it is not required for the signup to succeed.
//
// GET ?action=count returns only the number of stored subscribers (no PII), so the
// deployed function can be verified from outside.
"use strict";

const crypto = require("node:crypto");

const LANGS = new Set(["ja", "en", "es"]);
const INTERESTS = new Set(["voice", "evaluation", "testing", "research", "apps"]);
const DEVICES = new Set(["phone", "both"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STORE_NAME = "lm-newsletter";
const PREFIX = "subscribers/";
const SUMMARY_KEY = "index/summary.json";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event || !event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function emailHash(email) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

// Returns { ok: true, record } or { ok: false, error }.
function normalize(input) {
  const raw = input || {};
  const email = String(raw.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: "invalid_email" };

  const lang = String(raw.lang || "").toLowerCase();
  if (!LANGS.has(lang)) return { ok: false, error: "invalid_lang" };

  const interests = Array.isArray(raw.interests)
    ? Array.from(new Set(raw.interests.map((i) => String(i).toLowerCase()).filter((i) => INTERESTS.has(i))))
    : [];
  if (interests.length > INTERESTS.size) return { ok: false, error: "invalid_interests" };

  const device = String(raw.device || "").toLowerCase();
  if (!DEVICES.has(device)) return { ok: false, error: "invalid_device" };

  const source = String(raw.source || "aniccaai.com/lm/newsletter").slice(0, 120);
  const receipt = crypto.randomBytes(8).toString("hex");

  return {
    ok: true,
    record: {
      receipt,
      email,
      email_hash: emailHash(email),
      lang,
      interests,
      device,
      source,
      created_at: new Date().toISOString(),
    },
  };
}

async function saveToSupabase(record) {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return "not_configured";
  try {
    const response = await fetch(`${url}/rest/v1/lm_newsletter_subscribers`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        email: record.email,
        lang: record.lang,
        interests: record.interests,
        device: record.device,
        source: record.source,
        receipt: record.receipt,
        created_at: record.created_at,
      }),
    });
    if (response.ok) return "ok";
    // PostgREST answers 404 / PGRST205 until the migration has been applied.
    if (response.status === 404) return "table_missing";
    return "error";
  } catch {
    return "error";
  }
}

function openStore(event, deps = {}) {
  const connect = deps.connectLambda || loadBlobs().connectLambda;
  const getStoreImpl = deps.getStore || loadBlobs().getStore;
  try {
    connect(event);
  } catch {
    /* getStore throws a clearer error if context is missing */
  }
  return getStoreImpl(STORE_NAME);
}

function loadBlobs() {
  // Kept lazy so the pure helpers below can be imported in tests without the package.
  return require("@netlify/blobs");
}

async function saveToBlobs(event, record, deps) {
  try {
    const store = openStore(event, deps);
    const seenKey = `by-email/${record.email_hash}.json`;
    let seen = null;
    try {
      seen = await store.get(seenKey, { type: "json" });
    } catch {
      /* a missing key is expected on the first signup for an address */
    }
    // Key by hash so the store never exposes an address in a key name.
    await store.setJSON(`${PREFIX}${record.email_hash}.json`, {
      receipt: record.receipt,
      email: record.email,
      lang: record.lang,
      interests: record.interests,
      device: record.device,
      source: record.source,
      created_at: record.created_at,
    });
    if (!seen) {
      // Strongly-consistent summary document: `list()` is not, and the public
      // ?action=count check must reflect a write immediately.
      let summary = null;
      try {
        summary = await store.get(SUMMARY_KEY, { type: "json" });
      } catch {
        /* first write */
      }
      await store.setJSON(SUMMARY_KEY, {
        count: Number((summary && summary.count) || 0) + 1,
        updated_at: new Date().toISOString(),
      });
      await store.setJSON(seenKey, { since: record.created_at });
    }
    return { ok: true, duplicate: Boolean(seen) };
  } catch (error) {
    return { ok: false, error: error && error.name ? error.name : "blobs_error" };
  }
}

async function countStored(event, deps) {
  try {
    const store = openStore(event, deps);
    const summary = await store.get(SUMMARY_KEY, { type: "json" });
    if (summary && typeof summary.count === "number") return summary.count;
    const listed = await store.list({ prefix: PREFIX });
    return listed && listed.blobs ? listed.blobs.length : 0;
  } catch {
    return null;
  }
}

function welcomeHtml(lang, email) {
  const body = {
    ja: {
      subject: "登録できました — Life Manager デイリーニュースレター",
      intro: "登録ありがとうございます。次の号から、選んだ言語と興味に合わせた案件が届きます。",
      points: [
        "毎号、報酬額（USD）・所要時間・スマホ可否・必要手順・直リンク付き",
        "締切が近い順に並びます",
        "解除はこのメール下部のリンク1つで完了します",
      ],
      note: "応募はあなたのアカウントで行います。私たちが代わりに応募したり、パスワードを預かったりすることはありません。",
      sign: "— Anicca / Life Manager",
    },
    en: {
      subject: "You're in — Life Manager daily newsletter",
      intro: "Thanks for joining. From the next issue you get the gigs that match your language and interests.",
      points: [
        "USD pay, time needed, phone-OK status, exact steps and a direct link on every card",
        "Sorted by the nearest deadline",
        "One link at the bottom of any email unsubscribes you",
      ],
      note: "You apply with your own account. We never apply for you and never hold your password.",
      sign: "— Anicca / Life Manager",
    },
    es: {
      subject: "Ya estás dentro — boletín diario de Life Manager",
      intro: "Gracias por suscribirte. Desde el próximo número recibirás las ofertas que encajan con tu idioma e intereses.",
      points: [
        "Pago en USD, tiempo, si sirve el móvil, pasos y enlace directo en cada tarjeta",
        "Ordenado por la fecha límite más cercana",
        "Un enlace al pie de cualquier correo te da de baja",
      ],
      note: "Te postulas con tu propia cuenta. Nunca lo hacemos por ti ni guardamos tu contraseña.",
      sign: "— Anicca / Life Manager",
    },
  }[lang] || null;
  if (!body) return null;
  return {
    subject: body.subject,
    html:
      `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.7;color:#18181b">` +
      `<p>${body.intro}</p>` +
      `<ul>${body.points.map((p) => `<li>${p}</li>`).join("")}</ul>` +
      `<p style="color:#52525b">${body.note}</p>` +
      `<p>${body.sign}</p>` +
      `<p style="color:#a1a1aa;font-size:12px">${email}</p>` +
      `</div>`,
  };
}

async function sendWelcome(record) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!apiKey || !from) return "not_configured";
  const mail = welcomeHtml(record.lang, record.email);
  if (!mail) return "skipped";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: record.email, subject: mail.subject, html: mail.html }),
    });
    return response.ok ? "sent" : `failed_${response.status}`;
  } catch {
    return "failed";
  }
}

async function handle(event, deps = {}) {
  if (!event || event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  if (event.httpMethod === "GET") {
    const action = (event.queryStringParameters || {}).action;
    if (action !== "count") return json(400, { ok: false, error: "unknown_action" });
    const count = await countStored(event, deps);
    if (count === null) return json(503, { ok: false, error: "store_unavailable" });
    return json(200, { ok: true, count });
  }

  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const input = parseBody(event);
  // Honeypot: a hidden field real people never fill. Answer 200 and store nothing.
  if (String(input.company || "").trim()) return json(200, { ok: true, receipt: "ignored" });

  const normalized = normalize(input);
  if (!normalized.ok) return json(400, { ok: false, error: normalized.error });
  const record = normalized.record;

  const [supabase, blobs] = await Promise.all([
    saveToSupabase(record),
    saveToBlobs(event, record, deps),
  ]);
  if (supabase !== "ok" && !blobs.ok) {
    return json(503, { ok: false, error: "store_unavailable", supabase, blobs: blobs.error });
  }

  const welcomed = blobs.duplicate ? "skipped_duplicate" : await sendWelcome(record);

  return json(200, {
    ok: true,
    receipt: record.receipt,
    stored: { supabase, blobs: blobs.ok },
    duplicate: Boolean(blobs.duplicate),
    welcome_email: welcomed,
  });
}

exports.handler = (event) => handle(event);
exports.handle = handle;
exports.normalize = normalize;
exports.welcomeHtml = welcomeHtml;
