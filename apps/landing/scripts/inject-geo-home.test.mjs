import { test } from "node:test";
import assert from "node:assert/strict";
import {
  injectGeoHomeIntoHtml,
  RSS_LINK,
  KNOWS_ABOUT,
  AUTHOR_META,
  MODIFIED_META,
  DATE_MODIFIED,
  WEBSITE_AUTHOR,
} from "./inject-geo-home.mjs";

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

test("injects author and modified-time metas before </head> when missing", () => {
  const html = `<html><head><title>x</title></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(out.includes(AUTHOR_META));
  assert.ok(out.includes(MODIFIED_META));
  assert.ok(out.indexOf(AUTHOR_META) < out.indexOf("</head>"));
});

test("adds dateModified and author to the WebSite node only", () => {
  const html = `<html><head></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  const match = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(match[1]);
  const site = data["@graph"].find((n) => n["@type"] === "WebSite");
  assert.equal(site.dateModified, DATE_MODIFIED);
  assert.deepEqual(site.author, WEBSITE_AUTHOR);
  // The author attribution must stay plain: no knowsAbout leaks into it
  // and the shared WEBSITE_AUTHOR constant is never mutated.
  assert.equal(site.author.knowsAbout, undefined);
  assert.deepEqual(WEBSITE_AUTHOR, {
    "@type": "Organization",
    name: "Anicca",
    url: "https://aniccaai.com",
  });
  const org = data["@graph"].find((n) => n["@type"] === "Organization");
  assert.equal(org.dateModified, undefined);
  assert.equal(org.author, undefined);
});

test("does not overwrite an existing WebSite dateModified", () => {
  const graph =
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Anicca","dateModified":"2026-01-01"}</script>';
  const html = `<html><head></head><body>${graph}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(out.includes('"dateModified":"2026-01-01"'));
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
