import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const configs = [
  ['repository root', new URL('../../../netlify.toml', import.meta.url)],
  ['Netlify deploy root', new URL('../netlify.toml', import.meta.url)],
];

function redirectRules(contents) {
  return contents.split('[[redirects]]').slice(1).map((raw) => {
    const block = raw.split(/\n\s*\[/, 1)[0];
    return {
      from: block.match(/^\s*from\s*=\s*"([^"]+)"/m)?.[1],
      to: block.match(/^\s*to\s*=\s*"([^"]+)"/m)?.[1],
      status: block.match(/^\s*status\s*=\s*(\d+)/m)?.[1],
      force: block.match(/^\s*force\s*=\s*(true|false)/m)?.[1],
    };
  });
}

test('the Life Manager Cloud and Google OAuth paths proxy through both Netlify configs', () => {
  const expected = [
    ['/maritime', 'https://life-call-production.up.railway.app/maritime'],
    ['/maritime/*', 'https://life-call-production.up.railway.app/maritime/:splat'],
    ['/auth/google', 'https://life-call-production.up.railway.app/auth/google'],
    ['/auth/google/callback', 'https://life-call-production.up.railway.app/auth/google/callback'],
  ];

  for (const [name, path] of configs) {
    const rules = redirectRules(readFileSync(path, 'utf8'));
    for (const [from, to] of expected) {
      const matching = rules.filter((rule) => rule.from === from);
      assert.equal(matching.length, 1, `${name}: expected exactly one rewrite for ${from}`);
      assert.deepEqual(
        { to: matching[0].to, status: matching[0].status, force: matching[0].force },
        { to, status: '200', force: 'true' },
        `${name}: ${from} must remain same-origin and preserve the backend response`,
      );
    }
  }
});
