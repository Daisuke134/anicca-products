import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "Understand the world. Change its conditions. Learn from reality. We are building AI to improve the conditions of life for all living beings.";

export const metadata: Metadata = {
  title: "Manager — Understand the world. Change its conditions.",
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
    title: "Manager — Understand the world. Change its conditions.",
    description: DESCRIPTION,
    url: "https://aniccaai.com/en",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ja_JP"],
    siteName: "Manager",
  },
  twitter: {
    card: "summary",
    title: "Manager — Understand the world. Change its conditions.",
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
          url: "https://aniccaai.com/en",
          description: DESCRIPTION,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: "Anicca",
            url: "https://aniccaai.com",
          },
        }}
      />
      <ManagerHome locale="en" />
    </>
  );
}
