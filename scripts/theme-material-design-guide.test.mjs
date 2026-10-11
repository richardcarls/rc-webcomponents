import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const themeRoot = join(root, 'packages/rc-theme-material');
const guide = readFileSync(join(themeRoot, 'DESIGN.md'), 'utf8');
const [, frontMatter = '', body = ''] = guide.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];

function readTree(directory, extensions) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        extensions.some((extension) => entry.name.endsWith(extension)) &&
        !join(entry.parentPath, entry.name).includes('node_modules'),
    )
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
    .join('\n');
}

const themeCss = readTree(themeRoot, ['.css']);
const componentSources = readdirSync(join(root, 'packages'), { withFileTypes: true })
  .map((entry) => join(root, 'packages', entry.name, 'src'))
  .filter((directory) => directory.includes('/rc-') && existsSync(directory))
  .map((directory) => readTree(directory, ['.ts']))
  .join('\n');
const sources = `${themeCss}\n${componentSources}`;

/** Light values of `--md-sys-color-*` roles, resolved through the reference palette. */
function lightColorRoles() {
  const defaults = readFileSync(join(themeRoot, 'defaults.css'), 'utf8').split(
    '@media (forced-colors',
  )[0];
  const declarations = new Map(
    [...defaults.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.replace(/\s+/g, ' ').trim(),
    ]),
  );

  const resolve = (value) => {
    const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);

    return reference ? resolve(declarations.get(reference[1]) ?? '') : value;
  };

  const roles = new Map();

  for (const [name, value] of declarations) {
    if (!name.startsWith('--md-sys-color-')) {
      continue;
    }

    const light = value.match(/^light-dark\(\s*(.+?)\s*,/)?.[1] ?? value;

    roles.set(name.slice('--md-sys-color-'.length), resolve(light).slice(0, 7).toLowerCase());
  }

  return roles;
}

test('design guide has front matter and a body', () => {
  assert.match(frontMatter, /^version: /m);
  assert.match(body, /^# rc-theme-material design guide$/m);
});

test('front matter light colors match the vendored baseline scheme', () => {
  const roles = lightColorRoles();
  const colors = frontMatter.split(/^typography:/m)[0];

  const entries = [...colors.matchAll(/^ {2}([a-z-]+): ['"](#[0-9a-f]{6})['"]/gm)].filter(
    ([, role]) => !role.endsWith('-dark'),
  );

  assert.ok(entries.length > 20, 'front matter lists the light color roles');

  for (const [, role, hex] of entries) {
    assert.equal(roles.get(role), hex, `colors.${role}`);
  }
});

test('every theme hook and token the guide names exists in source', () => {
  const names = new Set(
    [
      ...body.matchAll(/(?<![\w-])(--(?:md|rc)-[a-z0-9-]*[a-z0-9])/g),
      ...body.matchAll(/(?<![\w-])\.(rc-[a-z0-9-]*[a-z0-9])/g),
      ...body.matchAll(/(?<![\w-])(data-rc-[a-z-]*[a-z])/g),
    ].map((match) => match[1]),
  );

  const missing = [...names].filter((name) => !sources.includes(name));

  assert.deepEqual(missing, []);
});
