// Post-build GEO head parity for the static homepage.
//
// Why this exists: the homepage ("/", "/en", "/ja") is served from the
// canonical marketing overlay's static HTML, which never passes through
// app/layout.tsx. The layout already declares RSS feed discovery and the
// Organization knowsAbout topics (the six GEO intents) for Next.js pages,
// but the served homepage had neither (measured 2026-11-19 by the hourly
// GEO audit, geo-optimizer-skill 4.23.0: signals has_rss=false, and the
// homepage Organization node carries no knowsAbout while Next-rendered
// pages do). This step runs on the final export tree right before
// `netlify deploy` — the same place inject-ga4.mjs already instruments
// every page the layout cannot reach — and applies only facts that are
// already true: /feed.xml is a live RSS feed of Anicca articles, and the
// knowsAbout list is copied verbatim from app/layout.tsx.
//
// Authorship / freshness parity (2026-11-19, hourly GEO audit run 6):
// the served homepage declared no author and no date at all (audit
// G-BYLINE warn, G-DATES warn, signals has_freshness=false), while the
// content's author is the Anicca organization itself (the homepage's own
// publisher) and the served homepage document did change on 2026-11-19
// (the GEO head-parity injection above landed that day). DATE_MODIFIED
// is therefore a literal for that real change — update it only when the
// homepage document actually changes; never auto-bump it per deploy.
//
// og:image parity (2026-11-21, hourly GEO audit run 41): the audit reads
// meta has_og_image=false — the served homepage declared og:title /
// og:description / og:url / og:type but no og:image, and app/layout.tsx
// declared none either (fixed in the same commit). The image is the
// app's real icon, already served at /anicca-app-icon.png (1024x1024,
// measured from the live PNG header) and already the Organization logo
// in public/ai/summary.json — no new asset, no new claim.
//
// Entity-graph parity (2026-11-21, hourly GEO audit run 42): the JA
// homepage document carries only a WebSite JSON-LD block — no
// Organization node at all (measured live: JA audit schema 7/14 with
// found_types ["WebSite"], brand_entity 4/12, vs EN 10/14 and 7/12
// with the @graph the EN document carries). The enrichment above can
// only add knowsAbout to an Organization that exists, so ja.html never
// received the entity graph. When a homepage document has no
// Organization node in any JSON-LD block, this step now appends the
// @graph the EN homepage already serves (Organization +
// SoftwareApplication, verbatim from app/layout.tsx SITE_JSONLD),
// with the Organization description taken from the page's own meta
// description — the same pattern the EN document follows (its
// Organization description equals its meta description). Every other
// field is a fact already live on the EN homepage and in
// public/ai/summary.json: the contact email, the GitHub and App Store
// sameAs URLs, the knowsAbout topics, and the free iOS app offer.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const RSS_LINK =
  '<link rel="alternate" type="application/rss+xml" title="Anicca Articles" href="https://aniccaai.com/feed.xml">';

export const DATE_MODIFIED = "2026-11-19";

export const AUTHOR_META = '<meta name="author" content="Anicca">';

export const MODIFIED_META = `<meta property="article:modified_time" content="${DATE_MODIFIED}">`;

export const OG_IMAGE_URL = "https://aniccaai.com/anicca-app-icon.png";

export const OG_IMAGE_META =
  `<meta property="og:image" content="${OG_IMAGE_URL}">` +
  '<meta property="og:image:width" content="1024">' +
  '<meta property="og:image:height" content="1024">' +
  '<meta property="og:image:alt" content="Anicca app icon">';

// The homepage's author/publisher: the Anicca organization itself.
export const WEBSITE_AUTHOR = {
  "@type": "Organization",
  name: "Anicca",
  url: "https://aniccaai.com",
};

// Verbatim from app/layout.tsx SITE_JSONLD Organization.knowsAbout.
export const KNOWS_ABOUT = [
  "rumination and overthinking",
  "depression and low mood support",
  "OCD and intrusive thoughts support",
  "hard days and stress",
  "a hard life and suffering",
  "laziness, procrastination and motivation",
  "daily affirmations",
  "habit formation",
  "behavior-based nudges",
  "iOS apps",
];

// Only the homepage documents: "/" and "/en" serve en.html through the
// markdown-home function, "/ja" serves ja.html, and index.html is the
// exported root document when present.
export const HOMEPAGE_FILES = ["en.html", "index.html", "ja.html"];

function addHomepageFactsToLdJson(html) {
  return html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (block, jsonText) => {
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch {
        return block;
      }
      let changed = false;
      // Enrich only top-level entities: the root object itself and the
      // direct members of its @graph. Nested sub-objects (a WebSite's
      // publisher, or the author attribution added below) are never
      // enriched — the author stays a plain attribution, the shared
      // WEBSITE_AUTHOR constant never mutates, and re-running the
      // injector on its own output is a no-op (idempotent).
      const enrich = (node) => {
        if (!node || typeof node !== "object" || Array.isArray(node)) return;
        if (node["@type"] === "Organization" && !("knowsAbout" in node)) {
          node.knowsAbout = KNOWS_ABOUT;
          changed = true;
        }
        if (node["@type"] === "WebSite") {
          if (!("dateModified" in node)) {
            node.dateModified = DATE_MODIFIED;
            changed = true;
          }
          if (!("author" in node)) {
            node.author = { ...WEBSITE_AUTHOR };
            changed = true;
          }
        }
      };
      if (Array.isArray(data["@graph"])) data["@graph"].forEach(enrich);
      else enrich(data);
      if (!changed) return block;
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    },
  );
}

// The entity @graph for a homepage document that declares no
// Organization at all. Organization + SoftwareApplication verbatim
// from app/layout.tsx SITE_JSONLD (and the EN homepage's served
// @graph); the description is filled from the page's own meta
// description by ensureEntityGraph below.
export const ENTITY_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Anicca",
      url: "https://aniccaai.com",
      logo: "https://aniccaai.com/anicca-app-icon.png",
      description: "",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@aniccaai.com",
      },
      sameAs: [
        "https://github.com/Daisuke134/anicca",
        "https://apps.apple.com/app/id6755129214",
      ],
      knowsAbout: KNOWS_ABOUT,
    },
    {
      "@type": "SoftwareApplication",
      name: "Anicca",
      operatingSystem: "iOS",
      applicationCategory: "HealthApplication",
      url: "https://aniccaai.com",
      downloadUrl: "https://apps.apple.com/app/id6755129214",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

function hasOrganizationNode(html) {
  let found = false;
  html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (block, jsonText) => {
      let data;
      try {
        data = JSON.parse(jsonText);
      } catch {
        return block;
      }
      const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
      for (const node of nodes) {
        if (node && node["@type"] === "Organization") found = true;
      }
      return block;
    },
  );
  return found;
}

function ensureEntityGraph(html) {
  if (!/<\/head>/i.test(html)) return html;
  if (hasOrganizationNode(html)) return html;
  const desc = html.match(/<meta name="description" content="([^"]*)"/i);
  if (!desc) return html;
  const graph = JSON.parse(JSON.stringify(ENTITY_GRAPH));
  graph["@graph"][0].description = desc[1];
  const script = `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
  return html.replace(/<\/head>/i, `${script}</head>`);
}

export function injectGeoHomeIntoHtml(html) {
  let out = html;
  if (/<\/head>/i.test(out)) {
    const headBits = [];
    if (!out.includes("application/rss+xml")) headBits.push(RSS_LINK);
    if (!/name="author"/i.test(out)) headBits.push(AUTHOR_META);
    if (!out.includes("article:modified_time")) headBits.push(MODIFIED_META);
    if (!out.includes('property="og:image"')) headBits.push(OG_IMAGE_META);
    if (headBits.length) {
      out = out.replace(/<\/head>/i, `${headBits.join("")}</head>`);
    }
  }
  out = addHomepageFactsToLdJson(out);
  out = ensureEntityGraph(out);
  return out;
}

export function injectGeoHomeIntoTree(root) {
  let scanned = 0;
  let injected = 0;
  for (const name of HOMEPAGE_FILES) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    scanned += 1;
    const before = readFileSync(file, "utf-8");
    const after = injectGeoHomeIntoHtml(before);
    if (after !== before) {
      writeFileSync(file, after);
      injected += 1;
    }
  }
  return { scanned, injected };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || "out";
  const { scanned, injected } = injectGeoHomeIntoTree(root);
  console.log(
    `inject-geo-home: scanned ${scanned} homepage files under ${root}, injected GEO head parity into ${injected}.`,
  );
}
