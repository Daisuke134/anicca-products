import type { Metadata } from "next";
import type { ReactNode } from "react";

// GEO parity (audit 2026-11-25 23:00: /income scored 75/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/income/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it. Title and description are
// the page's own Service schema words, kept verbatim. Canonical is
// this page's own real URL; the RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon, 1024x1024).
const INCOME_TITLE = "Anicca Basic Income";
const INCOME_DESCRIPTION =
  "A live basic income funded by an autonomous AI that earns its own way. No human in the loop, so it does not run dry. Sign up with your email; receive to email, a crypto wallet, or your bank.";

export const metadata: Metadata = {
  title: INCOME_TITLE,
  description: INCOME_DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/income",
    types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
  },
  openGraph: {
    title: INCOME_TITLE,
    description: INCOME_DESCRIPTION,
    url: "https://aniccaai.com/income",
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

export default function IncomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div style={{ textAlign: "center", padding: "0 20px 32px" }}>
        <a href="/about" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6560" }}>
          About Anicca →
        </a>
      </div>
    </>
  );
}
