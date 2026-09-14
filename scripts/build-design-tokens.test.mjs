import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();

execFileSync(process.execPath, [join(root, 'scripts/build-design-tokens.mjs')], {
  cwd: root,
  stdio: 'pipe',
});

function load(theme) {
  return JSON.parse(readFileSync(join(root, `design/tokens/${theme}.tokens.json`), 'utf8'));
}

function variable(document, collectionName, variableName) {
  const collection = document.collections.find((entry) => entry.name === collectionName);

  return collection?.variables.find((entry) => entry.name === variableName);
}

const material = load('material');
const substrate = load('substrate');

test('semantic colors alias primitives per mode instead of duplicating values', () => {
  const primary = variable(material, 'Color', 'color/primary');

  assert.deepEqual(primary.values.Light, {
    alias: 'palette/primary/40',
    collection: 'Primitives',
  });

  assert.deepEqual(primary.values.Dark, {
    alias: 'palette/primary/80',
    collection: 'Primitives',
  });
});

test('the rc contract aliases the theme layer rather than restating it', () => {
  assert.deepEqual(variable(material, 'RC Contract', 'core/accent').values.Value, {
    alias: 'color/primary',
    collection: 'Color',
  });
});

test('primitive hex values survive the round trip', () => {
  assert.equal(
    variable(material, 'Primitives', 'palette/primary/40').values.Value.hex,
    '#6750a4',
  );
});

test('primitives stay out of variable pickers while semantic tokens are scoped', () => {
  assert.deepEqual(variable(material, 'Primitives', 'palette/primary/40').scopes, []);

  assert.deepEqual(variable(material, 'RC Contract', 'button/bg').scopes, [
    'FRAME_FILL',
    'SHAPE_FILL',
  ]);
});

test('every variable carries a var() code syntax for Dev Mode', () => {
  for (const collection of material.collections) {
    for (const entry of collection.variables) {
      assert.match(
        entry.codeSyntax.WEB,
        /^var\(--[a-z0-9-]+\)$/,
        `${entry.name} has code syntax ${entry.codeSyntax.WEB}`,
      );
    }
  }
});

test('rem dimensions convert to pixels', () => {
  // --md-sys-typescale-body-large-size is 1rem in the source CSS.
  assert.equal(material.textStyles.find((s) => s.name === 'Material/body-large').size, 16);
});

test('text styles follow variable references to literal font values', () => {
  const body = material.textStyles.find((style) => style.name === 'Material/body-large');

  assert.equal(body.font, 'Roboto');
  assert.equal(body.weight, 400);
});

test('shadow composites become effect layers with calc blur resolved', () => {
  const level2 = material.effectStyles.find((style) => style.name === 'Elevation/level2');
  const [layer] = level2.layers;

  assert.equal(layer.offsetY, 3);
  // Blur is calc(<elevation> * 2) in the source.
  assert.equal(layer.radius, 6);
  // color-mix(... 18%, transparent) is an alpha change on the shadow color.
  assert.equal(layer.colors.Light.a, 0.18);
});

test('an elevation level of none produces no layers', () => {
  assert.deepEqual(
    material.effectStyles.find((style) => style.name === 'Elevation/level0').layers,
    [],
  );
});

test('oklch brand colors convert to sRGB', () => {
  const primary = variable(substrate, 'Color', 'color/primary');

  assert.match(primary.values.Light.hex, /^#[0-9a-f]{6}$/);
  assert.notEqual(primary.values.Light.hex, primary.values.Dark.hex);
});

test('substrate exposes the same rc contract surface as material', () => {
  const names = (document) =>
    new Set(
      document.collections
        .find((entry) => entry.name === 'RC Contract')
        .variables.map((entry) => entry.name),
    );
  const shared = [...names(substrate)].filter((name) => names(material).has(name));

  assert.ok(
    shared.length > 100,
    `expected a broad shared contract, found ${shared.length} shared tokens`,
  );
});

test('every alias points at a variable that exists and shares its type', () => {
  for (const document of [material, substrate]) {
    const index = new Map();

    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        index.set(`${collection.name}::${entry.name}`, entry);
      }
    }

    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        for (const value of Object.values(entry.values)) {
          if (!value || !value.alias) {
            continue;
          }

          const target = index.get(`${value.collection ?? collection.name}::${value.alias}`);

          assert.ok(target, `${entry.name} aliases missing ${value.alias}`);

          assert.equal(
            target.type,
            entry.type,
            `${entry.name} (${entry.type}) aliases ${value.alias} (${target.type})`,
          );
        }
      }
    }
  }
});

test('scopes match the variable type they are attached to', () => {
  const colorScopes = new Set(['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR']);

  for (const document of [material, substrate]) {
    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        for (const scope of entry.scopes) {
          const isColorScope = colorScopes.has(scope);

          assert.equal(
            isColorScope,
            entry.type === 'COLOR',
            `${entry.name} is ${entry.type} but scoped ${scope}`,
          );
        }
      }
    }
  }
});

test('variable names are unique within each collection', () => {
  for (const document of [material, substrate]) {
    for (const collection of document.collections) {
      const names = collection.variables.map((entry) => entry.name);

      assert.equal(
        new Set(names).size,
        names.length,
        `${collection.name} has duplicate variable names`,
      );
    }
  }
});

test('composite shorthands are reported rather than silently dropped', () => {
  const border = material.skipped.composite.find((entry) => entry.property === '--rc-border');

  assert.ok(border, '--rc-border is a shorthand and should be listed as composite');
});

test('unresolved values always record why they could not be resolved', () => {
  for (const document of [material, substrate]) {
    for (const entry of document.skipped.unresolved) {
      assert.ok(entry.reason, `${entry.property} is missing a reason`);
    }
  }
});
