import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';

describe('JA 12 humanize (Test #5)', () => {
  it('all 12 target quotes have ai_likelihood <= 30', () => {
    // worktree-local score.sh (stable, not affected by background automation churn)
    const score = path.resolve(__dirname, '../../../../../../tools/humanizer-ja/score.sh');
    const ja = path.resolve(__dirname, '../catalog/ja.json');
    const ids = ['q024','q050','q066','q105','q112','q125','q135','q136','q142','q162','q186','q190'];
    const out = execSync(`bash ${score} ${ja} ${ids.join(' ')} 2>/dev/null`).toString();
    const scores = JSON.parse(out);
    expect(scores).toHaveLength(12);
    for (const s of scores) expect(s.ai_likelihood).toBeLessThanOrEqual(30);
  });
});
