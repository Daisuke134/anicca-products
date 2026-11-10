// Keeps the RapidAPI Apple RSS proxy cache (Netlify Blobs) warm for common feeds.
import { fetchUpstream } from './rapidapi-apple-rss.mjs';
const COUNTRIES = ['jp', 'us', 'gb', 'kr', 'cn', 'de', 'fr', 'ca', 'au', 'in'];
const FEEDS = ['top-free', 'top-paid'];
const LIMITS = [10, 25, 50, 100];
export default async () => {
  const jobs = [];
  for (const c of COUNTRIES) for (const f of FEEDS) for (const n of LIMITS) jobs.push(`/api/v2/${c}/apps/${f}/${n}/apps.json`);
  const res = await Promise.allSettled(jobs.map((p) => fetchUpstream(p)));
  const ok = res.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
  console.log(`apple-rss warm ${ok}/${jobs.length}`);
  return new Response(`ok ${ok}/${jobs.length}`);
};
export const config = { schedule: '*/10 * * * *' };
