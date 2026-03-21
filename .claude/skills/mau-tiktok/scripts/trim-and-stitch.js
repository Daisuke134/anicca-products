#!/usr/bin/env node
/**
 * mau-tiktok: Trim hooks to 3 seconds + stitch with CTA video
 * Source: Mau's method — "grab the first three seconds and then stitch the CTA video"
 *
 * Usage: node trim-and-stitch.js [--lang en|ja] [--count 3]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const WORKSPACE = path.join(
  process.env.HOME,
  ".openclaw/workspace/mau-tiktok"
);
const RAW_DIR = path.join(WORKSPACE, "hooks/raw");
const TRIMMED_DIR = path.join(WORKSPACE, "hooks/trimmed");

function ensureDirs(lang) {
  fs.mkdirSync(TRIMMED_DIR, { recursive: true });
  fs.mkdirSync(path.join(WORKSPACE, "output", lang), { recursive: true });
}

function getUntrimmedHooks() {
  if (!fs.existsSync(RAW_DIR)) return [];
  const raw = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".mp4"));
  const trimmed = fs.existsSync(TRIMMED_DIR)
    ? new Set(fs.readdirSync(TRIMMED_DIR).filter((f) => f.endsWith(".mp4")))
    : new Set();
  return raw.filter((f) => !trimmed.has(f));
}

function trimHook(filename) {
  const input = path.join(RAW_DIR, filename);
  const output = path.join(TRIMMED_DIR, filename);

  // Normalize to 1080x1920 + trim to 3 seconds
  const cmd = `ffmpeg -i "${input}" -t 3 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 -y "${output}"`;

  try {
    execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: "pipe" });
    console.log(`[TRIM] ${filename} → 3s @ 1080x1920`);
    return true;
  } catch (err) {
    console.error(`[ERR] Trim failed for ${filename}:`, err.message);
    return false;
  }
}

function normalizeCta(lang) {
  const ctaInput = path.join(WORKSPACE, `cta-${lang}.mp4`);
  const ctaNorm = path.join(WORKSPACE, `cta-${lang}-norm.mp4`);

  if (fs.existsSync(ctaNorm)) return ctaNorm;

  const cmd = `ffmpeg -i "${ctaInput}" -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -ar 44100 -y "${ctaNorm}"`;

  try {
    execSync(cmd, { encoding: "utf-8", timeout: 60000, stdio: "pipe" });
    console.log(`[NORM] CTA ${lang} normalized`);
  } catch (err) {
    console.error(`[ERR] CTA normalize failed:`, err.message);
  }
  return ctaNorm;
}

function stitchVideo(hookFile, ctaNorm, lang, index) {
  const hookPath = path.join(TRIMMED_DIR, hookFile);
  const outputPath = path.join(
    WORKSPACE,
    "output",
    lang,
    `mau_${lang}_${Date.now()}_${index}.mp4`
  );
  const concatFile = path.join(WORKSPACE, `concat_${lang}_${index}.txt`);

  // Write concat list
  fs.writeFileSync(
    concatFile,
    `file '${hookPath}'\nfile '${ctaNorm}'\n`
  );

  const cmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${outputPath}"`;

  try {
    execSync(cmd, { encoding: "utf-8", timeout: 120000, stdio: "pipe" });
    console.log(`[STITCH] ${hookFile} + CTA → ${path.basename(outputPath)}`);
    // Clean up concat file
    fs.unlinkSync(concatFile);
    return outputPath;
  } catch (err) {
    console.error(`[ERR] Stitch failed:`, err.message);
    if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);
  const langIdx = args.indexOf("--lang");
  const lang = langIdx >= 0 ? args[langIdx + 1] : "en";
  const countIdx = args.indexOf("--count");
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 3;

  ensureDirs(lang);

  // Step 1: Trim all untrimmed hooks
  const untrimmed = getUntrimmedHooks();
  console.log(`[INFO] ${untrimmed.length} hooks to trim`);
  for (const f of untrimmed) {
    trimHook(f);
  }

  // Step 2: Normalize CTA
  const ctaNorm = normalizeCta(lang);

  // Step 3: Stitch
  const trimmedFiles = fs
    .readdirSync(TRIMMED_DIR)
    .filter((f) => f.endsWith(".mp4"))
    .slice(0, count);

  console.log(`\n[INFO] Stitching ${trimmedFiles.length} videos (${lang})`);
  const outputs = [];
  for (let i = 0; i < trimmedFiles.length; i++) {
    const result = stitchVideo(trimmedFiles[i], ctaNorm, lang, i);
    if (result) outputs.push(result);
  }

  console.log(`\n=== Done: ${outputs.length} videos created ===`);
  outputs.forEach((o) => console.log(`  → ${o}`));
  return outputs;
}

if (require.main === module) {
  main();
}

module.exports = { main };
