import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { parseBaseDeclarations, propertyMappings } from './generate-property-mappings.mjs';

const css = readFileSync(resolve('packages/rc-webcomponents/themes/base.css'), 'utf8');
const mappings = propertyMappings(css);

test('maps every distinct shared token from its base declaration', () => {
  const declarations = parseBaseDeclarations(css);

  assert.equal(declarations.size, 60);
  assert.deepEqual(Object.keys(mappings.properties), [...declarations.keys()].sort());

  for (const [name, declaration] of declarations) {
    assert.equal(mappings.properties[name].fallback, declaration.fallback, name);
    assert.equal(mappings.properties[name].inherits, true, name);
  }
});

test('retains the conditional accent override separately from the base fallback', () => {
  assert.deepEqual(mappings.properties['--rc-accent'], {
    fallback: 'Highlight',
    syntax: '<color>',
    inherits: true,
    registration: null,
    ineligibleReason: 'system-color',
    conditional: [{ when: '@supports (color: AccentColor)', value: 'AccentColor' }],
  });
});

test('emits only syntactically valid, independent typed initial values', () => {
  const eligible = Object.values(mappings.properties).filter((entry) => entry.registration);

  assert.ok(eligible.length > 0);

  for (const entry of eligible) {
    assert.deepEqual(entry.registration, {
      syntax: entry.syntax,
      inherits: true,
      initialValue: entry.fallback,
    });

    assert.match(entry.fallback, /^(?:[+-]?(?:\d+\.?\d*|\.\d+)(?:px|ms|s)?|0)$/);
    assert.ok(['<length>', '<number>', '<time>'].includes(entry.syntax));
  }

  assert.equal(
    mappings.properties['--rc-motion-effects-duration-fast'].registration.syntax,
    '<time>',
  );

  assert.equal(mappings.properties['--rc-control-block-size'].ineligibleReason, 'relative-unit');
  assert.equal(mappings.properties['--rc-control-radius'].ineligibleReason, 'dynamic-fallback');
  assert.equal(mappings.properties['--rc-shadow'].ineligibleReason, 'unsupported-syntax');
});

test('rejects duplicate base declarations and conditional-only tokens', () => {
  assert.throws(() => parseBaseDeclarations(':root { --rc-x: 1px; --rc-x: 2px; }'), /Duplicate/);

  assert.throws(
    () => parseBaseDeclarations('@supports (color: red) { :root { --rc-x: red; } }'),
    /Missing base/,
  );
});
