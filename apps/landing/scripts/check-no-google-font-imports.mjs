import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const sourceFiles = execFileSync(
  'git',
  ['ls-files', '-co', '--exclude-standard', '--', 'app'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/)
  .filter((path) => /\.tsx?$/.test(path));
const offenders = sourceFiles.filter((path) => /next\/font\/google/.test(readFileSync(path, 'utf8')));

if (offenders.length > 0) {
  console.error(
    `Build-time Google Font imports are not allowed; use local fonts:\n${offenders
      .map((path) => `- ${path}`)
      .join('\n')}`,
  );
  process.exitCode = 1;
}
