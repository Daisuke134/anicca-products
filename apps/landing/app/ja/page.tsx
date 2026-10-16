import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "世界を理解し、環境を変え、現実から学ぶ。すべての生命が豊かに生きられる世界を目指す人工知能。";

export const metadata: Metadata = {
  title: "マネージャー — 世界を理解し、環境を変える",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/ja",
    languages: {
      en: "https://aniccaai.com/en",
      ja: "https://aniccaai.com/ja",
      "x-default": "https://aniccaai.com/en",
    },
  },
  openGraph: {
    title: "マネージャー — 世界を理解し、環境を変える",
    description: DESCRIPTION,
    url: "https://aniccaai.com/ja",
    type: "website",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
    siteName: "Manager",
  },
  twitter: {
    card: "summary",
    title: "マネージャー — 世界を理解し、環境を変える",
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
          name: "Manager",
          url: "https://aniccaai.com/ja",
          description: DESCRIPTION,
          inLanguage: "ja",
          publisher: {
            "@type": "Organization",
            name: "Anicca",
            url: "https://aniccaai.com",
          },
        }}
      />
      <ManagerHome locale="ja" />
    </>
  );
}
