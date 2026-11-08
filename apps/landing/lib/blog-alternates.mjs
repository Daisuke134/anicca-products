// Language alternates for blog posts published as -en / -ja slug pairs.
//
// Google Search Central ("Managing multi-regional and multilingual sites" /
// "Localized versions of your pages"): each language version lives at its own
// URL, versions reference each other with reciprocal, self-referencing
// hreflang annotations using fully-qualified URLs, and an x-default points at
// the fallback version. Blog post URLs never move; this only annotates pairs
// that already exist. Pairs are formed strictly by the -en / -ja slug suffix
// and only when the counterpart post actually exists, so single-language
// posts are never annotated with a phantom alternate.
export const BLOG_LANG_NAMES = {
  en: 'English',
  ja: '日本語',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  id: 'Bahasa Indonesia',
  tr: 'Türkçe',
  ko: '한국어',
  zh: '中文',
};

export function blogLangName(code) {
  return BLOG_LANG_NAMES[code] || code;
}

// Returns { self, other, base } for slugs carrying a language suffix, else null.
export function pairSuffixOf(slug) {
  if (typeof slug !== 'string') return null;
  if (slug.endsWith('-en')) return { self: 'en', other: 'ja', base: slug.slice(0, -3) };
  if (slug.endsWith('-ja')) return { self: 'ja', other: 'en', base: slug.slice(0, -3) };
  return null;
}

// exists(slug) must report whether a post with that slug is published.
// Returns the Next metadata `alternates.languages` map for a complete pair,
// or undefined when the post has no published counterpart.
export function blogPairLanguages(slug, exists, site = 'https://aniccaai.com') {
  const pair = pairSuffixOf(slug);
  if (!pair) return undefined;
  if (!exists(`${pair.base}-${pair.other}`)) return undefined;
  const en = `${site}/blog/${pair.base}-en`;
  const ja = `${site}/blog/${pair.base}-ja`;
  return { en, ja, 'x-default': en };
}
