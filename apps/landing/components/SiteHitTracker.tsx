'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ctFromHref, trackEvent, trackPageview } from '@/lib/site-hit';

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
      const path = window.location.pathname || '/';
      let productId: string | undefined;
      try {
        const stickerUrl = new URL(href, window.location.origin);
        const parts = stickerUrl.pathname.split('/').filter(Boolean);
        if (stickerUrl.protocol === 'https:' && stickerUrl.hostname.toLowerCase() === 'line.me'
            && parts.length === 3 && parts[0].toLowerCase() === 's'
            && parts[1].toLowerCase() === 'sticker' && /^[0-9]{5,12}$/.test(parts[2]))
          productId = parts[2];
      } catch {
        // Ignore malformed outbound URLs.
      }
      if (productId && path.startsWith('/blog/line-sticker-')) {
        const articleSlug = path.slice('/blog/'.length);
        trackEvent('line_sticker_click', { type: productId, ct: articleSlug, path });
      }
      if (!/apps\.apple\.com/i.test(href)) return;
      trackEvent('app_store_click', { ct: ctFromHref(href) });
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
