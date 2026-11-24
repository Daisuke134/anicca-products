import type { Metadata } from "next";
import ResearchPostPage, {
  generateMetadata as blogGenerateMetadata,
} from "../blog/[slug]/page";

// PK-SEO1 (anicca-ops 2026-11-24): the how-to article lives in
// data/research/lock-screen-affirmation-widget-iphone.json and is also served at
// /blog/<slug>. This route publishes it at the root URL the SEO brief asks for,
// /lock-screen-affirmation-widget-iphone, and makes that the canonical URL.
const SLUG = "lock-screen-affirmation-widget-iphone";
const CANONICAL = `https://aniccaai.com/${SLUG}`;
const TITLE = "How to Put an Affirmation on Your iPhone Lock Screen";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = (await blogGenerateMetadata({
    params: { slug: SLUG },
  })) as Metadata;
  return {
    ...metadata,
    title: TITLE,
    alternates: { ...(metadata.alternates ?? {}), canonical: CANONICAL },
    openGraph: metadata.openGraph
      ? { ...metadata.openGraph, url: CANONICAL, title: TITLE }
      : metadata.openGraph,
  };
}

export default function LockScreenAffirmationWidgetHowToPage() {
  return ResearchPostPage({ params: { slug: SLUG } });
}
