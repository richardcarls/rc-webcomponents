'use strict';

import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { inspectPackedManifest, validatePackedManifest } from './publish-workspaces.mjs';
import {
  execCommand,
  loadPublicWorkspaces,
  topologicallySortWorkspaces,
} from './release-workspaces.mjs';

function safePackageSlug(packageName) {
  return packageName.replaceAll(/[^0-9A-Za-z._-]/g, '-').replace(/^-+/, '');
}

function usage() {
  console.log(
    'Usage: node scripts/prepare-bootstrap-packages.mjs --out <directory> <package> [package...]',
  );
}

export function parseBootstrapArguments(args) {
  const packageNames = [];
  let outputDirectory;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--out') {
      outputDirectory = args[index + 1];
      index += 1;

      continue;
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    packageNames.push(argument);
  }

  if (!outputDirectory) {
    throw new Error('--out <directory> is required');
  }

  if (packageNames.length === 0) {
    throw new Error('At least one package name is required');
  }

  if (new Set(packageNames).size !== packageNames.length) {
    throw new Error('Package names must not be repeated');
  }

  return { outputDirectory, packageNames };
}

export function selectBootstrapWorkspaces(workspaces, packageNames) {
  const workspacesByName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const selected = packageNames.map((packageName) => {
    const workspace = workspacesByName.get(packageName);

    if (!workspace) {
      throw new Error(`Unknown public workspace: ${packageName}`);
    }

    return workspace;
  });

  return topologicallySortWorkspaces(selected);
}

export function bootstrapTarballName(workspace) {
  return `${safePackageSlug(workspace.name)}-${workspace.manifest.version}.tgz`;
}

export function prepareBootstrapPackages({
  log = console,
  operations,
  outputDirectory,
  selectedWorkspaces,
  workspaces,
}) {
  const internalNames = new Set(workspaces.map(({ name }) => name));
  const internalVersions = new Map(
    workspaces.map(({ manifest, name }) => [name, manifest.version]),
  );
  const tarballs = [];

  for (const workspace of selectedWorkspaces) {
    const tarballPath = join(outputDirectory, bootstrapTarballName(workspace));

    if (existsSync(tarballPath)) {
      throw new Error(`Refusing to overwrite existing bootstrap tarball: ${tarballPath}`);
    }

    const manifest = operations.pack(workspace, tarballPath);

    validatePackedManifest({ internalNames, internalVersions, manifest, workspace });
    tarballs.push(tarballPath);
    log.log(`prepared bootstrap tarball: ${workspace.name}@${workspace.manifest.version}`);
  }

  return tarballs;
}

export function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    usage();

    return;
  }

  const { outputDirectory: outputArgument, packageNames } = parseBootstrapArguments(args);
  const root = process.cwd();
  const outputDirectory = resolve(root, outputArgument);
  const workspaces = loadPublicWorkspaces({ root });
  const selectedWorkspaces = selectBootstrapWorkspaces(workspaces, packageNames);
  const scratchDirectory = mkdtempSync(join(tmpdir(), 'rc-npm-bootstrap-'));

  mkdirSync(outputDirectory, { recursive: true });

  try {
    const tarballs = prepareBootstrapPackages({
      operations: {
        pack(workspace, tarballPath) {
          execCommand('yarn', ['pack', '--out', tarballPath], {
            cwd: workspace.directory,
            encoding: 'utf8',
          });

          return inspectPackedManifest({
            extractDirectory: join(scratchDirectory, safePackageSlug(workspace.name)),
            packageName: workspace.name,
            tarballPath,
          });
        },
      },
      outputDirectory,
      selectedWorkspaces,
      workspaces,
    });

    console.log('\nPublish each tarball manually with npm and 2FA, in this order:');

    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    for (const tarballPath of tarballs) {
      console.log(`  ${npmCommand} publish ${JSON.stringify(tarballPath)} --access public`);
    }
  } finally {
    rmSync(scratchDirectory, { recursive: true });
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
