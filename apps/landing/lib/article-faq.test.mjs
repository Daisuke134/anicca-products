import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleFaq } from './article-faq.mjs';
import { buildArticleJsonLd } from './article-jsonld.mjs';

const en = { slug: 'a', title: 'Hooks', date: '2026-11-01', markdown: [
  '# Hooks', '', 'Intro.', '',
  '## Open with the problem', '', 'The first second decides retention. Viewers swipe fast. Extra text here.', '',
  '## Show the result early', '', '![img](/x.jpg)', '', 'Put the outcome on screen before explaining how it happened.', '',
  '## Keep captions short', '', '- list only', '', 'Captions under eight words are easier to read on a phone.', '',
  '## Sources', '', 'Some long source line that should never become an answer at all.',
].join('\n') };

test('section fallback: 3-5 body-only pairs, visible, matching JSON-LD', () => {
  const { pairs, visible } = articleFaq(en);
  assert.equal(visible, true);
  assert.equal(pairs.length, 3);
  const body = en.markdown.replace(/\s+/g, ' ');
  for (const [, a] of pairs) assert.ok(body.includes(a), a);
  const faq = buildArticleJsonLd(en).find((x) => x['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), pairs);
  assert.ok(!pairs.some(([q]) => q.includes('Sources')));
});

test('too few sections: no FAQ rather than invent', () => {
  const r = articleFaq({ ...en, markdown: '## One\n\nOnly one section with enough words to qualify here.\n' });
  assert.deepEqual(r, { pairs: [], visible: false });
  assert.equal(buildArticleJsonLd({ ...en, markdown: '## One\n\nx\n' }).length, 1);
});

test('Japanese stays Japanese', () => {
  const ja = { slug: 'j', title: 'フック', date: '2026-11-01', lang: 'ja', markdown:
    '## 最初の1秒\n\n最初の1秒で視聴者は見るかどうかを決めます。だから冒頭が大事です。\n\n## 結果を先に見せる\n\n説明の前に、結果を画面に出すと離脱が減ります。\n\n## 字幕は短く\n\n字幕は8語以内にすると、スマホでも読みやすくなります。\n' };
  const { pairs } = articleFaq(ja);
  assert.equal(pairs.length, 3);
  assert.equal(pairs[0][0], '「最初の1秒」とは、どういうことですか？');
  assert.ok(pairs[0][1].startsWith('最初の1秒で'));
});

test('existing question headings keep the old in-body behaviour', () => {
  const r = articleFaq({ ...en, markdown: '**A?**\nYes.\n\n### B?\nNo.\n' });
  assert.equal(r.visible, false);
  assert.equal(r.pairs.length, 2);
});

test('paid articles: nothing', () => {
  assert.deepEqual(articleFaq({ ...en, access_model: 'both' }), { pairs: [], visible: false });
});
