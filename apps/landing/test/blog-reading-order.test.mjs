import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compiled} from './helpers/render-module.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const page=await import(compiled(new URL('../app/blog/page.tsx',import.meta.url)));
test('reader hub has a finite initial list, six real app entries and crawlable all-articles link',()=>{
 const html=renderToStaticMarkup(React.createElement(page.default));
 const links=[...html.matchAll(/href="\/blog\/([^"/]+)"/g)];assert.ok(links.length<=9,'initial article list must be bounded');
 assert.match(html,/href="\/blog\/archive\/1"/);assert.equal((html.match(/data-app-id=/g)||[]).length,6);assert.match(html,/Research/);assert.doesNotMatch(html,/Free tier mirrors|paid tier funds|xiv\. Articles/);
 for(const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)){const d=JSON.parse(m[1]);if(d.mainEntity?.['@type']==='ItemList')assert.equal(d.mainEntity.numberOfItems,d.mainEntity.itemListElement.length);}
});
test('article archive declares its self-canonical',()=>assert.equal(page.metadata.alternates.canonical,'https://aniccaai.com/blog'));
test('sitemap includes archive once, paginated paths and unchanged article destinations',async()=>{const {default:sitemap}=await import(compiled(new URL('../app/sitemap.ts',import.meta.url)));const entries=sitemap();assert.equal(entries.filter(e=>e.url==='https://aniccaai.com/blog').length,1);assert.ok(entries.some(e=>e.url==='https://aniccaai.com/blog/archive/1'));assert.ok(entries.some(e=>e.url==='https://aniccaai.com/blog/gratitude-journal-repeating-yourself'));assert.equal(new Set(entries.map(e=>e.url)).size,entries.length);});
test('research navigation keeps Manager in Research and out of the general latest list',()=>{
 const source=readFileSync(new URL('../app/blog/page.tsx',import.meta.url),'utf8');
 assert.match(source,/editorialOf\(p.slug,\s*p.project\)\s*!==\s*'Research'/);
 const html=renderToStaticMarkup(React.createElement(page.default));
 assert.match(html,/<h2>Research<\/h2>/);
 const hub=readFileSync(new URL('../app/blog/c/[business]/page.tsx',import.meta.url),'utf8');
 assert.match(hub,/\/blog\/manager/);
});

test('external reading remains a secondary route at the bottom',()=>{const html=renderToStaticMarkup(React.createElement(page.default));assert.ok(html.indexOf('https://aniccaai.substack.com')>html.lastIndexOf('<h2>Research</h2>'));assert.match(html,/https:\/\/x.com\/selawmqt/);assert.match(html,/href="\/letter"/);});
test('rendered numbered archive covers every shared-corpus article exactly once',async()=>{
 const archive=await import(compiled(new URL('../app/blog/archive/[page]/page.tsx',import.meta.url)));
 const {loadAllBlogPosts}=await import(compiled(new URL('../lib/blog-posts.ts',import.meta.url)));
 const seen=[];
 for(const params of archive.generateStaticParams()){
  const html=renderToStaticMarkup(React.createElement(archive.default,{params}));
  seen.push(...[...html.matchAll(/href="\/blog\/([^"/]+)"/g)].map(m=>m[1]));
  assert.match(html,/aria-label="Article pages"/);
  const ld=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(ld.mainEntity.numberOfItems,ld.mainEntity.itemListElement.length);
  assert.equal(archive.generateMetadata({params}).alternates.canonical,`https://aniccaai.com/blog/archive/${params.page}`);
 }
 assert.deepEqual(seen.sort(),loadAllBlogPosts().map(p=>p.slug).sort());
});
test('Thankful rendered hero uses its verified native icon and correct App Store identity',async()=>{
 const thankful=await import(compiled(new URL('../app/thankful/page.tsx',import.meta.url)));
 const html=renderToStaticMarkup(React.createElement(thankful.default));
 assert.match(html,/src="\/assets\/manager-site\/apps\/6759514159.png"/);
 assert.match(html,/href="https:\/\/apps.apple.com\/us\/app\/thankful-gratitude-journal\/id6759514159"/);
 assert.doesNotMatch(html,/anicca-app-icon|Thousands of people|[↗⬆↑]/u);
 assert.match(html,/thankful\/privacy\/en/);
});
