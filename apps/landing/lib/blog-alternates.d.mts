export const BLOG_LANG_NAMES: Record<string, string>;
export function blogLangName(code: string): string;
export function pairSuffixOf(slug: string): { self: string; other: string; base: string } | null;
export function blogPairLanguages(
  slug: string,
  exists: (slug: string) => boolean,
  site?: string,
): Record<string, string> | undefined;
