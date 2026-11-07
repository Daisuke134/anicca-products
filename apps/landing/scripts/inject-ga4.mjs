// Post-build GA4 coverage for the static export.
//
// Why this exists: app/layout.tsx renders the GA4 tag only into Next.js pages. The deploy then
// overlays canonical static pages on top of the export (Manager marketing overlay: /, /en, /ja,
// /lm, /dais, ...) and the repo also ships hand-written static pages under public/. Those pages
// never pass through the root layout, so they were served without GA4 (measured 2026-11-07:
// aniccaai.com/ had no tag while /blog did). This step runs on the final export tree right
// before `netlify deploy`, so every exported HTML page carries the tag exactly once, whoever
// produced the page. The Measurement ID is public by design (it ships in the served HTML and
// is already inlined in .github/workflows/netlify-deploy.yml for the Next build).
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const GA_MEASUREMENT_ID = "G-EYBC69XQ24";
export const GA_SNIPPET =
  `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>` +
  `<script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}` +
  `gtag('js', new Date());gtag('config', '${GA_MEASUREMENT_ID}');</script>`;

// Files that must never be modified (ownership-verification tokens etc.).
const SKIP_FILE = /^(google[0-9a-f]+\.html|.*verification.*\.html)$/i;

export function injectGaIntoHtml(html) {
  if (html.includes(GA_MEASUREMENT_ID)) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${GA_SNIPPET}</head>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${GA_SNIPPET}</body>`);
  return html;
}

function* walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walkHtml(full);
    else if (name.endsWith(".html") && !SKIP_FILE.test(name)) yield full;
  }
}

export function injectGaIntoTree(root) {
  let scanned = 0;
  let injected = 0;
  for (const file of walkHtml(root)) {
    scanned += 1;
    const before = readFileSync(file, "utf-8");
    const after = injectGaIntoHtml(before);
    if (after !== before) {
      writeFileSync(file, after);
      injected += 1;
    }
  }
  return { scanned, injected };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || "out";
  const { scanned, injected } = injectGaIntoTree(root);
  console.log(`inject-ga4: scanned ${scanned} html files under ${root}, injected GA4 into ${injected}.`);
}
