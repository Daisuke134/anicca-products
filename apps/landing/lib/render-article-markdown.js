"use strict";

// AFFILIATE_CTA_V1: fixed-host redirect; no arbitrary destination input.
const AFFILIATE_PLACEMENT = /^elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(?:-experiment-[a-f0-9]{12})?-1$/;

function isAffiliatePlacement(value) {
  return value.length <= 80 && AFFILIATE_PLACEMENT.test(value);
}

function trackedAffiliateHref(href) {
  try {
    const url = new URL(href);
    const placement = url.pathname.replace(/^\/+|\/+$/g, "");
    if (url.protocol === "https:" && url.hostname === "try.elevenlabs.io" &&
        !url.search && !url.hash && isAffiliatePlacement(placement))
      return `/go/af_${placement}`;
  } catch {}
  return href;
}

function affiliatePlacement(md) { // AFFILIATE_ENTRY_V1
  const match = md.match(/https:\/\/try\.elevenlabs\.io\/(elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(?:-experiment-[a-f0-9]{12})?-1)(?=$|[\s)"'<])/);
  return match && isAffiliatePlacement(match[1]) ? match[1] : null;
}

function renderMarkdown(md) {
  // Minimal markdown → HTML (no extra deps; covers headings, paragraphs,
  // bold/italic, links, lists, code spans, images).
  //
  // The link pattern below is intentionally host-agnostic: it renders ANY
  // `[text](https://... or /...)` markdown link as a normal <a>. This is
  // what makes every self-owned revenue CTA (aniccaai.com/lm AND external
  // Capafy capafy.ai/agent/<id> links from #6110) show up on the page --
  // there is no per-host allowlist to keep in sync. Narrowing this to a
  // fixed host would silently drop a legitimate external CTA link; see
  // render-article-markdown.test.mjs for the regression coverage.
  const lines = md.split("\n");
  const out = [];
  let inList = false;
  let inPara = false;
  const flushPara = () => {
    if (inPara) {
      out.push("</p>");
      inPara = false;
    }
  };
  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  const inline = (s) =>
    s
      .replace(/https:\/\/try\.elevenlabs\.io\/elevenlabs-discovered-[a-z0-9][a-z0-9-]*-en(?:-experiment-[a-f0-9]{12})?-1(?=$|[\s)"'<])/g, trackedAffiliateHref)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code class=\"rounded bg-bone/60 px-1.5 py-0.5 font-mono-ui text-[0.85em] text-ink\">$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" class="my-10 w-full rounded border border-bone" loading="lazy" />'
      )
      .replace(
        /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g,
        '<a href="$2" class="text-ink underline decoration-mist underline-offset-4 transition-colors hover:decoration-ink" target="_blank" rel="noopener">$1</a>'
      );
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      const lvl = h[1].length;
      const cls =
        lvl === 1
          ? "font-display text-[44px] sm:text-[60px] leading-[1.05] mt-0 mb-10 text-ink"
          : lvl === 2
            ? "font-display text-[28px] sm:text-[34px] leading-tight mt-16 mb-5 text-ink"
            : "font-display text-[22px] sm:text-[26px] leading-tight mt-12 mb-4 text-ink";
      out.push(`<h${lvl} class="${cls}">${inline(h[2])}</h${lvl}>`);
      continue;
    }
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) {
      flushPara();
      if (!inList) {
        out.push('<ul class="my-6 space-y-3 pl-6 text-ink-soft" style="list-style-type:square">');
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    flushList();
    if (!inPara) {
      out.push('<p class="my-6 text-[19px] leading-[1.7] text-ink-soft sm:text-[20px]">');
      inPara = true;
    }
    out.push(inline(line) + " ");
  }
  flushPara();
  flushList();
  return out.join("\n");
}

export { isAffiliatePlacement, trackedAffiliateHref, affiliatePlacement, renderMarkdown };
