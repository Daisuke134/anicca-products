import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import {
  addCampaignToHref,
  addFallbackCampaign,
  injectHtml,
  injectRuntime,
  RUNTIME_MARKER,
  RUNTIME_SCRIPT,
} from "./inject-appstore-ct.mjs";

const PAGE_EN =
  '<html><body><p><a href="/affirmation-app">See the Anicca app page →</a> · ' +
  '<a href="https://apps.apple.com/app/id6755129214">Download on the App Store →</a></p></body></html>';

function fakeLink(href) {
  return {
    href,
    getAttribute() {
      return this.href;
    },
    setAttribute(_name, value) {
      this.href = value;
    },
  };
}

function runRuntime(search, links) {
  const body = RUNTIME_SCRIPT.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
  const window = { location: { search, href: "https://aniccaai.com/en", origin: "https://aniccaai.com" } };
  runInNewContext(body, {
    window,
    document: { querySelectorAll: () => links },
    URL,
    URLSearchParams,
  });
  return links.map((link) => link.href);
}

test("homepage CTA gains the locale campaign and Apple's provider token", () => {
  const href = addCampaignToHref("https://apps.apple.com/app/id6755129214", "home_en");
  const url = new URL(href);
  assert.equal(url.searchParams.get("ct"), "home_en");
  assert.equal(url.searchParams.get("pt"), "93486075");
  assert.equal(url.searchParams.get("mt"), "8");
});

test("a CTA that already carries a query is never rewritten", () => {
  const existing = "https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=youtube_bio&mt=8";
  assert.equal(addCampaignToHref(existing, "home_ja"), existing);
});

test("developer pages and non-Apple links are not treated as App Store CTAs", () => {
  const developer = "https://apps.apple.com/us/developer/daisuke-narita/id1852117244";
  assert.equal(addCampaignToHref(developer, "home_en"), developer);
  assert.equal(addCampaignToHref("https://example.com/app/x", "home_en"), "https://example.com/app/x");
});

test("EN homepage pages get home_en, JA gets home_ja", () => {
  for (const [file, ct] of [
    ["index.html", "home_en"],
    ["en.html", "home_en"],
    ["ja.html", "home_ja"],
  ]) {
    const html = addFallbackCampaign(PAGE_EN, ct);
    assert.match(html, new RegExp(`ct=${ct}`), `${file} must carry ${ct}`);
    assert.match(html, /pt=93486075/);
  }
});

test("the runtime rewrite is injected once, before </body>", () => {
  const once = injectRuntime(PAGE_EN);
  assert.ok(once.includes(RUNTIME_MARKER));
  assert.ok(once.indexOf(RUNTIME_MARKER) < once.indexOf("</body>"));
  assert.equal(injectRuntime(once), once);
});

test("pages without an App Store CTA and Next.js export pages are left untouched", () => {
  const plain = "<html><body><a href=\"/open\">Open</a></body></html>";
  assert.equal(injectHtml(plain), plain);
  const nextPage = '<html><body><a href="https://apps.apple.com/app/id6755129214">x</a>' +
    '<script src="/_next/static/chunks/main.js"></script></body></html>';
  assert.equal(injectHtml(nextPage, { fallbackCt: "home_en" }), nextPage);
});

test("incoming ct overrides the campaign and follows the visitor into /affirmation-app", () => {
  const links = [
    fakeLink("https://apps.apple.com/app/id6755129214?pt=93486075&ct=home_en&mt=8"),
    fakeLink("/affirmation-app"),
    fakeLink("/ja"),
    fakeLink("https://apps.apple.com/us/developer/daisuke-narita/id1852117244"),
    fakeLink("/blog"),
  ];
  const [appStore, appPage, jaPage, developer, blog] = runRuntime("?ct=probe-20261115", links);
  const appStoreUrl = new URL(appStore);
  assert.equal(appStoreUrl.searchParams.get("ct"), "probe-20261115");
  assert.equal(appStoreUrl.searchParams.get("pt"), "93486075");
  assert.equal(appStoreUrl.searchParams.get("mt"), "8");
  assert.equal(appPage, "/affirmation-app?ct=probe-20261115");
  assert.equal(jaPage, "/ja?ct=probe-20261115");
  assert.equal(developer, "https://apps.apple.com/us/developer/daisuke-narita/id1852117244");
  assert.equal(blog, "/blog");
});

test("no incoming ct means the served campaign stays exactly as built", () => {
  const links = [fakeLink("https://apps.apple.com/app/id6755129214?ct=home_en")];
  assert.deepEqual(runRuntime("", links), ["https://apps.apple.com/app/id6755129214?ct=home_en"]);
});
