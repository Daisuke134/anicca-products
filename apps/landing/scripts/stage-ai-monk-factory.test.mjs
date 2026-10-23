import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { stageFactoryAssets } from './stage-ai-monk-factory.mjs';

const bodies = { 'index.html': '<!doctype html><title>Monk Factory</title>', 'app.css': 'body{color:#242b25}', 'app.mjs': 'export const mode="public";', 'project.mjs': 'export const version=1;' };
const manifest = () => ({ revision: 'a'.repeat(40), files: Object.fromEntries(Object.entries(bodies).map(([name, body]) => [name, createHash('sha256').update(body).digest('hex')])) });
async function scratch(t) { const root = await mkdtemp(path.join(tmpdir(), 'monk-web-stage-'));t.after(() => rm(root, { recursive: true, force: true }));return root; }
const fetchSource = async url => new Response(bodies[new URL(url).pathname.split('/').at(-1)]);

test('stages exactly the hash-pinned canonical UI files', async t => {
  const root = await scratch(t);
  const result = await stageFactoryAssets({ manifest: manifest(), target: path.join(root, 'factory'), fetchSource });
  assert.equal(result.files.length, 4);
  for (const [name, body] of Object.entries(bodies)) assert.equal(await readFile(path.join(root, 'factory', name), 'utf8'), body);
});
test('a bad download leaves the existing workspace intact', async t => {
  const root = await scratch(t);const target = path.join(root, 'factory');await mkdir(target);await writeFile(path.join(target, 'index.html'), 'previous');
  await assert.rejects(stageFactoryAssets({ manifest: manifest(), target, fetchSource: async () => new Response('wrong bytes') }), /hash/i);
  assert.equal(await readFile(path.join(target, 'index.html'), 'utf8'), 'previous');
});
test('rejects mutable revisions, extra paths and symlink targets', async t => {
  const root = await scratch(t);const target = path.join(root, 'factory');
  await assert.rejects(stageFactoryAssets({ manifest: { ...manifest(), revision: 'main' }, target, fetchSource }), /revision/i);
  await assert.rejects(stageFactoryAssets({ manifest: { ...manifest(), files: { ...manifest().files, '../other': 'b'.repeat(64) } }, target, fetchSource }), /files/i);
  await mkdir(path.join(root, 'outside'));await symlink(path.join(root, 'outside'), target);
  await assert.rejects(stageFactoryAssets({ manifest: manifest(), target, fetchSource }), /symlink/i);
});
