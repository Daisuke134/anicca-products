#!/usr/bin/env node
/**
 * mau-tiktok: Scrape viral YouTube Shorts hooks
 * Source: Mau's method — headless browser scrapes YouTube Shorts from target creators
 *
 * Usage: node scrape-hooks.js [--count 10] [--creator "ZackD Films"]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const WORKSPACE = path.join(
  process.env.HOME,
  ".openclaw/workspace/mau-tiktok"
);
const RAW_DIR = path.join(WORKSPACE, "hooks/raw");
const USED_FILE = path.join(WORKSPACE, "used_hooks.json");
const CREATORS_FILE = path.join(WORKSPACE, "creators.json");

function ensureDirs() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

function loadUsed() {
  if (!fs.existsSync(USED_FILE)) return { used: [] };
  return JSON.parse(fs.readFileSync(USED_FILE, "utf-8"));
}

function saveUsed(data) {
  fs.writeFileSync(USED_FILE, JSON.stringify(data, null, 2));
}

function loadCreators() {
  return JSON.parse(fs.readFileSync(CREATORS_FILE, "utf-8"));
}

function scrapeCreator(creatorUrl, count, usedIds) {
  const downloaded = [];

  try {
    // Use yt-dlp to get video list from creator's shorts page
    const listCmd = `yt-dlp --flat-playlist --print id --print title "${creatorUrl}" --playlist-end ${count * 2}`;
    const output = execSync(listCmd, { encoding: "utf-8", timeout: 60000 });
    const lines = output.trim().split("\n");

    // Lines alternate: id, title, id, title...
    const videos = [];
    for (let i = 0; i < lines.length - 1; i += 2) {
      videos.push({ id: lines[i].trim(), title: lines[i + 1]?.trim() || "" });
    }

    let downloadCount = 0;
    for (const video of videos) {
      if (downloadCount >= count) break;
      if (usedIds.includes(video.id)) {
        console.log(`[SKIP] Already used: ${video.id} — ${video.title}`);
        continue;
      }

      const outPath = path.join(RAW_DIR, `${video.id}.mp4`);
      try {
        console.log(`[DL] ${video.id} — ${video.title}`);
        execSync(
          `yt-dlp -f "bestvideo[height<=1920]+bestaudio/best[height<=1920]" --merge-output-format mp4 -o "${outPath}" "https://www.youtube.com/shorts/${video.id}"`,
          { encoding: "utf-8", timeout: 120000 }
        );
        downloaded.push(video.id);
        downloadCount++;
      } catch (dlErr) {
        console.error(`[ERR] Failed to download ${video.id}:`, dlErr.message);
      }
    }
  } catch (err) {
    console.error(`[ERR] Failed to list videos from ${creatorUrl}:`, err.message);
  }

  return downloaded;
}

function main() {
  const args = process.argv.slice(2);
  const countIdx = args.indexOf("--count");
  const count = countIdx >= 0 ? parseInt(args[countIdx + 1], 10) : 10;

  ensureDirs();

  const { creators } = loadCreators();
  const usedData = loadUsed();

  const allDownloaded = [];

  for (const creator of creators) {
    console.log(`\n=== Scraping: ${creator.name} (${creator.url}) ===`);
    const ids = scrapeCreator(creator.url, count, usedData.used);
    allDownloaded.push(...ids);
  }

  // Update used hooks
  usedData.used.push(...allDownloaded);
  saveUsed(usedData);

  console.log(`\n=== Done: Downloaded ${allDownloaded.length} new hooks ===`);
  return allDownloaded;
}

if (require.main === module) {
  main();
}

module.exports = { main };
