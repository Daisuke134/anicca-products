// FAQ derivation for /blog/[slug]. Two sources, both taken only from the article's own body:
// 1. Question-style headings / bold questions already in the body (rendered in place).
// 2. Fallback for auto posts with <2 of those: each eligible H2/H3 section becomes a question
//    that names the heading, answered with the section's own first sentences, verbatim.
//    These pairs are rendered as a visible Q&A block so page text and FAQPage JSON-LD match.
// No pairs are invented: if fewer than 3 sections qualify, the article gets no fallback FAQ.
export const clean = (s) => s
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
  .replace(/[*_`#>]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export function questionPairs(markdown) {
  const lines = markdown.split('\n');
  const pairs = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^\s*(?:\*\*(.+[?？])\*\*|#{2,4}\s+(.+[?？]))\s*$/);
    if (!m) continue;
    const answer = [];
    for (let j = i + 1; j < lines.length && !/^\s*(#|\*\*.+[?？]\*\*\s*$)/.test(lines[j]); j += 1) {
      if (lines[j].trim()) answer.push(lines[j].trim());
    }
    if (answer.length) pairs.push([clean(m[1] || m[2]), clean(answer.join(' ')).slice(0, 600)]);
  }
  return pairs;
}

const SKIP_HEADING = /^(faq|よくある質問|まとめ|summary|conclusion|sources?|references?|参考|参考文献|出典|関連|related|目次|table of contents|next steps?|次の一歩|おわりに|はじめに|introduction|intro|cta|subscribe)\b/i;
const NON_PROSE = /^\s*(\||!\[|```|<|-{3,}|\[youtube|>|\{)/;

export function isJapanese(post) {
  if (post.lang) return post.lang === 'ja';
  const text = `${post.title || ''} ${post.markdown || ''}`;
  return /[\u3040-\u30ff]/.test(text);
}

function firstSentences(paragraph, ja) {
  const parts = ja ? (paragraph.match(/[^。！？!?]+[。！？!?]?/g) || []) : paragraph.split(/(?<=[.!?]["”’)]?)\s+(?=[A-Z0-9"“])/);
  let out = '';
  for (const p of parts) {
    const next = (out + (ja ? '' : ' ') + p.trim()).trim();
    if (out && next.length > (ja ? 160 : 320)) break;
    out = next;
    if (out.length >= (ja ? 60 : 120)) break;
  }
  return out.trim();
}

export function sectionPairs(post) {
  const ja = isJapanese(post);
  const lines = (post.markdown || '').split('\n');
  const pairs = [];
  const seen = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    const h = lines[i].match(/^\s*#{2,3}\s+(.+?)\s*#*\s*$/);
    if (!h) continue;
    const heading = clean(h[1]).replace(/^(\d+[.)．]|[0-9０-９]+[、.]|Step\s*\d+[:.]?)\s*/i, '').replace(/[:：]$/, '').trim();
    if (heading.length < 3 || heading.length > 80 || SKIP_HEADING.test(heading) || seen.has(heading)) continue;
    let para = '';
    for (let j = i + 1; j < lines.length && !/^\s*#{1,6}\s/.test(lines[j]); j += 1) {
      const l = lines[j];
      if (!l.trim()) { if (para) break; continue; }
      if (NON_PROSE.test(l) || /^\s*([-*+]|\d+[.)])\s/.test(l)) { if (para) break; continue; }
      para += (para ? (ja ? '' : ' ') : '') + l.trim();
    }
    const answer = firstSentences(clean(para), ja);
    if (answer.length < (ja ? 20 : 40)) continue;
    seen.add(heading);
    const q = ja ? (heading.includes("「") ? `${heading}とは、どういうことですか？` : `「${heading}」とは、どういうことですか？`) : `What does this article say about "${heading}"?`;
    pairs.push([q, answer]);
    if (pairs.length === 5) break;
  }
  return pairs.length >= 3 ? pairs : [];
}

// { pairs, visible }: visible=true means the page must render the pairs as a Q&A block.
export function articleFaq(post) {
  if (post.access_model) return { pairs: [], visible: false };
  const md = post.markdown || '';
  const inline = questionPairs(md);
  if (inline.length >= 2) return { pairs: inline, visible: false };
  const pairs = sectionPairs(post);
  return { pairs, visible: pairs.length > 0 };
}
