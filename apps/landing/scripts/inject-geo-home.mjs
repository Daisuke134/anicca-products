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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const RSS_LINK =
  '<link rel="alternate" type="application/rss+xml" title="Anicca Articles" href="https://aniccaai.com/feed.xml">';

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

function addKnowsAboutToLdJson(html) {
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
      const visit = (node) => {
        if (!node || typeof node !== "object") return;
        if (node["@type"] === "Organization" && !("knowsAbout" in node)) {
          node.knowsAbout = KNOWS_ABOUT;
          changed = true;
        }
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(visit);
          else visit(value);
        }
      };
      visit(data);
      if (!changed) return block;
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    },
  );
}

export function injectGeoHomeIntoHtml(html) {
  let out = html;
  if (!out.includes("application/rss+xml") && /<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, `${RSS_LINK}</head>`);
  }
  out = addKnowsAboutToLdJson(out);
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
