import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

const errors = [];
let tag = '';

try {
  tag = git('describe', '--tags', '--exact-match', 'HEAD');
} catch {
  errors.push('HEAD must have an exact semantic-version tag before publishing');
}

if (tag && !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  errors.push(`HEAD tag is not a semantic version: ${tag}`);
}

const expectedVersion = tag.replace(/^v/, '');
const packageDirs = readdirSync(join(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(root, 'packages', entry.name));

for (const directory of packageDirs) {
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));

  if (expectedVersion && manifest.version !== expectedVersion) {
    errors.push(`${manifest.name}: version ${manifest.version} does not match ${tag}`);
  }
}

const pendingChangesets = readdirSync(join(root, '.changeset'))
  .filter((name) => name.endsWith('.md') && name !== 'README.md');

if (pendingChangesets.length > 0) {
  errors.push(`pending changesets remain: ${pendingChangesets.join(', ')}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated release ${tag}.`);
}
