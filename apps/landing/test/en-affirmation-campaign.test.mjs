import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Execute the actual TypeScript module on Node 20 too, without mocks or a second URL builder.
const source = readFileSync(new URL('../lib/en-affirmation-problems.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { EN_AFFIRMATION_PROBLEMS, enAffirmationAppStoreUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
);
const validCampaign = /^[A-Za-z0-9][A-Za-z0-9_-]{0,29}$/;
const campaign = (slug, prefix) => new URL(enAffirmationAppStoreUrl(slug, prefix)).searchParams.get('ct');

test('every real EN article has a valid unique campaign and preserves the App Store destination', () => {
  const tokens = new Set();
  assert.ok(EN_AFFIRMATION_PROBLEMS.length >= 23);
  for (const entry of EN_AFFIRMATION_PROBLEMS) {
    const url = new URL(enAffirmationAppStoreUrl(entry.slug, entry.campaignPrefix));
    const token = url.searchParams.get('ct');
    assert.match(token, validCampaign, entry.slug);
    assert.equal(url.origin + url.pathname, 'https://apps.apple.com/app/id6755129214');
    assert.equal(url.searchParams.get('pt'), '93486075');
    assert.equal(url.searchParams.get('mt'), '8');
    assert.deepEqual([...url.searchParams.keys()].sort(), ['ct', 'mt', 'pt']);
    assert.ok(!tokens.has(token), `duplicate campaign: ${entry.slug}`);
    tokens.add(token);
  }
});

test('already-valid real article campaign identities do not change', () => {
  for (const entry of EN_AFFIRMATION_PROBLEMS) {
    const prefix = entry.campaignPrefix ?? 'seo_en';
    const original = `${prefix}_${entry.slug}`;
    if (validCampaign.test(original)) assert.equal(campaign(entry.slug, prefix), original);
  }
});

for (const prefix of ['seo_en', 'seo_geo']) {
  test(`${prefix} preserves 29/30 characters and shortens 31 characters`, () => {
    for (const size of [29, 30, 31]) {
      const slug = 'a'.repeat(size - prefix.length - 1);
      const result = campaign(slug, prefix);
      assert.match(result, validCampaign);
      if (size <= 30) assert.equal(result, `${prefix}_${slug}`);
      else assert.equal(result.length, 30);
    }
  });
}

test('long campaigns are stable and distinguish shared prefixes and campaign lanes', () => {
  assert.equal(campaign('affirmations-for-overthinking', 'seo_en'), 'seo_en_affirm-85411cb1e07d1bcb');
  const slugs = EN_AFFIRMATION_PROBLEMS.map(p => p.slug).filter(s => s.length > 24);
  const inputs = slugs.flatMap(s => [[s, 'seo_en'], [s, 'seo_geo']]);
  // Boundary/collision cases explicitly exercise differing suffixes after the retained prefix.
  inputs.push(['affirmations-for-overthinking-at-work', 'seo_en'],
    ['affirmations-for-overthinking-at-home', 'seo_en']);
  const tokens = inputs.map(([s, p]) => campaign(s, p));
  assert.equal(new Set(tokens).size, inputs.length);
  assert.deepEqual(inputs.map(([s, p]) => campaign(s, p)), tokens);
  for (const token of tokens) assert.match(token, validCampaign);
});

test('invalid slug or runtime campaign prefix fails before producing an invalid URL', () => {
  for (const slug of ['', '日本語', 'has space', 'bad?slug', '-leading']) {
    assert.throws(() => enAffirmationAppStoreUrl(slug));
  }
  assert.throws(() => enAffirmationAppStoreUrl('self-doubt', 'unregistered'));
});
