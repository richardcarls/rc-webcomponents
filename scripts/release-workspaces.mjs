'use strict';

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const EXPECTED_REPOSITORY_URL = 'git+https://github.com/richardcarls/rc-webcomponents.git';
export const EXPECTED_GITHUB_REPOSITORY = 'richardcarls/rc-webcomponents';
export const NPM_REGISTRY = 'https://registry.npmjs.org/';
export const STABLE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const STABLE_TAG_PATTERN = /^v\d+\.\d+\.\d+$/;

function commandInvocation(command, args) {
  if (process.platform !== 'win32') {
    return { command, args };
  }

  return {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', `${command}.cmd`, ...args],
  };
}

export function execCommand(command, args, options = {}) {
  const invocation = commandInvocation(command, args);

  return execFileSync(invocation.command, invocation.args, options);
}

export function spawnCommand(command, args, options = {}) {
  const invocation = commandInvocation(command, args);

  return spawnSync(invocation.command, invocation.args, options);
}

export function parseJsonLines(output) {
  return output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function repositoryUrl(manifest) {
  if (typeof manifest.repository === 'string') {
    return manifest.repository;
  }

  return manifest.repository?.url;
}

export function loadPublicWorkspaces({ root = process.cwd(), execute = execCommand } = {}) {
  const output = execute('yarn', ['workspaces', 'list', '--json', '--no-private'], {
    cwd: root,
    encoding: 'utf8',
  });

  return parseJsonLines(output)
    .map(({ location, name }) => {
      const directory = resolve(root, location);
      const relativeDirectory = relative(root, directory);

      if (
        isAbsolute(relativeDirectory) ||
        relativeDirectory === '..' ||
        relativeDirectory.startsWith(`..${sep}`)
      ) {
        throw new Error(`Workspace ${name} resolves outside the repository: ${location}`);
      }

      const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));

      return { directory, location, manifest, name };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function validateWorkspaceConfiguration({
  expectedVersion,
  root = process.cwd(),
  workspaces,
}) {
  const errors = [];
  const names = new Set(workspaces.map(({ name }) => name));
  const versions = new Set();
  const changesetConfig = JSON.parse(readFileSync(join(root, '.changeset', 'config.json'), 'utf8'));
  const fixedGroups = changesetConfig.fixed ?? [];

  if (workspaces.length === 0) {
    errors.push('No public workspaces were discovered');
  }

  for (const { location, manifest, name } of workspaces) {
    if (manifest.name !== name) {
      errors.push(`${location}: Yarn reports ${name}, but package.json declares ${manifest.name}`);
    }

    if (manifest.private === true) {
      errors.push(`${name}: private workspace reached the public release set`);
    }

    if (!STABLE_VERSION_PATTERN.test(manifest.version ?? '')) {
      errors.push(`${name}: version must be a stable X.Y.Z release (${manifest.version})`);
    } else {
      versions.add(manifest.version);
    }

    if (expectedVersion && manifest.version !== expectedVersion) {
      errors.push(
        `${name}: version ${manifest.version} does not match release version ${expectedVersion}`,
      );
    }

    if (manifest.publishConfig?.access !== 'public') {
      errors.push(`${name}: publishConfig.access must be public`);
    }

    if (repositoryUrl(manifest) !== EXPECTED_REPOSITORY_URL) {
      errors.push(`${name}: repository URL must be ${EXPECTED_REPOSITORY_URL}`);
    }
  }

  if (versions.size > 1) {
    errors.push(`Public workspaces do not share one fixed version: ${[...versions].join(', ')}`);
  }

  const matchingGroups = fixedGroups.filter((group) =>
    workspaces.some(({ name }) => group.includes(name)),
  );

  if (matchingGroups.length !== 1) {
    errors.push('Public workspaces must belong to one Changesets fixed group');
  } else {
    const fixedNames = new Set(matchingGroups[0]);

    for (const name of names) {
      if (!fixedNames.has(name)) {
        errors.push(`${name}: missing from the Changesets fixed group`);
      }
    }

    for (const name of fixedNames) {
      if (!names.has(name)) {
        errors.push(`${name}: fixed-group entry is not a public workspace`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid release workspace configuration:\n${errors.join('\n')}`);
  }

  return expectedVersion ?? [...versions][0];
}

export function topologicallySortWorkspaces(workspaces) {
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const visited = new Set();
  const visiting = new Set();
  const stack = [];
  const ordered = [];

  function visit(workspace) {
    if (visited.has(workspace.name)) {
      return;
    }

    if (visiting.has(workspace.name)) {
      const cycleStart = stack.indexOf(workspace.name);
      const cycle = [...stack.slice(cycleStart), workspace.name];

      throw new Error(`Runtime workspace dependency cycle: ${cycle.join(' -> ')}`);
    }

    visiting.add(workspace.name);
    stack.push(workspace.name);

    const runtimeDependencies = {
      ...workspace.manifest.dependencies,
      ...workspace.manifest.optionalDependencies,
    };

    for (const dependencyName of Object.keys(runtimeDependencies).sort()) {
      const dependency = byName.get(dependencyName);

      if (dependency) {
        visit(dependency);
      }
    }

    stack.pop();
    visiting.delete(workspace.name);
    visited.add(workspace.name);
    ordered.push(workspace);
  }

  for (const workspace of [...workspaces].sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    visit(workspace);
  }

  return ordered;
}

export function compareVersions(actual, minimum) {
  const parse = (value) => value.split('.').map((part) => Number.parseInt(part, 10));
  const actualParts = parse(actual);
  const minimumParts = parse(minimum);

  for (let index = 0; index < 3; index += 1) {
    const difference = (actualParts[index] ?? 0) - (minimumParts[index] ?? 0);

    if (difference !== 0) {
      return Math.sign(difference);
    }
  }

  return 0;
}

export function assertMinimumVersion(name, actual, minimum) {
  if (!STABLE_VERSION_PATTERN.test(actual) || compareVersions(actual, minimum) < 0) {
    throw new Error(`${name} ${minimum} or newer is required; found ${actual}`);
  }
}

export function manifestRepositoryUrl(manifest) {
  return repositoryUrl(manifest);
}
