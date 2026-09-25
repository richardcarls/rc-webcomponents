import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTAINER_SCRIPT,
  dockerRunArgs,
  imageTag,
  nodeModulesVolume,
  playwrightVersion,
  volumePrefix,
  workspaceDirs,
} from './playwright-env.mjs';

const LOCK = `"playwright-core@npm:1.60.0":
  version: 1.60.0
  resolution: "playwright-core@npm:1.60.0"

"playwright@npm:^1.56.0":
  version: 1.60.0
  resolution: "playwright@npm:1.60.0"
`;

test('reads the resolved playwright version, not playwright-core', () => {
  assert.equal(playwrightVersion(LOCK), '1.60.0');
  assert.equal(imageTag('1.60.0'), 'mcr.microsoft.com/playwright:v1.60.0-noble');
});

test('fails clearly when yarn.lock has no playwright entry', () => {
  assert.throws(() => playwrightVersion('"lit@npm:^3.0.0":\n  version: 3.3.1\n'), /playwright/);
});

test('lists the root and every workspace with a package.json', () => {
  const root = mkdtempSync(join(tmpdir(), 'rc-playwright-env-'));

  for (const dir of ['packages/b', 'packages/a', 'packages/not-a-package', 'docs']) {
    mkdirSync(join(root, dir), { recursive: true });
  }

  for (const dir of ['packages/a', 'packages/b', 'docs']) {
    writeFileSync(join(root, dir, 'package.json'), '{}');
  }

  assert.deepEqual(workspaceDirs(root, ['packages/*', 'docs', 'missing/*']), [
    '.',
    'packages/a',
    'packages/b',
    'docs',
  ]);
});

test('scopes volume names to the checkout', () => {
  const prefix = volumePrefix('/home/someone/rc-webcomponents');

  assert.match(prefix, /^rcwc-[0-9a-f]{8}$/);
  assert.notEqual(prefix, volumePrefix('/home/someone/other-clone'));
  assert.equal(nodeModulesVolume(prefix, '.'), `${prefix}-nm-root`);
  assert.equal(nodeModulesVolume(prefix, 'packages/rc-common'), `${prefix}-nm-packages-rc-common`);
});

function argsFor(overrides = {}) {
  return dockerRunArgs({
    root: '/repo',
    image: 'mcr.microsoft.com/playwright:v1.60.0-noble',
    prefix: 'rcwc-test',
    dirs: ['.', 'packages/rc-common'],
    script: 'test:host',
    args: ['packages/rc-common'],
    user: '1000:1000',
    env: { CI: 'true', RC_TEST_BROWSER: 'firefox', SECRET_TOKEN: 'nope' },
    tty: false,
    ...overrides,
  });
}

function envOf(args) {
  return args
    .flatMap((arg, index) => (args[index - 1] === '-e' ? [arg] : []))
    .reduce((env, pair) => {
      const [name, ...value] = pair.split('=');

      return { ...env, [name]: value.join('=') };
    }, {});
}

test('mounts the checkout and gives every node_modules its own volume', () => {
  const args = argsFor();

  assert.ok(args.includes('/repo:/work'));
  assert.ok(args.includes('rcwc-test-cache:/cache'));
  assert.ok(args.includes('rcwc-test-nm-root:/work/node_modules'));
  assert.ok(args.includes('rcwc-test-nm-packages-rc-common:/work/packages/rc-common/node_modules'));
  assert.deepEqual(args.slice(0, 4), ['run', '--rm', '--init', '--ipc=host']);
});

test('runs as the host user on Linux and as the image default elsewhere', () => {
  const linux = argsFor();
  const desktop = argsFor({ user: undefined });

  assert.equal(linux[linux.indexOf('--user') + 1], '1000:1000');
  assert.equal(envOf(linux).HOME, '/tmp/home');
  assert.ok(!desktop.includes('--user'));
  assert.equal(envOf(desktop).HOME, '/root');
});

test('passes only the allowed host variables and marks the container environment', () => {
  const env = envOf(argsFor());

  assert.equal(env.RC_PLAYWRIGHT_ENV, '1');
  assert.equal(env.CI, 'true');
  assert.equal(env.RC_TEST_BROWSER, 'firefox');
  assert.equal(env.SECRET_TOKEN, undefined);
  assert.equal(env.YARN_INSTALL_STATE_PATH, '/work/node_modules/.yarn-state.gz');
});

test('ends with the container script and the host variant of the requested script', () => {
  const args = argsFor();
  const image = args.indexOf('mcr.microsoft.com/playwright:v1.60.0-noble');

  assert.deepEqual(args.slice(image + 1), [
    'bash',
    '-c',
    CONTAINER_SCRIPT,
    'playwright-env',
    'test:host',
    'packages/rc-common',
  ]);
});

test('validates the cached install on every container run', () => {
  assert.match(CONTAINER_SCRIPT, /^yarn install --immutable$/m);
  assert.doesNotMatch(CONTAINER_SCRIPT, /rc-lock-stamp|sha256sum/);
});

test('requests a TTY only for an interactive terminal', () => {
  assert.ok(!argsFor().includes('-it'));
  assert.ok(argsFor({ tty: true }).includes('-it'));
});

test('runs the script directly inside the image instead of starting Docker', () => {
  const result = spawnSync(process.execPath, [resolve('scripts/playwright-env.mjs'), '--version'], {
    encoding: 'utf8',
    env: { ...process.env, RC_PLAYWRIGHT_ENV: '1' },
  });

  // `yarn --version` succeeds and prints a version, which only the
  // short-circuit path does; the Docker path would try to start a container.
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/);
});
