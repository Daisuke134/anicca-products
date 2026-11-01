// Article + FAQPage JSON-LD for /blog/[slug]. Google AI Overview is the top source of
// Capafy agent views (2026-10-18: 46 of the sellers' 7-day views) and the blog emitted
// no structured data at all. Paid articles get Article only, never body text.
// FAQ pairs come from lib/article-faq.mjs (body-only, never invented).
import { articleFaq } from './article-faq.mjs';

const SITE = 'https://aniccaai.com';

export function buildArticleJsonLd(post) {
  const url = `${SITE}/blog/${post.slug}`;
  const out = [{
    '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
    datePublished: post.date, dateModified: post.date, url, mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Anicca', url: SITE },
    publisher: { '@type': 'Organization', name: 'Anicca', url: SITE },
  }];
  const { pairs } = articleFaq(post);
  if (pairs.length >= 2) {
    out.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: pairs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })),
    });
  }
  return out;
}
