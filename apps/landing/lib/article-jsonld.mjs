// Article + FAQPage JSON-LD for /blog/[slug]. Google AI Overview is the top source of
// Capafy agent views (2026-10-18: 46 of the sellers' 7-day views) and the blog emitted
// no structured data at all. Paid articles get Article only, never body text.
const SITE = 'https://aniccaai.com';
const clean = (s) => s.replace(/[*_`#>]/g, '').replace(/\[(.*?)\]\([^)]*\)/g, '$1').trim();

function faqPairs(markdown) {
  const lines = markdown.split('\n');
  const pairs = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^\s*(?:\*\*(.+\?)\*\*|#{2,4}\s+(.+\?))\s*$/);
    if (!m) continue;
    const answer = [];
    for (let j = i + 1; j < lines.length && !/^\s*(#|\*\*.+\?\*\*\s*$)/.test(lines[j]); j += 1) {
      if (lines[j].trim()) answer.push(lines[j].trim());
    }
    if (answer.length) pairs.push([clean(m[1] || m[2]), clean(answer.join(' ')).slice(0, 600)]);
  }
  return pairs;
}

export function buildArticleJsonLd(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const out = [{
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
    datePublished: post.date, dateModified: post.date, url, mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Anicca', url: SITE },
    publisher: { '@type': 'Organization', name: 'Anicca', url: SITE },
  }];
  if (post.access_model) return out;
  const pairs = faqPairs(post.markdown || '');
  if (pairs.length >= 2) {
    out.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: pairs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
    });
  }
  return out;
}
