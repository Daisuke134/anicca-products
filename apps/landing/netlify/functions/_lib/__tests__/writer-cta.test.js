"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { makeWriterCtaHandler, attributionRef } = require("../writer-cta");

const query = {
  product_id: "anicca",
  run_id: "20260919-025451",
  artifact_id: "article-ja",
  variant_id: "ai-editing-flow",
  click_id: "20260919-025451-article-ja",
};
const id = "123e4567-e89b-12d3-a456-426614174000";

test("writer CTA persists a reduced receipt and redirects with a deterministic Telegram ref", async () => {
  const rows = [];
  const handler = makeWriterCtaHandler({
    persist: async (row) => rows.push(row),
    receiptId: () => id,
    now: () => "2026-09-19T04:00:00.000Z",
  });
  const ref = attributionRef(query);
  const response = await handler({ httpMethod: "GET", queryStringParameters: query });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "https://t.me/LifeManagerBotbot?start=wr_" + ref);
  assert.match(ref, /^[0-9a-f]{32}$/);
  assert.deepEqual(rows, [{
    schema_version: 1,
    receipt_id: id,
    campaign_token: ["writer", "v2", ref, query.run_id, query.artifact_id, query.variant_id, query.click_id].join(":"),
    product_id: "writer:anicca",
    clicked_at: "2026-09-19T04:00:00.000Z",
  }]);
});

test("writer CTA keeps redirecting when persistence is unavailable", async () => {
  const handler = makeWriterCtaHandler({
    persist: async () => { throw new Error("db"); },
    receiptId: () => id,
  });
  const response = await handler({ httpMethod: "GET", queryStringParameters: query });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "https://t.me/LifeManagerBotbot?start=wr_" + attributionRef(query));
});

test("writer CTA rejects malformed query and wrong method", async () => {
  const handler = makeWriterCtaHandler({ persist: async () => {}, receiptId: () => id });
  assert.equal((await handler({ httpMethod: "POST", queryStringParameters: query })).statusCode, 405);
  assert.equal((await handler({ httpMethod: "GET", queryStringParameters: { ...query, run_id: "bad" } })).statusCode, 400);
});

test("writer CTA normalizes Netlify query shapes", async () => {
  const handler = makeWriterCtaHandler({ persist: async () => {}, receiptId: () => id });
  const arrays = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, [value]]));
  assert.equal((await handler({ httpMethod: "GET", queryStringParameters: arrays })).statusCode, 302);
  assert.equal((await handler({ httpMethod: "GET", rawQuery: new URLSearchParams(query).toString() })).statusCode, 302);
  assert.equal((await handler({ httpMethod: "GET", rawUrl: "https://aniccaai.com/.netlify/functions/writer-cta?" + new URLSearchParams(query) })).statusCode, 302);
});

test("writer CTA URL helper keeps normal /lm visits on the fixed deep link", async () => {
  const { writerCtaHref, TG_DEEPLINK } = await import("../../../../lib/writer-cta-url.js");
  assert.equal(writerCtaHref(""), TG_DEEPLINK);
  assert.equal(writerCtaHref("?product_id=anicca&run_id=bad&artifact_id=a&variant_id=v&click_id=c"), TG_DEEPLINK);
  assert.match(writerCtaHref(new URLSearchParams(query).toString()), /^\/.netlify\/functions\/writer-cta\?/);
});
