import fs from "fs";
import path from "path";

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  preview: string;
  project: string;
};



function dateFromRunId(runId: string): string {
  const day = runId.slice(0, 8);
  return `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
}

/** Every published /blog/<slug> post, deduped, for sitemap + feed generation. */
export function loadAllBlogPosts(root = process.cwd()): BlogPostMeta[] {
  const RESEARCH_DIR = path.join(root, "data", "research");
  const WRITER_DIR = path.join(root, "private", "writer-articles");
  const posts = new Map<string, BlogPostMeta>();

  if (fs.existsSync(RESEARCH_DIR)) {
    for (const f of fs.readdirSync(RESEARCH_DIR)) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(RESEARCH_DIR, f), "utf-8"));
        if (!raw.slug || !raw.title) continue;
        posts.set(raw.slug, {
          slug: raw.slug,
          title: raw.title,
          date: raw.date ?? "",
          preview: typeof raw.markdown === "string" ? raw.markdown.slice(0, 280) : "",
          project: typeof raw.project === "string" ? raw.project : "",
        });
      } catch {
        // skip malformed
      }
    }
  }

  if (fs.existsSync(WRITER_DIR)) {
    for (const f of fs.readdirSync(WRITER_DIR)) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(WRITER_DIR, f), "utf-8"));
        if (!raw.slug || !raw.title || !raw.run_id) continue;
        // The article route gives the private writer contract precedence for duplicate slugs.
        posts.set(raw.slug, {
          slug: raw.slug,
          title: raw.title,
          date: dateFromRunId(String(raw.run_id)),
          preview: typeof raw.preview_markdown === "string" ? raw.preview_markdown.slice(0, 280) : "",
          project: typeof raw.project === "string" ? raw.project : "Writer Agent",
        });
      } catch {
        // skip malformed / unreadable
      }
    }
  }

  return [...posts.values()].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export const BLOG_PAGE_SIZE = 24;
export function paginateBlogPosts<T>(posts: T[], value: string) {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const page = Number(value);
  const totalPages = Math.max(1, Math.ceil(posts.length / BLOG_PAGE_SIZE));
  if (!Number.isSafeInteger(page) || page > totalPages) return null;
  return { page, totalPages, posts: posts.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE) };
}
