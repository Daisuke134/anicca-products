import type { Metadata } from "next";
import Link from "next/link";
import ResearchPostPage, {
  generateMetadata as blogGenerateMetadata,
} from "../blog/[slug]/page";

// PK-SEO3 (anicca-ops 2026-11-28): the how-to article lives in
// data/research/standby-affirmations-iphone.json and is also served at
// /blog/<slug>. This route publishes it at the root URL the SEO brief asks for,
// /standby-affirmations-iphone, and makes that the canonical URL.
// Claims are limited to what the shipping widget declares: AniccaWidget.swift
// supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular]).
// StandBy uses the .systemSmall widget (Apple: "WidgetKit uses your
// WidgetFamily.systemSmall widget and scales it to fit"), so Anicca's small
// widget does appear in StandBy; medium is Home Screen only.
// Sibling of PK-SEO1 (/lock-screen-affirmation-widget-iphone) and
// PK-SEO2 (/home-screen-affirmation-widget-iphone).
const SLUG = "standby-affirmations-iphone";
const CANONICAL = `https://aniccaai.com/${SLUG}`;
const TITLE = "How to Show Affirmations in iPhone StandBy Mode";
const DESCRIPTION =
  "Step-by-step guide to putting a daily affirmation on your iPhone StandBy screen (iOS 17/18) — the small Anicca widget, enabled StandBy, and the settings that keep it visible while charging.";

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
      // GEO parity with the PK-SEO1/PK-SEO2 how-to routes (RSS type +
      // og:image from the real /feed.xml and the real 1024x1024 app icon).
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

export default async function StandByAffirmationsHowToPage() {
  const content = await ResearchPostPage({ params: { slug: SLUG } });
  return (
    <>
      {content}
      <footer style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <Link href="/lock-screen-affirmation-widget-iphone">
          How to put an affirmation on your iPhone Lock Screen →
        </Link>
        <br />
        <Link href="/home-screen-affirmation-widget-iphone">
          How to add an affirmation widget to your iPhone Home Screen →
        </Link>
        <br />
        <Link href="/about">About Anicca →</Link>
      </footer>
    </>
  );
}
