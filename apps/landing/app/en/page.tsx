import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";
import Link from "next/link";

const KEY_LINKS: [string, string][] = [
  ["/affirmation-app", "Anicca: daily affirmation app for iPhone"],
  ["/best-affirmation-apps", "Best affirmation apps compared"],
  ["/guides/", "Guides"],
  ["/guides/best-free-affirmation-app-iphone/", "Best free affirmation app for iPhone"],
  ["/guides/compare/affirmation-apps/", "Affirmation apps compared"],
  ["/guides/compare/gratitude-journal-apps/", "Gratitude journal apps compared"],
  ["/guides/compare/text-message-interpreter-apps/", "Text message interpreter apps compared"],
  ["/affirmation-app-faq/", "Anicca FAQ"],
  ["/honne", "Honne: what does this text really mean?"],
  ["/thankful", "Thankful: simple gratitude journal"],
  ["/lm", "Life Manager"],
  ["/lm/guide", "Life Manager guides"],
  ["/tools/social-jet-lag-calculator", "Social jet lag calculator"],
  ["/blog", "All articles"],
];

const DESCRIPTION =
  "Anicca is a company run entirely by AI agents. Its products quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.";

export const metadata: Metadata = {
  title: "Anicca, an agent-run company — Life Manager and daily affirmation apps",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/en",
    languages: {
      en: "https://aniccaai.com/en",
      ja: "https://aniccaai.com/ja",
      "x-default": "https://aniccaai.com/en",
    },
  },
  openGraph: {
    title: "Anicca, an agent-run company — Life Manager and daily affirmation apps",
    description: DESCRIPTION,
    url: "https://aniccaai.com/en",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    siteName: "Anicca",
  },
  twitter: {
    card: "summary",
    title: "Anicca, an agent-run company — Life Manager and daily affirmation apps",
    description: DESCRIPTION,
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Anicca",
          url: "https://aniccaai.com/en",
          description: DESCRIPTION,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: "Anicca",
            url: "https://aniccaai.com",
            logo: "https://aniccaai.com/anicca-app-icon.png",
          },
        }}
      />
      <ManagerHome locale="en" />
      <nav aria-label="Apps and guides" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Apps and guides</h2>
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8, listStyle: "none", padding: 0 }}>
          {KEY_LINKS.map(([href, label]) => (
            <li key={href}><Link href={href}>{label}</Link></li>
          ))}
        </ul>
      </nav>
    </>
  );
}
