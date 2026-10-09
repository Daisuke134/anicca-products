/** App Store Connect provider token. Empty until known; then append as `pt=`. */
export const APP_STORE_PT = '';

export const ANICCA_APP_ID = '6755129214';

export function buildWallpaperAppStoreUrl(opts: {
  ct: string;
  utmContent: string;
  utmTerm?: string | null;
}): string {
  const u = new URL(`https://apps.apple.com/jp/app/id${ANICCA_APP_ID}`);
  u.searchParams.set('ct', opts.ct);
  u.searchParams.set('mt', '8');
  u.searchParams.set('utm_source', 'aniccaai');
  u.searchParams.set('utm_medium', 'tool');
  u.searchParams.set('utm_campaign', 'wallpaper_maker');
  u.searchParams.set('utm_content', opts.utmContent);
  if (opts.utmTerm) u.searchParams.set('utm_term', opts.utmTerm);
  if (APP_STORE_PT) u.searchParams.set('pt', APP_STORE_PT);
  return u.toString();
}

/** Read inbound utm_source from the current page (for utm_term handoff). */
export function inboundUtmSource(search?: string): string | null {
  if (typeof window === 'undefined' && !search) return null;
  const q = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const v = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q).get('utm_source');
  return v && v.trim() ? v.trim() : null;
}
