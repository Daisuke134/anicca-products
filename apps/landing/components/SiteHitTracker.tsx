'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ctFromHref, trackEvent, trackPageview } from '@/lib/site-hit';

/**
 * Global cookieless tracker: pageviews on route change + App Store outbound clicks (ct=).
 */
export default function SiteHitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageview(pathname || '/');
  }, [pathname]);

  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const target = ev.target as Element | null;
      if (!target || typeof (target as Element).closest !== 'function') return;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!/apps\.apple\.com/i.test(href)) return;
      trackEvent('app_store_click', { ct: ctFromHref(href) });
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
