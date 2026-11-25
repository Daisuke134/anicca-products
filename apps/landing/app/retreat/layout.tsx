import type { Metadata } from "next";
import type { ReactNode } from "react";

// GEO parity (audit 2026-11-26 03:00: /retreat scored 86/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/retreat/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it. Title and description are
// the page's own Service schema words, kept verbatim: name
// "Anicca Retreat" and its description. Canonical is this page's own
// real URL; the RSS type and og:image mirror app/layout.tsx (the real
// /feed.xml and the real app icon, 1024x1024).
const RETREAT_TITLE = "Anicca Retreat";
const RETREAT_DESCRIPTION =
  "A silent, Vipassana-style meditation retreat organised by Anicca in Japan - built around the single observation of impermanence (anicca).";

export const metadata: Metadata = {
  title: RETREAT_TITLE,
  description: RETREAT_DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/retreat",
    types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
  },
  openGraph: {
    title: RETREAT_TITLE,
    description: RETREAT_DESCRIPTION,
    url: "https://aniccaai.com/retreat",
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

export default function RetreatLayout({ children }: { children: ReactNode }) {
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
