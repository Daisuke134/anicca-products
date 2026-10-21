import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {compiled} from './helpers/render-module.mjs';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const route=new URL('../app/dailydharma/page.tsx',import.meta.url);
test('official developer destination renders a canonical Daily Dhamma introduction with its Store CTA',async()=>{
 assert.ok(existsSync(route),'The Apple-linked /dailydharma product page must exist');
 const page=await import(compiled(route));
 assert.equal(page.metadata.alternates.canonical,'https://aniccaai.com/dailydharma');
 const html=renderToStaticMarkup(React.createElement(page.default));
 assert.match(html,/href="https:\/\/apps.apple.com\/us\/app\/daily-dhamma\/id6757726663[^\"]*"/);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 for(const href of ['/dailydharma/support','/dailydharma/privacy'])assert.ok(html.includes(`href="${href}"`));
 assert.doesNotMatch(html,/\b(no data collected|clinically proven|unlimited reminders)\b|[↗⬆↑]/i);
});
test('reading, reminder and Premium bookmark explanations use actual accessible screenshot files',async()=>{
 assert.ok(existsSync(route),'Product explanation page must exist');
 const page=await import(compiled(route));const html=renderToStaticMarkup(React.createElement(page.default));
 for(const name of ['reading','reminders','dark']){
  assert.match(html,new RegExp(`src="/images/dailydharma/${name}\\.webp"[^>]*alt="[^\"]+"`));
  assert.ok(existsSync(new URL(`../public/images/dailydharma/${name}.webp`,import.meta.url)));
 }
 assert.match(html,/Premium[\s\S]*bookmark/i);
 assert.match(html,/Free download with in-app purchases/);
 assert.match(html,/iOS 15\.1/);
});
