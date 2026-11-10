import { test } from "node:test";
import assert from "node:assert/strict";
import { injectGaIntoHtml, GA_MEASUREMENT_ID, GA_SNIPPET } from "./inject-ga4.mjs";

test("injects the GA4 snippet before </head> when missing", () => {
  const html = "<html><head><title>x</title></head><body>hi</body></html>";
  const out = injectGaIntoHtml(html);
  assert.ok(out.includes(GA_MEASUREMENT_ID));
  assert.ok(out.indexOf(GA_SNIPPET) < out.indexOf("</head>"));
});

test("is idempotent on pages that already carry the tag", () => {
  const html = `<html><head>${GA_SNIPPET}</head><body>hi</body></html>`;
  assert.equal(injectGaIntoHtml(html), html);
});

test("falls back to </body>, and leaves headless fragments untouched", () => {
  const bodyOnly = "<html><body>hi</body></html>";
  assert.ok(injectGaIntoHtml(bodyOnly).includes(GA_MEASUREMENT_ID));
  const fragment = "<p>no document structure</p>";
  assert.equal(injectGaIntoHtml(fragment), fragment);
});
