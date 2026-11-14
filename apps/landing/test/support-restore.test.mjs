import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const lang of ['en', 'ja']) {
  const page = readFileSync(new URL('../app/support/' + lang + '/page.tsx', import.meta.url), 'utf8');
  test(lang + ': paid-access help is discoverable before contact', () => {
    const section = page.match(/<section[^>]*id="purchased-but-locked"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, 'paid-access help section is missing');
    assert.ok(page.indexOf(section) < page.indexOf('mailto:'), 'self-service must precede email');
    assert.match(section, lang === 'en' ? /same Apple Account/ : /購入時と同じApple Account/);
    assert.match(section, lang === 'en' ? /Restore Purchases/ : /購入を復元/);
    const appleLocale = lang === 'ja' ? 'ja-jp' : 'en-us';
    assert.ok(section.includes(`href="https://support.apple.com/${appleLocale}/108096"`), 'Apple restoration link must match page language');
  });
  test(lang + ': no repurchase or credentials requested', () => {
    const section = page.match(/<section[^>]*id="purchased-but-locked"[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, 'paid-access help section is missing');
    assert.match(section, lang === 'en' ? /Do not buy it again/ : /再購入せず/);
    assert.match(section, lang === 'en' ? /Never send passwords or verification codes/ : /パスワードや認証コードは送らない/);
    assert.match(section, lang === 'en' ? /error message/ : /エラーメッセージ/);
    assert.doesNotMatch(section, /<form|<input|fetch\(/);
  });
}
