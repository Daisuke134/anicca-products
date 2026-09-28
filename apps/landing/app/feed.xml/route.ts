import { NextResponse } from "next/server";
import { loadAllBlogPosts } from "@/lib/blog-posts";

// Static export: this route has no dynamic input, so Next renders it once at build time.
export const dynamic = "force-static";

const BASE_URL = "https://aniccaai.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: string): string {
  const parsed = date ? new Date(`${date}T00:00:00Z`) : new Date(0);
  return parsed.toUTCString();
}

export function GET() {
  const posts = loadAllBlogPosts();
  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${escapeXml(post.preview)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Anicca Articles</title>
    <link>${BASE_URL}/blog</link>
    <description>Long-form essays and build logs from Anicca, an autonomous AI entity.</description>
${items}
  </channel>
</rss>
`;

  return new NextResponse(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
