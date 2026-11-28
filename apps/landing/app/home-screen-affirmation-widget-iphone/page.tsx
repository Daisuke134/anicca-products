import type { Metadata } from "next";
import Link from "next/link";
import ResearchPostPage, {
  generateMetadata as blogGenerateMetadata,
} from "../blog/[slug]/page";

// PK-SEO2 (anicca-ops 2026-11-28): the how-to article lives in
// data/research/home-screen-affirmation-widget-iphone.json and is also served at
// /blog/<slug>. This route publishes it at the root URL the SEO brief asks for,
// /home-screen-affirmation-widget-iphone, and makes that the canonical URL.
// Sibling of PK-SEO1 (/lock-screen-affirmation-widget-iphone, live 2026-11-24).
const SLUG = "home-screen-affirmation-widget-iphone";
const CANONICAL = `https://aniccaai.com/${SLUG}`;
const TITLE = "How to Add an Affirmation Widget to Your iPhone Home Screen";
// The article's own meta description, verbatim (served on the page today).
const DESCRIPTION =
  "Step-by-step guide to putting a daily affirmation widget on your iPhone Home Screen (iOS 17/18), choosing a size, and making it change through the day.";

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
      // GEO parity with the PK-SEO1 lock-screen route (RSS type + og:image
      // from the real /feed.xml and the real 1024x1024 app icon).
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

export default async function HomeScreenAffirmationWidgetHowToPage() {
  const content = await ResearchPostPage({ params: { slug: SLUG } });
  return (
    <>
      {content}
      <footer style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <Link href="/lock-screen-affirmation-widget-iphone">
          How to put an affirmation on your iPhone Lock Screen →
        </Link>
        <br />
        <Link href="/about">About Anicca →</Link>
      </footer>
    </>
  );
}
