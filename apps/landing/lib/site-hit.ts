/**
 * Cookieless first-party hit helper.
 * Posts aggregate pageviews / named events to /.netlify/functions/hit.
 * No cookies, localStorage ids, or fingerprinting.
 */

export type SiteHitEventName =
  | 'quiz_start'
  | 'quiz_complete'
  | 'result_view'
  | 'checkout_click'
  | 'checkout_success'
  | 'app_store_click';

type HitPayload = {
  t: 'pageview' | 'event';
  path?: string;
  event?: SiteHitEventName;
  type?: string;
  utm_source?: string;
  utm_campaign?: string;
  ref?: string;
  ct?: string;
};

const ENDPOINT = '/.netlify/functions/hit';

function attributionFromLocation(search: string): Pick<
  HitPayload,
  'utm_source' | 'utm_campaign' | 'ref' | 'ct'
> {
  try {
    const q = new URLSearchParams(search);
    return {
      utm_source: q.get('utm_source') || undefined,
      utm_campaign: q.get('utm_campaign') || undefined,
      ref: q.get('ref') || undefined,
      ct: q.get('ct') || undefined,
    };
  } catch {
    return {};
  }
}

function send(payload: HitPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const ok = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: 'application/json' }),
      );
      if (ok) return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
      mode: 'cors',
    }).catch(() => {});
  } catch {
    // swallow — analytics must never break UX
  }
}

export function trackPageview(pathname?: string): void {
  if (typeof window === 'undefined') return;
  const path = pathname || window.location.pathname || '/';
  const attr = attributionFromLocation(window.location.search || '');
  send({ t: 'pageview', path, ...attr });
}

export function trackEvent(
  event: SiteHitEventName,
  extra: { type?: string; ct?: string; path?: string } = {},
): void {
  if (typeof window === 'undefined') return;
  const attr = attributionFromLocation(window.location.search || '');
  send({
    t: 'event',
    event,
    path: extra.path || window.location.pathname || '/',
    type: extra.type,
    ct: extra.ct || attr.ct,
    utm_source: attr.utm_source,
    utm_campaign: attr.utm_campaign,
    ref: attr.ref,
  });
}

export function ctFromHref(href: string): string | undefined {
  try {
    const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'https://aniccaai.com');
    return u.searchParams.get('ct') || undefined;
  } catch {
    return undefined;
  }
}
