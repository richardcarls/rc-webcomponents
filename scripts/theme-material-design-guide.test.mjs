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

const defaults = readFileSync(join(themeRoot, 'defaults.css'), 'utf8').split(
  '@media (forced-colors',
)[0];
const declarations = new Map(
  [...defaults.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [
    name,
    value.replace(/\s+/g, ' ').trim(),
  ]),
);

function resolveToken(name) {
  const value = declarations.get(name);

  assert.ok(value, `${name} exists in defaults.css`);

  const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);

  return reference ? resolveToken(reference[1]) : value;
}

function section(name) {
  const start = frontMatter.indexOf(`${name}:\n`);

  assert.notEqual(start, -1, `${name} front matter exists`);

  const remainder = frontMatter.slice(start + name.length + 2);
  const end = remainder.search(/^[a-z-]+:/m);

  return end === -1 ? remainder : remainder.slice(0, end);
}

function simpleEntries(name) {
  return new Map(
    [...section(name).matchAll(/^ {2}'?([a-z0-9-]+)'?: (.+)$/gm)].map(([, key, value]) => [
      key,
      value
        .split(' # ')[0]
        .trim()
        .replace(/^['"]|['"]$/g, ''),
    ]),
  );
}

test('design guide has front matter and a body', () => {
  assert.match(frontMatter, /^version: /m);
  assert.match(body, /^# rc-theme-material design guide$/m);
});

test('front matter light and dark colors match the vendored baseline scheme', () => {
  const colors = simpleEntries('colors');

  assert.equal(colors.size, 44, 'front matter lists its light and dark color roles');

  for (const [key, hex] of colors) {
    const dark = key.endsWith('-dark');
    const role = dark ? key.slice(0, -'-dark'.length) : key;
    const value = resolveToken(`--md-sys-color-${role}`);
    const pair = value.match(
      /^light-dark\(\s*(var\(--[a-z0-9-]+\))\s*,\s*(var\(--[a-z0-9-]+\))\s*\)$/,
    );
    const selected = pair ? pair[dark ? 2 : 1] : value;
    const reference = selected.match(/^var\((--[a-z0-9-]+)\)$/);
    const actual = reference ? resolveToken(reference[1]) : selected;

    assert.equal(actual.slice(0, 7).toLowerCase(), hex, `colors.${key}`);
  }
});

test('front matter typography and corner sizes match the vendored tokens', () => {
  const typography = section('typography');
  const roles = [...typography.matchAll(/^ {2}([a-z]+-[a-z]+):\n((?: {4}[^\n]+\n)+)/gm)];

  assert.equal(roles.length, 15, 'front matter lists the full type scale');

  const fields = {
    fontFamily: 'font',
    fontSize: 'size',
    fontWeight: 'weight',
    lineHeight: 'line-height',
    letterSpacing: 'tracking',
  };

  for (const [, role, block] of roles) {
    const values = new Map(
      [...block.matchAll(/^ {4}([a-zA-Z]+): (.+)$/gm)].map(([, key, value]) => [key, value]),
    );

    assert.equal(values.size, 5, `typography.${role} has all five fields`);

    for (const [field, suffix] of Object.entries(fields)) {
      const actual = resolveToken(`--md-sys-typescale-${role}-${suffix}`);
      const expected = values.get(field);

      assert.ok(expected, `typography.${role}.${field} exists`);

      if (field === 'letterSpacing') {
        assert.ok(
          Math.abs(parseFloat(actual) - parseFloat(expected)) < 0.00001,
          `typography.${role}.${field}: ${actual} matches ${expected}`,
        );
      } else {
        assert.equal(actual, expected, `typography.${role}.${field}`);
      }
    }
  }

  const rounded = simpleEntries('rounded');

  assert.equal(rounded.size, 7, 'front matter lists all corner sizes');

  for (const [name, value] of rounded) {
    assert.equal(resolveToken(`--md-sys-shape-corner-${name}`), value, `rounded.${name}`);
  }
});

test('spacing guidance follows the four-pixel grid and theme touch target', () => {
  const spacing = simpleEntries('spacing');

  for (const step of ['1', '2', '3', '4', '6']) {
    assert.equal(spacing.get(step), `${Number(step) * 4}px`, `spacing.${step}`);
  }

  assert.equal(spacing.get('pane-gap'), spacing.get('6'));

  const target = readFileSync(join(themeRoot, 'components/adaptive-menu.css'), 'utf8').match(
    /--rc-adaptive-menu-touch-target-block-size:\s*([\d.]+)rem/,
  );

  assert.ok(target, 'theme declares an adaptive menu touch target');
  assert.equal(spacing.get('touch-target'), `${Number(target[1]) * 16}px`);
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
