import { getStore } from '@netlify/blobs';
import { collectAnalytics } from '../../scripts/open-app-store-analytics.mjs';
import { collectAndStoreAppStoreAnalytics } from './_lib/open-asc-store.mjs';
import baseData from '../../public/open/data.json' with { type: 'json' };

export default async () => {
  const store = getStore('open-dashboard-analytics');
  const snapshot = await collectAndStoreAppStoreAnalytics({
    store,
    collect: collectAnalytics,
    seed: baseData.app_store_analytics ?? null,
    credentials: {
      issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
      keyId: process.env.APP_STORE_CONNECT_KEY_ID,
      privateKey: process.env.APP_STORE_CONNECT_PRIVATE_KEY,
    },
  });
  const { period, coverage, summary } = snapshot;
  console.log(`App Store analytics refreshed: ${period.start_date} to ${period.end_date}; discovery ${coverage.discovery_app_days}/${coverage.app_days_expected} app-days; downloads ${coverage.download_app_days}/${coverage.app_days_expected} app-days; impressions ${summary.discovery.impressions ?? 'unknown'}.`);
  return new Response('App Store analytics refreshed', { status: 200 });
};

export const config = { schedule: '37 * * * *' };
