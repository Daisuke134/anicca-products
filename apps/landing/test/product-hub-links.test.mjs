import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
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
test('article index leads with populated editorial categories and keeps app CTAs contextual',()=>{
 const html=renderToStaticMarkup(React.createElement(index.default));
 assert.doesNotMatch(html,/Product introductions|data-app-id=|apps.apple.com/);
 assert.ok(html.indexOf('href="/blog/manager"') >= 0);
 assert.ok(html.indexOf('href="/blog/manager"') < html.indexOf('Latest articles'));
 assert.ok(html.indexOf('href="/blog/c/anicca"') >= 0);
 assert.ok(html.indexOf('Latest articles') >= 0);
 assert.ok(html.indexOf('href="/blog/c/anicca"') < html.indexOf('Latest articles'));
 const cards=[...html.matchAll(/<article[^>]*data-topic="([^"]+)"[^>]*>(.*?)<\/article>/gs)];assert.ok(cards.length>=5);
 for(const [,key,card] of cards){assert.match(card,/<p>/);assert.ok((card.match(/data-article-preview=/g)||[]).length>=1,key);assert.ok((card.match(/data-article-preview=/g)||[]).length<=2,key);}
 assert.doesNotMatch(html,/[↗⬆↑]/u);
});

test('Research is one index topic and includes Manager articles without moving their URLs',()=>{
 const html=renderToStaticMarkup(React.createElement(index.default));
 assert.equal((html.match(/data-topic="research"/g)||[]).length,1);
 assert.equal((html.match(/data-topic="manager"/g)||[]).length,0);
 // CI runs before the Manager overlay is staged: provide an explicit corpus fixture.
 const previous=process.cwd();const root=mkdtempSync(join(tmpdir(),'research-hub-'));
 mkdirSync(join(root,'data/research'),{recursive:true});
 writeFileSync(join(root,'data/research/manager-fixture.json'),JSON.stringify({slug:'manager-fixture',title:'Research fixture',date:'2026-10-21',project:'Manager',markdown:'Fixture'}));
 try{
  process.chdir(root);
  const research=renderToStaticMarkup(React.createElement(hub.default,{params:{business:'research'}}));
  assert.match(research,/href="\/blog\/manager-fixture"/);
  assert.match(research,/<span class="article-topic">Research<\/span>/);
  const notes=renderToStaticMarkup(React.createElement(hub.default,{params:{business:'notes'}}));
  assert.doesNotMatch(notes,/href="\/blog\/manager-fixture"/);
  assert.match(research,/href="\/blog\/manager"/);
 }finally{process.chdir(previous);}
});
