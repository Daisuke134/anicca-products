import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "Aniccaは、個人・企業・公共機関・AIエージェントに向けた行動予測、反実仮想、許可された支援の基盤モデルManagerを研究開発しています。";

export const metadata: Metadata = {
  title: "Anicca｜Manager 行動予測・反実仮想・介入の研究",
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
    title: "Anicca｜Manager 行動予測・反実仮想・介入の研究",
    description: DESCRIPTION,
    url: "https://aniccaai.com/ja",
    type: "website",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
    siteName: "Anicca",
  },
  twitter: {
    card: "summary",
    title: "Anicca｜Manager 行動予測・反実仮想・介入の研究",
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
          url: "https://aniccaai.com/ja",
          description: DESCRIPTION,
          inLanguage: "ja",
          publisher: {
            "@type": "Organization",
            name: "Anicca",
            url: "https://aniccaai.com",
            logo: "https://aniccaai.com/anicca-app-icon.png",
          },
        }}
      />
      <ManagerHome locale="ja" />
    </>
  );
}
