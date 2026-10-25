"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const LANDING = path.resolve(__dirname, "../../landing");
const LM_BODY = path.join(LANDING, "app/lm/LmBody.tsx");
const LM_JA_CTA = path.join(LANDING, "components/lm/LmJaCta.tsx");
const LAUNCH_STRINGS = path.join(LANDING, "lib/launchStrings.ts");

function localizedLmBlock(source, locale) {
  const localeStart = source.indexOf(`  ${locale}: {`);
  const start = source.indexOf("    lm: {", localeStart);
  const end = source.indexOf("    lifeManager: {", start);
  assert.ok(localeStart >= 0 && start > localeStart && end > start, `${locale} /lm copy block exists`);
  return source.slice(start, end);
}

test("public /lm primary CTA starts same-origin Life Manager Cloud", async () => {
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
  assert.equal(LIFE_MANAGER_WEB_APP_URL, "/maritime?source=landing");
  assert.doesNotMatch(LIFE_MANAGER_WEB_APP_URL, /life-call-production\.up\.railway\.app|start_calendar/);
  assert.doesNotMatch(source, /TG_DEEPLINK|t\.me\/LifeManagerBotbot/);
});

test("public /lm carries campaign UTMs to the app entry route", async () => {
  const { LIFE_MANAGER_WEB_APP_URL, lifeManagerCtaHref } = await import(
    pathToFileURL(path.join(LANDING, "lib/writer-cta-url.js")).href
  );
  assert.equal(
    lifeManagerCtaHref("?utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time"),
    `${LIFE_MANAGER_WEB_APP_URL}&utm_source=instagram&utm_medium=social&utm_campaign=leave-on-time`,
  );
});

test("Japanese Life Manager CTA also enters Cloud without a Calendar-first prompt", () => {
  const source = fs.readFileSync(LM_JA_CTA, "utf8");
  assert.match(source, /Life Manager Cloudを始める/);
  assert.doesNotMatch(source, /Googleカレンダーに接続|7日間無料|life-call-production\.up\.railway\.app/);
});

test("localized /lm copy describes one broad Life Manager product and Capafy-first Cloud", () => {
  const source = fs.readFileSync(LAUNCH_STRINGS, "utf8");
  const en = localizedLmBlock(source, "en");
  const ja = localizedLmBlock(source, "ja");

  assert.match(en, /work, money, everyday responsibilities, body, and mind/i);
  assert.match(en, /Google sign-in verifies identity only/i);
  assert.match(en, /first earning workflow uses Capafy/i);
  assert.doesNotMatch(en, /Connect Google Calendar|Calendar permission is required|card is required|7-day free trial/i);
  assert.match(ja, /仕事、お金、日々の用事、体と心/);
  assert.match(ja, /Googleログインは本人確認のみ/);
  assert.match(ja, /最初の収益化ワークフローはCapafy/);
  assert.doesNotMatch(ja, /Googleカレンダーに接続|Calendar権限が必要|7日間無料|カード登録が必要/);
});
