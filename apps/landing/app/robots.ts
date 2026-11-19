import type { MetadataRoute } from "next";

// AI crawlers are named explicitly (not just the wildcard) so that AI search
// and agent systems can verify they are welcome: GEO audit 2026-11-19 found
// the wildcard-only file scored robots 11/14 with "citation bots not
// explicit". Search/retrieval bots (OAI-SearchBot, PerplexityBot,
// Claude-SearchBot) must never be blocked: AI answers cite what their own
// search retrieves.
const AI_CRAWLERS = [
  // Googlebot and Applebot are listed explicitly because the GEO audit's
  // citation-bot set (OAI-SearchBot, Claude-SearchBot, PerplexityBot,
  // Googlebot, Applebot) requires an explicit rule per bot, not just the
  // wildcard. Their presence here changes nothing about access (all allowed).
  "Googlebot",
  "Applebot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Google-CloudVertexBot",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "Amazonbot",
  "AI2Bot",
  "xAI-Bot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: "https://aniccaai.com/sitemap.xml",
  };
}
