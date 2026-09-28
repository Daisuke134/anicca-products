import fs from "fs";
import path from "path";

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  preview: string;
};

const RESEARCH_DIR = path.join(process.cwd(), "data", "research");
const WRITER_DIR = path.join(process.cwd(), "private", "writer-articles");

function dateFromRunId(runId: string): string {
  const day = runId.slice(0, 8);
  return `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
}

/** Every published /blog/<slug> post, deduped, for sitemap + feed generation. */
export function loadAllBlogPosts(): BlogPostMeta[] {
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
        if (posts.has(raw.slug)) continue;
        posts.set(raw.slug, {
          slug: raw.slug,
          title: raw.title,
          date: dateFromRunId(String(raw.run_id)),
          preview: typeof raw.preview_markdown === "string" ? raw.preview_markdown.slice(0, 280) : "",
        });
      } catch {
        // skip malformed / unreadable
      }
    }
  }

  return [...posts.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
