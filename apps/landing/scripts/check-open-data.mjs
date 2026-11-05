import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function validateOpenData(content) {
  const data = JSON.parse(content);
  if (!Array.isArray(data?.summary?.platforms) || !Array.isArray(data?.kpis)) {
    throw new Error('Open dashboard data is missing platforms or KPIs');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateOpenData(readFileSync(process.argv[2], 'utf8'));
}
