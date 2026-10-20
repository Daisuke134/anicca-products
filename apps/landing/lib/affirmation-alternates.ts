/**
 * Explicit EN ↔ JA ↔ ES slug triples for true translations.
 * Used for reciprocal hreflang; do not infer from "closest topic" jaSlug.
 */

export type AffirmationLocaleSlugs = {
  en?: string;
  ja?: string;
  es?: string;
};

export const AFFIRMATION_HREFLANG_TRIPLES: ReadonlyArray<{
  en: string;
  ja?: string;
  es: string;
}> = [
  {
    en: 'affirmations-for-sunday-scaries',
    ja: 'sunday-scaries',
    es: 'afirmaciones-para-la-ansiedad-del-domingo',
  },
  {
    en: 'affirmations-for-social-anxiety-at-work',
    ja: 'social-anxiety-at-work',
    es: 'afirmaciones-para-la-ansiedad-social-en-el-trabajo',
  },
  // Sleep pair: true EN<->ES translation, no JA counterpart.
  {
    en: 'affirmations-to-fall-asleep-to',
    es: 'afirmaciones-para-dormir-con-calma',
  },
];

const BASE = 'https://aniccaai.com';

function urlFor(locale: 'en' | 'ja' | 'es', slug: string): string {
  if (locale === 'en') return `${BASE}/affirmation-app/a/${slug}`;
  if (locale === 'ja') return `${BASE}/affirmation-app/ja/a/${slug}`;
  return `${BASE}/affirmation-app/es/a/${slug}`;
}

function tripleSlugs(t: { en: string; ja?: string; es: string }): AffirmationLocaleSlugs {
  return t.ja ? { en: t.en, ja: t.ja, es: t.es } : { en: t.en, es: t.es };
}

export function tripleForEnSlug(enSlug: string): AffirmationLocaleSlugs | undefined {
  const t = AFFIRMATION_HREFLANG_TRIPLES.find((row) => row.en === enSlug);
  return t ? tripleSlugs(t) : undefined;
}

export function tripleForJaSlug(jaSlug: string): AffirmationLocaleSlugs | undefined {
  const t = AFFIRMATION_HREFLANG_TRIPLES.find((row) => row.ja === jaSlug);
  return t ? tripleSlugs(t) : undefined;
}

export function tripleForEsSlug(esSlug: string): AffirmationLocaleSlugs | undefined {
  const t = AFFIRMATION_HREFLANG_TRIPLES.find((row) => row.es === esSlug);
  return t ? tripleSlugs(t) : undefined;
}

/**
 * Build alternates.languages for a page. Only includes locales that have a slug.
 * Always includes the self locale; x-default points at the EN URL when EN exists.
 */
export function alternatesFor(slugs: AffirmationLocaleSlugs): Record<string, string> {
  const languages: Record<string, string> = {};
  if (slugs.en) languages.en = urlFor('en', slugs.en);
  if (slugs.ja) languages.ja = urlFor('ja', slugs.ja);
  if (slugs.es) languages.es = urlFor('es', slugs.es);
  if (slugs.en) languages['x-default'] = urlFor('en', slugs.en);
  return languages;
}
