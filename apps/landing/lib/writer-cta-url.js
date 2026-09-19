"use strict";

const TG_DEEPLINK = "https://t.me/LifeManagerBotbot?start=lp";
const WRITER_KEYS = Object.freeze(["product_id", "run_id", "artifact_id", "variant_id", "click_id"]);
const SAFE = /^[A-Za-z0-9._-]{1,120}$/;
const RUN = /^\d{8}-\d{6}$/;

function writerCtaHref(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const values = Object.fromEntries(WRITER_KEYS.map((key) => [key, params.get(key) || ""]));
  if (values.product_id !== "anicca" || !RUN.test(values.run_id)
      || !SAFE.test(values.artifact_id) || !SAFE.test(values.variant_id) || !SAFE.test(values.click_id)) return TG_DEEPLINK;
  const forwarded = new URLSearchParams(WRITER_KEYS.map((key) => [key, values[key]]));
  return "/.netlify/functions/writer-cta?" + forwarded.toString();
}

module.exports = { TG_DEEPLINK, WRITER_KEYS, writerCtaHref };
