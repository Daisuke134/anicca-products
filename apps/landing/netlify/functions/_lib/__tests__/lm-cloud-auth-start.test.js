"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { eventRawQuery, startCloudGoogleAuth } = require("../lm-cloud-auth-start");

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
