import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../lib/site-hit.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { trackEvent } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

test('trackEvent forwards source, medium, and campaign from the page URL', async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const oldFetch = globalThis.fetch;
  let payload;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        pathname: '/monk',
        search: '?utm_source=x&utm_medium=social&utm_campaign=ai_monk_launch&ct=test_codex_1027',
      },
    },
  });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true };
  };

  try {
    trackEvent('paywall_shown');
    await Promise.resolve();
    assert.equal(payload.utm_source, 'x');
    assert.equal(payload.utm_medium, 'social');
    assert.equal(payload.utm_campaign, 'ai_monk_launch');
    assert.equal(payload.ct, 'test_codex_1027');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else delete globalThis.window;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator);
    else delete globalThis.navigator;
  }
});
