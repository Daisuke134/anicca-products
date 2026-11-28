import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rewriteRailwayCtas } from "./retire-railway-cta.mjs";

const CTA =
  '<a class="btn light" data-lm-cloud-entry href="https://life-call-production.up.railway.app/maritime?source=landing&amp;lang=en">Start Life Manager Cloud</a>';

test("rewrites every retired Railway CTA to https://aniccaai.com", () => {
  const { html, replaced } = rewriteRailwayCtas(`${CTA}${CTA}${CTA}`);
  assert.equal(replaced, 3);
  assert.doesNotMatch(html, /railway\.app/i);
  assert.equal(html.match(/href="https:\/\/aniccaai\.com"/g).length, 3);
  // The anchor text is left alone: this step only retires the dead destination.
  assert.equal(html.match(/Start Life Manager Cloud/g).length, 3);
});

test("is idempotent and leaves unrelated links untouched", () => {
  const once = rewriteRailwayCtas(CTA).html;
  const twice = rewriteRailwayCtas(once);
  assert.equal(twice.replaced, 0);
  assert.equal(twice.html, once);
  const other =
    '<a href="https://github.com/Daisuke134/life-manager">Run it locally</a>';
  assert.deepEqual(rewriteRailwayCtas(other), { html: other, replaced: 0 });
});

test("rewrites the exported /lm documents and nothing else", async () => {
  const dir = await mkdtemp(join(tmpdir(), "railway-cta-"));
  await mkdir(join(dir, "lm"), { recursive: true });
  await mkdir(join(dir, "blog"), { recursive: true });
  await writeFile(join(dir, "lm.html"), `<html>${CTA}</html>`);
  await writeFile(join(dir, "lm", "ja.html"), `<html>${CTA}</html>`);
  await writeFile(join(dir, "blog", "post.html"), `<html>${CTA}</html>`);

  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [join(import.meta.dirname, "retire-railway-cta.mjs"), dir], {
    stdio: "pipe",
  });

  const en = await readFile(join(dir, "lm.html"), "utf-8");
  const ja = await readFile(join(dir, "lm", "ja.html"), "utf-8");
  const blog = await readFile(join(dir, "blog", "post.html"), "utf-8");
  assert.doesNotMatch(en, /railway\.app/i);
  assert.doesNotMatch(ja, /railway\.app/i);
  // Blog posts keep whatever they had: this fix-up is scoped to /lm.
  assert.match(blog, /railway\.app/);
});
