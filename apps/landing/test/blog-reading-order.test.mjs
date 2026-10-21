import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function compiled(file, imports={}) {
 let {outputText}=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 const replacements={'react/jsx-runtime':pathToFileURL(require.resolve('react/jsx-runtime')).href,...imports};
 for(const [name,url] of Object.entries(replacements)) outputText=outputText.replaceAll(`from "${name}"`,`from "${url}"`).replaceAll(`from '${name}'`,`from '${url}'`);
 return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
test('rendered article archive is primary and external routes come afterward',async()=>{
 process.chdir(fileURLToPath(new URL('../',import.meta.url)));
 const jsonLd=compiled(new URL('../components/JsonLd.tsx',import.meta.url));
 const page=compiled(new URL('../app/blog/page.tsx',import.meta.url),{
  '@/components/JsonLd':jsonLd,
  'next/link':pathToFileURL(require.resolve('next/link')).href,
  '../../lib/blog-business.mjs':new URL('../lib/blog-business.mjs',import.meta.url).href,
 });
 const {default:BlogIndex}=await import(page);
 const html=renderToStaticMarkup(React.createElement(BlogIndex));
 const archive=html.indexOf('<ol');
 const mirrors=html.indexOf('Read these somewhere else');
 assert.ok(archive>0 && mirrors>archive);
 assert.ok(html.indexOf('href="/blog/gratitude-journal-repeating-yourself"')<mirrors);
 assert.match(html,/<nav[^>]+aria-label="Articles navigation"[^>]*>.*href="\/blog".*href="\/dais".*href="\/en#story".*<\/nav>/);
 assert.match(html,/href="\/blog\/c\/thankful"/);
});

test('article archive declares its self-canonical',async()=>{
 const page=compiled(new URL('../app/blog/page.tsx',import.meta.url),{
  '@/components/JsonLd':compiled(new URL('../components/JsonLd.tsx',import.meta.url)),
  'next/link':pathToFileURL(require.resolve('next/link')).href,
  '../../lib/blog-business.mjs':new URL('../lib/blog-business.mjs',import.meta.url).href,
 });
 const {metadata}=await import(page);
 assert.equal(metadata.alternates?.canonical,'https://aniccaai.com/blog');
});

test('sitemap includes the archive once and retains article destinations',async()=>{
 process.chdir(fileURLToPath(new URL('../',import.meta.url)));
 const imports={'@/lib/blog-business.mjs':new URL('../lib/blog-business.mjs',import.meta.url).href};
 for(const name of ['affirmation-alternates','blog-posts','en-affirmation-problems','es-affirmation-problems','ja-affirmation-problems','kokoro-quiz','lm-ja-guides']) {
  imports['@/lib/'+name]=compiled(new URL('../lib/'+name+'.ts',import.meta.url));
 }
 const {default:sitemap}=await import(compiled(new URL('../app/sitemap.ts',import.meta.url),imports));
 const entries=sitemap();
 assert.equal(entries.filter(entry=>entry.url==='https://aniccaai.com/blog').length,1);
 assert.ok(entries.some(entry=>entry.url==='https://aniccaai.com/blog/gratitude-journal-repeating-yourself'));
 assert.ok(entries.some(entry=>entry.url==='https://aniccaai.com/affirmation-app/a/affirmations-for-overthinking'));
 assert.equal(new Set(entries.map(entry=>entry.url)).size,entries.length);
});
