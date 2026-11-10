"use strict";

const http = require("node:http");
const test = require("node:test");
const assert = require("node:assert/strict");
const { eventRawQuery, proxyCloudAuthCallback, startCloudGoogleAuth } = require("../lm-cloud-auth-start");

const PREVIEW = "https://preview--anicca2.netlify.app";
const UPSTREAM = "https://life-call-production.up.railway.app";

function headers(extra) {
  return {
    "x-forwarded-host": "preview--anicca2.netlify.app",
    "x-forwarded-proto": "https",
    ...extra,
  };
}

function response({ status = 302, location = "", cookies = [] } = {}) {
  return {
    status,
    headers: {
      get(name) {
        return String(name).toLowerCase() === "location" ? location : null;
      },
      getSetCookie() {
        return cookies;
      },
    },
  };
}

function authorizeLocation(redirectTo) {
  const url = new URL("https://cycgdwndgfgdbnndithc.supabase.co/auth/v1/authorize");
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("scopes", "openid email profile");
  url.searchParams.set("code_challenge", "challenge-value");
  url.searchParams.set("code_challenge_method", "s256");
  return url.toString();
}

test("Google start rewrites redirect_to onto the preview origin and keeps the PKCE challenge", async () => {
  const calls = [];
  const result = await startCloudGoogleAuth({
    headers: headers(),
    rawQuery: "",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return response({
        location: authorizeLocation(`${UPSTREAM}/auth/google/callback`),
        cookies: ["lm-web-auth-code-verifier=pkce-verifier; Path=/; HttpOnly; Secure; SameSite=Lax"],
      });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${UPSTREAM}/auth/google`);
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(result.statusCode, 302);
  const location = new URL(result.headers.location);
  assert.equal(location.origin, "https://cycgdwndgfgdbnndithc.supabase.co");
  assert.equal(location.pathname, "/auth/v1/authorize");
  assert.equal(location.searchParams.get("redirect_to"), `${PREVIEW}/auth/google/callback`);
  assert.equal(location.searchParams.get("code_challenge"), "challenge-value");
  assert.deepEqual(result.cookies, [
    "lm-web-auth-code-verifier=pkce-verifier; Path=/; HttpOnly; Secure; SameSite=Lax",
    "lm-web-auth-intent=; Max-Age=0; Path=/auth/google/callback; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
  ]);
});

test("Cloud intent is removed from the Railway request and stored for the same-origin callback", async () => {
  let called = "";
  const result = await startCloudGoogleAuth({
    headers: headers({ cookie: "existing=1" }),
    rawQuery: "intent=maritime_cloud&lang=ja&utm_source=anicca",
    fetchImpl: async (url, init) => {
      called = String(url);
      assert.equal(init.headers.cookie, "existing=1");
      return response({
        location: authorizeLocation(`${UPSTREAM}/auth/google/callback`),
        cookies: [
          "lm-web-auth-code-verifier=pkce-verifier; Path=/; HttpOnly; Secure",
          "lm-web-auth-intent=; Max-Age=0; Path=/auth/google/callback",
        ],
      });
    },
  });

  const upstream = new URL(called);
  assert.equal(upstream.origin + upstream.pathname, `${UPSTREAM}/auth/google`);
  assert.equal(upstream.searchParams.get("utm_source"), "anicca");
  assert.equal(upstream.searchParams.has("intent"), false);
  assert.equal(upstream.searchParams.has("lang"), false);
  const location = new URL(result.headers.location);
  assert.equal(location.searchParams.get("redirect_to"), `${PREVIEW}/auth/google/callback`);
  assert.equal(
    result.cookies.at(-1),
    "lm-web-auth-intent=maritime_cloud-ja; Path=/auth/google/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax",
  );
  assert.equal(result.cookies.some((cookie) => cookie.startsWith("lm-web-auth-intent=;")), false);
});

test("a Cloud start that cannot reach Google returns to the localized Cloud page", async () => {
  const result = await startCloudGoogleAuth({
    headers: headers(),
    rawQuery: "intent=maritime_cloud&lang=en",
    fetchImpl: async (url) => {
      assert.equal(new URL(url).searchParams.has("intent"), false);
      return response({ location: "/lm?auth_error=connection" });
    },
  });

  assert.equal(result.statusCode, 302);
  assert.equal(result.headers.location, "/maritime?auth_error=connection&lang=en");
});

test("a Netlify event without rawQuery still keeps repeated Cloud parameters", () => {
  assert.equal(eventRawQuery({
    multiValueQueryStringParameters: {
      intent: ["maritime_cloud"],
      lang: ["en"],
      utm_source: ["anicca", "second"],
    },
  }), "intent=maritime_cloud&lang=en&utm_source=anicca&utm_source=second");
  assert.equal(eventRawQuery({ rawQuery: "intent=maritime_cloud&lang=ja" }), "intent=maritime_cloud&lang=ja");
});

test("an untrusted host does not call Railway", async () => {
  let called = false;
  const result = await startCloudGoogleAuth({
    headers: { host: "evil.example", "x-forwarded-proto": "https" },
    rawQuery: "intent=maritime_cloud&lang=en",
    fetchImpl: async () => {
      called = true;
      return response();
    },
  });

  assert.equal(called, false);
  assert.equal(result.statusCode, 400);
});

const SESSION_COOKIES = [
  "lm-web-auth.0=session-part-0; Path=/; HttpOnly; Secure; SameSite=Lax",
  "lm-web-auth.1=session-part-1; Path=/; HttpOnly; Secure; SameSite=Lax",
];

function browserCookieHeader(setCookies) {
  const jar = new Map();
  for (const cookie of setCookies) {
    const [pair] = String(cookie).split(";");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (/max-age=0/i.test(cookie) || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

// Life Manager renders the consent checkbox only after resolveMaritimeManagerUser
// returns a session user. verified=1 alone stays on Continue with Google.
// Source: Daisuke134/life-manager apps/life-manager/lib/maritime-distribution.js
function maritimePage(cookieHeader) {
  const cookie = String(cookieHeader || "");
  const signedIn = /(?:^|;\s*)lm-web-auth\.0=session-part-0(?:;|$)/.test(cookie)
    && /(?:^|;\s*)lm-web-auth\.1=session-part-1(?:;|$)/.test(cookie);
  if (!signedIn) {
    return "<!doctype html><html lang=\"en\"><title>Life Manager Cloud</title><main><h1>Life Manager Cloud gets your work moving.</h1><a class=\"signin\" id=\"google-signin\" href=\"/auth/google?intent=maritime_cloud&lang=en\">Continue with Google</a></main></html>";
  }
  return "<!doctype html><html lang=\"en\"><title>Life Manager Cloud</title><main><h1>Life Manager Cloud gets your work moving.</h1><p>Verified email: <strong>verified@example.test</strong></p><label class=\"consent\"><input id=\"consent\" type=\"checkbox\">I have read the data-retention terms.</label><button type=\"button\" data-action=\"activate\" disabled>Start Life Manager Cloud</button></main></html>";
}

test("callback keeps chunked session cookies and rewrites an absolute Railway redirect onto this origin", async () => {
  let forwarded = "";
  const result = await proxyCloudAuthCallback({
    headers: { cookie: "lm-web-auth-code-verifier=pkce-verifier; lm-web-auth-intent=maritime_cloud-en" },
    rawQuery: "code=ok",
    fetchImpl: async (url, init) => {
      forwarded = `${url} cookie=${init.headers.cookie}`;
      assert.equal(init.redirect, "manual");
      return response({
        location: `${UPSTREAM}/maritime?lang=en&verified=1`,
        cookies: [
          ...SESSION_COOKIES,
          "lm-web-auth-code-verifier=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
          "lm-web-auth-intent=; Max-Age=0; Path=/auth/google/callback; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
        ],
      });
    },
  });

  assert.equal(forwarded, `${UPSTREAM}/auth/google/callback?code=ok cookie=lm-web-auth-code-verifier=pkce-verifier; lm-web-auth-intent=maritime_cloud-en`);
  assert.equal(result.statusCode, 302);
  assert.equal(result.headers.location, "/maritime?lang=en&verified=1");
  assert.deepEqual(result.cookies.slice(0, 2), SESSION_COOKIES);
  assert.equal(browserCookieHeader(result.cookies), "lm-web-auth.0=session-part-0; lm-web-auth.1=session-part-1");
});

test("callback forwards Railway's relative failure redirect and every cleared cookie", async () => {
  const result = await proxyCloudAuthCallback({
    headers: { cookie: "lm-web-auth-code-verifier=pkce-verifier; lm-web-auth-intent=maritime_cloud-en" },
    rawQuery: "code=not-a-real-code",
    fetchImpl: async () => response({
      location: "/maritime?auth_error=connection&lang=en",
      cookies: [
        "lm-web-auth-code-verifier=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
        "lm-web-auth-intent=; Max-Age=0; Path=/auth/google/callback; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
      ],
    }),
  });

  assert.equal(result.statusCode, 302);
  assert.equal(result.headers.location, "/maritime?auth_error=connection&lang=en");
  assert.equal(result.cookies.length, 2);
});

test("callback does not follow a Location outside Railway", async () => {
  const result = await proxyCloudAuthCallback({
    headers: {},
    rawQuery: "code=ok",
    fetchImpl: async () => response({
      location: "https://evil.example/maritime?lang=en&verified=1",
      cookies: SESSION_COOKIES,
    }),
  });

  assert.equal(result.statusCode, 302);
  assert.equal(result.headers.location, "/lm?auth_error=connection");
  assert.deepEqual(result.cookies, SESSION_COOKIES);
});

test("a callback session cookie is replayed and /maritime?lang=en&verified=1 shows the consent UI", async () => {
  const seen = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    seen.push({ path: url.pathname, cookie: req.headers.cookie || "" });
    if (url.pathname === "/auth/google/callback") {
      res.statusCode = 302;
      res.setHeader("location", `${UPSTREAM}/maritime?lang=en&verified=1`);
      res.setHeader("set-cookie", [
        ...SESSION_COOKIES,
        "lm-web-auth-code-verifier=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
      ]);
      res.end();
      return;
    }
    if (url.pathname === "/maritime") {
      const html = maritimePage(req.headers.cookie);
      res.statusCode = 200;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("vary", "Cookie");
      res.end(html);
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const anonymous = await fetch(`${origin}/maritime?lang=en&verified=1`);
    const anonymousHtml = await anonymous.text();
    assert.match(anonymousHtml, /id="google-signin"/);
    assert.doesNotMatch(anonymousHtml, /id="consent"/);

    const callback = await proxyCloudAuthCallback({
      headers: { cookie: "lm-web-auth-code-verifier=pkce-verifier; lm-web-auth-intent=maritime_cloud-en" },
      rawQuery: "code=ok&lang=en",
      upstreamOrigin: origin,
    });
    assert.equal(callback.headers.location, "/maritime?lang=en&verified=1");
    assert.deepEqual(callback.cookies.slice(0, 2), SESSION_COOKIES);
    const jar = browserCookieHeader(callback.cookies);
    const signedIn = await fetch(`${origin}/maritime?lang=en&verified=1`, { headers: { cookie: jar } });
    const html = await signedIn.text();
    assert.equal(signedIn.status, 200);
    assert.match(html, /id="consent"/);
    assert.match(html, /data-action="activate"/);
    assert.match(html, /Start Life Manager Cloud/);
    assert.match(html, /Verified email/);
    assert.doesNotMatch(html, /id="google-signin"/);
    assert.equal(seen[0].path, "/maritime");
    assert.match(seen[1].cookie, /lm-web-auth-code-verifier=pkce-verifier/);
    assert.match(seen[2].cookie, /lm-web-auth\.0=session-part-0/);
    assert.match(seen[2].cookie, /lm-web-auth\.1=session-part-1/);
    assert.doesNotMatch(seen[2].cookie, /lm-web-auth-code-verifier=/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
