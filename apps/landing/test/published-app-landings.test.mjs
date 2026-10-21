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
