import { mergeAppStoreAnalytics } from '../../../scripts/open-app-store-analytics.mjs';

export const APP_STORE_SNAPSHOT_KEY = 'app-store-connect';

export async function collectAndStoreAppStoreAnalytics({ store, collect, credentials, seed = null }) {
  const fresh = await collect(credentials);
  if (!fresh?.apps?.length || !fresh.period?.start_date || !fresh.period?.end_date) {
    throw new Error('App Store analytics collection returned an incomplete snapshot');
  }
  const saved = await store.get(APP_STORE_SNAPSHOT_KEY, { type: 'json' });
  const snapshot = mergeAppStoreAnalytics(saved ?? seed, fresh);
  await store.setJSON(APP_STORE_SNAPSHOT_KEY, snapshot);
  return snapshot;
}

export async function readAppStoreAnalytics(store, fallback = null) {
  return await store.get(APP_STORE_SNAPSHOT_KEY, { type: 'json' }) ?? fallback;
}
