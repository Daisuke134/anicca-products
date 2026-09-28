import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../lib/render-article-markdown.js';

// Regression: run 20260928-132912's live blog pages had zero conversion
// links even though article-ja.md/article-en.md each carried exactly one
// CTA -- the link was dropped upstream (self_owned_article.py's preview/paid
// split), not by this renderer. This file pins the renderer's half of the
// contract: it must keep rendering ANY https:// or /-prefixed markdown link
// as a plain <a>, with no per-host allowlist, so a self-owned aniccaai.com/lm
// CTA and an external Capafy capafy.ai/agent/<id> CTA (#6110) both survive.

const SELF_OWNED_CTA =
  'https://aniccaai.com/lm?product_id=anicca&run_id=20260928-132912' +
  '&artifact_id=article-ja&variant_id=role-map&click_id=20260928-132912-article-ja';

const CAPAFY_CTA =
  'https://capafy.ai/agent/9563867391?product_id=capafy-skills' +
  '&run_id=20260928-132912&artifact_id=article-ja&variant_id=hook-variant-1' +
  '&click_id=20260928-132912-article-ja&ct=article-marketing-strategist';

// The renderer HTML-escapes the whole line (including "&" -> "&amp;") before
// substituting the <a> tag, so a query string's "&" separators show up
// escaped inside href too -- that is the existing, correct HTML-escaping
// behavior, not something these tests assert against.
function expectedHref(url) {
  const escaped = url.replace(/&/g, "&amp;");
  return new RegExp(`<a href="${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
}

test('renders a self-owned aniccaai.com/lm CTA link as a real anchor', () => {
  const html = renderMarkdown(`See [the workspace](${SELF_OWNED_CTA}) to continue.`);
  assert.match(html, expectedHref(SELF_OWNED_CTA));
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener"/);
});

test('renders an external Capafy CTA link as a real anchor, unmodified', () => {
  const html = renderMarkdown(`See [the agent](${CAPAFY_CTA}) to continue.`);
  assert.match(html, expectedHref(CAPAFY_CTA));
});

test('does not require a host allowlist -- any absolute https link renders', () => {
  const html = renderMarkdown('See [an arbitrary site](https://example.com/whatever?x=1) here.');
  assert.match(html, /<a href="https:\/\/example\.com\/whatever\?x=1"/);
});
