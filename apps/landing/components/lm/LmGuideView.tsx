'use client';

import { useEffect } from 'react';

// Sends one lm_guide_view per visit with ?ct= (see netlify/functions/lm-guide-view.js).
export default function LmGuideView() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = new URLSearchParams({ ct: p.get('ct') || 'none', path: window.location.pathname, ref: document.referrer || '' });
    for (const k of ['utm_source', 'utm_campaign']) { const v = p.get(k); if (v) q.set(k, v); }
    fetch(`/.netlify/functions/lm-guide-view?${q}`, { keepalive: true, credentials: 'omit' }).catch(() => {});
  }, []);
  return null;
}
