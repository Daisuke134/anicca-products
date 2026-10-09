import type { MetadataRoute } from "next";
import { loadAllBlogPosts } from "@/lib/blog-posts";
import { JA_AFFIRMATION_PROBLEMS } from "@/lib/ja-affirmation-problems";
import { allKokoroTypeIds } from "@/lib/kokoro-quiz";
import { LM_JA_GUIDES } from "@/lib/lm-ja-guides";

const BASE_URL = "https://aniccaai.com";

// Static top-level pages that were previously hand-maintained in public/sitemap.xml.
const STATIC_PATHS = [
  "/affirmation-app-alternative/",
  "/affirmation-app/ja/wallpaper",
  "/affirmation-app/ja/shindan",
  "/ai-cafe-tokyo/",
  "/ai-grave/",
  "/lm",
  "/lm/ja",
  "/lm/ja/departure-calculator",
  "/lm/guide",
  "/affirmation-app",
  "/affirmation-app/ja",
  "/affirmation-app/ja/a",
  "/honne",
  "/honne/ja",
  "/honne/support",
  "/honne/privacy",
  "/honne/privacy/ja",
  "/dais",
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

  const kokoroTypeEntries: MetadataRoute.Sitemap = allKokoroTypeIds().map((type) => ({
    url: `${BASE_URL}/affirmation-app/ja/shindan/${type}`,
  }));

  return [
    ...staticEntries,
    ...jaAffirmationEntries,
    ...kokoroTypeEntries,
    ...lmGuideEntries,
    ...blogEntries,
  ];
}
