import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compiled } from './helpers/render-module.mjs';
const { default: Directory } = await import(compiled(new URL('../components/AiMonkDatabase.tsx', import.meta.url)));

test('audience cards disclose rounding and link the exact observation source', () => {
  const html = renderToStaticMarkup(React.createElement(Directory, {
    accounts: [{ id: 'sample', display_name: 'Sample', persona_type: 'Monk persona', ai_status: 'unverified',
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
