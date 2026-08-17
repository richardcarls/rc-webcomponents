'use strict';

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { x as extractTar } from 'tar';

import {
  EXPECTED_GITHUB_REPOSITORY,
  EXPECTED_REPOSITORY_URL,
  NPM_REGISTRY,
  STABLE_TAG_PATTERN,
  assertMinimumVersion,
  execCommand,
  loadPublicWorkspaces,
  manifestRepositoryUrl,
  spawnCommand,
  topologicallySortWorkspaces,
  validateWorkspaceConfiguration,
} from './release-workspaces.mjs';

const MINIMUM_NPM_VERSION = '11.5.1';
const PROVENANCE_PREDICATE = 'https://slsa.dev/provenance/v1';
const REGISTRY_FIELDS = [
  'name',
  'version',
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'repository',
  'dist.attestations',
];
const DEFAULT_POLL_ATTEMPTS = 12;
const DEFAULT_POLL_DELAY_MS = 5_000;
const PUBLISHED_DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function parseJsonObject(output) {
  const trimmed = output.trim();

  if (!trimmed) {
    return undefined;
  }

  return JSON.parse(trimmed);
}

export function normalizeRegistryMetadata(payload) {
  const entries = Array.isArray(payload) ? payload : [payload];

  if (entries.length !== 1 || !entries[0] || typeof entries[0] !== 'object') {
    throw new Error(`npm view returned ${entries.length} metadata entries for an exact version`);
  }

  const metadata = { ...entries[0] };
  const flatAttestations = metadata['dist.attestations'];

  if (flatAttestations) {
    metadata.dist = { ...metadata.dist, attestations: flatAttestations };
    delete metadata['dist.attestations'];
  }

  return metadata;
}

function npmErrorCode(result) {
  for (const output of [result.stderr, result.stdout]) {
    if (!output?.trim()) {
      continue;
    }

    try {
      const payload = JSON.parse(output);
      const code = payload?.error?.code ?? payload?.code;

      if (code) {
        return code;
      }
    } catch {
      // npm emits JSON for registry reads; a non-JSON failure is unsafe to classify as E404.
    }
  }

  return undefined;
}

function commandFailure(command, args, result) {
  const detail = result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status}`;

  return new Error(`${command} ${args.join(' ')} failed: ${detail}`);
}

export function queryRegistryPackage({ cwd, env, name, version }) {
  const args = [
    'view',
    `${name}@${version}`,
    ...REGISTRY_FIELDS,
    '--json',
    '--registry',
    NPM_REGISTRY,
  ];
  const result = spawnCommand('npm', args, {
    cwd,
    encoding: 'utf8',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  return interpretRegistryResult(result, args);
}

export function interpretRegistryResult(result, args = ['view']) {
  if (result.status === 0) {
    return { metadata: normalizeRegistryMetadata(parseJsonObject(result.stdout)), state: 'found' };
  }

  if (npmErrorCode(result) === 'E404') {
    return { state: 'missing' };
  }

  throw commandFailure('npm', args, result);
}

function attestationEntries(metadata) {
  const attestations = metadata?.dist?.attestations;

  if (!attestations) {
    return [];
  }

  return Array.isArray(attestations) ? attestations : [attestations];
}

export function hasSlsaProvenance(metadata) {
  return attestationEntries(metadata).some(
    (attestation) =>
      attestation?.provenance?.predicateType === PROVENANCE_PREDICATE ||
      attestation?.predicateType === PROVENANCE_PREDICATE,
  );
}

export function validatePublishedManifest({
  internalNames,
  manifest,
  packageName,
  requireProvenance = false,
  sourceManifest,
  version,
}) {
  const errors = [];

  if (manifest?.name !== packageName) {
    errors.push(`name is ${manifest?.name ?? 'missing'}`);
  }

  if (manifest?.version !== version) {
    errors.push(`version is ${manifest?.version ?? 'missing'}`);
  }

  if (manifestRepositoryUrl(manifest ?? {}) !== EXPECTED_REPOSITORY_URL) {
    errors.push('repository URL is missing or incorrect');
  }

  for (const field of PUBLISHED_DEPENDENCY_FIELDS) {
    for (const [dependencyName, range] of Object.entries(manifest?.[field] ?? {})) {
      if (typeof range === 'string' && range.startsWith('workspace:')) {
        errors.push(`${field}.${dependencyName} still uses ${range}`);
      }
    }

    for (const [dependencyName, sourceRange] of Object.entries(sourceManifest?.[field] ?? {})) {
      if (!internalNames.has(dependencyName)) {
        continue;
      }

      const expectedRange = expectedPublishedRange(sourceRange, version);
      const publishedRange = manifest?.[field]?.[dependencyName];

      if (publishedRange !== expectedRange) {
        errors.push(`${field}.${dependencyName} is ${publishedRange}; expected ${expectedRange}`);
      }
    }
  }

  if (requireProvenance && !hasSlsaProvenance(manifest)) {
    errors.push(`dist.attestations lacks ${PROVENANCE_PREDICATE}`);
  }

  if (errors.length > 0) {
    throw new Error(`${packageName}@${version} registry validation failed: ${errors.join('; ')}`);
  }
}

export function expectedPublishedRange(sourceRange, version) {
  if (sourceRange === 'workspace:*') {
    return version;
  }

  if (sourceRange === 'workspace:^') {
    return `^${version}`;
  }

  if (sourceRange === 'workspace:~') {
    return `~${version}`;
  }

  return sourceRange.startsWith('workspace:')
    ? sourceRange.slice('workspace:'.length)
    : sourceRange;
}

export function validatePackedManifest({ internalNames, manifest, workspace }) {
  validatePublishedManifest({
    internalNames,
    manifest,
    packageName: workspace.name,
    sourceManifest: workspace.manifest,
    version: workspace.manifest.version,
  });
}

export function inspectPackedManifest({ extractDirectory, packageName, tarballPath }) {
  mkdirSync(extractDirectory, { recursive: true });
  extractTar({
    cwd: extractDirectory,
    file: tarballPath,
    filter: (entryPath) => entryPath === 'package/package.json',
    strict: true,
    sync: true,
  });

  const manifestPath = join(extractDirectory, 'package', 'package.json');

  if (!existsSync(manifestPath)) {
    throw new Error(`${packageName}: packed tarball has no package/package.json`);
  }

  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function assertLiveEnvironment(env) {
  const credentialVariables = Object.entries(env)
    .filter(([, value]) => Boolean(value))
    .map(([name]) => name)
    .filter((name) => {
      const normalizedName = name.toUpperCase();

      return (
        [
          'NODE_AUTH_TOKEN',
          'NPM_AUTH_TOKEN',
          'NPM_TOKEN',
          'YARN_NPM_AUTH_IDENT',
          'YARN_NPM_AUTH_TOKEN',
        ].includes(normalizedName) ||
        /^NPM_CONFIG_.*(?:AUTH|OTP|PASSWORD|TOKEN|USERNAME)/i.test(name)
      );
    });

  if (credentialVariables.length > 0) {
    throw new Error(
      `Refusing token fallback; unset npm authentication variables: ${credentialVariables.join(', ')}`,
    );
  }

  if (env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Live publication is restricted to GitHub Actions');
  }

  if (env.GITHUB_REPOSITORY !== EXPECTED_GITHUB_REPOSITORY) {
    throw new Error(`GITHUB_REPOSITORY must be ${EXPECTED_GITHUB_REPOSITORY}`);
  }

  const tag = env.GITHUB_REF_NAME ?? env.GITHUB_REF?.replace(/^refs\/tags\//, '');
  const isTag = env.GITHUB_REF_TYPE === 'tag' || env.GITHUB_REF?.startsWith('refs/tags/');

  if (!isTag || !STABLE_TAG_PATTERN.test(tag ?? '')) {
    throw new Error('Live publication requires a stable vX.Y.Z GitHub tag ref');
  }

  if (!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    throw new Error('GitHub OIDC request variables are unavailable; grant id-token: write');
  }

  return tag.slice(1);
}

function createNpmEnvironment(runtimeDirectory, env) {
  const userConfig = join(runtimeDirectory, 'user.npmrc');
  const globalConfig = join(runtimeDirectory, 'global.npmrc');

  writeFileSync(userConfig, '');
  writeFileSync(globalConfig, '');

  const npmEnvironment = Object.fromEntries(
    Object.entries(env).filter(
      ([name]) =>
        !/^NPM_CONFIG_(?:CACHE|GLOBALCONFIG|PREFER_ONLINE|REGISTRY|USERCONFIG)$/i.test(name),
    ),
  );

  return {
    ...npmEnvironment,
    NPM_CONFIG_CACHE: join(runtimeDirectory, 'npm-cache'),
    NPM_CONFIG_GLOBALCONFIG: globalConfig,
    NPM_CONFIG_PREFER_ONLINE: 'true',
    NPM_CONFIG_REGISTRY: NPM_REGISTRY,
    NPM_CONFIG_USERCONFIG: userConfig,
  };
}

function safePackageSlug(packageName) {
  return packageName.replaceAll(/[^0-9A-Za-z._-]/g, '-').replace(/^-+/, '');
}

export function createPublisherOperations({ env, runtimeDirectory }) {
  const npmEnvironment = createNpmEnvironment(runtimeDirectory, env);

  return {
    async pack(workspace) {
      const packageDirectory = join(runtimeDirectory, safePackageSlug(workspace.name));
      const tarballPath = join(packageDirectory, `${workspace.manifest.version}.tgz`);
      const extractDirectory = join(packageDirectory, 'unpacked');

      execCommand('yarn', ['pack', '--out', tarballPath], {
        cwd: workspace.directory,
        encoding: 'utf8',
      });

      return {
        manifest: inspectPackedManifest({
          extractDirectory,
          packageName: workspace.name,
          tarballPath,
        }),
        tarballPath,
      };
    },

    publish(tarballPath) {
      const args = [
        'publish',
        tarballPath,
        '--access',
        'public',
        '--tag',
        'latest',
        '--registry',
        NPM_REGISTRY,
      ];
      const result = spawnCommand('npm', args, {
        cwd: runtimeDirectory,
        env: npmEnvironment,
        stdio: 'inherit',
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new Error(`npm publish failed with exit ${result.status}`);
      }
    },

    query(workspace) {
      return queryRegistryPackage({
        cwd: runtimeDirectory,
        env: npmEnvironment,
        name: workspace.name,
        version: workspace.manifest.version,
      });
    },

    sleep,
  };
}

async function waitForVerifiedPackage({
  initialMetadata,
  internalNames,
  operations,
  pollAttempts,
  pollDelayMs,
  workspace,
}) {
  let metadata = initialMetadata;

  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    if (metadata) {
      validatePublishedManifest({
        internalNames,
        manifest: metadata,
        packageName: workspace.name,
        sourceManifest: workspace.manifest,
        version: workspace.manifest.version,
      });

      if (hasSlsaProvenance(metadata)) {
        return;
      }
    }

    if (attempt === pollAttempts) {
      break;
    }

    await operations.sleep(pollDelayMs);

    const result = await operations.query(workspace);
    metadata = result.state === 'found' ? result.metadata : undefined;
  }

  throw new Error(
    `${workspace.name}@${workspace.manifest.version} did not expose SLSA provenance after ${pollAttempts} checks`,
  );
}

function addUnattempted(summary, ordered, index) {
  summary.unattempted.push(...ordered.slice(index + 1).map(({ name }) => name));
}

export async function executePublication({
  dryRun,
  log = console,
  operations,
  pollAttempts = DEFAULT_POLL_ATTEMPTS,
  pollDelayMs = DEFAULT_POLL_DELAY_MS,
  workspaces,
}) {
  const ordered = topologicallySortWorkspaces(workspaces);
  const internalNames = new Set(ordered.map(({ name }) => name));
  const summary = {
    failed: [],
    published: [],
    raceRecovered: [],
    skipped: [],
    unattempted: [],
    validated: [],
  };

  for (const [index, workspace] of ordered.entries()) {
    try {
      if (dryRun) {
        const packed = await operations.pack(workspace);

        validatePackedManifest({ internalNames, manifest: packed.manifest, workspace });
        summary.validated.push(workspace.name);
        log.log(`validated packed artifact: ${workspace.name}@${workspace.manifest.version}`);

        continue;
      }

      const existing = await operations.query(workspace);

      if (existing.state === 'found') {
        await waitForVerifiedPackage({
          initialMetadata: existing.metadata,
          internalNames,
          operations,
          pollAttempts,
          pollDelayMs,
          workspace,
        });
        summary.skipped.push(workspace.name);
        log.log(`skip (published and verified): ${workspace.name}@${workspace.manifest.version}`);

        continue;
      }

      const packed = await operations.pack(workspace);

      validatePackedManifest({ internalNames, manifest: packed.manifest, workspace });
      log.log(`publishing with npm OIDC: ${workspace.name}@${workspace.manifest.version}`);

      try {
        await operations.publish(packed.tarballPath, workspace);
      } catch (publishError) {
        const raced = await operations.query(workspace);

        if (raced.state !== 'found') {
          throw publishError;
        }

        await waitForVerifiedPackage({
          initialMetadata: raced.metadata,
          internalNames,
          operations,
          pollAttempts,
          pollDelayMs,
          workspace,
        });
        summary.raceRecovered.push(workspace.name);
        log.log(`publish race recovered: ${workspace.name}@${workspace.manifest.version}`);

        continue;
      }

      await waitForVerifiedPackage({
        internalNames,
        operations,
        pollAttempts,
        pollDelayMs,
        workspace,
      });
      summary.published.push(workspace.name);
    } catch (error) {
      summary.failed.push(workspace.name);
      addUnattempted(summary, ordered, index);
      error.publicationSummary = summary;

      throw error;
    }
  }

  return summary;
}

export function printPublicationSummary(summary, log = console) {
  log.log('\nPublication summary');

  for (const [label, names] of [
    ['packed and validated', summary.validated],
    ['published', summary.published],
    ['already published', summary.skipped],
    ['race recovered', summary.raceRecovered],
    ['failed', summary.failed],
    ['not attempted', summary.unattempted],
  ]) {
    log.log(`  ${label} (${names.length})${names.length ? `: ${names.join(', ')}` : ''}`);
  }
}

function removeRuntimeDirectory(runtimeDirectory, parentDirectory) {
  const resolvedRuntime = resolve(runtimeDirectory);
  const resolvedParent = resolve(parentDirectory);

  if (
    dirname(resolvedRuntime) !== resolvedParent ||
    !basename(resolvedRuntime).startsWith('rc-npm-publish-')
  ) {
    throw new Error(`Refusing to remove unexpected runtime directory: ${resolvedRuntime}`);
  }

  rmSync(resolvedRuntime, { recursive: true });
}

function usage() {
  console.log('Usage: node scripts/publish-workspaces.mjs [--dry-run]');
}

export async function main(args = process.argv.slice(2), env = process.env) {
  if (args.includes('--help')) {
    usage();

    return;
  }

  const unknownArgs = args.filter((argument) => argument !== '--dry-run');

  if (unknownArgs.length > 0) {
    throw new Error(`Unknown argument(s): ${unknownArgs.join(', ')}`);
  }

  const dryRun = args.includes('--dry-run');
  const root = process.cwd();
  const workspaces = loadPublicWorkspaces({ root });
  const expectedVersion = dryRun ? undefined : assertLiveEnvironment(env);

  validateWorkspaceConfiguration({ expectedVersion, root, workspaces });

  const runtimeParent = resolve(env.RUNNER_TEMP ?? tmpdir());
  const runtimeDirectory = mkdtempSync(join(runtimeParent, 'rc-npm-publish-'));

  try {
    const operations = createPublisherOperations({ env, runtimeDirectory });

    if (!dryRun) {
      const npmVersion = execCommand('npm', ['--version'], { encoding: 'utf8' }).trim();

      assertMinimumVersion('npm', npmVersion, MINIMUM_NPM_VERSION);
    }

    const summary = await executePublication({ dryRun, operations, workspaces });

    printPublicationSummary(summary);
  } catch (error) {
    if (error.publicationSummary) {
      printPublicationSummary(error.publicationSummary);
    }

    throw error;
  } finally {
    removeRuntimeDirectory(runtimeDirectory, runtimeParent);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
