/** App Store Connect provider token (Campaign link `pt=`). */
export const APP_STORE_PT = '93486075';

export const ANICCA_APP_ID = '6755129214';

/** Default campaign token for the wallpaper maker CTAs. */
export const WALLPAPER_APP_STORE_CT = 'wallpaper_tool';

/** Campaign token for 心のクセ診断 CTAs. */
export const SHINDAN_APP_STORE_CT = 'shindan';

/**
 * App Store CTA for the wallpaper maker.
 * Shape: https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=wallpaper_tool&mt=8
 */
export function buildWallpaperAppStoreUrl(opts?: { ct?: string }): string {
  const u = new URL(`https://apps.apple.com/jp/app/id${ANICCA_APP_ID}`);
  if (APP_STORE_PT) u.searchParams.set('pt', APP_STORE_PT);
  u.searchParams.set('ct', opts?.ct ?? WALLPAPER_APP_STORE_CT);
  u.searchParams.set('mt', '8');
  return u.toString();
}

/**
 * App Store CTA for 心のクセ診断.
 * Shape: https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=shindan&mt=8
 */
export function buildShindanAppStoreUrl(): string {
  return buildWallpaperAppStoreUrl({ ct: SHINDAN_APP_STORE_CT });
}

/** Read inbound utm_source from the current page (for utm_term handoff elsewhere). */
export function inboundUtmSource(search?: string): string | null {
  if (typeof window === 'undefined' && !search) return null;
  const q = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const v = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q).get('utm_source');
  return v && v.trim() ? v.trim() : null;
}
