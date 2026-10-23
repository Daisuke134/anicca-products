import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const names = ['app.css', 'app.mjs', 'index.html', 'project.mjs'];
async function statOrNull(file) { try { return await lstat(file); } catch (error) { if (error.code === 'ENOENT') return null;throw error; } }

export async function stageFactoryAssets({ manifest, target, fetchSource = fetch }) {
  target = path.resolve(target);
  if (!/^[a-f0-9]{40}$/.test(manifest?.revision ?? '')) throw new Error('Factory source revision must be an immutable commit.');
  if (!manifest.files || Object.keys(manifest.files).sort().join(',') !== names.join(',') || names.some(name => !/^[a-f0-9]{64}$/.test(manifest.files[name]))) throw new Error('Factory source files must contain the four expected SHA256 pins.');
  const current = await statOrNull(target);
  if (current?.isSymbolicLink()) throw new Error('Factory target must not be a symlink.');
  if (current && !current.isDirectory()) throw new Error('Factory target must be a directory.');
  const downloads = await Promise.allSettled(names.map(async name => {
    const url = `https://raw.githubusercontent.com/Daisuke134/life-manager/${manifest.revision}/skills/earn/marketing-engine/factory-web/${name}`;
    const response = await fetchSource(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Factory ${name} download failed (${response.status}).`);
    const body = Buffer.from(await response.arrayBuffer());
    if (body.length > 262144 || createHash('sha256').update(body).digest('hex') !== manifest.files[name]) throw new Error(`Factory ${name} hash mismatch or oversized file.`);
    return { name, body };
  }));
  const failed = downloads.find(result => result.status === 'rejected');
  if (failed) throw failed.reason;
  const files = downloads.map(result => result.value);
  const staging = `${target}.stage-${randomUUID()}`;
  const previous = `${target}.previous-${randomUUID()}`;
  let moved = false;
  try {
    await mkdir(path.dirname(target), { recursive: true });
    await mkdir(staging);
    for (const file of files) await writeFile(path.join(staging, file.name), file.body, { flag: 'wx' });
    if (current) { await rename(target, previous);moved = true; }
    try { await rename(staging, target); } catch (error) { if (moved) { await rename(previous, target);moved = false; }throw error; }
    if (moved) await rm(previous, { recursive: true });
  } finally { await rm(staging, { recursive: true, force: true }); }
  return { revision: manifest.revision, files: files.map(file => ({ name: file.name, bytes: file.body.length, sha256: manifest.files[file.name] })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('ai-monk-factory-source.json', root), 'utf8'));
  const result = await stageFactoryAssets({ manifest, target: fileURLToPath(new URL('public/ai-monk-factory-download/', root)) });
  process.stdout.write(`Monk Factory: ${result.files.length} files verified from ${result.revision}\n`);
}
