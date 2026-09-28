import type { MetadataRoute } from "next";
import { loadAllBlogPosts } from "@/lib/blog-posts";

const BASE_URL = "https://aniccaai.com";

// Static top-level pages that were previously hand-maintained in public/sitemap.xml.
const STATIC_PATHS = [
  "/affirmation-app-alternative/",
  "/ai-cafe-tokyo/",
  "/ai-grave/",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE_URL}${p}`,
  }));

  const blogEntries: MetadataRoute.Sitemap = loadAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date || undefined,
  }));

  return [...staticEntries, ...blogEntries];
}
