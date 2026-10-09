#!/usr/bin/env node
/**
 * Manual IndexNow ping for aniccaai.com.
 * Same payload as netlify/functions/deploy-succeeded.js.
 */
const HOST = 'aniccaai.com';
const KEY = '92ec974b25b70513c2cbc172f532bb3b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10_000;

function collectLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    locs.push(match[1].trim());
    if (locs.length >= MAX_URLS) break;
  }
  return [...new Set(locs)];
}

async function main() {
  const sitemapRes = await fetch(SITEMAP_URL);
  if (!sitemapRes.ok) {
    console.error(`sitemap fetch failed: ${sitemapRes.status}`);
    process.exitCode = 1;
    return;
  }
  const xml = await sitemapRes.text();
  const urlList = collectLocs(xml);
  console.log(`collected ${urlList.length} URLs from sitemap`);

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  console.log(`IndexNow status: ${res.status}`);
  if (text) console.log(text.slice(0, 500));
  if (!res.ok && res.status !== 202) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
