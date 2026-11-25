import type { Metadata } from "next";
import type { ReactNode } from "react";

// GEO parity (audit 2026-11-26 01:00: /alarm scored 80/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/alarm/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it. Title and description are
// the page's own words, kept verbatim: its header comment calls it
// "Anicca Alarm: the wake-up call that does not stop until you are up."
// Canonical is this page's own real URL; the RSS type and og:image
// mirror app/layout.tsx (the real /feed.xml and the real app icon,
// 1024x1024).
const ALARM_TITLE = "Anicca Alarm";
const ALARM_DESCRIPTION =
  "the wake-up call that does not stop until you are up";

export const metadata: Metadata = {
  title: ALARM_TITLE,
  description: ALARM_DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/alarm",
    types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
  },
  openGraph: {
    title: ALARM_TITLE,
    description: ALARM_DESCRIPTION,
    url: "https://aniccaai.com/alarm",
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

export default function AlarmLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div style={{ textAlign: "center", padding: "0 20px 32px", background: "#0a0a0c" }}>
        <a href="/about" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b6560" }}>
          About Anicca →
        </a>
      </div>
    </>
  );
}
