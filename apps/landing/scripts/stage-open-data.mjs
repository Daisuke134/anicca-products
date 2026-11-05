import { copyFileSync, existsSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateOpenData } from './check-open-data.mjs';

const SNAPSHOT_PATTERN = /^open-dashboard-data-(\d{4})-(\d{2})-(\d{2})-(\d{4})\.json$/;

function getTimestamp(content, label) {
  validateOpenData(content);
  const data = JSON.parse(content);
  if (typeof data.updated_at !== 'string') {
    throw new Error(`${label} is missing updated_at`);
  }

  const jst = data.updated_at.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?\s*JST$/i);
  const timestamp = jst
    ? Date.parse(`${jst[1]}T${jst[2]}:${jst[3] ?? '00'}+09:00`)
    : Date.parse(data.updated_at);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${label} has an invalid updated_at`);
  }
  return timestamp;
}

function getSnapshotTimestamp(name) {
  const match = name.match(SNAPSHOT_PATTERN);
  if (!match) return null;
  const [, year, month, day, hourMinute] = match;
  return Date.parse(`${year}-${month}-${day}T${hourMinute.slice(0, 2)}:${hourMinute.slice(2)}:00+09:00`);
}

export function stageLatestOpenData({ sourceDir, outputDir }) {
  const outputPath = join(outputDir, 'data.json');
  const snapshots = readdirSync(sourceDir)
    .filter((name) => SNAPSHOT_PATTERN.test(name))
    .sort((a, b) => getSnapshotTimestamp(b) - getSnapshotTimestamp(a));

  if (snapshots.length === 0) {
    const current = readFileSync(outputPath, 'utf8');
    getTimestamp(current, outputPath);
    return { staged: false, source: 'data.json' };
  }

  const latest = snapshots[0];
  const latestPath = join(sourceDir, latest);
  const latestContent = readFileSync(latestPath, 'utf8');
  const latestTimestamp = getTimestamp(latestContent, latest);

  if (existsSync(outputPath)) {
    const currentContent = readFileSync(outputPath, 'utf8');
    try {
      if (getTimestamp(currentContent, outputPath) >= latestTimestamp) {
        return { staged: false, source: 'data.json' };
      }
    } catch {
      // Replace an unusable canonical file from the validated snapshot.
    }
  }

  mkdirSync(outputDir, { recursive: true });
  copyFileSync(latestPath, outputPath);
  return { staged: true, source: latest };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = stageLatestOpenData({
    sourceDir: resolve('public/open'),
    outputDir: resolve('out/open'),
  });
  console.log(result.staged ? `Staged ${result.source} as data.json` : `Keeping ${result.source}`);
}
