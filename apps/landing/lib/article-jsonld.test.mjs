import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleJsonLd } from './article-jsonld.mjs';

const post = {
  slug: 'hooks-for-beauty-videos', title: 'Hooks for beauty videos', date: '2026-10-18',
  markdown: '# Hooks for beauty videos\n\nIntro.\n\n## FAQ\n\n**Do hooks need a face?**\nNo. Text on screen works.\n\n### How many hooks should I test?\nThree per week.\n',
};

test('every article gets Article JSON-LD and its FAQ becomes FAQPage', () => {
  const [article, faq] = buildArticleJsonLd(post);
  assert.equal(article['@type'], 'Article');
  assert.equal(article.headline, 'Hooks for beauty videos');
  assert.equal(article.url, 'https://aniccaai.com/blog/hooks-for-beauty-videos');
  assert.equal(faq['@type'], 'FAQPage');
  assert.deepEqual(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
    [['Do hooks need a face?', 'No. Text on screen works.'], ['How many hooks should I test?', 'Three per week.']]);
});

test('paid articles never expose body text as FAQ answers', () => {
  const out = buildArticleJsonLd({ ...post, access_model: 'preview_paid' });
  assert.equal(out.length, 1);
});

test('Japanese full-width question marks are recognised', () => {
  const ja = { slug: 'x-ja', title: 'x', date: '2026-10-18',
    markdown: '**Q1. フックは顔出しが必要ですか？**\n必要ありません。\n\n**Q2. 何本テストしますか？**\n週に3本です。\n' };
  const [, faq] = buildArticleJsonLd(ja);
  assert.equal(faq.mainEntity.length, 2);
  assert.equal(faq.mainEntity[0].name, 'Q1. フックは顔出しが必要ですか？');
});
