const test = require("node:test");
const assert = require("node:assert/strict");
const { makeWriterCtaHandler } = require("../writer-cta");
const { writerCtaHref, TG_DEEPLINK } = require("../../../lib/writer-cta-url");
const query = { product_id: "anicca", run_id: "20260919-025451", artifact_id: "article-ja", variant_id: "ai-editing-flow", click_id: "20260919-025451-article-ja" };
const id = "123e4567-e89b-12d3-a456-426614174000";
test("writer CTA persists a reduced receipt and redirects with a bounded Telegram token", async () => {
  const rows = [];
  const handler = makeWriterCtaHandler({ persist: async (row) => rows.push(row), receiptId: () => id, now: () => "2026-09-19T04:00:00.000Z" });
  const response = await handler({ httpMethod: "GET", queryStringParameters: query });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "https://t.me/LifeManagerBotbot?start=wr_" + id);
  assert.deepEqual(rows, [{ schema_version: 1, receipt_id: id, campaign_token: ["writer", "v1", id, query.run_id, query.artifact_id, query.variant_id, query.click_id].join(":"), product_id: "writer:anicca", clicked_at: "2026-09-19T04:00:00.000Z" }]);
});
test("writer CTA rejects malformed query, wrong method, and persistence failure", async () => {
  const handler = makeWriterCtaHandler({ persist: async () => { throw new Error("db"); }, receiptId: () => id });
  assert.equal((await handler({ httpMethod: "POST", queryStringParameters: query })).statusCode, 405);
  assert.equal((await handler({ httpMethod: "GET", queryStringParameters: { ...query, run_id: "bad" } })).statusCode, 400);
  assert.equal((await handler({ httpMethod: "GET", queryStringParameters: query })).statusCode, 503);
});
test("writer CTA URL helper keeps normal /lm visits on the fixed deep link", () => {
  assert.equal(writerCtaHref(""), TG_DEEPLINK);
  assert.equal(writerCtaHref("?product_id=anicca&run_id=bad&artifact_id=a&variant_id=v&click_id=c"), TG_DEEPLINK);
  assert.match(writerCtaHref(new URLSearchParams(query).toString()), /^\\/.netlify\\/functions\\/writer-cta\\?/);
});
