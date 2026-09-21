'use strict';

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXPECTED_REPOSITORY_URL } from './release-workspaces.mjs';

const DEFAULT_VERSION = '0.0.0';
const SCOPE_PATTERN = /^@rcarls\//;

function usage() {
  console.log(
    'Usage: node scripts/bootstrap-trusted-publisher.mjs <package-name> [--version <version>] [--out <directory>]',
  );
}

export function parseBootstrapArguments(args) {
  let packageName;
  let version = DEFAULT_VERSION;
  let outputDirectory;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--version') {
      version = args[index + 1];
      index += 1;

      continue;
    }

    if (argument === '--out') {
      outputDirectory = args[index + 1];
      index += 1;

      continue;
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    if (packageName) {
      throw new Error('Only one package name is supported');
    }

    packageName = argument;
  }

  if (!packageName) {
    throw new Error('A package name is required');
  }

  if (!SCOPE_PATTERN.test(packageName)) {
    throw new Error(`Package name must be scoped under @rcarls/: ${packageName}`);
  }

  if (!version) {
    throw new Error('--version requires a value');
  }

  return { outputDirectory, packageName, version };
}

export function buildPlaceholderManifest({ packageName, version }) {
  return {
    name: packageName,
    version,
    description:
      'Placeholder published only to register this package name on npm before configuring ' +
      'Trusted Publishing. Contains no code. Do not install or depend on this version.',
    repository: { type: 'git', url: EXPECTED_REPOSITORY_URL },
    license: 'MIT',
    private: false,
    publishConfig: { access: 'public' },
  };
}

export function buildPlaceholderReadme({ packageName, version }) {
  return `# ${packageName}

This version (\`${version}\`) is a placeholder, published only to register this package name on
npm so a Trusted Publisher can be configured for it before any real release. It contains no code.

Do not install or depend on this version. The real package ships in a later version, published
automatically through this repository's normal release pipeline once Trusted Publishing is
configured.
`;
}

export function writePlaceholderPackage({ directory, packageName, version }) {
  mkdirSync(directory, { recursive: true });

  writeFileSync(
    join(directory, 'package.json'),
    `${JSON.stringify(buildPlaceholderManifest({ packageName, version }), null, 2)}\n`,
  );

  writeFileSync(join(directory, 'README.md'), buildPlaceholderReadme({ packageName, version }));

  return directory;
}

export function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    usage();

    return;
  }

  const {
    outputDirectory: outputArgument,
    packageName,
    version,
  } = parseBootstrapArguments(args);
  const root = process.cwd();
  const directory = outputArgument
    ? resolve(root, outputArgument)
    : mkdtempSync(join(tmpdir(), 'rc-npm-trusted-publisher-bootstrap-'));

  writePlaceholderPackage({ directory, packageName, version });

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  console.log(`Prepared placeholder package at: ${directory}`);
  console.log('\nPublish it manually with npm and 2FA:');
  console.log(`  ${npmCommand} publish ${JSON.stringify(directory)} --access public`);

  console.log(
    '\nThen configure its Trusted Publisher on npmjs.com. The real package publishes ' +
      'automatically the next time this repository releases, no further bootstrap needed.',
  );
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
