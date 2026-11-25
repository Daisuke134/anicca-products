import type { Metadata } from "next";
import type { ReactNode } from "react";

// GEO parity (audit 2026-11-25 22:00: /dashboard scored 74/100 with
// G-CANONICAL fail — no rel=canonical — and no visible /about link).
// app/dashboard/page.tsx is a client component, so it cannot export
// metadata; this server layout carries it. Title and description are
// the layout's own pre-existing words, kept verbatim. Canonical is
// this page's own real URL; the RSS type and og:image mirror
// app/layout.tsx (the real /feed.xml and the real app icon, 1024x1024).
const DASHBOARD_TITLE = "Anicca Dashboard — Lineage + Live Numbers";
const DASHBOARD_DESCRIPTION =
  "全 Anicca 個体 (lineage) のリアルタイム指標。各個体の収支/lifeline/wallet 残高を公開。";

export const metadata: Metadata = {
  title: DASHBOARD_TITLE,
  description: DASHBOARD_DESCRIPTION,
  alternates: {
    canonical: "https://aniccaai.com/dashboard",
    types: { "application/rss+xml": "https://aniccaai.com/feed.xml" },
  },
  openGraph: {
    title: DASHBOARD_TITLE,
    description: DASHBOARD_DESCRIPTION,
    url: "https://aniccaai.com/dashboard",
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
