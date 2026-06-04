import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('② AffirmationApnsSender payload (Test #4)', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '../problemNudgeApnsSenderJob.js'), 'utf-8'
  );

  it('logger context is AffirmationApnsSenderJob (M-1 verified, not problemNudge)', () => {
    expect(src).toMatch(/withContext\(['"]AffirmationApnsSenderJob['"]\)/);
  });

  it('imports affirmation loader (appName/affirmationText) + emits quoteId payload', () => {
    expect(src).toMatch(/affirmationsLoader/);
    expect(src).toMatch(/affirmationText/);
    expect(src).toMatch(/appName/);
    expect(src).toMatch(/quoteId/);
  });
});
