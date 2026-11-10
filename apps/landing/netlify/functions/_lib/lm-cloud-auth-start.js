"use strict";

// Railway's web-auth.js binds redirect_to to LM_MARITIME_WEB_ORIGIN or the panel/Railway
// origin and ignores the browser host. A direct Netlify proxy therefore sends Google
// back to Railway. This starter still lets Railway issue the PKCE verifier, then rewrites
// only the Supabase redirect_to onto the site that received the request.
const UPSTREAM_ORIGIN = "https://life-call-production.up.railway.app";
const SUPABASE_ORIGIN = "https://cycgdwndgfgdbnndithc.supabase.co";
const INTENT_CLEAR = "lm-web-auth-intent=; Max-Age=0; Path=/auth/google/callback; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax";

function headerValue(headers, name) {
  if (!headers || typeof headers !== "object") return "";
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() !== target) continue;
    const raw = Array.isArray(value) ? value[0] : value;
    return String(raw || "").split(",")[0].trim();
  }
  return "";
}

function hostKind(host) {
  const hostname = String(host || "").split(":")[0].toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return "local";
  if (hostname === "aniccaai.com" || hostname === "www.aniccaai.com") return "public";
  if (hostname === "anicca2.netlify.app" || hostname.endsWith("--anicca2.netlify.app")) return "public";
  return "";
}

function requestOrigin(headers) {
  const host = headerValue(headers, "x-forwarded-host") || headerValue(headers, "host");
  const kind = hostKind(host);
  if (!kind) return "";
  if (kind === "local") {
    const proto = headerValue(headers, "x-forwarded-proto") || "http";
    if (proto !== "http" && proto !== "https") return "";
    return `${proto}://${host}`;
  }
  return `https://${host}`;
}

function cloudIntent(rawQuery) {
  const query = new URLSearchParams(rawQuery || "");
  const intents = query.getAll("intent");
  const languages = query.getAll("lang");
  if (intents.length !== 1 || intents[0] !== "maritime_cloud" || languages.length > 1) return null;
  const language = String(languages[0] || "en").toLowerCase();
  if (language !== "en" && language !== "ja") return null;
  return { value: `maritime_cloud-${language}`, language };
}

function upstreamAuthUrl(rawQuery) {
  const incoming = new URLSearchParams(rawQuery || "");
  const forwarded = new URLSearchParams();
  for (const [key, value] of incoming) {
    if (key === "intent" || key === "lang") continue;
    forwarded.append(key, value);
  }
  const url = new URL("/auth/google", UPSTREAM_ORIGIN);
  const search = forwarded.toString();
  if (search) url.search = search;
  return url;
}

function rewriteAuthorizeLocation(location, origin) {
  let url;
  try { url = new URL(location); } catch { return ""; }
  if (url.origin !== SUPABASE_ORIGIN || url.pathname !== "/auth/v1/authorize") return "";
  if (url.searchParams.get("provider") !== "google") return "";
  url.searchParams.set("redirect_to", new URL("/auth/google/callback", origin).toString());
  return url.toString();
}

function setCookiesFrom(response) {
  const headers = response && response.headers;
  if (!headers) return [];
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie().map((cookie) => String(cookie || "")).filter(Boolean);
  }
  if (typeof headers.get !== "function") return [];
  const raw = headers.get("set-cookie");
  return raw ? [String(raw)] : [];
}

function cookiesFor(upstreamCookies, intent) {
  const cookies = upstreamCookies.filter((cookie) => !/^\s*lm-web-auth-intent=/i.test(cookie));
  cookies.push(intent
    ? `lm-web-auth-intent=${intent.value}; Path=/auth/google/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`
    : INTENT_CLEAR);
  return cookies;
}

function cloudFailureLocation(intent) {
  return intent
    ? `/maritime?auth_error=connection&lang=${intent.language}`
    : "/lm?auth_error=connection";
}

function responseHeaders(location) {
  return {
    location,
    "cache-control": "no-store",
    "x-robots-tag": "noindex",
  };
}

function resolveCallbackOrigin(explicit) {
  if (!explicit) return UPSTREAM_ORIGIN;
  let url;
  try { url = new URL(explicit); } catch { return ""; }
  const loopback = url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  if (loopback || url.origin === UPSTREAM_ORIGIN) return url.origin;
  return "";
}

function sameOriginLocation(location) {
  if (!location) return "";
  if (location.startsWith("/") && !location.startsWith("//")) return location;
  let url;
  try { url = new URL(location); } catch { return ""; }
  if (url.origin !== UPSTREAM_ORIGIN) return "";
  return `${url.pathname}${url.search}${url.hash}`;
}

function upstreamHeader(upstream, name) {
  const headers = upstream && upstream.headers;
  if (!headers || typeof headers.get !== "function") return "";
  return String(headers.get(name) || "");
}

// Railway's callback stores the Supabase session in one or more Set-Cookie
// headers and redirects to /maritime. An absolute Railway Location would leave
// the preview host that just stored that cookie, so the next request would be
// anonymous and the consent checkbox would not render.
async function proxyCloudAuthCallback({ headers, rawQuery, fetchImpl, upstreamOrigin }) {
  const origin = resolveCallbackOrigin(upstreamOrigin);
  let target;
  try { target = origin ? new URL("/auth/google/callback", origin) : null; } catch { target = null; }
  if (!target || (target.protocol !== "https:" && target.protocol !== "http:")) {
    return {
      statusCode: 502,
      headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      cookies: [],
      body: "callback upstream unavailable",
    };
  }
  const query = String(rawQuery || "");
  if (query) target.search = query.startsWith("?") ? query : `?${query}`;

  const fetch = fetchImpl || globalThis.fetch;
  let upstream;
  try {
    const cookie = headerValue(headers, "cookie");
    upstream = await fetch(target, {
      method: "GET",
      redirect: "manual",
      headers: {
        accept: "*/*",
        ...(cookie ? { cookie } : {}),
      },
    });
  } catch {
    return {
      statusCode: 302,
      headers: responseHeaders("/lm?auth_error=connection"),
      cookies: [],
      body: "",
    };
  }

  const status = Number(upstream && upstream.status) || 502;
  const cookies = setCookiesFrom(upstream);
  if (status >= 300 && status < 400) {
    const location = sameOriginLocation(upstreamHeader(upstream, "location")) || "/lm?auth_error=connection";
    return { statusCode: status, headers: responseHeaders(location), cookies, body: "" };
  }
  const allow = upstreamHeader(upstream, "allow");
  return {
    statusCode: status,
    headers: {
      "cache-control": "no-store",
      ...(allow ? { allow } : {}),
    },
    cookies,
    body: "",
  };
}

function failureResult(intent, upstreamCookies) {
  return {
    statusCode: 302,
    headers: responseHeaders(cloudFailureLocation(intent)),
    cookies: cookiesFor(upstreamCookies || [], intent),
    body: "",
  };
}

function eventRawQuery(event) {
  if (event && typeof event.rawQuery === "string" && event.rawQuery) return event.rawQuery;
  const multi = event && event.multiValueQueryStringParameters;
  if (!multi || typeof multi !== "object") return "";
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(multi)) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value != null) params.append(key, String(value));
    }
  }
  return params.toString();
}

async function startCloudGoogleAuth({ headers, rawQuery, fetchImpl }) {
  const origin = requestOrigin(headers);
  const intent = cloudIntent(rawQuery);
  if (!origin) {
    return {
      statusCode: 400,
      headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      cookies: [],
      body: "public origin unavailable",
    };
  }

  const fetch = fetchImpl || globalThis.fetch;
  let upstream;
  try {
    const cookie = headerValue(headers, "cookie");
    upstream = await fetch(upstreamAuthUrl(rawQuery), {
      method: "GET",
      redirect: "manual",
      headers: {
        accept: "*/*",
        ...(cookie ? { cookie } : {}),
      },
    });
  } catch {
    return failureResult(intent);
  }

  const location = upstream && upstream.headers && typeof upstream.headers.get === "function"
    ? String(upstream.headers.get("location") || "")
    : "";
  const cookies = cookiesFor(setCookiesFrom(upstream), intent);
  const rewritten = rewriteAuthorizeLocation(location, origin);
  if (rewritten) {
    return { statusCode: 302, headers: responseHeaders(rewritten), cookies, body: "" };
  }
  if (location.startsWith("/")) {
    const sameSite = intent && /^\/lm\?auth_error=connection(?:&|$)/.test(location)
      ? cloudFailureLocation(intent)
      : location;
    return {
      statusCode: upstream.status || 302,
      headers: responseHeaders(sameSite),
      cookies,
      body: "",
    };
  }
  return failureResult(intent, setCookiesFrom(upstream));
}

module.exports = {
  eventRawQuery,
  proxyCloudAuthCallback,
  startCloudGoogleAuth,
};
