"use client";

import DashboardClient from "@/components/launch/DashboardClient";

// Root /dashboard — EN default with root-style nav (non-localized). Localized variants
// live at /en/dashboard and /ja/dashboard. The build-time snapshot seed + live fetch are
// preserved inside DashboardClient. Metadata is set in app/dashboard/layout.tsx.
export default function DashboardPage() {
  return <DashboardClient lang="en" rootNav />;
}
