// Exact built-preview stylesheet contract. Run with PREVIEW_BASE_URL after deployment.
// This checks linked CSS coverage, not computed browser layout or hydration.
import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
const base=process.env.PREVIEW_BASE_URL;
for(const path of ['/dailydharma','/sleepreset','/studio-cherie'])test(`${path} ships padded, solid download CTA and navigation styles`,{skip:!base},async()=>{
 const response=await fetch(base+path);assert.equal(response.status,200);const html=await response.text();
 const hrefs=[...html.matchAll(/<link\b[^>]*href="([^\"]+\.css(?:\?[^\"]*)?)"[^>]*>/g)].map(m=>m[1]);assert.ok(hrefs.length);
 const sheets=await Promise.all(hrefs.map(async href=>{const r=await fetch(new URL(href,base));assert.equal(r.status,200);return r.text();}));
 const declarations=selector=>{const found={};for(const css of sheets)postcss.parse(css).walkRules(rule=>{if(rule.selectors?.includes(selector))rule.walkDecls(d=>{found[d.prop]=d.value;});});return found;};
 const button=declarations('.media-button');assert.ok(button.padding && !/^0(?:px)?$/.test(button.padding),'download CTA must ship nonzero padding');assert.ok(button.background && button.background!=='transparent','download CTA must ship a solid background');
 const nav=declarations('.media-nav');assert.ok(nav['padding-left'] && nav['padding-left']!=='0','navigation must ship horizontal spacing');
 if(path==='/studio-cherie'){assert.match(html,/<main[^>]*lang="ja"/);assert.match(html,/<nav[^>]*class="media-nav"[^>]*aria-label="サイト内移動"/);}
});
