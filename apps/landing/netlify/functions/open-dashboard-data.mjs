import { getStore } from '@netlify/blobs';
import baseData from '../../public/open/data.json' with { type: 'json' };
import { readAppStoreAnalytics } from './_lib/open-asc-store.mjs';

export default async request => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'method not allowed' }, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  let analytics = baseData.app_store_analytics ?? null;
  let analyticsStatus = 'last-deployed-snapshot';
  try {
    const live = await readAppStoreAnalytics(getStore('open-dashboard-analytics'));
    if (live) {
      analytics = live;
      analyticsStatus = 'live-snapshot';
    }
  } catch {}
  const body = JSON.stringify({ ...baseData, app_store_analytics: analytics, app_store_analytics_status: analyticsStatus });
  return new Response(request.method === 'HEAD' ? null : body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
};
