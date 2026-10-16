import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EN_AFFIRMATION_PROBLEMS,
  getEnAffirmationProblem,
} from '../lib/en-affirmation-problems.ts';

const publicationDate = '2026-10-16';
const newGuideSlugs = [
  'affirmations-for-sunday-scaries',
  'affirmations-for-social-anxiety-at-work',
];

test('new English affirmation guides use their actual publication and update dates', () => {
  for (const slug of newGuideSlugs) {
    const sourceArticle = EN_AFFIRMATION_PROBLEMS.find((article) => article.slug === slug);
    const article = getEnAffirmationProblem(slug);

    assert.ok(sourceArticle, `expected source article ${slug}`);
    assert.equal(sourceArticle.datePublished, publicationDate, `${slug} explicit publication date`);
    assert.equal(sourceArticle.dateModified, publicationDate, `${slug} explicit update date`);
    assert.equal(article?.datePublished, publicationDate, `${slug} resolved publication date`);
    assert.equal(article?.dateModified, publicationDate, `${slug} resolved update date`);
  }
});

test('articles without explicit dates keep their existing campaign-based dates', () => {
  const defaultSeed = EN_AFFIRMATION_PROBLEMS.find(
    (article) => !article.campaignPrefix && !article.datePublished,
  );
  const geoSeed = EN_AFFIRMATION_PROBLEMS.find(
    (article) => article.campaignPrefix === 'seo_geo' && !article.datePublished,
  );

  assert.ok(defaultSeed, 'expected a legacy English article without a campaign prefix');
  assert.ok(geoSeed, 'expected a legacy GEO article without an explicit date');
  assert.equal(getEnAffirmationProblem(defaultSeed.slug)?.datePublished, '2026-10-09');
  assert.equal(getEnAffirmationProblem(defaultSeed.slug)?.dateModified, '2026-10-09');
  assert.equal(getEnAffirmationProblem(geoSeed.slug)?.datePublished, '2026-10-15');
  assert.equal(getEnAffirmationProblem(geoSeed.slug)?.dateModified, '2026-10-15');
});
