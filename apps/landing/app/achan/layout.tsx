import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アニッチャ・リセット - 49の無常レッスン | Anicca",
  description:
    "49の短章で学ぶ無常の教え。各章は1つのパーリ語の概念、1つの現代的な言い換え、今夜できる1つの実践。PDF・即時お届け・永久アクセス。",
  alternates: { canonical: "https://aniccaai.com/achan" },
  openGraph: {
    title: "アニッチャ・リセット - 49の無常レッスン",
    description: "49の短章で学ぶ無常の教え。今夜できる実践つきのPDF電子書籍。",
    url: "https://aniccaai.com/achan",
    siteName: "Anicca",
    type: "website",
  },
};

export default function AchanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
