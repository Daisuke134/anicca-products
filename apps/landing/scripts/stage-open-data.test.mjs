import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageLatestOpenData } from './stage-open-data.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'open-stage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, 'public-open');
  const outputDir = join(root, 'out-open');
  mkdirSync(sourceDir);
  mkdirSync(outputDir);
  return { sourceDir, outputDir };
}

function data(updated_at, marker) {
  return JSON.stringify({ updated_at, marker, summary: { platforms: [] }, kpis: [] });
}

test('publishes the newest snapshot only when it is newer than canonical data', (t) => {
  const { sourceDir, outputDir } = fixture(t);
  writeFileSync(join(outputDir, 'data.json'), data('2026-11-05 16:37 JST', 'canonical'));
  writeFileSync(join(sourceDir, 'open-dashboard-data-2026-11-05-1707.json'), data('2026-11-05 17:07 JST', 'latest'));

  const result = stageLatestOpenData({ sourceDir, outputDir });

  assert.deepEqual(result, { staged: true, source: 'open-dashboard-data-2026-11-05-1707.json' });
  assert.equal(JSON.parse(readFileSync(join(outputDir, 'data.json'), 'utf8')).marker, 'latest');
});

test('recovers a missing canonical file from a valid timestamped snapshot', (t) => {
  const { sourceDir, outputDir } = fixture(t);
  writeFileSync(join(sourceDir, 'open-dashboard-data-2026-11-05-1707.json'), data('2026-11-05 17:07 JST', 'recovered'));

  const result = stageLatestOpenData({ sourceDir, outputDir });

  assert.deepEqual(result, { staged: true, source: 'open-dashboard-data-2026-11-05-1707.json' });
  assert.equal(JSON.parse(readFileSync(join(outputDir, 'data.json'), 'utf8')).marker, 'recovered');
});

test('does not roll canonical data back to an older snapshot', (t) => {
  const { sourceDir, outputDir } = fixture(t);
  writeFileSync(join(outputDir, 'data.json'), data('2026-11-05 18:07 JST', 'newer-canonical'));
  writeFileSync(join(sourceDir, 'open-dashboard-data-2026-11-05-1707.json'), data('2026-11-05 17:07 JST', 'older-snapshot'));

  const result = stageLatestOpenData({ sourceDir, outputDir });

  assert.deepEqual(result, { staged: false, source: 'data.json' });
  assert.equal(JSON.parse(readFileSync(join(outputDir, 'data.json'), 'utf8')).marker, 'newer-canonical');
});

test('fails closed on a malformed newest snapshot instead of silently publishing stale data', (t) => {
  const { sourceDir, outputDir } = fixture(t);
  writeFileSync(join(outputDir, 'data.json'), data('2026-11-05 16:37 JST', 'canonical'));
  writeFileSync(join(sourceDir, 'open-dashboard-data-2026-11-05-1607.json'), data('2026-11-05 16:07 JST', 'older'));
  writeFileSync(join(sourceDir, 'open-dashboard-data-2026-11-05-1707.json'), '{broken');

  assert.throws(() => stageLatestOpenData({ sourceDir, outputDir }));
  assert.equal(JSON.parse(readFileSync(join(outputDir, 'data.json'), 'utf8')).marker, 'canonical');
});

test('keeps a valid canonical file when there are no timestamped snapshots', (t) => {
  const { sourceDir, outputDir } = fixture(t);
  writeFileSync(join(outputDir, 'data.json'), data('2026-11-05 16:37 JST', 'canonical'));

  const result = stageLatestOpenData({ sourceDir, outputDir });

  assert.deepEqual(result, { staged: false, source: 'data.json' });
  assert.equal(JSON.parse(readFileSync(join(outputDir, 'data.json'), 'utf8')).marker, 'canonical');
});
