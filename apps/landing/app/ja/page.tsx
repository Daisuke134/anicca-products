import type { Metadata } from "next";
import ManagerHome from "@/components/site/ManagerHome";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "成田大祐です。苦しみを減らすためのアプリを作っています。時間を整えるLife Managerと、毎日のアファメーションアプリAnicca。";

export const metadata: Metadata = {
  title: "Anicca｜成田大祐がつくる、苦しみを減らすアプリ（Life Manager・アファメーション）",
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
    title: "Anicca｜成田大祐がつくる、苦しみを減らすアプリ（Life Manager・アファメーション）",
    description: DESCRIPTION,
    url: "https://aniccaai.com/ja",
    type: "website",
    locale: "ja_JP",
    alternateLocale: ["en_US"],
    siteName: "Anicca",
  },
  twitter: {
    card: "summary",
    title: "Anicca｜成田大祐がつくる、苦しみを減らすアプリ（Life Manager・アファメーション）",
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
      <ManagerHome locale="ja" />
    </>
  );
}
