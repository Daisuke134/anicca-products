import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compiled } from './helpers/render-module.mjs';
const { default: Directory } = await import(compiled(new URL('../components/AiMonkDatabase.tsx', import.meta.url)));

test('directory has a direct title and an identifiable icon for every account', () => {
  const html = renderToStaticMarkup(React.createElement(Directory, {
    accounts: [
      { id: 'yang-mun', display_name: 'Yang Mun', persona_type: 'Monk persona', ai_status: 'reported', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] } },
      { id: 'sample', display_name: 'Sample Monk', persona_type: 'Account lead', ai_status: 'unverified', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] } },
    ],
    profileImages: { 'yang-mun': '/assets/ai-monk-profiles/yang-mun.png' },
    sourceCount: 0, updatedAt: '2026-10-23',
  }));
  assert.match(html, /<h1[^>]*>AI Monk Database<\/h1>/);
  assert.match(html, /src="\/assets\/ai-monk-profiles\/yang-mun.png"/);
  assert.match(html, /alt="Yang Mun profile image"/);
  assert.match(html, /aria-label="Sample Monk initials; profile image unavailable"/);
  assert.doesNotMatch(html, /behind|the robe|field notes|with receipts|everyone knows/);
});

test('audience cards disclose rounding and link the exact observation source', () => {
  const html = renderToStaticMarkup(React.createElement(Directory, {
    accounts: [{ id: 'sample', display_name: 'Sample', persona_type: 'Monk persona', ai_status: 'unverified', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] },
      platforms: [{ platform: 'Instagram', handle: 'sample', profile_url: 'https://www.instagram.com/sample/',
        snapshots: [{ metric: 'followers', value: 2500000, as_of: '2026-10-22', source_id: 'provider-snapshot', status: 'public_connector_snapshot_rounded' }] }] }],
    sourceCount: 1, updatedAt: '2026-10-22',
    sources: [{ id: 'provider-snapshot', title: 'Public provider observation', url: 'https://example.test/provider-capture' }],
  }));
  assert.match(html, /≈2.5M/);
  assert.match(html, /Rounded provider snapshot/);
  assert.match(html, /href="https:\/\/example.test\/provider-capture"/);
  assert.match(html, /2026-10-22/);
});

test('the visible directory and its count exclude illustrations and unreviewed leads', () => {
  const html = renderToStaticMarkup(React.createElement(Directory, {
    accounts: [
      { id: 'yang-mun', display_name: 'Yang Mun', persona_type: 'AI monk avatar', ai_status: 'reported', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] } },
      { id: 'kai-tsukimi', display_name: 'Kai Tsukimi', persona_type: 'Illustrated storyteller', ai_status: 'unverified', directory_scope: { status: 'excluded', reason: 'Illustration' } },
      { id: 'buddha-would-say', display_name: 'Buddha Would Say', persona_type: 'Illustrated monk', ai_status: 'unverified', directory_scope: { status: 'excluded', reason: 'Illustration' } },
      { id: 'pending', display_name: 'Pending candidate', directory_scope: { status: 'pending' } },
      { id: 'missing-scope', display_name: 'Unreviewed candidate' },
    ], sourceCount: 0, updatedAt: '2026-10-23',
  }));
  assert.match(html, /AI monk video avatars/);
  assert.equal((html.match(/<article /g) ?? []).length, 1);
  assert.doesNotMatch(html, /Kai Tsukimi|Buddha Would Say|Pending candidate|Unreviewed candidate/);
  assert.match(html, /<strong[^>]*>1<\/strong> profiles/);
});


test('business cards show views, products and reported revenue without an AI-status interface', () => {
  const html = renderToStaticMarkup(React.createElement(Directory, {
    accounts: [{ id: 'business', display_name: 'Business Monk', persona_type: 'Monk avatar', ai_status: 'reported', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] },
      ai_evidence: [{ source_id: 'report', summary: 'AI production evidence' }], unknowns: ['AI origin unknown'],
      creative_samples: [{ url: 'https://www.youtube.com/shorts/a', title: 'Sample', structure_summary: 'Original', views: 1234567, views_captured_at: '2026-10-22' }],
      offers: [{ type: 'unknown product', as_of: '2025-01-01' }, { type: 'old product', as_of: '2025-02-01' }, { type: 'eBook', name: 'Original guide', price: 49.99, currency: 'USD', as_of: '2026-10-23', url: 'https://example.test/product' }],
      revenue_observations: [{ metric: 'gross_revenue', amount: 213000, currency: 'USD', period_months: 3, as_of: '2026-01-28', comparison: 'greater_than', source_id: 'report', status: 'creator_reported' }],
    }, { id: 'unknown', display_name: 'Unknown Monk', persona_type: 'Monk avatar', ai_status: 'unverified', directory_scope: { status: 'included', source_ids: ['fixture-evidence'] } }],
    sourceCount: 1, updatedAt: '2026-10-22', sources: [{ id: 'report', title: 'Reported dashboard claim', url: 'https://example.test/revenue-report' }],
  }));
  assert.doesNotMatch(html, /AI: |AI status|Filter by evidence status|Why this status|AI production evidence|AI origin unknown|Profile type/);
  assert.match(html, /Top sampled video/);
  assert.match(html, /1.2M/);
  assert.match(html, /213K/);
  assert.match(html, /3 months/);
  assert.match(html, /Creator-reported/);
  assert.match(html, /2026-01-28/);
  assert.match(html, /href="https:\/\/example.test\/revenue-report"/);
  assert.match(html, /Original guide/);
  assert.match(html, /49.99/);
  assert.match(html, /Observed 2026-10-23/);
  assert.match(html.split('<details')[0], /Original guide/);
  assert.match(html, /Revenue not available/);
  assert.match(html, /value="views"/);
  assert.match(html, /value="revenue"/);
});
