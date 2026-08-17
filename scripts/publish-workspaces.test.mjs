'use strict';

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { c as createTar } from 'tar';

import {
  assertLiveEnvironment,
  executePublication,
  expectedPublishedRange,
  hasSlsaProvenance,
  inspectPackedManifest,
  interpretRegistryResult,
  normalizeRegistryMetadata,
  validatePackedManifest,
} from './publish-workspaces.mjs';
import {
  EXPECTED_REPOSITORY_URL,
  loadPublicWorkspaces,
  topologicallySortWorkspaces,
  validateWorkspaceConfiguration,
} from './release-workspaces.mjs';

const VERSION = '1.2.3';
const repository = { type: 'git', url: EXPECTED_REPOSITORY_URL };
const quietLog = { log() {} };

function createWorkspace(name, dependencies = {}) {
  return {
    directory: `/repo/packages/${name}`,
    location: `packages/${name}`,
    manifest: {
      dependencies,
      name: `@example/${name}`,
      publishConfig: { access: 'public' },
      repository,
      version: VERSION,
    },
    name: `@example/${name}`,
  };
}

function packedManifest(workspace) {
  const transformRanges = (dependencies = {}) =>
    Object.fromEntries(
      Object.entries(dependencies).map(([name, range]) => [
        name,
        expectedPublishedRange(range, VERSION),
      ]),
    );

  return {
    ...workspace.manifest,
    dependencies: transformRanges(workspace.manifest.dependencies),
    optionalDependencies: transformRanges(workspace.manifest.optionalDependencies),
    peerDependencies: transformRanges(workspace.manifest.peerDependencies),
  };
}

function registryManifest(workspace, { provenance = true } = {}) {
  return {
    ...packedManifest(workspace),
    dist: provenance
      ? {
          attestations: [
            {
              provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
              url: 'https://registry.npmjs.org/-/npm/v1/attestations/example',
            },
          ],
        }
      : {},
  };
}

test('discovers only the public workspaces returned by Yarn', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'rc-public-workspaces-'));
  const publicDirectory = join(root, 'packages', 'public');
  const privateDirectory = join(root, 'packages', 'private');

  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(publicDirectory, { recursive: true });
  mkdirSync(privateDirectory, { recursive: true });
  writeFileSync(
    join(publicDirectory, 'package.json'),
    JSON.stringify({ name: '@example/public', version: VERSION }),
  );
  writeFileSync(
    join(privateDirectory, 'package.json'),
    JSON.stringify({ name: '@example/private', private: true, version: VERSION }),
  );

  const workspaces = loadPublicWorkspaces({
    root,
    execute(command, args) {
      assert.equal(command, 'yarn');
      assert.deepEqual(args, ['workspaces', 'list', '--json', '--no-private']);

      return `${JSON.stringify({ location: 'packages/public', name: '@example/public' })}\n`;
    },
  });

  assert.deepEqual(
    workspaces.map(({ name }) => name),
    ['@example/public'],
  );
});

test('validates one fixed group and sorts runtime dependencies first', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'rc-fixed-workspaces-'));
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });

  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, '.changeset'));
  writeFileSync(
    join(root, '.changeset', 'config.json'),
    JSON.stringify({ fixed: [[aggregate.name, foundation.name]] }),
  );

  assert.equal(
    validateWorkspaceConfiguration({
      expectedVersion: VERSION,
      root,
      workspaces: [aggregate, foundation],
    }),
    VERSION,
  );
  assert.deepEqual(
    topologicallySortWorkspaces([aggregate, foundation]).map(({ name }) => name),
    [foundation.name, aggregate.name],
  );
});

test('rejects prerelease and mismatched synchronized workspace versions', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'rc-invalid-fixed-workspaces-'));
  const workspace = createWorkspace('package');

  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, '.changeset'));
  writeFileSync(
    join(root, '.changeset', 'config.json'),
    JSON.stringify({ fixed: [[workspace.name]] }),
  );

  assert.throws(
    () =>
      validateWorkspaceConfiguration({
        expectedVersion: '1.2.4',
        root,
        workspaces: [workspace],
      }),
    /does not match release version 1\.2\.4/,
  );

  workspace.manifest.version = '1.2.3-beta.1';
  assert.throws(
    () => validateWorkspaceConfiguration({ root, workspaces: [workspace] }),
    /version must be a stable X\.Y\.Z release/,
  );
});

test('inspects the manifest contained in a packed tarball', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'rc-packed-manifest-'));
  const packageDirectory = join(root, 'package');
  const extractDirectory = join(root, 'unpacked');
  const tarballPath = join(root, 'package.tgz');
  const manifest = { name: '@example/package', version: VERSION };

  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(packageDirectory);
  writeFileSync(join(packageDirectory, 'package.json'), JSON.stringify(manifest));
  createTar({ cwd: root, file: tarballPath, gzip: true, sync: true }, ['package/package.json']);

  assert.deepEqual(
    inspectPackedManifest({
      extractDirectory,
      packageName: manifest.name,
      tarballPath,
    }),
    manifest,
  );
});

test('rejects workspace protocols and incorrect internal versions in packed manifests', () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });
  const internalNames = new Set([foundation.name, aggregate.name]);

  assert.throws(
    () =>
      validatePackedManifest({
        internalNames,
        manifest: aggregate.manifest,
        workspace: aggregate,
      }),
    /still uses workspace:\*.*expected 1\.2\.3/,
  );
});

test('preserves explicit internal peer ranges while pinning workspace star ranges', () => {
  const foundation = createWorkspace('foundation');
  const plugin = createWorkspace('plugin', { [foundation.name]: 'workspace:*' });

  plugin.manifest.peerDependencies = {
    [foundation.name]: 'workspace:>=1.0.0 <2.0.0',
  };

  assert.equal(expectedPublishedRange('workspace:*', VERSION), VERSION);
  assert.equal(expectedPublishedRange('workspace:>=1.0.0 <2.0.0', VERSION), '>=1.0.0 <2.0.0');
  assert.doesNotThrow(() =>
    validatePackedManifest({
      internalNames: new Set([foundation.name, plugin.name]),
      manifest: packedManifest(plugin),
      workspace: plugin,
    }),
  );
});

test('requires an exact tag, OIDC context, and no token credentials for live publishing', () => {
  const environment = {
    ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'oidc-request-token',
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://example.test/oidc',
    GITHUB_ACTIONS: 'true',
    GITHUB_REF_NAME: 'v1.2.3',
    GITHUB_REF_TYPE: 'tag',
    GITHUB_REPOSITORY: 'richardcarls/rc-webcomponents',
  };

  assert.equal(assertLiveEnvironment(environment), VERSION);
  assert.throws(
    () => assertLiveEnvironment({ ...environment, NODE_AUTH_TOKEN: 'legacy-token' }),
    /Refusing token fallback.*NODE_AUTH_TOKEN/,
  );
  assert.throws(
    () => assertLiveEnvironment({ ...environment, npm_config_password: 'legacy-password' }),
    /Refusing token fallback.*npm_config_password/,
  );
  assert.throws(
    () => assertLiveEnvironment({ ...environment, NPM_CONFIG_OTP: '123456' }),
    /Refusing token fallback.*NPM_CONFIG_OTP/,
  );
  assert.throws(
    () => assertLiveEnvironment({ ...environment, GITHUB_REF_NAME: 'v1.2.3-beta.1' }),
    /stable vX\.Y\.Z/,
  );
});

test('treats only npm E404 responses as unpublished versions', () => {
  assert.deepEqual(
    interpretRegistryResult({
      status: 1,
      stderr: JSON.stringify({ error: { code: 'E404' } }),
      stdout: '',
    }),
    { state: 'missing' },
  );
  assert.throws(
    () =>
      interpretRegistryResult({
        status: 1,
        stderr: JSON.stringify({ error: { code: 'E401', summary: 'authentication required' } }),
        stdout: '',
      }),
    /E401/,
  );
});

test('normalizes npm view arrays and dotted provenance fields', () => {
  const normalized = normalizeRegistryMetadata([
    {
      'dist.attestations': {
        provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
      },
      name: '@example/package',
      version: VERSION,
    },
  ]);

  assert.equal(normalized.name, '@example/package');
  assert.equal(normalized['dist.attestations'], undefined);
  assert.equal(hasSlsaProvenance(normalized), true);
  assert.throws(() => normalizeRegistryMetadata([]), /0 metadata entries/);
});

test('dry run packs every workspace without registry reads or publish attempts', async () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });
  const packed = [];

  const summary = await executePublication({
    dryRun: true,
    log: quietLog,
    operations: {
      async pack(workspace) {
        packed.push(workspace.name);

        return { manifest: packedManifest(workspace), tarballPath: `${workspace.name}.tgz` };
      },
      publish() {
        assert.fail('dry run must not publish');
      },
      query() {
        assert.fail('dry run must not read the registry');
      },
    },
    workspaces: [aggregate, foundation],
  });

  assert.deepEqual(packed, [foundation.name, aggregate.name]);
  assert.deepEqual(summary.validated, packed);
});

test('skips verified versions and publishes only missing packages in dependency order', async () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });
  const calls = [];
  const queryCounts = new Map();

  const summary = await executePublication({
    dryRun: false,
    log: quietLog,
    operations: {
      async pack(workspace) {
        calls.push(`pack:${workspace.name}`);

        return { manifest: packedManifest(workspace), tarballPath: `${workspace.name}.tgz` };
      },
      async publish(_tarballPath, workspace) {
        calls.push(`publish:${workspace.name}`);
      },
      async query(workspace) {
        calls.push(`query:${workspace.name}`);
        const count = (queryCounts.get(workspace.name) ?? 0) + 1;

        queryCounts.set(workspace.name, count);

        if (workspace.name === foundation.name || count > 1) {
          return { metadata: registryManifest(workspace), state: 'found' };
        }

        return { state: 'missing' };
      },
      async sleep() {},
    },
    pollAttempts: 2,
    pollDelayMs: 0,
    workspaces: [aggregate, foundation],
  });

  assert.deepEqual(summary.skipped, [foundation.name]);
  assert.deepEqual(summary.published, [aggregate.name]);
  assert.deepEqual(calls, [
    `query:${foundation.name}`,
    `query:${aggregate.name}`,
    `pack:${aggregate.name}`,
    `publish:${aggregate.name}`,
    `query:${aggregate.name}`,
  ]);
});

test('recovers when a failed publish raced with another successful publisher', async () => {
  const workspace = createWorkspace('package');
  let queryCount = 0;

  const summary = await executePublication({
    dryRun: false,
    log: quietLog,
    operations: {
      async pack() {
        return { manifest: packedManifest(workspace), tarballPath: 'package.tgz' };
      },
      async publish() {
        throw new Error('immutable version already exists');
      },
      async query() {
        queryCount += 1;

        return queryCount === 1
          ? { state: 'missing' }
          : { metadata: registryManifest(workspace), state: 'found' };
      },
      async sleep() {},
    },
    pollAttempts: 1,
    pollDelayMs: 0,
    workspaces: [workspace],
  });

  assert.deepEqual(summary.raceRecovered, [workspace.name]);
});

test('polls until registry provenance becomes visible', async () => {
  const workspace = createWorkspace('package');
  let queryCount = 0;
  let sleepCount = 0;

  const summary = await executePublication({
    dryRun: false,
    log: quietLog,
    operations: {
      async query() {
        queryCount += 1;

        return {
          metadata: registryManifest(workspace, { provenance: queryCount > 1 }),
          state: 'found',
        };
      },
      async sleep() {
        sleepCount += 1;
      },
    },
    pollAttempts: 2,
    pollDelayMs: 0,
    workspaces: [workspace],
  });

  assert.deepEqual(summary.skipped, [workspace.name]);
  assert.equal(queryCount, 2);
  assert.equal(sleepCount, 1);
  assert.equal(hasSlsaProvenance(registryManifest(workspace)), true);
});

test('stops provenance polling after the configured attempt bound', async () => {
  const workspace = createWorkspace('package');
  let queryCount = 0;
  let sleepCount = 0;

  await assert.rejects(
    executePublication({
      dryRun: false,
      log: quietLog,
      operations: {
        async query() {
          queryCount += 1;

          return {
            metadata: registryManifest(workspace, { provenance: false }),
            state: 'found',
          };
        },
        async sleep() {
          sleepCount += 1;
        },
      },
      pollAttempts: 2,
      pollDelayMs: 0,
      workspaces: [workspace],
    }),
    /did not expose SLSA provenance after 2 checks/,
  );

  assert.equal(queryCount, 2);
  assert.equal(sleepCount, 1);
});

test('aborts on unknown registry failures and leaves dependents unattempted', async () => {
  const foundation = createWorkspace('foundation');
  const aggregate = createWorkspace('aggregate', { [foundation.name]: 'workspace:*' });

  await assert.rejects(
    executePublication({
      dryRun: false,
      log: quietLog,
      operations: {
        async query() {
          throw new Error('EAI_AGAIN registry.npmjs.org');
        },
      },
      workspaces: [aggregate, foundation],
    }),
    (error) => {
      assert.match(error.message, /EAI_AGAIN/);
      assert.deepEqual(error.publicationSummary.failed, [foundation.name]);
      assert.deepEqual(error.publicationSummary.unattempted, [aggregate.name]);

      return true;
    },
  );
});
