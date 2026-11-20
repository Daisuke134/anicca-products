import { test } from "node:test";
import assert from "node:assert/strict";
import {
  injectGeoHomeIntoHtml,
  normalizeJaBrandTitle,
  BRAND_TITLE_FROM,
  BRAND_TITLE_TO,
  RSS_LINK,
  KNOWS_ABOUT,
  AUTHOR_META,
  MODIFIED_META,
  DATE_MODIFIED,
  WEBSITE_AUTHOR,
  OG_IMAGE_META,
  OG_IMAGE_URL,
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

test("injects og:image metas before </head> when missing", () => {
  const html = `<html><head><title>x</title></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(out.includes(OG_IMAGE_META));
  assert.ok(out.includes(`property="og:image" content="${OG_IMAGE_URL}"`));
  assert.ok(out.indexOf(OG_IMAGE_META) < out.indexOf("</head>"));
});

test("does not duplicate an existing og:image", () => {
  const existing =
    '<meta property="og:image" content="https://aniccaai.com/other.png">';
  const html = `<html><head>${existing}</head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.equal(out.split('property="og:image"').length - 1, 1);
  assert.ok(!out.includes(OG_IMAGE_META));
});

const WEBSITE_ONLY_DOC =
  '<html><head><meta name="description" content="JA description of Anicca.">' +
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Anicca","url":"https://aniccaai.com/ja","publisher":{"@type":"Organization","name":"Anicca","url":"https://aniccaai.com"}}</script>' +
  "</head><body><h1>x</h1></body></html>";

test("appends the entity @graph when the document has no Organization node", () => {
  const out = injectGeoHomeIntoHtml(WEBSITE_ONLY_DOC);
  const blocks = [
    ...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((m) => JSON.parse(m[1]));
  const graphs = blocks.filter((b) => Array.isArray(b["@graph"]));
  assert.equal(graphs.length, 1);
  const org = graphs[0]["@graph"].find((n) => n["@type"] === "Organization");
  assert.ok(org);
  // The description is the page's own meta description, never invented.
  assert.equal(org.description, "JA description of Anicca.");
  assert.deepEqual(org.knowsAbout, KNOWS_ABOUT);
  assert.deepEqual(org.sameAs, [
    "https://github.com/Daisuke134/anicca",
    "https://apps.apple.com/app/id6755129214",
  ]);
  assert.equal(org.contactPoint.email, "contact@aniccaai.com");
  const app = graphs[0]["@graph"].find(
    (n) => n["@type"] === "SoftwareApplication",
  );
  assert.ok(app);
  assert.equal(app.downloadUrl, "https://apps.apple.com/app/id6755129214");
});

test("does not append the entity @graph when an Organization node exists", () => {
  const html = `<html><head><meta name="description" content="EN description."></head><body>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(!out.includes("SoftwareApplication"));
  assert.ok(!out.includes("contact@aniccaai.com"));
});

test("entity @graph injection is idempotent", () => {
  const once = injectGeoHomeIntoHtml(WEBSITE_ONLY_DOC);
  assert.equal(injectGeoHomeIntoHtml(once), once);
});

test("normalizes the JA brand title separator in title and og:title only", () => {
  const jaTitle = "Anicca｜苦しみを終わらせるAIラボ";
  const html =
    `<html lang="ja"><head><title>${jaTitle}</title>` +
    `<meta property="og:title" content="${jaTitle}"></head>` +
    `<body><p>Anicca｜本文の区切りは変えない</p>${ORG_GRAPH}</body></html>`;
  const out = injectGeoHomeIntoHtml(html);
  assert.ok(out.includes(`<title>${BRAND_TITLE_TO}苦しみを終わらせるAIラボ</title>`));
  assert.ok(
    out.includes(`property="og:title" content="${BRAND_TITLE_TO}苦しみを終わらせるAIラボ"`),
  );
  // Body text is never touched.
  assert.ok(out.includes("Anicca｜本文の区切りは変えない"));
  assert.equal(out.split(BRAND_TITLE_FROM).length - 1, 1);
});

test("does not normalize titles in non-JA documents", () => {
  const html =
    '<html lang="en"><head><title>Anicca｜Some tagline</title></head>' +
    `<body>${ORG_GRAPH}</body></html>`;
  assert.equal(normalizeJaBrandTitle(html), html);
  assert.ok(injectGeoHomeIntoHtml(html).includes("Anicca｜Some tagline"));
});

test("JA brand title normalization is idempotent", () => {
  const html =
    '<html lang="ja"><head><title>Anicca｜苦しみを終わらせるAIラボ</title></head>' +
    `<body>${ORG_GRAPH}</body></html>`;
  const once = injectGeoHomeIntoHtml(html);
  assert.equal(injectGeoHomeIntoHtml(once), once);
  assert.ok(!once.includes(BRAND_TITLE_FROM));
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
