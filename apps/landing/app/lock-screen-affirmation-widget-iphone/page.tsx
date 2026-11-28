import type { Metadata } from "next";
import Link from "next/link";
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
// The article's own meta description, verbatim (served on the page today).
const DESCRIPTION =
  "Learn how to easily add uplifting affirmations to your iPhone Lock Screen with the Anicca app, keeping positivity in sight throughout your day.";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const metadata = (await blogGenerateMetadata({
    params: { slug: SLUG },
  })) as Metadata;
  return {
    ...metadata,
    title: TITLE,
    description:
      typeof metadata.description === "string" && metadata.description
        ? metadata.description
        : DESCRIPTION,
    alternates: {
      ...(metadata.alternates ?? {}),
      canonical: CANONICAL,
      // GEO parity (audit 2026-11-25 18:00: this page scored 84/100 with
      // meta 7/11 — has_og_title/has_og_description/has_og_image all false —
      // signals has_rss=false, and brand_entity has_about_link=false).
      // The RSS type and og:image mirror app/layout.tsx and the /account
      // pattern (the real /feed.xml and the real app icon, 1024x1024).
      types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
    },
    openGraph: {
      title: TITLE,
      description:
        typeof metadata.description === "string" && metadata.description
          ? metadata.description
          : DESCRIPTION,
      url: CANONICAL,
      siteName: "Anicca",
      type: "website",
      images: [
        {
          url: "https://aniccaai.com/anicca-app-icon.png",
          width: 1024,
          height: 1024,
          alt: "Anicca app icon",
        },
      ],
    },
  };
}

export default async function LockScreenAffirmationWidgetHowToPage() {
  const content = await ResearchPostPage({ params: { slug: SLUG } });
  return (
    <>
      {content}
      <footer style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <Link href="/home-screen-affirmation-widget-iphone">
          How to add an affirmation widget to your iPhone Home Screen →
        </Link>
        <br />
        <Link href="/standby-affirmations-iphone">
          How to show affirmations in iPhone StandBy mode →
        </Link>
        <br />
        <Link href="/lock-screen-affirmations-iphone">
          Lock screen affirmations: the complete guide →
        </Link>
        <br />
        <Link href="/about">About Anicca →</Link>
      </footer>
    </>
  );
}
