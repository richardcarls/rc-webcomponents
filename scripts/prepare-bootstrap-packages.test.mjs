'use strict';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  bootstrapTarballName,
  parseBootstrapArguments,
  prepareBootstrapPackages,
  selectBootstrapWorkspaces,
} from './prepare-bootstrap-packages.mjs';
import { EXPECTED_REPOSITORY_URL } from './release-workspaces.mjs';

const VERSION = '1.2.3';
const quietLog = { log() {} };

function createWorkspace(name, dependencies = {}, version = VERSION) {
  return {
    directory: `/repo/packages/${name}`,
    location: `packages/${name}`,
    manifest: {
      dependencies,
      name: `@example/${name}`,
      repository: { type: 'git', url: EXPECTED_REPOSITORY_URL },
      version,
    },
    name: `@example/${name}`,
  };
}

test('requires an output directory and an explicit unique package list', () => {
  assert.deepEqual(parseBootstrapArguments(['--out', '/tmp/packages', '@example/one']), {
    outputDirectory: '/tmp/packages',
    packageNames: ['@example/one'],
  });

  assert.throws(() => parseBootstrapArguments(['@example/one']), /--out/);
  assert.throws(() => parseBootstrapArguments(['--out', '/tmp/packages']), /At least one/);

  assert.throws(
    () => parseBootstrapArguments(['--out', '/tmp/packages', '@example/one', '@example/one']),
    /must not be repeated/,
  );
});

test('selects requested public workspaces in dependency order', () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });

  assert.deepEqual(
    selectBootstrapWorkspaces([aggregate, foundation], [aggregate.name, foundation.name]),
    [foundation, aggregate],
  );

  assert.throws(
    () => selectBootstrapWorkspaces([foundation], ['@example/missing']),
    /Unknown public workspace/,
  );
});

test('prepares validated tarballs without publishing', () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' }, '0.1.0');
  const packed = [];
  const outputDirectory = '/tmp/bootstrap-output';

  const tarballs = prepareBootstrapPackages({
    log: quietLog,
    operations: {
      pack(workspace) {
        packed.push(workspace.name);

        return {
          ...workspace.manifest,
          dependencies: Object.fromEntries(
            Object.keys(workspace.manifest.dependencies).map((name) => [
              name,
              name === foundation.name ? foundation.manifest.version : workspace.manifest.version,
            ]),
          ),
        };
      },
    },
    outputDirectory,
    selectedWorkspaces: [foundation, aggregate],
    workspaces: [foundation, aggregate],
  });

  assert.deepEqual(packed, [foundation.name, aggregate.name]);

  assert.deepEqual(tarballs, [
    `${outputDirectory}/${bootstrapTarballName(foundation)}`,
    `${outputDirectory}/${bootstrapTarballName(aggregate)}`,
  ]);
});
