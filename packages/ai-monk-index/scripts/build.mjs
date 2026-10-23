import { cp, copyFile, mkdir, rm, chmod, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('src/', root), dist, { recursive: true });
await copyFile(new URL('../../apps/landing/lib/ai-monk-directory.mjs', root), new URL('ai-monk-directory.mjs', dist));
await copyFile(new URL('../../apps/landing/public/data/ai-monk-avatar-database-2026.json', root), new URL('database.json', dist));
const version = JSON.parse(await readFile(new URL('package.json', root), 'utf8')).version;
const sha = createHash('sha256').update(await readFile(new URL('database.json', dist))).digest('hex');
await writeFile(new URL('snapshot.mjs', dist), `import database from './database.json' with { type: 'json' };\nexport { database };\nexport const snapshotSha256 = ${JSON.stringify(sha)};\nexport const packageVersion = ${JSON.stringify(version)};\n`);
for (const file of ['cli.mjs', 'stdio.mjs']) await chmod(new URL(file, dist), 0o755);
if (process.argv.includes('--netlify')) {
  const target = new URL('../../apps/landing/netlify/functions/_lib/ai-monk-index/', root);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (const file of ['index.mjs', 'mcp.mjs', 'http.mjs', 'ai-monk-directory.mjs', 'database.json', 'snapshot.mjs']) {
    await copyFile(new URL(file, dist), new URL(file, target));
  }
}
