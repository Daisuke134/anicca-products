import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {fileURLToPath} from 'node:url';
import {compiled} from './helpers/render-module.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const page=await import(compiled(new URL('../app/thankful/page.tsx',import.meta.url)));
const html=renderToStaticMarkup(React.createElement(page.default));
test('Thankful demonstrates the real journal after the main download decision',()=>{
 assert.match(html,/src="\/assets\/thankful\/home.png"/);
 assert.ok(html.indexOf('Download on the App Store') < html.indexOf('src="/assets/thankful/home.png"'));
 assert.match(html,/src="\/assets\/thankful\/ipad-history.webp"/);
 assert.match(html,/before the first entry/);
});
test('Thankful exposes optional purchases and useful FAQs without invented tiers or outcomes',()=>{
 assert.match(html,/Optional in-app subscriptions/);
 assert.match(html,/iPadOS 17/);
 assert.equal((html.match(/<details>/g)||[]).length,7);
 assert.doesNotMatch(html,/Thousands|50,000|200\+ affirmations|seven.day trial|100% private|no data collected|aggregateRating/i);
});

import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('Thankful preserves canonical identity, registry icon and real destinations',()=>{
 assert.equal(page.generateMetadata().alternates.canonical,'https://aniccaai.com/thankful');
 assert.equal(page.generateMetadata().openGraph.images[0].url, '/assets/manager-site/apps/6759514159.png');
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<footer\b/g)||[]).length,1);
 const downloads=[...html.matchAll(/<a[^>]+href="(https:\/\/apps\.apple\.com[^\"]+)"/g)];
 assert.equal(downloads.length,3);
 for(const [,href] of downloads) assert.match(href,/id6759514159(?:\?|$)/);
 for(const href of ['/blog/gratitude-journal-repeating-yourself','/blog/c/thankful','/thankful/privacy/en','/thankful/terms','mailto:keiodaisuke@gmail.com','/dais'])assert.ok(html.includes(`href="${href}"`));
 for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${anchor}"`));
 assert.doesNotMatch(html,/anicca-app-icon|\/workspace\/|[↗⬆↑]/u);
 const ld=JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
 assert.equal(ld.name,'Thankful');assert.equal(ld.url,'https://aniccaai.com/thankful');assert.equal(ld.offers,undefined);
});
test('Thankful uses exact owned images with correct dimensions and no fabricated saved entries',()=>{
 for(const [file,hash,width,height] of [['home.png','d8177317c6e79a21af770ee914fffa51d1cafd3e29a93d34e4ec3971bba08cd9',1320,2868],['ipad-history.webp','55edc28df27f19bcad5174128774d62db24d4137bbb04c55aabe583664e56a55',975,1300]]){
  const data=readFileSync(new URL('../public/assets/thankful/'+file,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),hash);
  const tag=[...html.matchAll(/<img[^>]+>/g)].map(m=>m[0]).find(s=>s.includes('/assets/thankful/'+file));assert.ok(tag);
  assert.ok(tag.includes(`width="${width}"`)&&tag.includes(`height="${height}"`));
 }
 assert.match(html,/No entries yet/);
 assert.match(html,/ideas for your own journal, not preset entries/);
 assert.doesNotMatch(html,/save after|at least one|seven.day|streak forgiveness/i);
});
