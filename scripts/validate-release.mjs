import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const RECOVERY_TOOL_PATHS = new Set([
  '.github/workflows/release.yml',
  'RELEASING.md',
  'scripts/publish-workspaces.mjs',
  'scripts/publish-workspaces.test.mjs',
  'scripts/validate-release.mjs',
  'scripts/validate-release.test.mjs',
]);

function git(...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

const errors = [];
const recoveryTag = process.env.RC_RELEASE_TAG?.trim();
let tag = '';

if (recoveryTag) {
  if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch'
  ) {
    errors.push('RC_RELEASE_TAG is restricted to manually dispatched GitHub Actions runs');
  }

  try {
    git('rev-parse', '--verify', `refs/tags/${recoveryTag}^{commit}`);
    tag = recoveryTag;
  } catch {
    errors.push(`recovery release tag does not exist: ${recoveryTag}`);
  }
} else {
  try {
    tag = git('describe', '--tags', '--exact-match', 'HEAD');
  } catch {
    errors.push('HEAD must have an exact stable semantic-version tag before publishing');
  }
}

if (tag && !/^v\d+\.\d+\.\d+$/.test(tag)) {
  errors.push(`HEAD tag is not a stable semantic version: ${tag}`);
}

try {
  git('rev-parse', '--verify', 'origin/main');
} catch {
  errors.push('origin/main must be available for release validation');
}

if (!errors.includes('origin/main must be available for release validation')) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', tag || 'HEAD', 'origin/main'], {
      cwd: root,
      stdio: 'ignore',
    });
  } catch {
    errors.push('tagged release commit must be contained in origin/main');
  }

  if (recoveryTag) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'], {
        cwd: root,
        stdio: 'ignore',
      });
    } catch {
      errors.push('recovery workflow commit must be contained in origin/main');
    }

    const changedPaths = git('diff', '--name-only', recoveryTag, 'HEAD')
      .split('\n')
      .filter(Boolean);
    const unexpectedPaths = changedPaths.filter((path) => !RECOVERY_TOOL_PATHS.has(path));

    if (unexpectedPaths.length > 0) {
      errors.push(
        `recovery checkout differs from ${recoveryTag} outside release tooling: ${unexpectedPaths.join(', ')}`,
      );
    }
  }
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

const pendingChangesets = readdirSync(join(root, '.changeset')).filter(
  (name) => name.endsWith('.md') && name !== 'README.md',
);

if (pendingChangesets.length > 0) {
  errors.push(`pending changesets remain: ${pendingChangesets.join(', ')}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated release ${tag}.`);
}
