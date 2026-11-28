import type { Metadata } from "next";
import Link from "next/link";
import ResearchPostPage, {
  generateMetadata as blogGenerateMetadata,
} from "../blog/[slug]/page";

// PK-SEO4 (anicca-ops 2026-11-28): the how-to article lives in
// data/research/lock-screen-affirmations-iphone.json and is also served at
// /blog/<slug>. This route publishes it at the root URL the SEO brief asks for,
// /lock-screen-affirmations-iphone, and makes that the canonical URL.
// Claims are limited to what the shipping widget declares:
// AniccaWidget.swift supportedFamilies([.systemSmall, .systemMedium,
// .accessoryRectangular]) — so on the Lock Screen only the rectangular
// accessory widget exists, and the Lock Screen view draws just the line
// (NudgeWidgetLockScreenView has no emoji and no "— Anicca" line).
// Siblings: PK-SEO1 (/lock-screen-affirmation-widget-iphone, the short
// walkthrough this guide links to), PK-SEO2 (Home Screen) and PK-SEO3
// (StandBy). This page targets the "lock screen affirmations" head intent and
// keeps its angle on the accessory-slot mechanics so it does not repeat the
// PK-SEO1 walkthrough.
const SLUG = "lock-screen-affirmations-iphone";
const CANONICAL = `https://aniccaai.com/${SLUG}`;
const TITLE = "Lock Screen Affirmations for iPhone: A Complete Guide";
const DESCRIPTION =
  "Everything about affirmations on an iPhone Lock Screen: the one widget size Anicca actually makes, the exact steps on iOS 16.6+, how the line changes each day, Always-On dimming, extra Lock Screens, and fixes when the widget stays blank.";

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
      // GEO parity with the PK-SEO1/PK-SEO2/PK-SEO3 how-to routes (RSS type +
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

// GEO: visible FAQ + FAQPage for this how-to page. Every answer is built ONLY
// from facts already stated in the article itself
// (data/research/lock-screen-affirmations-iphone.json, served on this page):
// the iOS 16.6 requirement, the rectangular accessory widget, the line-per-day
// behaviour, the Always-On and extra-Lock-Screen notes, the troubleshooting
// list, and the free-download / 3-day-trial line. The visible FAQ and the
// FAQPage JSON-LD are generated from this one array, so they always match.
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "How do I add lock screen affirmations to my iPhone?",
    answer:
      "Open Anicca once and answer the short questions so the app picks your first affirmation. Wake the iPhone and touch and hold the Lock Screen, tap \"Customize\", then \"Lock Screen\". Tap the widget row under the clock, choose Anicca from the gallery (or search for it), pick the rectangular widget, tap \"Add Widget\", and tap \"Done\". The whole guide takes about two minutes.",
  },
  {
    question: "Which widget size do Lock Screen affirmations use?",
    answer:
      "The Lock Screen uses the rectangular accessory widget that sits in the row under the clock. Anicca makes three widget sizes — Small and Medium for the Home Screen and that one rectangle for the Lock Screen — and there is no circular or inline Anicca widget. The rectangle takes two of the row's four cells, so it may sit beside two circular widgets or need another rectangle removed first.",
  },
  {
    question: "Does the lock screen affirmation change during the day?",
    answer:
      "The line holds for the day and a new one is picked the next day, drawn from the affirmations for the worry you chose when you answered the app's questions. It reads like today's note rather than a feed.",
  },
  {
    question: "Why is my lock screen affirmation widget blank or missing?",
    answer:
      "If Anicca is missing from the widget list, open the app once and update it from the App Store. If the row will not take the rectangle, the cells are already taken — remove another rectangular widget or move a circular one. If the widget is there but blank, open Anicca once and wait a minute: the widget draws its text from what the app stored and iOS decides when it refreshes. If nothing changed at all, check that you edited the Lock Screen rather than the Home Screen and that you tapped \"Done\".",
  },
  {
    question: "Is Anicca free?",
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

export default async function LockScreenAffirmationsHowToPage() {
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
          How to put an affirmation on your iPhone Lock Screen (quick
          walkthrough) →
        </Link>
        <br />
        <Link href="/home-screen-affirmation-widget-iphone">
          How to add an affirmation widget to your iPhone Home Screen →
        </Link>
        <br />
        <Link href="/standby-affirmations-iphone">
          How to show affirmations in iPhone StandBy mode →
        </Link>
        <br />
        <Link href="/about">About Anicca →</Link>
      </footer>
    </>
  );
}
