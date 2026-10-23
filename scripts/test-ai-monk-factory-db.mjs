import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const dir = mkdtempSync('/tmp/monk-factory-pg-');
const bin = execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim();
const data = join(dir, 'data');
let started = false;
try {
  writeFileSync(join(dir, '.monk-factory-fixture'), 'synthetic local test only\n', { mode: 0o600 });
  execFileSync(join(bin, 'initdb'), ['-D', data, '-A', 'trust', '--no-locale', '--encoding=UTF8', '--no-sync'], { stdio: 'ignore' });
  execFileSync(join(bin, 'pg_ctl'), ['-D', data, '-l', join(dir, 'postgres.log'), '-o', "-k " + dir + " -h ''", '-w', 'start'], { stdio: 'ignore' });
  started = true;
  const test = spawnSync(process.execPath, ['--test', resolve('apps/landing/netlify/functions/_lib/__tests__/monk-factory-db.test.js')], {
    stdio: 'inherit', env: { ...process.env, PATH: bin + ':' + process.env.PATH, MONK_FACTORY_TEST_SOCKET: dir },
  });
  process.exitCode = test.status ?? 1;
} finally {
  if (started) execFileSync(join(bin, 'pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop'], { stdio: 'ignore' });
  rmSync(dir, { recursive: true, force: true });
}
