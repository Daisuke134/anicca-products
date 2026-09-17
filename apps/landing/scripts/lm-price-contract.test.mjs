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
  assert.match(sources[3], /\$29\/mo/);
  assert.match(sources[3], /Telegram/);
  assert.doesNotMatch(sources[3], /coming soon|Coming soon|近日公開|3-day free trial|3日間無料|trial/);
});
