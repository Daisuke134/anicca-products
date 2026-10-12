const url = process.argv[2] || process.env.ANICCA_APP_REDIRECT_URL;
if (!url) throw new Error('usage: node app-store-redirect-smoke.mjs <url>');

const response = await fetch(url, {
  redirect: 'manual',
  signal: AbortSignal.timeout(10000),
});
const location = response.headers.get('location');
if (response.status !== 302 || !location) {
  throw new Error(`expected HTTP 302 with Location; received ${response.status}`);
}

const target = new URL(location, url);
if (target.hostname !== 'apps.apple.com' || !target.pathname.endsWith('/id6755129214')) {
  throw new Error(`unexpected App Store destination: ${target.origin}${target.pathname}`);
}
console.log(`PASS HTTP ${response.status} ${target.origin}${target.pathname}`);
