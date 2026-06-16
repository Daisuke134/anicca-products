"use client";

import DashboardClient from "@/components/launch/DashboardClient";
import type { LaunchLocale } from "@/lib/launch-dict";

// Localized /en/dashboard + /ja/dashboard. Client component (live fetch + snapshot seed).
// In Next 14.2.5, a "use client" page receives `params` as a plain object.
// Metadata is set in app/[lang]/dashboard/layout.tsx (cannot live in a "use client" page).
export default function DashboardPage({ params }: { params: { lang: LaunchLocale } }) {
  const lang: LaunchLocale = params.lang === "ja" ? "ja" : "en";
  return <DashboardClient lang={lang} />;
}
