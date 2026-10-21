import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compiled} from './helpers/render-module.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const hub=await import(compiled(new URL('../app/blog/c/[business]/page.tsx',import.meta.url)));
const index=await import(compiled(new URL('../app/blog/page.tsx',import.meta.url)));
test('rendered mobile article hubs link directly to existing introductions without changing canonicals',()=>{
 for(const [business,href] of [['anicca','/affirmation-app'],['thankful','/thankful']]){
  const html=renderToStaticMarkup(React.createElement(hub.default,{params:{business}}));
  assert.ok(html.includes(`href="${href}"`));
  assert.equal(hub.generateMetadata({params:{business}}).alternates.canonical,`https://aniccaai.com/blog/c/${business}`);
 }
 const research=renderToStaticMarkup(React.createElement(hub.default,{params:{business:'research'}}));
 assert.match(research,/href="\/blog\/manager"/);
 assert.doesNotMatch(research,/Explore the Anicca app/);
});
test('product navigation exposes six real app summaries and a distinct Life Manager destination',()=>{
 const html=renderToStaticMarkup(React.createElement(index.default));
 const nav=html.match(/<nav aria-label="Product introductions"[^>]*>(.*?)<\/nav>/s)?.[1];assert.ok(nav);
 const ids=['6755129214','6759667221','6759514159','6757726663','6762143790','6766485903'];
 for(const id of ids){assert.ok(nav.includes(`href="#app-${id}"`));assert.ok(html.includes(`id="app-${id}"`));}
 assert.equal((nav.match(/href="#app-/g)||[]).length,6);
 assert.match(nav,/href="\/lm"[^>]*>Life Manager \(agent in development\)/);
 assert.match(nav,/lang="ja">STUDIO CHERIE/);
 assert.doesNotMatch(nav,/Manager research|[↗⬆↑]/u);
});
