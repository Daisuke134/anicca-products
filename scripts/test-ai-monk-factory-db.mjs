import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// A fresh private Unix socket only. Never use PGHOST, a running database, or a deployment credential.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const probe = spawnSync('pg_config', ['--bindir'], { encoding: 'utf8' });
if (probe.status !== 0) throw new Error('Local PostgreSQL binaries are required (pg_config --bindir).');
const bin = probe.stdout.trim();
for (const name of ['initdb', 'pg_ctl', 'psql']) if (!existsSync(join(bin, name))) throw new Error(`Missing local PostgreSQL binary: ${name}`);
const socket = mkdtempSync('/tmp/monk-factory-pg-');
const data = join(socket, 'data');
writeFileSync(join(socket, '.monk-factory-fixture'), JSON.stringify({ purpose: 'ai-monk-factory-db-test', pid: process.pid }), { mode: 0o600, flag: 'wx' });
const env = { ...process.env, PATH: `${bin}:${process.env.PATH || ''}`, MONK_FACTORY_TEST_SOCKET: socket };
for (const key of Object.keys(env)) if (key.startsWith('PG') && key !== 'PG_COLOR') delete env[key];
function pg(name, args) {
  const result = spawnSync(join(bin, name), args, { env, encoding: 'utf8', timeout: 30000 });
  if (result.status !== 0) throw new Error(`${name} failed (${result.status}): ${(result.stderr || '').slice(-2000)}`);
}
try {
  pg('initdb', ['-D', data, '-A', 'trust', '-U', userInfo().username, '--no-locale', '--encoding=UTF8']);
  pg('pg_ctl', ['-D', data, '-o', `-F -h '' -k ${socket} -p 5432`, '-l', join(socket, 'server.log'), '-w', 'start']);
  const result = spawnSync(process.execPath, ['--test', 'apps/landing/netlify/functions/_lib/__tests__/monk-factory-db.test.js'], { cwd: root, env, stdio: 'inherit', timeout: 180000 });
  process.exitCode = result.status === 0 ? 0 : 1;
} finally {
  if (existsSync(join(data, 'postmaster.pid'))) pg('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  rmSync(socket, { recursive: true });
}
