import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(join(ROOT, relative), "utf8");
const CANONICAL_LINK = "https://buy.stripe.com/cNifZhgcC3h44yYeMK2880X";

test("legacy subscription price remains canonical without making Calendar a Cloud signup requirement", () => {
  const registry = JSON.parse(read("monitors/registry.json"));
  assert.equal(registry.stripe_lm_url, CANONICAL_LINK);
  assert.match(registry.note, /\$29\/mo/);

  const sources = [
    "app/lm/page.tsx",
    "app/lm/LmBody.tsx",
    "app/life-manager/page.tsx",
    "lib/launchStrings.ts",
    "scripts/money-path-smoke.mjs",
    "app/dais/DaisBody.tsx",
  ].map(read);
  for (const source of sources) {
    assert.doesNotMatch(source, /\$20\/mo|月 ?\$20|20\/month/);
  }
  assert.match(sources[5], /\$29\/mo · 7-day free trial/);
  assert.match(sources[5], /月 \$29 · 7日間無料/);
  const enStart = sources[3].indexOf("    lm: {", sources[3].indexOf("  en: {"));
  const enEnd = sources[3].indexOf("    lifeManager: {", enStart);
  const jaStart = sources[3].indexOf("    lm: {", sources[3].indexOf("  ja: {"));
  const jaEnd = sources[3].indexOf("    lifeManager: {", jaStart);
  const [enLm, jaLm] = [sources[3].slice(enStart, enEnd), sources[3].slice(jaStart, jaEnd)];
  assert.match(enLm, /work, money, everyday responsibilities, body, and mind/i);
  assert.match(enLm, /Google sign-in verifies identity only/i);
  assert.match(enLm, /first earning workflow uses Capafy/i);
  assert.doesNotMatch(enLm, /Connect Google Calendar|Calendar permission is required|card is required|7-day free trial/i);
  assert.match(jaLm, /仕事、お金、日々の用事、体と心/);
  assert.match(jaLm, /Googleログインは本人確認だけ/);
  assert.match(jaLm, /最初の収益化ワークフローはCapafy/);
  assert.doesNotMatch(jaLm, /Googleカレンダーに接続|Calendar権限が必要|7日間無料|カード登録が必要/);
  assert.match(sources[1], /lifeManagerCtaHref/);
  assert.doesNotMatch(sources[0], /proactive general agent that manages your body, mind, and money/);
});
