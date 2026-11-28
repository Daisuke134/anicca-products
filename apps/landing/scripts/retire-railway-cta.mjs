// retire-railway-cta.mjs — post-export fix-up for the retired Life Manager Cloud app.
//
// Why this exists (2026-11-28): the canonical marketing overlay pinned through
// MANAGER_MARKETING_REVISION still ships `pages/life-manager-en.html` and
// `pages/life-manager.html` with three "Start Life Manager Cloud" CTAs pointing at
// https://life-call-production.up.railway.app/maritime?source=landing — the Railway
// app that was retired on 2026-11-28. scripts/money-path-smoke.mjs (the permanent
// post-deploy guard) fails while those links are served, so every production deploy
// — including every SEO page — is published and then rolled back (first failure
// 2026-11-28 21:15 JST, runs 46143790603 / 46145755734).
//
// The source of truth is Daisuke134/life-manager, and the durable fix is to edit
// those two pages there and bump the pin. Until that lands, this script performs the
// same replacement the brief already ordered for the site ("replace that /lm CTA
// with https://aniccaai.com", anicca-products PR #968) on the exported HTML, the
// same way inject-ga4.mjs / inject-geo-home.mjs fix up the overlay output.
//
// Idempotent: a second run rewrites nothing. A tree without the overlay is a no-op.
// Scope: only the exported Life Manager documents (out/lm.html, out/lm/ja.html and a
// defensive out/life-manager*.html), never blog posts or other marketing pages.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const RAILWAY_ORIGIN = /https:\/\/life-call-production\.up\.railway\.app(?:\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]*)?/g;
const HOME = "https://aniccaai.com";

export function rewriteRailwayCtas(html) {
  let replaced = 0;
  const out = html.replace(RAILWAY_ORIGIN, () => {
    replaced += 1;
    return HOME;
  });
  return { html: out, replaced };
}

async function targets(root) {
  const found = [];
  const fixed = ["lm.html", join("lm", "ja.html")];
  for (const rel of fixed) {
    try {
      const text = await readFile(join(root, rel), "utf-8");
      found.push([rel, text]);
    } catch {
      // Not every export carries the overlay (PR builds without it); skip.
    }
  }
  try {
    for (const name of await readdir(root)) {
      if (/^life-manager.*\.html$/.test(name) && !fixed.includes(name)) {
        found.push([name, await readFile(join(root, name), "utf-8")]);
      }
    }
  } catch {
    // No export root: nothing to do.
  }
  return found;
}

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error("usage: node scripts/retire-railway-cta.mjs <export-dir>");
    process.exit(2);
  }
  let files = 0;
  let links = 0;
  for (const [rel, text] of await targets(root)) {
    const { html, replaced } = rewriteRailwayCtas(text);
    if (replaced === 0) continue;
    await writeFile(join(root, rel), html);
    files += 1;
    links += replaced;
    console.log(`retired Railway CTA → ${HOME}: ${rel} (${replaced})`);
  }
  console.log(
    links === 0
      ? "No retired Railway CTA in the export (nothing to rewrite)."
      : `Rewrote ${links} retired Railway CTA(s) in ${files} file(s).`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
