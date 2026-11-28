import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(join(ROOT, relative), "utf8");
const withoutComments = (source) => source.split("\n").filter((line) => !line.trim().startsWith("#")).join("\n");

test("Life Manager Cloud CTAs no longer sell a live trial or point at Railway", () => {
  const sources = [
    "app/lm/page.tsx",
    "app/lm/LmBody.tsx",
    "app/lm/ja/page.tsx",
    "lib/launchStrings.ts",
    "lib/writer-cta-url.js",
    "netlify/functions/_lib/writer-cta.js",
    "netlify.toml",
    "components/lm/LmJaCta.tsx",
  ].map(read);
  for (const source of sources) {
    assert.doesNotMatch(withoutComments(source), /life-call-production\.up\.railway\.app/);
  }
  assert.match(sources[6], /from = "\/money-printer"/);
  assert.match(sources[6], /to = "\/"/);
  const launch = sources[3];
  const enStart = launch.indexOf("    lm: {", launch.indexOf("  en: {"));
  const enEnd = launch.indexOf("    lifeManager: {", enStart);
  const jaStart = launch.indexOf("    lm: {", launch.indexOf("  ja: {"));
  const jaEnd = launch.indexOf("    lifeManager: {", jaStart);
  const [enLm, jaLm] = [launch.slice(enStart, enEnd), launch.slice(jaStart, jaEnd)];
  assert.match(enLm, /Life Manager Cloud has ended/);
  assert.match(enLm, /See Anicca/);
  assert.match(enLm, /closed\. No new sign-ups/);
  assert.doesNotMatch(enLm, /Connect Google Calendar/);
  assert.match(jaLm, /Life Manager Cloudは終了しました/);
  assert.match(jaLm, /Aniccaを見る/);
  assert.match(jaLm, /新規受付はありません/);
  assert.doesNotMatch(jaLm, /Googleカレンダーに接続/);
  assert.match(sources[1], /lifeManagerCtaHref/);
  assert.match(sources[4], /https:\/\/aniccaai\.com\//);
  assert.match(sources[7], /Aniccaを見る/);
});
