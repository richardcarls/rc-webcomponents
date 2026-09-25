#!/usr/bin/env node
/**
 * Runs a package script inside the pinned Playwright Docker image, so browser
 * tests, screenshot baselines, and benchmarks render the same on every host
 * and in CI.
 *
 * Usage: node scripts/playwright-env.mjs <script> [args...]
 *
 * The image tag comes from the Playwright version resolved in yarn.lock. The
 * repository is bind-mounted, so build output, screenshots, and reports land
 * on the host; every node_modules directory is a named volume instead, since
 * a Windows or macOS host's native binaries cannot run in the Linux image.
 * Inside the image (RC_PLAYWRIGHT_ENV=1) the script runs directly.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const IMAGE_REPOSITORY = 'mcr.microsoft.com/playwright';
export const WORKDIR = '/work';
export const CACHE_DIR = '/cache';

/** Host variables a script may read inside the container. */
export const PASSTHROUGH_ENV = [
  'CI',
  'GITHUB_ACTIONS',
  'RC_TEST_BROWSER',
  'RC_FULL_BROWSER_MATRIX',
];

/** The Playwright version yarn.lock resolved, which picks the image tag. */
export function playwrightVersion(lockText) {
  const match = /^"playwright@npm:[^"\n]*":\n {2}version: ([^\s]+)$/m.exec(lockText);

  if (!match) {
    throw new Error('yarn.lock has no resolved playwright entry');
  }

  return match[1];
}

export function imageTag(version) {
  return `${IMAGE_REPOSITORY}:v${version}-noble`;
}

/**
 * Directories that get their own node_modules volume: the root and every
 * workspace matched by the root `workspaces` globs (`dir/*` or a plain path).
 */
export function workspaceDirs(root, globs) {
  const dirs = ['.'];

  for (const glob of globs) {
    if (glob.endsWith('/*')) {
      const parent = glob.slice(0, -2);
      const absolute = path.join(root, parent);

      if (!existsSync(absolute)) {
        continue;
      }

      for (const entry of readdirSync(absolute, { withFileTypes: true }).sort((a, b) =>
        a.name.localeCompare(b.name),
      )) {
        if (entry.isDirectory() && existsSync(path.join(absolute, entry.name, 'package.json'))) {
          dirs.push(`${parent}/${entry.name}`);
        }
      }
    } else if (existsSync(path.join(root, glob, 'package.json'))) {
      dirs.push(glob);
    }
  }

  return dirs;
}

/** Volume names are scoped to the checkout, so two clones never share installs. */
export function volumePrefix(root) {
  return `rcwc-${createHash('sha256').update(root).digest('hex').slice(0, 8)}`;
}

export function nodeModulesVolume(prefix, dir) {
  const slug = dir === '.' ? 'root' : dir.replace(/[^A-Za-z0-9]+/g, '-');

  return `${prefix}-nm-${slug}`;
}

/** The shell run inside the container: validate the cached install, then run the host variant. */
export const CONTAINER_SCRIPT = [
  'set -e',
  'mkdir -p "$HOME" "$COREPACK_BIN"',
  'corepack enable --install-directory "$COREPACK_BIN" >/dev/null',
  // The image ships a global Yarn 1; the project's pinned Yarn must win.
  'export PATH="$COREPACK_BIN:$PATH"',
  'yarn install --immutable',
  'exec yarn "$@"',
].join('\n');

/**
 * The `docker run` argument list. `user` is `uid:gid` on Linux hosts, so
 * files written into the checkout stay owned by the host user, and
 * undefined elsewhere, where Docker Desktop maps ownership itself.
 */
export function dockerRunArgs({ root, image, prefix, dirs, script, args, user, env, tty }) {
  const home = user ? '/tmp/home' : '/root';
  const run = ['run', '--rm', '--init', '--ipc=host'];

  if (tty) {
    run.push('-it');
  }

  if (user) {
    run.push('--user', user);
  }

  run.push('-v', `${root}:${WORKDIR}`, '-w', WORKDIR, '-v', `${prefix}-cache:${CACHE_DIR}`);

  for (const dir of dirs) {
    const target = dir === '.' ? `${WORKDIR}/node_modules` : `${WORKDIR}/${dir}/node_modules`;

    run.push('-v', `${nodeModulesVolume(prefix, dir)}:${target}`);
  }

  const containerEnv = {
    RC_PLAYWRIGHT_ENV: '1',
    HOME: home,
    COREPACK_BIN: `${home}/.corepack-bin`,
    COREPACK_HOME: `${CACHE_DIR}/corepack`,
    COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    YARN_GLOBAL_FOLDER: `${CACHE_DIR}/yarn`,
    // Keep the host's .yarn/install-state.gz untouched: it describes the
    // host's own node_modules, not the container's.
    YARN_INSTALL_STATE_PATH: `${WORKDIR}/node_modules/.yarn-state.gz`,
    // The checkout's owner differs from the container user off Linux.
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'safe.directory',
    GIT_CONFIG_VALUE_0: WORKDIR,
  };

  for (const name of PASSTHROUGH_ENV) {
    if (env[name] !== undefined) {
      containerEnv[name] = env[name];
    }
  }

  for (const [name, value] of Object.entries(containerEnv)) {
    run.push('-e', `${name}=${value}`);
  }

  run.push(image, 'bash', '-c', CONTAINER_SCRIPT, 'playwright-env', script, ...args);

  return run;
}

function docker(args, options = {}) {
  return spawnSync('docker', args, { encoding: 'utf8', ...options });
}

/** Creates missing volumes and hands them to the container user. */
function prepareVolumes(image, names, user) {
  const existing = new Set(
    (docker(['volume', 'ls', '-q']).stdout ?? '').split('\n').filter(Boolean),
  );
  const missing = names.filter((name) => !existing.has(name));

  if (!missing.length || !user) {
    return;
  }

  const mounts = missing.flatMap((name, index) => ['-v', `${name}:/v/${index}`]);
  const result = docker(['run', '--rm', ...mounts, image, 'chown', '-R', user, '/v'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error('Could not prepare the Docker volumes');
  }
}

function main() {
  const [script, ...args] = process.argv.slice(2);

  if (!script) {
    console.error('Usage: node scripts/playwright-env.mjs <script> [args...]');
    process.exit(2);
  }

  // Already inside the image: run the script itself.
  if (process.env.RC_PLAYWRIGHT_ENV === '1') {
    const result = spawnSync('yarn', [script, ...args], { stdio: 'inherit' });

    process.exit(result.status ?? 1);
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  if (docker(['version', '--format', '{{.Server.Version}}']).status !== 0) {
    console.error(
      `Docker is required to run "${script}" in the Playwright image, and it is not running.\n` +
        `Start Docker, or run "yarn ${script}" directly for a quick host-browser run ` +
        '(not authoritative for screenshots or benchmarks).',
    );

    process.exit(1);
  }

  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const image = imageTag(playwrightVersion(readFileSync(path.join(root, 'yarn.lock'), 'utf8')));
  const prefix = volumePrefix(root);
  const dirs = workspaceDirs(root, pkg.workspaces ?? []);
  const user =
    process.platform === 'linux' && typeof process.getuid === 'function'
      ? `${process.getuid()}:${process.getgid()}`
      : undefined;

  // Mount points that do not exist would be created by the Docker daemon, as
  // root on Linux; create them as the host user first.
  for (const dir of dirs) {
    mkdirSync(path.join(root, dir, 'node_modules'), { recursive: true });
  }

  prepareVolumes(
    image,
    [`${prefix}-cache`, ...dirs.map((dir) => nodeModulesVolume(prefix, dir))],
    user,
  );

  const result = spawnSync(
    'docker',
    dockerRunArgs({
      root,
      image,
      prefix,
      dirs,
      script,
      args,
      user,
      env: process.env,
      tty: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    }),
    { stdio: 'inherit' },
  );

  process.exit(result.status ?? 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
