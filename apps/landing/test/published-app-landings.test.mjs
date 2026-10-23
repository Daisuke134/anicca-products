import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compiled} from './helpers/render-module.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
for(const [slug,id,lang] of [['sleepreset','6762143790','en'],['studio-cherie','6766485903','ja']])test(`${slug} explains the correct app with canonical, language and verified screenshot assets`,async()=>{
 const route=new URL(`../app/${slug}/page.tsx`,import.meta.url);assert.ok(existsSync(route),`${slug} introduction missing`);
 const page=await import(compiled(route));assert.equal(page.metadata.alternates.canonical,`https://aniccaai.com/${slug}`);
 const html=renderToStaticMarkup(React.createElement(page.default));assert.match(html,new RegExp(`href="https://apps.apple.com/[^\"]+/id${id}[^\"]*"`));
 assert.match(html,new RegExp(`lang="${lang}"`));assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.doesNotMatch(html,/[↗⬆↑]/u);
 const shots=[...html.matchAll(/src="(\/images\/(?:sleepreset|studio-cherie)\/[^\"]+)"/g)];assert.ok(shots.length>=3);
 for(const [,src] of shots)assert.ok(existsSync(new URL('../public'+src,import.meta.url)));
 if(lang==='en'){assert.match(html,/paid subscription/);assert.match(html,/Example screen/);assert.match(html,/not medical advice/);assert.doesNotMatch(html,/cures insomnia|Data Not Collected|guaranteed recovery/i);}
 else {assert.match(html,/お休みボックス/);assert.doesNotMatch(html,/05_profile|日本語完全対応|全機能永久無料/);}
});
test('all three introductions are canonical sitemap entries without keyword aliases',async()=>{
 const sitemap=await import(compiled(new URL('../app/sitemap.ts',import.meta.url)));
 const urls=sitemap.default().map(entry=>entry.url);
 for(const path of ['/dailydharma','/sleepreset','/studio-cherie'])assert.equal(urls.filter(url=>url==='https://aniccaai.com'+path).length,1);
 assert.equal(urls.filter(url=>url==='https://aniccaai.com/affirmation-app').length,1);
 for(const alias of ['/daily-dhamma','/sleep-reset'])assert.ok(!urls.includes('https://aniccaai.com'+alias));
});
test('blog discovery connects the three app cards to canonical product introductions',async()=>{
 const {AppDiscovery}=await import(compiled(new URL('../components/blog/OwnedMedia.tsx',import.meta.url)));
 const html=renderToStaticMarkup(React.createElement(AppDiscovery));
 for(const [id,path] of [['6757726663','/dailydharma'],['6762143790','/sleepreset'],['6766485903','/studio-cherie']]){
  const card=html.match(new RegExp(`<article[^>]*data-app-id="${id}"[^>]*>(.*?)</article>`,'s'))?.[1];assert.ok(card);assert.ok(card.includes(`href="${path}"`));
 }
 assert.match(html,/アプリの紹介/);
});

test('four app detail and blog CTAs preserve their destinations with eight distinct campaign identities',async()=>{
 const {loadPublishedApps,publishedAppStoreUrl}=await import(compiled(new URL('../lib/published-apps.ts',import.meta.url)));
 assert.equal(typeof publishedAppStoreUrl,'function');
 const apps=loadPublishedApps(),stores=apps.map(app=>app.store),tokens=new Set();
 const {AppDiscovery}=await import(compiled(new URL('../components/blog/OwnedMedia.tsx',import.meta.url)));
 const blog=renderToStaticMarkup(React.createElement(AppDiscovery));
 const cases=[
  {slug:'dailydharma',id:'6757726663',path:'/us/app/daily-dhamma/id6757726663',detailPath:'/us/app/daily-dhamma/id6757726663',detail:'web_6757726663_detail',blog:'web_6757726663_blog'},
  {slug:'sleepreset',id:'6762143790',path:'/us/app/for-better-sleep-sleep-reset/id6762143790',detailPath:'/us/app/for-better-sleep-sleep-reset/id6762143790',detail:'web_6762143790_detail',blog:'web_6762143790_blog'},
  {slug:'studio-cherie',id:'6766485903',path:'/us/app/studio-cherie/id6766485903',detailPath:'/jp/app/studio-cherie/id6766485903',detail:'web_6766485903_detail',blog:'web_6766485903_blog'},
  {slug:'thankful',id:'6759514159',path:'/us/app/thankful-gratitude-journal/id6759514159',detailPath:'/us/app/thankful-gratitude-journal/id6759514159',detail:'web_6759514159_detail',blog:'web_6759514159_blog'},
 ];
 for(const entry of cases){
  const app=apps.find(app=>app.id===entry.id);
  const page=await import(compiled(new URL(`../app/${entry.slug}/page.tsx`,import.meta.url)));
  const detail=renderToStaticMarkup(React.createElement(page.default));
  const card=blog.match(new RegExp(`<article[^>]*data-app-id="${entry.id}"[^>]*>(.*?)</article>`,'s'))?.[1];assert.ok(card);
  for(const [surface,html] of [['detail',detail],['blog',card]]){
   const url=new URL(publishedAppStoreUrl(app,surface));
   assert.equal(url.origin,'https://apps.apple.com');
   assert.equal(url.pathname,surface==='detail'?entry.detailPath:entry.path);
   assert.equal(url.searchParams.get('ct'),entry[surface]);
   assert.equal(url.searchParams.get('pt'),'93486075');assert.equal(url.searchParams.get('mt'),'8');
   assert.deepEqual([...url.searchParams.keys()].sort(),['ct','mt','pt']);
   assert.match(url.searchParams.get('ct'),/^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/);
   tokens.add(url.searchParams.get('ct'));
   const hrefs=[...html.matchAll(/<a[^>]+href="(https:\/\/apps\.apple\.com[^\"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'));
   assert.ok(hrefs.length>0,`${entry.slug} ${surface} CTA missing`);
   for(const href of hrefs)assert.equal(href,url.href,`${entry.slug} ${surface} CTA`);
  }
  if(entry.slug==='thankful')assert.equal(JSON.parse(detail.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]).downloadUrl,app.store);
 }
 assert.equal(tokens.size,8);assert.deepEqual(apps.map(app=>app.store),stores);
 for(const id of ['6755129214','6759667221']){
  const app=apps.find(app=>app.id===id);
  for(const surface of ['detail','blog'])assert.equal(publishedAppStoreUrl(app,surface),app.store);
  const card=blog.match(new RegExp(`<article[^>]*data-app-id="${id}"[^>]*>(.*?)</article>`,'s'))?.[1];assert.ok(card.includes(`href="${app.store}"`));
 }
});
