'use strict';

import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  buildPlaceholderManifest,
  parseBootstrapArguments,
  writePlaceholderPackage,
} from './bootstrap-trusted-publisher.mjs';
import { EXPECTED_REPOSITORY_URL } from './release-workspaces.mjs';

test('requires exactly one @rcarls-scoped package name and defaults to version 0.0.0', () => {
  assert.deepEqual(parseBootstrapArguments(['@rcarls/rc-foo']), {
    outputDirectory: undefined,
    packageName: '@rcarls/rc-foo',
    version: '0.0.0',
  });

  assert.deepEqual(
    parseBootstrapArguments(['@rcarls/rc-foo', '--version', '0.0.1', '--out', '/tmp/out']),
    {
      outputDirectory: '/tmp/out',
      packageName: '@rcarls/rc-foo',
      version: '0.0.1',
    },
  );

  assert.throws(() => parseBootstrapArguments([]), /A package name is required/);

  assert.throws(
    () => parseBootstrapArguments(['some-package']),
    /must be scoped under @rcarls\//,
  );

  assert.throws(
    () => parseBootstrapArguments(['@rcarls/one', '@rcarls/two']),
    /Only one package name/,
  );
});

test('builds a placeholder manifest with no dependencies, pointed at this repository', () => {
  const manifest = buildPlaceholderManifest({ packageName: '@rcarls/rc-foo', version: '0.0.0' });

  assert.equal(manifest.name, '@rcarls/rc-foo');
  assert.equal(manifest.version, '0.0.0');
  assert.equal(manifest.private, false);
  assert.equal(manifest.publishConfig.access, 'public');
  assert.deepEqual(manifest.repository, { type: 'git', url: EXPECTED_REPOSITORY_URL });
  assert.equal(manifest.dependencies, undefined);
  assert.match(manifest.description, /Contains no code/);
});

test('writes a package.json and README with no other files, safe to publish as-is', (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'rc-bootstrap-placeholder-'));

  context.after(() => rmSync(directory, { recursive: true }));

  writePlaceholderPackage({ directory, packageName: '@rcarls/rc-foo', version: '0.0.0' });

  assert.ok(existsSync(join(directory, 'package.json')));
  assert.ok(existsSync(join(directory, 'README.md')));

  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));

  assert.equal(manifest.name, '@rcarls/rc-foo');

  const readme = readFileSync(join(directory, 'README.md'), 'utf8');

  assert.match(readme, /Do not install or depend on this version/);
});
