import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const routes = [
  { publicRoute: '/dais', source: 'pages/products-en.html', exportPath: 'dais.html' },
  { publicRoute: '/dais/ja', source: 'pages/products.html', exportPath: 'dais/ja.html' },
];

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function responseBytes(fetchImpl, url) {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Source HTTP ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function applyProductsOverlay({
  revision = process.env.MANAGER_PRODUCTS_REVISION,
  outputDir = 'out',
  fetchImpl = fetch,
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('Immutable product catalog revision required');

  const base = `https://raw.githubusercontent.com/Daisuke134/life-manager/${revision}/apps/landing/marketing/`;
  const manifestBytes = await responseBytes(fetchImpl, base + 'route-manifest.json');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (!Array.isArray(manifest.files)) throw new Error('Product catalog route manifest is invalid');

  const staged = [];
  for (const route of routes) {
    const matches = manifest.files.filter((file) => file.public_route === route.publicRoute);
    if (matches.length !== 1) throw new Error(`Expected one canonical route: ${route.publicRoute}`);
    const entry = matches[0];
    if (entry.source !== route.source || entry.export_path !== route.exportPath || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) {
      throw new Error(`Unexpected product catalog route mapping: ${route.publicRoute}`);
    }

    const bytes = await responseBytes(fetchImpl, base + route.source);
    const digest = sha256(bytes);
    if (digest !== entry.sha256) throw new Error(`Product catalog integrity mismatch: ${route.publicRoute}`);
    staged.push({ ...route, bytes, digest });
  }

  const receiptPath = resolve(outputDir, 'manager-release.json');
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  if (!Array.isArray(receipt.files)) throw new Error('Marketing release receipt is invalid');
  for (const route of staged) {
    const entry = receipt.files.find((file) => file.export_path === route.exportPath);
    if (!entry || entry.source !== route.source) throw new Error(`Marketing release receipt is missing ${route.exportPath}`);
    entry.sha256 = route.digest;
    entry.source_revision = revision;
  }
  receipt.product_catalog_revision = revision;
  receipt.product_catalog_routes = staged.map(({ publicRoute, source, exportPath, digest }) => ({
    public_route: publicRoute,
    source,
    export_path: exportPath,
    sha256: digest,
  }));

  for (const route of staged) {
    const path = resolve(outputDir, route.exportPath);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, route.bytes);
    await rm(path.replace(/\.html$/, '.txt'), { force: true });
  }
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const receipt = await applyProductsOverlay();
  console.log(`Verified product catalog overlay: ${receipt.product_catalog_revision}; ${routes.length} routes`);
}
