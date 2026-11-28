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


// GEO (anicca-geo-improvement-hourly 2026-11-28): visible FAQ + FAQPage for
// this how-to page. Every answer is built ONLY from facts already stated in
// the article itself (data/research/standby-affirmations-iphone.json,
// served on this page): the iOS 17 requirement, the charger requirement,
// the six steps, Night mode, the Small-widget note, the troubleshooting
// notes, and the free-download / 3-day-trial line.
// The visible FAQ and the FAQPage JSON-LD are generated from this one array,
// so they always match verbatim.
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "How do I show affirmations in iPhone StandBy mode?",
    answer:
      "Turn StandBy on in Settings, then StandBy, and check that it is enabled (it is on by default on iOS 17 and later). Open Anicca once and answer the short questions so the app picks your first affirmation. Put the iPhone on a charger and turn it sideways; with the screen locked in landscape, StandBy appears after a moment. Swipe to the widgets screen, touch and hold the widget area, tap the \"+\" button, search for \"Anicca\", and pick the Small size. Tap \"Add Widget\" and place it where you want it.",
  },
  {
    question: "What do I need to use StandBy affirmations on iPhone?",
    answer:
      "An iPhone on iOS 17 or later (StandBy arrived in iOS 17; there is no StandBy on iOS 16 or earlier), the Anicca app installed and opened once so the widget has an affirmation to show, and a charger: StandBy appears while the iPhone is charging.",
  },
  {
    question: "Which widget size does StandBy use for affirmations?",
    answer:
      "StandBy shows the small widget and iOS enlarges it to fill the screen, so the size you already use on the Home Screen is the same widget here. There is no extra setup: the small widget Anicca already builds for the Home Screen is the one StandBy displays. Keep the words short: the small size fits a short line; the medium size is for the Home Screen.",
  },
  {
    question: "Why does nothing appear in StandBy, or why is my widget blank?",
    answer:
      "If nothing appears on the charger, check that StandBy is enabled in Settings, that the iPhone is locked and in landscape, and that the charger is connected. If Anicca is missing from the widget list, open the app once, update it from the App Store, and try again. If the widget is blank, open Anicca once and give iOS a minute; widgets refresh on the system's own schedule.",
  },
  {
    question: "Is the Anicca affirmation widget free?",
    answer:
      "Anicca is a free download with a 3-day trial for the full set of affirmations and reminders.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default async function StandByAffirmationsHowToPage() {
  const content = await ResearchPostPage({ params: { slug: SLUG } });
  return (
    <>
      {content}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <section
        style={{ maxWidth: "42rem", margin: "0 auto", padding: "2rem 1rem" }}
      >
        <h2>Frequently asked questions</h2>
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
      <footer style={{ padding: "2rem 1rem", textAlign: "center" }}>
        <Link href="/lock-screen-affirmation-widget-iphone">
          How to put an affirmation on your iPhone Lock Screen →
        </Link>
        <br />
        <Link href="/home-screen-affirmation-widget-iphone">
          How to add an affirmation widget to your iPhone Home Screen →
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
