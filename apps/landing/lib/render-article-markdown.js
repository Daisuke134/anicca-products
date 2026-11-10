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

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function youtubeEmbedHtml(videoId, title, isShort) {
  const safeTitle = escapeHtmlAttribute(title);
  const profile = isShort ? "youtube-short" : "youtube-embed";
  const videoUrl = isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
  const playLabel = escapeHtmlAttribute(`Play: ${title}`);
  return `<figure class="my-8 flex flex-col items-center"><lite-youtube class="${profile}" videoid="${videoId}" title="${safeTitle}" playlabel="${playLabel}" style="background-image:url('https://i.ytimg.com/vi/${videoId}/hqdefault.jpg')"><a class="lyt-playbtn" href="${videoUrl}" target="_blank" rel="noopener noreferrer" aria-label="${playLabel}"><span class="lyt-visually-hidden">${playLabel}</span></a></lite-youtube><figcaption class="mt-2 text-sm text-ink-soft">${safeTitle} · <a href="${videoUrl}" target="_blank" rel="noopener noreferrer" class="underline">Watch on YouTube</a></figcaption></figure>`;
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
  const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isTableSep = (l) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l);
  const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => inline(c.trim()));
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trimEnd();
    // GFM-style table: header row + separator row + body rows (2026-11-01 SEO list pages).
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara();
      flushList();
      const head = cells(line);
      const body = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        body.push(cells(lines[i]));
        i += 1;
      }
      i -= 1;
      out.push('<div style="margin:2rem 0;overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:15px;line-height:1.4">');
      out.push(`<thead><tr>${head.map((c) => `<th style="border-bottom:1px solid #d9d3c7;padding:8px 12px;font-weight:600;vertical-align:bottom">${c}</th>`).join("")}</tr></thead>`);
      out.push(`<tbody>${body.map((r) => `<tr>${r.map((c) => `<td style="border-bottom:1px solid #e8e3d9;padding:8px 12px;vertical-align:top">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushPara();
      flushList();
      out.push('<hr style="margin:3rem 0;border:0;border-top:1px solid #d9d3c7" />');
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const youtubeEmbed = line.match(/^\[youtube-(embed|short):([A-Za-z0-9_-]{11})(?:\|([^\]]+))?\]$/);
    if (youtubeEmbed) {
      flushPara();
      flushList();
      const isShort = youtubeEmbed[1] === "short";
      const videoId = youtubeEmbed[2];
      const title = youtubeEmbed[3]?.trim() || (isShort ? "YouTube Short" : "YouTube video");
      out.push(youtubeEmbedHtml(videoId, title, isShort));
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
