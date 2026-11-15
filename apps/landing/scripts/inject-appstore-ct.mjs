// Post-build App Store attribution for the served export tree.
//
// Why this exists: the published homepage (aniccaai.com/ , /en, /ja) is the canonical Manager
// marketing overlay, staged from the Life Manager repository and written into out/ right before
// `netlify deploy`. Those pages are plain static HTML with no Next.js runtime, so the ct
// pass-through that AffirmationLanding.tsx does client-side cannot reach them, and the App Store
// CTA dropped every incoming ?ct= (measured 2026-11-15: ct_probe / and /ja =>
// ct_values=[''], client_rewrite=false, pass=false).
//
// This step runs on the final export tree next to inject-ga4.mjs, so the same attribution rule
// applies to every page that ships an App Store CTA, whoever produced it:
//   1. homepage pages carry a locale campaign by default (home_en / home_ja) so plain traffic is
//      still attributable;
//   2. a small inline script lets an incoming ?ct= override that campaign and follow the visitor
//      into /en, /ja and /affirmation-app.
// It changes URLs only. No copy, layout, or destination changes, and pages that already carry a
// campaign query (the Next.js export, which does its own client rewrite) are left untouched.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PROVIDER_TOKEN = "93486075";
export const MOUNT_PARAM = "8";
export const RUNTIME_MARKER = "data-app-store-ct";

// Export-root homepage files and the campaign each one falls back to.
export const HOMEPAGE_CAMPAIGNS = new Map([
  ["index.html", "home_en"],
  ["en.html", "home_en"],
  ["ja.html", "home_ja"],
]);

// Same-origin destinations that must keep the incoming campaign across the funnel.
const CAMPAIGN_PATHS = ["/en", "/ja", "/affirmation-app", "/affirmation-app/ja"];

// Apple app links (/app/id..., /us/app/..., /jp/app/...) but not developer pages.
const APP_LINK_PATH = /\/(?:[a-z]{2}\/)?app\//;

const SKIP_FILE = /^(google[0-9a-f]+\.html|.*verification.*\.html)$/i;
// A Next.js export page hydrates its own CTAs (AffirmationLanding.tsx); injecting there as well
// would only fight the component for the same attribute.
const NEXT_PAGE = /\/_next\//;
const APP_STORE_HREF = /href="(https:\/\/apps\.apple\.com[^"]*)"/g;

export const RUNTIME_SCRIPT =
  `<script ${RUNTIME_MARKER}>(function(){try{` +
  `var ct=(new URLSearchParams(window.location.search).get("ct")||"").trim();` +
  `if(!ct)return;` +
  `var pathways=${JSON.stringify(Object.fromEntries(CAMPAIGN_PATHS.map((p) => [p, 1])))};` +
  `var links=document.querySelectorAll("a[href]");` +
  `for(var i=0;i<links.length;i++){var link=links[i];var raw=link.getAttribute("href");if(!raw)continue;` +
  `try{var url=new URL(raw,window.location.href);` +
  `var host=url.hostname;var appStore=host==="apps.apple.com"||host.slice(-15)===".apps.apple.com";` +
  `if(appStore){if(!${APP_LINK_PATH.toString()}.test(url.pathname))continue;` +
  `url.searchParams.set("ct",ct);link.setAttribute("href",url.toString());}` +
  `else if(url.origin===window.location.origin&&pathways[url.pathname]){` +
  `url.searchParams.set("ct",ct);link.setAttribute("href",url.pathname+url.search+url.hash);}` +
  `}catch(e){}}` +
  `}catch(e){}})();</script>`;

function appStoreUrl(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.hostname !== "apps.apple.com") return null;
  if (!APP_LINK_PATH.test(url.pathname)) return null;
  return url;
}

// Adds the locale campaign (plus Apple's provider token) to an App Store CTA that has no query yet.
export function addCampaignToHref(href, ct) {
  const url = appStoreUrl(href);
  if (!url) return href;
  if (url.search) return href;
  url.searchParams.set("pt", PROVIDER_TOKEN);
  url.searchParams.set("ct", ct);
  url.searchParams.set("mt", MOUNT_PARAM);
  return url.toString();
}

export function addFallbackCampaign(html, ct) {
  return html.replace(APP_STORE_HREF, (match, href) => `href="${addCampaignToHref(href, ct)}"`);
}

// The inline rewrite goes last in the body so the page's own links are already parsed.
export function injectRuntime(html) {
  if (html.includes(RUNTIME_MARKER)) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${RUNTIME_SCRIPT}</body>`);
  return `${html}${RUNTIME_SCRIPT}`;
}

function* walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walkHtml(full);
    else if (name.endsWith(".html") && !SKIP_FILE.test(name)) yield full;
  }
}

export function injectHtml(html, { fallbackCt = null } = {}) {
  if (!html.includes("apps.apple.com")) return html;
  if (NEXT_PAGE.test(html)) return html;
  const attributed = fallbackCt ? addFallbackCampaign(html, fallbackCt) : html;
  return injectRuntime(attributed);
}

export function injectTree(root, { write = true } = {}) {
  let scanned = 0;
  let injected = 0;
  for (const file of walkHtml(root)) {
    scanned += 1;
    const before = readFileSync(file, "utf-8");
    const fallbackCt = path.dirname(path.relative(root, file)) === "."
      ? HOMEPAGE_CAMPAIGNS.get(path.basename(file)) ?? null
      : null;
    const after = injectHtml(before, { fallbackCt });
    if (after !== before) {
      if (write) writeFileSync(file, after);
      injected += 1;
    }
  }
  return { scanned, injected };
}

// Deploy-time entry: apply, then prove the result is stable so a non-idempotent injector fails the
// step instead of shipping a page that grows a script on every deploy.
export function injectTreeVerified(root) {
  const first = injectTree(root);
  const second = injectTree(root);
  if (second.injected !== 0) {
    throw new Error(`inject-appstore-ct is not idempotent under ${root}: ${second.injected} files changed twice`);
  }
  return first;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || "out";
  const result = injectTreeVerified(root);
  console.log(
    `inject-appstore-ct: scanned ${result.scanned} html files under ${root}, ` +
      `attributed ${result.injected}; second pass changed 0.`,
  );
}
