import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const validator = resolve('scripts/validate-release.mjs');

function git(root, ...args) {
  execFileSync('git', ['-C', root, ...args], { stdio: 'ignore' });
}

function createReleaseRepo({ packageVersion = '1.2.3', tag, pendingChangeset = false }) {
  const root = mkdtempSync(join(tmpdir(), 'rc-release-validation-'));

  mkdirSync(join(root, 'packages', 'example'), { recursive: true });
  mkdirSync(join(root, '.changeset'));
  writeFileSync(
    join(root, 'packages', 'example', 'package.json'),
    JSON.stringify({ name: '@example/package', version: packageVersion }),
  );
  writeFileSync(join(root, '.changeset', 'README.md'), '# Changesets\n');

  if (pendingChangeset) {
    writeFileSync(join(root, '.changeset', 'pending.md'), '---\n---\n');
  }

  git(root, 'init');
  git(root, 'config', 'user.name', 'Test User');
  git(root, 'config', 'user.email', 'test@example.com');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'chore: release');

  if (tag) {
    git(root, 'tag', tag);
  }

  return root;
}

function validate(root) {
  return spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('accepts an exact semantic tag matching all package versions', () => {
  const result = validate(createReleaseRepo({ tag: 'v1.2.3' }));

  assert.equal(result.status, 0, result.stderr);
});

test('rejects a release commit without an exact tag', () => {
  const result = validate(createReleaseRepo({}));

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exact semantic-version tag/);
});

test('rejects a tag that does not match package versions', () => {
  const result = validate(createReleaseRepo({ tag: 'v1.2.4' }));

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /does not match v1\.2\.4/);
});

test('rejects pending changesets', () => {
  const result = validate(createReleaseRepo({ tag: 'v1.2.3', pendingChangeset: true }));

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pending changesets remain/);
});
