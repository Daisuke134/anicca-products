import { test } from "node:test";
import assert from "node:assert/strict";
import { injectGeoHomeIntoHtml, RSS_LINK, KNOWS_ABOUT } from "./inject-geo-home.mjs";

const ORG_GRAPH =
  '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[' +
  '{"@type":"Organization","name":"Anicca","url":"https://aniccaai.com"},' +
  '{"@type":"WebSite","name":"Anicca","url":"https://aniccaai.com/en"}]}</script>';

test("injects the RSS alternate link before </head> when missing", () => {
  const html = `<html><head><title>x</title></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(out.includes(RSS_LINK));
  assert.ok(out.indexOf(RSS_LINK) < out.indexOf("</head>"));
});

test("adds knowsAbout to the Organization node inside @graph", () => {
  const html = `<html><head></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  const match = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(match[1]);
  const org = data["@graph"].find((n) => n["@type"] === "Organization");
  assert.deepEqual(org.knowsAbout, KNOWS_ABOUT);
  const site = data["@graph"].find((n) => n["@type"] === "WebSite");
  assert.equal(site.knowsAbout, undefined);
});

test("is idempotent", () => {
  const html = `<html><head><title>x</title></head><body>${ORG_GRAPH}</body></html>`;
  const once = injectGeoHomeIntoHtml(html);
  assert.equal(injectGeoHomeIntoHtml(once), once);
});

test("leaves invalid JSON-LD and headless fragments untouched except RSS rule", () => {
  const bad = '<html><head></head><body><script type="application/ld+json">{oops</script></body></html>';
  const out = injectGeoHomeIntoHtml(bad);
  assert.ok(out.includes("{oops"));
  const fragment = "<p>no document structure</p>";
  assert.equal(injectGeoHomeIntoHtml(fragment), fragment);
});
