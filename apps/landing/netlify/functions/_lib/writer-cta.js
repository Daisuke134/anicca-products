"use strict";

const { createHash, randomUUID } = require("node:crypto");
const SAFE = /^[A-Za-z0-9._-]{1,120}$/;
const RUN = /^\d{8}-\d{6}$/;
const TELEGRAM = "https://t.me/LifeManagerBotbot?start=wr_";
const REQUIRED = ["product_id", "run_id", "artifact_id", "variant_id", "click_id"];

function readQuery(event) {
  const query = event && event.queryStringParameters;
  return query && typeof query === "object" ? query : {};
}

function validateQuery(query) {
  if (query.product_id !== "anicca" || !RUN.test(String(query.run_id || ""))) return false;
  return REQUIRED.slice(2).every((key) => SAFE.test(String(query[key] || "")));
}

function attributionRef(query) {
  const canonical = REQUIRED.map((key) => String(query[key])).join("|");
  return createHash("sha256").update(canonical, "utf8").digest("hex").slice(0, 32);
}

function makeWriterCtaHandler({ persist, now = () => new Date().toISOString(), receiptId = randomUUID }) {
  return async (event) => {
    if (!event || event.httpMethod !== "GET") return { statusCode: 405, headers: { allow: "GET" }, body: "" };
    const query = readQuery(event);
    if (!validateQuery(query)) return { statusCode: 400, body: "" };
    const id = String(receiptId());
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return { statusCode: 500, body: "" };
    const ref = attributionRef(query);
    const campaignToken = ["writer", "v2", ref, query.run_id, query.artifact_id, query.variant_id, query.click_id].join(":");
    try {
      await persist({ schema_version: 1, receipt_id: id, campaign_token: campaignToken, product_id: "writer:anicca", clicked_at: now() });
    } catch {
      // The redirect remains usable; a missing click receipt is reported separately.
    }
    return { statusCode: 302, headers: { location: TELEGRAM + ref, "cache-control": "no-store" }, body: "" };
  };
}

module.exports = { makeWriterCtaHandler, attributionRef, validateQuery };
