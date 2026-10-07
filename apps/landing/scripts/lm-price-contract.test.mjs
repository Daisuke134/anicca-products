import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(join(ROOT, relative), "utf8");
const CANONICAL_LINK = "https://buy.stripe.com/cNifZhgcC3h44yYeMK2880X";

test("Life Manager landing and checkout copy use the live $29 plan", () => {
  const registry = JSON.parse(read("monitors/registry.json"));
  assert.equal(registry.stripe_lm_url, CANONICAL_LINK);
  assert.match(registry.note, /\$29\/mo/);

  const sources = [
    "app/lm/page.tsx",
    "app/lm/LmBody.tsx",
    "app/life-manager/page.tsx",
    "lib/launchStrings.ts",
    "scripts/money-path-smoke.mjs",
  ].map(read);
  for (const source of sources) {
    assert.doesNotMatch(source, /\$20\/mo|月 ?\$20|20\/month/);
  }
  const enStart = sources[3].indexOf("    lm: {", sources[3].indexOf("  en: {"));
  const enEnd = sources[3].indexOf("    lifeManager: {", enStart);
  const jaStart = sources[3].indexOf("    lm: {", sources[3].indexOf("  ja: {"));
  const jaEnd = sources[3].indexOf("    lifeManager: {", jaStart);
  const [enLm, jaLm] = [sources[3].slice(enStart, enEnd), sources[3].slice(jaStart, jaEnd)];
  assert.match(enLm, /Connect Google Calendar/);
  assert.match(enLm, /7-day free trial/);
  assert.match(enLm, /card is required/i);
  assert.match(enLm, /\$29\/mo/);
  assert.doesNotMatch(enLm, /Telegram|home or base|phone calls|coming soon/i);
  assert.match(enLm, /does not read your Gmail inbox/i);
  assert.match(jaLm, /Googleカレンダーに接続/);
  assert.match(jaLm, /7日間無料/);
  assert.match(jaLm, /カード登録が必要/);
  assert.match(jaLm, /月 ?\$29/);
  assert.doesNotMatch(jaLm, /Telegram|自宅|拠点|電話|近日公開/);
  assert.match(jaLm, /Gmailの受信箱は読みません/);
  assert.match(sources[1], /lifeManagerCtaHref/);
  assert.doesNotMatch(sources[0], /proactive general agent that manages your body, mind, and money/);
});
