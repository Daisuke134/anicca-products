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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const RSS_LINK =
  '<link rel="alternate" type="application/rss+xml" title="Anicca Articles" href="https://aniccaai.com/feed.xml">';

export const DATE_MODIFIED = "2026-11-19";

export const AUTHOR_META = '<meta name="author" content="Anicca">';

export const MODIFIED_META = `<meta property="article:modified_time" content="${DATE_MODIFIED}">`;

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

export function injectGeoHomeIntoHtml(html) {
  let out = html;
  if (/<\/head>/i.test(out)) {
    const headBits = [];
    if (!out.includes("application/rss+xml")) headBits.push(RSS_LINK);
    if (!/name="author"/i.test(out)) headBits.push(AUTHOR_META);
    if (!out.includes("article:modified_time")) headBits.push(MODIFIED_META);
    if (headBits.length) {
      out = out.replace(/<\/head>/i, `${headBits.join("")}</head>`);
    }
  }
  out = addHomepageFactsToLdJson(out);
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
