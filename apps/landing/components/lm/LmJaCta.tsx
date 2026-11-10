'use client';

import { useEffect, useState } from 'react';
import { LIFE_MANAGER_WEB_APP_URL, lifeManagerCtaHref } from '@/lib/writer-cta-url';

// Primary CTA for the Japanese Life Manager surfaces (/lm/ja, /lm/guide/*).
// Same first-party Cloud entry as /lm (LmBody), with bounded campaign attribution.
// Visitor UTMs win; when none are present we tag the click with this page's defaults.
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export default function LmJaCta({
  campaign,
  content,
  label = 'Life Manager Cloudを始める',
  className,
}: {
  campaign: string;
  content: string;
  label?: string;
  className?: string;
}) {
  const fallback = new URLSearchParams({
    utm_source: 'aniccaai',
    utm_medium: 'seo',
    utm_campaign: campaign,
    utm_content: content,
  });
  const [href, setHref] = useState(`${LIFE_MANAGER_WEB_APP_URL}&${fallback.toString()}`);
  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    const hasUtm = UTM_KEYS.some((k) => params.has(k));
    setHref(lifeManagerCtaHref(hasUtm ? search : `?${fallback.toString()}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <a
      href={href}
      className={
        className ??
        'inline-flex items-center justify-center rounded-pill bg-[hsl(var(--gold))] px-7 py-3 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0'
      }
    >
      {label}
    </a>
  );
}
