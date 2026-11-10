// Fast cached proxy for the RapidAPI listing "App Store Top Charts JP & Global".
// RapidAPI base URL -> https://aniccaai.com/apple-rss
// Paths mirror Apple RSS: /apple-rss/api/v2/{country}/apps/{feed}/{limit}/apps.json
// (a path without the api/v2 prefix, e.g. /apple-rss/jp/apps/top-free/10/apps.json, also works).
// Auth: X-RapidAPI-Proxy-Secret must equal env RAPIDAPI_PROXY_SECRET (fail closed if unset).
const UPSTREAM = 'https://rss.marketingtools.apple.com';
const TTL_MS = 15 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;
import { getStore } from '@netlify/blobs';
function store() { try { return getStore('apple-rss-cache'); } catch { return null; } }
const cache = new Map(); // key -> { body, status, type, at }

export function upstreamPath(pathname) {
  let p = pathname.replace(/^\/apple-rss/, '').replace(/^\/\.netlify\/functions\/rapidapi-apple-rss/, '');
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.startsWith('/api/v2/')) p = '/api/v2' + p;
  if (!/^\/api\/v2\/[a-z]{2}\/[a-z-]+\/[a-z-]+\/\d{1,3}\/[a-z-]+\.(json|rss|atom)$/i.test(p)) return null;
  return p;
}

function reply(body, status, type, cacheState) {
  const h = { 'content-type': type, 'x-proxy-cache': cacheState, 'access-control-allow-origin': '*' };
  if (status === 200) {
    h['cache-control'] = 'public, max-age=300';
    h['netlify-cdn-cache-control'] = 'public, s-maxage=900, stale-while-revalidate=86400, durable';
    h['netlify-vary'] = 'header=X-RapidAPI-Proxy-Secret';
  } else {
    h['cache-control'] = 'no-store';
  }
  return new Response(body, { status, headers: h });
}

export async function fetchUpstream(path) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(UPSTREAM + path, { signal: ctl.signal, headers: { accept: 'application/json' } });
    const body = await r.text();
    const type = r.headers.get('content-type') || 'application/json';
    if (!r.ok) return { ok: false, status: r.status, body, type };
    const entry = { body, type, at: Date.now() };
    cache.set(path, entry);
    try { await store()?.setJSON(path, entry); } catch {}
    return { ok: true, ...entry };
  } finally { clearTimeout(t); }
}

export default async (req, ctx) => {
  const secret = process.env.RAPIDAPI_PROXY_SECRET;
  const got = req.headers.get('x-rapidapi-proxy-secret');
  if (!secret) return reply(JSON.stringify({ error: 'proxy not configured' }), 503, 'application/json', 'none');
  if (got !== secret) return reply(JSON.stringify({ error: 'forbidden' }), 403, 'application/json', 'none');
  const url = new URL(req.url);
  const path = upstreamPath(url.pathname);
  if (!path) return reply(JSON.stringify({ error: 'bad path; use /api/v2/{country}/apps/{feed}/{limit}/apps.json' }), 400, 'application/json', 'none');
  const hit = cache.get(path);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) return reply(hit.body, 200, hit.type, 'hit');
  let blob = null;
  if (!hit) {
    try { blob = await store()?.get(path, { type: 'json' }); } catch {}
    if (blob) cache.set(path, blob);
  }
  const cached = hit || blob;
  if (cached && now - cached.at < TTL_MS) return reply(cached.body, 200, cached.type, 'blob');
  if (cached && now - cached.at < STALE_MS) {
    const p = fetchUpstream(path).catch(() => {});
    if (ctx?.waitUntil) ctx.waitUntil(p);
    return reply(cached.body, 200, cached.type, 'stale');
  }
  try {
    const r = await fetchUpstream(path);
    if (r.ok) return reply(r.body, 200, r.type, 'miss');
    return reply(r.body, r.status, r.type, 'miss');
  } catch {
    return reply(JSON.stringify({ error: 'upstream timeout' }), 504, 'application/json', 'none');
  }
};

export const config = { path: ['/apple-rss/*', '/.netlify/functions/rapidapi-apple-rss/*'] };
