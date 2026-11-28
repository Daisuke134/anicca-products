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


// GEO (anicca-geo-improvement-hourly 2026-11-28): visible FAQ + FAQPage for
// this how-to page. Every answer is built ONLY from facts already stated in
// the article itself (data/research/home-screen-affirmation-widget-iphone.json,
// served on this page): the iOS requirement, the six steps, the two widget
// sizes, the troubleshooting notes, and the free-download / 3-day-trial line.
// The visible FAQ and the FAQPage JSON-LD are generated from this one array,
// so they always match verbatim.
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question:
      "How do I add an affirmation widget to my iPhone Home Screen?",
    answer:
      'Open Anicca once and answer the short questions so the app picks your first affirmation. Then go to your Home Screen and long-press an empty spot until the icons start to jiggle. Tap "Edit" (top left), then "Add Widget" \u2014 on older iOS versions this is the "+" button. Search for "Anicca" in the widget gallery, swipe to pick a size, tap "Add Widget", drag it where your thumb lands most often, then tap "Done". The whole guide takes about one minute.',
  },
  {
    question:
      "What do I need to put an affirmation widget on my iPhone Home Screen?",
    answer:
      "An iPhone on iOS 17 or later (iOS 16 works the same way for Home Screen widgets), and the Anicca app, installed and opened once so the widget has words to show. The widget shows the same words the app chose for you.",
  },
  {
    question: "Which widget size is best for an affirmation widget?",
    answer:
      "Small fits one short line. Medium fits a longer affirmation and is the easiest to read at a glance. If the text is too small, switch from Small to Medium.",
  },
  {
    question:
      "Why is my affirmation widget blank, or why is Anicca not in the widget gallery?",
    answer:
      "If the widget is blank, open Anicca once, then wait a minute; iOS refreshes widgets on its own schedule. If Anicca is not in the gallery, update the app from the App Store and restart your iPhone.",
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

export default async function HomeScreenAffirmationWidgetHowToPage() {
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
        <Link href="/lock-screen-affirmations-iphone">
          Lock screen affirmations: the complete guide →
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
