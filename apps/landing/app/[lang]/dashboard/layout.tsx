import type { Metadata } from "next";
import { launchDict, type LaunchLocale } from "@/lib/launch-dict";

export function generateMetadata({ params }: { params: { lang: LaunchLocale } }): Metadata {
  const lang: LaunchLocale = params.lang === "ja" ? "ja" : "en";
  return {
    title: launchDict[lang].dashboard.metaTitle,
    description: launchDict[lang].dashboard.metaDescription,
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
