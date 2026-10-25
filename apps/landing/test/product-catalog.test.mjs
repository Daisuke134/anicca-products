import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../public/products/index.html',import.meta.url),'utf8');
const software=page.match(/<h2>Software<\/h2>([\s\S]*?)<h2>PDF downloads<\/h2>/)?.[1]||'';
const cards=[...software.matchAll(/<div class="product">([\s\S]*?)<\/div>/g)].map(match=>match[1]);

test('products page lists AI Monk Database as a free public tool',()=>{
 const card=cards.find(item=>item.includes('<h3>AI Monk Database</h3>'));
 assert.ok(card,'AI Monk Database card is present under Software');
 assert.match(card,/<p class="price">Free<\/p>/);
 assert.match(card,/href="\/ai-monk-database"/);
});
