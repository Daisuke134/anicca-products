import assert from 'node:assert/strict';
import test from 'node:test';
import { wrapAffirmationText } from '../lib/tools/wallpaper-presets.ts';
import { APP_STORE_PT, buildWallpaperAppStoreUrl } from '../lib/tools/app-store.ts';

test('wrapAffirmationText keeps ~12 chars and max 4 lines', () => {
  const lines = wrapAffirmationText('今日はここまでで十分ですよほんとうに', 12, 4);
  assert.ok(lines.length <= 4);
  for (const line of lines) {
    assert.ok([...line].length <= 14, line);
  }
});

test('wrapAffirmationText avoids starting a line with 、。', () => {
  const lines = wrapAffirmationText('あいうえおかきくけこ、さしすせそ', 12, 4);
  for (const line of lines.slice(1)) {
    assert.notEqual(line[0], '、');
    assert.notEqual(line[0], '。');
  }
});

test('APP_STORE_PT is set and CTA matches App Store campaign link', () => {
  assert.equal(APP_STORE_PT, '93486075');
  const url = buildWallpaperAppStoreUrl();
  assert.equal(
    url,
    'https://apps.apple.com/jp/app/id6755129214?pt=93486075&ct=wallpaper_tool&mt=8',
  );
});
