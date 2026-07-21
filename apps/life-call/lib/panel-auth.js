// LM-33a: Telegram /panel one-time token and browser session helpers.
"use strict";

const crypto = require("crypto");
const { renderPanelPage } = require("./panel-ui.js");

const PANEL_TOKEN_TTL_MS = 5 * 60 * 1000;
const PANEL_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const OPAQUE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function supabaseHeaders(supaKey, prefer) {
  return {
    apikey: supaKey,
    Authorization: `Bearer ${supaKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function createPanelToken({ uid, chatId }, opts = {}) {
  const randomBytes = opts.randomBytes || crypto.randomBytes;
  const now = opts.now ? opts.now() : new Date();
  const token = randomBytes(32).toString("base64url");
  const row = {
    token_hash: sha256(token),
    uid,
    chat_id: String(chatId),
    expires_at: new Date(now.getTime() + PANEL_TOKEN_TTL_MS).toISOString(),
  };
  const response = await (opts.fetchImpl || fetch)(`${opts.supaUrl}/rest/v1/lm_panel_tokens`, {
    method: "POST",
    headers: supabaseHeaders(opts.supaKey, "return=minimal"),
    body: JSON.stringify(row),
  });
  if (!response.ok) throw new Error(`panel token insert failed (${response.status})`);
  const base = String(opts.panelBaseUrl || "").replace(/\/$/, "");
  return { token, url: `${base}/panel?t=${encodeURIComponent(token)}` };
}

async function sendPanelLink({ uid, chatId }, opts = {}) {
  const result = await createPanelToken({ uid, chatId }, opts);
  const sender = opts.sendMessage || require("./telegram.js").sendMessage;
  const sent = await sender(
    opts.token,
    chatId,
    "Open your Anicca Life Manager dashboard. The button expires in 5 minutes and works once.",
    { reply_markup: { inline_keyboard: [[{ text: "Open dashboard", url: result.url }]] } },
  );
  if (sent && sent.ok === false && opts.clickableFallback !== false) {
    await sender(opts.token, chatId, `<a href="${result.url}">Open dashboard</a> (expires in 5 minutes; works once)`);
  }
  return result;
}

async function claimPanelToken(token, opts = {}) {
  if (!OPAQUE_TOKEN_RE.test(String(token || ""))) return null;
  const response = await (opts.fetchImpl || fetch)(`${opts.supaUrl}/rest/v1/rpc/claim_lm_panel_token`, {
    method: "POST",
    headers: supabaseHeaders(opts.supaKey),
    body: JSON.stringify({ p_token_hash: sha256(token) }),
  });
  if (!response.ok) throw new Error(`panel token claim failed (${response.status})`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function createPanelSession({ uid, chatId }, opts = {}) {
  const randomBytes = opts.randomBytes || crypto.randomBytes;
  const now = opts.now ? opts.now() : new Date();
  const session = randomBytes(32).toString("base64url");
  const response = await (opts.fetchImpl || fetch)(`${opts.supaUrl}/rest/v1/lm_panel_sessions`, {
    method: "POST",
    headers: supabaseHeaders(opts.supaKey, "return=minimal"),
    body: JSON.stringify({
      session_hash: sha256(session),
      uid,
      chat_id: String(chatId),
      expires_at: new Date(now.getTime() + PANEL_SESSION_TTL_MS).toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`panel session insert failed (${response.status})`);
  return session;
}

function cookieValue(header, name) {
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index === -1 || part.slice(0, index).trim() !== name) continue;
    return part.slice(index + 1).trim();
  }
  return "";
}

async function sessionScope(session, opts = {}) {
  if (!OPAQUE_TOKEN_RE.test(String(session || ""))) return null;
  const now = opts.now ? opts.now() : new Date();
  const query = new URLSearchParams({
    session_hash: `eq.${sha256(session)}`,
    expires_at: `gt.${now.toISOString()}`,
    select: "uid,chat_id",
    limit: "1",
  });
  const response = await (opts.fetchImpl || fetch)(`${opts.supaUrl}/rest/v1/lm_panel_sessions?${query}`, {
    headers: supabaseHeaders(opts.supaKey),
  });
  if (!response.ok) throw new Error(`panel session lookup failed (${response.status})`);
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows[0] && rows[0].uid && rows[0].chat_id
    ? { uid: String(rows[0].uid), chatId: String(rows[0].chat_id) } : null;
}

async function sessionUid(session, opts = {}) {
  const scope = await sessionScope(session, opts);
  return scope && scope.uid;
}

function csrfToken(session) {
  return OPAQUE_TOKEN_RE.test(String(session || "")) ? sha256(`${session}:panel-csrf`) : "";
}

function renderInvalidPanelLink(botUsername) {
  const username = /^[A-Za-z0-9_]{5,32}$/.test(String(botUsername || "")) ? botUsername : "LifeManagerBotbot";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Dashboard link expired</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3efe5;color:#122238;font-family:Avenir,"Hiragino Sans",sans-serif}.card{width:min(32rem,calc(100% - 40px));border:1px solid #9d9484;background:#fbf8f0;padding:32px;box-shadow:0 24px 70px rgba(38,35,30,.12)}h1{font-family:"Iowan Old Style",serif;font-weight:500}a{display:inline-flex;min-height:44px;align-items:center;margin-top:12px;padding:0 18px;background:#122238;color:white;text-decoration:none}</style></head><body><main class="card"><h1>This dashboard link is no longer available.</h1><p>For your security, each link works once and expires after five minutes.</p><a href="https://t.me/${username}?start=panel">Get a new dashboard link</a></main></body></html>`;
}

async function handlePanelRequest(req, res, opts = {}) {
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end("method not allowed");
    return;
  }
  const query = new URL(req.url || "/panel", "http://panel.local").searchParams;
  const token = query.get("t");
  if (!token) {
    const session = cookieValue(req.headers.cookie, "lm_panel_session");
    const scope = await sessionScope(session, opts);
    if (!scope) {
      res.writeHead(401, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      res.end("unauthorized");
      return;
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(renderPanelPage());
    return;
  }

  const claimed = await claimPanelToken(token, opts);
  if (!claimed) {
    res.writeHead(403, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" });
    res.end(renderInvalidPanelLink(opts.botUsername || process.env.LM_TELEGRAM_BOT_USERNAME));
    return;
  }
  const session = await createPanelSession({ uid: claimed.uid, chatId: claimed.chat_id }, opts);
  res.writeHead(303, {
    Location: "/panel",
    "Set-Cookie": `lm_panel_session=${session}; Max-Age=86400; Path=/; HttpOnly; Secure; SameSite=Lax`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  });
  res.end();
}

module.exports = {
  PANEL_TOKEN_TTL_MS,
  PANEL_SESSION_TTL_MS,
  sha256,
  createPanelToken,
  sendPanelLink,
  claimPanelToken,
  createPanelSession,
  cookieValue,
  csrfToken,
  sessionScope,
  sessionUid,
  handlePanelRequest,
};
