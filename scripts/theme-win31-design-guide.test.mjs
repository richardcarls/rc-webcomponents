import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(process.cwd(), 'packages/rc-theme-win31');
const guide = readFileSync(join(root, 'DESIGN.md'), 'utf8');
const defaults = readFileSync(join(root, 'defaults.css'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const [, frontMatter = '', body = ''] = guide.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];

function entries(section) {
  const start = frontMatter.indexOf(`${section}:\n`);

  assert.notEqual(start, -1, `${section} exists`);

  const content = frontMatter.slice(start + section.length + 2);
  const end = content.search(/^[a-z-]+:/m);

  return new Map(
    [...(end === -1 ? content : content.slice(0, end)).matchAll(/^ {2}([a-z-]+): (.+)$/gm)].map(
      ([, key, value]) => [key, value.replace(/^'|'$/g, '')],
    ),
  );
}

test('guide is published and has a readable body', () => {
  assert.match(frontMatter, /^version: windows-3\.1-ctl3d-inspired$/m);
  assert.match(body, /^# rc-theme-win31 design guide$/m);
  assert.equal(packageJson.exports['./DESIGN.md'], './DESIGN.md');
  assert.ok(packageJson.files.includes('DESIGN.md'));
});

test('baseline colors match defaults.css', () => {
  const colors = entries('colors');

  assert.equal(colors.size, 16);

  for (const [role, hex] of colors) {
    const match = defaults.match(new RegExp(`--win31-color-${role}: (#[0-9a-f]{6});`, 'i'));

    assert.ok(match, `--win31-color-${role} exists`);
    assert.equal(match[1].toLowerCase(), hex.toLowerCase(), role);
  }
});

test('guide geometry matches the single-unit baseline', () => {
  const geometry = entries('geometry');

  assert.equal(geometry.size, 10);

  for (const [role, size] of geometry) {
    if (role === 'unit') {
      assert.match(defaults, /--win31-unit: 1px;/);

      continue;
    }

    const number = Number.parseInt(size, 10);
    const match = defaults.match(
      new RegExp(`--win31-${role}: calc\\(${number} \\* var\\(--win31-unit\\)\\);`),
    );

    assert.ok(match, `--win31-${role} matches ${size}`);
  }
});

test('guide typography sizes match the baseline tokens', () => {
  const typography = entries('typography');

  assert.equal(typography.size, 4);

  for (const [role, size] of typography) {
    if (role === 'family') {
      assert.match(
        defaults,
        /--win31-font-family: 'Microsoft Sans Serif', 'MS Sans Serif', Tahoma, 'Segoe UI', sans-serif;/,
      );

      continue;
    }

    const token = role === 'body-size' ? 'font-size' : `${role.replace('-size', '')}-font-size`;

    assert.ok(
      defaults.includes(
        `--win31-${token}: calc(${Number.parseInt(size, 10)} * var(--win31-unit));`,
      ),
      `${role} matches ${size}`,
    );
  }
});

test('named public tokens and markers in prose exist in theme source', () => {
  const sources = [
    defaults,
    readFileSync(join(root, 'bridge.css'), 'utf8'),
    readFileSync(join(root, 'components/button.css'), 'utf8'),
    readFileSync(join(root, 'components/switch.css'), 'utf8'),
    readFileSync(join(root, 'components/app-bar.css'), 'utf8'),
  ].join('\n');
  const names = new Set(
    [...body.matchAll(/(?<![\w-])(--(?:win31|rc)-[a-z0-9-*]+|data-rc-win31-[a-z-]+)/g)].map(
      (match) => match[1],
    ),
  );

  for (const name of names) {
    if (name.endsWith('*')) {
      assert.ok(sources.includes(name.slice(0, -1)), `${name} has a source`);
    } else if (!name.startsWith('--_rc-')) {
      assert.ok(sources.includes(name), `${name} has a source`);
    }
  }
});
