"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const LANDING = path.resolve(__dirname, "../../landing");
const LM_BODY = path.join(LANDING, "app/lm/LmBody.tsx");
const LAUNCH_STRINGS = path.join(LANDING, "lib/launchStrings.ts");

function localizedLmBlock(source, locale) {
  const localeStart = source.indexOf(`  ${locale}: {`);
  const start = source.indexOf("    lm: {", localeStart);
  const end = source.indexOf("    lifeManager: {", start);
  assert.ok(localeStart >= 0 && start > localeStart && end > start, `${locale} /lm copy block exists`);
  return source.slice(start, end);
}

test("public /lm primary CTA starts the same-tab Web app Calendar flow", async () => {
  const source = fs.readFileSync(LM_BODY, "utf8");
  const start = source.indexOf("href={startHref}");
  const end = source.indexOf("</a>", start);
  const anchor = source.slice(source.lastIndexOf("<a", start), end + 4);
  const { LIFE_MANAGER_WEB_APP_URL, lifeManagerCtaHref } = await import(
    pathToFileURL(path.join(LANDING, "lib/writer-cta-url.js")).href
  );

  assert.ok(start >= 0 && end > start, "primary CTA is present");
  assert.match(anchor, /primaryCta/);
  assert.doesNotMatch(anchor, /target=/);
  assert.equal(lifeManagerCtaHref(""), LIFE_MANAGER_WEB_APP_URL);
  assert.match(LIFE_MANAGER_WEB_APP_URL, /^https:\/\/life-call-production\.up\.railway\.app\/lm$/);
  assert.doesNotMatch(source, /TG_DEEPLINK|t\.me\/LifeManagerBotbot/);
});

test("public /lm carries campaign UTMs to the app entry route", async () => {
  const { LIFE_MANAGER_WEB_APP_URL, lifeManagerCtaHref } = await import(
    pathToFileURL(path.join(LANDING, "lib/writer-cta-url.js")).href
  );
  assert.equal(
    lifeManagerCtaHref("?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time"),
    `${LIFE_MANAGER_WEB_APP_URL}?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time`,
  );
});

test("localized /lm copy describes Web Calendar onboarding and the current offer", () => {
  const source = fs.readFileSync(LAUNCH_STRINGS, "utf8");
  const en = localizedLmBlock(source, "en");
  const ja = localizedLmBlock(source, "ja");

  assert.match(en, /Connect Google Calendar/);
  assert.match(en, /7-day free trial/);
  assert.match(en, /card is required/i);
  assert.match(en, /\$29\/mo/);
  assert.doesNotMatch(en, /Telegram|home or base|phone calls|coming soon/i);
  assert.match(ja, /Googleカレンダーに接続/);
  assert.match(ja, /7日間無料/);
  assert.match(ja, /カード登録が必要/);
  assert.match(ja, /月 ?\$29/);
  assert.doesNotMatch(ja, /Telegram|自宅|拠点|電話|近日公開/);
});
