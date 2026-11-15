"use client";

import { useEffect, useState, type ReactNode } from "react";
import { withIncomingCampaign, withLocaleCampaignQuery } from "@/lib/affirmation-campaign";

// Homepage App Store destinations. Each locale keeps its own campaign name so
// homepage traffic stays distinguishable from the /affirmation-app landings.
export const APP_STORE_URL_EN =
  "https://apps.apple.com/app/id6755129214?pt=93486075&ct=home_en&mt=8";
export const APP_STORE_URL_JA =
  "https://apps.apple.com/app/id6755129214?pt=93486075&ct=home_ja&mt=8";

function useIncomingCt(): string | null {
  const [incomingCt, setIncomingCt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ct = new URLSearchParams(window.location.search).get("ct");
    if (ct) setIncomingCt(ct);
  }, []);

  return incomingCt;
}

export function HomeAppStoreCta({
  locale,
  className,
  children,
}: {
  locale: "en" | "ja";
  className?: string;
  children: ReactNode;
}) {
  const incomingCt = useIncomingCt();
  const baseUrl = locale === "ja" ? APP_STORE_URL_JA : APP_STORE_URL_EN;
  const href = withIncomingCampaign(baseUrl, incomingCt);

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

export function HomeLocaleLink({
  to,
  className,
  children,
}: {
  to: "/en" | "/ja";
  className?: string;
  children: ReactNode;
}) {
  const incomingCt = useIncomingCt();

  return (
    <a className={className} href={withLocaleCampaignQuery(to, incomingCt)}>
      {children}
    </a>
  );
}
