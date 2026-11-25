import type { Metadata } from "next";
import type { ReactNode } from "react";

// GEO parity (audit 2026-11-26 02:00: /monk scored 74/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/monk/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it. Title and description are
// the page's own Book schema words, kept verbatim: name
// "The Anicca Reset - 49 Lessons in Impermanence" and its description.
// Canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024).
const MONK_TITLE = "The Anicca Reset - 49 Lessons in Impermanence";
const MONK_DESCRIPTION =
  "49 short chapters. Each chapter pairs one Pali term with one modern reframe and one practice. Theravada wisdom meets the neuroscience of emotion: the 90-second rule, memory reconsolidation, the witness practice. PDF, instant delivery, lifetime access.";

export const metadata: Metadata = {
  title: MONK_TITLE,
  description: MONK_DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/monk",
    types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
  },
  openGraph: {
    title: MONK_TITLE,
    description: MONK_DESCRIPTION,
    url: "https://aniccaai.com/monk",
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

export default function MonkLayout({ children }: { children: ReactNode }) {
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
