const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '../../../../../../');

test('production Netlify deploy uses the locked local CLI', () => {
  const toolRoot = path.join(REPO_ROOT, 'apps/landing/scripts/netlify-cli');
  const packageJson = JSON.parse(fs.readFileSync(path.join(toolRoot, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(fs.readFileSync(path.join(toolRoot, 'package-lock.json'), 'utf8'));
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/netlify-deploy.yml'), 'utf8');
  const version = packageJson.dependencies?.['netlify-cli'];

  assert.match(version || '', /^\d+\.\d+\.\d+$/);
  assert.equal(packageLock.packages?.['node_modules/netlify-cli']?.version, version);
  assert.equal(packageJson.overrides?.toml, '5.0.1');
  assert.equal(packageLock.packages?.['node_modules/toml']?.version, '5.0.1');
  assert.match(workflow, /node-version: '22'/);
  assert.match(workflow, /npm ci --prefix scripts\/netlify-cli/);
  assert.match(workflow, /\.\/scripts\/netlify-cli\/node_modules\/\.bin\/netlify deploy/);
  assert.doesNotMatch(workflow, /netlify-cli@latest|npm install -g netlify-cli/);
});
