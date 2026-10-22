import { cp, copyFile, mkdir, rm, chmod } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL('src/', root), dist, { recursive: true });
await copyFile(new URL('../../apps/landing/lib/ai-monk-directory.mjs', root), new URL('ai-monk-directory.mjs', dist));
await copyFile(new URL('../../apps/landing/public/data/ai-monk-avatar-database-2026.json', root), new URL('database.json', dist));
for (const file of ['cli.mjs', 'stdio.mjs']) await chmod(new URL(file, dist), 0o755);
