// Netlify event-triggered function: runs after each successful deploy.
// Pings IndexNow with all sitemap URLs when context === "production".
// Never throws — a failed ping must not fail the deploy pipeline.

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

function parsePayload(event) {
  try {
    const raw = event && event.body ? event.body : '{}';
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    // Classic event functions wrap the deploy object; some runtimes nest under payload.
    return parsed.payload || parsed;
  } catch {
    return {};
  }
}

exports.handler = async function deploySucceeded(event) {
  try {
    const payload = parsePayload(event);
    const context = payload.context || (payload.deploy && payload.deploy.context);
    if (context !== 'production') {
      console.log(`IndexNow skip: context=${context || 'unknown'}`);
      return { statusCode: 200, body: 'skipped' };
    }

    const sitemapRes = await fetch(SITEMAP_URL);
    if (!sitemapRes.ok) {
      console.log(`IndexNow sitemap fetch status: ${sitemapRes.status}`);
      return { statusCode: 200, body: 'sitemap_fetch_failed' };
    }
    const xml = await sitemapRes.text();
    const urlList = collectLocs(xml);
    console.log(`IndexNow collected ${urlList.length} URLs`);

    const pingRes = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });
    console.log(`IndexNow ping HTTP status: ${pingRes.status}`);
    return { statusCode: 200, body: `indexnow:${pingRes.status}` };
  } catch (err) {
    console.log(`IndexNow error (swallowed): ${err && err.message ? err.message : err}`);
    return { statusCode: 200, body: 'indexnow_error' };
  }
};
