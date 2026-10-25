import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { applyProductsOverlay } from './apply-products-overlay.mjs';

const revision = 'a'.repeat(40);
const pages = new Map([
  ['pages/products-en.html', Buffer.from('<h1>AI Monk Factory</h1>')],
  ['pages/products.html', Buffer.from('<h1>AI Monk Factory</h1>')],
]);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = {
  files: [
    { public_route: '/dais', source: 'pages/products-en.html', export_path: 'dais.html', sha256: digest(pages.get('pages/products-en.html')) },
    { public_route: '/dais/ja', source: 'pages/products.html', export_path: 'dais/ja.html', sha256: digest(pages.get('pages/products.html')) },
  ],
};

function mockFetch({ corruptPage = false } = {}) {
  return async (url) => {
    if (url.endsWith('/route-manifest.json')) {
      return { ok: true, arrayBuffer: async () => Buffer.from(JSON.stringify(manifest)) };
    }
    const source = url.split('/').at(-1);
    let bytes = pages.get(`pages/${source}`);
    if (!bytes) return { ok: false, status: 404 };
    if (corruptPage && source === 'products.html') bytes = Buffer.from('corrupt');
    return { ok: true, arrayBuffer: async () => bytes };
  };
}

async function makeOutput() {
  const root = await mkdtemp(join(tmpdir(), 'products-overlay-'));
  await mkdir(join(root, 'dais'), { recursive: true });
  await writeFile(join(root, 'dais.html'), 'old English listing');
  await writeFile(join(root, 'dais.txt'), 'stale payload');
  await writeFile(join(root, 'dais/ja.html'), 'old Japanese listing');
  await writeFile(join(root, 'dais/ja.txt'), 'stale payload');
  await writeFile(join(root, 'en.html'), 'unchanged homepage');
  await writeFile(join(root, 'manager-release.json'), JSON.stringify({
    revision: 'b'.repeat(40),
    files: [
      { source: 'pages/products-en.html', export_path: 'dais.html', sha256: '0'.repeat(64) },
      { source: 'pages/products.html', export_path: 'dais/ja.html', sha256: '0'.repeat(64) },
      { source: 'pages/en.html', export_path: 'en.html', sha256: '1'.repeat(64) },
    ],
  }));
  return root;
}

test('applies only canonical English/Japanese product routes and records their source revision', async () => {
  const outputDir = await makeOutput();
  try {
    const receipt = await applyProductsOverlay({ revision, outputDir, fetchImpl: mockFetch() });
    assert.equal(await readFile(join(outputDir, 'dais.html'), 'utf8'), pages.get('pages/products-en.html').toString());
    assert.equal(await readFile(join(outputDir, 'dais/ja.html'), 'utf8'), pages.get('pages/products.html').toString());
    assert.equal(await readFile(join(outputDir, 'en.html'), 'utf8'), 'unchanged homepage');
    await assert.rejects(readFile(join(outputDir, 'dais.txt')));
    await assert.rejects(readFile(join(outputDir, 'dais/ja.txt')));
    assert.equal(receipt.revision, 'b'.repeat(40));
    assert.equal(receipt.product_catalog_revision, revision);
    assert.equal(receipt.files.find((file) => file.export_path === 'en.html').sha256, '1'.repeat(64));
    assert.equal(receipt.files.find((file) => file.export_path === 'dais.html').sha256, digest(pages.get('pages/products-en.html')));
    const savedReceipt = JSON.parse(await readFile(join(outputDir, 'manager-release.json'), 'utf8'));
    assert.equal(savedReceipt.product_catalog_routes.length, 2);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('fails closed on a template hash mismatch without changing output', async () => {
  const outputDir = await makeOutput();
  try {
    await assert.rejects(applyProductsOverlay({ revision, outputDir, fetchImpl: mockFetch({ corruptPage: true }) }), /integrity mismatch/);
    assert.equal(await readFile(join(outputDir, 'dais.html'), 'utf8'), 'old English listing');
    assert.equal(await readFile(join(outputDir, 'dais/ja.html'), 'utf8'), 'old Japanese listing');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});
