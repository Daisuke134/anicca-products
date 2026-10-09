import type { MetadataRoute } from "next";
import { loadAllBlogPosts } from "@/lib/blog-posts";
import { allEnAffirmationSlugs } from "@/lib/en-affirmation-problems";
import { JA_AFFIRMATION_PROBLEMS } from "@/lib/ja-affirmation-problems";
import { allKokoroTypeIds } from "@/lib/kokoro-quiz";
import { LM_JA_GUIDES } from "@/lib/lm-ja-guides";

const BASE_URL = "https://aniccaai.com";

// Static top-level pages. Paths must exist (no 404s). No trailing-slash
// duplicates of redirect-only aliases.
const STATIC_PATHS = [
  "/affirmation-app",
  "/affirmation-app/ja",
  "/affirmation-app/ja/a",
  "/affirmation-app/ja/wallpaper",
  "/affirmation-app/ja/shindan",
  "/letter",
  "/tegami",
  "/en",
  "/honne",
  "/honne/ja",
  "/honne/support",
  "/honne/privacy",
  "/honne/privacy/ja",
  "/dais",
  "/ai-cafe-tokyo/",
  "/ai-grave/",
  "/lm",
  "/lm/ja",
  "/lm/ja/departure-calculator",
  "/lm/guide",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE_URL}${p}`,
  }));

  const blogEntries: MetadataRoute.Sitemap = loadAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date || undefined,
  }));

  // Hand-written Japanese Life Manager guides (separate from the Writer's /blog posts).
  const lmGuideEntries: MetadataRoute.Sitemap = LM_JA_GUIDES.map((g) => ({
    url: `${BASE_URL}/lm/guide/${g.slug}`,
    lastModified: g.date,
  }));

  const jaAffirmationEntries: MetadataRoute.Sitemap =
    JA_AFFIRMATION_PROBLEMS.map((problem) => ({
      url: `${BASE_URL}/affirmation-app/ja/a/${problem.slug}`,
    }));

  const enAffirmationEntries: MetadataRoute.Sitemap = allEnAffirmationSlugs().map(
    (slug) => ({
      url: `${BASE_URL}/affirmation-app/a/${slug}`,
    }),
  );

  const kokoroTypeEntries: MetadataRoute.Sitemap = allKokoroTypeIds().map((type) => ({
    url: `${BASE_URL}/affirmation-app/ja/shindan/${type}`,
  }));

  const all = [
    ...staticEntries,
    ...jaAffirmationEntries,
    ...enAffirmationEntries,
    ...kokoroTypeEntries,
    ...lmGuideEntries,
    ...blogEntries,
  ];

  // Deduplicate by URL (defensive).
  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
