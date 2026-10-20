export function buildArticleJsonLd(post: {
  slug: string; title: string; date: string; markdown?: string; access_model?: string | null;
}): Record<string, unknown>[];
