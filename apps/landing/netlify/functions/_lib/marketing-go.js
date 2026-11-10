const { randomUUID } = require("node:crypto");
const { isAffiliatePlacement } = require("./affiliate-placement");
const POSTHOG_CAPTURE_ENDPOINT = "https://us.i.posthog.com/i/v0/e/";
const POSTHOG_PROJECT_API_KEY = process.env.POSTHOG_PROJECT_API_KEY || "phc_Mw4K3aByYDRuAlfe55u5OYJrTwTcwhPextZjOw8z2nw";

const TOKEN = /^(?:(ai|ho|ej|ee|hl)_[a-z2-7]{20}|af_(elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(?:-experiment-[a-f0-9]{12})?-1))$/; // AFFILIATE_CTA_V1


// Click classification (2026-11-01): count only human clicks as app_store_click.
const BOT_UA = /bot\b|bot\/|crawler|spider|crawl|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|twitterbot|slackbot|slack-imgproxy|discordbot|telegrambot|whatsapp|linkedinbot|bluesky|cardyb|mastodon|pleroma|misskey|akkoma|googlebot|google-inspectiontool|googleother|bingbot|bingpreview|yandex|baiduspider|duckduckbot|applebot|petalbot|embedly|iframely|skypeuripreview|redditbot|pinterest|vkshare|w3c_validator|preview|headless|phantomjs|python|curl\/|wget|go-http-client|okhttp|axios|node-fetch|undici|libwww|java\/|httpclient|postman|insomnia|scrapy|aiohttp|httpx|ahrefs|semrush|mj12bot|dotbot|gptbot|claudebot|perplexity|bytespider|amazonbot|chatgpt|oai-searchbot|uptime|pingdom|statuscake|monitor/i;
const INTERNAL_UA = /aniccacheck/i;
const INTERNAL_IPS = new Set(String(process.env.GO_INTERNAL_IPS || "220.26.108.31,104.28.211.106").split(",").map((v) => v.trim()).filter(Boolean));

function header(event, name) {
  const headers = event.headers || {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? String(headers[key] ?? "") : "";
}

function visitorIp(event) {
  const direct = header(event, "x-nf-client-connection-ip") || header(event, "cf-connecting-ip") || header(event, "x-real-ip");
  if (direct.trim()) return direct.trim();
  return header(event, "x-forwarded-for").split(",")[0].trim();
}

function classifyClick(event, ct) {
  const ua = header(event, "user-agent");
  const ip = visitorIp(event);
  const q = event.queryStringParameters || {};
  if (/^test_/i.test(ct) || q.check === "1") return { trafficClass: "test", reason: "test_ct_or_flag", ua, ip };
  if (INTERNAL_UA.test(ua) || header(event, "x-anicca-check")) return { trafficClass: "internal", reason: "internal_marker", ua, ip };
  if (ip && INTERNAL_IPS.has(ip)) return { trafficClass: "internal", reason: "internal_ip", ua, ip };
  if (event.httpMethod === "HEAD") return { trafficClass: "bot", reason: "head_request", ua, ip };
  if (!ua.trim()) return { trafficClass: "bot", reason: "empty_ua", ua, ip };
  if (BOT_UA.test(ua)) return { trafficClass: "bot", reason: "bot_ua", ua, ip };
  if (header(event, "purpose") === "prefetch" || /prefetch|preview/i.test(header(event, "sec-purpose") || header(event, "x-purpose")))
    return { trafficClass: "bot", reason: "prefetch", ua, ip };
  return { trafficClass: "human", reason: "", ua, ip };
}

function destination(product, token, providerToken) {
  if (product.kind === "affiliate") return `https://try.elevenlabs.io/${product.placementId}`;
  if (product.kind === "capafy")
    return `https://capafy.ai/agent/${product.agentId}?ct=${encodeURIComponent(product.ct)}`;
  if (product.kind === "app") {
    const query = new URLSearchParams({ pt: providerToken, ct: token, mt: "8" });
    return `https://apps.apple.com/app/id${product.appId}?${query}`;
  }
  const query = new URLSearchParams({
    utm_source: "social",
    utm_medium: "owned_redirect",
    utm_campaign: token,
  });
  return `https://aniccaai.com${product.path}?${query}`;
}

function makeSupabasePersist({ url, serviceKey, fetchImpl = fetch }) {
  if (!url || !serviceKey) throw new Error("Supabase receipt storage is not configured");
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/marketing_click_receipts`;
  return async (_key, receipt) => {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(receipt),
    });
    if (!response.ok) throw new Error(`click receipt storage failed: HTTP ${response.status}`);
  };
}

function makePostHogCapture({ apiKey = POSTHOG_PROJECT_API_KEY, fetchImpl = fetch } = {}) {
  return async ({ distinctId, event, properties }) => {
    if (!apiKey) throw new Error("PostHog project token is not configured");
    const response = await fetchImpl(POSTHOG_CAPTURE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, distinct_id: distinctId, event, properties }),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error(`PostHog capture failed: HTTP ${response.status}`);
  };
}

function makeMarketingGoHandler({
  products,
  providerToken,
  persist,
  capturePostHog,
  distinctId = randomUUID,
  now = () => new Date().toISOString(),
  receiptId = randomUUID,
}) {
  if (!products || typeof persist !== "function") // AFFILIATE_CTA_V2
    throw new Error("marketing-go dependencies are required");
  return async (event) => {
    const token = decodeURIComponent(String(event.path || "").split("/").filter(Boolean).at(-1) || "");
    const appProduct = Object.values(products).find(
      (product) => product.kind === "app" && product.slug === token,
    );
    if (event.httpMethod !== "GET" && !(appProduct && event.httpMethod === "HEAD"))
      return { statusCode: 405, headers: { allow: "GET" }, body: "Method Not Allowed" };
    if (appProduct) {
      const ct = String(event.queryStringParameters?.ct ?? "");
      if (!ct.trim())
        return { statusCode: 400, headers: { "cache-control": "no-store" }, body: "Campaign token required" };
      const configuredProviderToken = appProduct.providerToken || providerToken;
      if (!configuredProviderToken || typeof capturePostHog !== "function")
        return { statusCode: 503, headers: { "cache-control": "no-store" }, body: "Attribution unavailable" };
      const click = classifyClick(event, ct);
      const human = click.trafficClass === "human";
      console.log(`go-click ct=${ct} class=${click.trafficClass} reason=${click.reason || "-"} ip=${click.ip || "-"} method=${event.httpMethod} ua=${JSON.stringify(click.ua.slice(0, 200))}`);
      try {
        await capturePostHog({
          distinctId: distinctId(),
          event: human ? "app_store_click" : "app_store_click_nonhuman",
          properties: {
            app: appProduct.slug,
            ct,
            pt: configuredProviderToken,
            source: "web_redirect",
            human,
            traffic_class: click.trafficClass,
            bot_reason: click.reason,
            visitor_ip: click.ip,
            user_agent: click.ua.slice(0, 400),
            http_method: event.httpMethod,
            referrer: header(event, "referer").slice(0, 300),
            ...(click.ip && { $ip: click.ip }),
            ...(click.ua && { $raw_user_agent: click.ua.slice(0, 400) }),
            "$process_person_profile": false,
          },
        });
      } catch {
        return { statusCode: 503, headers: { "cache-control": "no-store" }, body: "Attribution unavailable" };
      }
      const location = new URL(`https://apps.apple.com/app/id${appProduct.appId}`);
      location.searchParams.set("ct", ct);
      location.searchParams.set("pt", configuredProviderToken);
      location.searchParams.set("mt", appProduct.mediaType || "8");
      return { statusCode: 302, headers: { location: location.toString(), "cache-control": "no-store" }, body: "" };
    }
    const match = TOKEN.exec(token);
    const product = match && (!match[2] || isAffiliatePlacement(match[2])) && (match[2]
      ? { productId: match[2], kind: "affiliate", placementId: match[2] }
      : products[match[1]]);
    if (!product)
      return { statusCode: 404, headers: { "cache-control": "no-store" }, body: "Not Found" };
    if (product.kind === "app" && !providerToken)
      return { statusCode: 503, headers: { "cache-control": "no-store" }, body: "Attribution unavailable" };
    if (event.queryStringParameters?.diagnostic === "1")
      return { statusCode: 204, headers: { "cache-control": "no-store" }, body: "" };
    const id = receiptId();
    const receipt = {
      schema_version: 1,
      receipt_id: id,
      campaign_token: token,
      product_id: product.productId,
      clicked_at: now(),
    };
    let stored = true;
    try {
      await persist(`clicks/${id}`, receipt);
    } catch (error) {
      // Affiliate attribution is owned by PartnerStack; a lost receipt must not block the click.
      if (product.kind !== "affiliate") return {
        statusCode: 503,
        headers: { "cache-control": "no-store", "retry-after": "60" },
        body: "Click receipt unavailable",
      };
      stored = false;
      console.error(`marketing-go affiliate receipt failed token=${token}: ${error.message}`);
    }
    return {
      statusCode: 302,
      headers: {
        location: destination(product, token, providerToken),
        "cache-control": "no-store",
        ...(stored && { "x-click-receipt": id }),
      },
      body: "",
    };
  };
}

module.exports = { TOKEN, classifyClick, visitorIp, destination, makeMarketingGoHandler, makePostHogCapture, makeSupabasePersist };
