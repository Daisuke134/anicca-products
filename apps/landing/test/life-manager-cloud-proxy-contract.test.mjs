import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const configs = [
  ['repository root', new URL('../../../netlify.toml', import.meta.url)],
  ['Netlify deploy root', new URL('../netlify.toml', import.meta.url)],
];
const overlayWorkflows = [
  new URL('../../../.github/workflows/landing-pr-build.yml', import.meta.url),
  new URL('../../../.github/workflows/netlify-deploy.yml', import.meta.url),
];

function redirectRules(contents) {
  return contents.split('[[redirects]]').slice(1).map((raw) => {
    const block = raw.split(/\n\s*\[/, 1)[0];
    return {
      from: block.match(/^\s*from\s*=\s*"([^"]+)"/m)?.[1],
      to: block.match(/^\s*to\s*=\s*"([^"]+)"/m)?.[1],
      status: block.match(/^\s*status\s*=\s*(\d+)/m)?.[1],
      force: block.match(/^\s*force\s*=\s*(true|false)/m)?.[1],
      block,
    };
  });
}

test('the Cloud and Google routes use direct same-origin Netlify rewrites in both configs', () => {
  const expected = [
    ['/maritime', 'https://life-call-production.up.railway.app/maritime'],
    ['/maritime/*', 'https://life-call-production.up.railway.app/maritime/:splat'],
    ['/auth/google', 'https://life-call-production.up.railway.app/auth/google'],
    ['/auth/google/callback', 'https://life-call-production.up.railway.app/auth/google/callback'],
    ['/api/stripe/cloud/checkout', 'https://life-call-production.up.railway.app/api/stripe/cloud/checkout'],
    ['/api/stripe/cloud/portal', 'https://life-call-production.up.railway.app/api/stripe/cloud/portal'],
    ['/api/stripe/cloud/webhook', 'https://life-call-production.up.railway.app/api/stripe/cloud/webhook'],
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

      // Keep these as direct proxy rewrites: no function/body parser or custom header
      // override can consume Cookie, Origin/CSRF, Stripe-Signature, or webhook bytes.
      assert.doesNotMatch(matching[0].to, /\.netlify\/functions/);
      assert.doesNotMatch(matching[0].block, /^\s*(headers|signed|query|conditions)\s*=/m, `${name}: ${from} must not transform the proxied request`);
    }
  }
});

test('both landing workflows pin the same immutable Life Manager overlay revision', () => {
  const pins = overlayWorkflows.flatMap((path) =>
    [...readFileSync(path, 'utf8').matchAll(/^\s*MANAGER_MARKETING_REVISION:\s*([a-f0-9]+)\s*$/gm)].map((match) => match[1]),
  );
  assert.equal(pins.length, 4, 'expected one staging and one overlay pin in each workflow');
  assert.ok(pins.every((pin) => /^[a-f0-9]{40}$/.test(pin)), 'each overlay pin must be a full commit SHA');
  assert.equal(new Set(pins).size, 1, 'both workflows must use the same immutable Life Manager revision');
});

test('the Cloud landing copy does not expose a test price or the separate Calendar offer', () => {
  const copy = readFileSync(new URL('../lib/launchStrings.ts', import.meta.url), 'utf8');
  const cloud = copy.match(/\n    lm: \{([\s\S]*?)\n    \},\n\n    lifeManager: \{/)?.[1];
  const calendar = copy.match(/\n    lifeManager: \{([\s\S]*?)\n    \},\n  \},\n\n  ja: \{/)?.[1];
  assert.ok(cloud, 'expected localized /lm Cloud copy');
  assert.ok(calendar, 'expected the separate legacy Calendar offer copy');
  assert.doesNotMatch(cloud, /\$19|\b19\/month\b|7-day|seven-day|\$29|\b29\/mo\b/i);
  assert.match(calendar, /\$29\/mo/);
});
