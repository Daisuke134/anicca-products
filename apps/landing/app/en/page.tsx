import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "I'm Daisuke Narita (成田大祐). I build tools that quietly take suffering off your plate: Life Manager for your time, and Anicca, a daily affirmation app for a kinder inner voice.";

export const metadata: Metadata = {
  title: "Anicca by Daisuke Narita — Life Manager and daily affirmation apps",
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
    title: "Anicca by Daisuke Narita — Life Manager and daily affirmation apps",
    description: DESCRIPTION,
    url: "https://aniccaai.com/en",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    siteName: "Anicca",
  },
  twitter: {
    card: "summary",
    title: "Anicca by Daisuke Narita — Life Manager and daily affirmation apps",
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
            founder: {
              "@type": "Person",
              name: "Daisuke Narita",
              alternateName: "成田大祐",
              url: "https://aniccaai.com/dais",
              sameAs: ["https://github.com/Daisuke134"],
            },
          },
        }}
      />
      <ManagerHome locale="en" />
    </>
  );
}
