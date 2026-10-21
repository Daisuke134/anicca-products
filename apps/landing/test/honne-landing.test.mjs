import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../app/honne/page.tsx', import.meta.url), 'utf8');
test('Honne has an explicit canonical without changing the campaign identity', () => {
  assert.match(source, /canonical:\s*['"]https:\/\/aniccaai.com\/honne['"]/);
  const url = new URL(source.match(/https:\/\/apps\.apple\.com\/app\/honne\/id6759667221\?[^'"\s]+/)[0]);
  assert.deepEqual(Object.fromEntries(url.searchParams), {pt:'93486075',ct:'site_honne',mt:'8'});
});
test('Honne replaces certainty claims with visible interpretation limits', () => {
  assert.doesNotMatch(source, /reveal hidden emotions|won’t (?:damage|wreck)|priority speed|deeper insights|50,000|aggregateRating/);
  assert.match(source, /may be wrong/);
  assert.match(source, /Three analyses per day/);
  assert.match(source, /Unlimited analyses and full history/);
});

import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compiled} from './helpers/render-module.mjs';
import {createHash} from 'node:crypto';
// Node ESM needs the CommonJS interop that Next's bundler normally supplies.
let renderedModule = Buffer.from(compiled(new URL('../app/honne/page.tsx', import.meta.url)).split(',')[1], 'base64').toString();
renderedModule = renderedModule.replace(/import Image from ([^;]+);/, 'import NextImageModule from $1; const Image = NextImageModule.default ?? NextImageModule;');
const page = await import('data:text/javascript;base64,' + Buffer.from(renderedModule).toString('base64'));
const html = renderToStaticMarkup(React.createElement(page.default));
test('real server render keeps one H1, seven native questions, working anchors and disclosures', () => {
  assert.equal((html.match(/<h1\b/g)||[]).length, 1);
  assert.equal((html.match(/<details>/g)||[]).length, 7);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  for (const href of ['/honne/privacy','/honne/support','/honne/ja','https://www.apple.com/legal/internet-services/itunes/dev/stdeula/']) assert.ok(html.includes(`href="${href}"`));
  assert.match(html, /may be wrong/);
  assert.match(html, /iPadOS 18/);
  assert.match(html, /Three analyses per day/);
  assert.match(html, /Unlimited analyses and full history/);
  assert.match(html, /only share text you have permission to use/);
  assert.doesNotMatch(html, /50,000|50&#x27;000|guaranteed|aggregateRating|\/workspace\/|screenshot-[1-4]\.jpg|[↗⬆↑]/);
  assert.equal(page.metadata.alternates.canonical,'https://aniccaai.com/honne');
});
test('every rendered download CTA retains the original tracking and Apple identity', () => {
  const links = [...html.matchAll(/<a[^>]+href="(https:\/\/apps\.apple\.com[^\"]+)"/g)];
  assert.ok(links.length >= 2);
  for (const [,href] of links) {
    const url = new URL(href.replaceAll('&amp;','&'));
    assert.ok(url.pathname.endsWith('/id6759667221'));
    assert.deepEqual(Object.fromEntries(url.searchParams),{pt:'93486075',ct:'site_honne',mt:'8'});
  }
  const ld = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(ld.name,'Honne'); assert.equal(ld.downloadUrl,'https://apps.apple.com/app/id6759667221');
  assert.match(ld.offers.description,/optional in-app subscriptions/);
});
test('only three verified English screens render with real dimensions, a single priority image and honest captions', () => {
  const shots = [...html.matchAll(/<img[^>]+>/g)].map(m=>m[0]).filter(s=>s.includes('honne-store-en-'));
  assert.equal(shots.length,3);
  assert.equal(shots.filter(s=>!s.includes('loading="lazy"')).length,1);
  for (const shot of shots) { assert.match(shot,/width="1284"/);assert.match(shot,/height="2778"/); }
  assert.ok(shots[0].includes('honne-store-en-3.webp'));
  assert.ok(html.indexOf('Download on the App Store') < html.indexOf('class="honne-shot"'));
  for (const [i,hash] of [[2,'769a870372461236334de2e7527aadfc31d8d572fee3333d7d791d09d39500ae'],[3,'b64576483d7db9d11e6179bfced93dcd909950683cdf2801c8d186ae4d24566b'],[4,'12e11793eaee65c9a3246220ce5677e033f2a0ee12d76b1bc012befce84eff50']]) {
    const bytes=readFileSync(new URL(`../public/honne/honne-store-en-${i}.webp`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  }
});
